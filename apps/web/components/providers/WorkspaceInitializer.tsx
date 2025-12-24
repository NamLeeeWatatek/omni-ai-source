'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
    setWorkspaces,
    setCurrentWorkspace,
    setLoading,
    setError,
} from '@/lib/store/slices/workspaceSlice';
import { setActiveWorkspaceId } from '@/lib/axios-client';
import axiosClient from '@/lib/axios-client';

export function WorkspaceInitializer() {
    const { data: session, status } = useSession();
    const dispatch = useAppDispatch();
    const { currentWorkspace, workspaces, isLoading: isWorkspaceLoading, error: workspaceError } = useAppSelector(state => state.workspace);

    useEffect(() => {
        // Prevent fetching if already loading, already has error, or not authenticated
        if (status !== 'authenticated' || !session?.user) return;
        if (isWorkspaceLoading || workspaceError || workspaces.length > 0) return;

        const fetchWorkspaces = async () => {
            dispatch(setLoading(true));
            try {
                const response: any = await axiosClient.get('/workspaces');
                const workspacesData = Array.isArray(response) ? response : (response?.data || []);

                if (workspacesData.length > 0) {
                    dispatch(setWorkspaces(workspacesData));

                    let targetWorkspace = workspacesData[0];
                    if (session.workspace?.id) {
                        const defaultWs = workspacesData.find((w: any) => w.id === session.workspace?.id);
                        if (defaultWs) targetWorkspace = defaultWs;
                    }

                    dispatch(setCurrentWorkspace(targetWorkspace));
                    setActiveWorkspaceId(targetWorkspace.id);
                }
            } catch (error: any) {
                console.error('Failed to fetch workspaces:', error);

                // If it's a 401, axiosClient will handle the sign out.
                // We set the error to prevent WorkspaceInitializer from looping immediately.
                dispatch(setError('Failed to load workspaces'));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchWorkspaces();
    }, [status, session, dispatch, workspaces.length, isWorkspaceLoading, workspaceError, currentWorkspace]);

    // Sync axios client when currentWorkspace changes
    useEffect(() => {
        if (currentWorkspace?.id) {
            setActiveWorkspaceId(currentWorkspace.id);
        }
    }, [currentWorkspace]);

    return null;
}
