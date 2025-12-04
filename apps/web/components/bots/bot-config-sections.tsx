'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Settings, Zap, MessageSquare, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';

interface BotConfigData {
    name: string;
    description: string;
    systemPrompt: string;
    aiProviderId?: string;
    aiModelName: string;
    aiParameters: {
        temperature: number;
        max_tokens: number;
    };
    enableAutoLearn: boolean;
}

interface BasicInfoSectionProps {
    data: BotConfigData;
    onChange: (data: Partial<BotConfigData>) => void;
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>
                    Configure your bot's name and description
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="bot-name">Bot Name *</Label>
                    <Input
                        id="bot-name"
                        value={data.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        placeholder="Customer Support Bot"
                    />
                    <p className="text-xs text-muted-foreground">
                        This name will be displayed to users
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bot-description">Description</Label>
                    <Textarea
                        id="bot-description"
                        value={data.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder="A helpful bot that assists customers with their questions"
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                        Brief description of what your bot does
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

interface SystemPromptSectionProps {
    systemPrompt: string;
    onChange: (systemPrompt: string) => void;
}

export function SystemPromptSection({ systemPrompt, onChange }: SystemPromptSectionProps) {
    const [showExamples, setShowExamples] = useState(false);

    const examples = [
        {
            title: 'Customer Support',
            prompt: `You are a friendly and professional customer support assistant. Your role is to:
- Help customers with their questions and concerns
- Provide accurate information about products and services
- Escalate complex issues to human agents when needed
- Always maintain a polite and helpful tone

If you don't know the answer, say so honestly and offer to connect them with a human agent.`,
        },
        {
            title: 'Sales Assistant',
            prompt: `You are an enthusiastic sales assistant. Your goals are to:
- Understand customer needs and recommend suitable products
- Highlight key features and benefits
- Answer questions about pricing and availability
- Guide customers through the purchase process

Be helpful but not pushy. Focus on solving customer problems.`,
        },
        {
            title: 'Technical Support',
            prompt: `You are a technical support specialist. Your responsibilities include:
- Diagnosing technical issues
- Providing step-by-step troubleshooting guidance
- Explaining technical concepts in simple terms
- Documenting solutions for future reference

Always ask clarifying questions to understand the issue better.`,
        },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <CardTitle>System Prompt</CardTitle>
                        </div>
                        <CardDescription>
                            Define your bot's personality, behavior, and instructions
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExamples(!showExamples)}
                    >
                        {showExamples ? 'Hide' : 'Show'} Examples
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showExamples && (
                    <div className="grid gap-3 mb-4">
                        {examples.map((example) => (
                            <div
                                key={example.title}
                                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => onChange(example.prompt)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">{example.title}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                        Use Template
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {example.prompt}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-2">
                    <Textarea
                        value={systemPrompt}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="You are a helpful assistant that..."
                        rows={12}
                        className="font-mono text-sm"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{systemPrompt.length} characters</span>
                        <span>Recommended: 100-500 characters</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface AIConfigSectionProps {
    data: BotConfigData;
    onChange: (data: Partial<BotConfigData>) => void;
}

export function AIConfigSection({ data, onChange }: AIConfigSectionProps) {
    const [models, setModels] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadModels = async () => {
            try {
                const response = await fetch('/api/v1/ai-providers/models', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const data = await response.json();
                const allModels = data.flatMap((p: any) => p.models);
                setModels(allModels);
            } catch {
            } finally {
                setLoading(false);
            }
        };
        loadModels();
    }, []);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <CardTitle>AI Configuration</CardTitle>
                </div>
                <CardDescription>
                    Configure the AI model and parameters
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="ai-model">AI Model *</Label>
                    <Select
                        value={data.aiModelName}
                        onValueChange={(value) => onChange({ aiModelName: value })}
                        disabled={loading}
                    >
                        <SelectTrigger id="ai-model">
                            <SelectValue placeholder={loading ? "Loading models..." : "Select a model"} />
                        </SelectTrigger>
                        <SelectContent>
                            {models.map((model) => (
                                <SelectItem
                                    key={model.model_name}
                                    value={model.model_name}
                                    disabled={!model.is_available}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{model.display_name}</span>
                                        {model.is_recommended && (
                                            <Badge variant="secondary" className="text-xs">
                                                Recommended
                                            </Badge>
                                        )}
                                        {!model.is_available && (
                                            <Badge variant="outline" className="text-xs">
                                                Not Available
                                            </Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Choose the AI model that best fits your needs. Configure API keys in Settings.
                    </p>
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Model Parameters</h4>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="temperature">Temperature</Label>
                                <span className="text-sm font-mono text-muted-foreground">
                                    {data.aiParameters.temperature.toFixed(1)}
                                </span>
                            </div>
                            <Slider
                                id="temperature"
                                min={0}
                                max={2}
                                step={0.1}
                                value={[data.aiParameters.temperature]}
                                onValueChange={([value]) =>
                                    onChange({
                                        aiParameters: { ...data.aiParameters, temperature: value },
                                    })
                                }
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Precise (0.0)</span>
                                <span>Balanced (1.0)</span>
                                <span>Creative (2.0)</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Lower values make responses more focused and deterministic
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max-tokens">Max Response Length</Label>
                            <Input
                                id="max-tokens"
                                type="number"
                                min={100}
                                max={4000}
                                step={100}
                                value={data.aiParameters.max_tokens}
                                onChange={(e) =>
                                    onChange({
                                        aiParameters: {
                                            ...data.aiParameters,
                                            max_tokens: parseInt(e.target.value) || 1000,
                                        },
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum number of tokens in the response (1 token ≈ 4 characters)
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface AdvancedSettingsSectionProps {
    enableAutoLearn: boolean;
    isActive: boolean;
    botId: string;
    onToggleAutoLearn: (enabled: boolean) => void;
    onToggleActive: (active: boolean) => void;
}

export function AdvancedSettingsSection({
    enableAutoLearn,
    isActive,
    botId,
    onToggleAutoLearn,
    onToggleActive,
}: AdvancedSettingsSectionProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/bots/${botId}`;

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Link copied to clipboard!');
        } catch {
            toast.error('Failed to copy link');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <CardTitle>Advanced Settings</CardTitle>
                </div>
                <CardDescription>
                    Additional configuration options
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                        <Label htmlFor="auto-learn" className="cursor-pointer font-medium">
                            Auto-Learn from Conversations
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Bot learns and improves from user interactions
                        </p>
                    </div>
                    <Switch
                        id="auto-learn"
                        checked={enableAutoLearn}
                        onCheckedChange={onToggleAutoLearn}
                    />
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="is-active" className="cursor-pointer font-medium">
                                Public Access
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Make bot accessible via public link
                            </p>
                        </div>
                        <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={onToggleActive}
                        />
                    </div>

                    {isActive && (
                        <div className="mt-4 space-y-2">
                            <Label className="text-sm">Public Share Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={shareUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyShareLink}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
