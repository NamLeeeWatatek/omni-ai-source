"use client";

import React, { useEffect, useState } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { PageLoading } from '@/components/ui/PageLoading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AIProvidersTab } from '@/components/settings/AIProvidersTab';
import { AISettingsTab } from '@/components/settings/AISettingsTab';
import { AccountTab } from '@/components/settings/AccountTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { SharingTab } from '@/components/settings/SharingTab';
import { BillingTab } from '@/components/settings/BillingTab';
import { QuestionsTab } from '@/components/settings/QuestionsTab';

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

export default function AIModelsPage() {
  const [userConfigs, setUserConfigs] = useState<UserAiProviderConfig[]>([]);
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
  const [activeTab, setActiveTab] = useState('ai-providers');

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);

      // Load available providers
      const providersRes = await axiosClient.get('/ai-providers') as AiProvider[];
      setAvailableProviders(providersRes);

      // Load user configs and populate provider relationships
      const userConfigsRes = await axiosClient.get('/ai-providers/user/configs') as UserAiProviderConfig[];
      // Enhance user configs with provider data from availableProviders
      const enhancedUserConfigs = userConfigsRes.map((config: any) => ({
        ...config,
        provider: providersRes.find((provider: any) => provider.id === config.providerId),
      }));
      setUserConfigs(enhancedUserConfigs);
    } catch (error) {
      console.error('Failed to load settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle data changes from child components
  const handleDataChange = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

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
    return <PageLoading message="Loading settings..." />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {tabs.map((tab) => (
              <TabsTrigger value={tab.id} className="group">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="ai-providers" className="space-y-6 animate-in fade-in duration-500">
            <AIProvidersTab
              userConfigs={userConfigs}
              availableProviders={availableProviders}
              loading={loading}
              onDataChange={handleDataChange}
            />
          </TabsContent>

          <TabsContent value="ai-settings" className="space-y-8">
            <AISettingsTab
              userConfigs={userConfigs}
              systemSettings={systemSettings}
              onSystemSettingsChange={setSystemSettings}
            />
          </TabsContent>

          <TabsContent value="account" className="space-y-8">
            <AccountTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="sharing">
            <SharingTab />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
