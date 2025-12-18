import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExecutionArtifactService } from './services/execution-artifact.service';
import { ExecutionService } from './execution.service';

@ApiTags('Execution Artifacts')
@Controller({ path: 'execution-artifacts', version: '1' })
export class ExecutionArtifactsController {
  constructor(
    private readonly artifactService: ExecutionArtifactService,
    private readonly executionService: ExecutionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get artifacts by execution ID' })
  @ApiQuery({ name: 'execution_id', required: true })
  async findByExecutionId(@Query('execution_id') executionId: string) {
    // Find the FlowExecutionEntity by executionId string to get the UUID
    const execution = await this.executionService.findByExecutionId(executionId);
    if (!execution) {
      return [];
    }

    const artifacts = await this.artifactService.getArtifactsWithUrls(execution.id);
    return artifacts.map(artifact => ({
      id: artifact.id,
      execution_id: artifact.executionId,
      file_id: artifact.fileId,
      artifact_type: artifact.artifactType,
      name: artifact.name,
      description: artifact.description,
      metadata: artifact.metadata,
      size: artifact.size,
      mime_type: artifact.mimeType,
      download_url: artifact.downloadUrl,
      created_at: artifact.createdAt,
      updated_at: artifact.updatedAt,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get artifact by ID' })
  async findOne(@Param('id') id: string) {
    const artifact = await this.artifactService.findOne(id);
    if (!artifact) {
      return { error: 'Artifact not found' };
    }

    const downloadUrl = await this.artifactService.getArtifactDownloadUrl(id);

    return {
      id: artifact.id,
      execution_id: artifact.executionId,
      file_id: artifact.fileId,
      artifact_type: artifact.artifactType,
      name: artifact.name,
      description: artifact.description,
      metadata: artifact.metadata,
      size: artifact.size,
      mime_type: artifact.mimeType,
      download_url: downloadUrl,
      created_at: artifact.createdAt,
      updated_at: artifact.updatedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete artifact' })
  async delete(@Param('id') id: string) {
    await this.artifactService.deleteArtifact(id);
    return { success: true };
  }
}
