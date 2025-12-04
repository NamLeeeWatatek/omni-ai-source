
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
  icon: string
  iconName?: string
  color: string
  bgColor?: string
  borderColor?: string
  description: string
  isPremium?: boolean
  properties?: NodeProperty[]
  createdAt?: string
  updatedAt?: string
}

export interface NodeCategory {
  id: string
  label: string
  color: string
  description?: string
}

export interface CreateNodeTypeDto {
  label: string
  category: 'trigger' | 'ai' | 'action' | 'logic' | 'response'
  icon: string
  color: string
  description: string
  isPremium?: boolean
  properties?: NodeProperty[]
}

export interface UpdateNodeTypeDto {
  label?: string
  category?: 'trigger' | 'ai' | 'action' | 'logic' | 'response'
  icon?: string
  color?: string
  description?: string
  isPremium?: boolean
  properties?: NodeProperty[]
}
