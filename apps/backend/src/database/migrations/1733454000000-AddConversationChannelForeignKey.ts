import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationChannelForeignKey1733454000000
  implements MigrationInterface
{
  name = 'AddConversationChannelForeignKey1733454000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, clean up any orphaned references
    await queryRunner.query(`
      UPDATE conversation 
      SET channel_id = NULL 
      WHERE channel_id IS NOT NULL 
      AND channel_id NOT IN (SELECT id FROM channel_connection)
    `);

    // Add foreign key constraint with ON DELETE SET NULL
    // This ensures when a channel is deleted, conversations are not orphaned
    await queryRunner.query(`
      ALTER TABLE conversation
      ADD CONSTRAINT fk_conversation_channel
      FOREIGN KEY (channel_id)
      REFERENCES channel_connection(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE conversation
      DROP CONSTRAINT IF EXISTS fk_conversation_channel
    `);
  }
}
