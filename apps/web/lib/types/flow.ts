export type FlowStatus = 'draft' | 'published' | 'archived'
export type FlowVisibility = 'private' | 'team' | 'public'

export interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data?: Record<string, any>
  // Frontend specific enrichment (optional)
  nodeTypeInfo?: {
    id: string
    label: string
    category: string
    icon: string
    color: string
    description?: string
  }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
}

export interface NodeProperty {
  name: string
  label: string
  type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form'
  required?: boolean
  default?: any
  defaultValue?: any
  placeholder?: string
  description?: string
  options?: Array<{ value: string; label: string } | string>
  showWhen?: Record<string, any>
  min?: number
  max?: number
  pattern?: string
  maxLength?: number
  rows?: number
  helpText?: string
  accept?: string
  multiple?: boolean
  properties?: NodeProperty[]
}

export interface FlowStats {
  executions: number
  successRate: number
  lastRunAt?: string
  avgDuration?: number
}

export interface Flow {
  id: string
  name: string
  description?: string
  status: FlowStatus
  version: number
  nodes: FlowNode[]
  edges: FlowEdge[]

  // Organization
  workspaceId?: string
  ownerId?: string
  teamId?: string
  visibility?: FlowVisibility

  // Metadata
  tags?: string[]
  category?: string
  icon?: string

  // Configuration
  inputs?: NodeProperty[]
  outputSchema?: Record<string, any>

  // Timestamps
  createdAt: string
  updatedAt: string

  // UI/Computed (Optional in API, may be mocked in UI)
  stats?: FlowStats
  published?: boolean // Deprecated, use status === 'published'
}

export interface CreateFlowDto {
  name: string
  description?: string
  status?: FlowStatus
  visibility?: FlowVisibility
  category?: string
  tags?: string[]
  nodes?: FlowNode[]
  edges?: FlowEdge[]
  teamId?: string
}

export interface UpdateFlowDto extends Partial<CreateFlowDto> {
  // versions can be updated directly via partials
}

export interface CreateFlowFromTemplateDto {
  templateId: string
  name: string
  description?: string
}

export interface FlowExecution {
  id: string
  flowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  input?: any
  output?: any
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
}
