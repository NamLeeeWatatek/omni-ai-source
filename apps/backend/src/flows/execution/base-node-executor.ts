import {
  NodeExecutionInput,
  NodeExecutionOutput,
  NodeExecutor,
} from './node-executor.interface';

/**
 * Base class for all node executors.
 * Automatically handles property resolution (interpolating {{variables}}).
 */
export abstract class BaseNodeExecutor implements NodeExecutor {
  /**
   * Main entry point for node execution.
   * Handles pre-processing (resolution) and post-processing.
   */
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      // 1. Resolve variables in input data using global results context if available
      const interpolationContext = input.context?.results || input.input;
      const resolvedData = this.resolveProperties(
        input.data,
        interpolationContext,
      );

      // 2. Execute the actual node logic with resolved data
      return await this.run({
        ...input,
        data: resolvedData,
      });
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Node execution failed: ${error.message}`,
      };
    }
  }

  /**
   * Children must implement this instead of execute()
   */
  protected abstract run(
    input: NodeExecutionInput,
  ): Promise<NodeExecutionOutput>;

  /**
   * Recursively resolve {{variable}} expressions in properties
   */
  private resolveProperties(data: any, context: any): any {
    if (typeof data === 'string') {
      return this.interpolate(data, context);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.resolveProperties(item, context));
    }

    if (data !== null && typeof data === 'object') {
      const resolved: any = {};
      for (const key in data) {
        resolved[key] = this.resolveProperties(data[key], context);
      }
      return resolved;
    }

    return data;
  }

  /**
   * Helper to interpolate string with context variables
   */
  private interpolate(template: string, data: any): string {
    if (!template || typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        if (value === undefined || value === null) break;
        value = value[k];
      }

      return value !== undefined ? value : match;
    });
  }
}
