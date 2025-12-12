import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutionInput,
  NodeExecutionOutput,
} from '../node-executor.interface';

/**
 * Response Handler Executor
 * Process, transform, and route data from API/Webhook responses
 * Use this node after webhook-trigger or api-connector to process response
 */
@Injectable()
export class ResponseHandlerExecutor implements NodeExecutor {
  async execute(input: NodeExecutionInput): Promise<NodeExecutionOutput> {
    try {
      const {
        // Data extraction
        extractPaths = [], // Array of { key, path, defaultValue }

        // Data transformation
        transformations = [], // Array of transform operations

        // Filtering
        filters = [], // Array of filter conditions

        // Aggregation
        aggregate, // { operation, field } - sum, avg, count, min, max

        // Conditional routing
        conditions = [], // For decision making

        // Output format
        outputFormat = 'object', // object, array, flatten
        outputTemplate, // Custom output structure

        // Error handling
        required = [], // Required fields that must exist
        defaultValues = {}, // Default values for missing fields

        // Debugging
        debug = false,
      } = input.data;

      const inputData = input.input;
      let result: any;

      // Step 1: Extract data from specified paths
      if (extractPaths.length > 0) {
        result = this.extractData(inputData, extractPaths, defaultValues);
      } else {
        result = inputData?.data || inputData;
      }

      // Step 2: Apply filters
      if (filters.length > 0 && Array.isArray(result)) {
        result = this.applyFilters(result, filters);
      }

      // Step 3: Apply transformations
      if (transformations.length > 0) {
        result = this.applyTransformations(result, transformations, inputData);
      }

      // Step 4: Apply aggregation
      if (aggregate) {
        result = this.applyAggregation(result, aggregate);
      }

      // Step 5: Validate required fields
      const validation = this.validateRequired(result, required);
      if (!validation.valid) {
        return {
          success: false,
          output: null,
          error: `Missing required fields: ${validation.missing.join(', ')}`,
        };
      }

      // Step 6: Format output
      result = this.formatOutput(
        result,
        outputFormat,
        outputTemplate,
        inputData,
      );

      // Step 7: Evaluate conditions for routing
      const conditionResults = this.evaluateConditions(result, conditions);

      const output = {
        data: result,
        _meta: {
          timestamp: new Date().toISOString(),
          itemCount: Array.isArray(result) ? result.length : 1,
          conditions: conditionResults,
        },
        _routing: this.determineRouting(conditionResults),
        _original: debug ? inputData : undefined,
      };

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: `Response Handler Error: ${error.message}`,
      };
    }
  }

  /**
   * Extract data from input using path specifications
   */
  private extractData(
    data: any,
    extractPaths: Array<{ key: string; path: string; defaultValue?: any }>,
    defaultValues: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const { key, path, defaultValue } of extractPaths) {
      const value = this.getByPath(data, path);
      result[key] =
        value !== undefined
          ? value
          : (defaultValue ?? defaultValues[key] ?? null);
    }

    return result;
  }

  /**
   * Apply filter conditions to array data
   */
  private applyFilters(data: any[], filters: any[]): any[] {
    return data.filter((item) => {
      return filters.every((filter) => {
        const value = this.getByPath(item, filter.field);
        return this.evaluateCondition(value, filter.operator, filter.value);
      });
    });
  }

  /**
   * Apply transformation operations
   */
  private applyTransformations(
    data: any,
    transformations: any[],
    originalInput: any,
  ): any {
    let result = data;

    for (const transform of transformations) {
      switch (transform.type) {
        case 'map':
          if (Array.isArray(result)) {
            result = result.map((item) =>
              this.mapObject(item, transform.mapping, originalInput),
            );
          }
          break;

        case 'rename':
          result = this.renameFields(result, transform.mapping);
          break;

        case 'pick':
          result = this.pickFields(result, transform.fields);
          break;

        case 'omit':
          result = this.omitFields(result, transform.fields);
          break;

        case 'flatten':
          result = this.flattenObject(result, transform.depth || 1);
          break;

        case 'group':
          if (Array.isArray(result)) {
            result = this.groupBy(result, transform.field);
          }
          break;

        case 'sort':
          if (Array.isArray(result)) {
            result = this.sortArray(result, transform.field, transform.order);
          }
          break;

        case 'unique':
          if (Array.isArray(result)) {
            result = this.uniqueBy(result, transform.field);
          }
          break;

        case 'merge':
          result = this.mergeWithTemplate(
            result,
            transform.template,
            originalInput,
          );
          break;

        case 'format':
          result = this.formatValue(result, transform.format, transform.field);
          break;

        case 'calculate':
          result = this.calculateField(
            result,
            transform.expression,
            transform.outputField,
          );
          break;

        case 'split':
          result = this.splitField(
            result,
            transform.field,
            transform.delimiter,
            transform.outputFields,
          );
          break;

        case 'join':
          result = this.joinFields(
            result,
            transform.fields,
            transform.delimiter,
            transform.outputField,
          );
          break;
      }
    }

    return result;
  }

  /**
   * Apply aggregation operations
   */
  private applyAggregation(data: any, aggregate: any): any {
    if (!Array.isArray(data)) {
      return data;
    }

    const values = aggregate.field
      ? data
          .map((item) => this.getByPath(item, aggregate.field))
          .filter((v) => v != null)
      : data;

    switch (aggregate.operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);

      case 'avg':
        const sum = values.reduce((s, val) => s + (Number(val) || 0), 0);
        return values.length > 0 ? sum / values.length : 0;

      case 'count':
        return values.length;

      case 'min':
        return Math.min(...values.map(Number).filter((n) => !isNaN(n)));

      case 'max':
        return Math.max(...values.map(Number).filter((n) => !isNaN(n)));

      case 'first':
        return values[0];

      case 'last':
        return values[values.length - 1];

      case 'collect':
        return { items: data, count: data.length };

      default:
        return data;
    }
  }

  /**
   * Validate required fields exist
   */
  private validateRequired(
    data: any,
    required: string[],
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const field of required) {
      const value = this.getByPath(data, field);
      if (value === undefined || value === null) {
        missing.push(field);
      }
    }

    return { valid: missing.length === 0, missing };
  }

  /**
   * Format output according to specification
   */
  private formatOutput(
    data: any,
    format: string,
    template: any,
    originalInput: any,
  ): any {
    if (template) {
      return this.applyTemplate(template, data, originalInput);
    }

    switch (format) {
      case 'array':
        return Array.isArray(data) ? data : [data];

      case 'flatten':
        return this.flattenObject(data);

      case 'object':
      default:
        return data;
    }
  }

  /**
   * Evaluate routing conditions
   */
  private evaluateConditions(
    data: any,
    conditions: any[],
  ): Record<string, boolean> {
    const results: Record<string, boolean> = {};

    for (const condition of conditions) {
      const value = this.getByPath(data, condition.field);
      results[condition.name || condition.field] = this.evaluateCondition(
        value,
        condition.operator,
        condition.value,
      );
    }

    return results;
  }

  /**
   * Determine routing based on conditions
   */
  private determineRouting(conditionResults: Record<string, boolean>): string {
    for (const [name, passed] of Object.entries(conditionResults)) {
      if (passed) {
        return name;
      }
    }
    return 'default';
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    value: any,
    operator: string,
    compareValue: any,
  ): boolean {
    switch (operator) {
      case 'equals':
      case '==':
        return value == compareValue;
      case 'strictEquals':
      case '===':
        return value === compareValue;
      case 'notEquals':
      case '!=':
        return value != compareValue;
      case 'gt':
      case '>':
        return value > compareValue;
      case 'gte':
      case '>=':
        return value >= compareValue;
      case 'lt':
      case '<':
        return value < compareValue;
      case 'lte':
      case '<=':
        return value <= compareValue;
      case 'contains':
        return String(value).includes(String(compareValue));
      case 'startsWith':
        return String(value).startsWith(String(compareValue));
      case 'endsWith':
        return String(value).endsWith(String(compareValue));
      case 'matches':
        return new RegExp(compareValue).test(String(value));
      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(value);
      case 'notIn':
        return Array.isArray(compareValue) && !compareValue.includes(value);
      case 'exists':
        return value !== undefined && value !== null;
      case 'notExists':
        return value === undefined || value === null;
      case 'empty':
        return value === '' || (Array.isArray(value) && value.length === 0);
      case 'notEmpty':
        return value !== '' && (!Array.isArray(value) || value.length > 0);
      default:
        return false;
    }
  }

  // Helper methods
  private getByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  private mapObject(
    item: any,
    mapping: Record<string, string>,
    context: any,
  ): any {
    const result: Record<string, any> = {};
    for (const [newKey, sourcePath] of Object.entries(mapping)) {
      result[newKey] =
        this.getByPath(item, sourcePath) ?? this.getByPath(context, sourcePath);
    }
    return result;
  }

  private renameFields(data: any, mapping: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.renameFields(item, mapping));
    }

    const result = { ...data };
    for (const [oldKey, newKey] of Object.entries(mapping)) {
      if (result[oldKey] !== undefined) {
        result[newKey] = result[oldKey];
        delete result[oldKey];
      }
    }
    return result;
  }

  private pickFields(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.pickFields(item, fields));
    }

    const result: Record<string, any> = {};
    for (const field of fields) {
      if (data[field] !== undefined) {
        result[field] = data[field];
      }
    }
    return result;
  }

  private omitFields(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.omitFields(item, fields));
    }

    const result = { ...data };
    for (const field of fields) {
      delete result[field];
    }
    return result;
  }

  private flattenObject(obj: any, depth: number = 1): any {
    if (depth <= 0 || typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const flattened = this.flattenObject(value, depth - 1);
        for (const [subKey, subValue] of Object.entries(flattened)) {
          result[`${key}.${subKey}`] = subValue;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private groupBy(arr: any[], field: string): Record<string, any[]> {
    return arr.reduce((groups, item) => {
      const key = this.getByPath(item, field) ?? 'undefined';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  private sortArray(
    arr: any[],
    field: string,
    order: 'asc' | 'desc' = 'asc',
  ): any[] {
    return [...arr].sort((a, b) => {
      const aVal = this.getByPath(a, field);
      const bVal = this.getByPath(b, field);
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });
  }

  private uniqueBy(arr: any[], field?: string): any[] {
    if (!field) {
      return [...new Set(arr)];
    }

    const seen = new Set();
    return arr.filter((item) => {
      const value = this.getByPath(item, field);
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  private mergeWithTemplate(data: any, template: any, context: any): any {
    return { ...template, ...data, _context: context };
  }

  private formatValue(data: any, format: string, field?: string): any {
    const value = field ? this.getByPath(data, field) : data;

    switch (format) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value).toISOString();
      case 'json':
        return JSON.stringify(value);
      default:
        return value;
    }
  }

  private calculateField(
    data: any,
    expression: string,
    outputField: string,
  ): any {
    // Simple expression evaluator (no eval for safety)
    // Supports: +, -, *, /, field references with {{field}}
    try {
      const result = { ...data };
      let expr = expression;

      // Replace field references
      expr = expr.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
        const value = this.getByPath(data, field.trim());
        return String(value ?? 0);
      });

      // Safe evaluation
      result[outputField] = Function(`return ${expr}`)();
      return result;
    } catch {
      return data;
    }
  }

  private splitField(
    data: any,
    field: string,
    delimiter: string,
    outputFields?: string[],
  ): any {
    const value = this.getByPath(data, field);
    const parts = String(value).split(delimiter);

    const result = { ...data };
    if (outputFields) {
      outputFields.forEach((outField, i) => {
        result[outField] = parts[i] || '';
      });
    } else {
      result[`${field}_parts`] = parts;
    }

    return result;
  }

  private joinFields(
    data: any,
    fields: string[],
    delimiter: string,
    outputField: string,
  ): any {
    const values = fields
      .map((f) => this.getByPath(data, f))
      .filter((v) => v != null);
    return { ...data, [outputField]: values.join(delimiter) };
  }

  private applyTemplate(template: any, data: any, context: any): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        return (
          this.getByPath(data, path.trim()) ??
          this.getByPath(context, path.trim()) ??
          match
        );
      });
    }

    if (Array.isArray(template)) {
      return template.map((item) => this.applyTemplate(item, data, context));
    }

    if (typeof template === 'object' && template !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.applyTemplate(value, data, context);
      }
      return result;
    }

    return template;
  }
}
