'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
}

interface UseChatOptions {
    conversationId: string;
    onMessageReceived?: (message: Message) => void;
}

export function useChat({ conversationId, onMessageReceived }: UseChatOptions) {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken;

    const [sending, setSending] = useState(false);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!token) {
                throw new Error('Not authenticated');
            }

            setSending(true);
            try {
                const response = await fetch(
                    `${API_BASE}/conversations/${conversationId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ content }),
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }

                const data = await response.json();
                
                if (onMessageReceived && data.message) {
                    onMessageReceived(data.message);
                }

                return data;
            } finally {
                setSending(false);
            }
        },
        [conversationId, token, onMessageReceived]
    );

    const loadMoreMessages = useCallback(
        async (before: string): Promise<Message[]> => {
            if (!token) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(
                `${API_BASE}/conversations/${conversationId}/messages?limit=50&before=${before}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const data = await response.json();
            return Array.isArray(data) ? data : data.messages || [];
        },
        [conversationId, token]
    );

    return {
        sendMessage,
        loadMoreMessages,
        sending,
    };
}
