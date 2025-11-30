import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { FileType } from '../../files/domain/file';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @Exclude({ toPlainOnly: true })
  previousPassword?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiPropertyOptional({
    type: String,
    example: '1234567890',
  })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiPropertyOptional({
    type: () => FileType,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  // WataOmi specific fields
  @ApiPropertyOptional({
    type: String,
    description: 'Casdoor external ID',
  })
  externalId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Casdoor user ID',
  })
  casdoorId?: string | null;

  @ApiPropertyOptional({
    type: String,
    description: 'User avatar URL',
  })
  avatar?: string | null;

  @ApiPropertyOptional({
    type: Object,
    description: 'Custom permissions',
  })
  permissions?: Record<string, any>;

  @ApiPropertyOptional({
    type: Date,
    description: 'Last login timestamp',
  })
  lastLogin?: Date | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Failed login attempts count',
    default: 0,
  })
  failedLoginAttempts?: number;

  @ApiPropertyOptional({
    type: Date,
    description: 'Account locked until timestamp',
  })
  lockedUntil?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
