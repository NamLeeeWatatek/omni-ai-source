'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Activity,
    History,
    Play,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    RefreshCw,
    FileText,
    Globe,
    Zap,
    Cpu,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { auditApi, AuditLog } from '@/lib/api/audit';
import { useAuth } from '@/lib/hooks/useAuth';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
    const { workspace } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const fetchActivity = useCallback(async () => {
        if (!workspace?.id) return;
        setLoading(true);
        try {
            const { data } = await auditApi.getMyActivity(workspace.id, {
                page,
                limit: 20
            });
            setLogs(data.items);
        } catch (error) {
            console.error('Failed to fetch activity logs', error);
        } finally {
            setLoading(false);
        }
    }, [workspace?.id, page]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'JOB_STARTED': return <Play className="w-4 h-4 text-blue-500" />;
            case 'JOB_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'JOB_FAILED': return <XCircle className="w-4 h-4 text-destructive" />;
            case 'CRAWL_STARTED': return <Globe className="w-4 h-4 text-indigo-500" />;
            case 'CRAWL_COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'DOCUMENT_PROCESSING': return <Cpu className="w-4 h-4 text-amber-500" />;
            case 'CREATE': return <Zap className="w-4 h-4 text-yellow-500" />;
            default: return <Activity className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <PageShell
            title="Activity Feed"
            description="Track your jobs, crawls, and system interactions in real-time."
            actions={
                <Button variant="outline" size="sm" onClick={fetchActivity} className="gap-2">
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter activities..."
                            className="pl-9 bg-card/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" className="gap-2">
                        <Filter className="w-4 h-4" />
                        Filters
                    </Button>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="border-border/40 p-4">
                                <div className="flex gap-4 items-center">
                                    <Skeleton className="w-10 h-10 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </Card>
                        ))
                    ) : logs.length > 0 ? (
                        logs.map((log) => (
                            <Card key={log.id} className="border-border/40 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5">
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border shrink-0">
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-sm tracking-tight">{formatAction(log.action)}</span>
                                            <Badge variant="outline" className="text-[10px] h-4 bg-muted/30">
                                                {log.resourceType}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate font-medium">
                                            {log.resourceId !== 'n/a' ? `Resource ID: ${log.resourceId}` : log.details?.url || 'System Action'}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/10">
                            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="font-bold text-lg mb-1">No activities found</h3>
                            <p className="text-muted-foreground text-sm">Activities you perform will appear here.</p>
                        </div>
                    )}
                </div>

                {logs.length > 0 && (
                    <div className="flex justify-center pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={loading || logs.length < 20}
                        >
                            Load More Activities
                        </Button>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
