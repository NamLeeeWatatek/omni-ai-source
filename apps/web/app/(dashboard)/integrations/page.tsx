'use client'

import { useState } from 'react'
import { Button } from '@wataomi/ui'
import {
    FiSearch,
    FiLink,
    FiCheckCircle,
    FiSettings,
    FiExternalLink,
    FiZap
} from 'react-icons/fi'

export default function IntegrationsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'connected' | 'available'>('all')

    const integrations = [
        {
            id: 1,
            name: 'n8n',
            description: 'Workflow automation platform for connecting apps and services',
            category: 'Automation',
            icon: '🔄',
            color: 'from-wata-purple to-wata-blue',
            connected: true,
            status: 'active',
            connections: 12,
            last_sync: '2 hours ago'
        },
        {
            id: 2,
            name: 'WhatsApp Business',
            description: 'Send and receive messages via WhatsApp Business API',
            category: 'Messaging',
            icon: '💬',
            color: 'from-green-500 to-green-600',
            connected: true,
            status: 'active',
            connections: 1,
            last_sync: '5 minutes ago'
        },
        {
            id: 3,
            name: 'Facebook Messenger',
            description: 'Connect with customers on Facebook Messenger',
            category: 'Messaging',
            icon: '📱',
            color: 'from-blue-500 to-blue-600',
            connected: true,
            status: 'active',
            connections: 1,
            last_sync: '1 hour ago'
        },
        {
            id: 4,
            name: 'Instagram',
            description: 'Respond to Instagram direct messages',
            category: 'Messaging',
            icon: '📸',
            color: 'from-pink-500 to-purple-600',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 5,
            name: 'Telegram',
            description: 'Build bots and send messages on Telegram',
            category: 'Messaging',
            icon: '✈️',
            color: 'from-blue-400 to-blue-500',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 6,
            name: 'Zapier',
            description: 'Connect with 5000+ apps through Zapier',
            category: 'Automation',
            icon: '⚡',
            color: 'from-orange-500 to-orange-600',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 7,
            name: 'Make (Integromat)',
            description: 'Visual platform for workflow automation',
            category: 'Automation',
            icon: '🔧',
            color: 'from-purple-500 to-purple-600',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 8,
            name: 'Google Sheets',
            description: 'Read and write data to Google Sheets',
            category: 'Database',
            icon: '📊',
            color: 'from-green-500 to-green-600',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 9,
            name: 'Airtable',
            description: 'Manage data in Airtable bases',
            category: 'Database',
            icon: '🗂️',
            color: 'from-yellow-500 to-orange-500',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 10,
            name: 'SendGrid',
            description: 'Send transactional and marketing emails',
            category: 'Email',
            icon: '📧',
            color: 'from-blue-500 to-cyan-500',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 11,
            name: 'Google Calendar',
            description: 'Schedule and manage calendar events',
            category: 'Productivity',
            icon: '📅',
            color: 'from-blue-500 to-blue-600',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        },
        {
            id: 12,
            name: 'Stripe',
            description: 'Process payments and manage subscriptions',
            category: 'Payment',
            icon: '💳',
            color: 'from-purple-500 to-indigo-600',
            connected: false,
            status: null,
            connections: 0,
            last_sync: null
        }
    ]

    const filteredIntegrations = integrations.filter(integration => {
        const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            integration.description.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filter === 'all' ||
            (filter === 'connected' && integration.connected) ||
            (filter === 'available' && !integration.connected)

        return matchesSearch && matchesFilter
    })

    const stats = {
        total: integrations.length,
        connected: integrations.filter(i => i.connected).length,
        available: integrations.filter(i => !i.connected).length
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Integrations</h1>
                    <p className="text-muted-foreground">
                        Connect WataOmi with your favorite tools and services
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiLink className="w-5 h-5 text-wata-purple" />
                        <h3 className="text-sm font-medium text-muted-foreground">Total Integrations</h3>
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiCheckCircle className="w-5 h-5 text-wata-blue" />
                        <h3 className="text-sm font-medium text-muted-foreground">Connected</h3>
                    </div>
                    <p className="text-2xl font-bold">{stats.connected}</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiZap className="w-5 h-5 text-wata-cyan" />
                        <h3 className="text-sm font-medium text-muted-foreground">Available</h3>
                    </div>
                    <p className="text-2xl font-bold">{stats.available}</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search integrations..."
                        className="w-full glass rounded-lg pl-12 pr-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-2 glass rounded-lg p-1">
                    {(['all', 'connected', 'available'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${filter === f
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:bg-accent'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                    <div
                        key={integration.id}
                        className="glass rounded-xl p-6 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden"
                    >
                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${integration.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center text-2xl`}>
                                        {integration.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{integration.name}</h3>
                                        <span className="text-xs text-muted-foreground">{integration.category}</span>
                                    </div>
                                </div>

                                {integration.connected && (
                                    <FiCheckCircle className="w-5 h-5 text-green-500" />
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {integration.description}
                            </p>

                            {/* Stats (if connected) */}
                            {integration.connected && (
                                <div className="mb-4 p-3 rounded-lg bg-muted/20 border border-border/40">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Connections</p>
                                            <p className="font-semibold">{integration.connections}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Last Sync</p>
                                            <p className="font-semibold">{integration.last_sync}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {integration.connected ? (
                                    <>
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <FiSettings className="w-4 h-4 mr-2" />
                                            Configure
                                        </Button>
                                        <Button size="sm" variant="ghost">
                                            <FiExternalLink className="w-4 h-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button size="sm" className="w-full">
                                        <FiLink className="w-4 h-4 mr-2" />
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredIntegrations.length === 0 && (
                <div className="text-center py-16 glass rounded-xl">
                    <FiLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}
        </div>
    )
}
