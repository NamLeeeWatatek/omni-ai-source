
import { axiosClient } from '../axios-client'
import type {
  GetConversationsResponse,
  GetConversationResponse,
  CreateConversationDto,
  CreateConversationResponse,
  GetMessagesResponse,
  CreateMessageDto,
  AddMessageResponse,
  GetAiConversationsResponse,
  GetAiConversationResponse,
  CreateAiConversationDto,
  CreateAiConversationResponse,
  UpdateAiConversationDto,
  UpdateAiConversationResponse,
  DeleteAiConversationResponse,
  AddAiMessageDto,
  AddAiMessageResponse,
} from '../types/conversations'

export interface GetConversationsParams {
  botId?: string
  channelType?: string
  status?: 'active' | 'closed' | 'handover' | 'archived'
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  source?: 'all' | 'channel' | 'widget'
}

/**
 * Get all bot conversations with advanced filtering
 * 
 * @param params - Query parameters
 * @param params.botId - Filter by bot ID
 * @param params.channelType - Filter by channel type (facebook, instagram, telegram, etc.)
 * @param params.status - Filter by status (active, closed, handover, archived)
 * @param params.startDate - Filter conversations created after this date
 * @param params.endDate - Filter conversations created before this date
 * @param params.page - Page number for pagination (default: 1)
 * @param params.limit - Items per page (default: 20, max: 100)
 * @param params.source - Filter by source:
 *   - 'all': All conversations (default)
 *   - 'channel': Only channel conversations (Facebook, WhatsApp, etc.)
 *   - 'widget': Only widget conversations (AI chat from website)
 * 
 * @example
 * // Get all conversations
 * const all = await getBotConversations()
 * 
 * // Get only Facebook conversations
 * const facebook = await getBotConversations({ source: 'channel', channelType: 'facebook' })
 * 
 * // Get only widget conversations
 * const widget = await getBotConversations({ source: 'widget' })
 * 
 * // Get active conversations for a specific bot
 * const active = await getBotConversations({ botId: 'bot-id', status: 'active' })
 */
export async function getBotConversations(params?: GetConversationsParams): Promise<GetConversationsResponse> {
  const response = await axiosClient.get('/conversations', { params })
  return response.data
}

/**
 * Get conversation by ID
 */
export async function getBotConversation(id: string): Promise<GetConversationResponse> {
  const response = await axiosClient.get(`/conversations/${id}`)
  return response.data
}

/**
 * Create conversation
 */
export async function createBotConversation(data: CreateConversationDto): Promise<CreateConversationResponse> {
  const response = await axiosClient.post('/conversations', data)
  return response.data
}

/**
 * Get messages in conversation
 */
export async function getBotConversationMessages(conversationId: string): Promise<GetMessagesResponse> {
  const response = await axiosClient.get(`/conversations/${conversationId}/messages`)
  return response.data
}

/**
 * Add message to conversation
 */
export async function addBotConversationMessage(conversationId: string, data: CreateMessageDto): Promise<AddMessageResponse> {
  const response = await axiosClient.post(`/conversations/${conversationId}/messages`, data)
  return response.data
}

/**
 * Get all AI conversations
 */
export async function getAIConversations(): Promise<GetAiConversationsResponse> {
  const response = await axiosClient.get('/ai-conversations')
  return response.data
}

/**
 * Get AI conversation by ID
 */
export async function getAIConversation(id: string): Promise<GetAiConversationResponse> {
  const response = await axiosClient.get(`/ai-conversations/${id}`)
  return response.data
}

/**
 * Create AI conversation
 */
export async function createAIConversation(data: CreateAiConversationDto): Promise<CreateAiConversationResponse> {
  const response = await axiosClient.post('/ai-conversations', data)
  return response.data
}

/**
 * Update AI conversation
 */
export async function updateAIConversation(id: string, data: UpdateAiConversationDto): Promise<UpdateAiConversationResponse> {
  const response = await axiosClient.patch(`/ai-conversations/${id}`, data)
  return response.data
}

/**
 * Delete AI conversation
 */
export async function deleteAIConversation(id: string): Promise<DeleteAiConversationResponse> {
  const response = await axiosClient.delete(`/ai-conversations/${id}`)
  return response.data
}

/**
 * Add message to AI conversation
 */
export async function addAIConversationMessage(id: string, data: AddAiMessageDto): Promise<AddAiMessageResponse> {
  const response = await axiosClient.post(`/ai-conversations/${id}/messages`, data)
  return response.data
}
