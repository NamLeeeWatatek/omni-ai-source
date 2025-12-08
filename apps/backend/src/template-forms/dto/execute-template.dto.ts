import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNotEmpty } from 'class-validator';

export class ExecuteTemplateDto {
    @ApiProperty({
        description: 'Form data matching the template schema',
        example: {
            video_description: 'Create a 15-second product video',
            product_images: ['https://cdn.example.com/image1.jpg'],
            platforms: ['facebook', 'instagram'],
        },
    })
    @IsObject()
    @IsNotEmpty()
    inputData: Record<string, any>;
}
