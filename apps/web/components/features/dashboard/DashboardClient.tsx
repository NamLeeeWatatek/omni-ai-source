'use client'

import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button"
import { FiDownload } from "react-icons/fi"
import { LazyWrapper } from '@/components/ui/LazyWrapper'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { lazy } from 'react'
import type { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { DashboardStatsCards } from '@/components/features/dashboard/DashboardStatsCards'
import { DashboardTopBots } from '@/components/features/dashboard/DashboardTopBots'
import { DashboardWorkspaceOverview } from '@/components/features/dashboard/DashboardWorkspaceOverview'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import type { DashboardStats } from "@/lib/types"
import { AlertTriangle, Database } from 'lucide-react'

const LazyDashboardCharts = lazy(() => import('@/components/features/dashboard/DashboardCharts').then(module => ({ default: module.DashboardCharts })))

interface DashboardClientProps {
    initialStats: DashboardStats | null
    user: Session['user'] | null
}

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
}

export function DashboardClient({ initialStats, user }: DashboardClientProps) {
    const { t } = useTranslation()

    // ✅ Use custom hook - clean separation of concerns
    const { data: stats, isLoading, error } = useDashboardStats()

    // ✅ Use Spinner component for loading
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
            </div>
        )
    }
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full min-h-full pb-12 bg-grid-pattern"
        >
            <div className="page-header flex items-center justify-between mb-10">
                <motion.div variants={itemVariants}>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg font-medium opacity-80">
                        {t('dashboard.welcomeBack', { name: user?.name || 'User' })}
                    </p>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Button variant="outline" rounded="xl" className="glass shadow-lg hover:shadow-xl transition-all duration-300">
                        <FiDownload className="mr-2 h-4 w-4" />
                        {t('dashboard.downloadReport')}
                    </Button>
                </motion.div>
            </div>

            {/* Stats Cards */}
            <DashboardStatsCards stats={stats} itemVariants={itemVariants} />

            {/* Professional Charts Section */}
            {stats && (
                <motion.div variants={itemVariants} className="mt-8">
                    <LazyWrapper>
                        <LazyDashboardCharts
                            activityTrend={stats.activityTrend || []}
                            stats={stats}
                        />
                    </LazyWrapper>
                </motion.div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-8 lg:grid-cols-2 mt-12">
                <motion.div variants={itemVariants}>
                    <DashboardTopBots stats={stats} />
                </motion.div>

                <motion.div variants={itemVariants}>
                    <DashboardWorkspaceOverview stats={stats} />
                </motion.div>
            </div>
        </motion.div>
    )
}
