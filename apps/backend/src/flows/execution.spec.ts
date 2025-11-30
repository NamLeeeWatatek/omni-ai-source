import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './execution.service';
import { ExecutionGateway } from './execution.gateway';
import { NodeExecutorStrategy } from './execution/node-executor.strategy';
import { HttpRequestExecutor } from './execution/executors/http-request.executor';
import { CodeExecutor } from './execution/executors/code.executor';
import { AIChatExecutor } from './execution/executors/ai-chat.executor';
import { ConditionExecutor } from './execution/executors/condition.executor';
import { ConfigService } from '@nestjs/config';

// Mock Gateway
const mockGateway = {
  emitExecutionStart: jest.fn(),
  emitExecutionProgress: jest.fn(),
  emitExecutionComplete: jest.fn(),
  emitExecutionError: jest.fn(),
  emitNodeExecutionStart: jest.fn(),
  emitNodeExecutionComplete: jest.fn(),
  emitNodeExecutionError: jest.fn(),
};

// Mock Config
const mockConfig = {
  get: jest.fn().mockReturnValue('mock-api-key'),
};

describe('Execution Verification', () => {
  let service: ExecutionService;
  let strategy: NodeExecutorStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        { provide: ExecutionGateway, useValue: mockGateway },
        NodeExecutorStrategy,
        HttpRequestExecutor,
        CodeExecutor,
        AIChatExecutor,
        ConditionExecutor,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
    strategy = module.get<NodeExecutorStrategy>(NodeExecutorStrategy);
    const http = module.get<HttpRequestExecutor>(HttpRequestExecutor);
    const code = module.get<CodeExecutor>(CodeExecutor);
    const ai = module.get<AIChatExecutor>(AIChatExecutor);
    const condition = module.get<ConditionExecutor>(ConditionExecutor);

    // Register executors
    strategy.register('http-request', http);
    strategy.register('code', code);
    strategy.register('ai-chat', ai);
    strategy.register('condition', condition);
    strategy.register('webhook', {
      execute: async (input) => ({ success: true, output: input.input }),
    });
  });

  it('should execute a simple flow with Code node', async () => {
    try {
      const flowData = {
        nodes: [
          { id: '1', type: 'webhook', data: {} },
          {
            id: '2',
            type: 'code',
            data: { code: '({ result: input.value * 2 })' },
          },
        ],
        edges: [{ source: '1', target: '2' }],
      };

      const inputData = { value: 5 };
      const executionId = await service.executeFlow(
        'test-flow',
        flowData,
        inputData,
      );

      // Wait for execution to finish (it's async)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const execution = service.getExecution(executionId);
      const fs = require('fs');
      fs.writeFileSync('test_debug.json', JSON.stringify(execution, null, 2));

      if (!execution) {
        throw new Error('Execution not found');
      }

      if (execution.status === 'failed') {
        throw new Error(`Execution failed: ${execution.error}`);
      }

      expect(execution.status).toBe('completed');
      expect(execution.result).toEqual({ result: 10 });
      expect(mockGateway.emitExecutionComplete).toHaveBeenCalled();
    } catch (error) {
      const fs = require('fs');
      fs.writeFileSync('test_error.log', error.message + '\n' + error.stack);
      throw error;
    }
  });
});
