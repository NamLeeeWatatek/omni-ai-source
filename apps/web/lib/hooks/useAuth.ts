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
  signOut: (options?: { redirect?: boolean; callbackUrl?: string }) => Promise<void>
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
      signOut: async (options?: { redirect?: boolean; callbackUrl?: string }) => {
        // Prevent concurrent or redundant sign-outs
        if (typeof window !== 'undefined' && (window as any)._isSigningOut) {
          return;
        }

        if (typeof window !== 'undefined') {
          (window as any)._isSigningOut = true;
        }

        try {
          // 1. Attempt backend logout to invalidate refresh token/session in DB
          // We do this BEFORE clearing local state so we still have the token
          const axiosClient = (await import('@/lib/axios-client')).default;
          // Fire and forget, or at least don't let it block local cleanup if it fails
          await axiosClient.post('/auth/logout').catch(err => {
            console.warn('[useAuth] Backend logout failed (likely already expired):', err.message);
          });

          // 2. Clear local browser storage (LocalStorage, SessionStorage, generic cookies)
          const { clearAuthBrowserData } = await import('@/lib/utils/auth-utils');
          clearAuthBrowserData();

        } catch (err) {
          console.error('[useAuth] Logout cleanup error:', err);
        } finally {
          // 3. Trigger next-auth signOut to clear HttpOnly session cookies
          const callbackUrl = options?.callbackUrl || '/login';

          if (options?.redirect !== false) {
            await nextAuthSignOut({ callbackUrl, redirect: true });
          } else {
            await nextAuthSignOut({ redirect: false });
            if (typeof window !== 'undefined') {
              (window as any)._isSigningOut = false;
            }
          }
        }
      },
    }
  }, [isAuthenticated, isLoading, session])

  return value
}

