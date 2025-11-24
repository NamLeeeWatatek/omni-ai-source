'use client'

import { Button } from '@wataomi/ui'
import { FiPlus, FiCheckCircle, FiXCircle } from 'react-icons/fi'

export default function ChannelsPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Connected Channels</h2>
                    <p className="text-muted-foreground">
                        Manage your messaging platform integrations
                    </p>
                </div>
                <Button>
                    <FiPlus className="w-4 h-4 mr-2" />
                    Add Channel
                </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channelPlatforms.map((platform) => (
                    <div
                        key={platform.name}
                        className="glass rounded-xl p-6 border border-border/40"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center`}>
                                <span className="text-white font-bold text-xl">
                                    {platform.name.charAt(0)}
                                </span>
                            </div>
                            {platform.connected ? (
                                <div className="flex items-center space-x-1 text-green-500 text-sm">
                                    <FiCheckCircle className="w-4 h-4" />
                                    <span>Connected</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                                    <FiXCircle className="w-4 h-4" />
                                    <span>Not connected</span>
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-semibold mb-2">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {platform.description}
                        </p>

                        {platform.connected ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Active conversations</span>
                                    <span className="font-medium">{platform.stats?.conversations}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Messages today</span>
                                    <span className="font-medium">{platform.stats?.messages}</span>
                                </div>
                                <Button variant="outline" size="sm" className="w-full mt-2">
                                    Configure
                                </Button>
                            </div>
                        ) : (
                            <Button size="sm" className="w-full">
                                Connect {platform.name}
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

const channelPlatforms = [
    {
        name: 'WhatsApp',
        description: 'Connect WhatsApp Business API for customer messaging',
        color: 'bg-green-500',
        connected: true,
        stats: { conversations: 45, messages: 234 },
    },
    {
        name: 'Messenger',
        description: 'Integrate Facebook Messenger for social engagement',
        color: 'bg-blue-500',
        connected: true,
        stats: { conversations: 32, messages: 187 },
    },
    {
        name: 'Instagram',
        description: 'Handle Instagram Direct messages and comments',
        color: 'bg-pink-500',
        connected: true,
        stats: { conversations: 28, messages: 156 },
    },
    {
        name: 'Telegram',
        description: 'Connect Telegram Bot API for automated responses',
        color: 'bg-cyan-500',
        connected: false,
    },
    {
        name: 'Web Chat',
        description: 'Embed WataBubble widget on your website',
        color: 'bg-purple-500',
        connected: true,
        stats: { conversations: 67, messages: 423 },
    },
    {
        name: 'Email',
        description: 'Manage email conversations in unified inbox',
        color: 'bg-orange-500',
        connected: false,
    },
]
