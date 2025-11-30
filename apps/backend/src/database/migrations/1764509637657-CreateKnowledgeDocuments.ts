import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateKnowledgeDocuments1764509637657 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "knowledge_documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(500) NOT NULL,
                "content" text NOT NULL,
                "source" character varying(100) NOT NULL DEFAULT 'manual',
                "botId" uuid,
                "embeddingStatus" character varying(20) NOT NULL DEFAULT 'pending',
                "embeddingError" text,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_knowledge_documents" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_knowledge_documents_title" ON "knowledge_documents" ("title")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_knowledge_documents_botId" ON "knowledge_documents" ("botId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_knowledge_documents_embeddingStatus" ON "knowledge_documents" ("embeddingStatus")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_knowledge_documents_embeddingStatus"`);
        await queryRunner.query(`DROP INDEX "IDX_knowledge_documents_botId"`);
        await queryRunner.query(`DROP INDEX "IDX_knowledge_documents_title"`);
        await queryRunner.query(`DROP TABLE "knowledge_documents"`);
    }

}
