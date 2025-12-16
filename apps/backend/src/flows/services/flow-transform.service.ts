import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  PublicFlowDto,
  DetailedFlowDto,
  UGCTemplateDto,
} from '../dto/public-flow.dto';
import { NodeTypesService } from '../../node-types/node-types.service';

/**
 * Service for transforming Flow entities to clean DTOs
 * Removes unnecessary fields and ensures consistent API responses
 */
@Injectable()
export class FlowTransformService {
  constructor(private readonly nodeTypesService: NodeTypesService) {}
  /**
   * Transform flow to public DTO (minimal data for listing)
   */
  toPublicDto(flow: any): PublicFlowDto {
    return plainToInstance(PublicFlowDto, flow, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  /**
   * Transform flow to detailed DTO (includes nodes and edges)
   */
  async toDetailedDto(flow: any): Promise<DetailedFlowDto> {
    const dto = plainToInstance(DetailedFlowDto, flow, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    // Ensure nodes and edges are arrays
    const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
    const edges = Array.isArray(flow.edges) ? flow.edges : [];

    // Check if this flow has properties (for UGC factory flows)
    const flowHasProperties =
      flow.properties &&
      Array.isArray(flow.properties) &&
      flow.properties.length > 0;

    // Enrich nodes with node type properties
    const enrichedNodes = await Promise.all(
      nodes.map(async (node: any) => {
        try {
          const nodeType = await this.nodeTypesService.findOne(node.type);
          let nodeProperties = nodeType?.properties || [];

          // For UGC factory flows with manual trigger, use flow-level properties instead
          if (node.type === 'manual' && flowHasProperties) {
            nodeProperties = flow.properties;
          }

          if (nodeType || flowHasProperties) {
            return {
              ...node,
              properties: nodeProperties, // Add properties for frontend mapping
              nodeTypeInfo: nodeType
                ? {
                    id: nodeType.id,
                    label: nodeType.label,
                    category: nodeType.category,
                    color: nodeType.color,
                    description: nodeType.description,
                  }
                : undefined,
            };
          }
        } catch (error) {
          // Node type not found, continue without enrichment
          console.warn(`Node type ${node.type} not found for enrichment`);
        }
        return node;
      }),
    );

    dto.nodes = enrichedNodes;
    dto.edges = edges;

    // For backward compatibility, data field uses original nodes without enrichment to avoid duplication
    dto.data = {
      nodes: nodes,
      edges: edges,
    };

    return dto;
  }

  /**
   * Transform flow to UGC template DTO (for marketplace)
   */
  toUGCTemplateDto(flow: any): UGCTemplateDto {
    return plainToInstance(UGCTemplateDto, flow, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  /**
   * Transform array of flows to public DTOs
   */
  toPublicDtoArray(flows: any[]): PublicFlowDto[] {
    return flows.map((flow) => this.toPublicDto(flow));
  }

  /**
   * Transform array of flows to UGC template DTOs
   */
  toUGCTemplateDtoArray(flows: any[]): UGCTemplateDto[] {
    return flows.map((flow) => this.toUGCTemplateDto(flow));
  }

  /**
   * Validate and clean formSchema
   * Removes any invalid or unnecessary fields from formSchema
   */
  cleanFormSchema(formSchema: any): any {
    if (!formSchema || !formSchema.steps) {
      return null;
    }

    return {
      title: formSchema.title,
      description: formSchema.description,
      submitButtonText: formSchema.submitButtonText || 'Submit',
      steps: formSchema.steps.map((step: any) => ({
        id: step.id,
        label: step.label,
        description: step.description,
        fields: step.fields.map((field: any) => this.cleanFormField(field)),
      })),
    };
  }

  /**
   * Clean individual form field
   */
  private cleanFormField(field: any): any {
    const cleaned: any = {
      id: field.id,
      type: field.type,
      label: field.label,
      required: field.required ?? false,
    };

    // Optional fields
    if (field.placeholder) cleaned.placeholder = field.placeholder;
    if (field.helperText) cleaned.helperText = field.helperText;
    if (field.defaultValue !== undefined)
      cleaned.defaultValue = field.defaultValue;
    if (field.min !== undefined) cleaned.min = field.min;
    if (field.max !== undefined) cleaned.max = field.max;
    if (field.step !== undefined) cleaned.step = field.step;
    if (field.rows !== undefined) cleaned.rows = field.rows;
    if (field.pattern) cleaned.pattern = field.pattern;
    if (field.validationMessage)
      cleaned.validationMessage = field.validationMessage;

    // Clean options for select/radio/checkbox
    if (field.options && Array.isArray(field.options)) {
      cleaned.options = field.options
        .filter((opt: any) => opt.value && opt.label)
        .map((opt: any) => ({
          value: opt.value,
          label: opt.label,
        }));
    }

    return cleaned;
  }
}
