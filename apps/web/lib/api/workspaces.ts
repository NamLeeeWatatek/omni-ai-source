/**
 * Workspaces API
 */
import axiosClient from '../axios-client'

export interface Workspace {
    id: string
    name: string
    slug: string
    ownerId: string
    createdAt: string
    updatedAt: string
}

export const workspacesApi = {
    async getCurrent(): Promise<Workspace> {
        return axiosClient.get<Workspace>('/workspaces/current') as unknown as Workspace
    },

    async getAll(): Promise<Workspace[]> {
        return axiosClient.get<Workspace[]>('/workspaces') as unknown as Workspace[]
    }
}
