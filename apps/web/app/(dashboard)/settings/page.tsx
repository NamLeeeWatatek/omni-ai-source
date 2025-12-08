"use client";

import React, { useEffect, useState } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiEye, FiEyeOff, FiKey, FiZap, FiActivity, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

const PROVIDER_OPTIONS = [
  { 
    value: 'google', 
    label: 'Google Gemini', 
    color: 'from-blue-500 to-cyan-500',
    icon: '🔷',
    description: 'Fast and efficient AI models'
  },
  { 
    value: 'openai', 
    label: 'OpenAI', 
    color: 'from-green-500 to-emerald-500',
    icon: '🤖',
    description: 'GPT models for advanced tasks'
  },
  { 
    value: 'anthropic', 
    label: 'Anthropic Claude', 
    color: 'from-orange-500 to-amber-500',
    icon: '🧠',
    description: 'Balanced and reliable AI'
  },
  { 
    value: 'azure', 
    label: 'Azure OpenAI', 
    color: 'from-purple-500 to-pink-500',
    icon: '☁️',
    description: 'Enterprise-grade AI'
  },
  { 
    value: 'custom', 
    label: 'Custom Provider', 
    color: 'from-gray-500 to-slate-500',
    icon: '⚙️',
    description: 'Your own AI endpoint'
  },
];

export default function AIModelsPage() {
  const [providers, setProviders] = useState<UserAiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<UserAiProvider | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);  // ✅ New state for change key mode
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  
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
      const providersRes = await axiosClient.get('/ai-providers/user');
      setProviders(providersRes.data);
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
      setIsChangingApiKey(false);  // ✅ Reset change key mode
    } else {
      setEditingProvider(null);
      setFormData({
        provider: 'google',
        displayName: '',
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
    setEditingProvider(null);
    setIsChangingApiKey(false);  // ✅ Reset
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

    // ✅ For create, API key is required
    if (!editingProvider && !formData.apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    // ✅ For edit, if user enters API key, it must not be empty
    if (editingProvider && formData.apiKey && !formData.apiKey.trim()) {
      toast.error('API key cannot be empty. Leave it blank to keep current key.');
      return;
    }

    try {
      const payload: any = {
        provider: formData.provider,
        displayName: formData.displayName,
        modelList: formData.modelList
          ? formData.modelList.split(',').map(m => m.trim()).filter(Boolean)
          : undefined,
      };

      // ✅ Only include apiKey if it's not empty (for both create and update)
      if (formData.apiKey && formData.apiKey.trim() !== '') {
        payload.apiKey = formData.apiKey.trim();
      }

      if (editingProvider) {
        await axiosClient.patch(`/ai-providers/user/${editingProvider.id}`, payload);
        toast.success('API key updated successfully');
      } else {
        // ✅ For create, apiKey is required
        if (!payload.apiKey) {
          toast.error('API key is required');
          return;
        }
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

  const handleDelete = async () => {
    if (!providerToDelete) return;

    try {
      await axiosClient.delete(`/ai-providers/user/${providerToDelete}`);
      toast.success('API key deleted successfully');
      loadData();
    } catch {
      toast.error('Failed to delete API key');
    } finally {
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setProviderToDelete(id);
    setDeleteDialogOpen(true);
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

  const [activeTab, setActiveTab] = useState('ai-providers');
  const totalUsage = providers.reduce((sum, p) => sum + p.quotaUsed, 0);
  const activeProviders = providers.filter(p => p.isActive).length;

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
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {}
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

        {}
        {activeTab === 'ai-providers' && (
          <div className="space-y-8">
            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Providers</CardDescription>
            <CardTitle className="text-3xl">{providers.length}</CardTitle>
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

            {}
            {providers.length === 0 ? (
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
          {providers.map((provider) => {
            const providerInfo = PROVIDER_OPTIONS.find(p => p.value === provider.provider);
            return (
              <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${providerInfo?.color || 'from-gray-500 to-slate-500'}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{providerInfo?.icon || '⚙️'}</div>
                      <div>
                        <CardTitle className="text-lg">{provider.displayName}</CardTitle>
                        <CardDescription>{providerInfo?.label || provider.provider}</CardDescription>
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
                  {}
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

                  {}
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

                  {}
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

        {}
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

        {}
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

        {}
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

        {}
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

        {}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProvider ? 'Edit API Key' : 'Add New API Key'}
            </DialogTitle>
            <DialogDescription>
              {editingProvider 
                ? 'Update your API key configuration and settings'
                : 'Connect a new AI provider to unlock powerful models'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {}
            {!editingProvider && (
              <div className="space-y-3">
                <Label>Select Provider</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PROVIDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, provider: option.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        formData.provider === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-semibold text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editingProvider && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {PROVIDER_OPTIONS.find(p => p.value === formData.provider)?.icon}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {PROVIDER_OPTIONS.find(p => p.value === formData.provider)?.label}
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
              <Label htmlFor="apiKey">API Key</Label>
              
              {editingProvider && !isChangingApiKey ? (
                // ✅ View mode: Show masked key with change button
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 font-mono text-sm text-muted-foreground">
                      {editingProvider.apiKeyMasked || '••••••••••••••••••••'}
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
                      <FiEdit2 className="mr-2 size-3" />
                      Change Key
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your API key is encrypted and stored securely
                  </p>
                </div>
              ) : (
                // ✅ Edit mode: Show input field
                <div className="space-y-2">
                  {editingProvider && isChangingApiKey && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <FiAlertCircle className="size-4 text-amber-600 dark:text-amber-500" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Entering a new API key will replace the current one
                      </p>
                    </div>
                  )}
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={editingProvider ? "Enter new API key" : "Enter your API key"}
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      required={!editingProvider}
                      className={editingProvider && isChangingApiKey ? "border-amber-300 dark:border-amber-800" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {editingProvider && isChangingApiKey && (
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
                      Cancel - Keep current key
                    </Button>
                  )}
                  {!editingProvider && (
                    <p className="text-xs text-muted-foreground">
                      Your API key will be encrypted and stored securely
                    </p>
                  )}
                </div>
              )}
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
