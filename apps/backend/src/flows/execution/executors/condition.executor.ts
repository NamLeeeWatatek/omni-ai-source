import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';

@Injectable()
export class ConditionExecutor implements NodeExecutor {
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { conditions } = input.data;
      // Simple evaluation: check if any condition matches
      // This is a placeholder for a more complex rule engine

      // Example condition structure: { field: 'input.value', operator: 'equals', value: 'foo' }
      // For now, let's assume a simple boolean expression or just return true/false based on a field

      let result = false;

      // Mock logic for now as the dynamic form structure isn't fully defined
      // In a real app, we'd parse the conditions array and evaluate against input

      if (conditions && Array.isArray(conditions)) {
        // Implement simple AND logic
        result = conditions.every((condition) =>
          this.evaluate(condition, input.input),
        );
      } else {
        // Fallback or default behavior
        result = true;
      }

      return {
        success: true,
        output: {
          result,
          branch: result ? 'true' : 'false', // Standard output for condition node
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error.message,
      };
    }
  }

  private evaluate(condition: any, input: any): boolean {
    // Placeholder evaluation logic
    // const value = this.getValue(condition.field, input);
    // switch(condition.operator) { ... }
    return true;
  }
}
