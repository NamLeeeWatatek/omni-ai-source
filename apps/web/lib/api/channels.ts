/**
 * Channels API
 * API calls for managing channels and integrations
 */
import { fetchAPI } from '../api'
import type { Channel, ChannelType, IntegrationConfig, CreateIntegrationDto, UpdateIntegrationDto } from '../types/channel'

/**
 * Get all available channel types
 */
export async function getChannelTypes(): Promise<ChannelType[]> {
  return fetchAPI('/channels/types')
}

/**
 * Get channel type categories
 */
export async function getChannelCategories(): Promise<string[]> {
  return fetchAPI('/channels/types/categories')
}

/**
 * Get all connected channels
 */
export async function getChannels(): Promise<Channel[]> {
  return fetchAPI('/channels/')
}

/**
 * Disconnect a channel
 */
export async function disconnectChannel(id: number): Promise<void> {
  return fetchAPI(`/channels/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Get all integration configurations
 */
export async function getIntegrations(): Promise<IntegrationConfig[]> {
  return fetchAPI('/integrations/')
}

/**
 * Create integration configuration
 */
export async function createIntegration(data: CreateIntegrationDto): Promise<IntegrationConfig> {
  return fetchAPI('/integrations/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Update integration configuration
 */
export async function updateIntegration(id: number, data: UpdateIntegrationDto): Promise<IntegrationConfig> {
  return fetchAPI(`/integrations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * Delete integration configuration
 */
export async function deleteIntegration(id: number): Promise<void> {
  return fetchAPI(`/integrations/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Get OAuth login URL
 */
export async function getOAuthUrl(provider: string, configId?: number): Promise<{ url: string }> {
  const configParam = configId ? `?configId=${configId}` : ''
  return fetchAPI(`/oauth/login/${provider}${configParam}`)
}
