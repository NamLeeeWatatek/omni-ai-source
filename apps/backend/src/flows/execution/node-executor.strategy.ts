import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { NodeExecutor, NodeExecutionInput, NodeExecutionOutput } from './node-executor.interface';

@Injectable()
export class NodeExecutorStrategy {
    private executors = new Map<string, NodeExecutor>();

    constructor(private moduleRef: ModuleRef) { }

    register(type: string, executor: NodeExecutor) {
        this.executors.set(type, executor);
    }

    async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
        const executor = this.executors.get(input.nodeType);
        if (!executor) {
            throw new Error(`No executor found for node type: ${input.nodeType}`);
        }
        return executor.execute(input);
    }
}
