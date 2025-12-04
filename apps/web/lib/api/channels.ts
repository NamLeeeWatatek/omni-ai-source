/**
 * Channels API
 * API calls for managing channels and integrations
 */
import { axiosClient } from '../axios-client'
import type { Channel, ChannelType, IntegrationConfig, CreateIntegrationDto, UpdateIntegrationDto } from '../types/channel'

/**
 * Get all available channel types
 */
export async function getChannelTypes(): Promise<ChannelType[]> {
  const response = await axiosClient.get('/channels/types')
  return response.data
}

/**
 * Get channel type categories
 */
export async function getChannelCategories(): Promise<string[]> {
  const response = await axiosClient.get('/channels/types/categories')
  return response.data
}

/**
 * Get all connected channels
 */
export async function getChannels(): Promise<Channel[]> {
  const response = await axiosClient.get('/channels/')
  return response.data
}

/**
 * Disconnect a channel
 */
export async function disconnectChannel(id: number): Promise<void> {
  await axiosClient.delete(`/channels/${id}`)
}

/**
 * Get all integration configurations
 */
export async function getIntegrations(): Promise<IntegrationConfig[]> {
  const response = await axiosClient.get('/integrations/')
  return response.data
}

/**
 * Create integration configuration
 */
export async function createIntegration(data: CreateIntegrationDto): Promise<IntegrationConfig> {
  const response = await axiosClient.post('/integrations/', data)
  return response.data
}

/**
 * Update integration configuration
 */
export async function updateIntegration(id: number, data: UpdateIntegrationDto): Promise<IntegrationConfig> {
  const response = await axiosClient.patch(`/integrations/${id}`, data)
  return response.data
}

/**
 * Delete integration configuration
 */
export async function deleteIntegration(id: number): Promise<void> {
  await axiosClient.delete(`/integrations/${id}`)
}

/**
 * Get OAuth login URL
 */
export async function getOAuthUrl(provider: string, configId?: number): Promise<{ url: string }> {
  const configParam = configId ? `?configId=${configId}` : ''
  const response = await axiosClient.get(`/oauth/login/${provider}${configParam}`)
  return response.data
}
