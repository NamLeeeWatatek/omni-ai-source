import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import * as vm from 'vm';

@Injectable()
export class CodeExecutor implements NodeExecutor {
  execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    return Promise.resolve(this.executeSync(input));
  }

  private executeSync(input: NodeExecutionInput): NodeExecutionOutput {
    try {
      const { code } = input.data;
      const sandbox = {
        input: input.input,
        context: input.context,
        console: console,
      };

      // Wrap user code in a function to allow return statements
      const wrappedCode = `
        (function() {
          ${code}
        })()
      `;

      const script = new vm.Script(wrappedCode);
      const context = vm.createContext(sandbox);
      const result = script.runInContext(context);

      return {
        success: true,
        output: result,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Code execution error: ${error.message}`,
      };
    }
  }
}
