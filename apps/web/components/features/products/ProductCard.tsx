import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { ExternalLink, Calendar, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { toast } from 'sonner';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Progress } from '@/components/ui/Progress';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog';

interface ProductCardProps {
    job: CreationJob;
    onDelete?: (id: string) => void;
}

export function ProductCard({ job, onDelete }: ProductCardProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const statusConfig = {
        [CreationJobStatus.COMPLETED]: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle, label: 'Completed' },
        [CreationJobStatus.PROCESSING]: { color: 'bg-blue-500/10 text-blue-500', icon: Clock, label: 'Processing' },
        [CreationJobStatus.PENDING]: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock, label: 'Pending' },
        [CreationJobStatus.FAILED]: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle, label: 'Failed' },
    };

    const status = statusConfig[job.status] || statusConfig[CreationJobStatus.PENDING];
    const StatusIcon = status.icon;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await creationJobsApi.remove(job.id);
            toast.success('Product deleted successfully');
            if (onDelete) onDelete(job.id);
        } catch (error) {
            toast.error('Failed to delete product');
            console.error(error);
        } finally {
            setIsDeleting(false);
            setDeleteAlertOpen(false);
        }
    };

    const renderOutputPreview = () => {
        if (job.status !== CreationJobStatus.COMPLETED || !job.outputData) return null;

        // Check if output is an image URL (simple heuristic)
        const isImage = typeof job.outputData === 'string' && (job.outputData.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || job.outputData.startsWith('http'));

        if (isImage) {
            return (
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted mt-2 group cursor-pointer" onClick={() => setDetailsOpen(true)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={job.outputData}
                        alt="Product result"
                        loading="lazy"
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                </div>
            );
        }

        // Default text preview
        return (
            <div
                className="mt-2 p-3 bg-muted/50 rounded-md text-xs font-mono text-muted-foreground line-clamp-3 cursor-pointer hover:bg-muted"
                onClick={() => setDetailsOpen(true)}
            >
                {typeof job.outputData === 'string' ? job.outputData : JSON.stringify(job.outputData, null, 2)}
            </div>
        );
    };

    return (
        <>
            <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-medium truncate" title={job.id}>
                            Product #{job.id.substring(0, 8)}
                        </CardTitle>
                        <Badge variant="outline" className={`${status.color} border-0 flex items-center gap-1 shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                        </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {tryFormatDate(job.createdAt)}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-2">
                    {job.creationTool?.name && (
                        <div className="text-sm text-foreground/80 mb-2">
                            <span className="font-medium">Tool:</span> {job.creationTool.name}
                        </div>
                    )}
                    {job.status === CreationJobStatus.PROCESSING && (
                        <div className="mb-3 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Generating...</span>
                            </div>
                            <Progress value={job.progress} className="h-1.5" />
                        </div>
                    )}
                    {renderOutputPreview()}
                </CardContent>
                <CardFooter className="pt-2 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteAlertOpen(true)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setDetailsOpen(true)}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Details
                    </Button>
                </CardFooter>
            </Card>

            <ProductDetailsDialog
                job={job}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this product and remove the data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function tryFormatDate(dateStr: string) {
    try {
        return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
    } catch {
        return 'Invalid Date';
    }
}
