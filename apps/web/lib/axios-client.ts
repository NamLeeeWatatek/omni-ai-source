import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});


let activeWorkspaceId: string | null = null;

export const setActiveWorkspaceId = (id: string) => {
  activeWorkspaceId = id;
};

axiosClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    if (activeWorkspaceId) {
      config.headers['x-workspace-id'] = activeWorkspaceId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid retrying for actual login or refresh-token endpoints to prevent infinite loops
      const isAuthEndpoint = originalRequest.url?.includes('/auth/email/login') ||
        originalRequest.url?.includes('/auth/refresh-token') ||
        originalRequest.url?.includes('/auth/logout');

      if (!isAuthEndpoint) {
        originalRequest._retry = true;

        try {
          // Trigger NextAuth's silent refresh by fetching the current session.
          // NextAuth's internal callbacks (jwt/session) will handle the token rotation if it's expired.
          const session = await getSession();

          if (session?.accessToken) {
            // Update the Authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
            // Retry the original request
            return axiosClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('[Axios] Silent refresh attempted but failed:', refreshError);
        }
      }

      // If retry isn't possible or failed, trigger a clean logout if we're in the browser
      if (typeof window !== 'undefined' && !isAuthEndpoint) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && !(window as any)._isSigningOut) {
          console.warn('[Axios] Unauthorized - Redirecting to login...');
          (window as any)._isSigningOut = true;
          // Force a clean logout and redirect to login page
          await signOut({ callbackUrl: `/login?callbackUrl=${encodeURIComponent(currentPath)}`, redirect: true });
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
