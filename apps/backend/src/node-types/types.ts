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
  | 'dynamic-form'; // Nested form structure

// Domain-focused property schema - describes WHAT backend needs for dynamic forms,
// not HOW frontend should render it.

export interface NodeProperty {
  // Core domain properties
  name: string; // Field identifier (required)
  label: string; // Human readable label (required)
  type: NodePropertyType; // Data type (required)

  // Validation & constraints
  required?: boolean; // Field required flag
  default?: any; // Default value
  min?: number; // Min value/characters
  max?: number; // Max value/characters
  pattern?: string; // Validation regex pattern

  // Options for select types
  options?: Array<NodePropertyOption> | string; // Static options or dynamic source

  // Conditional logic
  showWhen?: Record<string, any>; // Show/hide conditions

  // Nested structure for complex forms
  properties?: NodeProperty[]; // Nested properties for dynamic-form type

  // Documentation (shows in UI but domain-level)
  description?: string; // Field description/tooltip

  // Legacy UI props (deprecated - frontend should infer)
  // @deprecated Use type 'files' instead of multiple=true
  // @deprecated Frontend determines UI hints, mime types, etc.
  multiple?: boolean;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  helpText?: string;
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
