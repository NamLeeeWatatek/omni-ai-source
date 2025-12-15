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
import { Switch } from '@/components/ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiEye, FiEyeOff, FiKey, FiZap, FiActivity, FiAlertCircle } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
// Import React Icons for AI providers
import { AiOutlineOpenAI } from 'react-icons/ai';
import { SiClaude, SiOllama } from 'react-icons/si';
import { RiGeminiLine } from 'react-icons/ri';
import { VscAzure } from 'react-icons/vsc';
import { MdDashboardCustomize } from 'react-icons/md';
import { Lightbulb } from 'lucide-react';
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
  const [systemSettings, setSystemSettings] = useState({
    defaultProviderId: '',
    defaultModel: '',
    minTemperature: 0.0,
    maxTemperature: 2.0,
    contentModeration: true,
    safeFallbacks: true,
    contextAware: true,
    maxRequestsPerHour: 1000,
    maxRequestsPerUser: 100,
  });
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);

  // Save system AI settings
  const handleSaveSystemSettings = async () => {
    setAiSettingsLoading(true);
    try {
      await axiosClient.patch('/ai-providers/system/settings', {
        defaultProviderId: systemSettings.defaultProviderId || undefined,
        defaultModel: systemSettings.defaultModel || undefined,
        minTemperature: systemSettings.minTemperature,
        maxTemperature: systemSettings.maxTemperature,
        contentModeration: systemSettings.contentModeration,
        safeFallbacks: systemSettings.safeFallbacks,
        contextAware: systemSettings.contextAware,
        maxRequestsPerHour: systemSettings.maxRequestsPerHour,
        maxRequestsPerUser: systemSettings.maxRequestsPerUser,
      });

      toast.success('System AI settings saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save system settings');
    } finally {
      setAiSettingsLoading(false);
    }
  };

  // Load system settings on mount
  const loadSystemSettings = async () => {
    try {
      const response = await axiosClient.get('/ai-providers/system/settings');
      if (response) {
        setSystemSettings(prev => ({
          ...prev,
          ...response,
        }));
      }
    } catch (error) {
      // Settings not saved yet, use defaults
    }
  };

  useEffect(() => {
    loadSystemSettings();
  }, []);
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<UserAiProviderConfig | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [scopeType, setScopeType] = useState<'user' | 'workspace'>('user');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  // Password confirmation for API key reveal
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [configToReveal, setConfigToReveal] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<{ [key: string]: string }>({});
  const [keyRevealTimeouts, setKeyRevealTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({});

  const { data: session } = useSession();

  // Password confirmation functions
  const handlePasswordConfirmDialogOpen = (configId: string) => {
    setConfigToReveal(configId);
    setConfirmPassword('');
    setVerifyingPassword(false);
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirmDialogClose = () => {
    setPasswordDialogOpen(false);
    setConfigToReveal(null);
    setConfirmPassword('');
    setVerifyingPassword(false);
  };

  const handleConfirmPassword = async () => {
    if (!confirmPassword.trim() || !configToReveal || !session?.user?.email) {
      return;
    }

    setVerifyingPassword(true);

    try {
      // Use the login endpoint to verify password
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      await fetch(`${apiUrl}/auth/email/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          password: confirmPassword,
        }),
      });

      // If successful, fetch and reveal the API key
      const configResponse = await axiosClient.get(`/ai-providers/user/configs/${configToReveal}`);
      const apiKey = configResponse.config?.apiKey || configResponse.config?.baseUrl || '';

      if (apiKey) {
        setRevealedKeys(prev => ({
          ...prev,
          [configToReveal]: apiKey
        }));

        // Set a timeout to hide the key after 30 seconds
        const timeoutId = setTimeout(() => {
          setRevealedKeys(prev => {
            const newRevealed = { ...prev };
            delete newRevealed[configToReveal];
            return newRevealed;
          });
          // Clean up the timeout reference
          setKeyRevealTimeouts(prev => {
            const newTimeouts = { ...prev };
            delete newTimeouts[configToReveal];
            return newTimeouts;
          });
        }, 30000);

        setKeyRevealTimeouts(prev => ({
          ...prev,
          [configToReveal]: timeoutId
        }));

        toast.success('API key revealed. It will be hidden in 30 seconds.');
      }

      handlePasswordConfirmDialogClose();

    } catch (error: any) {
      toast.error('Password verification failed. Please check your password and try again.');
    } finally {
      setVerifyingPassword(false);
    }
  };



  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(keyRevealTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [keyRevealTimeouts]);

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
          if (configData?.models && configData.models.length > 0) {
            models = configData.models;
          } else {
            // If no models from API, test the API key directly to get models
            await testApiKeyAndGetModels(formData.providerId, editingConfig.id);
            // Re-fetch models after testing
            const updatedResponse = await axiosClient.get(`/ai-providers/user/models`);
            const updatedConfigData = updatedResponse.find((item: any) =>
              item.providerId === formData.providerId || item.configId === editingConfig.id
            );
            if (updatedConfigData?.models) {
              models = updatedConfigData.models;
            }
          }
        } catch (error) {
          console.log('Error fetching models:', error);
          // Try test API key approach even for existing configs
          try {
            await testApiKeyAndGetModels(formData.providerId, editingConfig.id);
            // Re-fetch models after testing
            const response = await axiosClient.get(`/ai-providers/user/models`);
            const configData = response.find((item: any) =>
              item.providerId === formData.providerId || item.configId === editingConfig.id
            );
            if (configData?.models) {
              models = configData.models;
            }
          } catch {
            models = getStaticModelSuggestions(formData.providerKey);
          }
        }
      } else if (formData.apiKey && formData.providerKey) {
        // For new configs with API key, test directly
        try {
          models = await testApiKeyAndGetModelsDirectly(formData.providerId, { apiKey: formData.apiKey });
        } catch (error) {
          console.log('Direct API test failed:', error);
          models = getStaticModelSuggestions(formData.providerKey);
        }
      } else {
        // No API key yet, use static suggestions
        models = getStaticModelSuggestions(formData.providerKey);
      }

      setAvailableModels(models);
    } catch (error) {
      console.log('Error in loadProviderModels:', error);
      // On error, fallback to static suggestions
      setAvailableModels(getStaticModelSuggestions(formData.providerKey));
    } finally {
      setLoadingModels(false);
    }
  };

  // Test API key and get models for existing config
  const testApiKeyAndGetModels = async (providerId: string, configId: string) => {
    try {
      const response = await axiosClient.get(`/ai-providers/fetch-models/${configId}/user`);
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      console.log('Failed to test API and get models:', error);
      throw error;
    }
  };

  // Test API key directly without creating config
  const testApiKeyAndGetModelsDirectly = async (providerId: string, config: { apiKey: string }) => {
    try {
      const response = await axiosClient.post('/ai-providers/verify-models', {
        providerId,
        config,
      });
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      console.log('Failed to test API key directly:', error);
      throw error;
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
    { id: 'ai-settings', label: 'AI Settings' },
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
        {activeTab === 'ai-settings' && (
          <div className="space-y-8">
            {/* System-wide AI Defaults */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FiZap className="w-5 h-5 text-primary" />
                  <CardTitle>System AI Defaults</CardTitle>
                </div>
                <CardDescription>
                  Configure default AI settings that apply across the entire system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Model Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Default Model Configuration</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default AI Provider</Label>
                      <Select
                        value={systemSettings.defaultProviderId}
                        onValueChange={(value) => {
                          setSystemSettings({ ...systemSettings, defaultProviderId: value, defaultModel: '' });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            userConfigs.filter(config => config.isActive).length > 0
                              ? "Select default provider"
                              : "Setup AI providers first"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {userConfigs.filter(config => config.isActive).map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {(() => {
                                    const IconComponent = getProviderIcon(config.provider?.icon);
                                    return <IconComponent className="text-primary" />;
                                  })()}
                                </span>
                                <span className="font-medium">{config.displayName}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {config.provider?.key || ''}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose from your configured AI providers.{' '}
                        {userConfigs.filter(config => config.isActive).length === 0 && (
                          <span className="text-primary font-medium">
                            Go to "AI Providers" tab to setup providers first.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Model</Label>
                      <Select
                        value={systemSettings.defaultModel}
                        onValueChange={(value) => {
                          setSystemSettings({ ...systemSettings, defaultModel: value });
                        }}
                        disabled={!systemSettings.defaultProviderId || userConfigs.filter(config => config.isActive).length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !systemSettings.defaultProviderId
                              ? "Select provider first"
                              : "Select default model"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const selectedConfig = userConfigs.find(c => c.id === systemSettings.defaultProviderId);
                            return selectedConfig?.modelList?.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            )) || [];
                          })()}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose model from selected provider. This will be used as default for new bots.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Temperature Range</Label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Min: 0.0"
                          step="0.1"
                          min="0"
                          max="2"
                          value={systemSettings.minTemperature}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            minTemperature: parseFloat(e.target.value) || 0.0
                          }))}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Max: 2.0"
                          step="0.1"
                          min="0"
                          max="2"
                          value={systemSettings.maxTemperature}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            maxTemperature: parseFloat(e.target.value) || 2.0
                          }))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Restrict temperature values for bot consistency
                    </p>
                  </div>
                </div>

                {/* AI Generation Policies - Moved Inside System AI Defaults */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm">AI Generation Policies</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Control AI generation behavior and safety settings
                  </p>

                  {/* Content Filtering */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Content Policies</h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="cursor-pointer font-medium">
                            Enable Content Moderation
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Filter inappropriate content and responses
                          </p>
                        </div>
                        <Switch
                          checked={systemSettings.contentModeration}
                          onCheckedChange={(checked) =>
                            setSystemSettings(prev => ({ ...prev, contentModeration: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="cursor-pointer font-medium">
                            Fallback to Safe Responses
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Provide safe alternatives when content is flagged
                          </p>
                        </div>
                        <Switch
                          checked={systemSettings.safeFallbacks}
                          onCheckedChange={(checked) =>
                            setSystemSettings(prev => ({ ...prev, safeFallbacks: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="cursor-pointer font-medium">
                            Context-Aware Generation
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Consider conversation context for better responses
                          </p>
                        </div>
                        <Switch
                          checked={systemSettings.contextAware}
                          onCheckedChange={(checked) =>
                            setSystemSettings(prev => ({ ...prev, contextAware: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rate Limiting */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm">Usage Limits</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Requests per Hour</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={systemSettings.maxRequestsPerHour}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            maxRequestsPerHour: parseInt(e.target.value) || 1000
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Max Requests per User per Hour</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={systemSettings.maxRequestsPerUser}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            maxRequestsPerUser: parseInt(e.target.value) || 100
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Prompt Templates */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <CardTitle>Prompt Templates</CardTitle>
                </div>
                <CardDescription>
                  Manage system prompt templates used across the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Custom Templates</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Create and manage custom prompt templates for different use cases
                    </p>
                    <Button variant="outline">
                      <FiPlus className="w-4 h-4 mr-2" />
                      Add Template
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Built-in Templates:</h4>
                    <div className="grid gap-3">
                      {[
                        { name: 'Customer Support', count: '12 templates' },
                        { name: 'Marketing', count: '8 templates' },
                        { name: 'Technical', count: '15 templates' },
                        { name: 'Education', count: '6 templates' },
                        { name: 'Creative', count: '9 templates' }
                      ].map((category) => (
                        <div key={category.name} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary">{category.count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSystemSettings} disabled={aiSettingsLoading}>
                {aiSettingsLoading && <Spinner className="w-4 h-4 mr-2" />}
                Save System AI Settings
              </Button>
            </div>
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
                    <div className="flex-1 flex items-center justify-between">
                      <div className="font-mono text-sm text-muted-foreground flex-1">
                        {(() => {
                          const isRevealed = revealedKeys[editingConfig.id];
                          if (isRevealed) {
                            return isRevealed;
                          }
                          const maskedText = editingConfig && 'apiKeyMasked' in editingConfig ? (editingConfig as ProviderDisplayData).apiKeyMasked : '••••••••••••';
                          return maskedText;
                        })()}
                      </div>
                      {!revealedKeys[editingConfig.id] && (
                        <button
                          type="button"
                          onClick={() => handlePasswordConfirmDialogOpen(editingConfig.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                          title={`Reveal ${formData.providerKey === 'ollama' || formData.providerKey === 'custom' ? 'endpoint URL' : 'API key'}`}
                        >
                          <FiEye className="size-4" />
                        </button>
                      )}
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
                    {!revealedKeys[editingConfig.id] && (
                      <span>
                        Click the eye icon to reveal your {formData.providerKey === 'ollama' || formData.providerKey === 'custom' ? 'endpoint URL' : 'API key'}.
                        {' '}
                      </span>
                    )}
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

      {/* Password Confirmation Dialog for API Key Reveal */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Password</DialogTitle>
            <DialogDescription>
              Enter your password to reveal the API key
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleConfirmPassword();
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handlePasswordConfirmDialogClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={verifyingPassword || !confirmPassword.trim()}>
                {verifyingPassword && <Spinner className="w-4 h-4 mr-2" />}
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
