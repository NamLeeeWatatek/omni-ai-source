import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial31765985320759 implements MigrationInterface {
    name = 'Initial31765985320759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flow_version" DROP CONSTRAINT "FK_8c9b43712e39780ad1d53380b74"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c9b43712e39780ad1d53380b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fd20035420a32ac56139d17f6"`);
        await queryRunner.query(`CREATE TABLE "execution_artifact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "executionId" uuid NOT NULL, "fileId" uuid NOT NULL, "artifactType" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "metadata" jsonb, "size" bigint, "mimeType" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e2a7dcfc0cb1bdef381812f4756" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5da02a039ed07062cf325bb29b" ON "execution_artifact" ("executionId") `);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "flowId"`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "versionNumber"`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "flowId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "data" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "versionNumber" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "flow_version" ALTER COLUMN "bot_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "flow_version" ALTER COLUMN "created_by" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_8c9b43712e39780ad1d53380b7" ON "flow_version" ("bot_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6fd20035420a32ac56139d17f6" ON "flow_version" ("bot_id", "version") `);
        await queryRunner.query(`ALTER TABLE "execution_artifact" ADD CONSTRAINT "FK_5da02a039ed07062cf325bb29b6" FOREIGN KEY ("executionId") REFERENCES "flow_execution"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD CONSTRAINT "FK_8c9b43712e39780ad1d53380b74" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flow_version" DROP CONSTRAINT "FK_8c9b43712e39780ad1d53380b74"`);
        await queryRunner.query(`ALTER TABLE "execution_artifact" DROP CONSTRAINT "FK_5da02a039ed07062cf325bb29b6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fd20035420a32ac56139d17f6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c9b43712e39780ad1d53380b7"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ALTER COLUMN "created_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "flow_version" ALTER COLUMN "bot_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "versionNumber"`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "flow_version" DROP COLUMN "flowId"`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "versionNumber" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "data" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD "flowId" uuid NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5da02a039ed07062cf325bb29b"`);
        await queryRunner.query(`DROP TABLE "execution_artifact"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6fd20035420a32ac56139d17f6" ON "flow_version" ("bot_id", "version") `);
        await queryRunner.query(`CREATE INDEX "IDX_8c9b43712e39780ad1d53380b7" ON "flow_version" ("bot_id") `);
        await queryRunner.query(`ALTER TABLE "flow_version" ADD CONSTRAINT "FK_8c9b43712e39780ad1d53380b74" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
