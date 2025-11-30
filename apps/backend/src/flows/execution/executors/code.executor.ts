import { Injectable } from '@nestjs/common';
import { NodeExecutor, NodeExecutionInput, NodeExecutionOutput } from '../node-executor.interface';
import * as vm from 'vm';

@Injectable()
export class CodeExecutor implements NodeExecutor {
    async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
        try {
            const { code } = input.data;
            const sandbox = {
                input: input.input,
                context: input.context,
                console: console, // Allow logging
                // Add other safe globals here
            };

            const script = new vm.Script(code);
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
                error: error.message,
            };
        }
    }
}
