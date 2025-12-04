import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWidgetVersioningTables1733235000000
    implements MigrationInterface
{
    name = 'CreateWidgetVersioningTables1733235000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "widget_version" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "bot_id" UUID NOT NULL,
                "version" VARCHAR(20) NOT NULL,
                "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
                "is_active" BOOLEAN NOT NULL DEFAULT false,
                "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
                "published_at" TIMESTAMP,
                "published_by" UUID,
                "cdn_url" VARCHAR(500),
                "changelog" TEXT,
                "notes" TEXT,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                
                CONSTRAINT "fk_widget_version_bot" 
                    FOREIGN KEY ("bot_id") 
                    REFERENCES "bot"("id") 
                    ON DELETE CASCADE,
                    
                CONSTRAINT "fk_widget_version_published_by" 
                    FOREIGN KEY ("published_by") 
                    REFERENCES "user"("id") 
                    ON DELETE SET NULL,
                    
                CONSTRAINT "uq_widget_version_bot_version" 
                    UNIQUE ("bot_id", "version")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_version_bot_id" 
            ON "widget_version"("bot_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_version_status" 
            ON "widget_version"("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_version_active" 
            ON "widget_version"("bot_id", "is_active") 
            WHERE "is_active" = true
        `);

        await queryRunner.query(`
            CREATE TABLE "widget_deployment" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "bot_id" UUID NOT NULL,
                "widget_version_id" UUID NOT NULL,
                "deployed_by" UUID,
                "deployed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                "deployment_type" VARCHAR(20) NOT NULL,
                "previous_version_id" UUID,
                "rollback_reason" TEXT,
                "traffic_percentage" INT NOT NULL DEFAULT 100,
                "status" VARCHAR(20) NOT NULL,
                "metadata" JSONB,
                
                CONSTRAINT "fk_widget_deployment_bot" 
                    FOREIGN KEY ("bot_id") 
                    REFERENCES "bot"("id") 
                    ON DELETE CASCADE,
                    
                CONSTRAINT "fk_widget_deployment_version" 
                    FOREIGN KEY ("widget_version_id") 
                    REFERENCES "widget_version"("id") 
                    ON DELETE CASCADE,
                    
                CONSTRAINT "fk_widget_deployment_deployed_by" 
                    FOREIGN KEY ("deployed_by") 
                    REFERENCES "user"("id") 
                    ON DELETE SET NULL,
                    
                CONSTRAINT "fk_widget_deployment_previous_version" 
                    FOREIGN KEY ("previous_version_id") 
                    REFERENCES "widget_version"("id") 
                    ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_deployment_bot" 
            ON "widget_deployment"("bot_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_deployment_version" 
            ON "widget_deployment"("widget_version_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_deployment_deployed_at" 
            ON "widget_deployment"("deployed_at" DESC)
        `);

        await queryRunner.query(`
            CREATE TABLE "widget_analytics" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "bot_id" UUID NOT NULL,
                "widget_version_id" UUID NOT NULL,
                "event_type" VARCHAR(50) NOT NULL,
                "domain" VARCHAR(255),
                "user_agent" TEXT,
                "ip_address" VARCHAR(45),
                "country_code" VARCHAR(2),
                "load_time_ms" INT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
                
                CONSTRAINT "fk_widget_analytics_bot" 
                    FOREIGN KEY ("bot_id") 
                    REFERENCES "bot"("id") 
                    ON DELETE CASCADE,
                    
                CONSTRAINT "fk_widget_analytics_version" 
                    FOREIGN KEY ("widget_version_id") 
                    REFERENCES "widget_version"("id") 
                    ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_analytics_bot" 
            ON "widget_analytics"("bot_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_analytics_version" 
            ON "widget_analytics"("widget_version_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_analytics_event" 
            ON "widget_analytics"("event_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_widget_analytics_created" 
            ON "widget_analytics"("created_at")
        `);

        await queryRunner.query(`
            INSERT INTO "widget_version" (
                "bot_id",
                "version",
                "status",
                "is_active",
                "config",
                "published_at",
                "changelog"
            )
            SELECT 
                "id" as "bot_id",
                '1.0.0' as "version",
                'published' as "status",
                "widget_enabled" as "is_active",
                COALESCE(
                    "widget_config",
                    '{
                        "theme": {
                            "primaryColor": "#667eea",
                            "position": "bottom-right",
                            "buttonSize": "medium",
                            "showAvatar": true,
                            "showTimestamp": true
                        },
                        "behavior": {
                            "autoOpen": false,
                            "autoOpenDelay": 0,
                            "greetingDelay": 2
                        },
                        "messages": {
                            "welcome": "Xin chào! Tôi có thể giúp gì cho bạn?",
                            "placeholder": "Nhập tin nhắn...",
                            "offline": "Chúng tôi hiện đang offline",
                            "errorMessage": "Đã có lỗi xảy ra. Vui lòng thử lại."
                        },
                        "features": {
                            "fileUpload": false,
                            "voiceInput": false,
                            "markdown": true,
                            "quickReplies": true
                        },
                        "branding": {
                            "showPoweredBy": true
                        },
                        "security": {
                            "allowedOrigins": ["*"]
                        }
                    }'::jsonb
                ) as "config",
                "created_at" as "published_at",
                'Migrated from bot.widget_config' as "changelog"
            FROM "bot"
            WHERE "widget_enabled" = true
        `);

        await queryRunner.query(`
            INSERT INTO "widget_deployment" (
                "bot_id",
                "widget_version_id",
                "deployment_type",
                "status",
                "metadata"
            )
            SELECT 
                wv."bot_id",
                wv."id" as "widget_version_id",
                'publish' as "deployment_type",
                'deployed' as "status",
                '{"migrated": true}'::jsonb as "metadata"
            FROM "widget_version" wv
            WHERE wv."version" = '1.0.0'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "widget_analytics"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "widget_deployment"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "widget_version"`);
    }
}
