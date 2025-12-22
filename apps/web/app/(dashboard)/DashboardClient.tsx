'use client'

import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { PageLoading } from "@/components/ui/PageLoading"
import { FiActivity, FiMessageSquare, FiUsers, FiZap, FiTrendingUp, FiTrendingDown, FiDownload } from "react-icons/fi"
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/lib/services/api.service'
import { LazyWrapper } from '@/components/ui/LazyWrapper'
import { lazy } from 'react'
import type { DashboardStats } from "@/lib/types"
import type { Session } from 'next-auth'
import { CACHE_TIMES } from '@/lib/constants/app'

const LazyDashboardCharts = lazy(() => import('@/components/features/dashboard/DashboardCharts').then(module => ({ default: module.DashboardCharts })))

interface DashboardClientProps {
  initialStats: DashboardStats | null
  user: Session['user'] | null
}

export function DashboardClient({ initialStats, user }: DashboardClientProps) {
    const { t } = useTranslation()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => apiService.get<DashboardStats>("/stats/dashboard"),
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
        initialData: initialStats,
    })

    if (isLoading && !stats) {
        return <PageLoading message="Loading dashboard statistics..." />
    }

    const formatGrowthRate = useCallback((rate: number) => {
        const isPositive = rate >= 0
        return (
            <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <FiTrendingUp className="w-3 h-3 mr-1" /> : <FiTrendingDown className="w-3 h-3 mr-1" />}
                <span>{isPositive ? '+' : ''}{rate.toFixed(1)}%</span>
            </div>
        )
    }, [])

    return (
        <div className="page-container-full bg-grid-pattern min-h-full">
            <div className="page-header flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {t('dashboard.welcomeBack', { name: user?.name || 'User' })}
                    </p>
                </div>
                <Button className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <FiDownload className="mr-2 h-4 w-4" />
                    {t('dashboard.downloadReport')}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                {/* Users Card */}
                <Card className="card-hover overflow-hidden border-none bg-gradient-to-br from-card to-background/50 shadow-md">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-inner">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            {stats?.users && formatGrowthRate(stats.users.growthRate)}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold tracking-tighter">{stats?.users?.total || 0}</h3>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                {t('dashboard.stats.totalUsers')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/40">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.active')}</span>
                                <span className="text-sm font-semibold">{stats?.users?.active || 0}</span>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.new')}</span>
                                <span className="text-sm font-semibold">{stats?.users?.newUsers || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bots Card */}
                <Card className="card-hover overflow-hidden border-none bg-gradient-to-br from-card to-background/50 shadow-md">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-xl bg-success/10 text-success shadow-inner">
                                <FiZap className="w-6 h-6" />
                            </div>
                            {stats?.bots && formatGrowthRate(stats.bots.growthRate)}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold tracking-tighter">{stats?.bots?.total || 0}</h3>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                {t('dashboard.stats.totalBots')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/40">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.active')}</span>
                                <span className="text-sm font-semibold">{stats?.bots?.active || 0}</span>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.success')}</span>
                                <span className="text-sm font-semibold">{stats?.bots?.avgSuccessRate?.toFixed(1) || 0}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Conversations Card */}
                <Card className="card-hover overflow-hidden border-none bg-gradient-to-br from-card to-background/50 shadow-md">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-xl bg-info/10 text-info shadow-inner">
                                <FiMessageSquare className="w-6 h-6" />
                            </div>
                            {stats?.conversations && formatGrowthRate(stats.conversations.growthRate)}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold tracking-tighter">{stats?.conversations?.total || 0}</h3>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                {t('dashboard.stats.conversations')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/40">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.active')}</span>
                                <span className="text-sm font-semibold">{stats?.conversations?.active || 0}</span>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.avgMsgs')}</span>
                                <span className="text-sm font-semibold">{stats?.conversations?.avgMessagesPerConversation?.toFixed(1) || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Flows Card */}
                <Card className="card-hover overflow-hidden border-none bg-gradient-to-br from-card to-background/50 shadow-md">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 rounded-xl bg-warning/10 text-warning shadow-inner">
                                <FiActivity className="w-6 h-6" />
                            </div>
                            {stats?.flows && formatGrowthRate(stats.flows.growthRate)}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold tracking-tighter">{stats?.flows?.totalExecutions || 0}</h3>
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                {t('dashboard.stats.flowExecutions')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/40">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.success')}</span>
                                <span className="text-sm font-semibold">{stats?.flows?.successRate?.toFixed(1) || 0}%</span>
                            </div>
                            <div className="w-px h-8 bg-border/40" />
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground">{t('dashboard.stats.avgTime')}</span>
                                <span className="text-sm font-semibold">{stats?.flows?.avgExecutionTime?.toFixed(1) || 0}s</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Professional Charts Section */}
            {stats && (
                <div className="mt-8">
                    <LazyWrapper>
                        <LazyDashboardCharts
                            activityTrend={stats.activityTrend || []}
                            stats={stats}
                        />
                    </LazyWrapper>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-8 lg:grid-cols-2 mt-10">
                <Card className="border-none bg-gradient-to-br from-card to-background/30 shadow-md">
                    <CardHeader className="border-b border-border/20 px-6 py-5">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="w-1 h-6 bg-primary rounded-full" />
                            {t('dashboard.stats.topPerformingBots')}
                        </CardTitle>
                        <CardDescription className="ml-3">{t('dashboard.stats.botsMostConversations')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {stats?.topBots && stats.topBots.length > 0 ? (
                                stats.topBots.slice(0, 3).map((bot: any, index: number) => (
                                    <div key={bot.id} className="p-4 rounded-xl bg-muted/20 border border-border/5 group hover:bg-muted/30 transition-all duration-300">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg transform group-hover:scale-110 transition-transform">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{bot.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {bot.count} {t('dashboard.stats.conversationsLabel')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-success">{bot.metric?.toFixed(1)}%</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">{t('dashboard.stats.success')}</p>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary to-success transition-all duration-1000 ease-out"
                                                style={{ width: `${bot.metric || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">{t('dashboard.stats.noDataAvailable')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-card to-background/30 shadow-md">
                    <CardHeader className="border-b border-border/20 px-6 py-5">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="w-1 h-6 bg-info rounded-full" />
                            {t('dashboard.stats.workspaceOverview')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div key="active-workspaces" className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center text-center group hover:bg-primary/10 transition-colors">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                    <FiUsers className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-bold">{stats?.workspaces?.active || 0}</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard.stats.activeWorkspaces')}</span>
                            </div>
                            <div key="total-bots" className="p-5 rounded-2xl bg-success/5 border border-success/10 flex flex-col items-center text-center group hover:bg-success/10 transition-colors">
                                <div className="p-3 rounded-xl bg-success/10 text-success mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                    <FiZap className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-bold">{stats?.bots?.total || 0}</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard.stats.totalBots')}</span>
                            </div>
                            <div key="total-conversations" className="p-5 rounded-2xl bg-info/5 border border-info/10 flex flex-col items-center text-center group hover:bg-info/10 transition-colors">
                                <div className="p-3 rounded-xl bg-info/10 text-info mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                    <FiMessageSquare className="w-5 h-5" />
                                </div>
                                <span className="text-2xl font-bold">{stats?.conversations?.total || 0}</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard.stats.totalConversations')}</span>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{t('dashboard.stats.growthRate')}</p>
                            {stats?.workspaces && formatGrowthRate(stats.workspaces.growthRate)}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
