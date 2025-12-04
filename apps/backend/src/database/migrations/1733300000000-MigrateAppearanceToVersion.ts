import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateAppearanceToVersion1733300000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE widget_version wv
            SET config = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        COALESCE(wv.config, '{}'::jsonb),
                                        '{theme,primaryColor}',
                                        to_jsonb(COALESCE(b.primary_color, '#667eea'))
                                    ),
                                    '{theme,position}',
                                    to_jsonb(COALESCE(b.widget_position, 'bottom-right'))
                                ),
                                '{theme,buttonSize}',
                                to_jsonb(COALESCE(b.widget_button_size, 'medium'))
                            ),
                            '{theme,showAvatar}',
                            to_jsonb(COALESCE(b.show_avatar, true))
                        ),
                        '{theme,showTimestamp}',
                        to_jsonb(COALESCE(b.show_timestamp, true))
                    ),
                    '{messages,welcome}',
                    to_jsonb(COALESCE(b.welcome_message, 'Xin chào! Tôi có thể giúp gì cho bạn?'))
                ),
                '{messages,placeholder}',
                to_jsonb(COALESCE(b.placeholder_text, 'Nhập tin nhắn...'))
            )
            FROM bot b
            WHERE wv.bot_id = b.id;
        `);

        await queryRunner.query(`
            UPDATE widget_version wv
            SET config = jsonb_set(
                wv.config,
                '{security,allowedOrigins}',
                COALESCE(b.allowed_origins, '["*"]'::jsonb)
            )
            FROM bot b
            WHERE wv.bot_id = b.id;
        `);

        await queryRunner.query(`
            UPDATE widget_version
            SET config = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                config,
                                '{behavior}',
                                COALESCE(config->'behavior', '{"autoOpen": false, "autoOpenDelay": 3000, "greetingDelay": 1000}'::jsonb)
                            ),
                            '{features}',
                            COALESCE(config->'features', '{"fileUpload": true, "voiceInput": false, "markdown": true, "quickReplies": true}'::jsonb)
                        ),
                        '{branding}',
                        COALESCE(config->'branding', '{"showPoweredBy": true}'::jsonb)
                    ),
                    '{messages,offline}',
                    COALESCE(config->'messages'->'offline', '"Chúng tôi hiện không trực tuyến"'::jsonb)
                ),
                '{messages,errorMessage}',
                COALESCE(config->'messages'->'errorMessage', '"Đã có lỗi xảy ra"'::jsonb)
            )
            WHERE config IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE bot b
            SET 
                primary_color = wv.config->'theme'->>'primaryColor',
                widget_position = wv.config->'theme'->>'position',
                widget_button_size = wv.config->'theme'->>'buttonSize',
                show_avatar = (wv.config->'theme'->>'showAvatar')::boolean,
                show_timestamp = (wv.config->'theme'->>'showTimestamp')::boolean,
                welcome_message = wv.config->'messages'->>'welcome',
                placeholder_text = wv.config->'messages'->>'placeholder',
                allowed_origins = wv.config->'security'->'allowedOrigins'
            FROM widget_version wv
            WHERE b.id = wv.bot_id AND wv.is_active = true;
        `);
    }
}
