import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiProviderTables1733400000000 implements MigrationInterface {
  name = 'CreateAiProviderTables1733400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_ai_provider table
    await queryRunner.query(`
      CREATE TABLE "user_ai_provider" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "provider" character varying NOT NULL,
        "display_name" character varying NOT NULL,
        "api_key_encrypted" character varying,
        "model_list" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verified_at" TIMESTAMP,
        "quota_used" integer NOT NULL DEFAULT 0,
        "last_used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_ai_provider" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_ai_provider_user_id" ON "user_ai_provider" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "user_ai_provider" 
      ADD CONSTRAINT "FK_user_ai_provider_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE
    `);

    // Create workspace_ai_provider table
    await queryRunner.query(`
      CREATE TABLE "workspace_ai_provider" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "provider" character varying NOT NULL,
        "display_name" character varying NOT NULL,
        "api_key_encrypted" character varying,
        "model_list" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "quota_used" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workspace_ai_provider" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_workspace_ai_provider_workspace_id" ON "workspace_ai_provider" ("workspace_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "workspace_ai_provider" 
      ADD CONSTRAINT "FK_workspace_ai_provider_workspace" 
      FOREIGN KEY ("workspace_id") 
      REFERENCES "workspace"("id") 
      ON DELETE CASCADE
    `);

    // Create ai_usage_log table
    await queryRunner.query(`
      CREATE TABLE "ai_usage_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider" character varying NOT NULL,
        "model" character varying NOT NULL,
        "input_tokens" integer NOT NULL,
        "output_tokens" integer NOT NULL,
        "cost" decimal(10,6) NOT NULL DEFAULT 0,
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_usage_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_usage_log_workspace_id" ON "ai_usage_log" ("workspace_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_usage_log_user_id" ON "ai_usage_log" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_usage_log_requested_at" ON "ai_usage_log" ("requested_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_usage_log" 
      ADD CONSTRAINT "FK_ai_usage_log_workspace" 
      FOREIGN KEY ("workspace_id") 
      REFERENCES "workspace"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_usage_log" 
      ADD CONSTRAINT "FK_ai_usage_log_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_usage_log"`);
    await queryRunner.query(`DROP TABLE "workspace_ai_provider"`);
    await queryRunner.query(`DROP TABLE "user_ai_provider"`);
  }
}
