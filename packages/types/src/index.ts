// User & Workspace
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// Bot & Flow
export interface Bot {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NodeType = 
  | 'start'
  | 'message'
  | 'ai-reply'
  | 'condition'
  | 'n8n-trigger'
  | 'human-handover'
  | 'end';

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Flow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowVersion {
  id: string;
  botId: string;
  version: number;
  flow: Flow;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Channel
export type ChannelType = 
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'telegram'
  | 'webchat'
  | 'email';

export interface Channel {
  id: string;
  workspaceId: string;
  type: ChannelType;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Conversation & Message
export interface Conversation {
  id: string;
  channelId: string;
  externalId: string;
  customerName?: string;
  customerAvatar?: string;
  lastMessageAt: string;
  status: 'open' | 'assigned' | 'resolved';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  contentType: 'text' | 'image' | 'file' | 'audio' | 'video';
  metadata?: Record<string, any>;
  createdAt: string;
}

// API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// AI Suggestions
export interface NodeSuggestion {
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
  reason: string;
}

export interface AISuggestionResponse {
  suggestions: NodeSuggestion[];
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  workspaceName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  workspace: Workspace;
}
