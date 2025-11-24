'use client'

import { Button } from '@wataomi/ui'
import {
    FiMessageSquare,
    FiTrendingUp,
    FiUsers,
    FiClock,
    FiArrowRight,
    FiZap
} from 'react-icons/fi'
import { FaRobot } from 'react-icons/fa'
import Link from 'next/link'

export default function DashboardPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Conversations"
                    value="2,847"
                    change="+12.5%"
                    icon={FiMessageSquare}
                    trend="up"
                />
                <StatCard
                    title="Active Bots"
                    value="8"
                    change="+2"
                    icon={FaRobot}
                    trend="up"
                />
                <StatCard
                    title="Avg Response Time"
                    value="1.2s"
                    change="-0.3s"
                    icon={FiClock}
                    trend="up"
                />
                <StatCard
                    title="Satisfaction Rate"
                    value="94%"
                    change="+3%"
                    icon={FiTrendingUp}
                    trend="up"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <Link href="/flows">
                    <div className="glass rounded-xl p-6 border border-border/40 hover:border-wata-purple/40 transition-all cursor-pointer group">
                        <div className="w-12 h-12 rounded-lg bg-gradient-wata flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiZap className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Create Flow</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Build a new conversation flow with WataFlow builder
                        </p>
                        <div className="flex items-center text-wata-purple text-sm font-medium">
                            Get Started
                            <FiArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                <Link href="/channels">
                    <div className="glass rounded-xl p-6 border border-border/40 hover:border-wata-blue/40 transition-all cursor-pointer group">
                        <div className="w-12 h-12 rounded-lg bg-wata-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiMessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Connect Channel</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Add WhatsApp, Messenger, or other channels
                        </p>
                        <div className="flex items-center text-wata-blue text-sm font-medium">
                            Add Channel
                            <FiArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                <Link href="/inbox">
                    <div className="glass rounded-xl p-6 border border-border/40 hover:border-wata-cyan/40 transition-all cursor-pointer group">
                        <div className="w-12 h-12 rounded-lg bg-wata-cyan flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiUsers className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">View Inbox</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Manage customer conversations in OmniInbox
                        </p>
                        <div className="flex items-center text-wata-cyan text-sm font-medium">
                            Open Inbox
                            <FiArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Conversations */}
            <div className="glass rounded-xl p-6 border border-border/40">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Recent Conversations</h2>
                    <Link href="/inbox">
                        <Button variant="ghost" size="sm">
                            View All
                            <FiArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
                <div className="space-y-4">
                    {recentConversations.map((conv) => (
                        <div
                            key={conv.id}
                            className="flex items-center space-x-4 p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                    {conv.customer.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-medium truncate">{conv.customer}</p>
                                    <span className="text-xs text-muted-foreground">{conv.time}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${conv.status === 'open'
                                ? 'bg-wata-purple/10 text-wata-purple'
                                : 'bg-green-500/10 text-green-500'
                                }`}>
                                {conv.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StatCard({
    title,
    value,
    change,
    icon: Icon,
    trend
}: {
    title: string
    value: string
    change: string
    icon: React.ElementType
    trend: 'up' | 'down'
}) {
    return (
        <div className="glass rounded-xl p-6 border border-border/40">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-wata flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                    {change}
                </span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{value}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    )
}

const recentConversations = [
    {
        id: '1',
        customer: 'Sarah Johnson',
        lastMessage: 'Thanks for the quick response!',
        time: '2m ago',
        status: 'open',
    },
    {
        id: '2',
        customer: 'Mike Chen',
        lastMessage: 'Can I get more information about pricing?',
        time: '15m ago',
        status: 'open',
    },
    {
        id: '3',
        customer: 'Emma Wilson',
        lastMessage: 'Perfect, that solved my issue.',
        time: '1h ago',
        status: 'resolved',
    },
    {
        id: '4',
        customer: 'David Brown',
        lastMessage: 'When will the new feature be available?',
        time: '2h ago',
        status: 'open',
    },
]
