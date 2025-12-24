import { useQuery } from '@tanstack/react-query'
import axiosClient from '@/lib/axios-client'
import { CACHE_TIMES } from '@/lib/constants/app'
import type { DashboardStats } from '@/lib/types'

// ✅ Query keys pattern - following TanStack Query v5 best practices
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
}

/**
 * Fetch dashboard statistics
 * Uses TanStack Query v5 for caching and state management
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            console.log('[useDashboardStats] Fetching...')

            const result = await axiosClient.get<DashboardStats>('/stats/dashboard')

            console.log('[useDashboardStats] Result:', result)
            console.log('[useDashboardStats] Type:', typeof result)
            console.log('[useDashboardStats] Undefined?', result === undefined)

            if (!result) {
                throw new Error('API returned no data')
            }

            return result as unknown as DashboardStats
        },
        staleTime: CACHE_TIMES.SHORT,
        gcTime: CACHE_TIMES.MEDIUM,
    })
}
