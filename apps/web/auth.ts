import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"

interface AuthUser {
  id: string
  email: string
  name: string
  accessToken: string
  refreshToken: string
  workspace?: {
    id: string
    name: string
    slug: string
    plan: string
    avatarUrl?: string | null
  }
  workspaces?: Array<{
    id: string
    name: string
    slug: string
    plan: string
    avatarUrl?: string | null
  }>
}

/**
 * Refresh Access Token
 * Simplified version - only called from NextAuth callbacks
 */
async function refreshAccessToken(token: {
  accessToken: string
  refreshToken: string
  accessTokenExpires: number
}): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpires: number
}> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const response = await fetch(`${apiUrl}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken: token.refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  const refreshedTokens = await response.json()

  // Backend returns 'tokenExpires' as a timestamp (ms)
  const expiresAt = refreshedTokens.tokenExpires || Date.now() + 60 * 60 * 1000

  return {
    accessToken: refreshedTokens.token,
    refreshToken: refreshedTokens.refreshToken ?? token.refreshToken, // Fallback to old refresh token if rotation isn't enforced
    accessTokenExpires: expiresAt,
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

          // Call backend email login
          const response = await fetch(`${apiUrl}/auth/email/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            const error = await response.text()
            console.error('[NextAuth] Login failed:', error)
            return null
          }

          const data = await response.json()

          if (!data.token || !data.user) {
            return null
          }

          const userName = data.user.name || data.user.firstName || data.user.email

          return {
            id: String(data.user.id),
            email: data.user.email,
            name: userName,
            accessToken: data.token,
            refreshToken: data.refreshToken,
            tokenExpires: data.tokenExpires, // Capture backend expiry
            workspace: data.workspace ? {
              id: data.workspace.id,
              name: data.workspace.name,
              slug: data.workspace.slug,
              plan: data.workspace.plan,
              avatarUrl: data.workspace.avatarUrl || null,
            } : null,
            workspaces: data.workspaces?.map((ws: any) => ({
              id: ws.id,
              name: ws.name,
              slug: ws.slug,
              plan: ws.plan,
              avatarUrl: ws.avatarUrl || null,
            })) || [],
          }
        } catch (error) {
          console.error('[NextAuth] Authorize error:', error)
          return null
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        const authUser = user as AuthUser

        // 1. Handle Social Login Token Exchange
        if (account && (account.provider === 'google' || account.provider === 'facebook')) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
          let endpoint = ''
          let body = {}

          if (account.provider === 'google') {
            endpoint = '/auth/google/login'
            body = { idToken: account.id_token }
          } else if (account.provider === 'facebook') {
            endpoint = '/auth/facebook/login'
            body = { accessToken: account.access_token }
          }

          try {
            const response = await fetch(`${apiUrl}${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            })

            if (response.ok) {
              const data = await response.json()
              token.accessToken = data.token
              token.refreshToken = data.refreshToken
              token.id = String(data.user.id)
              token.workspace = data.workspace
              token.workspaces = data.workspaces
              // Capture backend expiry if available
              if (data.tokenExpires) {
                token.accessTokenExpires = data.tokenExpires
              }
            } else {
              console.error('[NextAuth] Social login backend exchange failed')
            }
          } catch (e) {
            console.error('[NextAuth] Social login backend exchange error', e)
          }
        }
        // 2. Handle Credentials Login (auth data already in user object)
        else {
          token.accessToken = authUser.accessToken
          token.refreshToken = authUser.refreshToken
          token.id = authUser.id
          token.workspace = authUser.workspace
          token.workspaces = authUser.workspaces

          if ((authUser as any).tokenExpires) {
            token.accessTokenExpires = (authUser as any).tokenExpires
          }
        }

        // 3. Fallback expiry if not set (1 hour)
        if (!token.accessTokenExpires) {
          token.accessTokenExpires = Date.now() + 60 * 60 * 1000
        }

        token.error = undefined
      }

      // If there's a refresh error, don't try to refresh again
      if (token.error === "RefreshAccessTokenError") {
        return token
      }

      // Auto-refresh: Check if token is about to expire (5 min buffer)
      const shouldRefresh =
        typeof token.accessTokenExpires === 'number' &&
        Date.now() > token.accessTokenExpires - 5 * 60 * 1000

      if (shouldRefresh && token.refreshToken) {
        try {
          const refreshedTokens = await refreshAccessToken({
            accessToken: token.accessToken as string,
            refreshToken: token.refreshToken as string,
            accessTokenExpires: token.accessTokenExpires as number,
          })

          token.accessToken = refreshedTokens.accessToken
          token.refreshToken = refreshedTokens.refreshToken
          token.accessTokenExpires = refreshedTokens.accessTokenExpires
          token.error = undefined
        } catch (error) {
          console.error('[Auth] Token refresh failed:', error)
          token.error = "RefreshAccessTokenError"
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }

      return {
        ...session,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        workspace: token.workspace,
        workspaces: token.workspaces,
        error: token.error,
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});
