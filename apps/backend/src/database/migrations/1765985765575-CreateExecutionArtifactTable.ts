import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExecutionArtifactTable1765985765575 implements MigrationInterface {
  name = 'CreateExecutionArtifactTable1765985765575';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "execution_artifact" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "executionId" uuid NOT NULL,
        "fileId" uuid NOT NULL,
        "artifactType" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "metadata" jsonb,
        "size" bigint,
        "mimeType" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_9b1e0b0b0b0b0b0b0b0b0b0b0b" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_execution_artifact_executionId" ON "execution_artifact" ("executionId")
    `);

    await queryRunner.query(`
      ALTER TABLE "execution_artifact"
      ADD CONSTRAINT "FK_execution_artifact_execution"
      FOREIGN KEY ("executionId") REFERENCES "flow_execution"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "execution_artifact"`);
  }
}
