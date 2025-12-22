import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TemplatesService } from '@/lib/services/api.service'
import type { Template, CreateTemplateDto, UpdateTemplateDto, QueryTemplateDto } from '@/lib/types/template'

// Query keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params?: QueryTemplateDto) => [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  workspace: (workspaceId: string) => [...templateKeys.all, 'workspace', workspaceId] as const,
}

export function useTemplates(params?: QueryTemplateDto) {
  const queryClient = useQueryClient()

  const {
    data: templatesData,
    isLoading: loading,
    error,
    refetch: refreshTemplates,
  } = useQuery({
    queryKey: templateKeys.list(params),
    queryFn: async () => {
      const response = await TemplatesService.getTemplates(params)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateDto) => TemplatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) =>
      TemplatesService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.details() })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TemplatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => TemplatesService.activateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.details() })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => TemplatesService.deactivateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: templateKeys.details() })
    },
  })

  const createTemplate = useCallback(async (data: CreateTemplateDto) => {
    return createMutation.mutateAsync(data)
  }, [createMutation])

  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateDto) => {
    return updateMutation.mutateAsync({ id, data })
  }, [updateMutation])

  const deleteTemplate = useCallback(async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }, [deleteMutation])

  const activateTemplate = useCallback(async (id: string) => {
    return activateMutation.mutateAsync(id)
  }, [activateMutation])

  const deactivateTemplate = useCallback(async (id: string) => {
    return deactivateMutation.mutateAsync(id)
  }, [deactivateMutation])

  return {
    templates: templatesData?.data || [],
    totalCount: templatesData?.total || 0,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    deactivateTemplate,
    refreshTemplates,
  }
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => TemplatesService.getTemplateById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useTemplatesByWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: templateKeys.workspace(workspaceId),
    queryFn: () => TemplatesService.getTemplatesByWorkspace(workspaceId),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}
