import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWidgetSettings1733155200000 implements MigrationInterface {
    name = 'AddWidgetSettings1733155200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "bot" 
      ADD COLUMN IF NOT EXISTS "allowed_origins" jsonb DEFAULT '["*"]',
      ADD COLUMN IF NOT EXISTS "welcome_message" varchar,
      ADD COLUMN IF NOT EXISTS "placeholder_text" varchar,
      ADD COLUMN IF NOT EXISTS "primary_color" varchar DEFAULT '#3B82F6',
      ADD COLUMN IF NOT EXISTS "widget_position" varchar DEFAULT 'bottom-right',
      ADD COLUMN IF NOT EXISTS "widget_button_size" varchar DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS "show_avatar" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "show_timestamp" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "widget_enabled" boolean DEFAULT true
    `);

        await queryRunner.query(`
      COMMENT ON COLUMN "bot"."allowed_origins" IS 'List of allowed origins for CORS (e.g., ["https://example.com", "*"])';
      COMMENT ON COLUMN "bot"."welcome_message" IS 'Welcome message displayed when widget opens';
      COMMENT ON COLUMN "bot"."placeholder_text" IS 'Placeholder text for message input';
      COMMENT ON COLUMN "bot"."primary_color" IS 'Primary color for widget theme (hex color)';
      COMMENT ON COLUMN "bot"."widget_position" IS 'Widget position: bottom-right, bottom-left, top-right, top-left';
      COMMENT ON COLUMN "bot"."widget_button_size" IS 'Widget button size: small, medium, large';
      COMMENT ON COLUMN "bot"."show_avatar" IS 'Show bot avatar in widget';
      COMMENT ON COLUMN "bot"."show_timestamp" IS 'Show message timestamps in widget';
      COMMENT ON COLUMN "bot"."widget_enabled" IS 'Enable/disable widget for this bot';
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "bot" 
      DROP COLUMN IF EXISTS "allowed_origins",
      DROP COLUMN IF EXISTS "welcome_message",
      DROP COLUMN IF EXISTS "placeholder_text",
      DROP COLUMN IF EXISTS "primary_color",
      DROP COLUMN IF EXISTS "widget_position",
      DROP COLUMN IF EXISTS "widget_button_size",
      DROP COLUMN IF EXISTS "show_avatar",
      DROP COLUMN IF EXISTS "show_timestamp",
      DROP COLUMN IF EXISTS "widget_enabled"
    `);
    }
}
