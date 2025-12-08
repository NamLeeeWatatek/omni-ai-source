import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationUniqueConstraint1733455000000
  implements MigrationInterface
{
  name = 'AddConversationUniqueConstraint1733455000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, clean up duplicates - keep only the newest conversation for each user
    await queryRunner.query(`
      DELETE FROM conversation
      WHERE id NOT IN (
        SELECT DISTINCT ON (external_id, bot_id, channel_type) id
        FROM conversation
        WHERE external_id IS NOT NULL
        ORDER BY external_id, bot_id, channel_type, created_at DESC
      )
      AND external_id IS NOT NULL
    `);

    // Add unique constraint to prevent duplicates
    // One user (external_id) can only have one active conversation per bot and channel type
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_conversation_unique_user_bot_channel
      ON conversation (external_id, bot_id, channel_type)
      WHERE external_id IS NOT NULL AND status = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_conversation_unique_user_bot_channel
    `);
  }
}
