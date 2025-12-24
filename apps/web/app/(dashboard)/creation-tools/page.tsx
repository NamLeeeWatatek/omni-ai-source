'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Sparkles } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export default function CreationToolsPage() {
    const router = useRouter();
    const [tools, setTools] = useState<CreationTool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTools();
    }, []);

    const loadTools = async () => {
        try {
            const data = await creationToolsApi.getActive();
            setTools(data);
        } catch (error) {
            console.error('Failed to load creation tools:', error);
        } finally {
            setLoading(false);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9); // 3x3 grid

    const paginatedTools = tools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Creation Tools</h1>
                        <p className="text-muted-foreground mt-1">
                            Choose a tool to start creating amazing content with AI
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(paginatedTools) && paginatedTools.map((tool) => (
                    // ... Card Render
                    <Card
                        key={tool.id}
                        className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                        onClick={() => router.push(`/creation-tools/${tool.slug}`)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                {tool.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                                {tool.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full group-hover:scale-105 transition-transform" size="lg">
                                Start Creating
                                <Sparkles className="w-4 h-4 ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {tools.length > 0 && (
                <div className="py-4">
                    <Pagination
                        pagination={{
                            page: currentPage,
                            limit: pageSize,
                            total: tools.length,
                            totalPages: Math.ceil(tools.length / pageSize),
                            hasNextPage: currentPage < Math.ceil(tools.length / pageSize)
                        }}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[9, 18, 27, 36]}
                    />
                </div>
            )}

            {(!tools || tools.length === 0) && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No creation tools available yet.</p>
                </div>
            )}
        </div>
    );
}
