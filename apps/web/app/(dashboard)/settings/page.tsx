"use client";

import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface ModelConfig {
    provider: string;
    model_name: string;
    display_name: string;
    api_key_configured: boolean;
    is_available: boolean;
    capabilities: string[];
    max_tokens: number;
}

interface ProviderModels {
    provider: string;
    models: ModelConfig[];
}

export default function AIModelsPage() {
    const [providers, setProviders] = useState<ProviderModels[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const data = await fetchAPI('/ai/models');
                setProviders(data);
            } catch (err) {
                console.error("Failed to load models:", err);
                setError("Failed to load model configurations.");
            } finally {
                setLoading(false);
            }
        };

        loadModels();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Spinner className="size-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold">AI Models</h1>
                <p className="text-muted-foreground mt-1">Configure AI model providers and settings</p>
            </header>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-8">
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {providers.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No AI models configured yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Configure API keys in your environment variables to enable AI models.
                        </p>
                    </Card>
                ) : (
                    providers.map((providerGroup) => (
                        <Card key={providerGroup.provider} className="overflow-hidden">
                            <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center">
                                <h3 className="text-lg font-medium capitalize flex items-center gap-2">
                                    {providerGroup.provider === 'google' && (
                                        <span className="text-blue-500 dark:text-blue-400">Google Gemini</span>
                                    )}
                                    {providerGroup.provider === 'openai' && (
                                        <span className="text-green-500 dark:text-green-400">OpenAI</span>
                                    )}
                                    {providerGroup.provider === 'anthropic' && (
                                        <span className="text-orange-500 dark:text-orange-400">Anthropic</span>
                                    )}
                                    {!['google', 'openai', 'anthropic'].includes(providerGroup.provider) && providerGroup.provider}
                                </h3>
                                <Badge variant="default">
                                    {providerGroup.models?.length || 0} Models
                                </Badge>
                            </div>

                            <div className="divide-y divide-border/40">
                                {(providerGroup.models || []).map((model) => (
                                <div key={model.model_name} className="p-6 hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-base font-medium group-hover:text-primary transition-colors">
                                                    {model.display_name}
                                                </h4>
                                                {(model.model_name === 'gemini-2.5-flash' || model.model_name === 'gemini-2.5-pro') && (
                                                    <Badge variant="default" className="text-[10px] font-bold bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                        RECOMMENDED
                                                    </Badge>
                                                )}
                                            </div>
                                            <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {model.model_name}
                                            </code>
                                        </div>
                                        <Badge variant={model.is_available ? 'success' : 'default'}>
                                            {model.is_available ? 'Active' : 'Not Configured'}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {(model.capabilities || []).map((cap) => (
                                            <Badge key={cap} variant="outline" className="text-xs">
                                                {cap}
                                            </Badge>
                                        ))}
                                        <Badge variant="outline" className="text-xs">
                                            {(model.max_tokens || 0).toLocaleString()} tokens
                                        </Badge>
                                    </div>
                                    
                                    {!model.is_available && (
                                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                <strong>Setup Required:</strong> Configure {providerGroup.provider.toUpperCase()}_API_KEY in environment variables
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                    ))
                )}
            </div>

            {/* Additional Settings Section */}
            <div className="mt-8 grid gap-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">System Information</h2>
                    <div className="grid gap-4">
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Platform</span>
                            <span className="text-sm font-medium">WataOmi - One AI. Every Channel. Zero Code.</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Version</span>
                            <Badge variant="default">v1.0.0</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">API Status</span>
                            <Badge variant="success">Connected</Badge>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Active Models</span>
                            <Badge variant="default">
                                {providers.reduce((acc, p) => acc + (p.models?.filter(m => m.is_available).length || 0), 0)} Available
                            </Badge>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                    <div className="grid gap-3">
                        <a 
                            href="/api/docs" 
                            target="_blank"
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <span className="text-sm font-medium group-hover:text-primary">API Documentation</span>
                            <span className="text-xs text-muted-foreground">→</span>
                        </a>
                        <a 
                            href="https://github.com/wataomi/wataomi" 
                            target="_blank"
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <span className="text-sm font-medium group-hover:text-primary">GitHub Repository</span>
                            <span className="text-xs text-muted-foreground">→</span>
                        </a>
                        <a 
                            href="/knowledge-base" 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <span className="text-sm font-medium group-hover:text-primary">Knowledge Base</span>
                            <span className="text-xs text-muted-foreground">→</span>
                        </a>
                    </div>
                </Card>
            </div>
        </div>
    );
}
