"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      refetchInterval={10 * 60} // Giảm từ 60s default xuống 10 phút
      refetchOnWindowFocus={false} // Không refetch khi focus window
      refetchWhenOffline={false} // Không refetch khi offline
    >
      {children}
    </NextAuthSessionProvider>
  );
}
