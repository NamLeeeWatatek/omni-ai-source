"use client"

import { useEffect, useState } from "react"
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/Spinner"
import { FiActivity, FiMessageSquare, FiUsers, FiZap, FiTrendingUp, FiTrendingDown, FiDownload } from "react-icons/fi"
import axiosClient from "@/lib/axios-client"
import type { DashboardStats } from "@/lib/types"
import { DashboardCharts } from "@/components/features/dashboard/DashboardCharts"

export default function DashboardPage() {
    const { t } = useTranslation()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await axiosClient.get("/stats/dashboard")
                setStats(response.data)
            } catch (error) {
                console.error('Failed to load dashboard stats:', error)
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

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Users Card */}
                <Card className="card-hover">
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            {stats?.users && formatGrowthRate(stats.users.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.users?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.totalUsers')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.users?.active || 0} {t('dashboard.stats.active')} · {stats?.users?.newUsers || 0} {t('dashboard.stats.new')}
                        </p>
                    </CardContent>
                </Card>

                {/* Bots Card */}
                <Card className="card-hover">
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-success/10 text-success">
                                <FiZap className="w-6 h-6" />
                            </div>
                            {stats?.bots && formatGrowthRate(stats.bots.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.bots?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.totalBots')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.bots?.active || 0} {t('dashboard.stats.active')} · {stats?.bots?.avgSuccessRate?.toFixed(1) || 0}% {t('dashboard.stats.success')}
                        </p>
                    </CardContent>
                </Card>

                {/* Conversations Card */}
                <Card className="card-hover">
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-info/10 text-info">
                                <FiMessageSquare className="w-6 h-6" />
                            </div>
                            {stats?.conversations && formatGrowthRate(stats.conversations.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.conversations?.total || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.conversations')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.conversations?.active || 0} {t('dashboard.stats.active')} · {stats?.conversations?.avgMessagesPerConversation?.toFixed(1) || 0} {t('dashboard.stats.avgMsgs')}
                        </p>
                    </CardContent>
                </Card>

                {/* Flows Card */}
                <Card className="card-hover">
                    <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-warning/10 text-warning">
                                <FiActivity className="w-6 h-6" />
                            </div>
                            {stats?.flows && formatGrowthRate(stats.flows.growthRate)}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats?.flows?.totalExecutions || 0}</h3>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{t('dashboard.stats.flowExecutions')}</p>
                        <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                            {stats?.flows?.successRate?.toFixed(1) || 0}% {t('dashboard.stats.success')} · {stats?.flows?.avgExecutionTime?.toFixed(1) || 0}s {t('dashboard.stats.avgTime')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Professional Charts Section */}
            {stats && (
                <DashboardCharts 
                    activityTrend={stats.activityTrend || []} 
                    stats={stats} 
                />
            )}

            {/* Summary Cards */}
            <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <Card>
                    <CardHeader className="border-b border-border/40">
                        <CardTitle className="text-xl" suppressHydrationWarning>{t('dashboard.stats.topPerformingBots')}</CardTitle>
                        <CardDescription suppressHydrationWarning>{t('dashboard.stats.botsMostConversations')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {stats?.topBots && stats.topBots.length > 0 ? (
                                stats.topBots.slice(0, 3).map((bot, index) => (
                                    <div key={bot.id} className="flex items-center gap-4" suppressHydrationWarning>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold shadow-md">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">{bot.name}</p>
                                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                {bot.count} {t('dashboard.stats.conversationsLabel')} · {bot.metric?.toFixed(1)}% {t('dashboard.stats.success')}
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

                <Card>
                    <CardHeader className="border-b border-border/40">
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
        </div>
    )
}
