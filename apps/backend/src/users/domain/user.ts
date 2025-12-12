import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'john.doe@example.com' })
  email: string | null;

  @ApiProperty({ type: String, example: 'John Doe' })
  name: string | null;

  @ApiPropertyOptional({ type: String, description: 'Avatar URL' })
  avatarUrl?: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @Exclude({ toPlainOnly: true })
  previousPassword?: string;

  @ApiProperty({ type: String, example: 'email' })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiPropertyOptional({ type: String, example: '1234567890' })
  @Expose({ groups: ['me', 'admin'] })
  providerId?: string | null;

  @ApiPropertyOptional({ type: Date, description: 'Email verified timestamp' })
  @Expose({ groups: ['me', 'admin'] })
  emailVerifiedAt?: Date | null;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    description: 'User role',
  })
  role: 'admin' | 'user';

  @ApiPropertyOptional({ type: String, deprecated: true })
  firstName?: string | null;

  @ApiPropertyOptional({ type: String, deprecated: true })
  lastName?: string | null;

  @ApiPropertyOptional({ type: String, deprecated: true })
  socialId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Casdoor external ID' })
  externalId?: string | null;

  @ApiPropertyOptional({ type: String, description: 'Casdoor user ID' })
  casdoorId?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Custom permissions' })
  permissions?: Record<string, any>;

  @ApiPropertyOptional({ type: Date, description: 'Last login timestamp' })
  lastLogin?: Date | null;

  @ApiPropertyOptional({ type: Number, default: 0 })
  failedLoginAttempts?: number;

  @ApiPropertyOptional({ type: Date })
  lockedUntil?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;
}
