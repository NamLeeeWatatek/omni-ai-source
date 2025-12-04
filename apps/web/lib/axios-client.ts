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
  // Don't set default Content-Type - let axios handle it based on data type
})

// Request interceptor - Add auth token from NextAuth session
axiosClient.interceptors.request.use(
  async (config) => {
    const session = await getSession()
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    }
    
    // Set Content-Type to application/json only if not already set and not FormData
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle errors only (keep response structure intact)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/signout?callbackUrl=/login'
      }
    }
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export default axiosClient
