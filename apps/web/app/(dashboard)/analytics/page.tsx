'use client'

import { FiBarChart2, FiTrendingUp, FiClock, FiUsers } from 'react-icons/fi'

export default function AnalyticsPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Analytics & Insights</h2>
                <p className="text-muted-foreground">
                    Track performance and measure engagement
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Conversations"
                    value="12,847"
                    change="+18.2%"
                    icon={FiUsers}
                />
                <MetricCard
                    title="Avg Response Time"
                    value="1.2s"
                    change="-0.4s"
                    icon={FiClock}
                />
                <MetricCard
                    title="Resolution Rate"
                    value="87%"
                    change="+5%"
                    icon={FiTrendingUp}
                />
                <MetricCard
                    title="Customer Satisfaction"
                    value="4.8/5"
                    change="+0.2"
                    icon={FiBarChart2}
                />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-6 border border-border/40">
                    <h3 className="text-lg font-semibold mb-4">Conversation Volume</h3>
                    <div className="h-64 flex items-end justify-around space-x-2">
                        {[65, 78, 82, 90, 75, 88, 95].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-wata rounded-t-lg transition-all hover:opacity-80"
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-xs text-muted-foreground mt-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-xl p-6 border border-border/40">
                    <h3 className="text-lg font-semibold mb-4">Channel Distribution</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'WhatsApp', value: 35, color: 'bg-green-500' },
                            { name: 'Web Chat', value: 28, color: 'bg-purple-500' },
                            { name: 'Messenger', value: 20, color: 'bg-blue-500' },
                            { name: 'Instagram', value: 12, color: 'bg-pink-500' },
                            { name: 'Others', value: 5, color: 'bg-gray-500' },
                        ].map((channel) => (
                            <div key={channel.name}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">{channel.name}</span>
                                    <span className="text-sm text-muted-foreground">{channel.value}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${channel.color}`}
                                        style={{ width: `${channel.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bot Performance */}
            <div className="glass rounded-xl p-6 border border-border/40">
                <h3 className="text-lg font-semibold mb-4">Bot Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/40">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Bot Name</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Conversations</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Avg Response</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Success Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'Support Bot', conversations: 4523, response: '0.8s', success: '92%' },
                                { name: 'Sales Bot', conversations: 3241, response: '1.2s', success: '88%' },
                                { name: 'FAQ Bot', conversations: 2847, response: '0.5s', success: '95%' },
                                { name: 'Booking Bot', conversations: 1956, response: '1.5s', success: '85%' },
                            ].map((bot) => (
                                <tr key={bot.name} className="border-b border-border/40 hover:bg-accent transition-colors">
                                    <td className="py-3 px-4 font-medium">{bot.name}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{bot.conversations}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{bot.response}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                                            {bot.success}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function MetricCard({
    title,
    value,
    change,
    icon: Icon
}: {
    title: string
    value: string
    change: string
    icon: React.ElementType
}) {
    return (
        <div className="glass rounded-xl p-6 border border-border/40">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-wata flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-green-500">{change}</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{value}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
        </div>
    )
}
