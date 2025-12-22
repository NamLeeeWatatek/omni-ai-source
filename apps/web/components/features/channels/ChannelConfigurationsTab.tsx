"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { AlertBanner, CodeBlock } from '@/components/ui/AlertBanner';
import {
  FiSettings,
  FiTrash2,
  FiCheck,
  FiX,
  FiPlus,
  FiFacebook,
  FiMessageCircle,
  FiInstagram,
  FiPhone,
  FiMail,
  FiYoutube,
  FiTwitter,
  FiLinkedin,
  FiMusic,
  FiMonitor,
  FiMessageSquare,
  FiSmartphone,
  FiGlobe,
  FiShoppingCart,
  FiTarget,
  FiCloud,
  FiSend,
  FiHash,
  FiMapPin,
  FiPhoneCall,
  FiVideo,
  FiZap,
  FiBook,
  FiBarChart,
  FiUsers,
  FiTrendingUp
} from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface IntegrationConfig {
  id?: number;
  provider: string;
  name: string;
  client_id: string;
  client_secret: string;
  scopes?: string;
  verify_token?: string;
  is_active: boolean;
}

interface ChannelConfigurationsTabProps {
  configs: IntegrationConfig[];
  isLoading: boolean;
  onSaveConfig: (config: Partial<IntegrationConfig>) => Promise<void>;
  onDeleteConfig: (id: number) => void;
  onConnect: (provider: string, configId?: number) => void;
}

