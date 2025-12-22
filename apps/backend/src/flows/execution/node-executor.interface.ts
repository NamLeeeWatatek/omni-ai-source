/**
 * Input for node execution
 */
export interface NodeExecutionInput {
  nodeId: string;
  nodeType: string;
  data: Record<string, any>;
  input: any;
  context: {
    executionId: string;
    flowId: string;
    workspaceId?: string;
    flowExecutionId?: string;
    results?: Record<string, any>;
  };
}

/**
 * Output from node execution
 */
export interface NodeExecutionOutput {
  success: boolean;
  output: any;
  error?: string;
}

/**
 * Interface for node executors
 */
export interface NodeExecutor {
  execute(input: NodeExecutionInput): Promise<NodeExecutionOutput>;
}
