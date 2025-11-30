'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { fetchAPI } from '@/lib/api'
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

interface Channel {
    id: number
    name: string
    type: string
    icon?: string
    status: string
    connected_at: string
}

interface IntegrationConfig {
    id: number
    name?: string
    provider: string
    client_id: string
    client_secret: string
    scopes?: string
    is_active: boolean
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([])
    const [configs, setConfigs] = useState<IntegrationConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState<string | null>(null)


    // Config Form State
    const [configForm, setConfigForm] = useState({
        id: null as number | null,
        provider: '',
        name: '',
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
            setConfigs(configsData)

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (provider: string, configId?: number) => {
        // Check if configured
        const config = configId ? configs.find(c => c.id === configId) : configs.find(c => c.provider === provider)
        if (!config) {
            toast.error(`Please configure ${provider} settings first`)
            openConfig(undefined, provider)
            return
        }

        try {
            setConnecting(provider)

            // Get OAuth URL
            const configParam = configId ? `?configId=${configId}` : ''
            const { url } = await fetchAPI(`/oauth/login/${provider}${configParam}`)

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

    const [disconnectId, setDisconnectId] = useState<number | null>(null)

    const handleDisconnect = async (id: number) => {
        setDisconnectId(id)
    }

    const confirmDisconnect = async () => {
        if (!disconnectId) return

        try {
            await fetchAPI(`/channels/${disconnectId}`, { method: 'DELETE' })
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
            scopes: existing?.scopes || ''
        })

    }

    const saveConfig = async () => {
        if (!configForm.provider) {
            toast.error('Provider is required')
            return
        }

        try {
            const method = configForm.id ? 'PATCH' : 'POST'
            const url = configForm.id ? `/integrations/${configForm.id}` : '/integrations/'

            await fetchAPI(url, {
                method,
                body: JSON.stringify({
                    provider: configForm.provider,
                    name: configForm.name,
                    clientId: configForm.client_id,
                    clientSecret: configForm.client_secret,
                    scopes: configForm.scopes,
                    isActive: true
                })
            })
            toast.success('Configuration saved')

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
    const configuredCount = configs.length
    const allChannels = [...MESSAGING_CHANNELS, ...BUSINESS_INTEGRATIONS]

    // Group channels by connection status
    const configuredProviders = new Set(configs.map(c => c.provider))
    const configuredNotConnected = Array.from(configuredProviders).filter(provider =>
        !channels.some(c => c.type === provider)
    )
    const notConfigured = allChannels.filter(ch =>
        !configuredProviders.has(ch.id) && !channels.some(c => c.type === ch.id)
    );

    return (
        <div className="h-full relative p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                        Channels & Integrations
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Connect your communication channels to start automating
                    </p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={loading} className="hover:bg-primary/10 hover:text-primary transition-colors">
                    {loading ? (
                        <Spinner className="size-4 mr-2" />
                    ) : (
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('connected')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'connected'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <FiCheckCircle className="w-4 h-4" />
                    Connections
                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'connected' ? 'bg-white/20' : 'bg-white/5'
                        }`}>
                        {channels.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('configurations')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'configurations'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <FiSettings className="w-4 h-4" />
                    Configurations
                    <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'configurations' ? 'bg-white/20' : 'bg-white/5'
                        }`}>
                        {configuredCount}
                    </span>
                </button>
            </div>

            {/* Connected Tab */}
            {activeTab === 'connected' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {channels.length === 0 && configuredCount === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <FiMessageCircle className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">No connections yet</h3>
                            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                Configure your first integration to start connecting channels and automating your workflow
                            </p>
                            <Button onClick={() => setActiveTab('configurations')} size="lg" className="rounded-xl">
                                Go to Configurations
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Connected Channels */}
                            {channels.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                            Connected ({channels.length})
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {channels.map((channel, index) => {
                                            const channelInfo = allChannels.find(c => c.id === channel.type)
                                            const sameTypeCount = channels.filter(c => c.type === channel.type).length

                                            return (
                                                <motion.div
                                                    key={channel.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="glass rounded-2xl p-6 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-1"
                                                >
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className={`p-3.5 rounded-2xl border ${getColor(channel.type)} shadow-sm`}>
                                                            {getIcon(channel.type)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {sameTypeCount > 1 && (
                                                                <span className="text-xs font-medium bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full border border-blue-500/10">
                                                                    {sameTypeCount} accounts
                                                                </span>
                                                            )}
                                                            <span className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/10">
                                                                <FiCheckCircle className="w-3 h-3 mr-1.5" />
                                                                Active
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold text-xl mb-1.5">{channel.name}</h3>
                                                    <p className="text-sm text-muted-foreground capitalize mb-4">
                                                        {channelInfo?.name || channel.type}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <span className="text-xs text-muted-foreground">
                                                            Connected {new Date(channel.connected_at).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDisconnect(channel.id)}
                                                            className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                            Disconnect
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Configured but Not Connected */}
                            {configuredNotConnected.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                                            Ready to Connect ({configuredNotConnected.length})
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {configuredNotConnected.map((provider, index) => {
                                            const channelInfo = allChannels.find(c => c.id === provider)

                                            return (
                                                <motion.div
                                                    key={provider}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="glass rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
                                                >
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className={`p-3.5 rounded-2xl border ${getColor(provider)} shadow-sm`}>
                                                            {getIcon(provider)}
                                                        </div>
                                                        <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/10">
                                                            Ready
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-xl mb-1.5">{channelInfo?.name || provider}</h3>
                                                    <p className="text-sm text-muted-foreground mb-5">
                                                        {channelInfo?.description || 'Configured and ready to connect'}
                                                    </p>
                                                    <Button
                                                        className="w-full rounded-xl shadow-lg shadow-amber-500/10"
                                                        onClick={() => handleConnect(provider)}
                                                        disabled={connecting === provider}
                                                    >
                                                        {connecting === provider ? 'Connecting...' : 'Connect Now'}
                                                    </Button>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Not Configured */}
                            {notConfigured.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold flex items-center gap-3">
                                            <span className="w-2.5 h-2.5 bg-gray-500 rounded-full"></span>
                                            Not Configured ({notConfigured.length})
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveTab('configurations')}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            Go to Configurations
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {notConfigured.map((channel, index) => (
                                            <motion.div
                                                key={channel.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="glass rounded-2xl p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                            >
                                                <div className="flex items-start justify-between mb-5">
                                                    <div className={`p-3.5 rounded-2xl border ${getColor(channel.id)} opacity-80 grayscale group-hover:grayscale-0 transition-all`}>
                                                        {getIcon(channel.id)}
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                        Not Configured
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-xl mb-1.5">{channel.name}</h3>
                                                <p className="text-sm text-muted-foreground mb-5">
                                                    {channel.description || 'Configure API credentials to connect'}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full rounded-xl border-white/10 hover:bg-white/5"
                                                    onClick={() => {
                                                        setActiveTab('configurations')
                                                        openConfig(undefined, channel.id)
                                                    }}
                                                >
                                                    Configure Now
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Configurations Tab */}
            {activeTab === 'configurations' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-10"
                >
                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="flex gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                                <FiSettings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-medium text-blue-100">Configuration Management</h3>
                                <p className="text-sm text-blue-200/60 mt-1">
                                    Configure API credentials for each integration. One configuration can be used to connect multiple accounts.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Configured Integrations */}
                        {configuredCount > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    Configured Integrations
                                    <span className="text-sm font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                                        {configuredCount}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {configs.map((config, index) => {
                                        const provider = config.provider
                                        const channelInfo = allChannels.find(c => c.id === provider)
                                        const connectedCount = channels.filter(c => c.type === provider).length

                                        return (
                                            <motion.div
                                                key={config.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="glass rounded-2xl p-6 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 group hover:shadow-xl hover:-translate-y-1"
                                            >
                                                <div className="flex items-start justify-between mb-5">
                                                    <div className={`p-3.5 rounded-2xl border ${getColor(provider)} shadow-sm`}>
                                                        {getIcon(provider)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {connectedCount > 0 && (
                                                            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/10">
                                                                {connectedCount} connected
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => openConfig(config.id)}
                                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                                                            title="Edit Configuration"
                                                        >
                                                            <FiSettings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="font-semibold text-xl mb-1.5">{config.name || channelInfo?.name || provider}</h3>
                                                <p className="text-sm text-muted-foreground mb-5">
                                                    {channelInfo?.description || 'API configured'}
                                                </p>
                                                <div className="space-y-3 text-xs mb-6">
                                                    <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg border border-white/5">
                                                        <span className="text-muted-foreground">Client ID</span>
                                                        <span className="font-mono text-foreground/80">{config.client_id.slice(0, 12)}...</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-lg border border-white/5">
                                                        <span className="text-muted-foreground">Status</span>
                                                        <span className={`flex items-center gap-1.5 ${config.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${config.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                            {config.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 rounded-xl shadow-lg shadow-primary/10"
                                                        onClick={() => handleConnect(provider, config.id)}
                                                        disabled={connecting === provider}
                                                    >
                                                        {connecting === provider ? 'Connecting...' : 'Connect'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl border-white/10 hover:bg-white/5"
                                                        onClick={() => openConfig(config.id)}
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Available to Configure */}
                        <div>
                            <h2 className="text-xl font-semibold mb-6">
                                Available Integrations
                            </h2>

                            {/* Messaging Channels */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider pl-1">Messaging Channels</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {MESSAGING_CHANNELS.map((channel) => (
                                        <button
                                            key={channel.id}
                                            onClick={() => openConfig(undefined, channel.id)}
                                            className="glass rounded-xl p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 text-left group hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl border ${getColor(channel.id)} group-hover:scale-110 transition-transform duration-300`}>
                                                    {getIcon(channel.id)}
                                                </div>
                                                <FiSettings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0" />
                                            </div>
                                            <h3 className="font-semibold mb-1 text-foreground/90 group-hover:text-foreground transition-colors">{channel.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors">
                                                {channel.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Business Integrations */}
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider pl-1">Business Integrations</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {BUSINESS_INTEGRATIONS.map((integration) => (
                                        <button
                                            key={integration.id}
                                            onClick={() => openConfig(undefined, integration.id)}
                                            className="glass rounded-xl p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 text-left group hover:-translate-y-0.5"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2.5 rounded-xl border ${getColor(integration.id)} group-hover:scale-110 transition-transform duration-300`}>
                                                    {getIcon(integration.id)}
                                                </div>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground capitalize border border-white/5 group-hover:border-white/10 transition-colors">
                                                    {integration.category}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold mb-1 text-foreground/90 group-hover:text-foreground transition-colors">{integration.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80 transition-colors">
                                                {integration.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Configuration Modal */}
            {configForm.provider && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-3 rounded-2xl border ${getColor(configForm.provider)} shadow-lg`}>
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

                            {/* Info Banner */}
                            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 items-start">
                                <span className="text-lg">💡</span>
                                <p className="text-xs text-blue-200/80 leading-relaxed">
                                    You need to create an app in the <span className="font-semibold text-blue-200">{configForm.provider} developer portal</span> to get these credentials.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground/90">
                                        Configuration Name <span className="text-muted-foreground font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={configForm.name || ''}
                                        onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                                        className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="e.g. My Main Page"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground/90">
                                        App ID / Client ID <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={configForm.client_id}
                                        onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                                        className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="Enter App ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground/90">
                                        App Secret / Client Secret <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={configForm.client_secret}
                                        onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                                        className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="Enter App Secret"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-foreground/90">
                                        Scopes <span className="text-muted-foreground font-normal">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={configForm.scopes}
                                        onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                                        className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="email, public_profile"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setConfigForm(prev => ({ ...prev, provider: '' }))
                                        }}
                                        className="rounded-xl hover:bg-white/5"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={saveConfig}
                                        disabled={!configForm.client_id || !configForm.client_secret}
                                        className="rounded-xl shadow-lg shadow-primary/20"
                                    >
                                        {configForm.id ? 'Update Configuration' : 'Save Configuration'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Disconnect Confirmation Dialog */}
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
        </div>
    )
}
