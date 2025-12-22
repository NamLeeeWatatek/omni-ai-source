import React from 'react'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { Category, Tag } from '@/lib/types'
import type { Template, CreateTemplateDto, UpdateTemplateDto, QueryTemplateDto } from '@/lib/types/template'

// Model-related types
interface ModelOption {
  provider: string
  model_name: string
  display_name: string
  description?: string
  api_key_configured: boolean
  is_available: boolean
  capabilities: string[]
  max_tokens: number
  is_default?: boolean
  is_recommended?: boolean
}

interface ProviderModelsResponse {
  models: ModelOption[]
}

// Generic API response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status?: number
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

// Generic API service class
export class ApiService {
  private static instance: ApiService

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  // Generic request wrapper with error handling
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await axiosClient.request({
        method,
        url,
        data,
        ...config
      })
      return response.data
    } catch (error: any) {
      // Handle different types of errors
      this.handleError(error)
      throw error
    }
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login?error=unauthorized'
          }
          break
        case 403:
          toast.error('Bạn không có quyền thực hiện hành động này')
          break
        case 404:
          toast.error('Không tìm thấy tài nguyên yêu cầu')
          break
        case 422:
          // Validation errors
          if (data.errors) {
            const messages = Object.values(data.errors).flat().join(', ')
            toast.error(`Dữ liệu không hợp lệ: ${messages}`)
          } else {
            toast.error(data.message || 'Dữ liệu không hợp lệ')
          }
          break
        case 500:
          toast.error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.')
          break
        default:
          toast.error(data.message || `Lỗi ${status}`)
      }
    } else if (error.request) {
      // Network error
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
    } else {
      // Other error
      toast.error('Đã xảy ra lỗi không mong muốn')
    }

    // Log error for debugging
    console.error('API Error:', error)
  }

  // HTTP method wrappers
  async get<T>(url: string, config?: any): Promise<T> {
    return this.request<T>('GET', url, undefined, config)
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('POST', url, data, config)
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('PUT', url, data, config)
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>('PATCH', url, data, config)
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config)
  }
}

// Create singleton instance
export const apiService = ApiService.getInstance()

// Specific service classes for different domains
export class MetadataService {
  static async getCategories(entityType: string): Promise<Category[]> {
    return apiService.get<Category[]>(`/metadata/categories?entity_type=${entityType}`)
  }

  static async getTags(): Promise<Tag[]> {
    return apiService.get<Tag[]>('/metadata/tags')
  }

  static async getModels(): Promise<ProviderModelsResponse[]> {
    return apiService.get<ProviderModelsResponse[]>('/ai-providers/models')
  }
}

export class MediaService {
  static async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiService.post('/media/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  static async uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiService.post('/media/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// UGC Factory related types
interface Execution {
  id: string
  flow_id: string
  status: 'completed' | 'failed' | 'running' | 'pending'
  started_at: string
  completed_at?: string
  duration_ms?: number
  error_message?: string
  total_nodes: number
  completed_nodes: number
}

interface ExecutionArtifact {
  id: string
  execution_id: string
  file_id: string
  artifact_type: 'image' | 'video' | 'audio' | 'document' | 'text' | 'other'
  name: string
  description?: string
  metadata?: Record<string, any>
  size?: number
  mime_type?: string
  download_url: string
  created_at: string
  updated_at: string
}

export class UGCFactoryService {
  static async getExecutions(flowId: string, limit = 100): Promise<Execution[]> {
    return apiService.get<Execution[]>(`/executions/?flow_id=${flowId}&limit=${limit}`)
  }

  static async getExecutionArtifacts(executionId: string): Promise<ExecutionArtifact[]> {
    return apiService.get<ExecutionArtifact[]>(`/execution-artifacts/?execution_id=${executionId}`)
  }

  static async deleteArtifact(artifactId: string): Promise<void> {
    return apiService.delete(`/execution-artifacts/${artifactId}`)
  }
}

export class WorkspaceService {
  static async getCurrentWorkspace() {
    return apiService.get('/workspaces/current')
  }

  static async getWorkspaces() {
    return apiService.get('/workspaces')
  }
}

export class TemplatesService {
  static async getTemplates(params?: QueryTemplateDto): Promise<{ data: Template[]; hasNextPage: boolean; total: number }> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters))
    if (params?.sort) queryParams.append('sort', JSON.stringify(params.sort))

    const queryString = queryParams.toString()
    const url = `/templates${queryString ? `?${queryString}` : ''}`

    return apiService.get(url)
  }

  static async getTemplateById(id: string): Promise<Template> {
    return apiService.get(`/templates/${id}`)
  }

  static async getTemplatesByWorkspace(workspaceId: string): Promise<Template[]> {
    return apiService.get(`/templates/workspace/${workspaceId}`)
  }

  static async createTemplate(data: CreateTemplateDto): Promise<Template> {
    return apiService.post('/templates', data)
  }

  static async updateTemplate(id: string, data: UpdateTemplateDto): Promise<Template> {
    return apiService.patch(`/templates/${id}`, data)
  }

  static async deleteTemplate(id: string): Promise<void> {
    return apiService.delete(`/templates/${id}`)
  }

  static async activateTemplate(id: string): Promise<Template> {
    return apiService.post(`/templates/${id}/activate`)
  }

  static async deactivateTemplate(id: string): Promise<Template> {
    return apiService.post(`/templates/${id}/deactivate`)
  }
}

// Utility function for handling async operations with loading states
export async function withLoadingState<T>(
  loadingSetter: (loading: boolean) => void,
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> {
  try {
    loadingSetter(true)
    const result = await operation()
    return result
  } catch (error) {
    console.error(errorMessage || 'Operation failed:', error)
    return null
  } finally {
    loadingSetter(false)
  }
}

// Hook for managing loading states
export function useAsyncState() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const execute = React.useCallback(async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: any) => void
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await operation()
      onSuccess?.(result)
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Đã xảy ra lỗi'
      setError(errorMessage)
      onError?.(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, execute }
}
