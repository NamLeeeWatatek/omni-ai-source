/**
 * Client-side Axios Configuration with NextAuth
 * Use this in client components
 */
import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

axiosClient.interceptors.request.use(
  async (config) => {
    // Prevent infinite loops by checking if we're already processing
    if (config.headers['X-Request-Processing']) {
      return config
    }
    config.headers['X-Request-Processing'] = 'true'

    try {
      const session = await getSession()
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }

      // Add workspace context header from session (single source of truth)
      const workspaceId = session?.workspace?.id
      if (workspaceId) {
        config.headers['X-Workspace-Id'] = workspaceId
        console.log('[Axios] ✅ Workspace ID:', workspaceId, '→', config.url)
      } else {
        console.warn('[Axios] ⚠️ No workspace in session! User may not have a workspace assigned.')
      }

      if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }
    } finally {
      // Clean up processing flag
      delete config.headers['X-Request-Processing']
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor với token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Token refresh logic - như Google OAuth
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đang refresh token → queue request này
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Trigger NextAuth to refresh the token
        const session = await getSession();

        if (session?.accessToken) {
          // Token đã được refresh thành công
          processQueue(null, session.accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return axiosClient(originalRequest);
        } else {
          // Không có session hoặc refresh thất bại
          throw new Error('Session refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh thất bại → redirect to login
        if (typeof window !== 'undefined') {
          console.log('[Auth] Token refresh failed, redirecting to login');
          window.location.href = '/api/auth/signout?callbackUrl=/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
)

export default axiosClient
