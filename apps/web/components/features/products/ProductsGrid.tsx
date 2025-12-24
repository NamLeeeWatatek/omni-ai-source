import { CreationJob } from '@/lib/types/creation-job';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';

interface ProductsGridProps {
    jobs: CreationJob[];
    isLoading: boolean;
    onDelete?: (id: string) => void;
}

export function ProductsGrid({ jobs, isLoading, onDelete }: ProductsGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <EmptyState
                icon={<Package className="w-12 h-12" />}
                title="No products found"
                description="You haven't created any products yet. Start by using one of our creation tools."
                action={{
                    label: "Explore Tools",
                    onClick: () => window.location.href = '/creation-tools',
                    variant: "default"
                }}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jobs.map((job) => (
                <ProductCard key={job.id} job={job} onDelete={onDelete} />
            ))}
        </div>
    );
}
