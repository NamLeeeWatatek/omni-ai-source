import { DefaultSession } from "next-auth"

// Minimal workspace info stored in session
export interface SessionWorkspace {
  id: string
  name: string
  slug: string
  plan: string
  avatarUrl?: string | null
}

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    tokenExpires?: number
    workspace?: SessionWorkspace | null
    workspaces?: SessionWorkspace[]
    user: {
      id: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    accessToken?: string
    refreshToken?: string
    workspace?: SessionWorkspace | null
    workspaces?: SessionWorkspace[]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    id?: string
    workspace?: SessionWorkspace | null
    workspaces?: SessionWorkspace[]
  }
}
