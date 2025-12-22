/**
 * Flows Redux Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction, type ActionReducerMapBuilder } from '@reduxjs/toolkit'
import type { Draft } from '@reduxjs/toolkit'
import { flowsApi } from '@/lib/api/flows'
import type { Flow } from '@/lib/types/flow'
import { PaginatedResponse, PaginationParams } from '@/lib/types/pagination'
import { setGlobalLoading } from './uiSlice'


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
    total: number
    published: number
    draft: number
    active: number
    successRate: number
    avgDuration: number
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
  {
    items: Flow[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  },
  Partial<PaginationParams & { status?: string; filters?: string; sort?: string }> | void
>(
  'flows/fetchFlows',
  async (params) => {
    const response = await flowsApi.getAll(params as any)

    // Handle InfinityPaginationResponseDto { data, hasNextPage, total }
    if (response && response.data && Array.isArray(response.data)) {
      const items = response.data
      const total = response.total || items.length
      const page = (params as any)?.page || 1
      const pageSize = (params as any)?.limit || items.length

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: response.hasNextPage || false,
        hasPrev: page > 1,
      }
    }

    // Handle direct array response
    if (Array.isArray(response)) {
      return {
        items: response,
        total: response.length,
        page: 1,
        pageSize: response.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    }

    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  }
)

export const fetchFlowsStats = createAsyncThunk<any, void>(
  'flows/fetchStats',
  async () => {
    return await flowsApi.getStats()
  }
)

export const fetchFlow = createAsyncThunk<Flow, string>(
  'flows/fetchFlow',
  async (id: string) => {
    return await flowsApi.getOne(id)
  }
)

export const createFlow = createAsyncThunk<Flow, Partial<Flow>>(
  'flows/createFlow',
  async (data: Partial<Flow>, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'create-flow', isLoading: true, message: 'Creating flow...' }))
    try {
      return await flowsApi.create(data)
    } finally {
      dispatch(setGlobalLoading({ actionId: 'create-flow', isLoading: false }))
    }
  }
)

export const updateFlow = createAsyncThunk<Flow, { id: string; data: Partial<Flow> }>(
  'flows/updateFlow',
  async ({ id, data }: { id: string; data: Partial<Flow> }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'update-flow', isLoading: true, message: 'Updating flow...' }))
    try {
      return await flowsApi.update(id, data)
    } finally {
      dispatch(setGlobalLoading({ actionId: 'update-flow', isLoading: false }))
    }
  }
)

export const deleteFlow = createAsyncThunk<string, string>(
  'flows/deleteFlow',
  async (id: string, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'delete-flow', isLoading: true, message: 'Deleting flow...' }))
    try {
      await flowsApi.delete(id)
      return id
    } finally {
      dispatch(setGlobalLoading({ actionId: 'delete-flow', isLoading: false }))
    }
  }
)

export const duplicateFlow = createAsyncThunk<Flow, string>(
  'flows/duplicateFlow',
  async (id: string, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'duplicate-flow', isLoading: true, message: 'Duplicating flow...' }))
    try {
      return await flowsApi.duplicate(id)
    } finally {
      dispatch(setGlobalLoading({ actionId: 'duplicate-flow', isLoading: false }))
    }
  }
)

export const archiveFlow = createAsyncThunk<Flow, string>(
  'flows/archiveFlow',
  async (id: string, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'archive-flow', isLoading: true, message: 'Archiving flow...' }))
    try {
      return await flowsApi.update(id, { status: 'archived' })
    } finally {
      dispatch(setGlobalLoading({ actionId: 'archive-flow', isLoading: false }))
    }
  }
)

export const executeFlow = createAsyncThunk<
  { executionId: string; flowId: string; status: string; startedAt: string },
  { id: string; input?: any }
>(
  'flows/executeFlow',
  async ({ id, input }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'execute-flow', isLoading: true, message: 'Starting workflow...' }))
    try {
      return await flowsApi.execute(id, input)
    } finally {
      dispatch(setGlobalLoading({ actionId: 'execute-flow', isLoading: false }))
    }
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
      .addCase(fetchFlowsStats.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<any>) => {
        state.stats = action.payload
      })
      .addCase(fetchFlows.pending, (state: Draft<FlowsState>) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlows.fulfilled, (state: Draft<FlowsState>, action: PayloadAction<any>) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.totalPages = action.payload.totalPages
        state.hasNext = action.payload.hasNext
        state.hasPrev = action.payload.hasPrev
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
