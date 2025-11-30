/**
 * Hook for automatic token refresh
 */
import { useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { fetchAPI } from '@/lib/api'

const REFRESH_INTERVAL = 4 * 60 * 1000 // 4 minutes (token expires in 30min)
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000 // 5 minutes before expiry

export function useTokenRefresh() {
  const { data: session, update } = useSession()
  const refreshTimerRef = useRef<NodeJS.Timeout>()

  const refreshToken = useCallback(async () => {
    if (!session?.refreshToken) {
      console.log('⚠️ No refresh token available')
      return
    }

    try {
      console.log('🔄 Refreshing access token...')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.refreshToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()

      // Update session with new tokens
      await update({
        ...session,
        accessToken: data.token,
        refreshToken: data.refreshToken || session.refreshToken,
        tokenExpires: data.tokenExpires,
      })

      console.log('✅ Token refreshed successfully')
    } catch (error) {
      console.error('❌ Token refresh error:', error)
      // Token refresh failed - user will be redirected to login by axios interceptor
    }
  }, [session, update])

  const scheduleRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    if (!session?.tokenExpires) {
      return
    }

    const now = Date.now()
    const expiresAt = session.tokenExpires
    const timeUntilExpiry = expiresAt - now

    // If token expires in less than 5 minutes, refresh immediately
    if (timeUntilExpiry < TOKEN_EXPIRY_BUFFER) {
      console.log('⚡ Token expiring soon, refreshing immediately')
      refreshToken()
      return
    }

    // Otherwise, schedule refresh for 4 minutes from now
    const refreshIn = Math.min(REFRESH_INTERVAL, timeUntilExpiry - TOKEN_EXPIRY_BUFFER)

    console.log(`⏰ Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} minutes`)

    refreshTimerRef.current = setTimeout(() => {
      refreshToken()
    }, refreshIn)
  }, [session?.tokenExpires, refreshToken])

  // Set up automatic refresh
  useEffect(() => {
    if (session?.accessToken) {
      scheduleRefresh()
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [session?.accessToken, scheduleRefresh])

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    await refreshToken()
  }, [refreshToken])

  return {
    refreshToken: manualRefresh,
    isRefreshing: false, // Could add state to track this
  }
}
