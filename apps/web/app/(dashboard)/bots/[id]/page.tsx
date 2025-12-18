'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/layout/PageLoading';
import { Spinner } from '@/components/ui/Spinner';
import { Save, AlertCircle, Plus, Palette, Code as CodeIcon, History, Clock, Bot as BotIcon, MessageSquare, Zap, Database, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from 'sonner';
import { botsApi } from '@/lib/api/bots';
import axiosClient from '@/lib/axios-client';

import { cn } from '@/lib/utils';
import {
    BasicInfoSection,
    SystemPromptSection,
    AIConfigSection,
    AdvancedSettingsSection,
} from '@/components/bots/BotConfigSections';
import { BotKnowledgeBaseSection } from '@/components/bots/BotKnowledgeBaseSection';
import { WidgetAppearanceSettings } from '@/components/widget/WidgetAppearanceSettings';
import { WidgetDeploymentHistory } from '@/components/widget/WidgetDeploymentHistory';
import { WidgetEmbedCode } from '@/components/widget/WidgetEmbedCode';
import { WidgetVersionsList } from '@/components/widget/WidgetVersionsList';
import { useWidgetVersions, useWidgetDeployments } from '@/lib/hooks/use-widget-versions';

interface KnowledgeBaseSelectionSectionProps {
    botId: string;
    workspaceId?: string;
    onRefresh?: () => void;
}

function KnowledgeBaseSelectionSection({ botId, workspaceId, onRefresh }: KnowledgeBaseSelectionSectionProps) {
    const [linkedKnowledgeBases, setLinkedKnowledgeBases] = useState<any[]>([]);
    const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        loadData();
    }, [botId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load linked KBs
            console.log(`[KB Debug] Loading linked KBs for bot ${botId}`);
            const linkedResponse = await axiosClient.get(`/bots/${botId}/knowledge-bases`);
            console.log('[KB Debug] Linked response:', linkedResponse);
            const linkedData = Array.isArray(linkedResponse) ? linkedResponse : [];
            console.log('[KB Debug] Linked data:', linkedData);
            setLinkedKnowledgeBases(linkedData);

            // Load all available KBs for linking
            const kbUrl = workspaceId ? `/knowledge-bases?workspaceId=${workspaceId}` : '/knowledge-bases';
            console.log(`[KB Debug] Loading available KBs from: ${kbUrl}`);
            const availableResponse = await axiosClient.get(kbUrl);
            console.log('[KB Debug] Available response:', availableResponse);
            const availableData = Array.isArray(availableResponse) ? availableResponse : [];
            console.log('[KB Debug] Available data:', availableData);
            setAvailableKnowledgeBases(availableData);

        } catch (error) {
            console.error('Failed to load knowledge bases:', error);
            toast.error('Failed to load knowledge bases');
        } finally {
            setLoading(false);
        }
    };

    const getAvailableForLinking = () => {
        const linkedIds = new Set(linkedKnowledgeBases.map(l => l.knowledgeBaseId));
        return availableKnowledgeBases.filter(kb => !linkedIds.has(kb.id));
    };

    const handleToggleSelection = async (kbId: string, selected: boolean) => {
        try {
            setLinking(true);

            if (selected) {
                // Link knowledge base
                await axiosClient.post(`/bots/${botId}/knowledge-bases`, {
                    knowledgeBaseId: kbId,
                });
                toast.success('Knowledge base added successfully');
            } else {
                // Unlink knowledge base
                await axiosClient.delete(`/bots/${botId}/knowledge-bases/${kbId}`);
                toast.success('Knowledge base removed successfully');
            }

            await loadData();
            if (onRefresh) onRefresh();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Failed to ${selected ? 'add' : 'remove'} knowledge base`);
        } finally {
            setLinking(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        <CardTitle>Knowledge Base Selection</CardTitle>
                    </div>
                    <CardDescription>
                        Choose knowledge bases for your bot to learn from
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading knowledge bases...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const availableForLinking = getAvailableForLinking();
    const linkedIds = new Set(linkedKnowledgeBases.map(l => l.knowledgeBaseId));
    const allKnowledgeBases = [...linkedKnowledgeBases.map(l => ({ ...l.knowledgeBase, isLinked: true, kbLinkId: l.id })),
                               ...availableForLinking.map(kb => ({ ...kb, isLinked: false }))];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            <CardTitle>Knowledge Base Selection</CardTitle>
                        </div>
                        <CardDescription>
                            Choose knowledge bases for your bot to learn from during conversations
                        </CardDescription>
                    </div>
                    <Badge variant="secondary">
                        {linkedKnowledgeBases.length} selected
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {allKnowledgeBases.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                        <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="text-lg font-medium mb-2">No Knowledge Bases Available</h4>
                        <p className="text-muted-foreground text-sm">
                            Create knowledge bases first to enable RAG capabilities for your bot.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {allKnowledgeBases.map((kb) => (
                            <div key={kb.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id={`kb-${kb.id}`}
                                    checked={kb.isLinked || false}
                                    onChange={(e) => handleToggleSelection(kb.id, e.target.checked)}
                                    disabled={linking}
                                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label htmlFor={`kb-${kb.id}`} className="flex-1 cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                                            <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm">{kb.name}</h4>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {kb.description || 'No description available'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>{kb.totalDocuments || 0} documents</span>
                                                <span>•</span>
                                                <span>{kb.embeddingModel?.replace('text-embedding-', '') || 'Unknown model'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                                {kb.isLinked && (
                                    <Badge variant="default" className="bg-green-500">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Linked
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {linkedKnowledgeBases.length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {linkedKnowledgeBases.length} knowledge base{linkedKnowledgeBases.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Your bot will use these knowledge bases to provide more accurate and contextual responses.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function BotDetailPage() {
    const params = useParams();
    const botId = params.id as string;

    // Validate botId
    if (!botId || botId === 'undefined' || botId === 'null') {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                    <p className="text-muted-foreground">Invalid bot ID</p>
                </div>
            </div>
        );
    }

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [bot, setBot] = useState<any>(null);
    const [botSettings, setBotSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('general');

    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(botId);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(botId);

    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        aiProviderId: undefined as string | undefined,
        aiModelName: '',
        aiParameters: {
            temperature: 0.7,
            max_tokens: 1000,
        },
        enableAutoLearn: false,
    });

    const tabs = [
        { id: 'general', label: 'General', icon: BotIcon },
        { id: 'prompt', label: 'System Prompt', icon: MessageSquare },
        { id: 'ai-config', label: 'AI Config', icon: Zap },
        { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
        { id: 'widget', label: 'Widget', icon: Palette },
    ];

    useEffect(() => {
        loadBot();
        loadAppearanceSettings();
    }, [botId]);

    const loadBot = async () => {
        try {
            setLoading(true);
            const data = await botsApi.getOne(botId);
            setBot(data);
            setFormData({
                name: data.name,
                description: data.description || '',
                systemPrompt: data.systemPrompt || '',
                aiProviderId: data.aiProviderId || undefined,
                aiModelName: data.aiModelName || '',
                aiParameters: (data.aiParameters as { temperature: number; max_tokens: number }) || { temperature: 0.7, max_tokens: 1000 },
                enableAutoLearn: data.enableAutoLearn || false,
            });
        } catch {
            toast.error('Failed to load bot');
        } finally {
            setLoading(false);
        }
    };

    const loadAppearanceSettings = async () => {
        try {
            const response = await axiosClient.get(`/bots/${botId}/widget/appearance`);
            setBotSettings(response);
        } catch {
        }
    };

    const handleChange = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Bot name is required');
            return;
        }

        try {
            setSaving(true);
            // Clean up undefined/null values before sending
            const cleanData: any = {};
            Object.keys(formData).forEach(key => {
                const value = (formData as any)[key];
                // Only include defined values that are not empty strings
                if (value !== undefined && value !== null && value !== '') {
                    cleanData[key] = value;
                }
            });

            console.log('[Bot Save] Sending data:', cleanData);
            await botsApi.update(botId, cleanData);
            toast.success('Bot updated successfully');
            setHasChanges(false);
            loadBot();
        } catch {
            toast.error('Failed to save bot');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (active: boolean) => {
        try {
            await botsApi.update(botId, { isActive: active });
            toast.success(active ? 'Bot is now public' : 'Bot is now private');
            loadBot();
        } catch {
            toast.error('Failed to update bot status');
        }
    };

    const handleSaveAppearance = async (settings: any) => {
        await axiosClient.patch(`/bots/${botId}/widget/appearance`, {
            primaryColor: settings.primaryColor,
            backgroundColor: settings.backgroundColor,
            botMessageColor: settings.botMessageColor,
            botMessageTextColor: settings.botMessageTextColor,
            fontFamily: settings.fontFamily,
            position: settings.widgetPosition,
            buttonSize: settings.widgetButtonSize,
            welcomeMessage: settings.welcomeMessage,
            placeholderText: settings.placeholderText,
            showAvatar: settings.showAvatar,
            showTimestamp: settings.showTimestamp,
        });
        await loadAppearanceSettings();
    };

    if (loading) {
        return <PageLoading message="Loading bot configuration..." />;
    }

    if (!bot) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Bot not found</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{bot.name}</h1>
                            <p className="text-muted-foreground">
                                Configure your bot settings and preferences
                            </p>
                        </div>
                        {(activeTab === 'general' || activeTab === 'prompt' || activeTab === 'ai-config' || activeTab === 'knowledge-base') && (
                            <Button onClick={handleSave} disabled={saving || !hasChanges} size="lg">
                                {saving ? (
                                    <>
                                        <Spinner className="size-4 mr-2" />
                                        Saving...
                                    </>

                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Unsaved Changes Warning */}
                    {hasChanges && (activeTab === 'general' || activeTab === 'prompt' || activeTab === 'ai-config' || activeTab === 'knowledge-base') && (
                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                <AlertCircle className="w-4 h-4" />
                                <p className="text-sm font-medium">
                                    You have unsaved changes. Don't forget to save!
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                                activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-8">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <BasicInfoSection data={formData} onChange={handleChange} />
                                <AdvancedSettingsSection
                                    enableAutoLearn={formData.enableAutoLearn}
                                    isActive={bot.isActive || false}
                                    botId={botId}
                                    onToggleAutoLearn={(enabled) => handleChange({ enableAutoLearn: enabled })}
                                    onToggleActive={handleToggleActive}
                                />
                            </div>
                        </div>
                    )}

                    {/* System Prompt Tab */}
                    {activeTab === 'prompt' && (
                        <SystemPromptSection
                            systemPrompt={formData.systemPrompt}
                            onChange={(systemPrompt) => handleChange({ systemPrompt })}
                            aiConfig={{
                                providerId: formData.aiProviderId,
                                modelName: formData.aiModelName,
                                parameters: formData.aiParameters
                            }}
                        />
                    )}

                    {/* AI Config Tab */}
                    {activeTab === 'ai-config' && (
                        <AIConfigSection data={formData} onChange={handleChange} />
                    )}

                    {/* Knowledge Base Tab */}
                    {activeTab === 'knowledge-base' && (
                        <KnowledgeBaseSelectionSection
                            botId={botId}
                            workspaceId={bot?.workspaceId}
                            onRefresh={() => loadBot()}
                        />
                    )}

                    {/* Widget Tab - Clean & Simple */}
                    {activeTab === 'widget' && (
                        <div className="space-y-8">
                            {/* Appearance Settings */}
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-6 h-6 text-primary" />
                                    Appearance
                                </h2>
                                <p className="text-muted-foreground mb-6">Customize the visual appearance and messaging of your chat widget</p>

                                {!botSettings ? (
                                    <PageLoading message="Loading appearance settings..." minHeight="min-h-[200px]" />
                                ) : (
                                    <WidgetAppearanceSettings
                                        botId={botId}
                                        currentSettings={{
                                            primaryColor: botSettings.primaryColor,
                                            backgroundColor: botSettings.backgroundColor,
                                            botMessageColor: botSettings.botMessageColor,
                                            botMessageTextColor: botSettings.botMessageTextColor,
                                            fontFamily: botSettings.fontFamily,
                                            widgetPosition: botSettings.widgetPosition,
                                            widgetButtonSize: botSettings.widgetButtonSize,
                                            welcomeMessage: botSettings.welcomeMessage,
                                            placeholderText: botSettings.placeholderText,
                                            showAvatar: botSettings.showAvatar,
                                            showTimestamp: botSettings.showTimestamp,
                                        }}
                                        onSave={handleSaveAppearance}
                                    />
                                )}
                            </div>

                            {/* Row: Embed Code & Versions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Embed Code Section */}
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <CodeIcon className="w-5 h-5 text-primary" />
                                        Embed Code
                                    </h3>
                                    <p className="text-muted-foreground mb-4">Copy this code to install your widget on any website</p>
                                    <WidgetEmbedCode botId={botId} activeVersion={activeVersion} />
                                </div>

                                {/* Versions & Deployments Section */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <History className="w-5 h-5 text-primary" />
                                            Versions
                                        </h3>
                                        <WidgetVersionsList botId={botId} versions={versions || []} isLoading={versionsLoading} onRefresh={mutateVersions} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            Deployments
                                        </h3>
                                        <WidgetDeploymentHistory deployments={deployments || []} isLoading={deploymentsLoading} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
