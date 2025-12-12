import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCredentialDto {
  @ApiProperty({ example: 'facebook' })
  @IsString()
  provider: string;

  @ApiProperty({ example: 'Production App', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Client ID (can use client_id or clientId)',
  })
  @Transform(({ obj }) => obj.clientId || obj.client_id)
  @IsString()
  clientId: string;

  @ApiProperty({
    example: 'secret-key-here',
    description: 'Client Secret (can use client_secret or clientSecret)',
  })
  @Transform(({ obj }) => obj.clientSecret || obj.client_secret)
  @IsString()
  clientSecret: string;

  @ApiProperty({ example: 'email,public_profile', required: false })
  @IsOptional()
  @IsString()
  scopes?: string;

  @ApiProperty({ example: true, required: false })
  @Transform(({ obj }) => obj.isActive ?? obj.is_active ?? true)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
