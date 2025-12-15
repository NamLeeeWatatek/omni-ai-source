import { useCallback, useEffect } from 'react';
import { getBotConversationMessages } from '@/lib/api/conversations';
import { useMessagesStore, Message } from '@/lib/stores/messages-store';
import { AxiosError } from 'axios';

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMoreMessages: () => Promise<void>;
  loadInitialMessages: () => Promise<void>;
}

export function useMessages(conversationId: string): UseMessagesReturn {
  const {
    getMessages,
    setMessages,
    prependMessages,
    setLoading,
    setLoadingMore,
    setHasMore,
    setOldestMessageId,
    setError,
  } = useMessagesStore();

  const messages = getMessages(conversationId);
  const loading = useMessagesStore((state) => state.isLoading[conversationId] ?? true);
  const loadingMore = useMessagesStore((state) => state.loadingMore[conversationId] ?? false);
  const hasMore = useMessagesStore((state) => state.hasMore[conversationId] ?? false);
  const oldestMessageId = useMessagesStore((state) => state.oldestMessageId[conversationId]);
  const error = useMessagesStore((state) => state.error[conversationId]);

  const mapApiMessageToMessage = (apiMessage: any): Message => ({
    id: apiMessage.id,
    role: apiMessage.sender === 'user' ? 'user' : 'assistant',
    content: apiMessage.content,
    conversationId: apiMessage.conversationId,
    createdAt: apiMessage.createdAt,
  });

  const loadInitialMessages = useCallback(async () => {
    try {
      setLoading(conversationId, true);
      const response = await getBotConversationMessages(conversationId);

      // Assume messages come in descending order (newest first) from API
      const mappedMessages = response.map(mapApiMessageToMessage);
      setMessages(conversationId, mappedMessages.reverse()); // Reverse to oldest first

      // Set pagination state
      setHasMore(conversationId, mappedMessages.length === 50); // Assuming page size 50
      if (mappedMessages.length > 0) {
        setOldestMessageId(conversationId, mappedMessages[mappedMessages.length - 1].id);
      } else {
        setHasMore(conversationId, false);
      }
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || error.message
        : 'Failed to load messages';
      console.error('Failed to load initial messages:', error);
      setError(conversationId, message);
      setHasMore(conversationId, false);
    } finally {
      setLoading(conversationId, false);
    }
  }, [conversationId, setLoading, setMessages, setHasMore, setOldestMessageId]);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(conversationId, true);

      if (!oldestMessageId) {
        setHasMore(conversationId, false);
        return;
      }

      // For pagination, we'd modify the API call to include before=oldestId
      // But the current API doesn't support this, so we'll simulate
      // In a real scenario, we'd need to extend the API to support pagination
      setHasMore(conversationId, false); // Set to false for now as pagination isn't implemented in API
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(conversationId, false);
    }
  }, [conversationId, loadingMore, hasMore, oldestMessageId, setLoadingMore, setHasMore]);

  useEffect(() => {
    if (!messages.length && !loading) {
      loadInitialMessages();
    }
  }, [conversationId, messages.length, loading, loadInitialMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMoreMessages,
    loadInitialMessages,
  };
}
