"use client";

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { PageLoading } from '@/components/ui/PageLoading';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AIProvidersTab } from '@/components/features/settings/AIProvidersTab';
import { AISettingsTab } from '@/components/features/settings/AISettingsTab';
import { AccountTab } from '@/components/features/settings/AccountTab';
import { NotificationsTab } from '@/components/features/settings/NotificationsTab';
import { SharingTab } from '@/components/features/settings/SharingTab';
import { BillingTab } from '@/components/features/settings/BillingTab';
import { QuestionsTab } from '@/components/features/settings/QuestionsTab';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  User,
  Settings,
  Cpu,
  Bell,
  Share2,
  CreditCard,
  HelpCircle
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('account');

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
    { id: 'account', label: 'Account', icon: User },
    { id: 'ai-settings', label: 'AI Settings', icon: Settings },
    { id: 'ai-providers', label: 'AI Providers', icon: Cpu },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sharing', label: 'Sharing', icon: Share2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'questions', label: 'Help & FAQ', icon: HelpCircle },
  ];

  if (loading) {
    return <PageLoading message="Loading settings" />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        <PageHeader
          title="Settings"
          description="Manage your agent configurations and system preferences"
          premium
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full space-y-8">
          <TabsList className="flex flex-wrap h-auto p-1.5 bg-card/30 backdrop-blur-md border border-border/50 gap-1 rounded-2xl shadow-sm">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-6 py-3 transition-all data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:ring-1 data-[state=active]:ring-border/50 font-bold text-xs rounded-xl"
              >
                <tab.icon className="w-4 h-4" />
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
