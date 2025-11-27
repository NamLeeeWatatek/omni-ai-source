import { FiActivity, FiCheckCircle, FiClock, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

interface StatCardProps {
    title: string
    value: string | number
    trend?: {
        value: number
        label: string
    }
    icon: React.ElementType
    color: string
}

function StatCard({ title, value, trend, icon: Icon, color }: StatCardProps) {
    return (
        <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-${color}-500/20`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <div className={`flex items-center text-xs font-medium ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trend.value >= 0 ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
    )
}

interface WorkflowStatsProps {
    stats: {
        total: number
        active: number
        successRate: number
        avgDuration: number
    }
}

export function WorkflowStats({ stats }: WorkflowStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
                title="Total Workflows"
                value={stats.total}
                icon={FiActivity}
                color="blue"
                trend={{ value: 12, label: 'vs last month' }}
            />
            <StatCard
                title="Active Workflows"
                value={stats.active}
                icon={FiCheckCircle}
                color="green"
                trend={{ value: 5, label: 'vs last month' }}
            />
            <StatCard
                title="Success Rate"
                value={`${stats.successRate}%`}
                icon={FiActivity}
                color="purple"
                trend={{ value: 2, label: 'vs last month' }}
            />
            <StatCard
                title="Avg Duration"
                value={`${stats.avgDuration}s`}
                icon={FiClock}
                color="orange"
                trend={{ value: -8, label: 'vs last month' }}
            />
        </div>
    )
}
