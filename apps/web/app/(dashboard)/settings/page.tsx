"use client";

import React, { useEffect, useState } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiEye, FiEyeOff, FiKey, FiCpu } from 'react-icons/fi';
import { toast } from 'sonner';

interface UserAiProvider {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  displayName: string;
  modelList?: string[];
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  quotaUsed: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface ModelConfig {
  provider: string;
  model_name: string;
  display_name: string;
  api_key_configured: boolean;
  is_available: boolean;
  capabilities: string[];
  max_tokens: number;
  is_recommended?: boolean;
  is_default?: boolean;
  description?: string;
}

interface ProviderModels {
  provider: string;
  models: ModelConfig[];
}

const PROVIDER_OPTIONS = [
  { value: 'google', label: 'Google (Gemini)', color: 'bg-blue-500' },
  { value: 'openai', label: 'OpenAI (GPT)', color: 'bg-green-500' },
  { value: 'anthropic', label: 'Anthropic (Claude)', color: 'bg-orange-500' },
  { value: 'azure', label: 'Azure OpenAI', color: 'bg-purple-500' },
  { value: 'custom', label: 'Custom Provider', color: 'bg-gray-500' },
];

export default function AIModelsPage() {
  const [providers, setProviders] = useState<UserAiProvider[]>([]);
  const [availableModels, setAvailableModels] = useState<ProviderModels[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<UserAiProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [formData, setFormData] = useState<{
    provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
    displayName: string;
    apiKey: string;
    modelList: string;
  }>({
    provider: 'google',
    displayName: '',
    apiKey: '',
    modelList: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersRes, modelsRes] = await Promise.all([
        axiosClient.get('/ai-providers/user'),
        axiosClient.get('/ai-providers/models'),
      ]);
      setProviders(providersRes.data);
      setAvailableModels(modelsRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (provider?: UserAiProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        provider: provider.provider,
        displayName: provider.displayName,
        apiKey: '',
        modelList: provider.modelList?.join(', ') || '',
      });
    } else {
      setEditingProvider(null);
      setFormData({
        provider: 'google',
        displayName: '',
        apiKey: '',
        modelList: '',
      });
    }
    setShowDialog(true);
    setShowApiKey(false);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingProvider(null);
    setFormData({
      provider: 'google',
      displayName: '',
      apiKey: '',
      modelList: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      toast.error('Please enter a display name');
      return;
    }

    if (!editingProvider && !formData.apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      const payload = {
        provider: formData.provider,
        displayName: formData.displayName,
        ...(formData.apiKey && { apiKey: formData.apiKey }),
        modelList: formData.modelList
          ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
          : undefined,
      };

      if (editingProvider) {
        await axiosClient.patch(`/ai-providers/user/${editingProvider.id}`, payload);
        toast.success('API key updated successfully');
      } else {
        await axiosClient.post('/ai-providers/user', payload);
        toast.success('API key added successfully');
      }

      handleCloseDialog();
      loadData();
    } catch {
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await axiosClient.post(`/ai-providers/user/${id}/verify`);
      toast.success('API key verified successfully');
      loadData();
    } catch {
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return;
    }

    try {
      await axiosClient.delete(`/ai-providers/user/${id}`);
      toast.success('API key deleted successfully');
      loadData();
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  const handleToggleActive = async (provider: UserAiProvider) => {
    try {
      await axiosClient.patch(`/ai-providers/user/${provider.id}`, {
        isActive: !provider.isActive,
      });
      toast.success(`Provider ${provider.isActive ? 'deactivated' : 'activated'}`);
      loadData();
    } catch {
      toast.error('Failed to update provider status');
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold">AI Models & Providers</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI providers and configure your API keys
          </p>
        </div>
      </header>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="models" className="gap-2">
            <FiCpu className="size-4" />
            Available Models
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <FiKey className="size-4" />
            My API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          {availableModels.map((providerGroup) => (
            <Card key={providerGroup.provider} className="overflow-hidden">
              <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {providerGroup.provider === 'google' && (
                    <span className="text-blue-500">Google Gemini</span>
                  )}
                  {providerGroup.provider === 'openai' && (
                    <span className="text-green-500">OpenAI</span>
                  )}
                  {providerGroup.provider === 'anthropic' && (
                    <span className="text-orange-500">Anthropic</span>
                  )}
                  {!['google', 'openai', 'anthropic'].includes(providerGroup.provider) && 
                    <span className="capitalize">{providerGroup.provider}</span>
                  }
                </h3>
                <Badge variant="secondary">
                  {providerGroup.models?.length || 0} Models
                </Badge>
              </div>

              <div className="divide-y divide-border/40">
                {(providerGroup.models || []).map((model) => (
                  <div key={model.model_name} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-medium">
                            {model.display_name}
                          </h4>
                          {model.is_recommended && (
                            <Badge variant="default" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                              Recommended
                            </Badge>
                          )}
                          {model.is_default && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {model.model_name}
                        </code>
                      </div>
                      <Badge 
                        variant={model.is_available ? 'default' : 'secondary'} 
                        className={model.is_available ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {model.is_available ? 'Active' : 'Not Configured'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                          <strong>Setup Required:</strong> Add your {providerGroup.provider} API key in the "My API Keys" tab
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleOpenDialog()}>
              <FiPlus className="mr-2" />
              Add API Key
            </Button>
          </div>

          {providers.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                  <FiKey className="size-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first API key to start using AI models
                  </p>
                  <Button onClick={() => handleOpenDialog()}>
                    <FiPlus className="mr-2" />
                    Add Your First API Key
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            providers.map((provider) => (
              <Card key={provider.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{provider.displayName}</h3>
                      <Badge 
                        variant={provider.isActive ? 'default' : 'secondary'}
                        className={provider.isActive ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {provider.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {provider.isVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <FiCheck className="mr-1 size-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <FiX className="mr-1 size-3" /> Not Verified
                        </Badge>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="mb-3">
                      {PROVIDER_OPTIONS.find(p => p.value === provider.provider)?.label || provider.provider}
                    </Badge>

                    {provider.modelList && provider.modelList.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">Configured Models:</p>
                        <div className="flex flex-wrap gap-2">
                          {provider.modelList.map((model) => (
                            <code key={model} className="text-xs bg-muted px-2 py-1 rounded">
                              {model}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Usage: {provider.quotaUsed.toLocaleString()} requests</span>
                      {provider.lastUsedAt && (
                        <span>Last Used: {new Date(provider.lastUsedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!provider.isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(provider.id)}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(provider)}
                    >
                      {provider.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(provider)}
                    >
                      <FiEdit2 />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Edit API Key' : 'Add API Key'}
            </DialogTitle>
            <DialogDescription>
              {editingProvider 
                ? 'Update your API key configuration'
                : 'Add a new API key to enable AI models'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
                disabled={!!editingProvider}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., My Gemini API"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">
                API Key {editingProvider && '(leave empty to keep current)'}
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  required={!editingProvider}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key will be encrypted and stored securely
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelList">
                Model Names (optional)
              </Label>
              <Input
                id="modelList"
                placeholder="e.g., gpt-4, claude-3-opus (leave empty for all models)"
                value={formData.modelList}
                onChange={(e) => setFormData({ ...formData, modelList: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of model names. Leave empty to use all models.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProvider ? 'Update' : 'Add'} API Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
