import type { Rule } from 'antd/es/form';

/**
 * Common validation rules for forms
 */
export class ValidationRules {
  private t: (key: string, options?: any) => string;

  constructor(t: (key: string, options?: any) => string) {
    this.t = t;
  }

  /**
   * Required field validation
   */
  required(message?: string): Rule {
    return {
      required: true,
      message: message || this.t('common:validation.required'),
    };
  }

  /**
   * Required field with whitespace validation
   */
  requiredTrim(message?: string): Rule {
    return {
      required: true,
      whitespace: true,
      message: message || this.t('common:validation.required'),
    };
  }

  /**
   * Email validation
   */
  email(message?: string): Rule {
    return {
      type: 'email',
      message: message || this.t('common:validation.email'),
    };
  }

  /**
   * Phone number validation (international format)
   */
  phone(message?: string): Rule {
    return {
      pattern: /^[+]?[0-9\s\-()]+$/,
      message: message || this.t('common:validation.phone'),
    };
  }

  /**
   * Minimum length validation
   */
  minLength(min: number, message?: string): Rule {
    return {
      min,
      message: message || this.t('common:validation.minLength', { min }),
    };
  }

  /**
   * Maximum length validation
   */
  maxLength(max: number, message?: string): Rule {
    return {
      max,
      message: message || this.t('common:validation.maxLength', { max }),
    };
  }

  /**
   * Number range validation
   */
  numberRange(min: number, max: number, message?: string): Rule {
    return {
      type: 'number',
      min,
      max,
      message: message || this.t('common:validation.numberRange', { min, max }),
    };
  }

  /**
   * Minimum number validation
   */
  minNumber(min: number, message?: string): Rule {
    return {
      type: 'number',
      min,
      message: message || this.t('common:validation.minNumber', { min }),
    };
  }

  /**
   * Maximum number validation
   */
  maxNumber(max: number, message?: string): Rule {
    return {
      type: 'number',
      max,
      message: message || this.t('common:validation.maxNumber', { max }),
    };
  }

  /**
   * Positive number validation
   */
  positiveNumber(message?: string): Rule {
    return {
      type: 'number',
      min: 0.01,
      message: message || this.t('common:validation.positiveNumber'),
    };
  }

  /**
   * Non-negative number validation
   */
  nonNegativeNumber(message?: string): Rule {
    return {
      type: 'number',
      min: 0,
      message: message || this.t('common:validation.nonNegativeNumber'),
    };
  }

  /**
   * URL validation
   */
  url(message?: string): Rule {
    return {
      type: 'url',
      message: message || this.t('common:validation.url'),
    };
  }

  /**
   * Pattern validation
   */
  pattern(pattern: RegExp, message: string): Rule {
    return {
      pattern,
      message,
    };
  }

  /**
   * Room number validation (alphanumeric with hyphens)
   */
  roomNumber(message?: string): Rule {
    return {
      pattern: /^[A-Za-z0-9-]+$/,
      message: message || this.t('common:validation.roomNumber'),
    };
  }

  /**
   * Currency code validation (3 letter code)
   */
  currencyCode(message?: string): Rule {
    return {
      pattern: /^[A-Z]{3}$/,
      message: message || this.t('common:validation.currencyCode'),
    };
  }

  /**
   * Percentage validation (0-100)
   */
  percentage(message?: string): Rule {
    return {
      type: 'number',
      min: 0,
      max: 100,
      message: message || this.t('common:validation.percentage'),
    };
  }

  /**
   * Date after validation - simplified version
   */
  dateAfter(): Rule {
    return {
      validator: () => {
        // Simplified validation - can be enhanced later
        return Promise.resolve();
      },
    };
  }

  /**
   * Date before validation - simplified version
   */
  dateBefore(): Rule {
    return {
      validator: () => {
        // Simplified validation - can be enhanced later
        return Promise.resolve();
      },
    };
  }

  /**
   * Date range validation - simplified version
   */
  dateRange(): Rule {
    return {
      validator: () => {
        // Simplified validation - can be enhanced later
        return Promise.resolve();
      },
    };
  }

  /**
   * Capacity validation based on room type
   */
  capacityValidation(getRoomType: () => any, message?: string): Rule {
    return {
      validator: (_, value) => {
        const roomType = getRoomType();
        if (!roomType || !value) {
          return Promise.resolve();
        }
        if (value <= roomType.capacity) {
          return Promise.resolve();
        }
        return Promise.reject(
          new Error(
            message || this.t('common:validation.capacity', { max: roomType.capacity })
          )
        );
      },
    };
  }

  /**
   * Unique validation (async)
   */
  unique(
    checkUnique: (value: string) => Promise<boolean>,
    message?: string
  ): Rule {
    return {
      validator: async (_, value) => {
        if (!value) {
          return Promise.resolve();
        }
        const isUnique = await checkUnique(value);
        if (isUnique) {
          return Promise.resolve();
        }
        return Promise.reject(new Error(message || this.t('common:validation.unique')));
      },
    };
  }

  /**
   * Password strength validation
   */
  passwordStrength(message?: string): Rule {
    return {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message: message || this.t('common:validation.passwordStrength'),
    };
  }

  /**
   * Confirm password validation - simplified version
   */
  confirmPassword(): Rule {
    return {
      validator: () => {
        // Simplified validation - can be enhanced later
        return Promise.resolve();
      },
    };
  }

  /**
   * Time format validation (HH:mm)
   */
  timeFormat(message?: string): Rule {
    return {
      pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      message: message || this.t('common:validation.timeFormat'),
    };
  }

  /**
   * No special characters validation
   */
  noSpecialChars(message?: string): Rule {
    return {
      pattern: /^[a-zA-Z0-9\s]+$/,
      message: message || this.t('common:validation.noSpecialChars'),
    };
  }

  /**
   * Alphanumeric validation
   */
  alphanumeric(message?: string): Rule {
    return {
      pattern: /^[a-zA-Z0-9]+$/,
      message: message || this.t('common:validation.alphanumeric'),
    };
  }
}

/**
 * Hook to get validation rules with translation
 */
export function useValidationRules(t: (key: string, options?: any) => string) {
  return new ValidationRules(t);
}