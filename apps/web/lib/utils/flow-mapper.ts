/**
 * Flow Mapper Utilities
 * Map between Backend Flow and Frontend Flow structures
 */

import type { Node, Edge } from 'reactflow'
import type { Flow, FlowNode, FlowEdge } from '@/lib/types/flow'
import type { NodeType } from '@/lib/types/node'
import {
  mapBackendNodeToReactFlow,
  mapReactFlowNodeToBackend,
  type BackendNode,
} from './node-mapper'

/**
 * Backend Flow Structure (from API)
 */
export interface BackendFlow {
  id: string
  name: string
  description?: string
  status: string
  version: number
  nodes: BackendNode[]
  edges: FlowEdge[]
  ownerId?: string
  teamId?: string
  visibility?: string
  published: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

/**
 * Map Backend Flow to Frontend Flow with ReactFlow nodes
 */
export function mapBackendFlowToFrontend(
  backendFlow: BackendFlow,
  nodeTypes: NodeType[]
): Flow & { reactFlowNodes: Node[]; reactFlowEdges: Edge[] } {
  const nodeTypeMap = new Map(nodeTypes.map(nt => [nt.id, nt]))
  
  // Map nodes to ReactFlow format
  const reactFlowNodes = backendFlow.nodes.map(node =>
    mapBackendNodeToReactFlow(node, nodeTypeMap.get(node.type))
  )

  // Map edges to ReactFlow format
  const reactFlowEdges: Edge[] = backendFlow.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type || 'default',
  }))

  return {
    id: backendFlow.id,
    name: backendFlow.name,
    description: backendFlow.description,
    status: backendFlow.status as 'draft' | 'published' | 'archived',
    version: backendFlow.version,
    nodes: backendFlow.nodes as FlowNode[],
    edges: backendFlow.edges,
    ownerId: backendFlow.ownerId,
    teamId: backendFlow.teamId,
    visibility: backendFlow.visibility as 'private' | 'team' | 'public',
    published: backendFlow.published,
    tags: backendFlow.tags,
    createdAt: backendFlow.createdAt,
    updatedAt: backendFlow.updatedAt,
    // Additional ReactFlow data
    reactFlowNodes,
    reactFlowEdges,
  }
}

/**
 * Map Frontend Flow (with ReactFlow nodes) to Backend Flow
 */
export function mapFrontendFlowToBackend(
  flow: Partial<Flow>,
  reactFlowNodes?: Node[],
  reactFlowEdges?: Edge[]
): Partial<BackendFlow> {
  const backendNodes = reactFlowNodes
    ? reactFlowNodes.map(mapReactFlowNodeToBackend)
    : flow.nodes?.map(node => {
        // If already in backend format
        if ('type' in node && 'data' in node) {
          return node as unknown as BackendNode
        }
        // Convert from WorkflowNode
        return mapReactFlowNodeToBackend(node as unknown as Node)
      })

  const backendEdges = reactFlowEdges
    ? reactFlowEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
      }))
    : flow.edges

  return {
    id: flow.id,
    name: flow.name,
    description: flow.description,
    status: flow.status,
    version: flow.version,
    nodes: backendNodes,
    edges: backendEdges,
    ownerId: flow.ownerId,
    teamId: flow.teamId,
    visibility: flow.visibility,
    published: flow.published,
    tags: flow.tags,
  }
}

/**
 * Create empty flow structure
 */
export function createEmptyFlow(name: string, userId: string): Partial<BackendFlow> {
  return {
    name,
    description: '',
    status: 'draft',
    version: 1,
    nodes: [],
    edges: [],
    ownerId: userId,
    visibility: 'private',
    published: false,
    tags: [],
  }
}

/**
 * Validate flow structure
 */
export function validateBackendFlow(flow: any): flow is BackendFlow {
  return (
    typeof flow === 'object' &&
    typeof flow.id === 'string' &&
    typeof flow.name === 'string' &&
    typeof flow.version === 'number' &&
    Array.isArray(flow.nodes) &&
    Array.isArray(flow.edges)
  )
}
