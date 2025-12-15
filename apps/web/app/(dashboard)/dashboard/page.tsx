"use client"

import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/Spinner"
import { FiActivity, FiMessageSquare, FiUsers, FiZap, FiTrendingUp, FiTrendingDown } from "react-icons/fi"
import axiosClient from "@/lib/axios-client"
import type { DashboardStats } from "@/lib/types"

export default function DashboardPage() {
    const { t } = useTranslation()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await axiosClient.get("/stats/dashboard")
                setStats(data)

            } catch {

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
                    <h1 className="text-3xl font-bold" suppressHydrationWarning>{t('dashboard.title')}</h1>
                    <p className="text-muted-foreground mt-1" suppressHydrationWarning>{t('dashboard.welcomeBack')}</p>
                </div>
                <Button suppressHydrationWarning>{t('dashboard.downloadReport')}</Button>
            </div>

            { }
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                { }
                <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-600/15" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-blue-600/10 text-blue-600">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            {stats?.users && formatGrowthRate(stats.users.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.users?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.totalUsers')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.users?.active || 0} {t('dashboard.stats.active')} Â· {stats?.users?.newUsers || 0} {t('dashboard.stats.new')}
                        </p>
                    </CardContent>
                </Card>

                { }
                <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-600/15" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-green-600/10 text-green-600">
                                <FiZap className="w-6 h-6" />
                            </div>
                            {stats?.bots && formatGrowthRate(stats.bots.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.bots?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.totalBots')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.bots?.active || 0} {t('dashboard.stats.active')} Â· {stats?.bots?.avgSuccessRate?.toFixed(1) || 0}% {t('dashboard.stats.success')}
                        </p>
                    </CardContent>
                </Card>

                { }
                <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-600/15" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-cyan-600/10 text-cyan-600">
                                <FiMessageSquare className="w-6 h-6" />
                            </div>
                            {stats?.conversations && formatGrowthRate(stats.conversations.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.conversations?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.conversations')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.conversations?.active || 0} {t('dashboard.stats.active')} Â· {stats?.conversations?.avgMessagesPerConversation?.toFixed(1) || 0} {t('dashboard.stats.avgMsgs')}
                        </p>
                    </CardContent>
                </Card>

                { }
                <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/8 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-600/15" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-indigo-600/10 text-indigo-600">
                                <FiActivity className="w-6 h-6" />
                            </div>
                            {stats?.flows && formatGrowthRate(stats.flows.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.flows?.totalExecutions || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.flowExecutions')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.flows?.successRate?.toFixed(1) || 0}% {t('dashboard.stats.success')} Â· {stats?.flows?.avgExecutionTime?.toFixed(1) || 0}s {t('dashboard.stats.avgTime')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            { }
            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                { }
                <Card>
                    <CardHeader className="border-b border-border/40">
                        <CardTitle className="text-xl" suppressHydrationWarning>{t('dashboard.stats.topPerformingBots')}</CardTitle>
                        <CardDescription suppressHydrationWarning>{t('dashboard.stats.botsMostConversations')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {stats?.topBots && stats.topBots.length > 0 ? (
                                stats.topBots.map((bot, index) => (
                                    <div key={bot.id} className="flex items-center gap-4" suppressHydrationWarning>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold shadow-md shadow-blue-600/30">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">{bot.name}</p>
                                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                {bot.count} {t('dashboard.stats.conversationsLabel')} Â· {bot.metric?.toFixed(1)}% {t('dashboard.stats.success')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8" suppressHydrationWarning>{t('dashboard.stats.noDataAvailable')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                { }
                <Card>
                    <CardHeader className="border-b border-border/40">
                        <CardTitle className="text-xl" suppressHydrationWarning>{t('dashboard.stats.mostUsedFlows')}</CardTitle>
                        <CardDescription suppressHydrationWarning>{t('dashboard.stats.flowsMostExecutions')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {stats?.topFlows && stats.topFlows.length > 0 ? (
                                stats.topFlows.map((flow, index) => (
                                    <div key={flow.id} className="flex items-center gap-4" suppressHydrationWarning>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-semibold shadow-md shadow-cyan-600/30">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">{flow.name}</p>
                                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                {flow.count} {t('dashboard.stats.executions')} Â· {flow.metric?.toFixed(1)}% {t('dashboard.stats.success')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8" suppressHydrationWarning>{t('dashboard.stats.noDataAvailable')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            { }
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-xl" suppressHydrationWarning>{t('dashboard.stats.workspaceOverview')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.totalWorkspaces')}</p>
                            <p className="text-2xl font-bold mt-1">{stats?.workspaces?.total || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.activeWorkspaces')}</p>
                            <p className="text-2xl font-bold mt-1">{stats?.workspaces?.active || 0}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.growthRate')}</p>
                            <div className="mt-1">
                                {stats?.workspaces && formatGrowthRate(stats.workspaces.growthRate)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
