'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProductsGrid } from '@/components/features/products/ProductsGrid';
import { ProductsTable } from '@/components/features/products/ProductsTable';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { CreationJob } from '@/lib/types/creation-job';
import { Package, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { wsService } from '@/lib/services/websocket-service';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MyProductsPage() {
    const [jobs, setJobs] = useState<CreationJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Fetch jobs
    const fetchJobs = useCallback(async (pageNum = 1) => {
        try {
            setIsLoading(true);
            const response = await creationJobsApi.findAll({
                page: pageNum,
                limit: 12, // Lower limit for better visual on grid/table
                sort: 'createdAt:desc'
            });

            setJobs(response.data);
            setHasNextPage(response.hasNextPage);
            setTotal(response.total);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            toast.error('Failed to load your products');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs(1);
    }, [fetchJobs]);

    const { user, accessToken } = useAuth();
    const session = { user: { id: user?.id, ...user }, accessToken }; // Temporary shim for existing logic

    // Listen for real-time progress updates
    useEffect(() => {
        if (!session?.user?.id || !(session as any)?.accessToken) return;

        // Ensure connected
        wsService.connect('notifications', {
            token: (session as any).accessToken,
            userId: session.user.id
        });

        const unsubscribe = wsService.on('notifications', 'new_notification', (notification: any) => {
            if (notification.type === 'job_progress') {
                const updatedJobData = notification.data;

                setJobs(prevJobs => {
                    const jobIndex = prevJobs.findIndex(j => j.id === updatedJobData.jobId);
                    if (jobIndex === -1) return prevJobs;

                    const newJobs = [...prevJobs];
                    newJobs[jobIndex] = {
                        ...newJobs[jobIndex],
                        progress: updatedJobData.progress,
                        status: updatedJobData.status,
                        outputData: updatedJobData.outputData,
                        error: updatedJobData.error,
                        updatedAt: new Date().toISOString()
                    };
                    return newJobs;
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [session]);



    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchJobs(page);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        fetchJobs(newPage);
    };

    const handleDelete = (id: string) => {
        // Optimistic update
        setJobs(prev => prev.filter(job => job.id !== id));
        // Also call API to remove
        creationJobsApi.remove(id).catch(err => {
            toast.error("Failed to delete job");
            fetchJobs(page); // Revert on error
        });
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        My Products
                    </h1>
                    <p className="text-muted-foreground">
                        Manage and view your generated content and products.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="border rounded-lg p-1 flex items-center gap-1 bg-muted/20">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="w-4 h-4 mr-1.5" />
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setViewMode('table')}
                        >
                            <List className="w-4 h-4 mr-1.5" />
                            List
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing || isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <>
                    <ProductsGrid
                        jobs={jobs}
                        isLoading={isLoading}
                        onDelete={handleDelete}
                        onRefresh={handleRefresh}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                    <div className="mt-4">
                        <Pagination
                            pagination={{
                                page,
                                limit: 12,
                                total: total,
                                totalPages: Math.ceil(total / 12),
                                hasNextPage
                            }}
                            onPageChange={handlePageChange}
                            className="justify-end"
                        />
                    </div>
                </>
            ) : (
                <ProductsTable
                    jobs={jobs}
                    isLoading={isLoading}
                    onDelete={handleDelete}
                    onRefresh={handleRefresh}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    pagination={{
                        page,
                        limit: 12,
                        total: total,
                        totalPages: Math.ceil(total / 12),
                        hasNextPage
                    }}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}
