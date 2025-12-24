import { useQuery } from '@tanstack/react-query'
import { metadataApi } from '@/lib/api/metadata'
import { Category } from '@/lib/types'
import { CACHE_TIMES } from '@/lib/constants/app'

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (entityType: string) => [...categoryKeys.lists(), entityType] as const,
}

export function useCategories(entityType: string) {
  return useQuery({
    queryKey: categoryKeys.list(entityType),
    queryFn: () => metadataApi.getCategories(entityType),
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    enabled: !!entityType,
  })
}

export function useAllCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: async () => {
      // Fetch categories for common entity types
      const entityTypes = ['bot', 'channel', 'flow', 'template']
      const results = await Promise.allSettled(
        entityTypes.map(type => metadataApi.getCategories(type))
      )

      const categories: Category[] = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          categories.push(...result.value)
        } else {
          console.warn(`Failed to load categories for ${entityTypes[index]}:`, result.reason)
        }
      })

      return categories
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  })
}
