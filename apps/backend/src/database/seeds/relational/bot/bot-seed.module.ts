import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotSeedService } from './bot-seed.service';
import { BotEntity } from '../../../../bots/infrastructure/persistence/relational/entities/bot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotEntity]),
  ],
  providers: [BotSeedService],
  exports: [BotSeedService],
})
export class BotSeedModule {}
