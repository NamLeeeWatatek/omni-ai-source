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

export default function SettingsPage() {
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
        <div className="h-full">
            <header className="page-header">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-400">Manage your AI model configurations and preferences.</p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8">
                    {error}
                </div>
            )}

            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                        AI Models Configuration
                    </h2>

                    <div className="grid gap-6">
                        {providers.map((providerGroup) => (
                            <Card key={providerGroup.provider} className="overflow-hidden">
                                <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center">
                                    <h3 className="text-lg font-medium capitalize flex items-center gap-2">
                                        {providerGroup.provider === 'gemini' && (
                                            <span className="text-blue-400">Google Gemini</span>
                                        )}
                                        {providerGroup.provider === 'openai' && (
                                            <span className="text-green-400">OpenAI</span>
                                        )}
                                        {providerGroup.provider === 'anthropic' && (
                                            <span className="text-orange-400">Anthropic</span>
                                        )}
                                        {!['gemini', 'openai', 'anthropic'].includes(providerGroup.provider) && providerGroup.provider}
                                    </h3>
                                    <Badge variant="default">
                                        {providerGroup.models.length} Models
                                    </Badge>
                                </div>

                                <div className="divide-y divide-border/40">
                                    {providerGroup.models.map((model) => (
                                        <div key={model.model_name} className="p-6 hover:bg-muted/30 transition-colors group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="text-base font-medium group-hover:text-primary transition-colors">
                                                            {model.display_name}
                                                        </h4>
                                                        {model.model_name === 'gemini-2.5-flash' && (
                                                            <Badge variant="info" className="text-[10px] font-bold">
                                                                NEW
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
                                                {model.capabilities.map((cap) => (
                                                    <Badge key={cap} variant="default">
                                                        {cap}
                                                    </Badge>
                                                ))}
                                                <Badge variant="default">
                                                    {model.max_tokens.toLocaleString()} tokens
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
