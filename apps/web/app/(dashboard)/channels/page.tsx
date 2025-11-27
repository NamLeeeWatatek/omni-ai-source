'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { fetchAPI } from '@/lib/api'
import toast from 'react-hot-toast'
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

interface Channel {
    id: number
    name: string
    type: string
    icon?: string
    status: string
    connected_at: string
}

interface IntegrationConfig {
    provider: string
    client_id: string
    client_secret: string
    scopes?: string
    is_active: boolean
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([])
    const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({})
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)
    const [configuring, setConfiguring] = useState<string | null>(null)

    // Config Form State
    const [configForm, setConfigForm] = useState({
        client_id: '',
        client_secret: '',
        scopes: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [channelsData, configsData] = await Promise.all([
                fetchAPI('/channels/'),
                fetchAPI('/integrations/')
            ])
            setChannels(channelsData)

            // Map configs by provider
            const configMap: Record<string, IntegrationConfig> = {}
            configsData.forEach((c: IntegrationConfig) => {
                configMap[c.provider] = c
            })
            setConfigs(configMap)

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (provider: string) => {
        // Check if configured
        if (!configs[provider]?.client_id) {
            toast.error(`Please configure ${provider} settings first`)
            openConfig(provider)
            return
        }

        try {
            setConnecting(provider)

            // Get OAuth URL
            const { url } = await fetchAPI(`/oauth/login/${provider}`)

            // Open popup
            const width = 600
            const height = 700
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                url,
                `Connect ${provider}`,
                `width=${width},height=${height},left=${left},top=${top}`
            )

            // Listen for message from popup
            const messageHandler = (event: MessageEvent) => {
                if (event.data?.status === 'success') {
                    toast.success(`Connected to ${event.data.channel}`)
                    loadData()
                    popup?.close()
                    window.removeEventListener('message', messageHandler)
                } else if (event.data?.status === 'error') {
                    toast.error(`Connection failed: ${event.data.message}`)
                    popup?.close()
                    window.removeEventListener('message', messageHandler)
                }
            }

            window.addEventListener('message', messageHandler)

            // Check if popup closed manually
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

    const handleDisconnect = async (id: number) => {
        if (!confirm('Are you sure you want to disconnect this channel?')) return

        try {
            await fetchAPI(`/channels/${id}`, { method: 'DELETE' })
            toast.success('Channel disconnected')
            loadData()
        } catch {
            toast.error('Failed to disconnect')
        }
    }

    const openConfig = (provider: string) => {
        const existing = configs[provider]
        setConfigForm({
            client_id: existing?.client_id || '',
            client_secret: existing?.client_secret || '',
            scopes: existing?.scopes || ''
        })
        setConfiguring(provider)
    }

    const saveConfig = async () => {
        if (!configuring) return

        try {
            await fetchAPI('/integrations/', {
                method: 'POST',
                body: JSON.stringify({
                    provider: configuring,
                    ...configForm
                })
            })
            toast.success('Configuration saved')
            setConfiguring(null)
            loadData()
        } catch {
            toast.error('Failed to save configuration')
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

    // Messaging Channels
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

    // Business Integrations
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

    // Count configured integrations
    const configuredCount = Object.keys(configs).length
    const allChannels = [...MESSAGING_CHANNELS, ...BUSINESS_INTEGRATIONS]

    // Group channels by connection status
    const configuredNotConnected = Object.keys(configs).filter(provider =>
        !channels.some(c => c.type === provider)
    )
    const notConfigured = allChannels.filter(ch =>
        !configs[ch.id] && !channels.some(c => c.type === ch.id)
    )

    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Channels & Integrations</h1>
                    <p className="text-muted-foreground">
                        Connect your communication channels to start automating
                    </p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border/40 pb-4">
                <button
                    onClick={() => setActiveTab('connected')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'connected'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    <FiCheckCircle className="w-4 h-4" />
                    Connections
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'connected' ? 'bg-white/20' : 'bg-muted'
                        }`}>
                        {channels.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('configurations')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'configurations'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    <FiSettings className="w-4 h-4" />
                    Configurations
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'configurations' ? 'bg-white/20' : 'bg-muted'
                        }`}>
                        {configuredCount}
                    </span>
                </button>
            </div>

            {/* Connected Tab */}
            {activeTab === 'connected' && (
                <div>
                    {channels.length === 0 && configuredCount === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                                <FiMessageCircle className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Configure your first integration to start connecting channels
                            </p>
                            <Button onClick={() => setActiveTab('configurations')}>
                                Go to Configurations
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Connected Channels */}
                            {channels.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Connected ({channels.length})
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {channels.map((channel) => {
                                            const channelInfo = allChannels.find(c => c.id === channel.type)
                                            const sameTypeCount = channels.filter(c => c.type === channel.type).length

                                            return (
                                                <div key={channel.id} className="glass rounded-xl p-5 border border-green-500/20 bg-green-500/5 group">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`p-3 rounded-xl border ${getColor(channel.type)}`}>
                                                            {getIcon(channel.type)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {sameTypeCount > 1 && (
                                                                <span className="text-xs font-medium bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                                                                    {sameTypeCount} accounts
                                                                </span>
                                                            )}
                                                            <span className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                                                <FiCheckCircle className="w-3 h-3 mr-1" />
                                                                Active
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold text-lg mb-1">{channel.name}</h3>
                                                    <p className="text-sm text-muted-foreground capitalize mb-3">
                                                        {channelInfo?.name || channel.type}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-3 border-t border-border/20">
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(channel.connected_at).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDisconnect(channel.id)}
                                                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                                                        >
                                                            <FiTrash2 className="w-3 h-3" />
                                                            Disconnect
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Configured but Not Connected */}
                            {configuredNotConnected.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                            Ready to Connect ({configuredNotConnected.length})
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {configuredNotConnected.map((provider) => {
                                            const channelInfo = allChannels.find(c => c.id === provider)

                                            return (
                                                <div key={provider} className="glass rounded-xl p-5 border border-amber-500/20 bg-amber-500/5">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className={`p-3 rounded-xl border ${getColor(provider)}`}>
                                                            {getIcon(provider)}
                                                        </div>
                                                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                                                            Ready
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-lg mb-1">{channelInfo?.name || provider}</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        {channelInfo?.description || 'Configured and ready to connect'}
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => handleConnect(provider)}
                                                        disabled={connecting === provider}
                                                    >
                                                        {connecting === provider ? 'Connecting...' : 'Connect Now'}
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Not Configured */}
                            {notConfigured.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                            Not Configured ({notConfigured.length})
                                        </h2>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setActiveTab('configurations')}
                                        >
                                            Configure
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {notConfigured.slice(0, 8).map((channel) => (
                                            <button
                                                key={channel.id}
                                                onClick={() => {
                                                    setActiveTab('configurations')
                                                    setTimeout(() => openConfig(channel.id), 100)
                                                }}
                                                className="glass rounded-lg p-3 border border-border/40 hover:border-primary/40 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg border ${getColor(channel.id)}`}>
                                                        {getIcon(channel.id)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{channel.name}</p>
                                                        <p className="text-xs text-muted-foreground">Click to configure</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                        {notConfigured.length > 8 && (
                                            <button
                                                onClick={() => setActiveTab('configurations')}
                                                className="glass rounded-lg p-3 border border-border/40 hover:border-primary/40 transition-all flex items-center justify-center"
                                            >
                                                <div className="text-center">
                                                    <p className="text-sm font-medium">+{notConfigured.length - 8} more</p>
                                                    <p className="text-xs text-muted-foreground">View all</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Configurations Tab */}
            {activeTab === 'configurations' && (
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Configure API credentials for each integration. One configuration can be used to connect multiple accounts.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Configured Integrations */}
                        {configuredCount > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4">Configured ({configuredCount})</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(configs).map(([provider, config]) => {
                                        const channelInfo = allChannels.find(c => c.id === provider)
                                        const connectedCount = channels.filter(c => c.type === provider).length

                                        return (
                                            <div key={provider} className="glass rounded-xl p-5 border border-border/40 group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`p-3 rounded-xl border ${getColor(provider)}`}>
                                                        {getIcon(provider)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {connectedCount > 0 && (
                                                            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                                {connectedCount} connected
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => openConfig(provider)}
                                                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                                            title="Edit Configuration"
                                                        >
                                                            <FiSettings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold text-lg mb-1">{channelInfo?.name || provider}</h3>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {channelInfo?.description || 'API configured'}
                                                </p>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                                        <span className="text-muted-foreground">Client ID:</span>
                                                        <span className="font-mono">{config.client_id.slice(0, 12)}...</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <span className={config.is_active ? 'text-green-500' : 'text-red-500'}>
                                                            {config.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-border/20 flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleConnect(provider)}
                                                        disabled={connecting === provider}
                                                    >
                                                        {connecting === provider ? 'Connecting...' : connectedCount > 0 ? 'Add Another' : 'Connect'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openConfig(provider)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Available to Configure */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Available Integrations ({allChannels.length - configuredCount})
                            </h2>

                            {/* Messaging Channels */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Messaging Channels</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {MESSAGING_CHANNELS.filter(ch => !configs[ch.id]).map((channel) => (
                                        <button
                                            key={channel.id}
                                            onClick={() => openConfig(channel.id)}
                                            className="glass rounded-xl p-4 border border-border/40 hover:border-primary/20 transition-all text-left group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl border ${getColor(channel.id)}`}>
                                                    {getIcon(channel.id)}
                                                </div>
                                                <FiSettings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <h3 className="font-semibold mb-1">{channel.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {channel.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Business Integrations */}
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Business Integrations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {BUSINESS_INTEGRATIONS.filter(ch => !configs[ch.id]).map((integration) => (
                                        <button
                                            key={integration.id}
                                            onClick={() => openConfig(integration.id)}
                                            className="glass rounded-xl p-4 border border-border/40 hover:border-primary/20 transition-all text-left group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl border ${getColor(integration.id)}`}>
                                                    {getIcon(integration.id)}
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                                    {integration.category}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold mb-1">{integration.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {integration.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Removed old tabs - now using Connections and Configurations only */}
            {false && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {MESSAGING_CHANNELS.map((channel) => {
                            const isConnected = channels.some(c => c.type === channel.id)
                            const connectedCount = channels.filter(c => c.type === channel.id).length
                            const isConfigured = !!configs[channel.id]?.client_id
                            const canAddMore = channel.multiAccount || !isConnected

                            return (
                                <div key={channel.id} className="glass rounded-xl p-4 border border-border/40 hover:border-primary/20 transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2.5 rounded-xl border ${getColor(channel.id)}`}>
                                            {getIcon(channel.id)}
                                        </div>
                                        <div className="flex gap-1">
                                            {isConnected && connectedCount > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 font-medium">
                                                    {connectedCount}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => openConfig(channel.id)}
                                                className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${isConfigured ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                                                title="Configure"
                                            >
                                                <FiSettings className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold mb-1">{channel.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                        {channel.description}
                                    </p>
                                    {canAddMore ? (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            variant={isConnected ? "outline" : "default"}
                                            onClick={() => handleConnect(channel.id)}
                                            disabled={connecting === channel.id}
                                        >
                                            {connecting === channel.id ? 'Connecting...' : isConnected && channel.multiAccount ? 'Add Another' : 'Connect'}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            variant="outline"
                                            disabled
                                        >
                                            <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                                            Connected
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Removed old integrations tab */}
            {false && (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {BUSINESS_INTEGRATIONS.map((integration) => {
                            const isConnected = channels.some(c => c.type === integration.id)
                            const connectedCount = channels.filter(c => c.type === integration.id).length
                            const canAddMore = integration.multiAccount || !isConnected

                            return (
                                <div key={integration.id} className="glass rounded-xl p-4 border border-border/40 hover:border-primary/20 transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2.5 rounded-xl border ${getColor(integration.id)}`}>
                                            {getIcon(integration.id)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isConnected && connectedCount > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 font-medium">
                                                    {connectedCount}
                                                </span>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                                {integration.category}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold mb-1">{integration.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                        {integration.description}
                                    </p>
                                    {canAddMore ? (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            variant={isConnected ? "outline" : "default"}
                                            onClick={() => handleConnect(integration.id)}
                                            disabled={connecting === integration.id}
                                        >
                                            {connecting === integration.id ? 'Connecting...' : isConnected && integration.multiAccount ? 'Add Another' : isConnected ? 'Reconnect' : 'Connect'}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            variant="outline"
                                            disabled
                                        >
                                            <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                                            Connected
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {configuring && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2.5 rounded-xl border ${getColor(configuring)}`}>
                                {getIcon(configuring)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold capitalize">{configuring}</h3>
                                <p className="text-xs text-muted-foreground">API Configuration</p>
                            </div>
                            <button onClick={() => setConfiguring(null)} className="text-muted-foreground hover:text-foreground">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Info Banner */}
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-xs text-blue-400">
                                💡 Get your API credentials from the {configuring} developer portal
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    App ID / Client ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={configForm.client_id}
                                    onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter App ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    App Secret / Client Secret <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={configForm.client_secret}
                                    onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Enter App Secret"
                                />
                                {configForm.client_secret && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Secret is encrypted and stored securely
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Scopes (Optional)</label>
                                <input
                                    type="text"
                                    value={configForm.scopes}
                                    onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                                    className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="e.g., pages_messaging, instagram_basic"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Comma separated permission scopes
                                </p>
                            </div>

                            {/* Show if already configured */}
                            {configs[configuring]?.client_id && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="text-xs text-green-400 flex items-center gap-2">
                                        <FiCheckCircle className="w-4 h-4" />
                                        This integration is already configured. Saving will update the settings.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setConfiguring(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={saveConfig}
                                    disabled={!configForm.client_id || !configForm.client_secret}
                                >
                                    {configs[configuring]?.client_id ? 'Update' : 'Save'} Configuration
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
