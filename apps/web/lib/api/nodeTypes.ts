/**
 * Node Types API
 * Fetch node types from backend
 * @deprecated Use lib/api/nodes.ts and lib/types/node.ts instead
 */
import { axiosClient } from '../axios-client'
import type { NodeType, NodeCategory, NodeProperty } from '../types/node'

export type { NodeProperty, NodeType as NodeTypeAPI, NodeCategory }

/**
 * Fetch all node types from backend
 * @deprecated Use getNodeTypes from lib/api/nodes.ts
 */
export async function fetchNodeTypes(category?: string): Promise<NodeType[]> {
    const url = category ? `/node-types/?category=${category}` : '/node-types/'
    const response = await axiosClient.get(url)
    return response.data
}

/**
 * Fetch node categories
 * @deprecated Use getNodeCategories from lib/api/nodes.ts
 */
export async function fetchNodeCategories(): Promise<NodeCategory[]> {
    const response = await axiosClient.get('/node-types/categories')
    return response.data
}

/**
 * Fetch specific node type
 * @deprecated Use getNodeType from lib/api/nodes.ts
 */
export async function fetchNodeType(nodeId: string): Promise<NodeType> {
    const response = await axiosClient.get(`/node-types/${nodeId}`)
    return response.data
}
