/**
 * Client-side Axios Configuration with NextAuth
 * Use this in client components
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getSession, signIn } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Custom Axios instance type that returns data directly
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

axiosInstance.interceptors.request.use(
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

      // Workspace context will be added by Redux state if needed
      // for now, we don't set workspace headers automatically

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

// Response interceptor with automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Return response.data directly for cleaner API usage
    return response.data as any
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get current session to access refresh token
        const session = await getSession();

        if (session?.refreshToken) {
          console.log('[Auth] Token expired, attempting refresh...');

          // Call refresh endpoint directly
          const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: session.refreshToken,
            }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('[Auth] Token refresh successful');

            // Retry with refreshed token
            originalRequest.headers.Authorization = `Bearer ${refreshData.token}`;

            // Update NextAuth session by calling signIn with updated credentials
            // This will trigger the JWT callback and update the session
            try {
              await signIn('credentials', {
                backendData: JSON.stringify({
                  token: refreshData.token,
                  refreshToken: refreshData.refreshToken,
                  tokenExpires: refreshData.tokenExpires,
                  user: session.user,
                  workspace: session.workspace,
                  workspaces: session.workspaces,
                }),
                redirect: false,
              });
              console.log('[Auth] NextAuth session updated');
            } catch (signInError) {
              console.warn('[Auth] Failed to update NextAuth session:', signInError);
              // Continue anyway since the request will work with the new token
            }

            return axiosInstance(originalRequest);
          } else {
            console.error('[Auth] Token refresh failed:', refreshResponse.status);
          }
        }

        // No refresh token or refresh failed
        throw new Error('Authentication required');
      } catch (retryError) {
        console.error('[Auth] Token refresh error:', retryError);
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          console.log('[Auth] Authentication failed, redirecting to login');
          window.location.href = '/api/auth/signout?callbackUrl=/login';
        }
        return Promise.reject(retryError);
      }
    }

    // Handle other errors
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
)

// Export with custom type that reflects the interceptor behavior
export const axiosClient = axiosInstance as CustomAxiosInstance
export default axiosClient
