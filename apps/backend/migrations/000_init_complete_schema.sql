-- ============================================
-- WataOmi Complete Database Schema - UNIFIED
-- Version: 2.0.0
-- Date: 2024-11-25
-- ============================================
-- This is the SINGLE SOURCE OF TRUTH for database schema
-- Includes ALL migrations consolidated into one file
-- Run: psql -U wataomi -d wataomi -f migrations/000_init_complete_schema.sql
-- Or: python scripts/run_migration.py
-- ============================================

BEGIN;

-- Drop all existing tables (if re-running)
DROP TABLE IF EXISTS archives CASCADE;
DROP TABLE IF EXISTS node_executions CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS channel_connections CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS integration_configs CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
DROP TABLE IF EXISTS agent_configs CASCADE;
DROP TABLE IF EXISTS flow_templates CASCADE;
DROP TABLE IF EXISTS flow_versions CASCADE;
DROP TABLE IF EXISTS flows CASCADE;
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    external_id VARCHAR(255) UNIQUE,  -- Casdoor UUID
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_external_id ON users(external_id);

COMMENT ON TABLE users IS 'User accounts with Casdoor authentication support';
COMMENT ON COLUMN users.external_id IS 'Casdoor user UUID for SSO';

-- Workspaces Table
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);

COMMENT ON TABLE workspaces IS 'Workspaces for organizing bots and team members';

-- Workspace Members Table
CREATE TABLE workspace_members (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);

COMMENT ON TABLE workspace_members IS 'Many-to-many relationship between users and workspaces';

-- ============================================
-- BOTS & FLOWS
-- ============================================

