'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { AlertBanner, CodeBlock } from '@/components/ui/alert-banner'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import { axiosClient } from '@/lib/axios-client'
import toast from '@/lib/toast'
import {
    FiFacebook,
    FiInstagram,
    FiMessageCircle,
    FiMail,
    FiTrash2,
    FiCheckCircle,
    FiRefreshCw,
    FiSettings,
    FiX,
    FiYoutube,
    FiTwitter,
    FiLinkedin,
    FiSlack,
    FiGlobe,
    FiPhone
} from 'react-icons/fi'
import { FaWhatsapp, FaTelegram, FaFacebookMessenger, FaTiktok, FaDiscord, FaShopify, FaGoogle, FaLine, FaViber, FaWeixin } from 'react-icons/fa'
import { SiZalo, SiNotion, SiAirtable, SiZapier, SiHubspot, SiSalesforce, SiMailchimp, SiIntercom } from 'react-icons/si'
import type { Channel, IntegrationConfig } from '@/lib/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function ChannelsPage() {
    const { data: session } = useSession()
    const { currentWorkspace } = useWorkspace()
    const [channels, setChannels] = useState<Channel[]>([])
    const [configs, setConfigs] = useState<IntegrationConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)

    const [facebookPages, setFacebookPages] = useState<any[]>([])
    const [facebookTempToken, setFacebookTempToken] = useState('')
    const [connectingPage, setConnectingPage] = useState(false)
    const [bots, setBots] = useState<any[]>([])
    const [selectedBotId, setSelectedBotId] = useState<string>('')
    const [loadingBots, setLoadingBots] = useState(false)

    const [configForm, setConfigForm] = useState({
        id: null as number | null,
        provider: '',
        name: '',
        client_id: '',
        client_secret: '',
        scopes: '',
        verify_token: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [channelsData, configsData] = await Promise.all([
                axiosClient.get('/channels').then(r => r.data),
                axiosClient.get('/integrations').then(r => r.data)
            ])
            setChannels(channelsData)
            setConfigs(configsData)

        } catch (error) {
            toast.error('Failed to load channels')
        } finally {
            setLoading(false)
        }
    }

    const loadBots = async () => {
        setLoadingBots(true)
        try {
            if (!currentWorkspace) {
                toast.error('No workspace selected. Please refresh the page.')
                return
            }

            const response = await (await axiosClient.get(`/bots?workspaceId=${currentWorkspace.id}`)).data

            let botsList = []
            if (Array.isArray(response)) {
                botsList = response
            } else if (response?.items && Array.isArray(response.items)) {
                botsList = response.items
            } else if (response?.data && Array.isArray(response.data)) {
                botsList = response.data
            }

            setBots(botsList)

            if (botsList.length > 0) {
                setSelectedBotId(botsList[0].id)
            } else {
            }
        } catch (error) {
            toast.error('Failed to load bots')
        } finally {
            setLoadingBots(false)
        }
    }

    const handleConnect = async (provider: string, configId?: number) => {
        try {
            setConnecting(provider)

            let oauthUrl: string

            if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                const response = await axiosClient.get('/channels/facebook/oauth/url').then(r => r.data)

                if (!response.url) {
                    toast.error('Please configure Facebook App settings first')
                    openConfig(undefined, 'facebook')
                    setConnecting(null)
                    return
                }

                oauthUrl = response.url
            } else {
                const config = configId ? configs.find(c => c.id === configId) : configs.find(c => c.provider === provider)
                if (!config) {
                    toast.error(`Please configure ${provider} settings first`)
                    openConfig(undefined, provider)
                    setConnecting(null)
                    return
                }

                const configParam = configId ? `?configId=${configId}` : ''
                const response = await (await axiosClient.get(`/oauth/login/${provider}${configParam}`)).data

                if (response.error || !response.url) {
                    toast.error(response.error || 'Failed to get OAuth URL')
                    setConnecting(null)
                    return
                }

                oauthUrl = response.url
            }

            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                oauthUrl,
                `Connect ${provider}`,
                `width=${width},height=${height},left=${left},top=${top}`
            )

            if (!popup) {
                toast.error('Popup blocked! Please allow popups for this site.')
                setConnecting(null)
                return
            }

            const messageHandler = (event: MessageEvent) => {
                if (event.data?.status === 'success') {
                    if ((provider === 'facebook' || provider === 'messenger' || provider === 'instagram') && event.data.pages) {
                        setFacebookPages(event.data.pages)
                        setFacebookTempToken(event.data.tempToken)
                        toast.success(`Found ${event.data.pages.length} Facebook page(s)`)

                        loadBots()
                        popup?.close()
                        window.removeEventListener('message', messageHandler)
                        setConnecting(null)
                    } else {
                        toast.success(`Connected to ${event.data.channel || provider}`)
                        popup?.close()
                        window.removeEventListener('message', messageHandler)

                        setTimeout(() => {
                            loadData()
                            setConnecting(null)
                        }, 1000)
                    }
                } else if (event.data?.status === 'error') {
                    toast.error(`Connection failed: ${event.data.message}`)
                    popup?.close()
                    window.removeEventListener('message', messageHandler)
                    setConnecting(null)
                }
            }

            window.addEventListener('message', messageHandler)

            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed)
                    setConnecting(null)
                    window.removeEventListener('message', messageHandler)
                }
            }, 1000)

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            toast.error(`Failed to start connection: ${message}`)
            setConnecting(null)
        }
    }

    const [disconnectId, setDisconnectId] = useState<number | null>(null)

    const handleDisconnect = async (id: number) => {
        setDisconnectId(id)
    }

    const confirmDisconnect = async () => {
        if (!disconnectId) return

        try {
            await await axiosClient.delete(`/channels/${disconnectId}`)
            toast.success('Channel disconnected')
            loadData()
        } catch {
            toast.error('Failed to disconnect')
        }
    }

    const openConfig = (configId?: number, provider?: string) => {
        const existing = configId ? configs.find(c => c.id === configId) : null
        setConfigForm({
            id: existing?.id || null,
            provider: existing?.provider || provider || '',
            name: existing?.name || '',
            client_id: existing?.client_id || '',
            client_secret: existing?.client_secret || '',
            scopes: existing?.scopes || '',
            verify_token: 'wataomi_verify_token'
        })
    }

    const saveConfig = async () => {
        if (!configForm.provider) {
            toast.error('Provider is required')
            return
        }

        if (!configForm.client_id || !configForm.client_secret) {
            toast.error('App ID and App Secret are required')
            return
        }

        try {
            if (configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') {
                await axiosClient.post('/channels/facebook/setup', {
                    appId: configForm.client_id,
                    appSecret: configForm.client_secret,
                    verifyToken: configForm.verify_token || 'wataomi_verify_token'
                }).then(r => r.data)
            } else {
                const url = configForm.id ? `/integrations/${configForm.id}` : '/integrations/'
                const data = {
                    provider: configForm.provider,
                    name: configForm.name,
                    clientId: configForm.client_id,
                    clientSecret: configForm.client_secret,
                    scopes: configForm.scopes,
                    isActive: true
                }

                if (configForm.id) {
                    await axiosClient.patch(url, data)
                } else {
                    await axiosClient.post(url, data)
                }
            }

            toast.success('Configuration saved successfully!')
            setConfigForm(prev => ({ ...prev, provider: '' }))
            loadData()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save configuration'
            toast.error(message)
        }
    }

    const handleConnectFacebookPage = async (page: any) => {
        if (!selectedBotId) {
            toast.error('Please select a bot first')
            return
        }

        setConnectingPage(true)

        try {
            await axiosClient.post('/channels/facebook/connect', {
                pageId: page.id,
                pageName: page.name,
                userAccessToken: facebookTempToken,
                category: page.category,
                botId: selectedBotId
            }).then(r => r.data)

            const selectedBot = bots.find(b => b.id === selectedBotId)
            toast.success(`Connected ${page.name} to bot "${selectedBot?.name}"`)

            setFacebookPages(prev => prev.filter(p => p.id !== page.id))

            await loadData()
        } catch (error: any) {
            toast.error(error.message || 'Failed to connect page')
        } finally {
            setConnectingPage(false)
        }
    }

    const [deleteConfigId, setDeleteConfigId] = useState<number | null>(null)

    const handleDeleteConfig = async () => {
        if (!deleteConfigId) return

        try {
            await await axiosClient.delete(`/integrations/${deleteConfigId}`)
            toast.success('Configuration deleted')
            loadData()
        } catch {
            toast.error('Failed to delete configuration')
        } finally {
            setDeleteConfigId(null)
        }
    }

    const getIcon = (type: string) => {
        const icons: Record<string, JSX.Element> = {
            'facebook': <FiFacebook className="w-6 h-6" />,
            'messenger': <FaFacebookMessenger className="w-6 h-6" />,
            'instagram': <FiInstagram className="w-6 h-6" />,
            'whatsapp': <FaWhatsapp className="w-6 h-6" />,
            'telegram': <FaTelegram className="w-6 h-6" />,
            'email': <FiMail className="w-6 h-6" />,
            'youtube': <FiYoutube className="w-6 h-6" />,
            'twitter': <FiTwitter className="w-6 h-6" />,
            'linkedin': <FiLinkedin className="w-6 h-6" />,
            'tiktok': <FaTiktok className="w-6 h-6" />,
            'discord': <FaDiscord className="w-6 h-6" />,
            'slack': <FiSlack className="w-6 h-6" />,
            'zalo': <SiZalo className="w-6 h-6" />,
            'line': <FaLine className="w-6 h-6" />,
            'viber': <FaViber className="w-6 h-6" />,
            'wechat': <FaWeixin className="w-6 h-6" />,
            'sms': <FiPhone className="w-6 h-6" />,
            'webchat': <FiGlobe className="w-6 h-6" />,
            'shopify': <FaShopify className="w-6 h-6" />,
            'google': <FaGoogle className="w-6 h-6" />,
            'hubspot': <SiHubspot className="w-6 h-6" />,
            'salesforce': <SiSalesforce className="w-6 h-6" />,
            'mailchimp': <SiMailchimp className="w-6 h-6" />,
            'intercom': <SiIntercom className="w-6 h-6" />,
            'zapier': <SiZapier className="w-6 h-6" />,
            'notion': <SiNotion className="w-6 h-6" />,
            'airtable': <SiAirtable className="w-6 h-6" />,
        }
        return icons[type] || <FiMessageCircle className="w-6 h-6" />
    }

    const getColor = (type: string) => {
        const colors: Record<string, string> = {
            'facebook': 'text-blue-600 bg-blue-500/10 border-blue-500/20',
            'messenger': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'instagram': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
            'whatsapp': 'text-green-500 bg-green-500/10 border-green-500/20',
            'telegram': 'text-sky-500 bg-sky-500/10 border-sky-500/20',
            'youtube': 'text-red-500 bg-red-500/10 border-red-500/20',
            'twitter': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
            'linkedin': 'text-blue-700 bg-blue-700/10 border-blue-700/20',
            'tiktok': 'text-black bg-black/10 border-black/20',
            'discord': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
            'slack': 'text-purple-600 bg-purple-600/10 border-purple-600/20',
            'zalo': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'line': 'text-green-500 bg-green-500/10 border-green-500/20',
            'viber': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
            'wechat': 'text-green-600 bg-green-600/10 border-green-600/20',
            'sms': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            'email': 'text-red-500 bg-red-500/10 border-red-500/20',
            'webchat': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
            'shopify': 'text-green-600 bg-green-600/10 border-green-600/20',
            'google': 'text-red-500 bg-red-500/10 border-red-500/20',
            'hubspot': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            'salesforce': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'mailchimp': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
            'intercom': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
            'zapier': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
            'notion': 'text-gray-800 bg-gray-800/10 border-gray-800/20',
            'airtable': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        }
        return colors[type] || 'text-gray-600 bg-gray-600/10 border-gray-600/20'
    }

    const MESSAGING_CHANNELS = [
        { id: 'facebook', name: 'Facebook Page', description: 'Manage posts and comments on your Facebook Page', category: 'social', multiAccount: true },
        { id: 'messenger', name: 'Messenger', description: 'Reply to messages from your Facebook Page', category: 'messaging', multiAccount: true },
        { id: 'instagram', name: 'Instagram', description: 'Manage Instagram DMs, comments and posts', category: 'social', multiAccount: true },
        { id: 'whatsapp', name: 'WhatsApp Business', description: 'Connect WhatsApp Business API', category: 'messaging', multiAccount: true },
        { id: 'telegram', name: 'Telegram', description: 'Connect Telegram Bot for messaging', category: 'messaging', multiAccount: true },
        { id: 'youtube', name: 'YouTube', description: 'Manage YouTube channel and comments', category: 'social', multiAccount: true },
        { id: 'twitter', name: 'X / Twitter', description: 'Post tweets and manage DMs', category: 'social', multiAccount: true },
        { id: 'linkedin', name: 'LinkedIn', description: 'Post to LinkedIn and manage messages', category: 'social', multiAccount: true },
        { id: 'tiktok', name: 'TikTok', description: 'Post videos and manage TikTok account', category: 'social', multiAccount: true },
        { id: 'discord', name: 'Discord', description: 'Connect Discord bot for community', category: 'messaging', multiAccount: true },
        { id: 'slack', name: 'Slack', description: 'Send notifications to Slack channels', category: 'messaging', multiAccount: true },
        { id: 'zalo', name: 'Zalo OA', description: 'Connect Zalo Official Account (Vietnam)', category: 'messaging', multiAccount: true },
        { id: 'line', name: 'LINE', description: 'Connect LINE Official Account (Asia)', category: 'messaging', multiAccount: true },
        { id: 'viber', name: 'Viber', description: 'Connect Viber Business Messages', category: 'messaging', multiAccount: true },
        { id: 'wechat', name: 'WeChat', description: 'Connect WeChat Official Account (China)', category: 'messaging', multiAccount: true },
        { id: 'sms', name: 'SMS', description: 'Send SMS via Twilio or other providers', category: 'messaging', multiAccount: false },
        { id: 'email', name: 'Email', description: 'Send emails via SMTP or providers', category: 'messaging', multiAccount: false },
        { id: 'webchat', name: 'Web Chat', description: 'Embed chat widget on your website', category: 'messaging', multiAccount: false },
    ]

    const BUSINESS_INTEGRATIONS = [
        { id: 'shopify', name: 'Shopify', description: 'Sync orders and customers from Shopify', category: 'ecommerce', multiAccount: true },
        { id: 'google', name: 'Google Business', description: 'Manage Google Business Profile reviews', category: 'business', multiAccount: true },
        { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and deals with HubSpot CRM', category: 'crm', multiAccount: false },
        { id: 'salesforce', name: 'Salesforce', description: 'Connect to Salesforce CRM', category: 'crm', multiAccount: false },
        { id: 'mailchimp', name: 'Mailchimp', description: 'Sync contacts for email marketing', category: 'marketing', multiAccount: false },
        { id: 'intercom', name: 'Intercom', description: 'Sync conversations with Intercom', category: 'support', multiAccount: false },
        { id: 'zapier', name: 'Zapier', description: 'Connect to 5000+ apps via Zapier', category: 'automation', multiAccount: false },
        { id: 'notion', name: 'Notion', description: 'Sync data with Notion databases', category: 'productivity', multiAccount: true },
        { id: 'airtable', name: 'Airtable', description: 'Connect to Airtable bases', category: 'productivity', multiAccount: true },
    ]

    const [activeTab, setActiveTab] = useState<'connected' | 'configurations'>('connected')

    const configuredCount = configs.length
    const allChannels = [...MESSAGING_CHANNELS, ...BUSINESS_INTEGRATIONS]

    const configuredProviders = new Set(configs.map(c => c.provider))
    const configuredNotConnected = Array.from(configuredProviders).filter(provider =>
        !channels.some(c => c.type === provider)
    )
    const notConfigured = allChannels.filter(ch =>
        !configuredProviders.has(ch.id) && !channels.some(c => c.type === ch.id)
    );

    return (
        <div className="h-full space-y-8">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Channels & Integrations</h1>
                    <p className="text-muted-foreground mt-1">Connect your communication channels to start automating</p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={loading}>
                    {loading ? (
                        <Spinner className="size-4 mr-2" />
                    ) : (
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                </Button>
            </div>

            {}
            <div className="flex gap-2 border-b border-border/40 pb-4">
                <button
                    onClick={() => setActiveTab('connected')}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'connected'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <FiCheckCircle className="w-4 h-4" />
                    Connections
                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'connected' ? 'bg-white/20' : 'bg-muted'
                        }`}>
                        {channels.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('configurations')}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'configurations'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <FiSettings className="w-4 h-4" />
                    Configurations
                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'configurations' ? 'bg-white/20' : 'bg-muted'
                        }`}>
                        {configuredCount}
                    </span>
                </button>
            </div>

            {}
            {activeTab === 'connected' && (
                <div>
                    {channels.length === 0 && configuredCount === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-muted flex items-center justify-center">
                                <FiMessageCircle className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">No connections yet</h3>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                Configure your first integration to start connecting channels and automating your workflow
                            </p>
                            <Button onClick={() => setActiveTab('configurations')} size="lg">
                                Go to Configurations
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {}
                            {channels.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold flex items-center gap-3">
                                            <span className="w-2 h-2 bg-success rounded-full"></span>
                                            Connected ({channels.length})
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {channels.map((channel) => {
                                            const channelInfo = allChannels.find(c => c.id === channel.type)
                                            const sameTypeCount = channels.filter(c => c.type === channel.type).length

                                            return (
                                                <Card key={channel.id} className="relative overflow-hidden">
                                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                        <div className={`p-3 rounded-lg ${getColor(channel.type)}`}>
                                                            {getIcon(channel.type)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {sameTypeCount > 1 && (
                                                                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                    {sameTypeCount} accounts
                                                                </span>
                                                            )}
                                                            <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                                                                <FiCheckCircle className="w-3 h-3 mr-1" />
                                                                Active
                                                            </span>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <CardTitle className="text-lg font-semibold mb-1">{channel.name}</CardTitle>
                                                        <CardDescription className="capitalize">
                                                            {channelInfo?.name || channel.type}
                                                        </CardDescription>
                                                    </CardContent>
                                                    <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            Connected {new Date(channel.connected_at).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDisconnect(channel.id)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                            Disconnect
                                                        </button>
                                                    </CardFooter>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {}
                            {configuredNotConnected.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold flex items-center gap-3">
                                            <span className="w-2 h-2 bg-warning rounded-full"></span>
                                            Ready to Connect ({configuredNotConnected.length})
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {configuredNotConnected.map((provider) => {
                                            const channelInfo = allChannels.find(c => c.id === provider)

                                            return (
                                                <Card key={provider} className="border-warning/20">
                                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                        <div className={`p-3 rounded-lg ${getColor(provider)}`}>
                                                            {getIcon(provider)}
                                                        </div>
                                                        <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                                                            Ready
                                                        </span>
                                                    </CardHeader>
                                                    <CardContent className="pb-4">
                                                        <CardTitle className="text-lg font-semibold mb-1">{channelInfo?.name || provider}</CardTitle>
                                                        <CardDescription>
                                                            {channelInfo?.description || 'Configured and ready to connect'}
                                                        </CardDescription>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button
                                                            className="w-full"
                                                            onClick={() => handleConnect(provider)}
                                                            disabled={connecting === provider}
                                                        >
                                                            {connecting === provider ? 'Connecting...' : 'Connect Now'}
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {}
                            {notConfigured.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold flex items-center gap-3">
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                                            Not Configured ({notConfigured.length})
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTab('configurations')}
                                        >
                                            Go to Configurations
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {notConfigured.map((channel) => (
                                            <Card key={channel.id}>
                                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                    <div className={`p-3 rounded-lg ${getColor(channel.id)} opacity-60`}>
                                                        {getIcon(channel.id)}
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                        Not Configured
                                                    </span>
                                                </CardHeader>
                                                <CardContent className="pb-4">
                                                    <CardTitle className="text-lg font-semibold mb-1">{channel.name}</CardTitle>
                                                    <CardDescription>
                                                        {channel.description || 'Configure API credentials to connect'}
                                                    </CardDescription>
                                                </CardContent>
                                                <CardFooter>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => {
                                                            setActiveTab('configurations')
                                                            openConfig(undefined, channel.id)
                                                        }}
                                                    >
                                                        Configure Now
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {}
            {activeTab === 'configurations' && (
                <div className="space-y-10">
                    <AlertBanner
                        variant="info"
                        title="Configuration Management"
                        icon={<FiSettings className="w-5 h-5" />}
                    >
                        Configure API credentials for each integration. One configuration can be used to connect multiple accounts.
                    </AlertBanner>

                    <div className="space-y-10">
                        {}
                        {configuredCount > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    Configured Integrations
                                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {configuredCount}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {configs.map((config) => {
                                        const provider = config.provider
                                        const channelInfo = allChannels.find(c => c.id === provider)
                                        const connectedCount = channels.filter(c => c.type === provider).length

                                        return (
                                            <Card key={config.id}>
                                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                    <div className={`p-3 rounded-lg ${getColor(provider)}`}>
                                                        {getIcon(provider)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {connectedCount > 0 && (
                                                            <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                                                                {connectedCount} connected
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => openConfig(config.id)}
                                                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                            title="Edit Configuration"
                                                        >
                                                            <FiSettings className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfigId(config.id)}
                                                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                                            title="Delete Configuration"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <CardTitle className="text-lg font-semibold mb-1">{config.name || channelInfo?.name || provider}</CardTitle>
                                                    <CardDescription className="mb-5">
                                                        {channelInfo?.description || 'API configured'}
                                                    </CardDescription>
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                                            <span className="text-muted-foreground">Client ID</span>
                                                            <span className="font-mono">{config.client_id.slice(0, 12)}...</span>
                                                        </div>
                                                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                                            <span className="text-muted-foreground">Status</span>
                                                            <span className={`flex items-center gap-1.5 ${config.is_active ? 'text-success' : 'text-destructive'}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${config.is_active ? 'bg-success' : 'bg-destructive'}`}></span>
                                                                {config.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="flex gap-3">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleConnect(provider, config.id)}
                                                        disabled={connecting === provider}
                                                    >
                                                        {connecting === provider ? 'Connecting...' : 'Connect'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openConfig(config.id)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {}
                        <div>
                            <h2 className="text-xl font-semibold mb-6">
                                Available Integrations
                            </h2>

                            {}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider pl-1">Messaging Channels</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {MESSAGING_CHANNELS.map((channel) => (
                                        <Card
                                            key={channel.id}
                                            onClick={() => openConfig(undefined, channel.id)}
                                            className="cursor-pointer hover:scale-[1.02] transition-transform text-left group"
                                        >
                                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                <div className={`p-2.5 rounded-lg ${getColor(channel.id)}`}>
                                                    {getIcon(channel.id)}
                                                </div>
                                                <FiSettings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </CardHeader>
                                            <CardContent>
                                                <CardTitle className="text-base font-semibold mb-1">{channel.name}</CardTitle>
                                                <CardDescription className="text-xs line-clamp-2">
                                                    {channel.description}
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {}
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider pl-1">Business Integrations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {BUSINESS_INTEGRATIONS.map((integration) => (
                                        <Card
                                            key={integration.id}
                                            onClick={() => openConfig(undefined, integration.id)}
                                            className="cursor-pointer hover:scale-[1.02] transition-transform text-left group"
                                        >
                                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                                <div className={`p-2.5 rounded-lg ${getColor(integration.id)}`}>
                                                    {getIcon(integration.id)}
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                                    {integration.category}
                                                </span>
                                            </CardHeader>
                                            <CardContent>
                                                <CardTitle className="text-base font-semibold mb-1">{integration.name}</CardTitle>
                                                <CardDescription className="text-xs line-clamp-2">
                                                    {integration.description}
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {}
            {configForm.provider && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-3 rounded-lg ${getColor(configForm.provider)}`}>
                                    {getIcon(configForm.provider)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold capitalize">{configForm.provider}</h3>
                                    <p className="text-xs text-muted-foreground">API Configuration</p>
                                </div>
                                <button onClick={() => {
                                    setConfigForm(prev => ({ ...prev, provider: '' }))
                                }} className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {}
                            <AlertBanner variant="tip" className="mb-6">
                                You need to create an app in the <span className="font-semibold">{configForm.provider} developer portal</span> to get these credentials.
                            </AlertBanner>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Configuration Name <span className="text-muted-foreground font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={configForm.name || ''}
                                        onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                                        className="w-full bg-input rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                        placeholder="e.g. My Main Page"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        App ID / Client ID <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={configForm.client_id}
                                        onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                                        className="w-full bg-input rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                        placeholder="Enter App ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        App Secret / Client Secret <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={configForm.client_secret}
                                        onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                                        className="w-full bg-input rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                        placeholder="Enter App Secret"
                                    />
                                </div>

                                {}
                                {(configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Webhook Verify Token
                                        </label>
                                        <input
                                            type="text"
                                            value={configForm.verify_token}
                                            onChange={(e) => setConfigForm({ ...configForm, verify_token: e.target.value })}
                                            className="w-full bg-input rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                            placeholder="wataomi_verify_token"
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Use this token when setting up webhook in Facebook App
                                        </p>
                                    </div>
                                )}

                                {}
                                {configForm.provider !== 'facebook' && configForm.provider !== 'messenger' && configForm.provider !== 'instagram' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Scopes <span className="text-muted-foreground font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={configForm.scopes}
                                            onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                                            className="w-full bg-input rounded-lg px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                                            placeholder="email, public_profile"
                                        />
                                    </div>
                                )}

                                {}
                                {(configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') && (
                                    <CodeBlock label="Webhook URL">
                                        {process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api/v1/webhooks/facebook
                                    </CodeBlock>
                                )}

                                <div className="flex justify-end gap-3 mt-8 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setConfigForm(prev => ({ ...prev, provider: '' }))
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={saveConfig}
                                        disabled={!configForm.client_id || !configForm.client_secret}
                                    >
                                        {configForm.id ? 'Update Configuration' : 'Save Configuration'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {}
            {facebookPages.length > 0 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[80vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Connect Facebook Pages</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Select a bot and choose which pages to connect
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setFacebookPages([])
                                    setFacebookTempToken('')
                                    setBots([])
                                    setSelectedBotId('')
                                }}
                                className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {}
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

                        {}
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

            {}
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

            {}
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
        </div>
    )
}
