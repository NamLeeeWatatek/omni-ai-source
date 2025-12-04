/**
 * Knowledge Base API
 * API client for knowledge base management, documents, folders, and RAG
 */

import axiosClient from '@/lib/axios-client'
import type {
  // Knowledge Base
  GetKnowledgeBasesResponse,
  GetKnowledgeBaseResponse,
  CreateKnowledgeBaseDto,
  CreateKnowledgeBaseResponse,
  UpdateKnowledgeBaseDto,
  UpdateKnowledgeBaseResponse,
  DeleteKnowledgeBaseResponse,
  GetKnowledgeBaseStatsResponse,
  // Folders
  GetFoldersResponse,
  GetFolderTreeResponse,
  CreateFolderDto,
  CreateFolderResponse,
  UpdateFolderDto,
  UpdateFolderResponse,
  DeleteFolderResponse,
  // Documents
  GetDocumentsResponse,
  GetDocumentResponse,
  CreateDocumentDto,
  CreateDocumentResponse,
  UpdateDocumentDto,
  UpdateDocumentResponse,
  DeleteDocumentResponse,
  MoveDocumentResponse,
  // Query & RAG
  QueryKnowledgeBaseDto,
  QueryResponse,
  GenerateAnswerDto,
  GenerateAnswerResponse,
  // Agent Assignment
  GetAgentAssignmentsResponse,
  AssignAgentDto,
  AssignAgentResponse,
  UnassignAgentResponse,
} from '../types/knowledge-base'

// ============================================================================
// Knowledge Base Management
// ============================================================================

/**
 * Get all knowledge bases
 * @param workspaceId - Optional workspace ID to filter knowledge bases
 */
export async function getKnowledgeBases(workspaceId?: string): Promise<GetKnowledgeBasesResponse> {
  const response = await axiosClient.get('/knowledge-bases', {
    params: workspaceId ? { workspaceId } : undefined
  })
  return response.data
}

/**
 * Get knowledge base by ID
 */
export async function getKnowledgeBase(id: string): Promise<GetKnowledgeBaseResponse> {
  return axiosClient.get(`/knowledge-bases/${id}`)
}

/**
 * Create knowledge base
 */
export async function createKnowledgeBase(data: CreateKnowledgeBaseDto): Promise<CreateKnowledgeBaseResponse> {
  return axiosClient.post('/knowledge-bases', data)
}

/**
 * Update knowledge base
 */
export async function updateKnowledgeBase(id: string, data: UpdateKnowledgeBaseDto): Promise<UpdateKnowledgeBaseResponse> {
  return axiosClient.patch(`/knowledge-bases/${id}`, data)
}

/**
 * Delete knowledge base
 */
