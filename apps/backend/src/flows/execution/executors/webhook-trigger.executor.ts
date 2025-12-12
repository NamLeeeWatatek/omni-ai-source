import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import axios, { AxiosRequestConfig, Method } from 'axios';

/**
 * Webhook Trigger Executor
 * Supports calling external webhooks (n8n, Zapier, Make, custom webhooks)
 * and receiving/processing the response data
 */
@Injectable()
export class WebhookTriggerExecutor implements NodeExecutor {
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const {
        webhookUrl,
        method = 'POST',
        headers = {},
        payload,
        payloadType = 'json', // json, form-data, raw
        authentication,
        timeout = 30000,
        retryCount = 0,
        retryDelay = 1000,
        responseMapping,
      } = input.data;

      // Build the request payload from previous node output or custom payload
      const requestPayload = this.buildPayload(
        payload,
        input.input,
        payloadType,
      );

      // Build headers with authentication
      const requestHeaders = this.buildHeaders(
        headers,
        authentication,
        payloadType,
      );

      const config: AxiosRequestConfig = {
        method: method as Method,
        url: this.interpolateVariables(webhookUrl, input.input),
        headers: requestHeaders,
        data: requestPayload,
        timeout,
        validateStatus: () => true, // Accept all status codes
      };

      // Execute with retry logic
      const response = await this.executeWithRetry(
        config,
        retryCount,
        retryDelay,
      );

      // Process and map response data
      const processedOutput = this.processResponse(
        response,
        responseMapping,
        input.input,
      );

      return {
        success: response.status >= 200 && response.status < 300,
        output: processedOutput,
        error:
          response.status >= 400
            ? `HTTP ${response.status}: ${response.statusText}`
            : undefined,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error.message,
      };
    }
  }

  /**
   * Build payload based on type and interpolate variables
   */
  private buildPayload(
    payload: any,
    previousOutput: any,
    payloadType: string,
  ): any {
    // If no custom payload, use previous node output
    if (!payload || Object.keys(payload).length === 0) {
      return previousOutput;
    }

    // Interpolate variables in payload
    const interpolatedPayload = this.interpolateObject(payload, previousOutput);

    if (payloadType === 'form-data') {
      const formData = new FormData();
      Object.entries(interpolatedPayload).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      return formData;
    }

    return interpolatedPayload;
  }

  /**
   * Build headers with authentication support
   */
  private buildHeaders(
    customHeaders: Record<string, string>,
    authentication: any,
    payloadType: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...customHeaders,
    };

    // Set content type based on payload type
    if (payloadType === 'json' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authentication
    if (authentication) {
      switch (authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${authentication.token}`;
          break;
        case 'basic':
          const base64 = Buffer.from(
            `${authentication.username}:${authentication.password}`,
          ).toString('base64');
          headers['Authorization'] = `Basic ${base64}`;
          break;
        case 'api-key':
          if (authentication.placement === 'header') {
            headers[authentication.keyName || 'X-API-Key'] = authentication.key;
          }
          break;
        case 'custom':
          headers[authentication.headerName] = authentication.headerValue;
          break;
      }
    }

    return headers;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    config: AxiosRequestConfig,
    retryCount: number,
    retryDelay: number,
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await axios(config);
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < retryCount) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Process response and apply mapping
   */
  private processResponse(
    response: any,
    responseMapping: any,
    previousInput: any,
  ): any {
    const baseOutput = {
      _meta: {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
        timestamp: new Date().toISOString(),
      },
      data: response.data,
      previousInput,
    };

    // If no mapping, return full response
    if (!responseMapping || Object.keys(responseMapping).length === 0) {
      return baseOutput;
    }

    // Apply custom mapping
    const mappedOutput: Record<string, any> = {
      _meta: baseOutput._meta,
    };

    Object.entries(responseMapping).forEach(([outputKey, sourcePath]) => {
      mappedOutput[outputKey] = this.getValueByPath(
        response.data,
        sourcePath as string,
      );
    });

    return mappedOutput;
  }

  /**
   * Interpolate variables in a string template
   * Supports: {{variable}}, {{nested.path}}, {{$input.field}}
   */
  private interpolateVariables(template: string, data: any): string {
    if (!template || typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();

      // Handle special prefixes
      if (trimmedPath.startsWith('$input.')) {
        return this.getValueByPath(data, trimmedPath.substring(7)) ?? match;
      }
      if (trimmedPath.startsWith('$env.')) {
        return process.env[trimmedPath.substring(5)] ?? match;
      }

      return this.getValueByPath(data, trimmedPath) ?? match;
    });
  }

  /**
   * Recursively interpolate variables in an object
   */
  private interpolateObject(obj: any, data: any): any {
    if (typeof obj === 'string') {
      return this.interpolateVariables(obj, data);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateObject(item, data));
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, any> = {};
      Object.entries(obj).forEach(([key, value]) => {
        result[key] = this.interpolateObject(value, data);
      });
      return result;
    }

    return obj;
  }

  /**
   * Get value from object by dot-notation path
   */
  private getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      if (value == null) return undefined;
      // Support array indexing: items[0]
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        value = value[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        value = value[key];
      }
    }

    return value;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
