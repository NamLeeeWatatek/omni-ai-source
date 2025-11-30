/**
 * Node Management API
 * API calls for managing node types
 */
import { fetchAPI } from '../api'
import type { NodeType, NodeCategory, CreateNodeTypeDto, UpdateNodeTypeDto } from '../types/node'

/**
 * Fetch all node types
 */
export async function getNodeTypes(category?: string): Promise<NodeType[]> {
  const url = category ? `/node-types/?category=${category}` : '/node-types/'
  return fetchAPI(url)
}

/**
 * Fetch single node type
 */
export async function getNodeType(id: string): Promise<NodeType> {
  return fetchAPI(`/node-types/${id}`)
}

/**
 * Create new node type
 */
export async function createNodeType(data: CreateNodeTypeDto): Promise<NodeType> {
  return fetchAPI('/node-types/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Update node type using PATCH
 */
export async function updateNodeType(id: string, data: UpdateNodeTypeDto): Promise<NodeType> {
  return fetchAPI(`/node-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * Delete node type
 */
export async function deleteNodeType(id: string): Promise<void> {
  return fetchAPI(`/node-types/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Fetch node categories
 */
export async function getNodeCategories(): Promise<NodeCategory[]> {
  return fetchAPI('/node-types/categories')
}
