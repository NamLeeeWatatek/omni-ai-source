import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { PermissionSeedService } from './permission/permission-seed.service';
import { NodeTypeSeedService } from './node-type/node-type-seed.service';
import { TemplateSeedService } from './template/template-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  await app.get(PermissionSeedService).run();

  await app.get(RoleSeedService).run();

  await app.get(StatusSeedService).run();

  await app.get(NodeTypeSeedService).run();

  await app.get(TemplateSeedService).run();

  await app.get(UserSeedService).run();

  await app.close();
};

void runSeed();
