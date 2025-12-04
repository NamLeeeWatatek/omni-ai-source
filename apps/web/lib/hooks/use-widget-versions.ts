'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface WidgetVersion {
    id: string;
    version: string;
    status: 'draft' | 'published' | 'archived';
    isActive: boolean;
    publishedAt?: string;
    changelog?: string;
    createdAt: string;
}

interface WidgetVersionDetail extends WidgetVersion {
    botId: string;
    config: any;
    publishedBy?: string;
    cdnUrl?: string;
    notes?: string;
    updatedAt: string;
}

interface WidgetDeployment {
    id: string;
    botId: string;
    widgetVersionId: string;
    version: string;
    deploymentType: 'publish' | 'rollback' | 'canary';
    previousVersionId?: string;
    previousVersion?: string;
    rollbackReason?: string;
    trafficPercentage: number;
    status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';
    deployedAt: string;
    deployedBy?: string;
}

const fetcher = async (url: string, token: string) => {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch');
    }
    return res.json();
};

export function useWidgetVersions(botId: string) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;

    const { data, error, isLoading, mutate } = useSWR<WidgetVersion[]>(
        botId && token ? [`${API_BASE}/bots/${botId}/widget/versions`, token] : null,
        ([url, token]: [string, string]) => fetcher(url, token),
    );

    return {
        versions: data,
        isLoading,
        error,
        mutate,
    };
}

export function useWidgetVersion(botId: string, versionId: string) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;

    const { data, error, isLoading, mutate } = useSWR<WidgetVersionDetail>(
        botId && versionId && token
            ? [`${API_BASE}/bots/${botId}/widget/versions/${versionId}`, token]
            : null,
        ([url, token]: [string, string]) => fetcher(url, token),
    );

    return {
        version: data,
        isLoading,
        error,
        mutate,
    };
}

export function useWidgetDeployments(botId: string) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;

    const { data, error, isLoading, mutate } = useSWR<WidgetDeployment[]>(
        botId && token ? [`${API_BASE}/bots/${botId}/widget/deployments`, token] : null,
        ([url, token]: [string, string]) => fetcher(url, token),
    );

    return {
        deployments: data,
        isLoading,
        error,
        mutate,
    };
}

export function useWidgetVersionActions(botId: string) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;

    const createVersion = async (data: {
        version: string;
        config: any;
        changelog?: string;
        notes?: string;
    }) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/bots/${botId}/widget/versions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create version');
            }

            const result = await res.json();
            toast.success('Version created successfully');
            return result;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateVersion = async (
        versionId: string,
        data: {
            config?: any;
            changelog?: string;
            notes?: string;
        },
    ) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/bots/${botId}/widget/versions/${versionId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(data),
                },
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update version');
            }

            const result = await res.json();
            toast.success('Version updated successfully');
            return result;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const publishVersion = async (versionId: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/bots/${botId}/widget/versions/${versionId}/publish`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to publish version');
            }

            const result = await res.json();
            toast.success('Version published successfully');
            return result;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const rollbackVersion = async (versionId: string, reason: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/bots/${botId}/widget/versions/${versionId}/rollback`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason }),
                },
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to rollback');
            }

            const result = await res.json();
            toast.success('Rollback successful');
            return result;
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const archiveVersion = async (versionId: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/bots/${botId}/widget/versions/${versionId}/archive`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to archive version');
            }

            toast.success('Version archived successfully');
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteVersion = async (versionId: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${API_BASE}/bots/${botId}/widget/versions/${versionId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to delete version');
            }

            toast.success('Version deleted successfully');
        } catch (error: any) {
            toast.error(error.message);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        createVersion,
        updateVersion,
        publishVersion,
        rollbackVersion,
        archiveVersion,
        deleteVersion,
        isSubmitting,
    };
}
