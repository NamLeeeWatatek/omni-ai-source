'use client';

import { useState, useEffect } from 'react';
import { Plus, History, Code, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WidgetVersionsList } from '@/components/widget/widget-versions-list';
import { WidgetDeploymentHistory } from '@/components/widget/widget-deployment-history';
import { WidgetEmbedCode } from '@/components/widget/widget-embed-code';
import { WidgetAppearanceSettings } from '@/components/widget/widget-appearance-settings';
import { CreateVersionDialog } from '@/components/widget/create-version-dialog';
import { useWidgetVersions, useWidgetDeployments } from '@/lib/hooks/use-widget-versions';
import axiosClient from '@/lib/axios-client';

export default function WidgetPage({ params }: { params: { id: string } }) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [botSettings, setBotSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('appearance');

    const { versions, isLoading: versionsLoading, mutate: mutateVersions } = useWidgetVersions(params.id);
    const { deployments, isLoading: deploymentsLoading } = useWidgetDeployments(params.id);

    const activeVersion = versions?.find(v => v.isActive && v.status === 'published');

    useEffect(() => {
        if (activeTab === 'appearance') {
            loadAppearanceSettings();
        }
    }, [params.id, activeTab]);

    const loadAppearanceSettings = async () => {
        try {
            const response = await axiosClient.get(`/bots/${params.id}/widget/appearance`);
            setBotSettings(response.data);
        } catch {
        }
    };

    const handleSaveAppearance = async (settings: any) => {
        await axiosClient.patch(`/bots/${params.id}/widget/appearance`, {
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

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Widget Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage widget versions and deployments
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Version
                </Button>
            </div>

            {}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="appearance">
                        <Palette className="w-4 h-4 mr-2" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="embed">
                        <Code className="w-4 h-4 mr-2" />
                        Embed Code
                    </TabsTrigger>
                    <TabsTrigger value="versions">Versions</TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="w-4 h-4 mr-2" />
                        Deployment History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4">
                    {activeVersion && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2 flex-wrap">
                                <span><strong>Active Version:</strong> {activeVersion.version}</span>
                                <span className="w-1 h-1 rounded-full bg-blue-900/50 dark:bg-blue-100/50" />
                                <span>Updating appearance will create a new version automatically.</span>
                            </p>
                        </div>
                    )}
                    {!botSettings ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <Spinner className="w-8 h-8 mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">Loading appearance settings...</p>
                            </div>
                        </div>
                    ) : (
                        <WidgetAppearanceSettings
                            botId={params.id}
                            currentSettings={{
                                primaryColor: botSettings.primaryColor,
                                backgroundColor: botSettings.backgroundColor,
                                botMessageColor: botSettings.botMessageColor,
                                botMessageTextColor: botSettings.botMessageTextColor,
                                fontFamily: botSettings.fontFamily,
                                widgetPosition: botSettings.position,
                                widgetButtonSize: botSettings.buttonSize,
                                welcomeMessage: botSettings.welcomeMessage,
                                placeholderText: botSettings.placeholderText,
                                showAvatar: botSettings.showAvatar,
                                showTimestamp: botSettings.showTimestamp,
                            }}
                            onSave={handleSaveAppearance}
                        />
                    )}
                </TabsContent>

                <TabsContent value="embed" className="space-y-4">
                    <WidgetEmbedCode
                        botId={params.id}
                        activeVersion={activeVersion}
                    />
                </TabsContent>

                <TabsContent value="versions" className="space-y-4">
                    <WidgetVersionsList
                        botId={params.id}
                        versions={versions}
                        isLoading={versionsLoading}
                        onRefresh={mutateVersions}
                    />
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <WidgetDeploymentHistory
                        deployments={deployments}
                        isLoading={deploymentsLoading}
                    />
                </TabsContent>
            </Tabs>

            {}
            <CreateVersionDialog
                botId={params.id}
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={() => {
                    mutateVersions();
                    setShowCreateDialog(false);
                }}
            />
        </div>
    );
}
