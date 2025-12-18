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
  return axiosClient.get('/channels/types')
}

/**
 * Get channel type categories
 */
export async function getChannelCategories(): Promise<string[]> {
  return axiosClient.get('/channels/types/categories')
}

/**
 * Get all connected channels
 */
export async function getChannels(): Promise<Channel[]> {
  return axiosClient.get('/channels/')
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
  return axiosClient.get('/integrations/')
}

/**
 * Create integration configuration
 */
export async function createIntegration(data: CreateIntegrationDto): Promise<IntegrationConfig> {
  return axiosClient.post('/integrations/', data)
}

/**
 * Update integration configuration
 */
export async function updateIntegration(id: number, data: UpdateIntegrationDto): Promise<IntegrationConfig> {
  return axiosClient.patch(`/integrations/${id}`, data)
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
  return axiosClient.get(`/oauth/login/${provider}${configParam}`)
}
