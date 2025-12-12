import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiProviderTables1765468966931 implements MigrationInterface {
  name = 'CreateAiProviderTables1765468966931';

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
      `CREATE TABLE "ai_providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "label" character varying NOT NULL, "description" text, "required_fields" jsonb NOT NULL DEFAULT '[]', "optional_fields" jsonb NOT NULL DEFAULT '[]', "default_values" jsonb NOT NULL DEFAULT '{}', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ebb21740e10748770b54434db59" UNIQUE ("key"), CONSTRAINT "PK_de28ebefc0fb425c37b27a4c0a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_provider_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider_id" uuid NOT NULL, "model" character varying NOT NULL, "api_key" character varying NOT NULL, "base_url" character varying, "api_version" character varying, "timeout" integer, "use_stream" boolean NOT NULL DEFAULT true, "owner_type" character varying NOT NULL, "owner_id" uuid, "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c72661bb93d1e6263172f452db" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7299ed156a084d7e97df80b7ff" ON "ai_provider_configs" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2bdd8f45e064bac6f99cbbe91d" ON "ai_provider_configs" ("owner_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4e4ef106d84e38e8577cd965d" ON "ai_provider_configs" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_ai_provider_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider_id" uuid NOT NULL, "display_name" character varying NOT NULL, "config" jsonb NOT NULL, "model_list" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b5931888df2b024311f8a132373" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bca82934cd53e143c74a2ff97c" ON "user_ai_provider_configs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec0f1703bed5fb29ea5e0afe16" ON "user_ai_provider_configs" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_ai_provider_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "provider_id" uuid NOT NULL, "display_name" character varying NOT NULL, "config" jsonb NOT NULL, "model_list" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_453a175908363f730ee3ad12c4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3522a3e473b56a703fe8d98c95" ON "workspace_ai_provider_configs" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a55b8ba19368d0e6499ba5df1" ON "workspace_ai_provider_configs" ("provider_id") `,
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
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "bot_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "created_by" SET NOT NULL`,
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
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" ADD CONSTRAINT "FK_bca82934cd53e143c74a2ff97c5" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" ADD CONSTRAINT "FK_3522a3e473b56a703fe8d98c950" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" DROP CONSTRAINT "FK_3522a3e473b56a703fe8d98c950"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" DROP CONSTRAINT "FK_bca82934cd53e143c74a2ff97c5"`,
    );
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
      `ALTER TABLE "flow_version" ALTER COLUMN "created_by" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ALTER COLUMN "bot_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD "description" character varying`,
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
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a55b8ba19368d0e6499ba5df1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3522a3e473b56a703fe8d98c95"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_ai_provider_configs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec0f1703bed5fb29ea5e0afe16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bca82934cd53e143c74a2ff97c"`,
    );
    await queryRunner.query(`DROP TABLE "user_ai_provider_configs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4e4ef106d84e38e8577cd965d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2bdd8f45e064bac6f99cbbe91d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7299ed156a084d7e97df80b7ff"`,
    );
    await queryRunner.query(`DROP TABLE "ai_provider_configs"`);
    await queryRunner.query(`DROP TABLE "ai_providers"`);
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
