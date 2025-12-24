'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { creationToolsApi, CreationTool, FormField } from '@/lib/api/creation-tools';
import { templatesApi } from '@/lib/api/templates';
import { getChannels } from '@/lib/api/channels';
import { Template } from '@/lib/types/template';
import { Channel } from '@/lib/types/channel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Slider } from '@/components/ui/Slider';
import { Checkbox } from '@/components/ui/Checkbox';
import { Loader2, ArrowLeft, Sparkles, Check, Plus, Filter, LayoutGrid, Settings, Facebook, Instagram, Share2, Globe } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Progress } from '@/components/ui/Progress';
import { wsService } from '@/lib/services/websocket-service';
import { useSession } from 'next-auth/react';

import { ActiveJobsWidget } from '@/components/features/creation-tools/ActiveJobsWidget';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';

import { useCreationJobs } from '@/components/providers/CreationJobsProvider';

export default function CreationToolDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { addJob } = useCreationJobs(); // Use global context
    const [tool, setTool] = useState<CreationTool | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        if (params.slug) {
            loadTool(params.slug as string);
        }
    }, [params.slug]);

    const loadTool = async (slug: string) => {
        try {
            const toolData = await creationToolsApi.getBySlug(slug);
            setTool(toolData);

            const defaults: Record<string, any> = {};
            let requiresChannels = false;

            toolData.formConfig.fields.forEach((field) => {
                if (field.defaultValue !== undefined) {
                    defaults[field.name] = field.defaultValue;
                }
                if (field.type === 'channel-selector' || field.name === 'platforms') {
                    requiresChannels = true;
                }
            });
            setFormData(defaults);

            const templatesData = await templatesApi.findByCreationTool(toolData.id);
            setTemplates(templatesData);

            if (requiresChannels) {
                try {
                    const channelsData = await getChannels();
                    setChannels(channelsData);
                } catch (err) {
                    console.error("Failed to load channels", err);
                }
            }

        } catch (error) {
            console.error('Failed to load tool:', error);
            toast({
                title: 'Error',
                description: 'Failed to load creation tool',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        if (template.prefilledData) {
            setFormData({ ...formData, ...template.prefilledData });
        }
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData({ ...formData, [fieldName]: value });
    };

    const handleChannelToggle = (fieldName: string, channelType: string) => {
        const current = (formData[fieldName] as string[]) || []; // Expecting array of strings (channel types)

        // n8n payload expects ["facebook", "instagram"]

        const isSelected = current.includes(channelType);
        if (isSelected) {
            handleFieldChange(fieldName, current.filter(c => c !== channelType));
        } else {
            handleFieldChange(fieldName, [...current, channelType]);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tool) return;
        setSubmitting(true);

        try {
            const inputData = { ...formData, templateId: selectedTemplate?.id };

            const job = await creationJobsApi.create({
                creationToolId: tool.id,
                inputData,
            });

            // Add to active jobs list immediately via global context
            const newJob: CreationJob = {
                id: job.id,
                status: CreationJobStatus.PENDING,
                progress: 0,
                creationToolId: tool.id,
                inputData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            addJob(newJob);

            toast({
                title: 'Job Started',
                description: 'Your creation job is running in the background.',
            });
        } catch (error) {
            console.error('Job submission error:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit creation job',
                variant: 'destructive',
            });
        } finally {
            // Unlock immediately
            setSubmitting(false);
        }
    };

    const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category || 'other')))];

    const filteredTemplates = templates.filter((t) =>
        selectedCategory === 'all' ? true : (t.category || 'other') === selectedCategory
    );

    const shouldShowField = (field: FormField): boolean => {
        if (!field.showIf) return true;
        const targetValue = formData[field.showIf.field];
        switch (field.showIf.operator) {
            case 'equals':
                return targetValue === field.showIf.value;
            case 'not-equals':
                return targetValue !== field.showIf.value;
            case 'contains':
                return String(targetValue).includes(field.showIf.value);
            default:
                return true;
        }
    };

    const getPlatformIcon = (type: string) => {
        switch (type) {
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
            case 'telegram': return <Share2 className="w-4 h-4 text-sky-500" />; // Lucide doesn't have Telegram, using generic share
            default: return <Globe className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const renderFormField = (field: FormField) => {
        if (!shouldShowField(field)) return null;

        const value = formData[field.name];

        switch (field.type) {
            case 'text':
            case 'number':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm font-medium">
                            {field.label}
                            {field.validation?.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={value || ''}
                            onChange={(e) =>
                                handleFieldChange(
                                    field.name,
                                    field.type === 'number' ? Number(e.target.value) : e.target.value,
                                )
                            }
                            required={field.validation?.required}
                            min={field.validation?.min}
                            max={field.validation?.max}
                            className="bg-background"
                        />
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm font-medium">
                            {field.label}
                            {field.validation?.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                        <Textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            value={value || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={field.validation?.required}
                            rows={5}
                            className="resize-none bg-background font-mono text-sm"
                        />
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm font-medium">
                            {field.label}
                            {field.validation?.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder={field.placeholder || 'Select...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'channel-selector':
                const activeChannels = channels.filter(c => c.status === 'active' || c.status === 'connected');

                return (
                    <div key={field.name} className="space-y-3 p-4 rounded-lg border bg-background/50">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm font-medium">{field.label}</Label>
                            {field.description && (
                                <p className="text-xs text-muted-foreground">{field.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Show available ACTIVE channels */}
                            {activeChannels.length > 0 ? (
                                activeChannels.map(channel => {
                                    const isSelected = (value as string[])?.includes(channel.type);
                                    return (
                                        <div
                                            key={channel.id}
                                            onClick={() => handleChannelToggle(field.name, channel.type)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-primary/50",
                                                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0",
                                                isSelected ? "bg-primary border-primary" : "bg-muted border-muted-foreground/20"
                                            )}>
                                                {isSelected ? (
                                                    <Check className="w-4 h-4 text-primary-foreground" />
                                                ) : (
                                                    getPlatformIcon(channel.type)
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium truncate">{channel.name || channel.type}</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Connected" />
                                                </div>
                                                <span className="text-xs text-muted-foreground capitalize">{channel.type}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="col-span-2 py-6 flex flex-col items-center justify-center text-center gap-2 border border-dashed rounded-lg bg-muted/20">
                                    <span className="text-sm text-muted-foreground">No active channels found.</span>
                                    <Button variant="outline" size="sm" onClick={() => window.open('/channels', '_blank')}>
                                        Connect Channels
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'radio':
            case 'slider':
            case 'checkbox':
                // Keeping these consistent with previous implementation but styled minimally
                return (
                    <div key={field.name} className="space-y-3 p-3 rounded-lg border bg-background/50">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        {field.type === 'radio' && (
                            <RadioGroup
                                value={value}
                                onValueChange={(val) => handleFieldChange(field.name, val)}
                                className="flex flex-wrap gap-4"
                            >
                                {field.options?.map((opt) => (
                                    <div key={opt.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} />
                                        <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                        {field.type === 'slider' && (
                            <div className="pt-2">
                                <div className="flex justify-between mb-2 text-xs text-muted-foreground">
                                    <span>{field.validation?.min || 0}</span>
                                    <span className="font-medium text-foreground">{value || field.defaultValue}</span>
                                    <span>{field.validation?.max || 100}</span>
                                </div>
                                <Slider
                                    value={[value || field.defaultValue || 0]}
                                    onValueChange={(vals) => handleFieldChange(field.name, vals[0])}
                                    min={field.validation?.min || 0}
                                    max={field.validation?.max || 100}
                                    step={1}
                                />
                            </div>
                        )}
                        {field.type === 'checkbox' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id={field.name}
                                    checked={value || false}
                                    onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                />
                                <Label htmlFor={field.name} className="font-normal">{field.label}</Label>
                            </div>
                        )}
                    </div>
                );

            case 'file':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label className="text-sm font-medium">{field.label}</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-accent/50 transition-colors bg-background">
                            <input
                                type="file"
                                className="hidden"
                                id={field.name}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFieldChange(field.name, file);
                                }}
                            />
                            <Label htmlFor={field.name} className="cursor-pointer w-full h-full flex flex-col items-center">
                                {value ? (
                                    <>
                                        <Check className="w-8 h-8 text-primary mb-2" />
                                        <span className="text-sm font-medium">{typeof value === 'object' && value.name ? value.name : 'File selected'}</span>
                                        <span className="text-xs text-muted-foreground mt-1">Click to replace</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Upload file</span>
                                    </>
                                )}
                            </Label>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tool) return null;

    return (
        <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
            <div className="flex-1 overflow-hidden p-0 sm:p-2 lg:p-4">
                <div className="h-full w-full">
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4">

                        {/* LEFT: Templates Area (7 cols ~ 58%) */}
                        <Card variant="glass" rounded="xl" className="lg:col-span-7 flex flex-col h-full overflow-hidden border-border/40">
                            <div className="px-6 py-5 border-b flex-none flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        rounded="full"
                                        onClick={() => router.back()}
                                        className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm shrink-0"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="min-w-0">
                                        <h1 className="text-xl font-bold tracking-tight truncate">{tool.name}</h1>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                                    </div>
                                </div>

                                {/* Compact Category Filters */}
                                <div className="hidden sm:flex flex-wrap gap-1.5">
                                    {categories.slice(0, 3).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border",
                                                selectedCategory === cat
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-accent border-border text-muted-foreground"
                                            )}
                                        >
                                            {cat.replace('-', ' ')}
                                        </button>
                                    ))}
                                    {categories.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] px-2">+{categories.length - 3}</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Full Categories View for mobile or overflow */}
                            <div className="px-6 py-2 border-b bg-muted/5 flex sm:hidden">
                                <ScrollArea className="w-full">
                                    <div className="flex gap-2 pb-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] uppercase font-bold whitespace-nowrap border",
                                                    selectedCategory === cat
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-border text-muted-foreground"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                                    {filteredTemplates.map((template) => (
                                        <div
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            className={cn(
                                                "group relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-500 ease-out",
                                                selectedTemplate?.id === template.id
                                                    ? "border-primary ring-4 ring-primary/10 shadow-2xl scale-[0.98]"
                                                    : "border-transparent bg-muted/20 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]"
                                            )}
                                        >
                                            {/* Thumbnail */}
                                            <div className="absolute inset-0 bg-secondary/10">
                                                {template.thumbnailUrl ? (
                                                    <img
                                                        src={template.thumbnailUrl}
                                                        alt={template.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted/10 group-hover:bg-muted/20 transition-colors">
                                                        <Sparkles className="w-12 h-12 text-muted-foreground/20 group-hover:text-primary/40 transition-colors duration-500" />
                                                    </div>
                                                )}
                                                {/* Glass overlay on non-hover to brighten, fades out on hover */}
                                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            </div>

                                            {/* Labels overlay - Smoother gradient */}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-5 px-5 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity">
                                                <h3 className="text-white font-bold text-lg leading-tight tracking-tight drop-shadow-sm group-hover:text-primary-foreground transition-colors">
                                                    {template.name}
                                                </h3>
                                                {template.category && (
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 h-auto">
                                                            {template.category}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Active Checkmark - enhanced animation */}
                                            {selectedTemplate?.id === template.id && (
                                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 animate-in zoom-in spin-in-90 duration-300 z-10">
                                                    <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
                                                </div>
                                            )}

                                            {/* Hover indicator for non-selected items */}
                                            {selectedTemplate?.id !== template.id && (
                                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                    <div className="w-4 h-4 rounded-full border-2 border-white/70" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* RIGHT: Form Area (5 cols ~ 42%) */}
                        <Card variant="premium" rounded="xl" className="lg:col-span-5 flex flex-col h-full overflow-hidden relative border-border/40 ring-1 ring-white/5 shadow-2xl">
                            <div className="p-5 border-b flex-none bg-muted/5 flex items-center justify-between">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary animate-pulse" />
                                    Configure
                                </h2>
                                {selectedTemplate && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                                        {selectedTemplate.name}
                                    </Badge>
                                )}
                            </div>

                            <ScrollArea className="flex-1 p-5">
                                <form id="creation-form" onSubmit={handleSubmit} className="space-y-6">
                                    {!selectedTemplate && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-foreground text-sm flex flex-col items-center justify-center text-center gap-3 py-12 animate-pulse">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <LayoutGrid className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold">Ready to create?</p>
                                                <p className="text-muted-foreground text-xs mt-1">Select a template from the gallery to begin</p>
                                            </div>
                                        </div>
                                    )}

                                    {tool.formConfig.fields.map((field) => (
                                        <div key={field.name} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {renderFormField(field)}
                                        </div>
                                    ))}
                                </form>
                            </ScrollArea>

                            <div className="p-5 border-t bg-muted/5 flex-none mt-auto space-y-4">
                                <Button
                                    type="submit"
                                    form="creation-form"
                                    size="xl"
                                    rounded="xl"
                                    disabled={submitting || !selectedTemplate}
                                    className={cn(
                                        "w-full font-black tracking-tight shadow-xl transition-all h-14",
                                        !selectedTemplate ? "opacity-50 grayscale" : "hover:translate-y-[-2px] hover:shadow-primary/20 hover:shadow-xl active:translate-y-[0px] bg-primary"
                                    )}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-3" />
                                            {tool.formConfig.submitLabel || 'Generate Now'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>
        </div>
    );
}