export function ChannelConfigurationsTab({
  configs,
  isLoading,
  onSaveConfig,
  onDeleteConfig,
  onConnect
}: ChannelConfigurationsTabProps) {
  const [configForm, setConfigForm] = useState({
    id: undefined as number | undefined,
    provider: '',
    name: '',
    client_id: '',
    client_secret: '',
    scopes: '',
    verify_token: ''
  });

  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const getIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'facebook': <FiFacebook className="w-6 h-6" />,
      'messenger': <FiMessageCircle className="w-6 h-6" />,
      'instagram': <FiInstagram className="w-6 h-6" />,
      'whatsapp': <FiPhone className="w-6 h-6" />,
      'telegram': <FiSend className="w-6 h-6" />,
      'email': <FiMail className="w-6 h-6" />,
      'youtube': <FiYoutube className="w-6 h-6" />,
      'twitter': <FiTwitter className="w-6 h-6" />,
      'linkedin': <FiLinkedin className="w-6 h-6" />,
      'tiktok': <FiMusic className="w-6 h-6" />,
      'discord': <FiHash className="w-6 h-6" />,
      'slack': <FiMessageSquare className="w-6 h-6" />,
      'zalo': <FiMessageCircle className="w-6 h-6" />,
      'line': <FiMessageSquare className="w-6 h-6" />,
      'viber': <FiPhoneCall className="w-6 h-6" />,
      'wechat': <FiMessageCircle className="w-6 h-6" />,
      'sms': <FiSmartphone className="w-6 h-6" />,
      'webchat': <FiGlobe className="w-6 h-6" />,
      'shopify': <FiShoppingCart className="w-6 h-6" />,
      'google': <FiGlobe className="w-6 h-6" />,
      'hubspot': <FiTarget className="w-6 h-6" />,
      'salesforce': <FiCloud className="w-6 h-6" />,
      'mailchimp': <FiMail className="w-6 h-6" />,
      'intercom': <FiMessageSquare className="w-6 h-6" />,
      'zapier': <FiZap className="w-6 h-6" />,
      'notion': <FiBook className="w-6 h-6" />,
      'airtable': <FiBarChart className="w-6 h-6" />,
    };
    return icons[type] || <FiSmartphone className="w-6 h-6" />;
  };

  const getColor = (type: string) => {
    const colors: Record<string, string> = {
      'facebook': 'text-blue-600 bg-blue-500/10 border-blue-500/20',
      'messenger': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'instagram': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      'whatsapp': 'text-green-500 bg-green-500/10 border-green-500/20',
      'telegram': 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      'youtube': 'text-red-500 bg-red-500/10 border-red-500/20',
      'twitter': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
      'linkedin': 'text-blue-700 bg-blue-700/10 border-blue-700/20',
      'tiktok': 'text-black bg-black/10 border-black/20',
      'discord': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      'slack': 'text-purple-600 bg-purple-600/10 border-purple-600/20',
      'zalo': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'line': 'text-green-500 bg-green-500/10 border-green-500/20',
      'viber': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'wechat': 'text-green-600 bg-green-600/10 border-green-600/20',
      'sms': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      'email': 'text-red-500 bg-red-500/10 border-red-500/20',
      'webchat': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      'shopify': 'text-green-600 bg-green-600/10 border-green-600/20',
      'google': 'text-red-500 bg-red-500/10 border-red-500/20',
      'hubspot': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'salesforce': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'mailchimp': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      'intercom': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'zapier': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'notion': 'text-gray-800 bg-gray-800/10 border-gray-800/20',
      'airtable': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    };
    return colors[type] || 'text-gray-600 bg-gray-600/10 border-gray-600/20';
  };

  const openConfig = (configId?: number, provider?: string) => {
    const existing = configId ? configs.find(c => c.id === configId) : null;
    setConfigForm({
      id: existing?.id || undefined,
      provider: existing?.provider || provider || '',
      name: existing?.name || '',
      client_id: existing?.client_id || '',
      client_secret: existing?.client_secret || '',
      scopes: existing?.scopes || '',
      verify_token: existing?.verify_token || ''
    });
    setShowConfigDialog(true);
  };

  const closeConfigDialog = () => {
    setShowConfigDialog(false);
    setConfigForm({
      id: undefined,
      provider: '',
      name: '',
      client_id: '',
      client_secret: '',
      scopes: '',
      verify_token: ''
    });
  };

  const saveConfig = async () => {
    if (!configForm.provider) {
      // TODO: Show error
      return;
    }

    if (!configForm.client_id || !configForm.client_secret) {
      // TODO: Show error
      return;
    }

    try {
      await onSaveConfig(configForm);
      closeConfigDialog();
    } catch (error) {
      // TODO: Handle error
    }
  };

  const MESSAGING_CHANNELS = [
    { id: 'facebook', name: 'Facebook Page', description: 'Manage posts and comments on your Facebook Page', category: 'social', multiAccount: true },
    { id: 'messenger', name: 'Messenger', description: 'Reply to messages from your Facebook Page', category: 'messaging', multiAccount: true },
    { id: 'instagram', name: 'Instagram', description: 'Manage Instagram DMs, comments and posts', category: 'social', multiAccount: true },
    { id: 'whatsapp', name: 'WhatsApp Business', description: 'Connect WhatsApp Business API', category: 'messaging', multiAccount: true },
    { id: 'telegram', name: 'Telegram', description: 'Connect Telegram Bot for messaging', category: 'messaging', multiAccount: true },
    { id: 'youtube', name: 'YouTube', description: 'Manage YouTube channel and comments', category: 'social', multiAccount: true },
    { id: 'twitter', name: 'X / Twitter', description: 'Post tweets and manage DMs', category: 'social', multiAccount: true },
    { id: 'linkedin', name: 'LinkedIn', description: 'Post to LinkedIn and manage messages', category: 'social', multiAccount: true },
    { id: 'tiktok', name: 'TikTok', description: 'Post videos and manage TikTok account', category: 'social', multiAccount: true },
    { id: 'discord', name: 'Discord', description: 'Connect Discord bot for community', category: 'messaging', multiAccount: true },
    { id: 'slack', name: 'Slack', description: 'Send notifications to Slack channels', category: 'messaging', multiAccount: true },
    { id: 'zalo', name: 'Zalo OA', description: 'Connect Zalo Official Account (Vietnam)', category: 'messaging', multiAccount: true },
    { id: 'line', name: 'LINE', description: 'Connect LINE Official Account (Asia)', category: 'messaging', multiAccount: true },
    { id: 'viber', name: 'Viber', description: 'Connect Viber Business Messages', category: 'messaging', multiAccount: true },
    { id: 'wechat', name: 'WeChat', description: 'Connect WeChat Official Account (China)', category: 'messaging', multiAccount: true },
    { id: 'sms', name: 'SMS', description: 'Send SMS via Twilio or other providers', category: 'messaging', multiAccount: false },
    { id: 'email', name: 'Email', description: 'Send emails via SMTP or providers', category: 'messaging', multiAccount: false },
    { id: 'webchat', name: 'Web Chat', description: 'Embed chat widget on your website', category: 'messaging', multiAccount: false },
  ];

  const BUSINESS_INTEGRATIONS = [
    { id: 'shopify', name: 'Shopify', description: 'Sync orders and customers from Shopify', category: 'ecommerce', multiAccount: true },
    { id: 'google', name: 'Google Business', description: 'Manage Google Business Profile reviews', category: 'business', multiAccount: true },
    { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and deals with HubSpot CRM', category: 'crm', multiAccount: false },
    { id: 'salesforce', name: 'Salesforce', description: 'Connect to Salesforce CRM', category: 'crm', multiAccount: false },
    { id: 'mailchimp', name: 'Mailchimp', description: 'Sync contacts for email marketing', category: 'marketing', multiAccount: false },
    { id: 'intercom', name: 'Intercom', description: 'Sync conversations with Intercom', category: 'support', multiAccount: false },
    { id: 'zapier', name: 'Zapier', description: 'Connect to 5000+ apps via Zapier', category: 'automation', multiAccount: false },
    { id: 'notion', name: 'Notion', description: 'Sync data with Notion databases', category: 'productivity', multiAccount: true },
    { id: 'airtable', name: 'Airtable', description: 'Connect to Airtable bases', category: 'productivity', multiAccount: true },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-10">
        {configs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              Configured Integrations
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {configs.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configs.map((config) => {
                const provider = config.provider;
                const channelInfo = [...MESSAGING_CHANNELS, ...BUSINESS_INTEGRATIONS].find(c => c.id === provider);

                return (
                  <Card key={config.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className={`p-3 rounded-lg ${getColor(provider)}`}>
                        {getIcon(provider)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openConfig(config.id)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit Configuration"
                        >
                          <FiSettings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => config.id && onDeleteConfig(config.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete Configuration"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg font-semibold mb-1">{config.name || channelInfo?.name || provider}</CardTitle>
                      <CardDescription className="mb-5">
                        {channelInfo?.description || 'API configured'}
                      </CardDescription>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Client ID</span>
                          <span className="font-mono">{config.client_id?.slice(0, 12) || 'N/A'}...</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Status</span>
                          <span className={`flex items-center gap-1.5 ${config.is_active ? 'text-success' : 'text-destructive'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.is_active ? 'bg-success' : 'bg-destructive'}`}></span>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-3">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onConnect(provider, config.id)}
                      >
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConfig(config.id)}
                      >
                        Edit
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Integrations */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            Available Integrations
          </h2>

          {/* Messaging Channels */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider pl-1">Messaging Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {MESSAGING_CHANNELS.map((channel) => (
                <Card
                  key={channel.id}
                  onClick={() => openConfig(undefined, channel.id)}
                  className="cursor-pointer hover:scale-[1.02] transition-transform text-left group"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className={`p-2.5 rounded-lg ${getColor(channel.id)}`}>
                      {getIcon(channel.id)}
                    </div>
                    <FiSettings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base font-semibold mb-1">{channel.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {channel.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Business Integrations */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider pl-1">Business Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {BUSINESS_INTEGRATIONS.map((integration) => (
                <Card
                  key={integration.id}
                  onClick={() => openConfig(undefined, integration.id)}
                  className="cursor-pointer hover:scale-[1.02] transition-transform text-left group"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className={`p-2.5 rounded-lg ${getColor(integration.id)}`}>
                      {getIcon(integration.id)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                      {integration.category}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base font-semibold mb-1">{integration.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {integration.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      {showConfigDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-lg ${getColor(configForm.provider)}`}>
                  {getIcon(configForm.provider)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold capitalize">{configForm.provider}</h3>
                  <p className="text-xs text-muted-foreground">API Configuration</p>
                </div>
                <button
                  onClick={closeConfigDialog}
                  className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <AlertBanner variant="tip" className="mb-6">
                You need to create an app in the <span className="font-semibold">{configForm.provider} developer portal</span> to get these credentials.
              </AlertBanner>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Configuration Name <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    placeholder="e.g. My Main Page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    App ID / Client ID <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    value={configForm.client_id}
                    onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                    placeholder="Enter App ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    App Secret / Client Secret <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="password"
                    value={configForm.client_secret}
                    onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                    placeholder="Enter App Secret"
                  />
                </div>

                {(configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Webhook Verify Token
                    </label>
                    <Input
                      type="text"
                      value={configForm.verify_token}
                      onChange={(e) => setConfigForm({ ...configForm, verify_token: e.target.value })}
                      placeholder="Enter your verify token"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use this token when setting up webhook in Facebook App
                    </p>
                  </div>
                )}

                {configForm.provider !== 'facebook' && configForm.provider !== 'messenger' && configForm.provider !== 'instagram' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Scopes <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <Input
                      type="text"
                      value={configForm.scopes}
                      onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                      placeholder="email, public_profile"
                    />
                  </div>
                )}

                {(configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') && (
                  <CodeBlock label="Webhook URL">
                    {process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api/webhooks/facebook
                  </CodeBlock>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-2">
                  <Button
                    variant="ghost"
                    onClick={closeConfigDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveConfig}
                    disabled={!configForm.client_id || !configForm.client_secret}
                  >
                    {configForm.id ? 'Update Configuration' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
