import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersService } from './ai-providers.service';
import {
  AiProviderEntity,
  UserAiProviderConfigEntity,
  WorkspaceAiProviderConfigEntity,
  AiUsageLogEntity,
} from './infrastructure/persistence/relational/entities/ai-provider.entity';
import { AiProviderConfigRelationalRepository } from './infrastructure/persistence/relational/repositories/ai-provider-config.repository';
import { AiProviderConfigRepository } from './infrastructure/persistence/ai-provider-config.repository';
import { EncryptionUtil } from '../common/utils/encryption.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiProviderEntity,
      UserAiProviderConfigEntity,
      WorkspaceAiProviderConfigEntity,
      AiUsageLogEntity,
    ]),
  ],
  controllers: [AiProvidersController],
  providers: [
    AiProvidersService,
    EncryptionUtil,
    {
      provide: AiProviderConfigRepository,
      useClass: AiProviderConfigRelationalRepository,
    },
  ],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}
