import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemAiSettings1765647091876 implements MigrationInterface {
  name = 'AddSystemAiSettings1765647091876';

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
    await queryRunner.query(
      `CREATE TABLE "system_ai_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "default_provider_id" character varying, "default_model" character varying, "min_temperature" numeric(3,1) NOT NULL DEFAULT '0', "max_temperature" numeric(3,1) NOT NULL DEFAULT '2', "content_moderation" boolean NOT NULL DEFAULT true, "safe_fallbacks" boolean NOT NULL DEFAULT true, "context_aware" boolean NOT NULL DEFAULT true, "max_requests_per_hour" integer NOT NULL DEFAULT '1000', "max_requests_per_user" integer NOT NULL DEFAULT '100', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4ea8c546ef61546cb93977c6d9d" PRIMARY KEY ("id"))`,
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
      `CREATE INDEX "IDX_8c9b43712e39780ad1d53380b7" ON "flow_version" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6fd20035420a32ac56139d17f6" ON "flow_version" ("bot_id", "version") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "FK_7299ed156a084d7e97df80b7ff6" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" ADD CONSTRAINT "FK_ec0f1703bed5fb29ea5e0afe160" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" ADD CONSTRAINT "FK_2a55b8ba19368d0e6499ba5df1b" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "workspace_ai_provider_configs" DROP CONSTRAINT "FK_2a55b8ba19368d0e6499ba5df1b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" DROP CONSTRAINT "FK_ec0f1703bed5fb29ea5e0afe160"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP CONSTRAINT "FK_7299ed156a084d7e97df80b7ff6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6fd20035420a32ac56139d17f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c9b43712e39780ad1d53380b7"`,
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
    await queryRunner.query(`DROP TABLE "system_ai_settings"`);
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
