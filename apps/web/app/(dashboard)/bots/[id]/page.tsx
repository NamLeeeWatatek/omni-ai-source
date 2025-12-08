'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Save, AlertCircle, Plus, Code, Palette, History, Clock, Bot as BotIcon, MessageSquare, Zap, Settings as SettingsIcon, Plug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { botsApi } from '@/lib/api/bots';
import axiosClient from '@/lib/axios-client';
import type { BotFunction } from '@/lib/types/bots';
import { cn } from '@/lib/utils';
import {
    BasicInfoSection,
    SystemPromptSection,
    AIConfigSection,
    AdvancedSettingsSection,
} from '@/components/bots/bot-config-sections';
import { BotFunctionsSection } from '@/components/bots/bot-functions-section';
import { BotChannelsSection } from '@/components/bots/bot-channels-section';
import { BotFunctionModal } from '@/components/features/bots/bot-function-modal';
import { WidgetVersionsList } from '@/components/widget/widget-versions-list';
import { WidgetDeploymentHistory } from '@/components/widget/widget-deployment-history';
import { WidgetEmbedCode } from '@/components/widget/widget-embed-code';
import { WidgetAppearanceSettings } from '@/components/widget/widget-appearance-settings';
import { CreateVersionDialog } from '@/components/widget/create-version-dialog';
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
    const [botFunctions, setBotFunctions] = useState<BotFunction[]>([]);
    const [botChannels, setBotChannels] = useState<any[]>([]);
    const [showFunctionModal, setShowFunctionModal] = useState(false);
    const [editingFunction, setEditingFunction] = useState<BotFunction | null>(null);
    const [showCreateVersionDialog, setShowCreateVersionDialog] = useState(false);
    const [botSettings, setBotSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('general');
    const [widgetSubTab, setWidgetSubTab] = useState('appearance');

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
        { id: 'functions', label: 'Functions', icon: SettingsIcon },
        { id: 'channels', label: 'Channels', icon: Plug },
        { id: 'widget', label: 'Widget', icon: Palette },
    ];

    const widgetSubTabs = [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'embed', label: 'Embed Code', icon: Code },
        { id: 'versions', label: 'Versions', icon: History },
        { id: 'deployments', label: 'Deployments', icon: Clock },
    ];

    useEffect(() => {
        loadBot();
        loadBotFunctions();
        loadBotChannels();
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

    const loadBotFunctions = async () => {
        try {
            const response = await axiosClient.get(`/bots/${botId}/functions`);
            const data = response.data || response;
            setBotFunctions(Array.isArray(data) ? data : []);
        } catch {
        }
    };

    const loadBotChannels = async () => {
        try {
            const data = await botsApi.getChannels(botId);
            setBotChannels(Array.isArray(data) ? data : []);
        } catch {
        }
    };

    const loadAppearanceSettings = async () => {
        try {
            const response = await axiosClient.get(`/bots/${botId}/widget/appearance`);
            setBotSettings(response.data);
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
        mutateVersions();
    };

    const openFunctionModal = (func?: BotFunction) => {
        setEditingFunction(func || null);
        setShowFunctionModal(true);
    };

    const closeFunctionModal = () => {
        setShowFunctionModal(false);
        setEditingFunction(null);
    };

    const deleteFunction = async (functionId: string) => {
        if (!confirm('Are you sure you want to delete this function?')) return;

        try {
            await axiosClient.delete(`/bots/functions/${functionId}`);
            toast.success('Function deleted');
            loadBotFunctions();
        } catch {
            toast.error('Failed to delete function');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner className="size-8 text-primary" />
            </div>
        );
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
                        />
                    )}

                    {/* AI Config Tab */}
                    {activeTab === 'ai-config' && (
                        <AIConfigSection data={formData} onChange={handleChange} />
                    )}

                    {/* Functions Tab */}
                    {activeTab === 'functions' && (
                        <BotFunctionsSection
                            botFunctions={botFunctions}
                            onAdd={() => openFunctionModal()}
                            onEdit={(func) => openFunctionModal(func)}
                            onDelete={deleteFunction}
                        />
                    )}

                    {/* Channels Tab */}
                    {activeTab === 'channels' && (
                        <BotChannelsSection
                            botId={botId}
                            botChannels={botChannels}
                            onRefresh={loadBotChannels}
                        />
                    )}

                    {/* Widget Tab */}
                    {activeTab === 'widget' && (
                        <div className="space-y-6">
                            {/* Widget Sub-Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {widgetSubTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setWidgetSubTab(tab.id)}
                                        className={cn(
                                            'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
                                            widgetSubTab === tab.id
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Widget Sub-Tab Content */}
                            {widgetSubTab === 'appearance' && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Palette className="w-5 h-5 text-primary" />
                                            <CardTitle>Appearance Settings</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Customize colors, fonts, and visual elements of your widget
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {!botSettings ? (
                                            <div className="flex items-center justify-center p-8">
                                                <div className="text-center">
                                                    <Spinner className="w-8 h-8 mx-auto mb-4" />
                                                    <p className="text-sm text-muted-foreground">Loading appearance settings...</p>
                                                </div>
                                            </div>
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
                                    </CardContent>
                                </Card>
                            )}

                            {widgetSubTab === 'embed' && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Code className="w-5 h-5 text-primary" />
                                            <CardTitle>Embed Code</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Copy and paste this code into your website to embed the widget
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <WidgetEmbedCode
                                            botId={botId}
                                            activeVersion={activeVersion}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {widgetSubTab === 'versions' && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <History className="w-5 h-5 text-primary" />
                                                    <CardTitle>Version Management</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Manage different versions of your widget configuration
                                                </CardDescription>
                                            </div>
                                            <Button onClick={() => setShowCreateVersionDialog(true)}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Version
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <WidgetVersionsList
                                            botId={botId}
                                            versions={versions}
                                            isLoading={versionsLoading}
                                            onRefresh={mutateVersions}
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {widgetSubTab === 'deployments' && (
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <CardTitle>Deployment History</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Track all widget deployments and changes over time
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <WidgetDeploymentHistory
                                            deployments={deployments}
                                            isLoading={deploymentsLoading}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Function Modal */}
            <BotFunctionModal
                open={showFunctionModal}
                onClose={closeFunctionModal}
                botId={botId}
                botFunction={editingFunction as any}
                onSuccess={() => {
                    closeFunctionModal();
                    loadBotFunctions();
                }}
            />

            {/* Create Version Dialog */}
            <CreateVersionDialog
                botId={botId}
                open={showCreateVersionDialog}
                onOpenChange={setShowCreateVersionDialog}
                onSuccess={() => {
                    mutateVersions();
                    setShowCreateVersionDialog(false);
                }}
            />
        </div>
    );
}
