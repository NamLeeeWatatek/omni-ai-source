"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { wsService } from '@/lib/services/websocket-service';
import { useToast } from '@/lib/hooks/use-toast';
import { creationJobsApi } from '@/lib/api/creation-jobs';

interface CreationJobsContextType {
    activeJobs: CreationJob[];
    addJob: (job: CreationJob) => void;
    removeJob: (jobId: string) => void;
    isLoading: boolean;
}

const CreationJobsContext = createContext<CreationJobsContextType | undefined>(undefined);

export function CreationJobsProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [activeJobs, setActiveJobs] = useState<CreationJob[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Can act as general loading state

    // We use a ref to keep track of processed completed jobs to avoid duplicate toasts if re-renders happen
    const processedcompletions = useRef<Set<string>>(new Set());

    // Load initial active jobs? 
    // Ideally, we might want to fetch "pending/processing" jobs from API on mount
    // For now, we'll start empty or rely on WS to populate if the backend sends initial state (unlikely without request)
    // But to be truly persistent across refreshes, we should fetch from API.
    // Let's assume we can fetch active jobs.

    useEffect(() => {
        if (session?.user?.id) {
            fetchActiveJobs();
        }
    }, [session?.user?.id]);

    const fetchActiveJobs = async () => {
        try {
            // Fetch pending and processing jobs to resume tracking
            const response = await creationJobsApi.findAll({
                status: ['PENDING', 'PROCESSING'],
                limit: 20,
                sort: 'createdAt:desc'
            });

            if (response.data && response.data.length > 0) {
                setActiveJobs(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch active jobs", error);
        }
    };

    const addJob = useCallback((job: CreationJob) => {
        setActiveJobs(prev => {
            if (prev.find(j => j.id === job.id)) return prev;
            return [job, ...prev];
        });
    }, []);

    const removeJob = useCallback((jobId: string) => {
        setActiveJobs(prev => prev.filter(job => job.id !== jobId));
    }, []);

    useEffect(() => {
        if (!session?.user?.id || !(session as any)?.accessToken) return;

        wsService.connect('notifications', {
            token: (session as any).accessToken,
            userId: session.user.id
        });

        const unsubscribe = wsService.on('notifications', 'new_notification', (notification: any) => {
            if (notification.type === 'job_progress') {
                setActiveJobs(prev => {
                    // Check if job exists in our tracked list. If not, should we add it?
                    // Maybe only if it's processing.

                    const existingJobIndex = prev.findIndex(j => j.id === notification.data.jobId);

                    if (existingJobIndex === -1) {
                        // Optional: if we receive progress for a job we don't know about (e.g. from another tab/device), 
                        // we could fetch it and add it. For now, ignore or handling is complex without full job data.
                        // But if we want truly global sync, we might need to fetch the job details.
                        return prev;
                    }

                    const updatedJobs = [...prev];
                    const currentJob = updatedJobs[existingJobIndex];

                    const updatedJob = {
                        ...currentJob,
                        progress: notification.data.progress ?? currentJob.progress,
                        status: notification.data.status ?? currentJob.status,
                        // Update other fields if provided
                        outputData: notification.data.outputData ?? currentJob.outputData,
                        error: notification.data.error ?? currentJob.error,
                        updatedAt: new Date().toISOString()
                    };

                    updatedJobs[existingJobIndex] = updatedJob;

                    // Handle completion notifications
                    if ((updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') &&
                        currentJob.status !== updatedJob.status) {

                        if (!processedcompletions.current.has(updatedJob.id)) {
                            processedcompletions.current.add(updatedJob.id);

                            toast({
                                title: updatedJob.status === 'COMPLETED' ? 'Job Completed' : 'Job Failed',
                                description: updatedJob.status === 'COMPLETED'
                                    ? `Creation job specifically for ${updatedJob.creationToolId} finished successfully.`
                                    : `Creation job failed. check details for more info.`,
                                variant: updatedJob.status === 'COMPLETED' ? 'default' : 'destructive',
                            });

                            // Auto-remove after delay? Users wanted a management page, so let's KEEP them until dismissed manually
                            // OR move them to "history" tab in widget? 
                            // Current requirement: "coi nó đang tới đâu" (see where it is). 
                            // Let's keep them in the list.
                        }
                    }

                    return updatedJobs;
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [session?.user?.id, toast]);

    return (
        <CreationJobsContext.Provider value={{ activeJobs, addJob, removeJob, isLoading }}>
            {children}
        </CreationJobsContext.Provider>
    );
}

export function useCreationJobs() {
    const context = useContext(CreationJobsContext);
    if (context === undefined) {
        throw new Error('useCreationJobs must be used within a CreationJobsProvider');
    }
    return context;
}
