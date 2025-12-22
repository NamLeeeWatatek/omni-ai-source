"use client";

import React, { useState } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiGrid, FiList, FiSearch, FiKey, FiActivity } from 'react-icons/fi';
// Import React Icons for AI providers
import { AiOutlineOpenAI } from 'react-icons/ai';
import { SiClaude, SiOllama } from 'react-icons/si';
import { RiGeminiLine } from 'react-icons/ri';
import { VscAzure } from 'react-icons/vsc';
import { MdDashboardCustomize } from 'react-icons/md';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';

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
  return IconComponent || MdDashboardCustomize;
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

interface AIProvidersTabProps {
  userConfigs: UserAiProviderConfig[];
  availableProviders: AiProvider[];
  loading: boolean;
  onDataChange: () => void;
}

export function AIProvidersTab({ userConfigs, availableProviders, loading, onDataChange }: AIProvidersTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  const handleOpenDialog = (config?: UserAiProviderConfig | ProviderDisplayData) => {
    // TODO: Implement dialog opening logic
    console.log('Open dialog for config:', config);
  };

  const handleVerify = async (id: string) => {
    try {
      await axiosClient.post(`/ai-providers/user/configs/${id}/verify`);
      toast.success('API key verified successfully');
      onDataChange();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify API key');
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      await axiosClient.delete(`/ai-providers/user/configs/${configToDelete}`);
      toast.success('API key deleted successfully');
      onDataChange();
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
      onDataChange();
    } catch {
      toast.error('Failed to update provider status');
    }
  };

  // Calculate combined providers for display
  const allProviders = [...userConfigs].map(config => ({
    ...config,
    quotaUsed: config.config?.usage || 0,
    lastUsedAt: config.updatedAt,
    isVerified: config.config?.isVerified || false,
    apiKeyMasked: config.config?.apiKey
      ? '••••••••••••'
      : (config.config?.baseUrl ? '••••••••••••' : null),
  }));

  const totalUsage = allProviders.reduce((sum, p) => sum + p.quotaUsed, 0);
  const activeProviders = allProviders.filter(p => p.isActive).length;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/10">
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

        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/10">
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

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="text-primary/80 font-medium">Quick Action</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handleOpenDialog()} className="w-full shadow-md font-semibold text-base h-11">
              <FiPlus className="mr-2 stroke-[3]" />
              Add New Provider
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
        <div className="relative flex-1 w-full max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 focus:bg-background border-muted-foreground/20"
          />
        </div>

        <div className="bg-muted/50 p-1 rounded-xl flex shadow-sm border border-border/50">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FiGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {allProviders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
          <div className="size-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
            <FiKey className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No API Keys Configured</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Add your first AI provider API key to start using AI models in your bots and workflows
          </p>
          <Button onClick={() => handleOpenDialog()} size="lg" className="rounded-xl font-bold px-8">
            <FiPlus className="mr-2" />
            Add Your First API Key
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allProviders
                .filter(p =>
                  p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.provider?.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((provider) => {
                  const providerData = provider.provider || availableProviders.find(p => p.id === provider.providerId);
                  return (
                    <div key={provider.id}>
                      <Card className="group h-full flex flex-col hover:shadow-xl transition-all duration-300 border-border/60 bg-card/50 backdrop-blur-sm hover:-translate-y-1 overflow-hidden rounded-2xl">
                        <div className={cn("h-1.5 w-full bg-gradient-to-r", provider.isActive ? "from-primary to-primary/50" : "from-muted to-muted/50")} />
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center text-3xl shadow-inner">
                                {(() => {
                                  const IconComponent = getProviderIcon(providerData?.icon);
                                  return <IconComponent className="text-primary" />;
                                })()}
                              </div>
                              <div>
                                <CardTitle className="text-lg font-bold">{provider.displayName}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5 mt-1">
                                  {providerData?.label || 'Unknown Provider'}
                                  {provider.isVerified && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-green-600 border-green-600/30 bg-green-500/5 gap-1">
                                      <FiCheck className="size-2.5" /> Verified
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge
                              variant={provider.isActive ? 'default' : 'secondary'}
                              className={cn("uppercase text-[10px] font-bold tracking-wider", provider.isActive ? "bg-green-500 hover:bg-green-600" : "")}
                            >
                              {provider.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-1">
                          {provider.modelList && provider.modelList.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                <FiKey className="size-3" /> Configured Models
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {provider.modelList.slice(0, 5).map((model) => (
                                  <Badge key={model} variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 bg-muted/50 border-border/50">
                                    {model}
                                  </Badge>
                                ))}
                                {provider.modelList.length > 5 && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 opacity-50">
                                    +{provider.modelList.length - 5}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center border-2 border-dashed border-border/40 rounded-xl">
                              <p className="text-xs text-muted-foreground">No specific models configured</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40 mt-auto">
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground">Usage</p>
                              <p className="text-sm font-bold font-mono">{provider.quotaUsed.toLocaleString()}</p>
                            </div>
                            <div className="space-y-0.5 text-right">
                              <p className="text-xs text-muted-foreground">Last Used</p>
                              <p className="text-sm font-medium">{provider.lastUsedAt ? new Date(provider.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {!provider.isVerified && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerify(provider.id)}
                                className="flex-1 h-9 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary"
                              >
                                <FiCheck className="mr-2 size-3.5" />
                                Verify
                              </Button>
                            )}
                            <Button
                              variant={provider.isActive ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleToggleActive(provider)}
                              className="flex-1 h-9 rounded-lg"
                            >
                              {provider.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(provider)}
                              className="flex-1 h-8 text-xs bg-muted/30 hover:bg-muted"
                            >
                              <FiEdit2 className="size-3 mr-2" /> Edit Config
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(provider.id)}
                              className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <FiTrash2 className="size-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden border border-border/40 shadow-xl">
              <DataTable
                data={allProviders
                  .filter(p =>
                    p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.provider?.label.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                }
                columns={[
                  {
                    key: 'displayName',
                    label: 'Provider Name',
                    render: (value, row) => {
                      const providerData = row.provider || availableProviders.find(p => p.id === row.providerId);
                      const IconComponent = getProviderIcon(providerData?.icon);
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                            <IconComponent className="text-primary text-lg" />
                          </div>
                          <div>
                            <div className="font-medium">{value}</div>
                            <div className="text-xs text-muted-foreground">{providerData?.label}</div>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (_, row) => (
                      <Badge variant={row.isActive ? 'default' : 'secondary'} className={row.isActive ? 'bg-green-500' : ''}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )
                  },
                  {
                    key: 'models',
                    label: 'Models',
                    render: (_, row) => (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {row.modelList?.slice(0, 2).map((m: string) => (
                          <Badge key={m} variant="secondary" className="text-[10px] px-1 scale-90">{m}</Badge>
                        ))}
                        {(row.modelList?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-[10px] px-1 scale-90">+{row.modelList!.length - 2}</Badge>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'usage',
                    label: 'Usage',
                    render: (_, row) => <span className="font-mono text-xs">{row.quotaUsed.toLocaleString()}</span>
                  },
                  {
                    key: 'actions',
                    label: '',
                    render: (_, row) => (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(row)}>
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => openDeleteDialog(row.id)}>
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  }
                ]}
                searchable={false}
                className="border-none"
              />
            </div>
          )}

          {/* Unified Pagination */}
          {allProviders.length > pageSize && (
            <div className="pt-8 border-t border-border/40 flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground">{Math.min(currentPage * pageSize, allProviders.length)}</span> of <span className="text-foreground">{allProviders.length}</span> providers
              </p>
              <Pagination
                pagination={{
                  page: currentPage,
                  limit: pageSize,
                  total: allProviders.length,
                  hasNextPage: currentPage * pageSize < allProviders.length,
                  totalPages: Math.ceil(allProviders.length / pageSize)
                }}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
