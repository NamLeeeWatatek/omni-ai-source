'use client'

import { useTokenRefresh } from '@/lib/hooks/useTokenRefresh'
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useTokenRefresh()
  return <>{children}</>
}
