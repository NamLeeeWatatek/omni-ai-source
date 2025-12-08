import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsObject,
    IsArray,
} from 'class-validator';

export class CreateTemplateFormDto {
    @ApiProperty({ example: 'UGC Video Factory' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Create professional UGC-style video ads in minutes',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'video-generation' })
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiPropertyOptional({ example: 'Video' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiProperty({
        description: 'Array of form field definitions',
        example: [
            {
                id: 'product_images',
                type: 'image',
                label: 'Product Images',
                required: true,
            },
        ],
    })
    @IsArray()
    @IsNotEmpty()
    formSchema: any[];

    @ApiProperty({
        description: 'ID of the flow template to instantiate when this form is executed',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    flowTemplateId: string;

    @ApiProperty({
        description: 'Mapping from form field IDs to flow input parameter names',
        example: {
            video_description: 'prompt',
            product_images: 'images',
            platforms: 'platforms',
        },
    })
    @IsObject()
    @IsNotEmpty()
    inputMapping: Record<string, string>;

    @ApiPropertyOptional({
        description: 'UI customization options',
        example: {
            submitButtonText: 'Generate Video',
            successMessage: 'Your video has been created!',
        },
    })
    @IsObject()
    @IsOptional()
    uiConfig?: any;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
