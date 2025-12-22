import { cookies } from 'next/headers'
import axiosClient from '@/lib/axios-client'
import type { DashboardStats } from '@/lib/types'

/**
 * Server-side function to fetch dashboard statistics
 * This runs on the server and can be used in Server Components
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get auth token from cookies (set by NextAuth)
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('next-auth.session-token')?.value ||
                        cookieStore.get('__Secure-next-auth.session-token')?.value

    if (!sessionToken) {
      console.warn('No session token found for dashboard stats')
      return FALLBACK_DASHBOARD_STATS as DashboardStats
    }

    // Fetch dashboard stats from API
    const response = await axiosClient.get<DashboardStats>('/stats/dashboard', {
      headers: {
        Cookie: `next-auth.session-token=${sessionToken}`,
      },
    })

    return response || FALLBACK_DASHBOARD_STATS as DashboardStats
  } catch (error) {
    console.error('Failed to fetch dashboard stats on server:', error)
    return FALLBACK_DASHBOARD_STATS as DashboardStats
  }
}

/**
 * Fallback dashboard stats for when server fetch fails
 */
export const FALLBACK_DASHBOARD_STATS: Partial<DashboardStats> = {
  users: {
    total: 0,
    active: 0,
    newUsers: 0,
    current: 0,
    previous: 0,
    growthRate: 0,
  },
  bots: {
    total: 0,
    active: 0,
    inactive: 0,
    avgSuccessRate: 0,
    current: 0,
    previous: 0,
    growthRate: 0,
  },
  conversations: {
    total: 0,
    active: 0,
    completed: 0,
    avgMessagesPerConversation: 0,
    current: 0,
    previous: 0,
    growthRate: 0,
  },
  flows: {
    total: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    successRate: 0,
    avgExecutionTime: 0,
    current: 0,
    previous: 0,
    growthRate: 0,
  },
  workspaces: {
    total: 0,
    active: 0,
    current: 0,
    previous: 0,
    growthRate: 0,
  },
  activityTrend: [],
  topBots: [],
  generatedAt: new Date(),
}
