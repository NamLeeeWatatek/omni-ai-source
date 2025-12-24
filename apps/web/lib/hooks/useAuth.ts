'use client'

import { useMemo } from 'react'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

export interface UseAuthReturn {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  accessToken?: string
  workspace?: any | null
  workspaces?: any[] | undefined
  error?: string
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.accessToken

  const value = useMemo<UseAuthReturn>(() => {
    return {
      isAuthenticated,
      isLoading,
      user: session?.user ?? null,
      accessToken: session?.accessToken,
      workspace: session?.workspace ?? null,
      workspaces: session?.workspaces,
      error: session?.error as string,
      signOut: async () => {
        try {
          // Attempt backward logout to invalidate refresh token
          const axiosClient = (await import('@/lib/axios-client')).default;
          await axiosClient.post('/auth/logout');
        } catch (err) {
          console.warn('Backend logout failed', err);
        } finally {
          await nextAuthSignOut({ callbackUrl: '/login' });
        }
      },
    }
  }, [isAuthenticated, isLoading, session])

  return value
}

