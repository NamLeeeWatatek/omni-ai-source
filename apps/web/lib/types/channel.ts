
export interface ChannelType {
  id: string
  name: string
  description: string
  category: 'messaging' | 'social' | 'ecommerce' | 'crm' | 'marketing' | 'support' | 'automation' | 'productivity' | 'business'
  icon: string
  color: string
  multiAccount: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Channel {
  id: number
  name: string
  type: string
  icon?: string
  status: string
  connected_at: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  metadata?: Record<string, any> // ✅ For storing botId and other data
}

export interface IntegrationConfig {
  id: number
  name?: string
  provider: string
  client_id: string
  client_secret: string
  scopes?: string
  verify_token?: string // ✅ For Facebook webhook verification
  is_active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateIntegrationDto {
  provider: string
  name?: string
  clientId: string
  clientSecret: string
  scopes?: string
  isActive?: boolean
}

export interface UpdateIntegrationDto {
  name?: string
  clientId?: string
  clientSecret?: string
  scopes?: string
  isActive?: boolean
}
