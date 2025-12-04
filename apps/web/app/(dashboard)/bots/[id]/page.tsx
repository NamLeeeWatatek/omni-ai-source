'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { botsApi } from '@/lib/api/bots';
import axiosClient from '@/lib/axios-client';
import type { BotFunction } from '@/lib/types/bots';
import {
    BasicInfoSection,
    SystemPromptSection,
    AIConfigSection,
    AdvancedSettingsSection,
} from '@/components/bots/bot-config-sections';
import { BotFunctionsSection } from '@/components/bots/bot-functions-section';
import { BotChannelsSection } from '@/components/bots/bot-channels-section';
import { BotFunctionModal } from '@/components/features/bots/bot-function-modal';

export default function BotDetailPage() {
    const params = useParams();
    const botId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [bot, setBot] = useState<any>(null);
    const [botFunctions, setBotFunctions] = useState<BotFunction[]>([]);
    const [botChannels, setBotChannels] = useState<any[]>([]);
    const [showFunctionModal, setShowFunctionModal] = useState(false);
    const [editingFunction, setEditingFunction] = useState<BotFunction | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        systemPrompt: '',
        aiProviderId: undefined as string | undefined,
        aiModelName: '',
        aiParameters: {
            temperature: 0.7,
            max_tokens: 1000,
        },
        enableAutoLearn: false,
    });

    useEffect(() => {
        loadBot();
        loadBotFunctions();
        loadBotChannels();
    }, [botId]);

    const loadBot = async () => {
        try {
            setLoading(true);
            const data = await botsApi.getOne(botId);
            setBot(data);
            setFormData({
                name: data.name,
                description: data.description || '',
                systemPrompt: data.systemPrompt || '',
                aiProviderId: data.aiProviderId || undefined,
                aiModelName: data.aiModelName || '',
                aiParameters: (data.aiParameters as { temperature: number; max_tokens: number }) || { temperature: 0.7, max_tokens: 1000 },
                enableAutoLearn: data.enableAutoLearn || false,
            });
        } catch {
            toast.error('Failed to load bot');
        } finally {
            setLoading(false);
        }
    };

    const loadBotFunctions = async () => {
        try {
            const response = await axiosClient.get(`/bots/${botId}/functions`);
            const data = response.data || response;
            setBotFunctions(Array.isArray(data) ? data : []);
        } catch {
        }
    };

    const loadBotChannels = async () => {
        try {
            const data = await botsApi.getChannels(botId);
            setBotChannels(Array.isArray(data) ? data : []);
        } catch {
        }
    };

    const handleChange = (updates: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Bot name is required');
            return;
        }

        try {
            setSaving(true);
            await botsApi.update(botId, formData);
            toast.success('Bot updated successfully');
            setHasChanges(false);
            loadBot();
        } catch {
            toast.error('Failed to save bot');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (active: boolean) => {
        try {
            await botsApi.update(botId, { isActive: active });
            toast.success(active ? 'Bot is now public' : 'Bot is now private');
            loadBot();
        } catch {
            toast.error('Failed to update bot status');
        }
    };

    const openFunctionModal = (func?: BotFunction) => {
        setEditingFunction(func || null);
        setShowFunctionModal(true);
    };

    const closeFunctionModal = () => {
        setShowFunctionModal(false);
        setEditingFunction(null);
    };

    const deleteFunction = async (functionId: string) => {
        if (!confirm('Are you sure you want to delete this function?')) return;

        try {
            await axiosClient.delete(`/bots/functions/${functionId}`);
            toast.success('Function deleted');
            loadBotFunctions();
        } catch {
            toast.error('Failed to delete function');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spinner className="size-8 text-primary" />
            </div>
        );
    }

    if (!bot) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Bot not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{bot.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        Configure your bot's behavior, AI settings, and integrations
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving || !hasChanges} size="lg">
                    {saving ? (
                        <>
                            <Spinner className="size-4 mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {}
            {hasChanges && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">
                            You have unsaved changes. Don't forget to save!
                        </p>
                    </div>
                </div>
            )}

            {}
            <div className="space-y-6">
                {}
                <div className="grid gap-6 lg:grid-cols-2">
                    <BasicInfoSection data={formData} onChange={handleChange} />
                    <AdvancedSettingsSection
                        enableAutoLearn={formData.enableAutoLearn}
                        isActive={bot.isActive || false}
                        botId={botId}
                        onToggleAutoLearn={(enabled) => handleChange({ enableAutoLearn: enabled })}
                        onToggleActive={handleToggleActive}
                    />
                </div>

                {}
                <SystemPromptSection
                    systemPrompt={formData.systemPrompt}
                    onChange={(systemPrompt) => handleChange({ systemPrompt })}
                />

                {}
                <AIConfigSection data={formData} onChange={handleChange} />

                {}
                <BotFunctionsSection
                    botFunctions={botFunctions}
                    onAdd={() => openFunctionModal()}
                    onEdit={(func) => openFunctionModal(func)}
                    onDelete={deleteFunction}
                />

                {}
                <BotChannelsSection
                    botId={botId}
                    botChannels={botChannels}
                    onRefresh={loadBotChannels}
                />
            </div>

            {}
            <BotFunctionModal
                open={showFunctionModal}
                onClose={closeFunctionModal}
                botId={botId}
                botFunction={editingFunction as any}
                onSuccess={() => {
                    closeFunctionModal();
                    loadBotFunctions();
                }}
            />
        </div>
    );
}
