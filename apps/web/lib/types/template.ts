export interface Template {
    id: string
    name: string
    description?: string | null
    prompt?: string | null
    mediaFiles?: string[] | null
    styleConfig?: Record<string, any> | null
    category?: string | null
    isActive: boolean
    createdBy?: string | null
    workspaceId?: string | null
    createdAt: string
    updatedAt: string
    deletedAt?: string | null
}

export interface CreateTemplateDto {
    name: string
    description?: string | null
    prompt?: string | null
    mediaFiles?: string[] | null
    styleConfig?: Record<string, any> | null
    category?: string | null
    isActive?: boolean
    workspaceId?: string | null
}

export interface UpdateTemplateDto {
    name?: string
    description?: string | null
    prompt?: string | null
    mediaFiles?: string[] | null
    styleConfig?: Record<string, any> | null
    category?: string | null
    isActive?: boolean
    workspaceId?: string | null
}

export interface QueryTemplateDto {
    page?: number
    limit?: number
    filters?: FilterTemplateDto | null
    sort?: SortTemplateDto[] | null
}

export interface FilterTemplateDto {
    isActive?: boolean
    name?: string
    category?: string
    workspaceId?: string
    createdBy?: string
}

export interface SortTemplateDto {
    orderBy: keyof Template
    order: 'ASC' | 'DESC'
}
