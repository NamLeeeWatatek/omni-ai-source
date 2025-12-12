import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';

@Injectable()
export class ConditionExecutor implements NodeExecutor {
  execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    return Promise.resolve(this.executeSync(input));
  }

  private executeSync(input: NodeExecutionInput): NodeExecutionOutput {
    try {
      const { conditions } = input.data;

      let result = false;

      if (conditions && Array.isArray(conditions)) {
        result = conditions.every(() => this.evaluate());
      } else {
        result = true;
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

  private evaluate(): boolean {
    return true;
  }
}
