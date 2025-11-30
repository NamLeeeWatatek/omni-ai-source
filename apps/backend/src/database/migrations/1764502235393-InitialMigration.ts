import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1764502235393 implements MigrationInterface {
  name = 'InitialMigration1764502235393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "resource" character varying NOT NULL, "action" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_240853a0c3353c25fb12434ad33" UNIQUE ("name"), CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role" ("id" integer NOT NULL, "name" character varying NOT NULL, "description" character varying, "casdoor_role_name" character varying, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "status" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "password" character varying, "provider" character varying NOT NULL DEFAULT 'email', "socialId" character varying, "firstName" character varying, "lastName" character varying, "externalId" character varying, "casdoorId" character varying, "avatar" character varying, "permissions" jsonb, "lastLogin" TIMESTAMP, "failedLoginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "photoId" uuid, "roleId" integer, "statusId" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_bc97b425592aa51df5da7a440a6" UNIQUE ("externalId"), CONSTRAINT "UQ_023a42dd23f800130a68f917483" UNIQUE ("casdoorId"), CONSTRAINT "REL_75e2be4ce11d447ef43be0e374" UNIQUE ("photoId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9bd2fe7a8e694dedc4ec2f666f" ON "user" ("socialId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON "user" ("firstName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON "user" ("lastName") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bot" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid, "name" character varying NOT NULL, "description" character varying, "icon" character varying NOT NULL DEFAULT 'FiMessageSquare', "isActive" boolean NOT NULL DEFAULT true, "flowId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bc6d59d7870eb2efd5f7f61e5ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "flow_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "botId" uuid NOT NULL, "version" integer NOT NULL, "flow" jsonb NOT NULL, "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2f20a52dcddf98d3fafe621a9f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0d706c438a9b1ae0ac9806a201a" UNIQUE ("slug"), CONSTRAINT "PK_ca86b6f9b3be5fe26d307d09b49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d706c438a9b1ae0ac9806a201" ON "workspace" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspaceId" uuid NOT NULL, "userId" uuid NOT NULL, "role" character varying NOT NULL DEFAULT 'member', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3a35f64bf30517010551467c6e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "template" ("id" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "category" character varying NOT NULL, "thumbnail" character varying, "tags" text NOT NULL, "isPremium" boolean NOT NULL DEFAULT false, "usageCount" integer NOT NULL DEFAULT '0', "nodes" jsonb NOT NULL, "edges" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "node_type" ("id" character varying NOT NULL, "label" character varying NOT NULL, "category" character varying NOT NULL, "icon" character varying NOT NULL, "color" character varying NOT NULL, "description" text, "properties" jsonb, "isPremium" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_21db5612f4dbffd0e468819c4ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "channel_credential" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying NOT NULL, "workspaceId" uuid, "name" character varying, "clientId" character varying NOT NULL, "clientSecret" character varying NOT NULL, "scopes" character varying, "isActive" boolean NOT NULL DEFAULT true, "metadata" jsonb DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dac10e98607782ecfb6bd9b141e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7759e3294e12c1bd976f2ca8ac" ON "channel_credential" ("provider") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45dbb885e2a77019931fc5ed8f" ON "channel_credential" ("workspaceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "channel_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "credentialId" uuid, "workspaceId" uuid, "accessToken" character varying, "refreshToken" character varying, "expiresAt" TIMESTAMP, "metadata" jsonb DEFAULT '{}', "status" character varying NOT NULL DEFAULT 'active', "connectedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f0b0b90fa3837ad5470c942462d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81d0c0117227d233206d06fa95" ON "channel_connection" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49ac0d03296afd3cad2a4be75b" ON "channel_connection" ("credentialId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ac913b616a1320e4e443f9ee6" ON "channel_connection" ("workspaceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "flow_execution" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "executionId" character varying NOT NULL, "flowId" uuid NOT NULL, "status" character varying NOT NULL, "startTime" bigint NOT NULL, "endTime" bigint, "result" jsonb, "error" character varying, "workspaceId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b12e2bba2745c94014eed8a0209" UNIQUE ("executionId"), CONSTRAINT "PK_9298d4abb879af4bca7621dab76" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b12e2bba2745c94014eed8a020" ON "flow_execution" ("executionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82bbbc66b3d756c9b6195e54a2" ON "flow_execution" ("flowId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "node_execution" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "executionId" uuid NOT NULL, "nodeId" character varying NOT NULL, "nodeName" character varying NOT NULL, "type" character varying NOT NULL, "input" jsonb, "output" jsonb, "error" character varying, "startTime" bigint NOT NULL, "endTime" bigint, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a78a4d229919cfb123d090e71e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38fca24c8eadabf06167f4d6c9" ON "node_execution" ("executionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "flow" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "status" character varying NOT NULL DEFAULT 'draft', "version" integer NOT NULL DEFAULT '1', "templateId" character varying, "data" jsonb NOT NULL DEFAULT '{}', "userId" character varying, "channelId" uuid, "ownerId" uuid, "teamId" uuid, "visibility" character varying NOT NULL DEFAULT 'private', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c2ad4a3e86394cd9bb7a80a228" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "botId" uuid NOT NULL, "channelId" uuid, "externalId" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "content" text NOT NULL, "sender" character varying NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permission" ("role_id" integer NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_19a94c31d4960ded0dcd0397759" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d0a7155eafd75ddba5a701336" ON "role_permission" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3a3ba47b7ca00fd23be4ebd6c" ON "role_permission" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_dc18daa696860586ba4667a9d31" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" ADD CONSTRAINT "FK_e9496b62b1ecbd05c83e7d19f36" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" ADD CONSTRAINT "FK_db588f90b1d547629d485402507" FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ADD CONSTRAINT "FK_51f2194e4a415202512807d2f63" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_03ce416ae83c188274dec61205c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD CONSTRAINT "FK_49ac0d03296afd3cad2a4be75b2" FOREIGN KEY ("credentialId") REFERENCES "channel_credential"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "node_execution" ADD CONSTRAINT "FK_38fca24c8eadabf06167f4d6c94" FOREIGN KEY ("executionId") REFERENCES "flow_execution"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow" ADD CONSTRAINT "FK_45e9c69589ca6ae78b28f255700" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_34f0c9e33195e363cd90cef5a19" FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" ADD CONSTRAINT "FK_3d0a7155eafd75ddba5a7013368" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3a3ba47b7ca00fd23be4ebd6cf" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3a3ba47b7ca00fd23be4ebd6cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" DROP CONSTRAINT "FK_3d0a7155eafd75ddba5a7013368"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_34f0c9e33195e363cd90cef5a19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow" DROP CONSTRAINT "FK_45e9c69589ca6ae78b28f255700"`,
    );
    await queryRunner.query(
      `ALTER TABLE "node_execution" DROP CONSTRAINT "FK_38fca24c8eadabf06167f4d6c94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP CONSTRAINT "FK_49ac0d03296afd3cad2a4be75b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_03ce416ae83c188274dec61205c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_15b622cbfffabc30d7dbc52fede"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" DROP CONSTRAINT "FK_51f2194e4a415202512807d2f63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flow_version" DROP CONSTRAINT "FK_db588f90b1d547629d485402507"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" DROP CONSTRAINT "FK_e9496b62b1ecbd05c83e7d19f36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_dc18daa696860586ba4667a9d31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3a3ba47b7ca00fd23be4ebd6c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d0a7155eafd75ddba5a701336"`,
    );
    await queryRunner.query(`DROP TABLE "role_permission"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(`DROP TABLE "flow"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38fca24c8eadabf06167f4d6c9"`,
    );
    await queryRunner.query(`DROP TABLE "node_execution"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82bbbc66b3d756c9b6195e54a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b12e2bba2745c94014eed8a020"`,
    );
    await queryRunner.query(`DROP TABLE "flow_execution"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ac913b616a1320e4e443f9ee6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49ac0d03296afd3cad2a4be75b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81d0c0117227d233206d06fa95"`,
    );
    await queryRunner.query(`DROP TABLE "channel_connection"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45dbb885e2a77019931fc5ed8f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7759e3294e12c1bd976f2ca8ac"`,
    );
    await queryRunner.query(`DROP TABLE "channel_credential"`);
    await queryRunner.query(`DROP TABLE "node_type"`);
    await queryRunner.query(`DROP TABLE "template"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "workspace_member"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d706c438a9b1ae0ac9806a201"`,
    );
    await queryRunner.query(`DROP TABLE "workspace"`);
    await queryRunner.query(`DROP TABLE "flow_version"`);
    await queryRunner.query(`DROP TABLE "bot"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0e1b4ecdca13b177e2e3a0613"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58e4dbff0e1a32a9bdc861bb29"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9bd2fe7a8e694dedc4ec2f666f"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(`DROP TABLE "status"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "permission"`);
  }
}
