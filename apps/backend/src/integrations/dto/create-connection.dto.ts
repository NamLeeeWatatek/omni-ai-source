import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateConnectionDto {
    @ApiProperty({ example: 'My Facebook Page' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'facebook' })
    @IsString()
    type: string;

    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    credentialId?: number;

    @ApiProperty({ example: 'EAABwz...', required: false })
    @IsOptional()
    @IsString()
    accessToken?: string;

    @ApiProperty({ example: 'refresh-token', required: false })
    @IsOptional()
    @IsString()
    refreshToken?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    metadata?: Record<string, any>;
}
