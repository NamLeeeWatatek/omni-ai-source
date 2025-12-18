import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtToKbFolder1765879028060 implements MigrationInterface {
    name = 'AddDeletedAtToKbFolder1765879028060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kb_folder" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "kb_folder" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "kb_folder" ADD "created_by" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ae8c2c4e8b7e8b2b8c9e8b2b8c" ON "kb_folder" ("created_by")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ae8c2c4e8b7e8b2b8c9e8b2b8c"`);
        await queryRunner.query(`ALTER TABLE "kb_folder" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "kb_folder" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "kb_folder" DROP COLUMN "deleted_at"`);
    }
}
