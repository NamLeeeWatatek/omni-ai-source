/**
 * Node Types API
 * Fetch node types from backend
 */
import { fetchAPI } from '../api'

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
    accept?: string // For file/image upload
    multiple?: boolean // For multiple file upload
}

export interface NodeTypeAPI {
    id: string
    label: string
    category: string
    icon: string
    color: string
    description: string
    isPremium?: boolean
    properties?: NodeProperty[]
}

export interface NodeCategory {
    id: string
    label: string
    color: string
}

/**
 * Fetch all node types from backend
 */
export async function fetchNodeTypes(category?: string): Promise<NodeTypeAPI[]> {
    const url = category ? `/node-types/?category=${category}` : '/node-types/'
    return fetchAPI(url)
}

/**
 * Fetch node categories
 */
export async function fetchNodeCategories(): Promise<NodeCategory[]> {
    return fetchAPI('/node-types/categories')
}

/**
 * Fetch specific node type
 */
export async function fetchNodeType(nodeId: string): Promise<NodeTypeAPI> {
    return fetchAPI(`/node-types/${nodeId}`)
}
