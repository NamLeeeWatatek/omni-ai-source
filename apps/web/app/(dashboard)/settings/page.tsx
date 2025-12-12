"use client";

import React, { useEffect, useState } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/Dialog';

import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiEye, FiEyeOff, FiKey, FiZap, FiActivity, FiAlertCircle } from 'react-icons/fi';
// Import React Icons for AI providers
import { AiOutlineOpenAI } from 'react-icons/ai';
import { SiClaude, SiOllama } from 'react-icons/si';
import { RiGeminiLine } from 'react-icons/ri';
import { VscAzure } from 'react-icons/vsc';
import { MdDashboardCustomize } from 'react-icons/md';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { Badge } from '@/components/ui/Badge';

// Icon mapping utility
const getProviderIcon = (iconName?: string) => {
  const icons = {
    AiOutlineOpenAI,
    SiClaude,
    RiGeminiLine,
    VscAzure,
    SiOllama,
    MdDashboardCustomize,
  };

  const IconComponent = icons[iconName as keyof typeof icons];
  return IconComponent || MdDashboardCustomize; // Fallback icon
};

interface AiProvider {
  id: string;
  key: string;
  label: string;
  icon?: string;
  description?: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultValues: Record<string, any>;
  isActive: boolean;
}

interface UserAiProviderConfig {
  id: string;
  userId: string;
  providerId: string;
  provider?: AiProvider;
  displayName: string;
  config: Record<string, any>;
  modelList?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProviderDisplayData {
  id: string;
  userId?: string;
  workspaceId?: string;
  providerId: string;
  provider?: AiProvider;
  displayName: string;
  config: Record<string, any>;
  modelList?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  quotaUsed: number;
  lastUsedAt: string;
  isVerified: boolean;
  apiKeyMasked: string | null;
}

interface WorkspaceAiProviderConfig {
  id: string;
  workspaceId: string;
  providerId: string;
  provider?: AiProvider;
  displayName: string;
  config: Record<string, any>;
  modelList?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AIModelsPage() {
  const [userConfigs, setUserConfigs] = useState<UserAiProviderConfig[]>([]);
  const [workspaceConfigs, setWorkspaceConfigs] = useState<WorkspaceAiProviderConfig[]>([]);
  const [availableProviders, setAvailableProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<UserAiProviderConfig | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState<'user' | 'workspace'>('user');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

    const [formData, setFormData] = useState<{
    providerId: string;
    providerKey: string;
    displayName: string;
    config: Record<string, any>;
    apiKey: string;
    modelList: string;
  }>({
    providerId: '',
    providerKey: '',
    displayName: '',
    config: {},
    apiKey: '',
    modelList: '',
  });

  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load real models when provider is selected and we have API key for existing configs
    if (showDialog && (editingConfig || formData.apiKey) && formData.providerId) {
      loadProviderModels();
    }
  }, [showDialog, editingConfig, formData.providerId, formData.apiKey]);

  const loadProviderModels = async () => {
    try {
      setLoadingModels(true);

      let models: string[] = [];

      // For existing configs, fetch real models from API
      if (editingConfig?.id) {
        try {
          const response = await axiosClient.get(`/ai-providers/user/models`);
          const configData = response.find((item: any) =>
            item.providerId === formData.providerId || item.configId === editingConfig.id
          );
          if (configData?.models) {
            models = configData.models;
          }
        } catch (error) {
          // Fallback to static suggestions if API fails
          models = getStaticModelSuggestions(formData.providerKey);
        }
      } else if (formData.apiKey && formData.providerKey) {
        // For new configs with API key, try to verify and get models
        // We'll use the verify endpoint as a way to test the API key and get available models
        try {
          // First create a temporary config to test
          const testPayload = {
            providerId: formData.providerId,
            displayName: 'temp-verification',
            config: { apiKey: formData.apiKey },
            modelList: [],
          };

          const tempConfig = await axiosClient.post('/ai-providers/user/configs', testPayload);

          // Now fetch models for this temp config (even if we delete it after)
          try {
            const response = await axiosClient.get(`/ai-providers/user/models`);
            const configData = response.find((item: any) => item.configId === tempConfig.id);
            if (configData?.models) {
              models = configData.models;
            }
          } catch {}

          // Delete temp config
          await axiosClient.delete(`/ai-providers/user/configs/${tempConfig.id}`);

        } catch (error) {
          // Fallback to static suggestions
          models = getStaticModelSuggestions(formData.providerKey);
        }
      } else {
        // No API key yet, use static suggestions
        models = getStaticModelSuggestions(formData.providerKey);
      }

      setAvailableModels(models);
    } catch (error) {
      // On error, fallback to static suggestions
      setAvailableModels(getStaticModelSuggestions(formData.providerKey));
    } finally {
      setLoadingModels(false);
    }
  };

