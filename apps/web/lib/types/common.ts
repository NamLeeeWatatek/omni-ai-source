/**
 * Common UI component prop types
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  lastMessageAt: string
}

export interface Bot {
  id: number
  name: string
  description?: string
  status: string
  flowId?: number
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface DashboardStats {
  totalFlows: number
  activeFlows: number
  totalExecutions: number
  successRate: number
}

export interface KeyValuePair {
  key: string
  value: string
}

export interface KeyValueEditorProps {
  value: KeyValuePair[]
  onChange: (pairs: KeyValuePair[]) => void
  placeholder?: string
}
