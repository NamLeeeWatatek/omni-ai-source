import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { DashboardClient } from '@/components/features/dashboard/DashboardClient'

export default async function DashboardPage() {
    // Check authentication on server
    const session = await auth()
    if (!session) {
        redirect('/login')
    }

    // Let client fetch data directly from backend API via React Query
    return (
        <DashboardClient
            initialStats={null}
            user={session.user}
        />
    )
}

