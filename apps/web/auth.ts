import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

/**
 * Token Refresh Helper
 * Call backend to refresh access token using refresh token
 */
/**
 * ✅ Refresh Access Token
 * Calls backend /auth/refresh-token endpoint with refresh token in body
 */
async function refreshAccessToken(token: any) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'


    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Auth] ❌ Refresh failed:', response.status, errorText)
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const refreshedTokens = await response.json()

    console.log('[Auth] ✅ Token refreshed successfully')

    return {
      ...token,
      accessToken: refreshedTokens.token || refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + (refreshedTokens.tokenExpires || 60 * 60 * 1000),
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      error: undefined, // Clear any previous errors
    }
  } catch (error: any) {
    // Handle specific errors
    if (error.name === 'AbortError') {
      console.error('[Auth] ❌ Token refresh timeout (5s)')
    } else if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.error('[Auth] ❌ Cannot connect to backend')
    } else {
      console.error('[Auth] ❌ Token refresh error:', error.message)
    }

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
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

            // ✅ Validate required fields
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

          // ✅ Validate required fields
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
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = user.id;
        token.workspace = (user as any).workspace;
        token.workspaces = (user as any).workspaces;
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        token.error = undefined; // Clear any errors on fresh login
      }

      // If there's a refresh error, don't try to refresh again
      if (token.error === "RefreshAccessTokenError") {
        console.log('[Auth] ⚠️ Previous refresh failed, skipping auto-refresh');
        return token;
      }

      // ✅ Auto-refresh: Check if token is about to expire (5 min buffer)
      const shouldRefresh = token.accessTokenExpires && Date.now() > (token.accessTokenExpires as number) - 5 * 60 * 1000;

      if (shouldRefresh && token.refreshToken) {
        console.log('[Auth] 🔄 Token expiring soon, refreshing...');
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      (session as any).accessToken = token.accessToken as string;
      (session as any).refreshToken = token.refreshToken as string;
      (session as any).workspace = token.workspace;
      (session as any).workspaces = token.workspaces;
      (session as any).error = token.error; // Pass error to client
      return session;
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
  debug: true,
});