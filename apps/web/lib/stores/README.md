# Zustand Messages Store

## 📦 Features

- ✅ **Cursor-based pagination** - Load messages using `before_id`
- ✅ **LocalStorage persistence** - Cache last 500 messages per conversation
- ✅ **Optimistic updates** - Instant UI feedback
- ✅ **Duplicate prevention** - Auto-dedup messages
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Immer integration** - Immutable updates made easy

## 🚀 Usage

### Option 1: Direct Store Access

```typescript
import { useMessagesStore } from '@/lib/stores/messages-store';

function ChatComponent({ conversationId }: { conversationId: string }) {
  const messages = useMessagesStore((state) => state.getMessages(conversationId));
  const appendMessage = useMessagesStore((state) => state.appendMessage);
  
  const handleSend = (content: string) => {
    appendMessage(conversationId, {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      conversationId,
      createdAt: new Date().toISOString()
    });
  };
  
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

### Option 2: Custom Hook (Recommended)

```typescript
import { useMessages } from '@/lib/hooks/useMessages';

function ChatComponent({ conversationId }: { conversationId: string }) {
  const { 
    messages, 
    loading, 
    loadingMore,
    hasMore,
    loadMessages, 
    loadMoreMessages,
    sendMessage 
  } = useMessages(conversationId);
  
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);
  
  return (
    <div>
      {loadingMore && <div>Loading more...</div>}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {hasMore && <button onClick={loadMoreMessages}>Load More</button>}
    </div>
  );
}
```

## 🎯 Store Actions

### Read Actions
- `getMessages(conversationId)` - Get all messages for a conversation
- `getLastMessage(conversationId)` - Get the last message
- `isLoading(conversationId)` - Check if loading

### Write Actions
- `setMessages(conversationId, messages)` - Set all messages (initial load)
- `prependMessages(conversationId, messages)` - Add older messages (load more)
- `appendMessage(conversationId, message)` - Add new message (realtime/send)
- `removeMessage(conversationId, messageId)` - Remove message (delete/failed)
- `updateMessage(conversationId, messageId, updates)` - Update message

### State Actions
- `setLoading(conversationId, loading)` - Set loading state
- `setLoadingMore(conversationId, loading)` - Set load more state
- `setHasMore(conversationId, hasMore)` - Set has more flag
- `setOldestMessageId(conversationId, messageId)` - Set oldest message ID

### Cleanup Actions
- `clearConversation(conversationId)` - Clear one conversation
- `clearAll()` - Clear all conversations

## 💾 Persistence

Messages are automatically persisted to localStorage:
- **Key**: `messages-storage`
- **Limit**: Last 500 messages per conversation
- **Excludes**: Loading states (only data is persisted)

## 🔄 WebSocket Integration

```typescript
const { joinConversation } = useConversationsSocket({
  onNewMessage: useCallback((message) => {
    if (message.conversationId === conversationId) {
      appendMessage(conversationId, {
        id: message.id,
        role: message.role,
        content: message.content,
        conversationId: message.conversationId,
        createdAt: message.sentAt || message.createdAt
      });
    }
  }, [conversationId, appendMessage])
});
```

## 🎨 Benefits vs Redux

| Feature | Zustand | Redux |
|---------|---------|-------|
| Bundle size | ~1KB | ~10KB |
| Boilerplate | Minimal | Heavy |
| TypeScript | Native | Requires setup |
| DevTools | Built-in | Requires extension |
| Persistence | Built-in | Requires redux-persist |
| Learning curve | Easy | Steep |
| Performance | Excellent | Good |

## 📊 Performance Tips

1. **Selector optimization** - Use specific selectors
```typescript
// ❌ Bad - Re-renders on any store change
const store = useMessagesStore();

// ✅ Good - Only re-renders when messages change
const messages = useMessagesStore((state) => state.getMessages(conversationId));
```

2. **Memoize callbacks**
```typescript
const appendMessage = useMessagesStore((state) => state.appendMessage);
const handleSend = useCallback((content) => {
  appendMessage(conversationId, { ... });
}, [conversationId, appendMessage]);
```

3. **Virtual scrolling** - For 100+ messages
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
// See chat-interface.tsx for implementation
```
