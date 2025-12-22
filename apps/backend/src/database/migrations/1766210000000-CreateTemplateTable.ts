import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateTable1766210000000 implements MigrationInterface {
  name = 'CreateTemplateTable1766210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "prompt" text, "media_files" jsonb, "style_config" jsonb, "category" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_by" character varying, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_fbae2ac36bdbfad029c14c1f694" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a25737b8d827c719c2b8a2825" ON "template" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e1a55c8b86d460bde0465b7e4" ON "template" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_faf46b9b3c88b592f3b0c058b" ON "template" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9767eb6b4e02e425e9b8e8e7c" ON "template" ("workspace_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9767eb6b4e02e425e9b8e8e7c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_faf46b9b3c88b592f3b0c058b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e1a55c8b86d460bde0465b7e4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a25737b8d827c719c2b8a2825"`,
    );
    await queryRunner.query(`DROP TABLE "template"`);
  }
}
