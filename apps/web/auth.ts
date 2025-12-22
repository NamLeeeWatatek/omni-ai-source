import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

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

  return {
    accessToken: refreshedTokens.token || refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken || token.refreshToken,
    accessTokenExpires: Date.now() + (refreshedTokens.tokenExpires || 60 * 60 * 1000),
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
        code: { type: "text" },
        state: { type: "text" },
        backendData: { type: "text" },
      },
      async authorize(credentials) {
        try {
          console.log('[NextAuth] Authorize called with credentials:', {
            hasBackendData: !!credentials?.backendData,
            hasCode: !!credentials?.code
          })

          if (credentials?.backendData) {
            const data = JSON.parse(credentials.backendData as string)
            
            console.log('[NextAuth] Parsed backend data:', {
              hasToken: !!data.token,
              hasUser: !!data.user,
              userId: data.user?.id,
              userEmail: data.user?.email,
              hasWorkspace: !!data.workspace,
              workspacesCount: data.workspaces?.length || 0
            })

            // âœ… Validate required fields
            if (!data.token || !data.user || !data.user.id || !data.user.email) {
              console.error('[NextAuth] Missing required fields in backend data')
              return null
            }

            const userName = data.user.name || data.user.firstName || data.user.email

            const user = {
              id: String(data.user.id),
              email: data.user.email,
              name: userName,
              accessToken: data.token,
              refreshToken: data.refreshToken,
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

            console.log('[NextAuth] Returning user object:', {
              id: user.id,
              email: user.email,
              hasAccessToken: !!user.accessToken,
              hasWorkspace: !!user.workspace
            })

            return user
          }

          if (!credentials?.code) {
            return null
          }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
          const response = await fetch(`${apiUrl}/auth/casdoor/callback`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: credentials.code,
              state: credentials.state,
            }),
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()
          
          console.log('[NextAuth] Fetched data from backend:', {
            hasToken: !!data.token,
            hasUser: !!data.user,
            userId: data.user?.id
          })

          // âœ… Validate required fields
          if (!data.token || !data.user || !data.user.id || !data.user.email) {
            console.error('[NextAuth] Missing required fields in backend response')
            return null
          }

          const userName = data.user.name || data.user.firstName || data.user.email

          return {
            id: String(data.user.id),
            email: data.user.email,
            name: userName,
            accessToken: data.token,
            refreshToken: data.refreshToken,
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        const authUser = user as AuthUser
        token.accessToken = authUser.accessToken
        token.refreshToken = authUser.refreshToken
        token.id = authUser.id
        token.workspace = authUser.workspace
        token.workspaces = authUser.workspaces
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000 // 1 hour
        token.error = undefined // Clear any errors on fresh login
      }

      // If there's a refresh error, don't try to refresh again
      if (token.error === "RefreshAccessTokenError") {
        console.log('[Auth] Previous refresh failed, skipping auto-refresh')
        return token
      }

      // Auto-refresh: Check if token is about to expire (5 min buffer)
      const shouldRefresh =
        typeof token.accessTokenExpires === 'number' &&
        Date.now() > token.accessTokenExpires - 5 * 60 * 1000

      if (shouldRefresh && token.refreshToken) {
        console.log('[Auth] Token expiring soon, refreshing...')
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

      // Extend session with custom properties
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
  debug: false, // Disable debug mode to reduce log noise
});
