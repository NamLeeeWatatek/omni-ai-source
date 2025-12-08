import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTemplateFormsTables1765167532335 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create template_form_schemas table
        await queryRunner.query(`
            CREATE TABLE "template_form_schemas" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "category" character varying(50) NOT NULL,
                "icon" character varying(50),
                "formSchema" jsonb NOT NULL,
                "executionConfig" jsonb NOT NULL,
                "uiConfig" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_template_form_schemas" PRIMARY KEY ("id")
            )
        `);

        // Create template_executions table
        await queryRunner.query(`
            CREATE TABLE "template_executions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "templateSchemaId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "workspaceId" uuid NOT NULL,
                "inputData" jsonb NOT NULL,
                "status" character varying(50) NOT NULL DEFAULT 'pending',
                "progress" integer NOT NULL DEFAULT 0,
                "resultData" jsonb,
                "errorMessage" text,
                "externalExecutionId" character varying(255),
                "webhookResponse" jsonb,
                "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_template_executions" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_template_executions_user" ON "template_executions" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_template_executions_workspace" ON "template_executions" ("workspaceId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_template_executions_status" ON "template_executions" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_template_executions_template" ON "template_executions" ("templateSchemaId")
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "template_form_schemas" 
            ADD CONSTRAINT "FK_template_form_schemas_user" 
            FOREIGN KEY ("createdById") REFERENCES "user"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "template_executions" 
            ADD CONSTRAINT "FK_template_executions_template" 
            FOREIGN KEY ("templateSchemaId") REFERENCES "template_form_schemas"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "template_executions" 
            ADD CONSTRAINT "FK_template_executions_user" 
            FOREIGN KEY ("userId") REFERENCES "user"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "template_executions" 
            ADD CONSTRAINT "FK_template_executions_workspace" 
            FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "template_executions" DROP CONSTRAINT "FK_template_executions_workspace"`);
        await queryRunner.query(`ALTER TABLE "template_executions" DROP CONSTRAINT "FK_template_executions_user"`);
        await queryRunner.query(`ALTER TABLE "template_executions" DROP CONSTRAINT "FK_template_executions_template"`);
        await queryRunner.query(`ALTER TABLE "template_form_schemas" DROP CONSTRAINT "FK_template_form_schemas_user"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_template_executions_template"`);
        await queryRunner.query(`DROP INDEX "IDX_template_executions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_template_executions_workspace"`);
        await queryRunner.query(`DROP INDEX "IDX_template_executions_user"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "template_executions"`);
        await queryRunner.query(`DROP TABLE "template_form_schemas"`);
    }

}
