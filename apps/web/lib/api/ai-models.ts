
import { axiosClient } from '../axios-client'
import type {
  GetModelsResponse,
  GetDefaultModelResponse,
  ChatRequest,
  PostChatResponse,
  ChatWithHistoryRequest,
  PostChatWithHistoryResponse,
} from '../types/ai-models'

/**
 * Get all available AI models grouped by provider
 */
export async function getAIModels(): Promise<GetModelsResponse> {
  const response = await axiosClient.get('/ai-models/models')
  return response.data
}

/**
 * Get default AI model
 */
export async function getDefaultAIModel(): Promise<GetDefaultModelResponse> {
  const response = await axiosClient.get('/ai-models/models/default')
  return response.data
}

/**
 * Chat with AI model
 */
export async function chatWithAI(data: ChatRequest): Promise<PostChatResponse> {
  const response = await axiosClient.post('/ai-models/chat', data)
  return response.data
}

/**
 * Chat with conversation history
 */
export async function chatWithAIHistory(data: ChatWithHistoryRequest): Promise<PostChatWithHistoryResponse> {
  const response = await axiosClient.post('/ai-models/chat/history', data)
  return response.data
}
