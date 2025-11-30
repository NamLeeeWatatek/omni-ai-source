import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { PermissionSeedService } from './permission/permission-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  console.log('🌱 Starting database seeding...\n');

  // Run seeds in order (permissions must be first!)
  console.log('📝 Seeding permissions...');
  await app.get(PermissionSeedService).run();
  
  console.log('\n📝 Seeding roles (with permissions)...');
  await app.get(RoleSeedService).run();
  
  console.log('\n📝 Seeding statuses...');
  await app.get(StatusSeedService).run();
  
  console.log('\n📝 Seeding users...');
  await app.get(UserSeedService).run();

  console.log('\n✅ Database seeding completed!');
  console.log('\n🔐 Casdoor Integration:');
  console.log('   - Admin role mapped to Casdoor "admin" role');
  console.log('   - User role mapped to Casdoor "user" role');
  console.log('   - Permissions assigned to roles automatically');
  
  await app.close();
};

void runSeed();
