import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1765359587603 implements MigrationInterface {
  name = 'Initial1765359587603';

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
    await queryRunner.query(`ALTER TABLE "node_type" DROP COLUMN "isPremium"`);
    await queryRunner.query(`ALTER TABLE "node_type" DROP COLUMN "isTrigger"`);
    await queryRunner.query(`ALTER TABLE "node_type" DROP COLUMN "executor"`);
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
      `ALTER TABLE "file" ADD "bucket" character varying NOT NULL DEFAULT 'images'`,
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
    await queryRunner.query(`ALTER TABLE "file" DROP COLUMN "bucket"`);
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
      `ALTER TABLE "node_type" ADD "executor" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "node_type" ADD "isTrigger" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "node_type" ADD "isPremium" boolean NOT NULL DEFAULT false`,
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
