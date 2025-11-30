import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFlowFromTemplateDto {
  @ApiProperty({ example: 'welcome-message' })
  @IsNotEmpty()
  @IsString()
  templateId: string;

  @ApiProperty({ example: 'My Welcome Flow' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Custom welcome flow for new users' })
  @IsOptional()
  @IsString()
  description?: string;
}
