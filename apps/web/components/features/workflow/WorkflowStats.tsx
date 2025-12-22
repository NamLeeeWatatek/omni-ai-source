import { FiActivity, FiCheckCircle, FiClock, FiZap, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { motion } from 'framer-motion'

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
            text: 'text-blue-500',
            glow: 'bg-blue-600/5',
            border: 'border-blue-500/20'
        },
        green: {
            bg: 'bg-green-600/10',
            bgHover: 'group-hover:bg-green-600/15',
            text: 'text-green-500',
            glow: 'bg-green-600/5',
            border: 'border-green-500/20'
        },
        cyan: {
            bg: 'bg-cyan-600/10',
            bgHover: 'group-hover:bg-cyan-600/15',
            text: 'text-cyan-500',
            glow: 'bg-cyan-600/5',
            border: 'border-cyan-500/20'
        },
        indigo: {
            bg: 'bg-indigo-600/10',
            bgHover: 'group-hover:bg-indigo-600/15',
            text: 'text-indigo-400',
            glow: 'bg-indigo-600/5',
            border: 'border-indigo-500/20'
        }
    }

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`glass p-6 rounded-2xl relative overflow-hidden group border ${colors.border} transition-all duration-300 bg-card/30`}
        >
            <div className={`absolute -top-12 -right-12 w-32 h-32 ${colors.glow} rounded-full blur-3xl transition-all duration-500 group-hover:scale-150`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3.5 rounded-xl ${colors.bg} ${colors.text} border ${colors.border} shadow-lg shadow-black/5`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <div className={`flex items-center text-[11px] font-bold tracking-tight px-2 py-1 rounded-full ${trend.value >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {trend.value >= 0 ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-3xl font-extrabold tracking-tight group-hover:text-primary transition-colors">{value}</h3>
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider opacity-60">{title}</p>
                </div>
            </div>
        </motion.div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard
                title="Total Engines"
                value={stats.total}
                icon={FiZap}
                color="blue"
                trend={{ value: 8, label: 'vs last month' }}
            />
            <StatCard
                title="Active Flows"
                value={stats.active}
                icon={FiCheckCircle}
                color="green"
                trend={{ value: 15, label: 'vs last month' }}
            />
            <StatCard
                title="Health Factor"
                value={`${stats.successRate || 100}%`}
                icon={FiActivity}
                color="cyan"
                trend={{ value: 3, label: 'vs last month' }}
            />
            <StatCard
                title="Processing Latency"
                value={`${stats.avgDuration || 1.2}s`}
                icon={FiClock}
                color="indigo"
                trend={{ value: -12, label: 'vs last month' }}
            />
        </div>
    )
}

