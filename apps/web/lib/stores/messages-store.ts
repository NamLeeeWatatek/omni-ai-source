import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  conversationId: string;
}

interface MessagesState {
  // Messages grouped by conversation
  messagesByConversation: Record<string, Message[]>;
  
  // Loading states
  loading: Record<string, boolean>;
  loadingMore: Record<string, boolean>;
  
  // Pagination
  hasMore: Record<string, boolean>;
  oldestMessageId: Record<string, string | null>;
  
  // Actions
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  appendMessage: (conversationId: string, message: Message) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  
  setLoading: (conversationId: string, loading: boolean) => void;
  setLoadingMore: (conversationId: string, loading: boolean) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;
  setOldestMessageId: (conversationId: string, messageId: string | null) => void;
  
  clearConversation: (conversationId: string) => void;
  clearAll: () => void;
  
  // Getters
  getMessages: (conversationId: string) => Message[];
  getLastMessage: (conversationId: string) => Message | null;
  isLoading: (conversationId: string) => boolean;
}

export const useMessagesStore = create<MessagesState>()(
  persist(
    immer((set, get) => ({
      messagesByConversation: {},
      loading: {},
      loadingMore: {},
      hasMore: {},
      oldestMessageId: {},

      // Set all messages for a conversation (initial load)
      setMessages: (conversationId, messages) =>
        set((state) => {
          state.messagesByConversation[conversationId] = messages;
          if (messages.length > 0) {
            state.oldestMessageId[conversationId] = messages[0].id;
          }
        }),

      // Prepend older messages (load more)
      prependMessages: (conversationId, messages) =>
        set((state) => {
          const existing = state.messagesByConversation[conversationId] || [];
          state.messagesByConversation[conversationId] = [...messages, ...existing];
          if (messages.length > 0) {
            state.oldestMessageId[conversationId] = messages[0].id;
          }
        }),

      // Append new message (realtime or send)
      appendMessage: (conversationId, message) =>
        set((state) => {
          const existing = state.messagesByConversation[conversationId] || [];
          // Check for duplicates
          if (!existing.find((m) => m.id === message.id)) {
            state.messagesByConversation[conversationId] = [...existing, message];
          }
        }),

      // Remove message (delete or failed send)
      removeMessage: (conversationId, messageId) =>
        set((state) => {
          const existing = state.messagesByConversation[conversationId] || [];
          state.messagesByConversation[conversationId] = existing.filter(
            (m) => m.id !== messageId
          );
        }),

      // Update message (edit, status change)
      updateMessage: (conversationId, messageId, updates) =>
        set((state) => {
          const messages = state.messagesByConversation[conversationId] || [];
          const index = messages.findIndex((m) => m.id === messageId);
          if (index !== -1) {
            state.messagesByConversation[conversationId][index] = {
              ...messages[index],
              ...updates,
            };
          }
        }),

      setLoading: (conversationId, loading) =>
        set((state) => {
          state.loading[conversationId] = loading;
        }),

      setLoadingMore: (conversationId, loading) =>
        set((state) => {
          state.loadingMore[conversationId] = loading;
        }),

      setHasMore: (conversationId, hasMore) =>
        set((state) => {
          state.hasMore[conversationId] = hasMore;
        }),

      setOldestMessageId: (conversationId, messageId) =>
        set((state) => {
          state.oldestMessageId[conversationId] = messageId;
        }),

      clearConversation: (conversationId) =>
        set((state) => {
          delete state.messagesByConversation[conversationId];
          delete state.loading[conversationId];
          delete state.loadingMore[conversationId];
          delete state.hasMore[conversationId];
          delete state.oldestMessageId[conversationId];
        }),

      clearAll: () =>
        set((state) => {
          state.messagesByConversation = {};
          state.loading = {};
          state.loadingMore = {};
          state.hasMore = {};
          state.oldestMessageId = {};
        }),

      // Getters
      getMessages: (conversationId) => {
        return get().messagesByConversation[conversationId] || [];
      },

      getLastMessage: (conversationId) => {
        const messages = get().messagesByConversation[conversationId] || [];
        return messages.length > 0 ? messages[messages.length - 1] : null;
      },

      isLoading: (conversationId) => {
        return get().loading[conversationId] || false;
      },
    })),
    {
      name: 'messages-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist messages, not loading states
      partialize: (state) => ({
        messagesByConversation: Object.fromEntries(
          Object.entries(state.messagesByConversation).map(([id, msgs]) => [
            id,
            msgs.slice(-500), // Keep last 500 messages per conversation
          ])
        ),
        oldestMessageId: state.oldestMessageId,
        hasMore: state.hasMore,
      }),
    }
  )
);
