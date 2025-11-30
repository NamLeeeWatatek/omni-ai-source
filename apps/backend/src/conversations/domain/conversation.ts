import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Conversation {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  botId: string;

  @ApiPropertyOptional({ type: String })
  channelId?: string | null;

  @ApiProperty({ type: String })
  externalId: string;

  @ApiProperty({ type: String })
  status: string;

  @ApiProperty({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class Message {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  conversationId: string;

  @ApiProperty({ type: String })
  content: string;

  @ApiProperty({ type: String, enum: ['user', 'bot', 'system'] })
  sender: string;

  @ApiProperty({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;
}
