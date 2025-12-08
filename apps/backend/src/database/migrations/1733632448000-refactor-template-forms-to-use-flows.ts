import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorTemplateFormsToUseFlows1733632448000
    implements MigrationInterface {
    name = 'RefactorTemplateFormsToUseFlows1733632448000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop template_executions table as we'll use flow_execution instead
        await queryRunner.query(`DROP TABLE IF EXISTS "template_executions" CASCADE`);

        // Check if template_form_schemas table exists
        const table = await queryRunner.getTable('template_form_schemas');

        if (table) {
            // Drop executionConfig column
            const hasExecutionConfig = table.columns.find(
                (col) => col.name === 'executionConfig'
            );
            if (hasExecutionConfig) {
                await queryRunner.query(
                    `ALTER TABLE "template_form_schemas" DROP COLUMN "executionConfig"`
                );
            }

            // Add flowTemplateId column if it doesn't exist
            const hasFlowTemplateId = table.columns.find(
                (col) => col.name === 'flowTemplateId'
            );
            if (!hasFlowTemplateId) {
                await queryRunner.query(
                    `ALTER TABLE "template_form_schemas" ADD COLUMN "flowTemplateId" uuid`
                );
            }

            // Add inputMapping column if it doesn't exist
            const hasInputMapping = table.columns.find(
                (col) => col.name === 'inputMapping'
            );
            if (!hasInputMapping) {
                await queryRunner.query(
                    `ALTER TABLE "template_form_schemas" ADD COLUMN "inputMapping" jsonb NOT NULL DEFAULT '{}'`
                );
            }

            // Add foreign key constraint to flow table
            await queryRunner.query(
                `ALTER TABLE "template_form_schemas" ADD CONSTRAINT "FK_template_form_flow" 
                 FOREIGN KEY ("flowTemplateId") REFERENCES "flow"("id") ON DELETE SET NULL`
            );
        } else {
            // Create table if it doesn't exist
            await queryRunner.query(`
                CREATE TABLE "template_form_schemas" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(255) NOT NULL,
                    "description" text,
                    "category" character varying(50) NOT NULL,
                    "icon" character varying(50),
                    "formSchema" jsonb NOT NULL,
                    "flowTemplateId" uuid,
                    "inputMapping" jsonb NOT NULL DEFAULT '{}',
                    "uiConfig" jsonb,
                    "isActive" boolean NOT NULL DEFAULT true,
                    "createdById" uuid,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_template_form_schemas" PRIMARY KEY ("id"),
                    CONSTRAINT "FK_template_form_flow" FOREIGN KEY ("flowTemplateId") REFERENCES "flow"("id") ON DELETE SET NULL,
                    CONSTRAINT "FK_template_form_creator" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes
        const table = await queryRunner.getTable('template_form_schemas');

        if (table) {
            // Drop foreign key
            await queryRunner.query(
                `ALTER TABLE "template_form_schemas" DROP CONSTRAINT IF EXISTS "FK_template_form_flow"`
            );

            // Remove new columns
            await queryRunner.query(
                `ALTER TABLE "template_form_schemas" DROP COLUMN IF EXISTS "flowTemplateId"`
            );
            await queryRunner.query(
                `ALTER TABLE "template_form_schemas" DROP COLUMN IF EXISTS "inputMapping"`
            );

            // Add back executionConfig
            await queryRunner.query(
                `ALTER TABLE "template_form_schemas" ADD COLUMN "executionConfig" jsonb`
            );
        }

        // Recreate template_executions table
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
    }
}
