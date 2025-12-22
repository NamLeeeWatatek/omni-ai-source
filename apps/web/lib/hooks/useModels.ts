import { useQuery } from '@tanstack/react-query'
import { MetadataService } from '@/lib/services/api.service'

// Query keys
export const modelKeys = {
  all: ['models'] as const,
  lists: () => [...modelKeys.all, 'list'] as const,
  list: () => [...modelKeys.lists()] as const,
}

export function useModels() {
  return useQuery({
    queryKey: modelKeys.list(),
    queryFn: () => MetadataService.getModels(),
    staleTime: 1000 * 60 * 15, // 15 minutes (models don't change often)
    gcTime: 1000 * 60 * 60, // 1 hour
  })
}
