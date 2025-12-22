import { Injectable } from '@nestjs/common';
import {
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import axios from 'axios';
import { BaseNodeExecutor } from '../base-node-executor';

@Injectable()
export class HttpRequestExecutor extends BaseNodeExecutor {
  constructor() {
    super();
  }

  protected async run(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { method, url, headers, body } = input.data;

      const response = await axios({
        method: method || 'GET',
        url,
        headers,
        data: body,
      });

      return {
        success: true,
        output: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
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
}
