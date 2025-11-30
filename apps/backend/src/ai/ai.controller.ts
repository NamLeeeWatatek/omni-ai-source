import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller({
    path: 'ai',
    version: '1',
})
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('models')
    @ApiOperation({ summary: 'Get supported AI models' })
    getModels() {
        return this.aiService.getModels();
    }
}
