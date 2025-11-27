-- Add AI Conversations tables
-- Run: psql -U wataomi -d wataomi -f migrations/add_ai_conversations.sql

BEGIN;

-- AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    model VARCHAR(100) DEFAULT 'gemini-pro',
    user_id VARCHAR(255) NOT NULL,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);

-- AI Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    model VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at ASC);

COMMIT;
