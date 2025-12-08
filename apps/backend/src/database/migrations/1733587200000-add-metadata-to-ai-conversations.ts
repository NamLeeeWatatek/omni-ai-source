import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMetadataToAiConversations1733587200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if metadata column exists
    const table = await queryRunner.getTable('ai_conversation');
    const metadataColumn = table?.findColumnByName('metadata');

    if (!metadataColumn) {
      await queryRunner.addColumn(
        'ai_conversation',
        new TableColumn({
          name: 'metadata',
          type: 'jsonb',
          default: "'{}'",
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('ai_conversation', 'metadata');
  }
}
