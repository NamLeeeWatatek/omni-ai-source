import { useState } from "react";
import { CreationJob, CreationJobStatus } from "@/lib/types/creation-job";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { MoreHorizontal, Trash2, ExternalLink, Copy } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationInfo } from "@/components/ui/Pagination";

interface ProductsTableProps {
    jobs: CreationJob[];
    isLoading: boolean;
    onDelete?: (id: string) => void;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
}

export function ProductsTable({ jobs, isLoading, onDelete, pagination, onPageChange }: ProductsTableProps) {
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);

    const columns: Column<CreationJob>[] = [
        {
            key: 'id',
            label: 'Job ID',
            render: (value, row) => (
                <span className="font-medium font-mono text-xs text-muted-foreground">
                    {row.id.substring(0, 8)}
                </span>
            )
        },
        {
            key: 'creationToolId',
            label: 'Tool',
            render: (value) => <span className="text-sm font-medium">{value}</span>
        },
        {
            key: 'status',
            label: 'Status',
            render: (value, row) => (
                <Badge
                    variant={
                        row.status === CreationJobStatus.COMPLETED
                            ? "default"
                            : row.status === CreationJobStatus.FAILED
                                ? "destructive"
                                : "outline"
                    }
                    className="capitalize"
                >
                    {row.status.toLowerCase()}
                </Badge>
            )
        },
        {
            key: 'progress',
            label: 'Progress',
            render: (value) => <Progress value={value} className="h-2 w-24" />
        },
        {
            key: 'createdAt',
            label: 'Created At',
            render: (value) => (
                <span className="text-muted-foreground text-sm">
                    {format(new Date(value), 'PP p')}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => {
                                    navigator.clipboard.writeText(row.id);
                                    toast.success("Job ID copied");
                                }}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Job ID
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {row.status === CreationJobStatus.COMPLETED && (
                                <DropdownMenuItem onClick={() => setSelectedJob(row)}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Details
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete?.(row.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    if (jobs.length === 0 && !isLoading) {
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
        <>
            <DataTable
                data={jobs}
                columns={columns}
                loading={isLoading}
                searchable={false}
                pagination={pagination}
                onPageChange={onPageChange}
                compact
            />

            <ProductDetailsDialog
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open) => !open && setSelectedJob(null)}
            />
        </>
    );
}
