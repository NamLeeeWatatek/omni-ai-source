import { useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

const REFRESH_INTERVAL = 4 * 60 * 1000
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000

export function useTokenRefresh() {
  const { data: session, update } = useSession()
  const refreshTimerRef = useRef<NodeJS.Timeout>()

  const refreshToken = useCallback(async () => {
    if (!session?.refreshToken) {

      return
    }

    try {


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


      await update({
        ...session,
        accessToken: data.token,
        refreshToken: data.refreshToken || session.refreshToken,
        tokenExpires: data.tokenExpires,
      })


    } catch (error) {

    }
  }, [session, update])

  const scheduleRefresh = useCallback(() => {

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    if (!session?.tokenExpires) {
      return
    }

    const now = Date.now()
    const expiresAt = session.tokenExpires
    const timeUntilExpiry = expiresAt - now


    if (timeUntilExpiry < TOKEN_EXPIRY_BUFFER) {
      refreshToken()
      return
    }

    const refreshIn = Math.min(REFRESH_INTERVAL, timeUntilExpiry - TOKEN_EXPIRY_BUFFER)



    refreshTimerRef.current = setTimeout(() => {
      refreshToken()
    }, refreshIn)
  }, [session?.tokenExpires, refreshToken])


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


  const manualRefresh = useCallback(async () => {
    await refreshToken()
  }, [refreshToken])

  return {
    refreshToken: manualRefresh,
    isRefreshing: false,
  }
}
