import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    Credentials({
      name: "Casdoor",
      credentials: {
        code: { label: "Code", type: "text" },
        state: { label: "State", type: "text" },
      },
      async authorize(credentials) {
        console.log("🔐 [NextAuth] authorize() called");
        console.log("📦 [NextAuth] credentials:", credentials);
        
        try {
          if (!credentials?.code) {
            console.error("❌ [NextAuth] No code provided");
            return null;
          }

          console.log("✅ [NextAuth] Code received:", String(credentials.code).substring(0, 10) + "...");

          // Gọi API backend để lấy token từ Casdoor
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
          const backendUrl = `${apiUrl}/casdoor/auth/callback`;
          
          console.log("🌐 [NextAuth] Calling backend:", backendUrl);
          console.log("📤 [NextAuth] Request body:", { code: credentials.code, state: credentials.state });

          const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: credentials.code,
              state: credentials.state,
            }),
          });

          console.log("📥 [NextAuth] Backend response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ [NextAuth] Backend error:", errorText);
            return null;
          }

          const data = await response.json();
          console.log("✅ [NextAuth] Backend response data:", data);
          console.log("👤 [NextAuth] User email:", data.user?.email);

          // Trả về user object với token
          const user = {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.name,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          };
          
          console.log("✅ [NextAuth] Returning user:", user);
          return user;
        } catch (error) {
          console.error("❌ [NextAuth] Auth error:", error);
          if (error instanceof Error) {
            console.error("❌ [NextAuth] Error message:", error.message);
            console.error("❌ [NextAuth] Error stack:", error.stack);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Lưu token vào JWT khi user đăng nhập
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Thêm token vào session để client có thể sử dụng
      if (session.user) {
        session.user.id = token.id as string;
      }
      (session as any).accessToken = token.accessToken as string;
      (session as any).refreshToken = token.refreshToken as string;
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

// Debug log
if (!process.env.NEXTAUTH_SECRET) {
  console.error("⚠️ NEXTAUTH_SECRET is not set!");
} else {
  console.log("✅ NEXTAUTH_SECRET is set (length:", process.env.NEXTAUTH_SECRET.length, ")");
}
