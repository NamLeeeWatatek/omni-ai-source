import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Delete,
    Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TemplateFormsService } from './template-forms.service';
import { TemplateExecutionService } from './template-execution.service';
import { CreateTemplateFormDto } from './dto/create-template-form.dto';
import { UpdateTemplateFormDto } from './dto/update-template-form.dto';
import { ExecuteTemplateDto } from './dto/execute-template.dto';

@ApiTags('Template Forms')
@Controller({ path: 'template-forms', version: '1' })
export class TemplateFormsController {
    constructor(
        private readonly templateFormsService: TemplateFormsService,
        private readonly executionService: TemplateExecutionService,
    ) { }

    @Post()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Create template form (admin only)' })
    create(@Body() dto: CreateTemplateFormDto, @Request() req) {
        return this.templateFormsService.create(dto, req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all active template forms' })
    @ApiQuery({ name: 'category', required: false })
    findAll(@Query('category') category?: string) {
        return this.templateFormsService.findAll(category);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get template form by ID' })
    findOne(@Param('id') id: string) {
        return this.templateFormsService.findOne(id);
    }

    @Get(':id/schema')
    @ApiOperation({ summary: 'Get form schema for rendering' })
    getFormSchema(@Param('id') id: string) {
        return this.templateFormsService.getFormSchema(id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Update template form (admin only)' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateTemplateFormDto,
        @Request() req,
    ) {
        return this.templateFormsService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Delete template form (admin only)' })
    remove(@Param('id') id: string) {
        return this.templateFormsService.remove(id);
    }

    @Post(':id/execute')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Execute template with form data' })
    async execute(
        @Param('id') id: string,
        @Body() dto: ExecuteTemplateDto,
        @Request() req,
    ) {
        // Get workspace ID from user or use user ID as fallback
        const workspaceId = req.user.workspaceId || req.user.id;

        const result = await this.executionService.executeTemplate(
            id,
            dto,
            req.user.id,
            workspaceId,
        );

        return {
            flowId: result.flowId,
            executionId: result.executionId,
            message: 'Template execution started - flow created and will be executed',
        };
    }

    @Get('executions/:executionId')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get execution status' })
    getExecutionStatus(@Param('executionId') executionId: string) {
        return this.executionService.getExecutionStatus(executionId);
    }

    @Post('executions/:executionId/cancel')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Cancel execution' })
    async cancelExecution(@Param('executionId') executionId: string) {
        await this.executionService.cancelExecution(executionId);
        return {
            message: 'Execution cancelled successfully',
        };
    }

    @Get('history/user')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get execution history for current user' })
    @ApiQuery({ name: 'templateId', required: false })
    getHistory(@Request() req, @Query('templateId') templateId?: string) {
        return this.executionService.getExecutionHistory(req.user.id, templateId);
    }
}
