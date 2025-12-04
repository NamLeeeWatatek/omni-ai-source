"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FiActivity, FiMessageSquare, FiUsers, FiZap, FiTrendingUp, FiTrendingDown } from "react-icons/fi"
import axiosClient from "@/lib/axios-client"
import type { DashboardStats } from "@/lib/types"

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await axiosClient.get("/stats/dashboard").then(r => r.data)
                setStats(data)

            } catch (error) {

                setStats(null)
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Spinner className="size-8 text-primary" />
            </div>
        )
    }

    const formatGrowthRate = (rate: number) => {
        const isPositive = rate >= 0
        return (
            <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                <span>{isPositive ? '+' : ''}{rate.toFixed(1)}%</span>
            </div>
        )
    }

    return (
        <div className="h-full">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
                </div>
                <Button>Download Report</Button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Users Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-blue-600/10 text-blue-600">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            {stats?.users && formatGrowthRate(stats.users.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.users?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.users?.active || 0} active · {stats?.users?.newUsers || 0} new
                        </p>
                    </div>
                </div>

                {/* Bots Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-green-600/10 text-green-600">
                                <FiZap className="w-6 h-6" />
                            </div>
                            {stats?.bots && formatGrowthRate(stats.bots.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.bots?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground">Total Bots</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.bots?.active || 0} active · {stats?.bots?.avgSuccessRate?.toFixed(1) || 0}% success
                        </p>
                    </div>
                </div>

                {/* Conversations Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-cyan-600/10 text-cyan-600">
                                <FiMessageSquare className="w-6 h-6" />
                            </div>
                            {stats?.conversations && formatGrowthRate(stats.conversations.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.conversations?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground">Conversations</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.conversations?.active || 0} active · {stats?.conversations?.avgMessagesPerConversation?.toFixed(1) || 0} avg msgs
                        </p>
                    </div>
                </div>

                {/* Flow Executions Card */}
                <div className="glass p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-600/15" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-600">
                                <FiActivity className="w-6 h-6" />
                            </div>
                            {stats?.flows && formatGrowthRate(stats.flows.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.flows?.totalExecutions || 0}</h3>
                        <p className="text-sm text-muted-foreground">Flow Executions</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.flows?.successRate?.toFixed(1) || 0}% success · {stats?.flows?.avgExecutionTime?.toFixed(1) || 0}s avg
                        </p>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                {/* Top Bots */}
                <div className="glass rounded-xl overflow-hidden">
                    <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
                        <h3 className="text-xl font-semibold">Top Performing Bots</h3>
                        <p className="text-sm text-muted-foreground">Bots with most conversations</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {stats?.topBots && stats.topBots.length > 0 ? (
                                stats.topBots.map((bot, index) => (
                                    <div key={bot.id} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold shadow-md shadow-blue-600/30">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">{bot.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {bot.count} conversations · {bot.metric?.toFixed(1)}% success
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Flows */}
                <div className="glass rounded-xl overflow-hidden">
                    <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
                        <h3 className="text-xl font-semibold">Most Used Flows</h3>
                        <p className="text-sm text-muted-foreground">Flows with most executions</p>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {stats?.topFlows && stats.topFlows.length > 0 ? (
                                stats.topFlows.map((flow, index) => (
                                    <div key={flow.id} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-semibold shadow-md shadow-cyan-600/30">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">{flow.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {flow.count} executions · {flow.metric?.toFixed(1)}% success
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Workspaces Stats */}
            <div className="glass rounded-xl overflow-hidden mt-6 p-6">
                <h3 className="text-xl font-semibold mb-4">Workspace Overview</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Workspaces</p>
                        <p className="text-2xl font-bold mt-1">{stats?.workspaces?.total || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Active Workspaces</p>
                        <p className="text-2xl font-bold mt-1">{stats?.workspaces?.active || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Growth Rate</p>
                        <div className="mt-1">
                            {stats?.workspaces && formatGrowthRate(stats.workspaces.growthRate)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
