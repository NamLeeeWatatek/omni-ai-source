import axiosClient from '../axios-client'

export interface Bot {
  id: string
  workspaceId: string
  name: string
  description?: string
  avatarUrl?: string
  defaultLanguage: string
  timezone: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdBy: string
  icon?: string
  isActive?: boolean
  flowId?: string | null
  systemPrompt?: string | null
  functions?: string[] | null
  functionConfig?: Record<string, any> | null
  aiProviderId?: string | null
  aiModelName?: string | null
  aiParameters?: Record<string, any> | null
  knowledgeBaseIds?: string[] | null
  enableAutoLearn?: boolean
  createdAt: string
  updatedAt: string
}

export interface BotChannel {
  id: string
  botId: string
  type: string
  name: string
  config?: Record<string, any>
  isActive: boolean
  connectedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateBotDto {
  name: string
  description?: string
  avatarUrl?: string
  defaultLanguage?: string
  timezone?: string
  status?: 'draft' | 'active' | 'paused' | 'archived'
  workspaceId?: string
  systemPrompt?: string
  functions?: string[]
  functionConfig?: Record<string, any>
  aiProviderId?: string
  aiModelName?: string
  aiParameters?: Record<string, any>
  knowledgeBaseIds?: string[]
  enableAutoLearn?: boolean
  icon?: string
  isActive?: boolean
}

export interface UpdateBotDto extends Partial<CreateBotDto> { }

export const botsApi = {
  async getAll(workspaceId: string, status?: string) {
    const params = new URLSearchParams({ workspaceId })
    if (status) params.append('status', status)
    const response = await axiosClient.get(`/bots?${params}`)
    return response.data || response
  },

  async getOne(id: string): Promise<Bot> {
    const response = await axiosClient.get(`/bots/${id}`)
    return response.data || response
  },

  async create(data: CreateBotDto): Promise<Bot> {
    const response = await axiosClient.post('/bots', data)
    return response.data || response
  },

  async update(id: string, data: UpdateBotDto): Promise<Bot> {
    const response = await axiosClient.patch(`/bots/${id}`, data)
    return response.data || response
  },

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/bots/${id}`)
  },

  async activate(id: string): Promise<Bot> {
    const response = await axiosClient.post(`/bots/${id}/activate`)
    return response.data || response
  },

  async pause(id: string): Promise<Bot> {
    const response = await axiosClient.post(`/bots/${id}/pause`)
    return response.data || response
  },

  async archive(id: string): Promise<Bot> {
    const response = await axiosClient.post(`/bots/${id}/archive`)
    return response.data || response
  },

  async duplicate(id: string, name?: string): Promise<Bot> {
    const response = await axiosClient.post(`/bots/${id}/duplicate`, { name })
    return response.data || response
  },

  async getChannels(botId: string): Promise<BotChannel[]> {
    const response = await axiosClient.get(`/bots/${botId}/channels`)
    return response.data || response
  },

  async createChannel(
    botId: string,
    data: { type: string; name: string; config?: Record<string, any> }
  ): Promise<BotChannel> {
    const response = await axiosClient.post(`/bots/${botId}/channels`, data)
    return response.data || response
  },

  async updateChannel(
    botId: string,
    channelId: string,
    data: { name?: string; config?: Record<string, any>; isActive?: boolean }
  ): Promise<BotChannel> {
    const response = await axiosClient.patch(
      `/bots/${botId}/channels/${channelId}`,
      data
    )
    return response.data || response
  },

  async deleteChannel(botId: string, channelId: string): Promise<void> {
    await axiosClient.delete(`/bots/${botId}/channels/${channelId}`)
  },

  async toggleChannel(
    botId: string,
    channelId: string,
    isActive: boolean
  ): Promise<BotChannel> {
    const response = await axiosClient.patch(
      `/bots/${botId}/channels/${channelId}/toggle`,
      { isActive }
    )
    return response.data || response
  },

  async executeFunction(
    botId: string,
    functionName: string,
    input: Record<string, any>,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<any> {
    const response = await axiosClient.post(`/bots/${botId}/execute/${functionName}`, {
      input,
      conversationHistory,
    })
    return response.data || response
  },

  async chat(
    botId: string,
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>,
    knowledgeBaseIds?: string[]
  ): Promise<{ response: string; sources?: any[] }> {
    console.log('[Bot Chat]', {
      botId,
      message: message.substring(0, 50),
      knowledgeBaseIds,
      historyLength: conversationHistory?.length || 0,
    });

    const response = await axiosClient.post(`/knowledge-bases/chat`, {
      message,
      botId,
      knowledgeBaseIds: knowledgeBaseIds && knowledgeBaseIds.length > 0 ? knowledgeBaseIds : undefined,
      conversationHistory: conversationHistory?.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
    });

    const data = response.data || response;
    console.log('[Bot Chat Response]', {
      answerLength: data.answer?.length || 0,
      sourcesCount: data.sources?.length || 0,
    });

    return {
      response: data.answer,
      sources: data.sources || []
    };
  },
}

export const executeBotFunction = botsApi.executeFunction.bind(botsApi)
