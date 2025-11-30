import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowNode {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  position: { x: number; y: number };

  @ApiProperty()
  data: Record<string, any>;
}

export class WorkflowEdge {
  @ApiProperty()
  id: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  target: string;

  @ApiPropertyOptional()
  sourceHandle?: string;

  @ApiPropertyOptional()
  targetHandle?: string;
}

export class Template {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  thumbnail?: string | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  isPremium: boolean;

  @ApiProperty()
  usageCount: number;

  @ApiProperty({ type: [WorkflowNode] })
  nodes: WorkflowNode[];

  @ApiProperty({ type: [WorkflowEdge] })
  edges: WorkflowEdge[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TemplateCategory {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  icon: string;
}
