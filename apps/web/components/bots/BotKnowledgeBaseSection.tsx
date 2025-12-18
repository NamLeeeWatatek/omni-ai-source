'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Database, Plus, Link, Unlink, Search, BookOpen, Star, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/lib/axios-client';
import type { KnowledgeBase } from '@/lib/types/knowledge-base';
import { Badge } from '../ui/Badge';

interface Props {
    botId: string;
    workspaceId?: string;
    onRefresh?: () => void;
}

interface BotKnowledgeBase {
    id: string;
    botId: string;
    knowledgeBaseId: string;
    isActive: boolean;
    knowledgeBase?: KnowledgeBase;
    createdAt: string;
    updatedAt: string;
}

export function BotKnowledgeBaseSection({ botId, workspaceId, onRefresh }: Props) {
    const [linkedKnowledgeBases, setLinkedKnowledgeBases] = useState<BotKnowledgeBase[]>([]);
    const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);
    const [selectedKbId, setSelectedKbId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        loadData();
    }, [botId, refreshKey]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load linked KBs
            const linkedResponse = await axiosClient.get(`/bots/${botId}/knowledge-bases`);
            setLinkedKnowledgeBases(Array.isArray(linkedResponse) ? linkedResponse : []);

            // Load all available KBs for linking - filtered by workspace if available
            const kbUrl = workspaceId ? `/knowledge-bases?workspaceId=${workspaceId}` : '/knowledge-bases';
            const availableResponse = await axiosClient.get(kbUrl);
            setAvailableKnowledgeBases(Array.isArray(availableResponse) ? availableResponse : []);

        } catch (error) {
            console.error('Failed to load knowledge bases:', error);
            toast.error('Failed to load knowledge bases');
        } finally {
            setLoading(false);
        }
    };

    const getAvailableKnowledgeBases = () => {
        const linkedIds = new Set(linkedKnowledgeBases.map(l => l.knowledgeBaseId));
        return availableKnowledgeBases
            .filter(kb => !linkedIds.has(kb.id))
            .filter(kb =>
                !searchTerm ||
                kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                kb.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    };

    const handleLinkKnowledgeBase = async () => {
        if (!selectedKbId) {
            toast.error('Please select a knowledge base to link');
            return;
        }

        try {
            setLinking(true);

            const kbToLink = availableKnowledgeBases.find(kb => kb.id === selectedKbId);
            if (!kbToLink) {
                toast.error('Selected knowledge base not found');
                return;
            }

            await axiosClient.post(`/bots/${botId}/knowledge-bases`, {
                knowledgeBaseId: selectedKbId,
            });

            toast.success(`Knowledge base "${kbToLink.name}" linked successfully!`);

            // Reset form
            setSelectedKbId('');
            setSearchTerm('');

            // Reload data and force refresh
            setRefreshKey(prev => prev + 1);
            if (onRefresh) onRefresh();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to link knowledge base');
        } finally {
            setLinking(false);
        }
    };

    const handleToggleActive = async (kbLink: BotKnowledgeBase, isActive: boolean) => {
        try {
            await axiosClient.patch(`/bots/${botId}/knowledge-bases/${kbLink.knowledgeBaseId}/toggle`, {
                isActive: !isActive,
            });

            const statusMessage = isActive ? 'deactivated' : 'activated';
            toast.success(`Knowledge base ${statusMessage}`);

            setRefreshKey(prev => prev + 1);
            if (onRefresh) onRefresh();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update knowledge base status');
        }
    };

    const handleUnlinkKnowledgeBase = async (kbLink: BotKnowledgeBase) => {
        if (!confirm(`Are you sure you want to unlink "${kbLink.knowledgeBase?.name || 'this knowledge base'}" from this bot?`)) {
            return;
        }

        try {
            await axiosClient.delete(`/bots/${botId}/knowledge-bases/${kbLink.knowledgeBaseId}`);

            toast.success(`Knowledge base "${kbLink.knowledgeBase?.name}" unlinked successfully`);

            setRefreshKey(prev => prev + 1);
            if (onRefresh) onRefresh();

        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to unlink knowledge base');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        <CardTitle>Knowledge Base</CardTitle>
                    </div>
                    <CardDescription>
                        Configure knowledge bases for RAG responses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading knowledge bases...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const availableForLinking = getAvailableKnowledgeBases();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary" />
                            <CardTitle>Knowledge Base</CardTitle>
                        </div>
                        <CardDescription>
                            Link knowledge bases to provide RAG-enhanced responses
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary">
                            {linkedKnowledgeBases.filter(l => l.isActive).length} Active
                        </Badge>
                        <Badge variant="outline">
                            {linkedKnowledgeBases.length} Total
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Linked Knowledge Bases */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Linked Knowledge Bases
                    </h3>

                    {linkedKnowledgeBases.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                            <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h4 className="text-lg font-medium mb-2">No Knowledge Bases Linked</h4>
                            <p className="text-muted-foreground text-sm mb-4">
                                Link knowledge bases to enable RAG capabilities and provide context-aware responses
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {linkedKnowledgeBases.map((kbLink) => (
                                <div key={kbLink.id} className="p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">
                                                    {kbLink.knowledgeBase?.name || `KB ${kbLink.knowledgeBaseId}`}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {kbLink.knowledgeBase?.description || 'No description available'}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>
                                                        {kbLink.knowledgeBase?.totalDocuments || 0} documents
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {kbLink.knowledgeBase?.embeddingModel?.replace('text-embedding-', '') || 'Unknown model'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={kbLink.isActive ? 'default' : 'secondary'}
                                            className={kbLink.isActive ? 'bg-green-500' : ''}
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            {kbLink.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleToggleActive(kbLink, kbLink.isActive)}
                                        >
                                            {kbLink.isActive ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUnlinkKnowledgeBase(kbLink)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <Unlink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Link New Knowledge Base */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Link Knowledge Base
                    </h3>

                    {availableKnowledgeBases.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed rounded-lg">
                            <Database className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No knowledge bases available to link. Create one first.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {availableForLinking.length > 0 && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="kb-search">Search Knowledge Bases</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input
                                                id="kb-search"
                                                placeholder="Search by name or description..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="select-kb">Select Knowledge Base</Label>
                                        <Select value={selectedKbId} onValueChange={setSelectedKbId}>
                                            <SelectTrigger id="select-kb">
                                                <SelectValue placeholder="Choose a knowledge base to link..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableForLinking.map((kb) => (
                                                    <SelectItem key={kb.id} value={kb.id}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{kb.name}</span>
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                {kb.totalDocuments} docs
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={handleLinkKnowledgeBase}
                                        disabled={!selectedKbId || linking}
                                        className="w-full"
                                    >
                                        {linking ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Linking...
                                            </>
                                        ) : (
                                            <>
                                                <Link className="w-4 h-4 mr-2" />
                                                Link Knowledge Base
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}

                            {availableForLinking.length === 0 && availableKnowledgeBases.length > 0 && (
                                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                    <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        All available knowledge bases are already linked to this bot.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
