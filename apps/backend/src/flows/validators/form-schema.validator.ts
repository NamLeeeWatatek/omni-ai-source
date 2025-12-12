/**
 * Form Schema Validator
 * Validates formSchema structure to ensure it's properly formatted
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'select',
  'checkbox',
  'radio',
  'file',
  'date',
  'email',
  'url',
];

export function validateFormSchema(formSchema: any): ValidationResult {
  const errors: string[] = [];

  // Check if formSchema exists
  if (!formSchema) {
    errors.push('formSchema is required');
    return { valid: false, errors };
  }

  // Check if steps array exists
  if (!formSchema.steps || !Array.isArray(formSchema.steps)) {
    errors.push('formSchema.steps must be an array');
    return { valid: false, errors };
  }

  // Validate each step
  formSchema.steps.forEach((step: any, stepIndex: number) => {
    const stepPrefix = `Step ${stepIndex + 1}`;

    // Check required step fields
    if (!step.id) {
      errors.push(`${stepPrefix}: id is required`);
    }
    if (!step.label) {
      errors.push(`${stepPrefix}: label is required`);
    }
    if (!step.fields || !Array.isArray(step.fields)) {
      errors.push(`${stepPrefix}: fields must be an array`);
      return;
    }

    // Validate each field
    step.fields.forEach((field: any, fieldIndex: number) => {
      const fieldPrefix = `${stepPrefix}, Field ${fieldIndex + 1}`;

      // Check required field properties
      if (!field.id) {
        errors.push(`${fieldPrefix}: id is required`);
      }
      if (!field.type) {
        errors.push(`${fieldPrefix}: type is required`);
      } else if (!VALID_FIELD_TYPES.includes(field.type)) {
        errors.push(
          `${fieldPrefix}: invalid type "${field.type}". Must be one of: ${VALID_FIELD_TYPES.join(', ')}`,
        );
      }
      if (!field.label) {
        errors.push(`${fieldPrefix}: label is required`);
      }
      if (field.required === undefined) {
        errors.push(
          `${fieldPrefix}: required must be explicitly set (true/false)`,
        );
      }

      // Validate select/radio options
      if (
        (field.type === 'select' || field.type === 'radio') &&
        !field.options
      ) {
        errors.push(
          `${fieldPrefix}: options are required for ${field.type} fields`,
        );
      }

      // Validate options structure
      if (field.options) {
        if (!Array.isArray(field.options)) {
          errors.push(`${fieldPrefix}: options must be an array`);
        } else {
          field.options.forEach((option: any, optionIndex: number) => {
            if (!option.value) {
              errors.push(
                `${fieldPrefix}, Option ${optionIndex + 1}: value is required`,
              );
            }
            if (!option.label) {
              errors.push(
                `${fieldPrefix}, Option ${optionIndex + 1}: label is required`,
              );
            }
          });
        }
      }

      // Validate number field constraints
      if (field.type === 'number') {
        if (field.min !== undefined && typeof field.min !== 'number') {
          errors.push(`${fieldPrefix}: min must be a number`);
        }
        if (field.max !== undefined && typeof field.max !== 'number') {
          errors.push(`${fieldPrefix}: max must be a number`);
        }
        if (
          field.min !== undefined &&
          field.max !== undefined &&
          field.min > field.max
        ) {
          errors.push(`${fieldPrefix}: min cannot be greater than max`);
        }
      }

      // Validate textarea rows
      if (field.type === 'textarea' && field.rows !== undefined) {
        if (typeof field.rows !== 'number' || field.rows < 1) {
          errors.push(`${fieldPrefix}: rows must be a positive number`);
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize formSchema by removing unnecessary fields
 */
export function sanitizeFormSchema(formSchema: any): any {
  if (!formSchema || !formSchema.steps) {
    return formSchema;
  }

  return {
    steps: formSchema.steps.map((step: any) => ({
      id: step.id,
      label: step.label,
      description: step.description,
      fields: step.fields.map((field: any) => {
        const sanitized: any = {
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required,
        };

        // Optional fields
        if (field.placeholder) sanitized.placeholder = field.placeholder;
        if (field.helperText) sanitized.helperText = field.helperText;
        if (field.defaultValue !== undefined)
          sanitized.defaultValue = field.defaultValue;
        if (field.options) sanitized.options = field.options;
        if (field.min !== undefined) sanitized.min = field.min;
        if (field.max !== undefined) sanitized.max = field.max;
        if (field.rows !== undefined) sanitized.rows = field.rows;

        return sanitized;
      }),
    })),
  };
}