  const getStaticModelSuggestions = (providerKey: string): string[] => {
    switch (providerKey) {
      case 'openai':
        return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
      case 'anthropic':
        return ['claude-3.5-sonnet', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'];
      case 'google':
        return ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
      case 'ollama':
        return ['llama3.1:8b', 'llama3.1:70b', 'codellama:13b', 'gemma2:9b'];
      default:
        return [];
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available providers
      const providersRes = await axiosClient.get('/ai-providers');
      setAvailableProviders(providersRes);

      // Load user configs and populate provider relationships
      const userConfigsRes = await axiosClient.get('/ai-providers/user/configs');
      // Enhance user configs with provider data from availableProviders
      const enhancedUserConfigs = userConfigsRes.map((config: any) => ({
        ...config,
        provider: providersRes.find((provider: any) => provider.id === config.providerId),
      }));
      setUserConfigs(enhancedUserConfigs);
      try {
        setWorkspaceConfigs([]);
      } catch {
        setWorkspaceConfigs([]);
      }

    } catch (error) {
      toast.error('Failed to load AI provider data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config?: UserAiProviderConfig | ProviderDisplayData) => {
    if (config) {
      setEditingConfig(config as UserAiProviderConfig);
      // Find the provider key for display purposes
      const provider = availableProviders.find(p => p.id === config.providerId);
      const providerKey = provider?.key || '';
      setFormData({
        providerId: config.providerId,
        providerKey,
        displayName: config.displayName,
        config: { ...config.config }, // Copy existing config
        apiKey: '',
        modelList: config.modelList?.join(', ') || '',
      });
      setIsChangingApiKey(false);
    } else {
      setEditingConfig(null);
      setFormData({
        providerId: '',
        providerKey: '',
        displayName: '',
        config: {},
        apiKey: '',
        modelList: '',
      });
      setIsChangingApiKey(false);
    }
    setShowDialog(true);
    setShowApiKey(false);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingConfig(null);
    setIsChangingApiKey(false);
    setFormData({
      providerId: '',
      providerKey: '',
      displayName: '',
      config: {},
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

    if (!formData.providerId) {
      toast.error('Please select a provider');
      return;
    }

    // Prepare config with API key
    const config = { ...formData.config };
    if (formData.apiKey) {
      config.apiKey = formData.apiKey;
    }

    // For create, API key is required
    const requiredFields = availableProviders.find(p => p.id === formData.providerId)?.requiredFields || [];
    if (!editingConfig) {
      for (const field of requiredFields) {
        if (!config[field] || !config[field].trim()) {
          toast.error(`${field} is required`);
          return;
        }
      }
    }

    try {
      const payload = {
        providerId: formData.providerId,
        displayName: formData.displayName,
        config: config,
        modelList: formData.modelList
          ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
          : undefined,
      };

      if (editingConfig) {
        await axiosClient.patch(`/ai-providers/user/configs/${editingConfig.id}`, payload);
        toast.success('AI provider updated successfully');
      } else {
        await axiosClient.post('/ai-providers/user/configs', payload);
        toast.success('AI provider added successfully');
      }

      handleCloseDialog();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save AI provider');
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await axiosClient.post(`/ai-providers/user/configs/${id}/verify`);
      toast.success('API key verified successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify API key');
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      await axiosClient.delete(`/ai-providers/user/configs/${configToDelete}`);
      toast.success('API key deleted successfully');
      loadData();
    } catch {
      toast.error('Failed to delete API key');
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setConfigToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (provider: { id: string; isActive: boolean }) => {
    const originalUserConfig = userConfigs.find(c => c.id === provider.id);
    if (!originalUserConfig) {
      toast.error('Only user providers can be toggled here');
      return;
    }
    try {
      await axiosClient.patch(`/ai-providers/user/configs/${provider.id}`, {
        isActive: !provider.isActive,
      });
      toast.success(`Provider ${!provider.isActive ? 'activated' : 'deactivated'}`);
      loadData();
    } catch {
      toast.error('Failed to update provider status');
    }
  };

  // Calculate combined providers for display - return as is from API
  const allProviders = [...userConfigs, ...workspaceConfigs].map(config => ({
    ...config,
    quotaUsed: config.config?.usage || 0, // This should come from backend or config
    lastUsedAt: config.updatedAt,
    isVerified: config.config?.isVerified || false, // Use isVerified from config if available
    apiKeyMasked: config.config?.apiKey
      ? '••••••••••••'
      : (config.config?.baseUrl ? '••••••••••••' : null),
    // Keep original provider field from API (can be AiProvider or undefined)
  }));

  const [activeTab, setActiveTab] = useState('ai-providers');
  const totalUsage = allProviders.reduce((sum, p) => sum + p.quotaUsed, 0);
  const activeProviders = allProviders.filter(p => p.isActive).length;

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'ai-providers', label: 'AI Providers' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'sharing', label: 'Sharing' },
    { id: 'billing', label: 'Billing' },
    { id: 'questions', label: 'Questions' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        { }
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        { }
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        { }
        {activeTab === 'ai-providers' && (
          <div className="space-y-8">
            { }
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Providers</CardDescription>
                  <CardTitle className="text-3xl">{allProviders.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiKey className="size-4" />
                    <span>{activeProviders} active</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Usage</CardDescription>
                  <CardTitle className="text-3xl">{totalUsage.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiActivity className="size-4" />
                    <span>API requests</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Quick Action</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleOpenDialog()} className="w-full">
                    <FiPlus className="mr-2" />
                    Add New Provider
                  </Button>
                </CardContent>
              </Card>
            </div>

            { }
            {allProviders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="size-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                    <FiKey className="size-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No API Keys Configured</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Add your first AI provider API key to start using AI models in your bots and workflows
                  </p>
                  <Button onClick={() => handleOpenDialog()} size="lg">
                    <FiPlus className="mr-2" />
                    Add Your First API Key
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {allProviders.map((provider) => {
                  // Sử dụng provider từ relationship hoặc fallback to availableProviders array
                  const providerData = provider.provider || availableProviders.find(p => p.id === provider.providerId);
                  return (
                    <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className={`h-2 bg-gradient-to-r from-gray-500 to-slate-500`} />
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">
                              {(() => {
                                const IconComponent = getProviderIcon(providerData?.icon);
                                return <IconComponent className="text-primary" />;
                              })()}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                              <CardDescription>{providerData?.label || 'Unknown Provider'}</CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant={provider.isActive ? 'default' : 'secondary'}
                              className={provider.isActive ? 'bg-green-500' : ''}
                            >
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {provider.isVerified && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <FiCheck className="size-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        { }
                        {provider.modelList && provider.modelList.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <FiZap className="size-4" />
                              Configured Models
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {provider.modelList.map((model) => (
                                <Badge key={model} variant="secondary" className="font-mono text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        { }
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Usage</p>
                            <p className="text-lg font-semibold">{provider.quotaUsed.toLocaleString()}</p>
                          </div>
                          {provider.lastUsedAt && (
                            <div className="space-y-1 text-right">
                              <p className="text-sm text-muted-foreground">Last Used</p>
                              <p className="text-sm font-medium">{new Date(provider.lastUsedAt).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        { }
                        <div className="flex gap-2 pt-2">
                          {!provider.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerify(provider.id)}
                              className="flex-1"
                            >
                              <FiCheck className="mr-2 size-4" />
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(provider)}
                            className="flex-1"
                          >
                            {provider.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(provider)}
                          >
                            <FiEdit2 className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(provider.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <FiTrash2 className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        { }
        {activeTab === 'account' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Set your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timezone & Preferences</CardTitle>
                <CardDescription>Let us know the time zone and format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="UTC/GMT -4 hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc-4">UTC/GMT -4 hours</SelectItem>
                        <SelectItem value="utc-5">UTC/GMT -5 hours</SelectItem>
                        <SelectItem value="utc+7">UTC/GMT +7 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date & Time Format</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="dd/mm/yyyy HH:MM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dmy">dd/mm/yyyy HH:MM</SelectItem>
                        <SelectItem value="mdy">mm/dd/yyyy HH:MM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        { }
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        )}

        { }
        {activeTab === 'sharing' && (
          <Card>
            <CardHeader>
              <CardTitle>Sharing Settings</CardTitle>
              <CardDescription>Manage sharing and collaboration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Sharing settings coming soon...</p>
            </CardContent>
          </Card>
        )}

        { }
        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Billing settings coming soon...</p>
            </CardContent>
          </Card>
        )}

        { }
        {activeTab === 'questions' && (
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Frequently asked questions and support</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">FAQ coming soon...</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingConfig ? 'Edit API Key' : 'Add New API Key'}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? 'Update your API key configuration and settings'
                : 'Connect a new AI provider to unlock powerful models'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            { }
            {!editingConfig && (
              <div className="space-y-3">
                <Label>Select Provider</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableProviders.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        providerId: provider.id,
                        providerKey: provider.key
                      })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${formData.providerId === provider.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {(() => {
                            const IconComponent = getProviderIcon(provider.icon);
                            return <IconComponent className="text-primary" />;
                          })()}
                        </span>
                        <span className="font-semibold text-sm">{provider.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingConfig && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {(() => {
                      const provider = availableProviders.find(p => p.id === formData.providerId);
                      const IconComponent = getProviderIcon(provider?.icon);
                      return <IconComponent className="text-primary" />;
                    })()}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {availableProviders.find(p => p.id === formData.providerId)?.label || formData.providerKey}
                    </p>
                    <p className="text-xs text-muted-foreground">Provider cannot be changed</p>
                  </div>
                </div>
              </div>
            )}

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
                {formData.providerKey === 'ollama' || formData.providerKey === 'custom' ? 'Base URL' : 'API Key'}
              </Label>

              {editingConfig && !isChangingApiKey ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 font-mono text-sm text-muted-foreground">
                    {editingConfig && 'apiKeyMasked' in editingConfig ? (editingConfig as ProviderDisplayData).apiKeyMasked : '••••••••••••'}
                  </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsChangingApiKey(true);
                        setFormData({ ...formData, apiKey: '' });
                      }}
                    >
                      {formData.providerKey === 'ollama' || formData.providerKey === 'custom' ? <FiEdit2 className="mr-2 size-3" /> : <FiEdit2 className="mr-2 size-3" />}
                      {formData.providerKey === 'ollama' || formData.providerKey === 'custom' ? 'Change URL' : 'Change Key'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.providerKey === 'ollama' || formData.providerKey === 'custom'
                      ? 'Your endpoint URL is encrypted and stored securely'
                      : 'Your API key is encrypted and stored securely'
                    }
                  </p>
                </div>
              ) : (
                // âœ… Edit mode: Show input field
                <div className="space-y-2">
                  {editingConfig && isChangingApiKey && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <FiAlertCircle className="size-4 text-amber-600 dark:text-amber-500" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Entering a new value will replace the current one
                      </p>
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={(formData.providerKey === 'ollama' || formData.providerKey === 'custom' || showApiKey) ? 'text' : 'password'}
                      placeholder={
                        formData.providerKey === 'ollama'
                          ? "e.g., http://localhost:11434"
                          : formData.providerKey === 'custom'
                          ? "e.g., https://my-endpoint.com"
                          : editingConfig
                          ? "Enter new API key"
                          : "Enter your API key"
                      }
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      required={!editingConfig}
                      className={cn(
                        editingConfig && isChangingApiKey ? "border-amber-300 dark:border-amber-800" : "",
                        "pr-10" // Add right padding for eye icon
                      )}
                      style={{
                        fontFamily: showApiKey ? 'monospace' : 'inherit',
                        fontSize: showApiKey ? '0.75rem' : 'inherit',
                        letterSpacing: showApiKey ? '0.025em' : 'inherit'
                      }}
                    />
                    {(formData.providerKey === 'ollama' || formData.providerKey === 'custom') ? null : (
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    )}
                  </div>
                  {editingConfig && isChangingApiKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsChangingApiKey(false);
                        setFormData({ ...formData, apiKey: '' });
                      }}
                      className="text-xs"
                    >
                      Cancel - Keep current value
                    </Button>
                  )}
                  {!editingConfig && (
                    <p className="text-xs text-muted-foreground">
                      {formData.providerKey === 'ollama' || formData.providerKey === 'custom'
                        ? 'Your endpoint URL will be encrypted and stored securely'
                        : 'Your API key will be encrypted and stored securely'
                      }
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="modelList">
                Model Names *
              </Label>

              {/* Current Models Display */}
              {(() => {
                const models = formData.modelList
                  ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
                  : [];
                return models.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md border">
                    {models.map((model, index) => (
                      <div key={index} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
                        <span className="font-mono">{model}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newModels = models.filter((_, i) => i !== index);
                            setFormData({ ...formData, modelList: newModels.join(', ') });
                          }}
                          className="text-primary/60 hover:text-primary ml-1 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Add New Model Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={
                    formData.providerKey === 'openai'
                      ? "e.g., gpt-4o, gpt-4-turbo..."
                      : formData.providerKey === 'anthropic'
                      ? "e.g., claude-3.5-sonnet, claude-3-haiku..."
                      : formData.providerKey === 'google'
                      ? "e.g., gemini-2.0-flash, gemini-1.5-pro..."
                      : formData.providerKey === 'ollama'
                      ? "e.g., llama3.1:8b, deepseek-r1:8b..."
                      : "Enter model name..."
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const newModel = input.value.trim();
                      if (newModel) {
                        const existingModels = formData.modelList
                          ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
                          : [];
                        if (!existingModels.includes(newModel)) {
                          const updatedModels = [...existingModels, newModel];
                          setFormData({ ...formData, modelList: updatedModels.join(', ') });
                          input.value = '';
                        }
                      }
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Enter model name"]') as HTMLInputElement;
                    if (input) {
                      const newModel = input.value.trim();
                      if (newModel) {
                        const existingModels = formData.modelList
                          ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
                          : [];
                        if (!existingModels.includes(newModel)) {
                          const updatedModels = [...existingModels, newModel];
                          setFormData({ ...formData, modelList: updatedModels.join(', ') });
                          input.value = '';
                        }
                      }
                    }
                  }}
                >
                  <FiPlus className="mr-2" size={14} />
                  Add
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <strong>Press Enter or click Add to include model names.</strong>
                  All models share the same API key/endpoint. Click × to remove models.
                </div>
                {!formData.providerKey && (
                  <div className="text-amber-600 dark:text-amber-400">
                    Select a provider above to see model suggestions.
                  </div>
                )}
              </div>

              {/* Provider-specific Model Suggestions */}
              {formData.providerKey && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary">
                      {loadingModels
                        ? `Loading models from ${formData.providerKey}...`
                        : `Available models from ${formData.providerKey}:`
                      }
                    </p>
                    {!loadingModels && (
                      <button
                        type="button"
                        onClick={loadProviderModels}
                        className="text-xs text-muted-foreground hover:text-primary underline"
                      >
                        Refresh
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {loadingModels ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border border-t-transparent border-primary"></div>
                        Fetching models...
                      </div>
                    ) : availableModels.length > 0 ? (
                      availableModels.map((model) => {
                        const existingModels = formData.modelList
                          ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
                          : [];

                        const alreadyAdded = existingModels.includes(model);

                        return (
                          <button
                            key={model}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => {
                              if (!alreadyAdded) {
                                const updatedModels = [...existingModels, model];
                                setFormData({ ...formData, modelList: updatedModels.join(', ') });
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              alreadyAdded
                                ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                                : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                            }`}
                          >
                            {model}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No models available from API. Using static suggestions below.
                        <div className="mt-2 space-x-1">
                          {getStaticModelSuggestions(formData.providerKey).slice(0, 3).map((model) => (
                            <span key={model} className="inline-block bg-muted px-2 py-1 rounded text-xs">
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingConfig ? 'Update' : 'Add'} API Key
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this API key. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
