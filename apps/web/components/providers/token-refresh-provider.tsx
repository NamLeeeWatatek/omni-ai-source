'use client'

import { useTokenRefresh } from '@/lib/hooks/useTokenRefresh'

/**
 * Provider component that handles automatic token refresh
 * Should be placed inside SessionProvider
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  // This hook will automatically refresh tokens
  useTokenRefresh()

  return <>{children}</>
}
