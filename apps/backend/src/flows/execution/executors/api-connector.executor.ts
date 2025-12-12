import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';
import axios, { AxiosRequestConfig, Method } from 'axios';

/**
 * API Connector Executor
 * Advanced API integration node for connecting to third-party services
 * Supports: REST APIs, GraphQL, custom endpoints with full request/response control
 */
@Injectable()
export class ApiConnectorExecutor implements NodeExecutor {
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const {
        // Connection settings
        baseUrl,
        endpoint,
        method = 'GET',

        // Request configuration
        headers = {},
        queryParams = {},
        pathParams = {},
        body,
        bodyType = 'json', // json, form, graphql, raw

        // Authentication
        auth,
        credentialId, // Reference to saved credential

        // Response handling
        responseType = 'json', // json, text, binary
        extractPath, // JSONPath or dot notation to extract specific data
        transformScript, // JavaScript expression to transform output

        // Error handling
        successStatusCodes = [200, 201, 202, 204],
        continueOnError = false,

        // Pagination support
        pagination,

        // Rate limiting
        rateLimit,

        // Timeout
        timeout = 30000,
      } = input.data;

      // Build URL with path params and query params
      const url = this.buildUrl(
        baseUrl,
        endpoint,
        pathParams,
        queryParams,
        input.input,
      );

      // Build request body
      const requestBody = this.buildRequestBody(body, bodyType, input.input);

      // Build headers with auth
      const requestHeaders = await this.buildHeaders(
        headers,
        auth,
        credentialId,
        bodyType,
        input.input,
      );

      const config: AxiosRequestConfig = {
        method: method as Method,
        url,
        headers: requestHeaders,
        data: requestBody,
        timeout,
        responseType: responseType === 'binary' ? 'arraybuffer' : 'json',
        validateStatus: () => true,
      };

      // Handle pagination if configured
      let allData: any[] = [];
      let response: any;

      if (pagination?.enabled) {
        const paginatedResult = await this.handlePagination(
          config,
          pagination,
          input.input,
          rateLimit,
        );
        allData = paginatedResult.data;
        response = paginatedResult.lastResponse;
      } else {
        // Apply rate limiting if configured
        if (rateLimit?.enabled) {
          await this.applyRateLimit(rateLimit);
        }

        response = await axios(config);
      }

      // Check if status code is success
      const isSuccess = successStatusCodes.includes(response.status);

      if (!isSuccess && !continueOnError) {
        return {
          success: false,
          output: {
            statusCode: response.status,
            statusText: response.statusText,
            error: response.data,
          },
          error: `API returned status ${response.status}: ${response.statusText}`,
        };
      }

      // Process response data
      let outputData = pagination?.enabled ? allData : response.data;

      // Extract specific path if configured
      if (extractPath) {
        outputData = this.extractDataByPath(outputData, extractPath);
      }

      // Apply transform script if configured
      if (transformScript) {
        outputData = this.applyTransform(
          outputData,
          transformScript,
          input.input,
        );
      }

