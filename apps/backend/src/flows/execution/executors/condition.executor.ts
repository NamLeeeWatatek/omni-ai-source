import { Injectable } from '@nestjs/common';
import {
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import { BaseNodeExecutor } from '../base-node-executor';

@Injectable()
export class ConditionExecutor extends BaseNodeExecutor {
  protected async run(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { conditions, logicalOperator = 'AND' } = input.data;

      if (
        !conditions ||
        !Array.isArray(conditions) ||
        conditions.length === 0
      ) {
        return {
          success: true,
          output: { result: true, branch: 'true' },
        };
      }

      let result = logicalOperator === 'AND';

      for (const condition of conditions) {
        const branchResult = this.evaluateCondition(condition);

        if (logicalOperator === 'AND') {
          result = result && branchResult;
          if (!result) break; // Early exit
        } else {
          result = result || branchResult;
          if (result) break; // Early exit
        }
      }

      return {
        success: true,
        output: {
          result,
          branch: result ? 'true' : 'false',
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

  private evaluateCondition(condition: any): boolean {
    const { variable, operator, value } = condition;

    // Ensure we handle different types safely
    const val1 = variable;
    const val2 = value;

    switch (operator) {
      case 'equals':
        return String(val1) === String(val2);
      case 'not_equals':
        return String(val1) !== String(val2);
      case 'contains':
        return String(val1).toLowerCase().includes(String(val2).toLowerCase());
      case 'not_contains':
        return !String(val1).toLowerCase().includes(String(val2).toLowerCase());
      case 'greater_than':
        return Number(val1) > Number(val2);
      case 'less_than':
        return Number(val1) < Number(val2);
      case 'exists':
        return val1 !== undefined && val1 !== null && val1 !== '';
      case 'not_exists':
        return val1 === undefined || val1 === null || val1 === '';
      default:
        return false;
    }
  }
}
