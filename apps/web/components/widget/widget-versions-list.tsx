'use client';

import { useState } from 'react';
import {
    CheckCircle2,
    Clock,
    Archive,
    Edit,
    Trash2,
    Rocket,
    RotateCcw,
    Eye,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useWidgetVersionActions } from '@/lib/hooks/use-widget-versions';
import { toast } from 'sonner';

interface Version {
    id: string;
    version: string;
    status: 'draft' | 'published' | 'archived';
    isActive: boolean;
    publishedAt?: string;
    changelog?: string;
    createdAt: string;
}

interface Props {
    botId: string;
    versions?: Version[];
    isLoading: boolean;
    onRefresh: () => void;
}

export function WidgetVersionsList({ botId, versions, isLoading, onRefresh }: Props) {
    const [rollbackVersion, setRollbackVersion] = useState<Version | null>(null);
    const [rollbackReason, setRollbackReason] = useState('');
    const [deleteVersion, setDeleteVersion] = useState<Version | null>(null);

    const {
        publishVersion,
        rollbackVersion: doRollback,
        archiveVersion,
        deleteVersion: doDelete,
        isSubmitting,
    } = useWidgetVersionActions(botId);

    const handlePublish = async (versionId: string) => {
        try {
            await publishVersion(versionId);
            onRefresh();
        } catch {
        }
    };

    const handleRollback = async () => {
        if (!rollbackVersion || !rollbackReason.trim()) {
            toast.error('Please provide a rollback reason');
            return;
        }

        try {
            await doRollback(rollbackVersion.id, rollbackReason);
            setRollbackVersion(null);
            setRollbackReason('');
            onRefresh();
        } catch {
        }
    };

    const handleArchive = async (versionId: string) => {
        try {
            await archiveVersion(versionId);
            onRefresh();
        } catch {
        }
    };

    const handleDelete = async () => {
        if (!deleteVersion) return;

        try {
            await doDelete(deleteVersion.id);
            setDeleteVersion(null);
            onRefresh();
        } catch {
        }
    };

    const getStatusBadge = (version: Version) => {
        if (version.isActive) {
            return (
                <Badge className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                </Badge>
            );
        }
        if (version.status === 'draft') {
            return (
                <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Draft
                </Badge>
            );
        }
        if (version.status === 'archived') {
            return (
                <Badge variant="outline">
                    <Archive className="w-3 h-3 mr-1" />
                    Archived
                </Badge>
            );
        }
        return <Badge variant="default">Published</Badge>;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">
                        No widget versions yet. Create your first version to get started.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {versions.map((version) => (
                    <Card key={version.id} className={version.isActive ? 'border-green-500 border-2' : ''}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-xl">
                                            Version {version.version}
                                        </CardTitle>
                                        {getStatusBadge(version)}
                                    </div>
                                    {version.changelog && (
                                        <p className="text-sm text-muted-foreground">
                                            {version.changelog}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            window.location.href = `/bots/${botId}/widget/${version.id}`;
                                        }}
                                    >
                                        {version.status === 'draft' ? (
                                            <>
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </>
                                        )}
                                    </Button>

                                    {}
                                    {version.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handlePublish(version.id)}
                                            disabled={isSubmitting}
                                        >
                                            <Rocket className="w-4 h-4 mr-1" />
                                            Publish
                                        </Button>
                                    )}

                                    {}
                                    {version.status === 'published' && !version.isActive && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setRollbackVersion(version)}
                                            disabled={isSubmitting}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-1" />
                                            Rollback
                                        </Button>
                                    )}

                                    {}
                                    {version.status === 'published' && !version.isActive && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleArchive(version.id)}
                                            disabled={isSubmitting}
                                        >
                                            <Archive className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {}
                                    {version.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeleteVersion(version)}
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div>
                                    Created {formatRelativeTime(version.createdAt)}
                                </div>
                                {version.publishedAt && (
                                    <div>
                                        Published {formatRelativeTime(version.publishedAt)}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {}
            <AlertDialog
                open={!!rollbackVersion}
                onOpenChange={(open) => {
                    if (!open) {
                        setRollbackVersion(null);
                        setRollbackReason('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rollback to Version {rollbackVersion?.version}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will deactivate the current version and activate version{' '}
                            {rollbackVersion?.version}. Please provide a reason for this rollback.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder="e.g., Version 1.0.1 has mobile responsive bug"
                        value={rollbackReason}
                        onChange={(e) => setRollbackReason(e.target.value)}
                        rows={3}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRollback}
                            disabled={!rollbackReason.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Rolling back...' : 'Rollback'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {}
            <AlertDialog
                open={!!deleteVersion}
                onOpenChange={(open) => {
                    if (!open) setDeleteVersion(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Version {deleteVersion?.version}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the draft version.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
