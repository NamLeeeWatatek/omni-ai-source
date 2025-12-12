import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderAI1765441345143 implements MigrationInterface {
  name = 'AddProviderAI1765441345143';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP CONSTRAINT "FK_8c9b43712e39780ad1d53380b74"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c9b43712e39780ad1d53380b7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6fd20035420a32ac56139d17f6"`,
    );
    await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "flowId"`);
    await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "data"`);
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "versionNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "ai_provider_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD "rag_model" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "flowId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "data" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "versionNumber" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "bot_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ae166c823e535eb731f333522" ON "knowledge_base" ("ai_provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c9b43712e39780ad1d53380b7" ON "flow_version" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6fd20035420a32ac56139d17f6" ON "flow_version" ("bot_id", "version") `,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD CONSTRAINT "FK_8c9b43712e39780ad1d53380b74" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP CONSTRAINT "FK_8c9b43712e39780ad1d53380b74"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6fd20035420a32ac56139d17f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c9b43712e39780ad1d53380b7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ae166c823e535eb731f333522"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "created_by" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "bot_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "versionNumber"`,
    );
    await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "data"`);
    await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "flowId"`);
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "rag_model"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP COLUMN "ai_provider_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "versionNumber" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "data" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "flowId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6fd20035420a32ac56139d17f6" ON "flow_version" ("bot_id", "version") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c9b43712e39780ad1d53380b7" ON "flow_version" ("bot_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD CONSTRAINT "FK_8c9b43712e39780ad1d53380b74" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
