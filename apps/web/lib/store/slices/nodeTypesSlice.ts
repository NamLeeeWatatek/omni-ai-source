/**
 * NodeTypes Redux Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction, type ActionReducerMapBuilder } from '@reduxjs/toolkit'
import type { Draft } from '@reduxjs/toolkit'
import axiosClient from '@/lib/axios-client'
import type { NodeProperty, NodeCategory } from '@/lib/types/node'

export type { NodeProperty, NodeCategory }

export interface NodeType {
  id: string
  label: string
  category: 'trigger' | 'ai' | 'action' | 'logic' | 'response'
  icon: string | any
  iconName?: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  isPremium?: boolean
  properties?: NodeProperty[]
}

interface NodeTypesState {
  items: NodeType[]
  categories: NodeCategory[]
  loading: boolean
  error: string | null
}

const initialState: NodeTypesState = {
  items: [],
  categories: [],
  loading: false,
  error: null,
}

interface ApiNodeType {
  id: string
  label: string
  category: 'trigger' | 'ai' | 'action' | 'logic' | 'response'
  icon: any
  color: string
  description: string
  isPremium?: boolean
  properties?: NodeProperty[]
}

export const fetchNodeTypes = createAsyncThunk<ApiNodeType[], string | undefined>(
  'nodeTypes/fetchNodeTypes',
  async (category?: string) => {
    const url = category ? `/node-types/?category=${category}` : '/node-types/'
    const response: any = await axiosClient.get(url)
    return (response.data || response) as ApiNodeType[]
  }
)

export const fetchNodeCategories = createAsyncThunk<NodeCategory[], void>(
  'nodeTypes/fetchNodeCategories',
  async () => {
    const response: any = await axiosClient.get('/node-types/categories')
    return (response.data || response) as NodeCategory[]
  }
)

export const fetchNodeType = createAsyncThunk<ApiNodeType, string>(
  'nodeTypes/fetchNodeType',
  async (nodeId: string) => {
    const response: any = await axiosClient.get(`/node-types/${nodeId}`)
    return (response.data || response) as ApiNodeType
  }
)

const nodeTypesSlice = createSlice({
  name: 'nodeTypes',
  initialState,
  reducers: {
    clearError: (state: Draft<NodeTypesState>) => {
      state.error = null
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<NodeTypesState>) => {
    builder
      .addCase(fetchNodeTypes.pending, (state: Draft<NodeTypesState>) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNodeTypes.fulfilled, (state: Draft<NodeTypesState>, action: PayloadAction<ApiNodeType[]>) => {
        state.loading = false
        const payload = Array.isArray(action.payload) ? action.payload : []
        state.items = payload.map((apiNode: ApiNodeType) => ({
          id: apiNode.id,
          label: apiNode.label,
          category: apiNode.category,
          icon: apiNode.icon,
          iconName: apiNode.icon,
          color: apiNode.color,
          bgColor: apiNode.color,
          borderColor: apiNode.color,
          description: apiNode.description,
          isPremium: apiNode.isPremium || false,
          properties: apiNode.properties,
        }))
      })
      .addCase(fetchNodeTypes.rejected, (state: Draft<NodeTypesState>, action: any) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch node types'
      })

    builder.addCase(fetchNodeCategories.fulfilled, (state: Draft<NodeTypesState>, action: PayloadAction<NodeCategory[]>) => {
      state.categories = action.payload
    })
  },
})

export const { clearError } = nodeTypesSlice.actions
export default nodeTypesSlice.reducer
