
export interface KnowledgeBase {
  id: string;
  workspaceId?: string | null;
  userId?: string;
  createdBy?: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color: string;
  isPublic: boolean;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  totalDocuments: number;
  totalSize: string;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
  folders?: KBFolder[];
  documents?: KBDocument[];
  agentMappings?: AgentKnowledgeBase[];
  botMappings?: any[];
}

export interface CreateKnowledgeBaseDto {
  name: string;
  description?: string;
  workspaceId?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  tags?: string[];
}

export interface UpdateKnowledgeBaseDto {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isPublic?: boolean;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  tags?: string[];
}

export interface KnowledgeBaseStats {
  id: string;
  name: string;
  totalDocuments: number;
  totalSize: string;
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface KBFolder {
  id: string;
  knowledgeBaseId: string;
  parentId?: string | null;
  parentFolderId?: string | null;
  name: string;
  description?: string | null;
  path?: string | null;
  icon?: string | null;
  color?: string | null;
  order?: number;
  createdAt: string;
  updatedAt?: string;
  subFolders?: KBFolder[];
  documents?: KBDocument[];
}

export interface KBFolderTree extends KBFolder {
  children: KBFolderTree[];
}

export interface CreateFolderDto {
  knowledgeBaseId: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  icon?: string;
  color?: string;
  order?: number;
}

export interface UpdateFolderDto {
  name?: string;
  description?: string;
  parentFolderId?: string;
  icon?: string;
  color?: string;
  order?: number;
}

export interface KBDocument {
  id: string;
  knowledgeBaseId: string;
  folderId?: string | null;
  name: string;
  title?: string;
  type?: 'file' | 'url' | 'text';
  fileType: string;
  fileSize: string;
  fileUrl?: string | null;
  sourceUrl?: string | null;
  mimeType?: string | null;
  content?: string | null;
  metadata?: Record<string, any> | null;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string | null;
  chunkCount: number;
  tags?: string[] | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentDto {
  knowledgeBaseId: string;
  name: string;
  content: string;
  folderId?: string;
  fileType?: string;
  mimeType?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateDocumentDto {
  name?: string;
  content?: string;
  folderId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UploadDocumentDto {
  file: File;
  knowledgeBaseId: string;
  folderId?: string;
}

export interface QueryKnowledgeBaseDto {
  query: string;
  knowledgeBaseId?: string;
  limit?: number;
  similarityThreshold?: number;
}

export interface QueryResult {
  content: string;
  score: number;
  metadata?: Record<string, any>;
  documentId?: string;
  chunkIndex?: number;
}

export interface QueryResponse {
  success: boolean;
  query: string;
  results: QueryResult[];
}

export interface GenerateAnswerDto {
  question: string;
  knowledgeBaseId?: string;
  model?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RAGSource {
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface GenerateAnswerResponse {
  success: boolean;
  question: string;
  answer: string;
  sources: RAGSource[];
}

export interface AgentKnowledgeBase {
  id: string;
  agentId: string;
  knowledgeBaseId: string;
  isActive: boolean;
  priority: number;
  maxResults: number;
  similarityThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignAgentDto {
  agentId: string;
  isActive?: boolean;
  priority?: number;
  maxResults?: number;
  similarityThreshold?: number;
}

export type GetKnowledgeBasesResponse = KnowledgeBase[];
export type GetKnowledgeBaseResponse = KnowledgeBase;
export type CreateKnowledgeBaseResponse = KnowledgeBase;
export type UpdateKnowledgeBaseResponse = KnowledgeBase;
export type DeleteKnowledgeBaseResponse = { success: boolean };
export type GetKnowledgeBaseStatsResponse = KnowledgeBaseStats;

export type GetFoldersResponse = KBFolder[];
export type GetFolderTreeResponse = KBFolderTree[];
export type CreateFolderResponse = KBFolder;
export type UpdateFolderResponse = KBFolder;
export type DeleteFolderResponse = { success: boolean };

export type GetDocumentsResponse = KBDocument[];
export type GetDocumentResponse = KBDocument;
export type CreateDocumentResponse = KBDocument;
export type UpdateDocumentResponse = KBDocument;
export type DeleteDocumentResponse = { success: boolean };
export type MoveDocumentResponse = KBDocument;

export type GetAgentAssignmentsResponse = AgentKnowledgeBase[];
export type AssignAgentResponse = AgentKnowledgeBase;
export type UnassignAgentResponse = { success: boolean };
