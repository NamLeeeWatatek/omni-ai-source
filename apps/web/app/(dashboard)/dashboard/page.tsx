import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDashboardStats, FALLBACK_DASHBOARD_STATS } from '@/lib/server/dashboard.server'
import { DashboardClient } from '../DashboardClient'

export default async function DashboardPage() {
    // Check authentication on server
    const session = await auth()
    if (!session) {
        redirect('/login')
    }

    // Fetch dashboard stats on server for SEO
    const serverStats = await getDashboardStats()

    return (
        <DashboardClient
            initialStats={serverStats}
            user={session.user}
        />
    )
}
