-- Add icon column to bots table
-- Migration: add_bot_icon
-- Date: 2025-11-28

ALTER TABLE bots 
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'FiMessageSquare';

-- Update existing bots to have default icon
UPDATE bots 
SET icon = 'FiMessageSquare' 
WHERE icon IS NULL;

-- Add comment
COMMENT ON COLUMN bots.icon IS 'Icon name from react-icons library (e.g., FiMessageSquare, FiZap)';
