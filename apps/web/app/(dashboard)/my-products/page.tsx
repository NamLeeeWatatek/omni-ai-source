'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProductsGrid } from '@/components/features/products/ProductsGrid';
import { ProductsTable } from '@/components/features/products/ProductsTable';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { Package, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';

export default function MyProductsPage() {
    const [jobs, setJobs] = useState<CreationJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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

    // Polling effect for pending jobs
    useEffect(() => {
        const hasPending = jobs.some(j =>
            j.status === CreationJobStatus.PENDING ||
            j.status === CreationJobStatus.PROCESSING
        );

        if (!hasPending) return;

        const interval = setInterval(() => {
            fetchJobs(page);
        }, 5000);

        return () => clearInterval(interval);
    }, [jobs, fetchJobs, page]);

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
                    />
                    <div className="mt-4">
                        <Pagination
                            pagination={{
                                page,
                                limit: 12,
                                total: hasNextPage ? page * 12 + 1 : page * 12,
                                totalPages: hasNextPage ? page + 1 : page,
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
                    pagination={{
                        page,
                        limit: 12,
                        total: hasNextPage ? (page + 1) * 12 : page * 12, // Fake total to enable next
                        totalPages: hasNextPage ? page + 1 : page,
                        hasNextPage
                    }}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}
