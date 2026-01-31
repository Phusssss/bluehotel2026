import { message } from 'antd';
import { AppError } from './errors';

// Lazy import i18n to avoid circular dependencies
let i18n: any = null;
try {
  i18n = require('../locales').default;
} catch (error) {
  console.warn('i18n not available for notification translations');
}

/**
 * Notification service that provides centralized success/error messaging
 * with localization support using Ant Design's message component
 */
export class NotificationService {
  /**
   * Display a success notification with localized message
   */
  static success(messageKey: string, interpolation?: Record<string, any>): void {
    const localizedMessage = this.getLocalizedMessage(messageKey, interpolation);
    message.success(localizedMessage);
  }

  /**
   * Display an error notification with localized message
   * Can handle both string keys and AppError instances
   */
  static error(messageKeyOrError: string | AppError | Error, interpolation?: Record<string, any>): void {
    let localizedMessage: string;

    if (messageKeyOrError instanceof AppError) {
      // Use AppError's built-in localization
      localizedMessage = messageKeyOrError.getLocalizedMessage();
    } else if (messageKeyOrError instanceof Error) {
      // For regular errors, use the message directly
      localizedMessage = messageKeyOrError.message;
    } else {
      // For string keys, get localized message
      localizedMessage = this.getLocalizedMessage(messageKeyOrError, interpolation);
    }

    message.error(localizedMessage);
  }

  /**
   * Display a warning notification with localized message
   */
  static warning(messageKey: string, interpolation?: Record<string, any>): void {
    const localizedMessage = this.getLocalizedMessage(messageKey, interpolation);
    message.warning(localizedMessage);
  }

  /**
   * Display an info notification with localized message
   */
  static info(messageKey: string, interpolation?: Record<string, any>): void {
    const localizedMessage = this.getLocalizedMessage(messageKey, interpolation);
    message.info(localizedMessage);
  }

  /**
   * Display a loading notification with localized message
   * Returns a function to hide the loading message
   */
  static loading(messageKey: string, interpolation?: Record<string, any>): () => void {
    const localizedMessage = this.getLocalizedMessage(messageKey, interpolation);
    return message.loading(localizedMessage);
  }

  /**
   * Get localized message from translation key
   */
  private static getLocalizedMessage(messageKey: string, interpolation?: Record<string, any>): string {
    // If i18n is not available, return the key as fallback
    if (!i18n) {
      return messageKey;
    }

    try {
      const translatedMessage = i18n.t(messageKey, interpolation);
      
      // If translation exists and is different from the key, use it
      if (translatedMessage !== messageKey) {
        return translatedMessage;
      }
      
      // Fall back to the key itself
      return messageKey;
    } catch (error) {
      console.warn(`Failed to translate message key: ${messageKey}`, error);
      return messageKey;
    }
  }

  /**
   * Configure global message settings
   */
  static configure(config: {
    duration?: number;
    maxCount?: number;
    top?: number;
    rtl?: boolean;
  }): void {
    message.config(config);
  }

  /**
   * Destroy all messages
   */
  static destroy(): void {
    message.destroy();
  }
}

/**
 * Convenience functions for common notification patterns
 */

// Success notifications
export const showSuccess = (messageKey: string, interpolation?: Record<string, any>) => {
  NotificationService.success(messageKey, interpolation);
};

// Error notifications
export const showError = (messageKeyOrError: string | AppError | Error, interpolation?: Record<string, any>) => {
  NotificationService.error(messageKeyOrError, interpolation);
};

// Warning notifications
export const showWarning = (messageKey: string, interpolation?: Record<string, any>) => {
  NotificationService.warning(messageKey, interpolation);
};

// Info notifications
export const showInfo = (messageKey: string, interpolation?: Record<string, any>) => {
  NotificationService.info(messageKey, interpolation);
};

// Loading notifications
export const showLoading = (messageKey: string, interpolation?: Record<string, any>) => {
  return NotificationService.loading(messageKey, interpolation);
};

/**
 * Common notification messages for CRUD operations
 */
export const CrudNotifications = {
  // Create operations
  createSuccess: (entityName: string) => showSuccess('messages.createSuccess', { entity: entityName }),
  createError: (entityName: string) => showError('messages.createError', { entity: entityName }),
  
  // Update operations
  updateSuccess: (entityName: string) => showSuccess('messages.updateSuccess', { entity: entityName }),
  updateError: (entityName: string) => showError('messages.updateError', { entity: entityName }),
  
  // Delete operations
  deleteSuccess: (entityName: string) => showSuccess('messages.deleteSuccess', { entity: entityName }),
  deleteError: (entityName: string) => showError('messages.deleteError', { entity: entityName }),
  
  // Load operations
  loadError: (entityName: string) => showError('messages.loadError', { entity: entityName }),
  
  // Save operations
  saveSuccess: () => showSuccess('messages.saveSuccess'),
  saveError: () => showError('messages.saveError'),
  
  // Generic operations
  operationSuccess: () => showSuccess('messages.operationSuccess'),
  operationError: () => showError('messages.operationError'),
};

/**
 * Form-specific notifications
 */
export const FormNotifications = {
  validationError: () => showError('messages.validationError'),
  submitSuccess: () => showSuccess('messages.submitSuccess'),
  submitError: () => showError('messages.submitError'),
  resetSuccess: () => showSuccess('messages.resetSuccess'),
};

/**
 * Authentication notifications
 */
export const AuthNotifications = {
  loginSuccess: () => showSuccess('messages.loginSuccess'),
  loginError: () => showError('messages.loginError'),
  logoutSuccess: () => showSuccess('messages.logoutSuccess'),
  sessionExpired: () => showWarning('messages.sessionExpired'),
  accessDenied: () => showError('messages.accessDenied'),
};

/**
 * Hotel management notifications
 */
export const HotelNotifications = {
  hotelSelected: (hotelName: string) => showSuccess('messages.hotelSelected', { hotel: hotelName }),
  hotelSwitched: (hotelName: string) => showInfo('messages.hotelSwitched', { hotel: hotelName }),
  noHotelSelected: () => showWarning('messages.noHotelSelected'),
};

// Export the main service as default
export default NotificationService;