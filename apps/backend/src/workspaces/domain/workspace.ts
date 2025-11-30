import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';

export class Workspace {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  slug: string;

  @ApiProperty({ type: String })
  ownerId: string;

  @ApiProperty({ type: () => User })
  owner?: User;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WorkspaceMember {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String, enum: ['owner', 'admin', 'member'] })
  role: string;

  @ApiProperty({ type: () => Workspace })
  workspace?: Workspace;

  @ApiProperty({ type: () => User })
  user?: User;

  @ApiProperty()
  createdAt: Date;
}
