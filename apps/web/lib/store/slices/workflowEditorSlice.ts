/**
 * Workflow Editor Redux Slice
 * Manages workflow editor state (nodes, edges, etc.)
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Node, Edge } from 'reactflow'

interface DraftTemplate {
  name: string
  nodes: Node[]
  edges: Edge[]
}

interface WorkflowEditorState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  workflowName: string
  workflowDescription: string
  selectedChannelId: number | null
  hasUnsavedChanges: boolean
  isExecuting: boolean
  isTesting: boolean
  showProperties: boolean
  showExecutionResults: boolean
  executionResults: Record<string, any> | null
  draftTemplate: DraftTemplate | null
}

const initialState: WorkflowEditorState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: 'Untitled Workflow',
  workflowDescription: '',
  selectedChannelId: null,
  hasUnsavedChanges: false,
  isExecuting: false,
  isTesting: false,
  showProperties: false,
  showExecutionResults: false,
  executionResults: null,
  draftTemplate: null,
}

const workflowEditorSlice = createSlice({
  name: 'workflowEditor',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload
      state.hasUnsavedChanges = true
    },
    updateNodesWithoutDirty: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload
      state.hasUnsavedChanges = true
    },
    updateEdgesWithoutDirty: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload
    },
    addNode: (state, action: PayloadAction<Node>) => {
      state.nodes.push(action.payload)
      state.hasUnsavedChanges = true
    },
    updateNode: (state, action: PayloadAction<{ id: string; data: any }>) => {
      const index = state.nodes.findIndex((n: Node) => n.id === action.payload.id)
      if (index !== -1) {
        state.nodes[index] = { ...state.nodes[index], data: action.payload.data }
        state.hasUnsavedChanges = true
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter((n: Node) => n.id !== action.payload)
      state.hasUnsavedChanges = true
    },
    setSelectedNodeId: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload
    },
    setWorkflowName: (state, action: PayloadAction<string>) => {
      state.workflowName = action.payload
      state.hasUnsavedChanges = true
    },
    setWorkflowDescription: (state, action: PayloadAction<string>) => {
      state.workflowDescription = action.payload
      state.hasUnsavedChanges = true
    },
    setSelectedChannelId: (state, action: PayloadAction<number | null>) => {
      state.selectedChannelId = action.payload
      state.hasUnsavedChanges = true
    },
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload
    },
    setIsExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload
    },
    setIsTesting: (state, action: PayloadAction<boolean>) => {
      state.isTesting = action.payload
    },
    setShowProperties: (state, action: PayloadAction<boolean>) => {
      state.showProperties = action.payload
    },
    setShowExecutionResults: (state, action: PayloadAction<boolean>) => {
      state.showExecutionResults = action.payload
    },
    setExecutionResults: (state, action: PayloadAction<Record<string, any> | null>) => {
      state.executionResults = action.payload
    },
    resetEditor: (state) => {
      return initialState
    },
    loadWorkflow: (state, action: PayloadAction<{
      name: string
      description: string
      nodes: Node[]
      edges: Edge[]
      channelId?: number | null
    }>) => {
      state.workflowName = action.payload.name
      state.workflowDescription = action.payload.description
      state.nodes = action.payload.nodes
      state.edges = action.payload.edges
      state.selectedChannelId = action.payload.channelId || null
      state.hasUnsavedChanges = false
    },
    setDraftTemplate: (state, action: PayloadAction<DraftTemplate | null>) => {
      state.draftTemplate = action.payload
    },
    clearDraftTemplate: (state) => {
      state.draftTemplate = null
    },
  },
})

export const {
  setNodes,
  updateNodesWithoutDirty,
  setEdges,
  updateEdgesWithoutDirty,
  addNode,
  updateNode,
  removeNode,
  setSelectedNodeId,
  setWorkflowName,
  setWorkflowDescription,
  setSelectedChannelId,
  setHasUnsavedChanges,
  setIsExecuting,
  setIsTesting,
  setShowProperties,
  setShowExecutionResults,
  setDraftTemplate,
  clearDraftTemplate,
  setExecutionResults,
  resetEditor,
  loadWorkflow,
} = workflowEditorSlice.actions

export default workflowEditorSlice.reducer
