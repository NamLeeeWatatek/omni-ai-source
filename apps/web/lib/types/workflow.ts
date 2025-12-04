
import type { Node, Edge } from 'reactflow'
import type { NodeType } from './node'

export interface DraftTemplate {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
}

export interface WorkflowEditorState {
  flowId: number | null
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  isExecuting: boolean
  executionResults: Record<string, any>
  draftTemplates: DraftTemplate[]
}

export interface NodePaletteProps {
  onAddNode: (nodeType: NodeType) => void
}

export interface NodePropertiesProps {
  node: Node
  onUpdate: (node: Node) => void
  onClose?: () => void
}

export interface NodeContextMenuProps {
  x: number
  y: number
  node: Node
  onClose: () => void
  onTest?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

export interface CustomNodeProps {
  id: string
  data: {
    type: string
    label: string
    icon?: string
    color?: string
    description?: string
    config?: Record<string, any>
  }
  selected?: boolean
}

export interface InputField {
  id: string
  label: string
  key: string
  type: 'text' | 'number' | 'boolean' | 'file'
  required: boolean
  default?: any
}

export interface WorkflowRunModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, any>) => void
  inputFields: InputField[]
  workflowName: string
}

export interface ExecuteFlowModalProps {
  isOpen: boolean
  onClose: () => void
  flowId: number
  flowName: string
  unconfiguredFields: Array<{
    nodeId: string
    nodeName: string
    field: string
    label: string
    type: string
    required: boolean
  }>
}

export interface TestNodePanelProps {
  node: Node
  onClose: () => void
}

export interface TestNodeModalProps {
  node: Node
  onClose: () => void
  isOpen: boolean
}

export interface TestNodeResult {
  nodeId: string
  status: 'running' | 'success' | 'error'
  output?: any
  error?: string
  duration?: number
}

export interface WorkflowStatsProps {
  stats: {
    total: number
    active: number
    executions: number
    successRate: number
  }
}

export interface WorkflowCardProps {
  workflow: {
    id: number
    name: string
    description?: string
    status: string
    updated_at?: string
    version?: number
    executions?: number
    successRate?: number
  }
  onEdit?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export interface FlowsTableProps {
  flows: Array<{
    id: number
    name: string
    description?: string
    status: string
    updated_at?: string
    version?: number
    executions?: number
    successRate?: number
  }>
  onUpdate: () => void
}

export interface FormFieldProps {
  field: {
    name: string
    label: string
    type: string
    required?: boolean
    placeholder?: string
    description?: string
    options?: Array<{ value: string; label: string } | string>
    default?: any
    showWhen?: Record<string, any>
    accept?: string
    multiple?: boolean
  }
  value: any
  onChange: (value: any) => void
  nodeData?: Record<string, any>
}

export interface KeyValuePair {
  key: string
  value: string
}

export interface KeyValueEditorProps {
  value: Record<string, any> | string
  onChange: (value: Record<string, any>) => void
  placeholder?: {
    key?: string
    value?: string
  }
  description?: string
  disabled?: boolean
}
