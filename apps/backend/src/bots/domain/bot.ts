import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Workspace } from '../../workspaces/domain/workspace';

export class Bot {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String })
  description?: string | null;

  @ApiPropertyOptional({ type: String, default: 'FiMessageSquare' })
  icon?: string;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: String })
  flowId?: string | null;

  @ApiProperty({ type: () => Workspace })
  workspace?: Workspace;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class FlowVersion {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  botId: string;

  @ApiProperty({ type: Number })
  version: number;

  @ApiProperty({ type: Object })
  flow: Record<string, any>;

  @ApiProperty({ type: Boolean, default: false })
  isPublished: boolean;

  @ApiProperty({ type: () => Bot })
  bot?: Bot;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