-- Bots Table (with all migrations applied)
CREATE TABLE bots (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    flow_id INTEGER,  -- Will add FK after flows table is created
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bots_workspace_id ON bots(workspace_id);
CREATE INDEX idx_bots_is_active ON bots(is_active);

COMMENT ON TABLE bots IS 'Bot configurations within workspaces';

-- Flows Table (with all migrations applied)
CREATE TABLE flows (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),  -- String to support both int and external_id
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',  -- draft, published, archived
    version INTEGER DEFAULT 1,
    channel_id INTEGER,  -- Will add FK after channels table is created
    template_id INTEGER,  -- Reference to template used
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flows_user_id ON flows(user_id);
CREATE INDEX idx_flows_status ON flows(status);
CREATE INDEX idx_flows_channel_id ON flows(channel_id);
CREATE INDEX idx_flows_template_id ON flows(template_id);

COMMENT ON TABLE flows IS 'Workflow definitions';
COMMENT ON COLUMN flows.channel_id IS 'Optional channel association for flow';
COMMENT ON COLUMN flows.template_id IS 'Reference to template used to create this flow';

-- Add FK from bots to flows
ALTER TABLE bots ADD CONSTRAINT bots_flow_id_fkey 
    FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE SET NULL;
CREATE INDEX idx_bots_flow_id ON bots(flow_id);

-- Flow Versions Table
CREATE TABLE flow_versions (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    flow JSONB NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flow_versions_bot_id ON flow_versions(bot_id);
CREATE INDEX idx_flow_versions_is_published ON flow_versions(is_published);

COMMENT ON TABLE flow_versions IS 'Versioned workflow definitions for bots';

-- Flow Templates Table
CREATE TABLE flow_templates (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),  -- customer-service, sales, automation, marketing
    icon VARCHAR(50),  -- emoji or icon name
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(255) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flow_templates_category ON flow_templates(category);
CREATE INDEX idx_flow_templates_is_public ON flow_templates(is_public);
CREATE INDEX idx_flow_templates_created_by ON flow_templates(created_by);
CREATE INDEX idx_flow_templates_workspace_id ON flow_templates(workspace_id);

COMMENT ON TABLE flow_templates IS 'Reusable flow templates';

-- Add FK from flows to flow_templates
ALTER TABLE flows ADD CONSTRAINT flows_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES flow_templates(id) ON DELETE SET NULL;

-- Agent Configurations Table
CREATE TABLE agent_configs (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
    name VARCHAR(255),
    personality VARCHAR(100),  -- friendly, professional, casual
    tone VARCHAR(100),  -- formal, informal
    language VARCHAR(10) DEFAULT 'en',
    system_prompt TEXT,
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 150,
    model VARCHAR(100) DEFAULT 'gpt-4',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(flow_id)
);

CREATE INDEX idx_agent_configs_flow_id ON agent_configs(flow_id);

COMMENT ON TABLE agent_configs IS 'AI agent configuration per flow';

-- ============================================
-- CHANNELS & CONVERSATIONS
-- ============================================

-- Channels Table
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,  -- whatsapp, facebook, messenger, instagram, telegram, email, webchat
    icon VARCHAR(500),
    color VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_is_active ON channels(is_active);

COMMENT ON TABLE channels IS 'Available communication channels';

-- Add FK from flows to channels
ALTER TABLE flows ADD CONSTRAINT flows_channel_id_fkey 
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL;

-- Channel Connections Table
CREATE TABLE channel_connections (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,  -- String to support both int and external_id
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    config JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',  -- active, disconnected, error
    last_sync_at TIMESTAMP,
    error_message TEXT,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_channel_connections_channel_id ON channel_connections(channel_id);
CREATE INDEX idx_channel_connections_user_id ON channel_connections(user_id);
CREATE INDEX idx_channel_connections_status ON channel_connections(status);

COMMENT ON TABLE channel_connections IS 'User connections to specific channels';

-- Conversations Table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    channel_connection_id INTEGER NOT NULL REFERENCES channel_connections(id) ON DELETE CASCADE,
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_avatar VARCHAR(500),
    customer_meta JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',  -- active, closed, archived
    assigned_to VARCHAR(255),
    bot_id INTEGER REFERENCES bots(id) ON DELETE SET NULL,
    is_bot_active BOOLEAN DEFAULT TRUE,
    last_message_content TEXT,
    last_message_at TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_channel_connection_id ON conversations(channel_connection_id);
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_bot_id ON conversations(bot_id);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

COMMENT ON TABLE conversations IS 'Customer conversations across channels';

-- Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL,  -- customer, bot, agent
    sender_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',  -- text, image, file, audio, video
    attachments JSONB DEFAULT '[]',
    message_meta JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'sent',  -- sent, delivered, read, failed
    external_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_type ON messages(sender_type);
CREATE INDEX idx_messages_external_id ON messages(external_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

COMMENT ON TABLE messages IS 'Individual messages within conversations';

-- ============================================
-- INTEGRATIONS & MEDIA
-- ============================================

-- Integration Configs Table
CREATE TABLE integration_configs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,  -- String to support both int and external_id
    provider VARCHAR(100) NOT NULL,  -- facebook, google, instagram, whatsapp, telegram
    client_id VARCHAR(500) NOT NULL,
    client_secret VARCHAR(500) NOT NULL,
    scopes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_integration_configs_user_id ON integration_configs(user_id);
CREATE INDEX idx_integration_configs_provider ON integration_configs(provider);

COMMENT ON TABLE integration_configs IS 'OAuth and API configurations per user';

-- Media Assets Table
CREATE TABLE media_assets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    public_id VARCHAR(255) UNIQUE NOT NULL,
    url VARCHAR(500) NOT NULL,
    secure_url VARCHAR(500) NOT NULL,
    resource_type VARCHAR(50),  -- image, video, raw
    format VARCHAR(50),
    width INTEGER,
    height INTEGER,
    bytes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX idx_media_assets_public_id ON media_assets(public_id);

COMMENT ON TABLE media_assets IS 'Cloudinary media asset tracking';

-- ============================================
-- WORKFLOW EXECUTIONS (with fixed FK)
-- ============================================

-- Workflow Executions Table
CREATE TABLE workflow_executions (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER NOT NULL REFERENCES flows(id) ON DELETE CASCADE,  -- Fixed: was flow_version_id
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'running',  -- running, completed, failed, cancelled
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    error_message TEXT,
    total_nodes INTEGER DEFAULT 0,
    completed_nodes INTEGER DEFAULT 0,
    duration_ms INTEGER,
    success_rate FLOAT
);

CREATE INDEX idx_workflow_executions_flow_id ON workflow_executions(flow_id);
CREATE INDEX idx_workflow_executions_conversation_id ON workflow_executions(conversation_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

COMMENT ON TABLE workflow_executions IS 'Execution instances of workflows';

-- Node Executions Table
CREATE TABLE node_executions (
    id SERIAL PRIMARY KEY,
    workflow_execution_id INTEGER NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    node_label VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed, skipped
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_ms INTEGER,
    input_data JSONB DEFAULT '{}',
    output_data JSONB,
    error_message TEXT
);

CREATE INDEX idx_node_executions_workflow_execution_id ON node_executions(workflow_execution_id);
CREATE INDEX idx_node_executions_status ON node_executions(status);
CREATE INDEX idx_node_executions_node_type ON node_executions(node_type);

COMMENT ON TABLE node_executions IS 'Individual node executions within workflow runs';

-- ============================================
-- ARCHIVES (Generic soft-delete system)
-- ============================================

CREATE TABLE archives (
    id SERIAL PRIMARY KEY,
    
    -- Polymorphic fields
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    
    -- Entity data snapshot
    entity_data JSONB NOT NULL DEFAULT '{}',
    
    -- Archive metadata
    archived_by VARCHAR(255),
    archived_at TIMESTAMP NOT NULL DEFAULT NOW(),
    archive_reason TEXT,
    
    -- Restore tracking
    restored_at TIMESTAMP,
    restored_by VARCHAR(255),
    is_restored BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT archives_entity_unique UNIQUE (entity_type, entity_id, archived_at)
);

CREATE INDEX idx_archives_entity_type ON archives(entity_type);
CREATE INDEX idx_archives_entity_id ON archives(entity_id);
CREATE INDEX idx_archives_is_restored ON archives(is_restored);
CREATE INDEX idx_archives_archived_at ON archives(archived_at DESC);

COMMENT ON TABLE archives IS 'Generic archive system for soft-delete functionality';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at BEFORE UPDATE ON flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_versions_updated_at BEFORE UPDATE ON flow_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_templates_updated_at BEFORE UPDATE ON flow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_connections_updated_at BEFORE UPDATE ON channel_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_configs_updated_at BEFORE UPDATE ON integration_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default channels
INSERT INTO channels (name, type, color, description, is_active) VALUES
    ('WhatsApp', 'whatsapp', '#25D366', 'WhatsApp Business API', TRUE),
    ('Facebook', 'facebook', '#1877F2', 'Facebook Pages', TRUE),
    ('Messenger', 'messenger', '#0084FF', 'Facebook Messenger', TRUE),
    ('Instagram', 'instagram', '#E4405F', 'Instagram Direct Messages', TRUE),
    ('Telegram', 'telegram', '#0088CC', 'Telegram Bot API', TRUE),
    ('Email', 'email', '#EA4335', 'Email Integration', TRUE),
    ('Web Chat', 'webchat', '#8B5CF6', 'Website Chat Widget', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant all privileges on all tables to wataomi user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wataomi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wataomi;
GRANT ALL PRIVILEGES ON DATABASE wataomi TO wataomi;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO wataomi;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wataomi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wataomi;

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show table counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL SELECT 'bots', COUNT(*) FROM bots
UNION ALL SELECT 'flows', COUNT(*) FROM flows
UNION ALL SELECT 'channels', COUNT(*) FROM channels
UNION ALL SELECT 'flow_templates', COUNT(*) FROM flow_templates
UNION ALL SELECT 'archives', COUNT(*) FROM archives
ORDER BY table_name;

-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Show all indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

