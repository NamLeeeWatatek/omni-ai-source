import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemAiSettings } from '../../domain/ai-provider';
import { UpdateSystemAiSettingsDto } from '../../dto/ai-provider.dto';
import { SystemAiSettingsEntity } from '../persistence/relational/entities/ai-provider.entity';
import { SystemAiSettingsMapper } from '../persistence/relational/mappers/system-ai-settings.mapper';

@Injectable()
export class SystemAiSettingsRepository {
  constructor(
    @InjectRepository(SystemAiSettingsEntity)
    private readonly systemAiSettingsRepository: Repository<SystemAiSettingsEntity>,
  ) {}

  async findSystemSettings(): Promise<SystemAiSettings> {
    // Always return the first (and only) system settings record
    // Create one if it doesn't exist
    let entity = await this.systemAiSettingsRepository.findOne({
      where: {}, // No where clause to get any record
    });

    if (!entity) {
      entity = await this.systemAiSettingsRepository.save(
        this.systemAiSettingsRepository.create({
          defaultProviderId: '',
          defaultModel: '',
          minTemperature: 0.0,
          maxTemperature: 2.0,
          contentModeration: true,
          safeFallbacks: true,
          contextAware: true,
          maxRequestsPerHour: 1000,
          maxRequestsPerUser: 100,
        } as Partial<SystemAiSettingsEntity>),
      );
    }

    return SystemAiSettingsMapper.toDomain(entity);
  }

  async updateSystemSettings(
    updates: UpdateSystemAiSettingsDto,
  ): Promise<SystemAiSettings> {
    const currentEntity = await this.systemAiSettingsRepository.findOne({
      where: {},
    });

    if (!currentEntity) {
      throw new Error('System settings not found');
    }

    // Merge updates into persistence model
    const persistenceData = SystemAiSettingsMapper.toPersistence({
      ...SystemAiSettingsMapper.toDomain(currentEntity),
      ...updates,
    });

    const updatedEntity = await this.systemAiSettingsRepository.save(
      this.systemAiSettingsRepository.create({
        ...currentEntity,
        ...persistenceData,
      }),
    );

    return SystemAiSettingsMapper.toDomain(updatedEntity);
  }
}
