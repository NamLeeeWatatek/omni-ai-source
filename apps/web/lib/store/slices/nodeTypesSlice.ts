/**
 * NodeTypes Redux Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction, type ActionReducerMapBuilder } from '@reduxjs/toolkit'
import type { Draft } from '@reduxjs/toolkit'
import axiosInstance from '@/lib/axios'
import * as FiIcons from 'react-icons/fi'
import * as SiIcons from 'react-icons/si'
import * as MdIcons from 'react-icons/md'

// Icon mapping helper
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    ...FiIcons,
    ...SiIcons,
    ...MdIcons
  }
  // Direct lookup since backend sends exact component names (e.g. "FiZap", "SiWhatsapp")
  return iconMap[iconName] || FiIcons.FiCircle
}

export interface NodeProperty {
  name: string
  label: string
  type: 'text' | 'url' | 'textarea' | 'json' | 'select' | 'boolean' | 'number' | 'file' | 'image' | 'key-value' | 'multi-select' | 'dynamic-form'
  required?: boolean
  placeholder?: string
  description?: string
  options?: Array<{ value: string; label: string } | string>
  default?: any
  showWhen?: Record<string, any>
  accept?: string
  multiple?: boolean
}

export interface NodeType {
  id: string
  label: string
  category: 'trigger' | 'ai' | 'action' | 'logic' | 'response'
  icon: string | any // Icon name (string) or component (legacy support)
  iconName?: string // Explicit icon name field
  color: string
  bgColor: string
  borderColor: string
  description: string
  isPremium?: boolean
  properties?: NodeProperty[]
}

export interface NodeCategory {
  id: string
  label: string
  color: string
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

// API Response types
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

// Async thunks
export const fetchNodeTypes = createAsyncThunk<ApiNodeType[], string | undefined>(
  'nodeTypes/fetchNodeTypes',
  async (category?: string) => {
    const url = category ? `/node-types/?category=${category}` : '/node-types/'
    const response: any = await axiosInstance.get(url)
    return response as ApiNodeType[]
  }
)

export const fetchNodeCategories = createAsyncThunk<NodeCategory[], void>(
  'nodeTypes/fetchNodeCategories',
  async () => {
    const response: any = await axiosInstance.get('/node-types/categories')
    return response as NodeCategory[]
  }
)

export const fetchNodeType = createAsyncThunk<ApiNodeType, string>(
  'nodeTypes/fetchNodeType',
  async (nodeId: string) => {
    const response: any = await axiosInstance.get(`/node-types/${nodeId}`)
    return response as ApiNodeType
  }
)

// Slice
const nodeTypesSlice = createSlice({
  name: 'nodeTypes',
  initialState,
  reducers: {
    clearError: (state: Draft<NodeTypesState>) => {
      state.error = null
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<NodeTypesState>) => {
    // Fetch node types
    builder
      .addCase(fetchNodeTypes.pending, (state: Draft<NodeTypesState>) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNodeTypes.fulfilled, (state: Draft<NodeTypesState>, action: PayloadAction<ApiNodeType[]>) => {
        state.loading = false
        // Map API response to NodeType format
        // Store icon NAME (string) instead of component for Redux serializability
        state.items = action.payload.map((apiNode: ApiNodeType) => ({
          id: apiNode.id,
          label: apiNode.label,
          category: apiNode.category,
          icon: apiNode.icon, // Keep as string name (e.g. "FiZap")
          iconName: apiNode.icon, // Also store in iconName for clarity
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

    // Fetch categories
    builder.addCase(fetchNodeCategories.fulfilled, (state: Draft<NodeTypesState>, action: PayloadAction<NodeCategory[]>) => {
      state.categories = action.payload
    })
  },
})

export const { clearError } = nodeTypesSlice.actions
export default nodeTypesSlice.reducer
