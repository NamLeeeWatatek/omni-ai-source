/**
 * Flows Redux Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction, type ActionReducerMapBuilder } from '@reduxjs/toolkit'
import type { Draft } from '@reduxjs/toolkit'
import axiosClient from '@/lib/axios-client'
import type { PaginatedResponse, PaginationParams } from '@/lib/types/pagination'

export interface Flow {
  id: string  // Changed from number to string (UUID)
  name: string
  description: string
  status: 'draft' | 'published' | 'archived'
  is_active: boolean
  flow_data: Record<string, unknown>
  created_at: string
  updated_at: string
  archived_at?: string
  user_id: string
  version?: number
  executions?: number
  successRate?: number
  channel_id?: number | null
}

interface FlowsState {
  items: Flow[]
  currentFlow: Flow | null
  loading: boolean
  error: string | null
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  stats?: {
    total_flows: number
    total_published: number
    total_draft: number
    total_archived: number
  }
}

const initialState: FlowsState = {
  items: [],
  currentFlow: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  stats: undefined,
}

export const fetchFlows = createAsyncThunk<
  PaginatedResponse<Flow>,
  Partial<PaginationParams & { status?: string }> | void
>(
  'flows/fetchFlows',
  async (params) => {
    const queryParams = new URLSearchParams()
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.page_size) queryParams.append('page_size', params.page_size.toString())
      if (params.search) queryParams.append('search', params.search)
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
      
      if ('status' in params && params.status) {
        queryParams.append('status', params.status)
      }
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          queryParams.append(key, String(value))
        })
      }
    }
    
    const url = `/flows/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response: any = await axiosClient.get(url)
    const data = response.data || response
    
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        page_size: data.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }
    }
    
    return data as PaginatedResponse<Flow>
  }
)

export const fetchFlow = createAsyncThunk<Flow, string>(
  'flows/fetchFlow',
  async (id: string) => {
    const response: any = await axiosClient.get(`/flows/${id}`)
    return (response.data || response) as Flow
  }
)

export const createFlow = createAsyncThunk<Flow, Partial<Flow>>(
  'flows/createFlow',
  async (data: Partial<Flow>) => {
    const response: any = await axiosClient.post('/flows/', data)
    return (response.data || response) as Flow
  }
)

export const updateFlow = createAsyncThunk<Flow, { id: string; data: Partial<Flow> }>(
  'flows/updateFlow',
  async ({ id, data }: { id: string; data: Partial<Flow> }) => {
    const response: any = await axiosClient.patch(`/flows/${id}`, data)
    return (response.data || response) as Flow
  }
)

export const deleteFlow = createAsyncThunk<string, string>(
  'flows/deleteFlow',
  async (id: string) => {
    await axiosClient.delete(`/flows/${id}`)
    return id
  }
)

export const duplicateFlow = createAsyncThunk<Flow, string>(
  'flows/duplicateFlow',
  async (id: string) => {
    const response: any = await axiosClient.post(`/flows/${id}/duplicate`)
    return (response.data || response) as Flow
  }
)

export const archiveFlow = createAsyncThunk<Flow, string>(
  'flows/archiveFlow',
  async (id: string) => {
    const response: any = await axiosClient.post(`/flows/${id}/archive`)
    return (response.data || response) as Flow
  }
)

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    setCurrentFlow: (state: Draft<FlowsState>, action: PayloadAction<Flow | null>) => {
      state.currentFlow = action.payload
    },
    clearError: (state: Draft<FlowsState>) => {
      state.error = null
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<FlowsState>) => {
    builder
      .addCase(fetchFlows.pending, (state: Draft<FlowsState>) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlows.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<any>) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.page_size
        state.totalPages = action.payload.total_pages
        state.hasNext = action.payload.has_next
        state.hasPrev = action.payload.has_prev
        if (action.payload.stats) {
          state.stats = action.payload.stats
        }
      })
      .addCase(fetchFlows.rejected, (state: Draft<FlowsState>, action: any) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch flows'
      })

    builder.addCase(fetchFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      state.currentFlow = action.payload
    })

    builder.addCase(createFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      state.items.push(action.payload)
      state.currentFlow = action.payload
    })

    builder.addCase(updateFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      const index = state.items.findIndex((f: Flow) => f.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
      if (state.currentFlow?.id === action.payload.id) {
        state.currentFlow = action.payload
      }
    })

    builder.addCase(deleteFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<string>) => {
      state.items = state.items.filter((f: Flow) => f.id !== action.payload)
      if (state.currentFlow?.id === action.payload) {
        state.currentFlow = null
      }
    })

    builder.addCase(duplicateFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      state.items.push(action.payload)
    })

    builder.addCase(archiveFlow.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<Flow>) => {
      const index = state.items.findIndex((f: Flow) => f.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
      }
    })
  },
})

export const { setCurrentFlow, clearError } = flowsSlice.actions
export default flowsSlice.reducer
