import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

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
          if (credentials?.backendData) {
            const data = JSON.parse(credentials.backendData as string)
            
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
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = user.id;
        token.workspace = (user as any).workspace;
        token.workspaces = (user as any).workspaces;
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
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
});
