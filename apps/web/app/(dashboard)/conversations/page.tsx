'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationsSocket } from '@/lib/hooks/useConversationsSocket';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Archive,
  Trash2,
  Inbox,
  Users,
  Hash,
  ChevronRight
} from 'lucide-react';
import { 
  FiFacebook, 
  FiInstagram, 
  FiMail,
  FiMessageCircle 
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { ChatInterface } from '@/components/chat/chat-interface';
import axiosClient from '@/lib/axios-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  externalId: string;
  channelId: string;
  channelType: string;
  channelName: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'open' | 'pending' | 'closed';
  assignedTo?: string;
  metadata?: any;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  icon: JSX.Element;
  color: string;
  unreadCount: number;
}

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const selectedId = searchParams.get('id');

  const handleConversationUpdate = useCallback((updatedConversation: any) => {
    
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === updatedConversation.id);
      
      if (exists) {
        return prev.map((c) =>
          c.id === updatedConversation.id
            ? {
                ...c,
                ...mapConversation(updatedConversation),
                lastMessageAt: updatedConversation.lastMessageAt || c.lastMessageAt,
              }
            : c
        ).sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      } else {
        return [mapConversation(updatedConversation), ...prev];
      }
    });
    
    toast.success('New message received!', { duration: 2000 });
  }, []);

  const handleNewMessage = useCallback((message: any) => {
  }, []);

  const { isConnected } = useConversationsSocket({
    onConversationUpdate: handleConversationUpdate,
    onNewMessage: handleNewMessage,
    enabled: true,
  });

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadConversations(false);
    
    const interval = setInterval(() => {
      if (!isConnected) {
        loadConversations(true);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter, selectedChannel, channels, isConnected]);

  const loadChannels = async () => {
    try {
      setChannelsLoading(true);
      const data = await axiosClient.get('/channels').then(r => r.data);
      
      const mappedChannels: Channel[] = (data?.items || data || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name || channel.channelName || 'Unknown',
        type: channel.type || channel.channelType || 'unknown',
        icon: getChannelIcon(channel.type || channel.channelType || 'unknown'),
        color: getChannelColor(channel.type || channel.channelType || 'unknown'),
        unreadCount: 0,
      }));
      
      setChannels(mappedChannels);
    } catch (error) {
      toast.error('Failed to load channels');
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  };

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const params = new URLSearchParams();
      
      params.set('source', 'channel');
      
      if (selectedChannel !== 'all') {
        const channel = channels.find(c => c.id === selectedChannel);
        if (channel) {
          params.set('channelType', channel.type);
        }
      }
      
      console.log('[Loading Conversations]', {
        statusFilter,
        selectedChannel,
        params: params.toString(),
      });
      
      const data = await (await axiosClient.get(`/conversations?${params.toString()}`)).data;
      
      let rawConversations: any[] = [];
      if (Array.isArray(data)) {
        rawConversations = data;
      } else if (data?.items && Array.isArray(data.items)) {
        rawConversations = data.items;
      } else if (data?.conversations && Array.isArray(data.conversations)) {
        rawConversations = data.conversations;
      } else if (data?.data && Array.isArray(data.data)) {
        rawConversations = data.data;
      }
      
      const mappedConversations = rawConversations.map(mapConversation);
      
      console.log('[Conversations Loaded]', {
        total: data?.total || rawConversations.length,
        loaded: mappedConversations.length,
        conversations: mappedConversations,
      });
      
      setConversations(mappedConversations);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load conversations');
      }
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const mapConversation = (conv: any): Conversation => {
    let lastMessage = 'No messages yet';
    if (conv.metadata?.lastMessage) {
      lastMessage = conv.metadata.lastMessage;
    } else if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1];
      lastMessage = lastMsg.content || lastMsg.text || 'No messages yet';
    }

    return {
      id: conv.id,
      externalId: conv.externalId || conv.external_id || '',
      channelId: conv.channelId || conv.channel_id || '',
      channelType: conv.channelType || conv.channel_type || 'web',
      channelName: conv.channelName || conv.channel_name || conv.channelType || 'Unknown',
      customerName: conv.customerName || conv.contactName || conv.contact_name || 'Unknown',
      customerAvatar: conv.customerAvatar || conv.contactAvatar || conv.contact_avatar,
      lastMessage,
      lastMessageAt: conv.lastMessageAt || conv.last_message_at || new Date().toISOString(),
      unreadCount: conv.unreadCount || conv.unread_count || 0,
      status: conv.status === 'active' ? 'open' : conv.status || 'open',
      assignedTo: conv.assignedTo || conv.assigned_to,
      metadata: conv.metadata || {},
    };
  };

  const getChannelIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      facebook: <FiFacebook className="w-4 h-4" />,
      messenger: <FaFacebookMessenger className="w-4 h-4" />,
      instagram: <FiInstagram className="w-4 h-4" />,
      whatsapp: <FaWhatsapp className="w-4 h-4" />,
      telegram: <FaTelegram className="w-4 h-4" />,
      email: <FiMail className="w-4 h-4" />,
      webchat: <FiMessageCircle className="w-4 h-4" />,
    };
    return icons[type] || <MessageSquare className="w-4 h-4" />;
  };

  const getChannelColor = (type: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-500',
      messenger: 'text-blue-500',
      instagram: 'text-pink-500',
      whatsapp: 'text-green-500',
      telegram: 'text-sky-500',
      email: 'text-red-500',
      webchat: 'text-cyan-500',
    };
    return colors[type] || 'text-gray-500';
  };

  const filteredConversations = Array.isArray(conversations) 
    ? conversations.filter(conv =>
        conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectConversation = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  const channelsWithCounts = channels.map(channel => ({
    ...channel,
    unreadCount: conversations.filter(
      conv => conv.channelType === channel.type && conv.unreadCount > 0
    ).length,
  }));

  const totalUnread = conversations.filter(conv => conv.unreadCount > 0).length;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {}
      <div className="w-72 border-r border-border/50 flex flex-col bg-card/30">
        {}
        <div className="px-6 py-5 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">Channels</h2>
          <p className="text-xs text-muted-foreground mt-1">Select a channel to view messages</p>
        </div>

        {}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {}
            <button
              onClick={() => setSelectedChannel('all')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
                selectedChannel === 'all'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'hover:bg-muted/60 text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  selectedChannel === 'all' ? 'bg-primary-foreground/20' : 'bg-primary/10'
                )}>
                  <Inbox className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">All Messages</span>
              </div>
              {totalUnread > 0 && (
                <Badge 
                  variant={selectedChannel === 'all' ? 'secondary' : 'default'} 
                  className="h-6 min-w-[24px] px-2 rounded-full"
                >
                  {totalUnread}
                </Badge>
              )}
            </button>

            {}
            <div className="py-3 px-4">
              <div className="h-px bg-border/50" />
            </div>

            {channelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="w-6 h-6" />
              </div>
            ) : channelsWithCounts.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Hash className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No channels yet</p>
                <p className="text-xs text-muted-foreground">Connect a channel to get started</p>
              </div>
            ) : (
              channelsWithCounts.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group',
                    selectedChannel === channel.id
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'hover:bg-muted/60 text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0',
                      selectedChannel === channel.id
                        ? 'bg-primary-foreground/20'
                        : 'bg-muted'
                    )}>
                      <div className={selectedChannel === channel.id ? 'text-primary-foreground' : channel.color}>
                        {channel.icon}
                      </div>
                    </div>
                    <span className="font-medium text-sm truncate">{channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <Badge 
                      variant={selectedChannel === channel.id ? 'secondary' : 'default'} 
                      className="h-6 min-w-[24px] px-2 rounded-full shrink-0 ml-2"
                    >
                      {channel.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {}
        <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Conversations</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{conversations.length}</span>
          </div>
        </div>
      </div>

      {}
      <div className="w-[420px] border-r border-border/50 flex flex-col bg-background">
        {}
        <div className="px-6 py-5 border-b border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">
                  {selectedChannel === 'all' 
                    ? 'All Messages' 
                    : channels.find(c => c.id === selectedChannel)?.name || 'Messages'}
                </h1>
                {}
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                )} title={isConnected ? 'Connected (Real-time)' : 'Disconnected'} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span>{filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}</span>
                {isConnected && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    <span>Real-time updates active</span>
                  </>
                )}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => loadConversations(false)} 
              className="h-9 w-9"
              disabled={loading || refreshing}
            >
              <Filter className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            </Button>
          </div>

          {}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/50 border-border/50"
            />
          </div>

          {}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-9 bg-muted/50">
              <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
              <TabsTrigger value="closed" className="text-xs">Closed</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-20"
              >
                <Spinner className="w-6 h-6" />
              </motion.div>
            ) : filteredConversations.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base mb-2">No conversations yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {selectedChannel === 'all' 
                    ? 'Conversations from your channels will appear here'
                    : `No conversations from ${channels.find(c => c.id === selectedChannel)?.name || 'this channel'} yet`}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-border/50"
              >
                {filteredConversations.map((conv, index) => (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      'w-full px-4 py-4 text-left transition-all duration-200 relative group',
                      selectedId === conv.id 
                        ? 'bg-primary/5 border-l-4 border-primary' 
                        : 'hover:bg-muted/40 border-l-4 border-transparent'
                    )}
                  >
                    <div className="flex gap-3.5">
                      {}
                      <div className="relative shrink-0">
                        <Avatar className="h-11 w-11 ring-2 ring-background">
                          <AvatarImage src={conv.customerAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold">
                            {(conv.customerName || 'User').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {}
                        <div className={cn(
                          'absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-background border-2 border-background shadow-sm',
                          getChannelColor(conv.channelType)
                        )}>
                          {getChannelIcon(conv.channelType)}
                        </div>
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1.5">
                          <h3 className="font-semibold text-sm truncate text-foreground">
                            {conv.customerName}
                          </h3>
                          <span className="text-xs text-muted-foreground shrink-0 ml-3">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground truncate mb-2.5 leading-relaxed">
                          {conv.lastMessage}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={conv.status} />
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="h-5 px-2 bg-primary rounded-full">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>

      {}
      <div className="flex-1 flex flex-col bg-muted/10">
        {selectedId ? (
          <ConversationChat conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Select a conversation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a conversation from the list to view messages and reply to your customers
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    open: { 
      icon: Circle, 
      label: 'Open', 
      className: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400' 
    },
    pending: { 
      icon: Clock, 
      label: 'Pending', 
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-400' 
    },
    closed: { 
      icon: CheckCircle2, 
      label: 'Closed', 
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400' 
    },
  };

  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.open;

  return (
    <Badge variant="outline" className={cn('h-6 px-2.5 gap-1.5 rounded-full', className)}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString();
}

function ConversationChat({ 
  conversationId
}: { 
  conversationId: string;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const data = await (await axiosClient.get(`/conversations/${conversationId}`)).data;
      
      const mappedConversation = {
        id: data.id,
        externalId: data.externalId || data.external_id || '',
        channelId: data.channelId || data.channel_id || '',
        channelType: data.channelType || data.channel_type || 'web',
        channelName: data.channelName || data.channel_name || data.channelType || 'Unknown',
        customerName: data.customerName || data.contactName || data.contact_name || 'Unknown',
        customerAvatar: data.customerAvatar || data.contactAvatar || data.contact_avatar,
        lastMessage: data.metadata?.lastMessage || 'No messages yet',
        lastMessageAt: data.lastMessageAt || data.last_message_at || new Date().toISOString(),
        unreadCount: data.unreadCount || data.unread_count || 0,
        status: data.status === 'active' ? 'open' : data.status || 'open',
        assignedTo: data.assignedTo || data.assigned_to,
        metadata: data.metadata || {},
      };
      
      setConversation(mappedConversation);
    } catch (error) {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await axiosClient.post(`/conversations/${conversationId}/messages`, { 
        content, 
        sender: 'agent' 
      });
    } catch (err) {
      toast.error('Failed to send message');
      throw err;
    }
  };

  const handleLoadMore = async (before: string) => {
    try {
      const response = await axiosClient.get(
        `/conversations/${conversationId}/messages?before=${before}&limit=50`
      );
      const data = response.data || response;
      return Array.isArray(data) ? data : data.messages || [];
    } catch (error) {
      toast.error('Failed to load more messages');
      return [];
    }
  };

  const getChannelIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      facebook: <FiFacebook className="w-5 h-5" />,
      messenger: <FaFacebookMessenger className="w-5 h-5" />,
      instagram: <FiInstagram className="w-5 h-5" />,
      whatsapp: <FaWhatsapp className="w-5 h-5" />,
      telegram: <FaTelegram className="w-5 h-5" />,
      email: <FiMail className="w-5 h-5" />,
      webchat: <FiMessageCircle className="w-5 h-5" />,
    };
    return icons[type] || <MessageSquare className="w-5 h-5" />;
  };

  const getChannelColor = (type: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-500 bg-blue-500/10',
      messenger: 'text-blue-500 bg-blue-500/10',
      instagram: 'text-pink-500 bg-pink-500/10',
      whatsapp: 'text-green-500 bg-green-500/10',
      telegram: 'text-sky-500 bg-sky-500/10',
      email: 'text-red-500 bg-red-500/10',
      webchat: 'text-cyan-500 bg-cyan-500/10',
    };
    return colors[type] || 'text-gray-500 bg-gray-500/10';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <>
      {}
      <div className="border-b border-border/50 px-6 py-4 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
              <AvatarImage src={conversation.customerAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-semibold">
                {(conversation.customerName || 'User').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="font-semibold text-base text-foreground">{conversation.customerName}</h2>
                <div className={cn('p-1.5 rounded-lg shadow-sm', getChannelColor(conversation.channelType))}>
                  {getChannelIcon(conversation.channelType)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {conversation.channelName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={conversation.status} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-hidden bg-background">
        <ChatInterface
          conversationId={conversationId}
          botName={conversation.customerName}
          onSendMessage={handleSendMessage}
          onLoadMore={handleLoadMore}
        />
      </div>
    </>
  );
}
