import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  conversationId: string;
  createdAt: string;
}

interface MessagesState {
  // Messages per conversation
  messages: Record<string, Message[]>;

  // Loading states
  isLoading: Record<string, boolean>;
  loadingMore: Record<string, boolean>;

  // State management
  hasMore: Record<string, boolean>;
  oldestMessageId: Record<string, string>;
  error: Record<string, string>;

  // Actions
  getMessages: (conversationId: string) => Message[];
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  appendMessage: (conversationId: string, message: Message) => void;
  removeMessage: (conversationId: string, messageId: string) => void;

  setLoading: (conversationId: string, loading: boolean) => void;
  setLoadingMore: (conversationId: string, loading: boolean) => void;
  setHasMore: (conversationId: string, hasMore: boolean) => void;
  setOldestMessageId: (conversationId: string, id: string) => void;
  setError: (conversationId: string, error: string) => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: {},
  isLoading: {},
  loadingMore: {},
  hasMore: {},
  oldestMessageId: {},
  error: {},

  getMessages: (conversationId: string) => {
    return get().messages[conversationId] || [];
  },

  setMessages: (conversationId: string, messages: Message[]) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },

  prependMessages: (conversationId: string, messages: Message[]) => {
    set((state) => {
      const currentMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...messages, ...currentMessages],
        },
      };
    });
  },

  appendMessage: (conversationId: string, message: Message) => {
    set((state) => {
      const currentMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentMessages, message],
        },
      };
    });
  },

  removeMessage: (conversationId: string, messageId: string) => {
    set((state) => {
      const currentMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: currentMessages.filter((msg) => msg.id !== messageId),
        },
      };
    });
  },

  setLoading: (conversationId: string, loading: boolean) => {
    set((state) => ({
      isLoading: {
        ...state.isLoading,
        [conversationId]: loading,
      },
    }));
  },

  setLoadingMore: (conversationId: string, loading: boolean) => {
    set((state) => ({
      loadingMore: {
        ...state.loadingMore,
        [conversationId]: loading,
      },
    }));
  },

  setHasMore: (conversationId: string, hasMore: boolean) => {
    set((state) => ({
      hasMore: {
        ...state.hasMore,
        [conversationId]: hasMore,
      },
    }));
  },

  setOldestMessageId: (conversationId: string, id: string) => {
    set((state) => ({
      oldestMessageId: {
        ...state.oldestMessageId,
        [conversationId]: id,
      },
    }));
  },

  setError: (conversationId: string, error: string) => {
    set((state) => ({
      error: {
        ...state.error,
        [conversationId]: error,
      },
    }));
  },
}));
