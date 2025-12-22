'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/PageLoading';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
    Save,
    AlertCircle,
    Bot as BotIcon,
    Palette,
    Code,
    History,
    Clock,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { botsApi } from '@/lib/api/bots';
import axiosClient from '@/lib/axios-client';

import {
    BotOverviewTab,
    BotAnalyticsTab
} from '@/components/features/bots/BotOverviewTab';
import {
    BotConfigurationTab,
    BotSystemPromptTab
} from '@/components/features/bots/BotConfigurationTab';
import { BotKnowledgeBaseSection } from '@/components/features/bots/BotKnowledgeBaseSection';
import { BotChannelsSection } from '@/components/features/bots/BotChannelsSection';
import { BotSettingsTab } from '@/components/features/bots/BotSettingsTab';
import { WidgetAppearanceSettings } from '@/components/widget/WidgetAppearanceSettings';
import { WidgetDeploymentHistory } from '@/components/widget/WidgetDeploymentHistory';
import { WidgetEmbedCode } from '@/components/widget/WidgetEmbedCode';
import { WidgetVersionsList } from '@/components/widget/WidgetVersionsList';
import { useWidgetVersions, useWidgetDeployments } from '@/lib/hooks/use-widget-versions';

export default function BotDetailPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;

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
    const [activeTab, setActiveTab] = useState('overview');

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
        isActive: false,
    });

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
                isActive: data.isActive || false,
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
            const cleanData: any = {};
            Object.keys(formData).forEach(key => {
                const value = (formData as any)[key];
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
        return <PageLoading message="Loading bot..." />;
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
        <div className="h-full p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <BotIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{bot.name}</h1>
                            <p className="text-muted-foreground">
                                Configure and manage your chatbot settings
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={bot.isActive ? "default" : "secondary"}>
                            {bot.isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                            {bot.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button onClick={handleSave} disabled={!hasChanges} loading={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>

                {hasChanges && (
                    <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                <AlertCircle className="w-4 h-4" />
                                <p className="text-sm font-medium">
                                    You have unsaved changes. Don't forget to save!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-7">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="configuration">Configuration</TabsTrigger>
                        <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
                        <TabsTrigger value="channels">Channels</TabsTrigger>
                        <TabsTrigger value="widget">Widget</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                        <BotOverviewTab bot={bot} />

                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest conversations and interactions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">New conversation started</p>
                                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Knowledge base updated</p>
                                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Widget deployed</p>
                                            <p className="text-xs text-muted-foreground">3 hours ago</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="configuration" className="mt-6">
                        <BotConfigurationTab formData={formData} onChange={handleChange} />
                        <BotSystemPromptTab systemPrompt={formData.systemPrompt} onChange={(systemPrompt) => handleChange({ systemPrompt })} />
                    </TabsContent>

                    <TabsContent value="knowledge-base" className="mt-6">
                        <BotKnowledgeBaseSection
                            botId={botId}
                            workspaceId={bot?.workspaceId}
                            onRefresh={loadBot}
                        />
                    </TabsContent>

                    <TabsContent value="channels" className="mt-6">
                        <BotChannelsSection
                            botId={botId}
                            botChannels={[]}
                            onRefresh={loadBot}
                        />
                    </TabsContent>

                    <TabsContent value="widget" className="mt-6">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Palette className="w-6 h-6 text-primary" />
                                    Appearance
                                </h2>
                                <p className="text-muted-foreground mb-6">Customize the visual appearance and messaging of your chat widget</p>

                                {!botSettings ? (
                                    <Card>
                                        <CardContent className="py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                                <p className="text-muted-foreground">Loading appearance settings...</p>
                                            </div>
                                        </CardContent>
                                    </Card>
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Code className="w-5 h-5 text-primary" />
                                        Embed Code
                                    </h3>
                                    <p className="text-muted-foreground mb-4">Copy this code to install your widget on any website</p>
                                    <WidgetEmbedCode botId={botId} activeVersion={activeVersion} />
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <History className="w-5 h-5 text-primary" />
                                            Versions
                                        </h3>
                                        <WidgetVersionsList botId={botId} versions={[]} isLoading={false} onRefresh={() => {}} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-primary" />
                                            Deployments
                                        </h3>
                                        <WidgetDeploymentHistory deployments={[]} isLoading={false} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-6">
                        <BotAnalyticsTab bot={bot} />
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        <BotSettingsTab
                            enableAutoLearn={formData.enableAutoLearn}
                            onChange={(enableAutoLearn) => handleChange({ enableAutoLearn })}
                            onDelete={() => {
                                console.log('Delete bot');
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
