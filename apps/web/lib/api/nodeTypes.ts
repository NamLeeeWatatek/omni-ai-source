/**
 * Node Types API
 * Fetch node types from backend
 * @deprecated Use lib/api/nodes.ts and lib/types/node.ts instead
 */
import { fetchAPI } from '../api'
import type { NodeType, NodeCategory, NodeProperty } from '../types/node'

export type { NodeProperty, NodeType as NodeTypeAPI, NodeCategory }

/**
 * Fetch all node types from backend
 * @deprecated Use getNodeTypes from lib/api/nodes.ts
 */
export async function fetchNodeTypes(category?: string): Promise<NodeType[]> {
    const url = category ? `/node-types/?category=${category}` : '/node-types/'
    return fetchAPI(url)
}

/**
 * Fetch node categories
 * @deprecated Use getNodeCategories from lib/api/nodes.ts
 */
export async function fetchNodeCategories(): Promise<NodeCategory[]> {
    return fetchAPI('/node-types/categories')
}

/**
 * Fetch specific node type
 * @deprecated Use getNodeType from lib/api/nodes.ts
 */
export async function fetchNodeType(nodeId: string): Promise<NodeType> {
    return fetchAPI(`/node-types/${nodeId}`)
}
