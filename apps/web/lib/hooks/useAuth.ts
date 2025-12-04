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
    } catch (error) {

    }
  }, [accessToken, dispatch]);

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
  }, [workspace, workspaces, dispatch, isAuthenticated, accessToken, fetchWorkspaceFromAPI]);

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
