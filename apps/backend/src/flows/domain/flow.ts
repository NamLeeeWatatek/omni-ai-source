import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class Flow {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiProperty({ type: String, default: 'draft' })
  status: string;

  @ApiProperty({ type: Number, default: 1 })
  version: number;

  @ApiPropertyOptional({ type: String })
  templateId?: string | null;

  @ApiProperty({ type: Object })
  data: Record<string, any>;

  @ApiPropertyOptional({ type: String })
  userId?: string | null;

  @ApiPropertyOptional({ type: String })
  channelId?: string | null;

  @ApiPropertyOptional({ type: String })
  ownerId?: string | null;

  @ApiPropertyOptional({ type: String })
  teamId?: string | null;

  @ApiProperty({ type: String, default: 'private' })
  visibility: string;

  @ApiProperty({ type: () => User })
  owner?: User;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
