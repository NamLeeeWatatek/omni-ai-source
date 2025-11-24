'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@wataomi/ui'
import {
    FiPlus,
    FiSearch,
    FiGitMerge,
    FiRadio,
    FiMessageSquare,
    FiSettings,
    FiMoreVertical,
    FiTrendingUp,
    FiActivity
} from 'react-icons/fi'
import { FaRobot } from 'react-icons/fa'

export default function BotsPage() {
    const [searchQuery, setSearchQuery] = useState('')

    const bots = [
        {
            id: 1,
            name: 'Customer Support Bot',
            description: 'Handles customer inquiries and support tickets',
            status: 'active',
            workflows: 3,
            channels: 4,
            conversations: 1245,
            success_rate: 94,
            created_at: '2024-01-15T10:30:00Z'
        },
        {
            id: 2,
            name: 'Sales Assistant',
            description: 'Qualifies leads and schedules demos',
            status: 'active',
            workflows: 2,
            channels: 2,
            conversations: 856,
            success_rate: 89,
            created_at: '2024-01-18T09:15:00Z'
        },
        {
            id: 3,
            name: 'Order Tracker',
            description: 'Provides order status and tracking information',
            status: 'inactive',
            workflows: 1,
            channels: 3,
            conversations: 432,
            success_rate: 98,
            created_at: '2024-01-20T14:22:00Z'
        }
    ]

    const filteredBots = bots.filter(bot =>
        bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Bots</h1>
                    <p className="text-muted-foreground">
                        Manage your AI bots and their configurations
                    </p>
                </div>
                <Button>
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Bot
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FaRobot className="w-5 h-5 text-wata-purple" />
                        <h3 className="text-sm font-medium text-muted-foreground">Total Bots</h3>
                    </div>
                    <p className="text-2xl font-bold">{bots.length}</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiActivity className="w-5 h-5 text-wata-blue" />
                        <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {bots.filter(b => b.status === 'active').length}
                    </p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiMessageSquare className="w-5 h-5 text-wata-cyan" />
                        <h3 className="text-sm font-medium text-muted-foreground">Conversations</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {bots.reduce((sum, bot) => sum + bot.conversations, 0).toLocaleString()}
                    </p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <FiTrendingUp className="w-5 h-5 text-wata-pink" />
                        <h3 className="text-sm font-medium text-muted-foreground">Avg Success Rate</h3>
                    </div>
                    <p className="text-2xl font-bold">
                        {Math.round(bots.reduce((sum, bot) => sum + bot.success_rate, 0) / bots.length)}%
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bots..."
                        className="w-full glass rounded-lg pl-12 pr-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Bots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBots.map((bot) => (
                    <div
                        key={bot.id}
                        className="glass rounded-xl p-6 hover:border-primary/40 transition-all duration-300 group relative overflow-hidden"
                    >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-wata-purple/5 via-transparent to-wata-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-wata-purple to-wata-blue flex items-center justify-center">
                                        <FaRobot className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{bot.name}</h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bot.status === 'active'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                            }`}>
                                            {bot.status}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <FiMoreVertical className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {bot.description}
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-border/40">
                                <div>
                                    <div className="flex items-center gap-1 mb-1">
                                        <FiGitMerge className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Workflows</p>
                                    </div>
                                    <p className="text-lg font-semibold">{bot.workflows}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 mb-1">
                                        <FiRadio className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Channels</p>
                                    </div>
                                    <p className="text-lg font-semibold">{bot.channels}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 mb-1">
                                        <FiMessageSquare className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground">Chats</p>
                                    </div>
                                    <p className="text-lg font-semibold">{bot.conversations}</p>
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">Success Rate</span>
                                    <span className="text-xs font-semibold">{bot.success_rate}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-wata-purple to-wata-cyan transition-all duration-300"
                                        style={{ width: `${bot.success_rate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="flex-1">
                                    <FiSettings className="w-4 h-4 mr-2" />
                                    Configure
                                </Button>
                                <Link href={`/flows?bot_id=${bot.id}`} className="flex-1">
                                    <Button size="sm" variant="ghost" className="w-full">
                                        <FiGitMerge className="w-4 h-4 mr-2" />
                                        Workflows
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredBots.length === 0 && (
                <div className="text-center py-16 glass rounded-xl">
                    <FaRobot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bots found</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchQuery
                            ? 'Try adjusting your search'
                            : 'Create your first bot to get started'}
                    </p>
                    <Button>
                        <FiPlus className="w-4 h-4 mr-2" />
                        Create Bot
                    </Button>
                </div>
            )}
        </div>
    )
}
