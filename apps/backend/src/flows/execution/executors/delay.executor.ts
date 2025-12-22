import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';

@Injectable()
export class DelayExecutor implements NodeExecutor {
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { duration } = input.data || {};
      const delayMs = (duration || 5) * 1000; // Convert seconds to milliseconds

      console.log(`DelayExecutor: Delaying for ${delayMs}ms`);

      // Wait for the specified duration
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return {
        success: true,
        output: {
          ...input.input,
          delay: {
            duration: duration || 5,
            executedAt: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Delay execution failed: ${error.message}`,
      };
    }
  }
}
