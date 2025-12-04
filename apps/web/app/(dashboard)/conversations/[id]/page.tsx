'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Archive, Trash2 } from 'lucide-react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import axiosClient from '@/lib/axios-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConversationDetails {
  id: string;
  customerName: string;
  customerAvatar?: string;
  channelType: string;
  channelName: string;
  status: string;
}

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const [conversation, setConversation] = useState<ConversationDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConversation();
    }, [conversationId]);

    const loadConversation = async () => {
        try {
            setLoading(true);
            const data = await (await axiosClient.get(`/conversations/${conversationId}`)).data;
            setConversation(data);
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
                role: 'assistant' // Agent/staff messages use 'assistant' role
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

    const handleArchive = async () => {
        try {
            await axiosClient.post(`/conversations/${conversationId}/archive`);
            toast.success('Conversation archived');
            router.push('/conversations');
        } catch (error) {
            toast.error('Failed to archive conversation');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this conversation?')) {
            return;
        }
        try {
            await axiosClient.delete(`/conversations/${conversationId}`);
            toast.success('Conversation deleted');
            router.push('/conversations');
        } catch (error) {
            toast.error('Failed to delete conversation');
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-muted-foreground">Conversation not found</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b px-4 py-3 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/conversations')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.customerAvatar} />
                        <AvatarFallback>
                            {(conversation.customerName || 'User').charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div>
                        <h2 className="font-semibold">{conversation.customerName || 'Unknown User'}</h2>
                        <p className="text-xs text-muted-foreground">
                            {conversation.channelName} • {conversation.channelType}
                        </p>
                    </div>

                    <Badge variant="outline" className={cn(
                        conversation.status === 'open' && 'bg-green-500/10 text-green-500 border-green-500/20',
                        conversation.status === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                        conversation.status === 'closed' && 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    )}>
                        {conversation.status}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Video className="w-5 h-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleArchive}>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
                <ChatInterface
                    conversationId={conversationId}
                    botName={conversation.customerName}
                    onSendMessage={handleSendMessage}
                    onLoadMore={handleLoadMore}
                />
            </div>
        </div>
    );
}
