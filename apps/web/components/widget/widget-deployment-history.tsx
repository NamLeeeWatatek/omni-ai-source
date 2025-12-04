'use client';

import { Rocket, RotateCcw, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/date';

interface Deployment {
    id: string;
    version: string;
    deploymentType: 'publish' | 'rollback' | 'canary';
    previousVersion?: string;
    rollbackReason?: string;
    trafficPercentage: number;
    status: 'deploying' | 'deployed' | 'failed' | 'rolled_back';
    deployedAt: string;
}

interface Props {
    deployments?: Deployment[];
    isLoading: boolean;
}

export function WidgetDeploymentHistory({ deployments, isLoading }: Props) {
    const getDeploymentIcon = (type: string) => {
        switch (type) {
            case 'publish':
                return <Rocket className="w-5 h-5 text-blue-500" />;
            case 'rollback':
                return <RotateCcw className="w-5 h-5 text-orange-500" />;
            case 'canary':
                return <Activity className="w-5 h-5 text-purple-500" />;
            default:
                return <Rocket className="w-5 h-5" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'deployed':
                return (
                    <Badge className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Deployed
                    </Badge>
                );
            case 'deploying':
                return (
                    <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Deploying
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </Badge>
                );
            case 'rolled_back':
                return (
                    <Badge variant="outline">
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Rolled Back
                    </Badge>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-16 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!deployments || deployments.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No deployment history yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {}
            <div className="relative">
                {}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                {}
                <div className="space-y-6">
                    {deployments.map((deployment) => (
                        <div key={deployment.id} className="relative pl-14">
                            {}
                            <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center">
                                {getDeploymentIcon(deployment.deploymentType)}
                            </div>

                            {}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-semibold text-lg">
                                                    {deployment.deploymentType === 'publish' && 'Published'}
                                                    {deployment.deploymentType === 'rollback' && 'Rolled back to'}
                                                    {deployment.deploymentType === 'canary' && 'Canary deployment'}
                                                    {' '}
                                                    Version {deployment.version}
                                                </h3>
                                                {getStatusBadge(deployment.status)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {formatRelativeTime(deployment.deployedAt)}
                                            </p>
                                        </div>
                                        {deployment.trafficPercentage < 100 && (
                                            <Badge variant="outline">
                                                {deployment.trafficPercentage}% traffic
                                            </Badge>
                                        )}
                                    </div>

                                    {deployment.previousVersion && (
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Previous version: {deployment.previousVersion}
                                        </p>
                                    )}

                                    {deployment.rollbackReason && (
                                        <div className="mt-3 p-3 bg-muted rounded-lg">
                                            <p className="text-sm font-medium mb-1">Rollback Reason:</p>
                                            <p className="text-sm text-muted-foreground">
                                                {deployment.rollbackReason}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
