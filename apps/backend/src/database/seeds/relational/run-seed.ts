import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { PermissionSeedService } from './permission/permission-seed.service';
import { NodeTypeSeedService } from './node-type/node-type-seed.service';
import { FlowSeedService } from './flow/flow-seed.service';
import { AiProviderSeedService } from './ai-provider/ai-provider-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  // Seed AI providers first
  await app.get(AiProviderSeedService).run();

  await app.get(PermissionSeedService).run();

  await app.get(RoleSeedService).run();

  await app.get(StatusSeedService).run();

  await app.get(NodeTypeSeedService).run();

  await app.get(UserSeedService).run();

  // Run flow seeds after users are created
  await app.get(FlowSeedService).run();

  await app.close();
};

void runSeed();
