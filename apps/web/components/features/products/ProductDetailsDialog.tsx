import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetailsDialogProps {
    job: CreationJob | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({ job, open, onOpenChange }: ProductDetailsDialogProps) {
    if (!job) return null;

    const statusConfig = {
        [CreationJobStatus.COMPLETED]: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle, label: 'Completed' },
        [CreationJobStatus.PROCESSING]: { color: 'bg-blue-500/10 text-blue-500', icon: Clock, label: 'Processing' },
        [CreationJobStatus.PENDING]: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock, label: 'Pending' },
        [CreationJobStatus.FAILED]: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle, label: 'Failed' },
    };

    const status = statusConfig[job.status] || statusConfig[CreationJobStatus.PENDING];
    const StatusIcon = status.icon;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const renderOutput = () => {
        if (!job.outputData) return <div className="text-muted-foreground italic">No output available</div>;

        // Check if output is an image URL (simple heuristic)
        const isImage = typeof job.outputData === 'string' && (job.outputData.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || job.outputData.startsWith('http'));

        if (isImage) {
            return (
                <div className="space-y-2">
                    <img
                        src={job.outputData}
                        alt="Result"
                        className="w-full rounded-lg border border-border"
                    />
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => window.open(job.outputData, '_blank')}>
                            Open in New Tab
                        </Button>
                    </div>
                </div>
            );
        }

        const textContent = typeof job.outputData === 'string' ? job.outputData : JSON.stringify(job.outputData, null, 2);

        return (
            <div className="relative">
                <pre className="p-4 rounded-lg bg-muted overflow-auto text-xs max-h-[300px]">
                    {textContent}
                </pre>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => handleCopy(textContent)}
                >
                    <Copy className="w-3 h-3" />
                </Button>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>Product Details</DialogTitle>
                        <Badge variant="outline" className={`${status.color} border-0 flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        ID: {job.id} • {format(new Date(job.createdAt), 'PPpp')}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Inputs Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Input Parameters</h4>
                        <div className="relative">
                            <pre className="p-4 rounded-lg bg-muted overflow-auto text-xs max-h-[200px]">
                                {JSON.stringify(job.inputData, null, 2)}
                            </pre>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => handleCopy(JSON.stringify(job.inputData, null, 2))}
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Generated Output</h4>
                        {renderOutput()}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
