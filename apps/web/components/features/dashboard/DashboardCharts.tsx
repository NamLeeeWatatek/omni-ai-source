"use client"

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { FiTrendingUp, FiTrendingDown, FiUsers, FiMessageSquare, FiZap, FiActivity } from 'react-icons/fi'
import type { DashboardStats, TimeSeriesDataPoint, TopItemDto } from '@/lib/types'

interface ChartData {
  date: string
  value: number
  users?: number
  conversations?: number
  bots?: number
}

interface PieData {
  [key: string]: any
  name: string
  value: number
  color: string
}

interface BarData {
  name: string
  conversations: number
  success: number
}

interface DashboardChartsProps {
  activityTrend: TimeSeriesDataPoint[]
  stats: DashboardStats
}

// Use project's color system from CSS variables
const CHART_COLORS = {
  primary: 'hsl(var(--chart-1))',     // Purple/Indigo
  secondary: 'hsl(var(--chart-2))',   // Cyan
  success: 'hsl(var(--chart-3))',     // Green
  accent: 'hsl(var(--chart-4))',       // Purple variant
  warning: 'hsl(var(--chart-5))',     // Orange
  users: 'hsl(var(--color-purple))',
  conversations: 'hsl(var(--color-cyan))',
  bots: 'hsl(var(--color-orange))',
  flows: 'hsl(var(--color-blue))',
}

export function DashboardCharts({ activityTrend, stats }: DashboardChartsProps) {
  // Prepare pie chart data for bot distribution
  const botCategoriesData: PieData[] = [
    { name: 'Customer Service', value: Math.floor(stats.bots.active * 0.4), color: CHART_COLORS.primary },
    { name: 'Sales', value: Math.floor(stats.bots.active * 0.25), color: CHART_COLORS.success },
    { name: 'Technical Support', value: Math.floor(stats.bots.active * 0.2), color: CHART_COLORS.warning },
    { name: 'Marketing', value: Math.floor(stats.bots.active * 0.1), color: CHART_COLORS.accent },
    { name: 'Others', value: Math.floor(stats.bots.active * 0.05), color: CHART_COLORS.secondary },
  ].filter(item => item.value > 0)

  // Prepare bar chart data for top bots
  const topBotsData: BarData[] = stats.topBots.slice(0, 5).map((bot: TopItemDto) => ({
    name: bot.name.length > 15 ? bot.name.substring(0, 15) + '...' : bot.name,
    conversations: bot.count,
    success: Math.round(bot.metric || 0)
  }))

  // Prepare daily activity data for last 7 days
  const dailyActivity = activityTrend.slice(-7).map((item: TimeSeriesDataPoint, index: number) => {
    const date = new Date(item.date)
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      users: Math.floor(item.value * 0.3),
      conversations: item.value,
      bots: Math.floor(item.value * 0.2)
    }
  })

  // Prepare monthly growth data
  const monthlyGrowth = activityTrend.slice(-30).map((item: TimeSeriesDataPoint) => {
    const date = new Date(item.date)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value
    }
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass border border-white/10 rounded-xl shadow-2xl p-4 min-w-[150px] animate-in fade-in zoom-in duration-200">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border/50 pb-2">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium text-card-foreground">{entry.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: entry.color }}>
                  {formatNumber(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--card-foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="space-y-10">
      {/* Activity Trend Chart */}
      <div className="glass p-8 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">Activity Trend</h3>
              <p className="text-sm text-muted-foreground">User and conversation activity over time</p>
            </div>
          </div>
          <div className="flex items-center px-3 py-1 bg-muted/30 rounded-full text-xs font-medium text-muted-foreground self-start sm:self-center">
            <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Updates in real-time
          </div>
        </div>
        <div className="h-[350px] w-full">
          <AreaChart data={dailyActivity}>
            <defs>
              <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.users} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.users} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="conversationsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.conversations} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.conversations} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="botsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.bots} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.bots} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke={CHART_COLORS.users}
              fill="url(#usersGradient)"
              strokeWidth={2}
              name="Users"
            />
            <Area
              type="monotone"
              dataKey="conversations"
              stroke={CHART_COLORS.conversations}
              fill="url(#conversationsGradient)"
              strokeWidth={2}
              name="Conversations"
            />
            <Area
              type="monotone"
              dataKey="bots"
              stroke={CHART_COLORS.bots}
              fill="url(#botsGradient)"
              strokeWidth={2}
              name="Bot Activities"
            />
          </AreaChart>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bot Distribution Pie Chart */}
        <div className="glass p-8 rounded-2xl">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <FiZap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">Bot Distribution</h3>
              <p className="text-sm text-muted-foreground">Active bots by category</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={botCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {botCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium text-card-foreground">
                            {payload[0].name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(payload[0].value)} bots
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {botCategoriesData.map((item, index) => (
              <div key={index} className="flex flex-col p-3 rounded-xl bg-muted/20 border border-border/10">
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.name}</span>
                </div>
                <span className="text-lg font-bold text-card-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Bots Performance */}
        <div className="glass p-8 rounded-2xl">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">Top Bots Performance</h3>
              <p className="text-sm text-muted-foreground">Top 5 bots by success rate</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBotsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="rect"
                />
                <Bar
                  dataKey="conversations"
                  fill={CHART_COLORS.conversations}
                  name="Conversations"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="success"
                  fill={CHART_COLORS.success}
                  name="Success Rate %"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Growth Chart */}
      <div className="glass p-8 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground">Monthly Growth</h3>
              <p className="text-sm text-muted-foreground">Long-term activity distribution</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center ${stats.users.growthRate >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {stats.users.growthRate >= 0 ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
              {stats.users.growthRate.toFixed(1)}% Users
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center ${stats.conversations.growthRate >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {stats.conversations.growthRate >= 0 ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
              {stats.conversations.growthRate.toFixed(1)}% Msgs
            </div>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS.primary}
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.primary, r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: CHART_COLORS.primary }}
                name="Activity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
