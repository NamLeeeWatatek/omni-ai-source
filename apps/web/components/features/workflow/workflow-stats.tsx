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
    const colorClasses = {
        blue: {
            bg: 'bg-blue-600/10',
            bgHover: 'group-hover:bg-blue-600/15',
            text: 'text-blue-600',
            glow: 'bg-blue-600/8'
        },
        green: {
            bg: 'bg-green-600/10',
            bgHover: 'group-hover:bg-green-600/15',
            text: 'text-green-600',
            glow: 'bg-green-600/8'
        },
        cyan: {
            bg: 'bg-cyan-600/10',
            bgHover: 'group-hover:bg-cyan-600/15',
            text: 'text-cyan-600',
            glow: 'bg-cyan-600/8'
        },
        indigo: {
            bg: 'bg-indigo-600/10',
            bgHover: 'group-hover:bg-indigo-600/15',
            text: 'text-indigo-600',
            glow: 'bg-indigo-600/8'
        }
    }

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue

    return (
        <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 ${colors.glow} rounded-full blur-3xl -mr-16 -mt-16 transition-all ${colors.bgHover}`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
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
                color="cyan"
                trend={{ value: 2, label: 'vs last month' }}
            />
            <StatCard
                title="Avg Duration"
                value={`${stats.avgDuration}s`}
                icon={FiClock}
                color="indigo"
                trend={{ value: -8, label: 'vs last month' }}
            />
        </div>
    )
}
