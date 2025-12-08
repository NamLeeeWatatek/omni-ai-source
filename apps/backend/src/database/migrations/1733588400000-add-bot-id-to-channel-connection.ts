import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddBotIdToChannelConnection1733588400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add botId column
    await queryRunner.addColumn(
      'channel_connection',
      new TableColumn({
        name: 'bot_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add index
    await queryRunner.query(
      `CREATE INDEX "IDX_channel_connection_bot_id" ON "channel_connection" ("bot_id")`,
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'channel_connection',
      new TableForeignKey({
        columnNames: ['bot_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bot',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('channel_connection');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('bot_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('channel_connection', foreignKey);
    }

    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_channel_connection_bot_id"`);

    // Drop column
    await queryRunner.dropColumn('channel_connection', 'bot_id');
  }
}
