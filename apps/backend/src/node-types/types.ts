export type NodeCategoryId =
  | 'trigger'
  | 'action'
  | 'logic'
  | 'transform'
  | 'data'
  | 'ai'
  | 'messaging'
  | 'integration';

export interface NodeCategory {
  id: NodeCategoryId;
  label: string;
  color?: string;
}

export type NodePropertyOption = { value: string; label: string } | string;

export type NodePropertyType =
  | 'string' // Text input with optional pattern validation (handles email, url, password via pattern)
  | 'text' // Multi-line text
  | 'number' // Numeric input
  | 'boolean' // True/false toggle
  | 'select' // Single choice from options
  | 'multi-select' // Multiple choices from options
  | 'json' // JSON object/array input
  | 'file' // Single file upload
  | 'files' // Multiple file upload
  | 'key-value' // Key-value pairs
  | 'dynamic-form' // Nested form structure
  | 'channel-select'; // Dynamic selection from available channels

export interface NodeProperty {
  // Core domain properties
  name: string; // Internal key (e.g. 'prompt', 'userId')
  label: string; // display name in the editor UI
  type: NodePropertyType;

  // Display & UX
  displayName?: string; // n8n-compatible display name
  description?: string; // Detailed tooltip/description
  helpText?: string; // Inline help text below the field
  placeholder?: string; // Input placeholder
  hint?: string; // Small hint text

  // Data Loading
  loadOptionsMethod?: string; // Backend method name to call for dynamic dropdowns
  noDataExpression?: boolean; // Disable variable interpolation for this field

  // Validation & defaults
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
  pattern?: string;
  validationRules?: Record<string, any>;

  // Options for select types
  options?: Array<NodePropertyOption> | string;

  // Conditional logic
  showWhen?: Record<string, any>;

  // Application logic
  isPublic?: boolean; // If true, this field is exposed to the end-user dynamic form

  // Nested structure for complex forms
  properties?: NodeProperty[];

  // Legacy/Compatibility fields (some kept for internal logic)
  multiple?: boolean;
  maxLength?: number;
  rows?: number;
  accept?: string;
  step?: number;
  credentialType?: string;
}

export interface NodeType {
  id: string;
  label: string;
  category: NodeCategoryId;
  color: string;
  description?: string;
  isPremium?: boolean;
  isActive?: boolean;
  isTrigger?: boolean;
  properties?: NodeProperty[];
  executor?: string;
  outputSchema?: Record<string, any>;
  sortOrder?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
