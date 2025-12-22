"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import {
  FiGrid,
  FiList,
  FiSearch,
  FiCheckCircle,
  FiSettings,
  FiTrash2,
  FiFacebook,
  FiMessageCircle,
  FiInstagram,
  FiPhone,
  FiMail,
  FiYoutube,
  FiTwitter,
  FiLinkedin,
  FiMusic,
  FiHash,
  FiMessageSquare,
  FiSmartphone,
  FiGlobe,
  FiShoppingCart,
  FiTarget,
  FiCloud,
  FiSend,
  FiBook,
  FiBarChart,
  FiZap
} from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface Channel {
  id: number;
  name: string;
  type: string;
  status: string;
  metadata?: any;
  createdAt: string;
}

interface ConnectedChannelsTabProps {
  channels: Channel[];
  searchQuery: string;
  viewMode: 'grid' | 'list';
  currentPage: number;
  pageSize: number;
  totalCount: number;
  selectedIds: number[];
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onToggleSelection: (id: number) => void;
  onClearSelection: () => void;
  onAssignBot: (channel: Channel) => void;
  onDisconnect: (id: number) => void;
  onLoadData: () => void;
  isLoading?: boolean;
}

export function ConnectedChannelsTab({
  channels,
  searchQuery,
  viewMode,
  currentPage,
  pageSize,
  totalCount,
  selectedIds,
  onSearchChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onToggleSelection,
  onClearSelection,
  onAssignBot,
  onDisconnect,
  onLoadData,
  isLoading = false
}: ConnectedChannelsTabProps) {
  const getIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'facebook': <FiFacebook className="w-5 h-5" />,
      'messenger': <FiMessageCircle className="w-5 h-5" />,
      'instagram': <FiInstagram className="w-5 h-5" />,
      'whatsapp': <FiPhone className="w-5 h-5" />,
      'telegram': <FiSend className="w-5 h-5" />,
      'email': <FiMail className="w-5 h-5" />,
      'youtube': <FiYoutube className="w-5 h-5" />,
      'twitter': <FiTwitter className="w-5 h-5" />,
      'linkedin': <FiLinkedin className="w-5 h-5" />,
      'tiktok': <FiMusic className="w-5 h-5" />,
      'discord': <FiHash className="w-5 h-5" />,
      'slack': <FiMessageSquare className="w-5 h-5" />,
      'zalo': <FiMessageCircle className="w-5 h-5" />,
      'line': <FiMessageSquare className="w-5 h-5" />,
      'viber': <FiPhone className="w-5 h-5" />,
      'wechat': <FiMessageCircle className="w-5 h-5" />,
      'sms': <FiSmartphone className="w-5 h-5" />,
      'webchat': <FiGlobe className="w-5 h-5" />,
      'shopify': <FiShoppingCart className="w-5 h-5" />,
      'google': <FiGlobe className="w-5 h-5" />,
      'hubspot': <FiTarget className="w-5 h-5" />,
      'salesforce': <FiCloud className="w-5 h-5" />,
      'mailchimp': <FiMail className="w-5 h-5" />,
      'intercom': <FiMessageSquare className="w-5 h-5" />,
      'zapier': <FiZap className="w-5 h-5" />,
      'notion': <FiBook className="w-5 h-5" />,
      'airtable': <FiBarChart className="w-5 h-5" />,
    };
    return icons[type] || <FiSmartphone className="w-5 h-5" />;
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

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
        <div className="relative flex-1 w-full max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search connected channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 focus:bg-background border-muted-foreground/20"
          />
        </div>

        <div className="bg-muted/50 p-1 rounded-xl flex shadow-sm border border-border/50">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FiGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FiList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
          <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
          <p className="text-muted-foreground mb-8 mx-auto max-w-lg">
            Configure your first integration to start connecting channels and automating your workflow
          </p>
          <Button onClick={onLoadData} size="lg" className="rounded-xl font-bold px-8">
            Go to Configurations
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedChannels.map((channel) => {
                const sameTypeCount = channels.filter(c => c.type === channel.type).length;

                return (
                  <Card key={channel.id} className="group relative overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300 border-border/60 bg-card/50 backdrop-blur-sm hover:-translate-y-1 rounded-2xl">
                    <div className={cn("h-1.5 w-full bg-gradient-to-r", channel.status === 'connected' ? "from-success to-success/50" : "from-destructive to-destructive/50")} />
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className={`p-3 rounded-xl shadow-inner ${getColor(channel.type)}`}>
                        {getIcon(channel.type)}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1">
                          <FiCheckCircle className="w-3 h-3" /> Active
                        </Badge>
                        {channel.metadata?.botId && (
                          <Badge variant="secondary" className="gap-1 text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            <FiSettings className="w-3 h-3" /> Bot Assigned
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <CardTitle className="text-lg font-bold mb-1 line-clamp-1">{channel.name}</CardTitle>
                      <CardDescription className="capitalize font-medium">
                        {channel.type}
                      </CardDescription>
                      {sameTypeCount > 1 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Part of {sameTypeCount} connected accounts
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-3 border-t bg-muted/30 px-6 py-4 mt-auto">
                      <button
                        onClick={() => onAssignBot(channel)}
                        className="flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-2 rounded-lg hover:bg-primary/10 bg-background border shadow-sm"
                      >
                        <FiSettings className="w-3.5 h-3.5" />
                        {channel.metadata?.botId ? 'Change Bot' : 'Assign Bot'}
                      </button>
                      <button
                        onClick={() => onDisconnect(channel.id)}
                        className="flex items-center justify-center gap-2 text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors py-2 rounded-lg hover:bg-destructive/10 bg-background border shadow-sm"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden border border-border/40 shadow-xl">
              <DataTable
                data={paginatedChannels}
                columns={[
                  {
                    key: 'name',
                    label: 'Channel Name',
                    render: (value, row) => (
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getColor(row.type)}`}>
                          {getIcon(row.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{value}</div>
                          <div className="text-xs text-muted-foreground capitalize">{row.type}</div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (_, row) => (
                      <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1">
                        <FiCheckCircle className="w-3 h-3" /> Active
                      </Badge>
                    )
                  },
                  {
                    key: 'bot',
                    label: 'Assigned Bot',
                    render: (_, row) => row.metadata?.botId ? (
                      <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600">Bot Assigned</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )
                  },
                  {
                    key: 'createdAt',
                    label: 'Connected',
                    render: (value) => <span className="text-xs font-medium text-muted-foreground">{new Date(value).toLocaleDateString()}</span>
                  },
                  {
                    key: 'actions',
                    label: '',
                    render: (_, row) => (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAssignBot(row)}
                        >
                          <FiSettings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDisconnect(row.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <FiTrash2 className="w-4 h-4" />
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
          {filteredChannels.length > pageSize && (
            <div className="pt-8 border-t border-border/40 flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground">{Math.min(currentPage * pageSize, filteredChannels.length)}</span> of <span className="text-foreground">{filteredChannels.length}</span> channels
              </p>
              <Pagination
                pagination={{
                  page: currentPage,
                  limit: pageSize,
                  total: filteredChannels.length,
                  hasNextPage: currentPage * pageSize < filteredChannels.length,
                  totalPages: Math.ceil(filteredChannels.length / pageSize)
                }}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
