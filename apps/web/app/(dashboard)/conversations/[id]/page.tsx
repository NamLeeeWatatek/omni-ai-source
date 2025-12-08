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
    contactName: string;      // Match backend field name
    contactAvatar?: string;   // Match backend field name
    channelType: string;
    channelName: string;
    status: string;
    channelId?: string;       // Detect if it's a channel conversation
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
                role: 'assistant'
            });
        } catch (err) {
            toast.error('Failed to send message');
            throw err;
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
        <div style={{ height: 'calc(100vh - 64px)' }} className="flex flex-col">

            <div className="border-b px-3 py-2 flex items-center justify-between bg-background shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => router.push('/conversations')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>

                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={conversation.contactAvatar} />
                        <AvatarFallback className="text-xs">
                            {(conversation.contactName || 'User').charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-sm truncate">{conversation.contactName || 'Unknown User'}</h2>
                    </div>

                    <Badge variant="outline" className={cn(
                        'text-xs h-5 shrink-0',
                        conversation.status === 'open' && 'bg-green-500/10 text-green-500 border-green-500/20',
                        conversation.status === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                        conversation.status === 'closed' && 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    )}>
                        {conversation.status}
                    </Badge>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
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


            <ChatInterface
                conversationId={conversationId}
                customerName={conversation.contactName}
                isChannelConversation={!!conversation.channelType}
                onSendMessage={handleSendMessage}
                senderRole="assistant"
                className="flex-1"
            />
        </div>
    );
}
