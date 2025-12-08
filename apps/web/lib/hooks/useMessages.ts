import { useCallback, useEffect } from 'react';
import { useMessagesStore } from '@/lib/stores/messages-store';
import { axiosClient } from '@/lib/axios-client';
import { toast } from 'sonner';

export function useMessages(conversationId: string) {
  const messages = useMessagesStore((state) => state.getMessages(conversationId));
  const loading = useMessagesStore((state) => state.isLoading(conversationId));
  const loadingMore = useMessagesStore((state) => state.loadingMore[conversationId] || false);
  const hasMore = useMessagesStore((state) => state.hasMore[conversationId] ?? true);
  const oldestMessageId = useMessagesStore((state) => state.oldestMessageId[conversationId]);
  
  const setMessages = useMessagesStore((state) => state.setMessages);
  const prependMessages = useMessagesStore((state) => state.prependMessages);
  const appendMessage = useMessagesStore((state) => state.appendMessage);
  const removeMessage = useMessagesStore((state) => state.removeMessage);
  const setLoading = useMessagesStore((state) => state.setLoading);
  const setLoadingMore = useMessagesStore((state) => state.setLoadingMore);
  const setHasMore = useMessagesStore((state) => state.setHasMore);
  const setOldestMessageId = useMessagesStore((state) => state.setOldestMessageId);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(conversationId, true);

      const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
        params: { limit: 10 }
      });

      const msgs = Array.isArray(response.data) ? response.data : response.data.messages || [];

      const messagesWithConvId = msgs.map((msg: any) => ({
        ...msg,
        conversationId
      }));

      setMessages(conversationId, messagesWithConvId);
      setHasMore(conversationId, msgs.length === 10);

      if (msgs.length > 0) {
        setOldestMessageId(conversationId, msgs[0].id);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      toast.error('Failed to load messages');
      throw err;
    } finally {
      setLoading(conversationId, false);
    }
  }, [conversationId, setLoading, setMessages, setHasMore, setOldestMessageId]);

  // Load more (older) messages
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !oldestMessageId) return;

    try {
      setLoadingMore(conversationId, true);

      const response = await axiosClient.get(`/conversations/${conversationId}/messages`, {
        params: { 
          limit: 10, 
          before: oldestMessageId
        }
      });

      const olderMessages = Array.isArray(response.data) ? response.data : response.data.messages || [];

      if (olderMessages.length === 0) {
        setHasMore(conversationId, false);
      } else {
        const messagesWithConvId = olderMessages.map((msg: any) => ({
          ...msg,
          conversationId
        }));

        prependMessages(conversationId, messagesWithConvId);
        setHasMore(conversationId, olderMessages.length === 10);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
      toast.error('Failed to load more messages');
    } finally {
      setLoadingMore(conversationId, false);
    }
  }, [conversationId, loadingMore, hasMore, oldestMessageId, setLoadingMore, prependMessages, setHasMore]);

  // Send message
  const sendMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user') => {
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      role,
      content,
      conversationId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    appendMessage(conversationId, tempMessage);

    try {
      // This should be replaced with actual API call
      // await axiosClient.post(`/conversations/${conversationId}/messages`, { content, role });
      return tempMessage;
    } catch (err) {
      // Rollback on error
      removeMessage(conversationId, tempId);
      toast.error('Failed to send message');
      throw err;
    }
  }, [conversationId, appendMessage, removeMessage]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    appendMessage: (message: any) => appendMessage(conversationId, { ...message, conversationId }),
    removeMessage: (messageId: string) => removeMessage(conversationId, messageId),
  };
}