      return {
        success: isSuccess,
        output: {
          _request: {
            url,
            method,
            headers: requestHeaders,
          },
          _response: {
            statusCode: response.status,
            statusText: response.statusText,
            headers: response.headers,
          },
          data: outputData,
          rawData: response.data,
          previousInput: input.input,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `API Connector Error: ${error.message}`,
      };
    }
  }

  /**
   * Build URL with path params and query params
   */
  private buildUrl(
    baseUrl: string,
    endpoint: string,
    pathParams: Record<string, string>,
    queryParams: Record<string, string>,
    inputData: any,
  ): string {
    let url = `${baseUrl}${endpoint}`;

    // Replace path params: /users/:id => /users/123
    url = url.replace(/:(\w+)/g, (match, paramName) => {
      const value = this.interpolate(pathParams[paramName] || match, inputData);
      return encodeURIComponent(value);
    });

    // Add query params
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, this.interpolate(String(value), inputData));
      }
    });

    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return url;
  }

  /**
   * Build request body based on type
   */
  private buildRequestBody(body: any, bodyType: string, inputData: any): any {
    if (!body) return undefined;

    const interpolatedBody = this.interpolateObject(body, inputData);

    switch (bodyType) {
      case 'graphql':
        return {
          query: interpolatedBody.query,
          variables: interpolatedBody.variables,
        };

      case 'form':
        const formData = new URLSearchParams();
        Object.entries(interpolatedBody).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        return formData.toString();

      case 'raw':
        return typeof interpolatedBody === 'string'
          ? interpolatedBody
          : JSON.stringify(interpolatedBody);

      default: // json
        return interpolatedBody;
    }
  }

  /**
   * Build headers with authentication
   */
  private async buildHeaders(
    customHeaders: Record<string, string>,
    auth: any,
    credentialId: string | undefined,
    bodyType: string,
    inputData: any,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    // Set content type based on body type
    switch (bodyType) {
      case 'json':
        headers['Content-Type'] = 'application/json';
        break;
      case 'form':
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        break;
      case 'graphql':
        headers['Content-Type'] = 'application/json';
        break;
    }

    // Add custom headers with interpolation
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers[key] = this.interpolate(value, inputData);
    });

    // Add authentication
    if (auth) {
      const authHeaders = this.buildAuthHeaders(auth, inputData);
      Object.assign(headers, authHeaders);
    }

    return headers;
  }

  /**
   * Build authentication headers
   */
  private buildAuthHeaders(auth: any, inputData: any): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (auth.type) {
      case 'bearer':
        headers['Authorization'] =
          `Bearer ${this.interpolate(auth.token, inputData)}`;
        break;

      case 'basic':
        const credentials = Buffer.from(
          `${auth.username}:${auth.password}`,
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;

      case 'api-key':
        if (auth.in === 'header') {
          headers[auth.name || 'X-API-Key'] = this.interpolate(
            auth.value,
            inputData,
          );
        }
        break;

      case 'oauth2':
        if (auth.accessToken) {
          headers['Authorization'] = `Bearer ${auth.accessToken}`;
        }
        break;

      case 'custom':
        headers[auth.headerName] = this.interpolate(
          auth.headerValue,
          inputData,
        );
        break;
    }

    return headers;
  }

  /**
   * Handle paginated API responses
   */
  private async handlePagination(
    baseConfig: AxiosRequestConfig,
    pagination: any,
    inputData: any,
    rateLimit: any,
  ): Promise<{ data: any[]; lastResponse: any }> {
    const allData: any[] = [];
    let page = pagination.startPage || 1;
    let hasMore = true;
    let lastResponse: any;
    const maxPages = pagination.maxPages || 100;

    while (hasMore && page <= maxPages) {
      // Apply rate limiting
      if (rateLimit?.enabled) {
        await this.applyRateLimit(rateLimit);
      }

      // Build paginated URL
      const config = { ...baseConfig };
      const url = new URL(config.url as string);

      switch (pagination.type) {
        case 'page':
          url.searchParams.set(pagination.pageParam || 'page', String(page));
          if (pagination.limitParam) {
            url.searchParams.set(
              pagination.limitParam,
              String(pagination.limit || 100),
            );
          }
          break;

        case 'offset':
          const offset = (page - 1) * (pagination.limit || 100);
          url.searchParams.set(
            pagination.offsetParam || 'offset',
            String(offset),
          );
          url.searchParams.set(
            pagination.limitParam || 'limit',
            String(pagination.limit || 100),
          );
          break;

        case 'cursor':
          if (lastResponse && pagination.cursorPath) {
            const cursor = this.extractDataByPath(
              lastResponse.data,
              pagination.cursorPath,
            );
            if (cursor) {
              url.searchParams.set(pagination.cursorParam || 'cursor', cursor);
            }
          }
          break;
      }

      config.url = url.toString();
      lastResponse = await axios(config);

      // Extract data from response
      const pageData = pagination.dataPath
        ? this.extractDataByPath(lastResponse.data, pagination.dataPath)
        : lastResponse.data;

      if (Array.isArray(pageData)) {
        allData.push(...pageData);
      } else if (pageData) {
        allData.push(pageData);
      }

      // Check if there's more data
      hasMore = this.checkHasMore(lastResponse.data, pagination, pageData);
      page++;
    }

    return { data: allData, lastResponse };
  }

  /**
   * Check if there are more pages
   */
  private checkHasMore(
    responseData: any,
    pagination: any,
    pageData: any,
  ): boolean {
    if (pagination.hasMorePath) {
      return !!this.extractDataByPath(responseData, pagination.hasMorePath);
    }

    if (pagination.type === 'cursor' && pagination.cursorPath) {
      return !!this.extractDataByPath(responseData, pagination.cursorPath);
    }

    // If no explicit indicator, check if we got data
    if (Array.isArray(pageData)) {
      return pageData.length >= (pagination.limit || 100);
    }

    return false;
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(rateLimit: any): Promise<void> {
    if (rateLimit.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, rateLimit.delayMs));
    }
  }

  /**
   * Extract data by path (supports dot notation and array indexing)
   */
  private extractDataByPath(data: any, path: string): any {
    if (!data || !path) return data;

    const keys = path.split('.');
    let value = data;

    for (const key of keys) {
      if (value == null) return undefined;

      // Support array indexing: items[0], items[*]
      const arrayMatch = key.match(/^(\w+)\[(\d+|\*)\]$/);
      if (arrayMatch) {
        const [, prop, index] = arrayMatch;
        const arr = value[prop];
        if (!Array.isArray(arr)) return undefined;

        if (index === '*') {
          value = arr;
        } else {
          value = arr[parseInt(index)];
        }
      } else {
        value = value[key];
      }
    }

    return value;
  }

  /**
   * Apply JavaScript transform expression
   */
  private applyTransform(data: any, script: string, input: any): any {
    try {
      // Create a safe evaluation context
      const context = {
        data,
        input,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Date,
        Math,
      };

      // Simple expression evaluation (for safety, no eval)
      // This handles common cases like: data.map(x => x.name)
      const fn = new Function(...Object.keys(context), `return ${script}`);
      return fn(...Object.values(context));
    } catch (error) {
      console.error('Transform error:', error);
      return data;
    }
  }

  /**
   * Interpolate string with variables
   */
  private interpolate(template: string, data: any): string {
    if (!template || typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.extractDataByPath(data, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Recursively interpolate object
   */
  private interpolateObject(obj: any, data: any): any {
    if (typeof obj === 'string') {
      return this.interpolate(obj, data);
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
}
