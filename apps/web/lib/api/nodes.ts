/**
 * Node Management API
 * API calls for managing node types
 */
import { axiosClient } from '../axios-client'
import type { NodeType, NodeCategory, CreateNodeTypeDto, UpdateNodeTypeDto } from '../types/node'

/**
 * Fetch all node types
 */
export async function getNodeTypes(category?: string): Promise<NodeType[]> {
  const url = category ? `/node-types/?category=${category}` : '/node-types/'
  const response = await axiosClient.get(url)
  return response.data
}

/**
 * Fetch single node type
 */
export async function getNodeType(id: string): Promise<NodeType> {
  const response = await axiosClient.get(`/node-types/${id}`)
  return response.data
}

/**
 * Create new node type
 */
export async function createNodeType(data: CreateNodeTypeDto): Promise<NodeType> {
  const response = await axiosClient.post('/node-types/', data)
  return response.data
}

/**
 * Update node type using PATCH
 */
export async function updateNodeType(id: string, data: UpdateNodeTypeDto): Promise<NodeType> {
  const response = await axiosClient.patch(`/node-types/${id}`, data)
  return response.data
}

/**
 * Delete node type
 */
export async function deleteNodeType(id: string): Promise<void> {
  await axiosClient.delete(`/node-types/${id}`)
}

/**
 * Fetch node categories
 */
export async function getNodeCategories(): Promise<NodeCategory[]> {
  const response = await axiosClient.get('/node-types/categories')
  return response.data
}
