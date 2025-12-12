import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CasdoorCallbackDto {
  @ApiProperty({ example: 'authorization_code_here' })
  @IsString()
  code: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string;
}
