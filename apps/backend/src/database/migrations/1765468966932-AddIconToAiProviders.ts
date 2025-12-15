import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconToAiProviders1765468966932 implements MigrationInterface {
  name = 'AddIconToAiProviders1765468966932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add icon column to ai_providers table
    await queryRunner.query(
      `ALTER TABLE "ai_providers" ADD "icon" character varying`,
    );

    // Update existing records with appropriate icons
    await queryRunner.query(
      `UPDATE "ai_providers" SET "icon" = 'AiOutlineOpenAI' WHERE "key" = 'openai'`,
    );
    await queryRunner.query(
      `UPDATE "ai_providers" SET "icon" = 'SiClaude' WHERE "key" = 'anthropic'`,
    );
    await queryRunner.query(
      `UPDATE "ai_providers" SET "icon" = 'RiGeminiLine' WHERE "key" = 'google'`,
    );
    await queryRunner.query(
      `UPDATE "ai_providers" SET "icon" = 'VscAzure' WHERE "key" = 'azure'`,
    );
    await queryRunner.query(
      `UPDATE "ai_providers" SET "icon" = 'SiOllama' WHERE "key" = 'ollama'`,
    );
    await queryRunner.query(
      `UPDATE "ai_providers" SET "icon" = 'MdDashboardCustomize' WHERE "key" = 'custom'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove icon column from ai_providers table
    await queryRunner.query(`ALTER TABLE "ai_providers" DROP COLUMN "icon"`);
  }
}
