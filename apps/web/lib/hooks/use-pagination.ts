/**
 * Reusable Pagination Hook
 * Use this for any paginated resource
 */
import { useState, useCallback } from 'react'
import type { PaginationParams } from '@/lib/types/pagination'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  onParamsChange?: (params: PaginationParams) => void
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 25,
  onParamsChange
}: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [search, setSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<Record<string, any>>({})

  const buildParams = useCallback((): PaginationParams => {
    return {
      page,
      page_size: pageSize,
      search: search || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    }
  }, [page, pageSize, search, sortBy, sortOrder, filters])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    const params = { ...buildParams(), page: newPage }
    onParamsChange?.(params)
  }, [buildParams, onParamsChange])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
    const params = { ...buildParams(), page: 1, page_size: newPageSize }
    onParamsChange?.(params)
  }, [buildParams, onParamsChange])

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch)
    setPage(1)
    const params = { ...buildParams(), page: 1, search: newSearch || undefined }
    onParamsChange?.(params)
  }, [buildParams, onParamsChange])

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field)
    setSortOrder(order)
    const params = { ...buildParams(), sort_by: field, sort_order: order }
    onParamsChange?.(params)
  }, [buildParams, onParamsChange])

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters)
    setPage(1)
    const params = { ...buildParams(), page: 1, filters: newFilters }
    onParamsChange?.(params)
  }, [buildParams, onParamsChange])

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
    setSearch('')
    setSortBy(undefined)
    setSortOrder('desc')
    setFilters({})
  }, [initialPage, initialPageSize])

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    filters,
    
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
    handleSortChange,
    handleFilterChange,
    reset,
    
    buildParams,
  }
}
