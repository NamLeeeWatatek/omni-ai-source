/**
 * Flow/Workflow related type definitions
 */

export interface Flow {
  id: number
  name: string
  description?: string
  status: string
  updated_at?: string
  version?: number
  executions?: number
  successRate?: number
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    type: string
    label: string
    config?: Record<string, any>
    icon?: string
    color?: string
    description?: string
  }
}

export interface InputField {
  name: string
  type: string
  label: string
  required?: boolean
  default?: any
  options?: Array<{ label: string; value: any }>
}

export interface ExecutionStatus {
  id: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface TimelineEvent {
  id: string
  timestamp: string
  type: 'start' | 'node' | 'end' | 'error'
  nodeId?: string
  nodeName?: string
  message: string
  status?: 'success' | 'failed'
}
