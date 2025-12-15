/**
 * Client-side Axios Configuration with NextAuth
 * Use this in client components
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getSession } from 'next-auth/react'

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

// Response interceptor - simplified, rely on NextAuth refresh
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
        // Get updated session after NextAuth refresh
        const session = await getSession();

        if (session?.accessToken) {
          // Retry with refreshed token
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return axiosInstance(originalRequest);
        } else {
          // No session or refresh failed
          throw new Error('Authentication required');
        }
      } catch (retryError) {
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
