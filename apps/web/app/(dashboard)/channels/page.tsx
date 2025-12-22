"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { axiosClient } from '@/lib/axios-client';
import toast from '@/lib/toast';
import { loadChannelsData, disconnectChannelAsync, deleteConfigAsync, createConfigAsync, updateConfigAsync, loadBotsForFacebook, connectFacebookPage } from '@/lib/store/slices/channelsSlice';
import {
    setConnecting,
    setFacebookPages,
    setFacebookTempToken,
    setConnectingPage,
    setSelectedBotId,
    setActiveTab,
    setDisconnectId,
    setDeleteConfigId,
    setAssignBotDialogOpen,
    setSelectedChannel,
    clearFacebookState
} from '@/lib/store/slices/channelsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { FiRefreshCw, FiX, FiFacebook } from 'react-icons/fi';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { AssignBotDialog } from '@/components/channels/AssignBotDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ConnectedChannelsTab, ChannelConfigurationsTab } from '@/components/features/channels';
import type { Channel, IntegrationConfig } from '@/lib/types/channel';

export default function ChannelsPageRefactored() {
    const { data: session } = useSession();
    const { currentWorkspace } = useWorkspace();
    const dispatch = useAppDispatch();

    const {
        channels,
        configs,
        isLoading,
        facebookPages,
        facebookTempToken,
        connectingPage,
        bots,
        selectedBotId,
        loadingBots,
        activeTab,
        disconnectId,
        deleteConfigId,
        assignBotDialogOpen,
        selectedChannel
    } = useAppSelector(state => state.channels);

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        dispatch(loadChannelsData());
    }, [dispatch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    const loadData = () => {
        dispatch(loadChannelsData());
    };

    const handleConnect = async (provider: string, configId?: number) => {
        dispatch(setConnecting(provider));

        try {
            let oauthUrl: string;

            if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                const response = await axiosClient.get('/channels/facebook/oauth/url') as any;

                if (!response.url) {
                    toast.error('Please configure Facebook App settings first');
                    dispatch(setConnecting(null));
                    return;
                }

                oauthUrl = response.url;
            } else {
                const config = configId ? configs.find(c => c.id === configId) : configs.find(c => c.provider === provider);
                if (!config) {
                    toast.error(`Please configure ${provider} settings first`);
                    dispatch(setConnecting(null));
                    return;
                }

                const response = await axiosClient.get(`/channels/oauth/${provider}/url`, { params: { configId } }) as any;
                oauthUrl = response.url;
            }

            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const popup = window.open(
                oauthUrl,
                `Connect ${provider}`,
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                toast.error('Popup blocked! Please allow popups for this site.');
                dispatch(setConnecting(null));
                return;
            }

            const messageHandler = (event: MessageEvent) => {
                if (event.data?.status === 'success') {
                    if ((provider === 'facebook' || provider === 'messenger' || provider === 'instagram') && event.data.pages) {
                        dispatch(setFacebookPages(event.data.pages));
                        dispatch(setFacebookTempToken(event.data.tempToken));
                        toast.success(`Found ${event.data.pages.length} Facebook page(s)`);

                        dispatch(loadBotsForFacebook(currentWorkspace!.id));
                        popup?.close();
                        window.removeEventListener('message', messageHandler);
                        dispatch(setConnecting(null));
                    } else {
                        toast.success(`Connected to ${event.data.channel || provider}`);
                        popup?.close();
                        window.removeEventListener('message', messageHandler);

                        setTimeout(async () => {
                            dispatch(loadChannelsData());
                            dispatch(setConnecting(null));
                        }, 1000);
                    }
                } else if (event.data?.status === 'error') {
                    toast.error(`Connection failed: ${event.data.message || event.data.channel || 'Unknown error'}`);

                    if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                        dispatch(clearFacebookState());
                    }

                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    dispatch(setConnecting(null));
                }
            };

            window.addEventListener('message', messageHandler);

            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed);
                    dispatch(setConnecting(null));
                    window.removeEventListener('message', messageHandler);
                }
            }, 1000);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to start connection: ${message}`);
            dispatch(setConnecting(null));
        }
    };

    const handleDisconnect = (id: number) => {
        dispatch(setDisconnectId(id));
    };

    const confirmDisconnect = () => {
        if (disconnectId) {
            dispatch(disconnectChannelAsync(disconnectId));
        }
    };

    const handleConnectFacebookPage = async (page: any) => {
        if (!selectedBotId) {
            toast.error('Please select a bot first');
            return;
        }

        if (!facebookTempToken) {
            toast.error('Session expired. Please reconnect Facebook again.');
            dispatch(setFacebookPages([]));
            return;
        }

        setConnectingPage(true);

        try {
            const response = await axiosClient.post('/channels/facebook/connect', {
                pageId: page.id,
                pageName: page.name,
                userAccessToken: facebookTempToken,
                category: page.category,
                botId: selectedBotId
            }).then(r => (r as any).data);

            const selectedBot = bots.find(b => b.id === selectedBotId);
            toast.success(`Connected ${page.name} to bot "${selectedBot?.name}"`);

            dispatch(setFacebookPages(facebookPages.filter(p => p.id !== page.id)));

            dispatch(loadChannelsData());
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to connect page';
            toast.error(errorMessage);

            if (errorMessage.includes('authorization') || errorMessage.includes('token')) {
                dispatch(clearFacebookState());
                toast.info('Please reconnect Facebook to continue');
            }
        } finally {
            setConnectingPage(false);
        }
    };

    const handleDeleteConfig = () => {
        if (deleteConfigId) {
            dispatch(deleteConfigAsync(deleteConfigId));
        }
    };

    const handleSaveConfig = async (config: any) => {
        try {
            if (config.id) {
                await dispatch(updateConfigAsync({ id: config.id, data: config }));
            } else {
                await dispatch(createConfigAsync(config));
            }
            toast.success('Configuration saved successfully!');
            dispatch(loadChannelsData());
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save configuration';
            toast.error(message);
        }
    };

    const handleAssignBot = (channel: any) => {
        setSelectedChannel(channel);
        setAssignBotDialogOpen(true);
    };

    return (
        <div className="h-full space-y-8">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Channels & Integrations</h1>
                    <p className="text-muted-foreground mt-1">Connect your communication channels to start automating</p>
                </div>
                <Button variant="outline" onClick={loadData} loading={isLoading} className="rounded-xl">
                    <FiRefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => dispatch(setActiveTab(value as 'connected' | 'configurations'))} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connected">Connections ({channels.length})</TabsTrigger>
                    <TabsTrigger value="configurations">Configurations ({configs.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="connected" className="mt-6">
                    <ConnectedChannelsTab
                        channels={channels.map(c => ({ ...c, createdAt: c.connected_at }))}
                        searchQuery={searchQuery}
                        viewMode={viewMode}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalCount={channels.length}
                        selectedIds={selectedIds}
                        onSearchChange={setSearchQuery}
                        onViewModeChange={setViewMode}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        onToggleSelection={(id) => {
                            setSelectedIds(prev =>
                                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                            );
                        }}
                        onClearSelection={() => setSelectedIds([])}
                        onAssignBot={handleAssignBot}
                        onDisconnect={handleDisconnect}
                        onLoadData={() => dispatch(setActiveTab('configurations'))}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="configurations" className="mt-6">
                    <ChannelConfigurationsTab
                        configs={configs.map(c => ({ ...c, name: c.name || '' }))}
                        isLoading={isLoading}
                        onSaveConfig={handleSaveConfig}
                        onDeleteConfig={(id) => dispatch(setDeleteConfigId(id))}
                        onConnect={handleConnect}
                    />
                </TabsContent>
            </Tabs>

            {facebookPages.length > 0 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Connect Facebook Pages</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Select a bot and choose which pages to connect
                                </p>
                            </div>
                            <button
                                onClick={() => dispatch(clearFacebookState())}
                                className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <AlertBanner variant="info" title="Select Bot" className="mb-6">
                            {loadingBots ? (
                                <div className="flex items-center gap-2">
                                    <Spinner className="w-4 h-4" />
                                    <span>Loading bots...</span>
                                </div>
                            ) : bots.length === 0 ? (
                                <div>
                                    <p className="mb-2">No bots found. Please create a bot first.</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open('/bots', '_blank')}
                                    >
                                        Create Bot
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={selectedBotId}
                                        onChange={(e) => setSelectedBotId(e.target.value)}
                                        className="w-full bg-input rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-ring mb-2"
                                    >
                                        {bots.map((bot) => (
                                            <option key={bot.id} value={bot.id} className="bg-card">
                                                {bot.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs">
                                        Messages from these pages will be handled by the selected bot
                                    </p>
                                </>
                            )}
                        </AlertBanner>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Available Pages ({facebookPages.length})</h4>
                            {facebookPages.map((page) => (
                                <div
                                    key={page.id}
                                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-primary/10">
                                            <FiFacebook className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{page.name}</h4>
                                            <p className="text-xs text-muted-foreground">{page.category}</p>
                                            {page.tasks && page.tasks.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {page.tasks.slice(0, 3).map((task: string) => (
                                                        <span key={task} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                                                            {task}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleConnectFacebookPage(page)}
                                        disabled={connectingPage || !selectedBotId || bots.length === 0}
                                    >
                                        {connectingPage ? 'Connecting...' : 'Connect'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <AlertDialogConfirm
                open={disconnectId !== null}
                onOpenChange={(open) => !open && setDisconnectId(null)}
                title="Disconnect Channel"
                description="Are you sure you want to disconnect this channel? This action cannot be undone."
                confirmText="Disconnect"
                cancelText="Cancel"
                onConfirm={confirmDisconnect}
                variant="destructive"
            />

            <AlertDialogConfirm
                open={deleteConfigId !== null}
                onOpenChange={(open) => !open && setDeleteConfigId(null)}
                title="Delete Configuration"
                description="Are you sure you want to delete this configuration? All connected channels using this config will be disconnected."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfig}
                variant="destructive"
            />

            {currentWorkspace && (
                <AssignBotDialog
                    open={assignBotDialogOpen}
                    onOpenChange={setAssignBotDialogOpen}
                    channel={selectedChannel}
                    workspaceId={currentWorkspace.id}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
}
