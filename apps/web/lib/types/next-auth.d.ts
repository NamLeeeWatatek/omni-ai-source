import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
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
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    id?: string
  }
}
