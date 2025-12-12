import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateWorkspaceDto } from './create-workspace.dto';
import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';

export class UpdateWorkspaceDto extends PartialType(CreateWorkspaceDto) {
  @ApiPropertyOptional({ example: 'My Workspace' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'my-workspace' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ enum: ['free', 'starter', 'pro', 'enterprise'] })
  @IsOptional()
  @IsEnum(['free', 'starter', 'pro', 'enterprise'])
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
}

export class AddMemberDto {
  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: ['admin', 'member'], default: 'member' })
  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: 'admin' | 'member';
}

export class UpdateMemberRoleDto {
  @ApiPropertyOptional({ enum: ['admin', 'member'] })
  @IsEnum(['admin', 'member'])
  role: 'admin' | 'member';
}
