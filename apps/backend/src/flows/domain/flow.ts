import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type FlowStatus = 'draft' | 'published' | 'archived';

export type FlowVisibility = 'private' | 'team' | 'public';

export class FlowNode {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string; // Reference to NodeType.id

  @ApiProperty()
  position: { x: number; y: number };

  @ApiPropertyOptional()
  data?: Record<string, any>; // User input data for this node instance
}

export class FlowEdge {
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

export class Flow {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: ['draft', 'published', 'archived'] })
  status: FlowStatus;

  @ApiProperty({ default: 1 })
  version: number;

  @ApiProperty({ type: [FlowNode], default: [] })
  nodes: FlowNode[];

  @ApiProperty({ type: [FlowEdge], default: [] })
  edges: FlowEdge[];

  @ApiPropertyOptional()
  ownerId?: string | null;

  @ApiProperty({ default: 'private' })
  visibility: FlowVisibility;

  @ApiPropertyOptional()
  tags?: string[] | null;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  icon?: string | null;

  @ApiPropertyOptional()
  teamId?: string | null;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;

  constructor(data: Partial<Flow>) {
    Object.assign(this, data);
  }

  /**
   * Check if flow is published (status = 'published')
   */
  isPublished(): boolean {
    return this.status === 'published';
  }

  /**
   * Check if flow is draft
   */
  isDraft(): boolean {
    return this.status === 'draft';
  }

  /**
   * Check if flow is archived
   */
  isArchived(): boolean {
    return this.status === 'archived';
  }

  /**
   * Mark flow as published
   */
  publish(): void {
    this.status = 'published';
  }

  /**
   * Mark flow as draft
   */
  draft(): void {
    this.status = 'draft';
  }

  /**
   * Mark flow as archived
   */
  archive(): void {
    this.status = 'archived';
  }

  /**
   * Check if user is owner
   */
  isOwner(userId: string): boolean {
    return this.ownerId === userId;
  }

  /**
   * Check visibility permissions
   */
  canView(userId?: string): boolean {
    if (this.visibility === 'public') return true;
    if (this.visibility === 'private') return this.isOwner(userId || '');
    // Team visibility logic would go here
    return false;
  }

  /**
   * Update flow data
   */
  update(data: Partial<Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.status !== undefined) this.status = data.status;
    if (data.visibility !== undefined) this.visibility = data.visibility;
    if (data.tags !== undefined) this.tags = data.tags;
    if (data.category !== undefined) this.category = data.category;
    if (data.icon !== undefined) this.icon = data.icon;
    if (data.teamId !== undefined) this.teamId = data.teamId;
    if (data.nodes !== undefined) this.nodes = data.nodes;
    if (data.edges !== undefined) this.edges = data.edges;
  }
}

export type FlowCreateData = {
  name: string;
  description?: string | null;
  status: FlowStatus;
  nodes: FlowNode[];
  edges: FlowEdge[];
  ownerId?: string | null;
  visibility: FlowVisibility;
  tags?: string[] | null;
  category?: string | null;
  icon?: string | null;
  teamId?: string | null;
};
export type FlowUpdateData = Partial<
  Omit<Flow, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
>;
