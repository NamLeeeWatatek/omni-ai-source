import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePermissionSystem1764496110956 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if permission table exists
    const permissionTableExists = await queryRunner.hasTable('permission');
    
    if (!permissionTableExists) {
      // Create permission table
      await queryRunner.createTable(
        new Table({
          name: 'permission',
          columns: [
            {
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'name',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'description',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'resource',
              type: 'varchar',
            },
            {
              name: 'action',
              type: 'varchar',
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'now()',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'now()',
            },
          ],
        }),
        true,
      );
    }

    // Add description and casdoor_role_name columns to role table
    await queryRunner.query(`
      ALTER TABLE "role" 
      ADD COLUMN IF NOT EXISTS "description" varchar,
      ADD COLUMN IF NOT EXISTS "casdoor_role_name" varchar
    `);

    // Check if role_permission table exists
    const rolePermissionTableExists = await queryRunner.hasTable('role_permission');
    
    if (!rolePermissionTableExists) {
      // Create role_permission junction table
      await queryRunner.createTable(
        new Table({
          name: 'role_permission',
          columns: [
            {
              name: 'role_id',
              type: 'integer',
            },
            {
              name: 'permission_id',
              type: 'integer',
            },
          ],
        }),
        true,
      );

      // Add foreign keys
      await queryRunner.createForeignKey(
        'role_permission',
        new TableForeignKey({
          columnNames: ['role_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'role',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'role_permission',
        new TableForeignKey({
          columnNames: ['permission_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'permission',
          onDelete: 'CASCADE',
        }),
      );

      // Add primary key constraint
      await queryRunner.query(`
        ALTER TABLE "role_permission" 
        ADD PRIMARY KEY ("role_id", "permission_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop role_permission table
    await queryRunner.dropTable('role_permission');

    // Drop permission table
    await queryRunner.dropTable('permission');

    // Remove columns from role table
    await queryRunner.query(`
      ALTER TABLE "role" 
      DROP COLUMN IF EXISTS "description",
      DROP COLUMN IF EXISTS "casdoor_role_name"
    `);
  }
}
