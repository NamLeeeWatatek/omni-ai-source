import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { setCurrentWorkspace, setWorkspaces } from "@/lib/store/slices/workspaceSlice";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;
  const accessToken = (session as any)?.accessToken;
  const workspace = (session as any)?.workspace;
  const workspaces = (session as any)?.workspaces;
  const error = (session as any)?.error;

  const fetchWorkspaceFromAPI = useCallback(async () => {
    if (!accessToken) return;

    try {
      const { default: axiosClient } = await import('@/lib/axios-client');
      const [currentWsResponse, allWsResponse] = await Promise.all([
        axiosClient.get('/workspaces/current', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axiosClient.get('/workspaces', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const currentWs = currentWsResponse.data;
      const allWs = allWsResponse.data;

      if (currentWs) {
        dispatch(setCurrentWorkspace(currentWs));
      }
      if (allWs && Array.isArray(allWs)) {
        dispatch(setWorkspaces(allWs));
      }
    } catch {

    }
  }, [accessToken, dispatch]);

  // Handle refresh token error - auto logout
  useEffect(() => {
    if (error === "RefreshAccessTokenError") {
      console.log('[Auth] ⚠️ Refresh token expired, logging out...');
      nextAuthSignOut({ redirect: false }).then(() => {
        router.push("/login?error=session_expired");
      });
    }
  }, [error, router]);

  useEffect(() => {
    if (workspace) {
      dispatch(setCurrentWorkspace(workspace));
    }
    if (workspaces && Array.isArray(workspaces)) {

      dispatch(setWorkspaces(workspaces));
    }

    if (isAuthenticated && !workspace && accessToken) {
      fetchWorkspaceFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, workspaces, isAuthenticated, accessToken]);

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/login");
  };

  return {
    user,
    accessToken,
    workspace,
    workspaces,
    isAuthenticated,
    isLoading,
    signOut,
  };
}
