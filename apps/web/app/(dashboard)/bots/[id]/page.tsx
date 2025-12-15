'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/layout/PageLoading';
import { Spinner } from '@/components/ui/Spinner';
import { Save, AlertCircle, Plus, Palette, Code as CodeIcon, History, Clock, Bot as BotIcon, MessageSquare, Zap, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
                        {(activeTab === 'general' || activeTab === 'prompt' || activeTab === 'ai-config') && (
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
                    {hasChanges && (activeTab === 'general' || activeTab === 'prompt' || activeTab === 'ai-config') && (
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
                        <BotKnowledgeBaseSection botId={botId} workspaceId={bot?.workspaceId} />
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
