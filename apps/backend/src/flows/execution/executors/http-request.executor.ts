import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import axios from 'axios';

@Injectable()
export class HttpRequestExecutor implements NodeExecutor {
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const { method, url, headers, body } = input.data;

      const response = await axios({
        method,
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
