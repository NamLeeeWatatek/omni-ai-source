/**
 * Flows API Client
 * API calls for workflow management and execution
 * Synced with backend: apps/backend/src/flows/flows.controller.ts
 */

import { axiosClient } from '../axios-client'
import type {
  Flow,
  CreateFlowDto,
  UpdateFlowDto,
  CreateFlowFromTemplateDto,
  ExecuteFlowDto,
  ExecuteFlowResponse,
  FlowExecution,
} from '../types/flow'

// ============================================================================
// Flow Management
// ============================================================================

/**
 * Get all flows for current user
 */
export async function getFlows(): Promise<Flow[]> {
  const response = await axiosClient.get('/flows')
  return response.data
}

/**
 * Get flow by ID
 */
export async function getFlow(id: string): Promise<Flow> {
  const response = await axiosClient.get(`/flows/${id}`)
  return response.data
}

/**
 * Create new flow
 */
export async function createFlow(data: CreateFlowDto): Promise<Flow> {
  const response = await axiosClient.post('/flows', data)
  return response.data
}

/**
 * Create flow from template
 */
export async function createFlowFromTemplate(data: CreateFlowFromTemplateDto): Promise<Flow> {
  const response = await axiosClient.post('/flows/from-template', data)
  return response.data
}

/**
 * Update flow
 */
export async function updateFlow(id: string, data: UpdateFlowDto): Promise<Flow> {
  const response = await axiosClient.patch(`/flows/${id}`, data)
  return response.data
}

/**
 * Delete flow
 */
export async function deleteFlow(id: string): Promise<void> {
  await axiosClient.delete(`/flows/${id}`)
}

// ============================================================================
// Flow Execution
// ============================================================================

/**
 * Execute flow
 */
export async function executeFlow(
  id: string,
  data?: ExecuteFlowDto
): Promise<ExecuteFlowResponse> {
  const response = await axiosClient.post(`/flows/${id}/execute`, data)
  return response.data
}

/**
 * Get all executions for a flow
 */
export async function getFlowExecutions(flowId: string): Promise<FlowExecution[]> {
  const response = await axiosClient.get(`/flows/${flowId}/executions`)
  return response.data
}

/**
 * Get execution details
 */
export async function getFlowExecution(executionId: string): Promise<FlowExecution> {
  const response = await axiosClient.get(`/flows/executions/${executionId}`)
  return response.data
}

// ============================================================================
// Legacy Support (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getFlows() instead
 */
export async function fetchFlows(): Promise<Flow[]> {
  return getFlows()
}

/**
 * @deprecated Use getFlow() instead
 */
export async function fetchFlow(id: string): Promise<Flow> {
  return getFlow(id)
}
