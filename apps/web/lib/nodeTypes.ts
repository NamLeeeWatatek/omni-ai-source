import { NodeProperty } from './api/nodeTypes'

export interface NodeType {
    id: string
    label: string
    category: 'trigger' | 'ai' | 'action' | 'logic' | 'response'
    icon: any
    color: string
    bgColor: string
    borderColor: string
    description: string
    isPremium?: boolean
    properties?: NodeProperty[]
}

// Node types are now fetched from backend API via NodeTypesContext
// This file is kept for type definitions only