export async function deleteKnowledgeBase(id: string): Promise<DeleteKnowledgeBaseResponse> {
  return axiosClient.delete(`/knowledge-bases/${id}`)
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeBaseStats(id: string): Promise<GetKnowledgeBaseStatsResponse> {
  return axiosClient.get(`/knowledge-bases/${id}/stats`)
}

// ============================================================================
// Folders
// ============================================================================

/**
 * Create folder
 */
export async function createKBFolder(data: CreateFolderDto): Promise<CreateFolderResponse> {
  return axiosClient.post('/knowledge-bases/folders', data)
}

/**
 * Get folders in knowledge base
 */
export async function getKBFolders(kbId: string): Promise<GetFoldersResponse> {
  return axiosClient.get(`/knowledge-bases/${kbId}/folders`)
}

/**
 * Get folder tree structure
 */
export async function getKBFolderTree(kbId: string): Promise<GetFolderTreeResponse> {
  return axiosClient.get(`/knowledge-bases/${kbId}/folders/tree`)
}

/**
 * Update folder
 */
export async function updateKBFolder(folderId: string, data: UpdateFolderDto): Promise<UpdateFolderResponse> {
  return axiosClient.patch(`/knowledge-bases/folders/${folderId}`, data)
}

/**
 * Move folder to another parent folder
 */
export async function moveKBFolder(folderId: string, parentFolderId: string | null): Promise<UpdateFolderResponse> {
  return axiosClient.patch(`/knowledge-bases/folders/${folderId}`, { parentFolderId })
}

/**
 * Delete folder
 */
export async function deleteKBFolder(folderId: string): Promise<DeleteFolderResponse> {
  return axiosClient.delete(`/knowledge-bases/folders/${folderId}`)
}

// ============================================================================
// Documents
// ============================================================================

/**
 * Create document
 */
export async function createKBDocument(data: CreateDocumentDto): Promise<CreateDocumentResponse> {
  return axiosClient.post('/knowledge-bases/documents', data)
}

/**
 * Get documents in knowledge base
 */
export async function getKBDocuments(kbId: string, folderId?: string): Promise<GetDocumentsResponse> {
  return axiosClient.get(`/knowledge-bases/${kbId}/documents`, {
    params: folderId ? { folderId } : undefined
  })
}

/**
 * Get document by ID
 */
export async function getKBDocument(documentId: string): Promise<GetDocumentResponse> {
  return axiosClient.get(`/knowledge-bases/documents/${documentId}`)
}

/**
 * Update document
 */
export async function updateKBDocument(documentId: string, data: UpdateDocumentDto): Promise<UpdateDocumentResponse> {
  return axiosClient.patch(`/knowledge-bases/documents/${documentId}`, data)
}

/**
 * Delete document
 */
export async function deleteKBDocument(documentId: string): Promise<DeleteDocumentResponse> {
  return axiosClient.delete(`/knowledge-bases/documents/${documentId}`)
}

/**
 * Move document to folder
 */
export async function moveKBDocument(documentId: string, folderId: string | null): Promise<MoveDocumentResponse> {
  return axiosClient.patch(`/knowledge-bases/documents/${documentId}/move`, { folderId })
}

/**
 * Get document download URL
 */
export async function getKBDocumentDownloadUrl(documentId: string): Promise<{
  url: string
  filename: string
  mimeType: string
}> {
  return axiosClient.get(`/knowledge-bases/documents/${documentId}/download`)
}

/**
 * Upload document file
 */
export async function uploadKBDocument(file: File, kbId: string, folderId?: string): Promise<CreateDocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('knowledgeBaseId', kbId)
  if (folderId) {
    formData.append('folderId', folderId)
  }

  // Let axios automatically set Content-Type with boundary for FormData
  return axiosClient.post('/knowledge-bases/documents/upload', formData)
}

// ============================================================================
// Query & RAG
// ============================================================================

/**
 * Query knowledge base (vector search)
 */
export async function queryKnowledgeBase(data: QueryKnowledgeBaseDto): Promise<QueryResponse> {
  return axiosClient.post('/knowledge-bases/query', data)
}

/**
 * Generate answer using RAG
 */
export async function generateKBAnswer(data: GenerateAnswerDto): Promise<GenerateAnswerResponse> {
  return axiosClient.post('/knowledge-bases/answer', data)
}

/**
 * Simple chat (answer only, no sources)
 */
export async function chatWithKB(data: {
  message: string
  botId?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  model?: string
}): Promise<{ success: boolean; answer: string }> {
  return axiosClient.post('/knowledge-bases/chat', data)
}

/**
 * Crawl website
 */
export async function crawlWebsite(data: {
  url: string
  knowledgeBaseId: string
  maxPages?: number
  maxDepth?: number
  followLinks?: boolean
  includePatterns?: string[]
  excludePatterns?: string[]
}): Promise<{ success: boolean; documentsCreated: number; errors: string[] }> {
  return axiosClient.post('/knowledge-bases/crawl/website', data)
}

/**
 * Crawl sitemap
 */
export async function crawlSitemap(data: {
  sitemapUrl: string
  knowledgeBaseId: string
  maxPages?: number
}): Promise<{ success: boolean; documentsCreated: number; errors: string[] }> {
  return axiosClient.post('/knowledge-bases/crawl/sitemap', data)
}

// ============================================================================
// Agent Assignment
// ============================================================================

/**
 * Assign agent to knowledge base
 */
export async function assignAgentToKB(kbId: string, data: AssignAgentDto): Promise<AssignAgentResponse> {
  return axiosClient.post(`/knowledge-bases/${kbId}/agents`, data)
}

/**
 * Unassign agent from knowledge base
 */
export async function unassignAgentFromKB(kbId: string, agentId: string): Promise<UnassignAgentResponse> {
  return axiosClient.delete(`/knowledge-bases/${kbId}/agents/${agentId}`)
}

/**
 * Get agent assignments
 */
export async function getKBAgentAssignments(kbId: string): Promise<GetAgentAssignmentsResponse> {
  return axiosClient.get(`/knowledge-bases/${kbId}/agents`)
}
