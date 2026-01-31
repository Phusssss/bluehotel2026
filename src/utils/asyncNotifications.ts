import { NotificationService } from './notifications';
import { AppError, handleGenericError } from './errors';

/**
 * Utility functions for handling async operations with automatic notifications
 */

interface AsyncOperationOptions {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  showLoading?: boolean;
  showSuccess?: boolean;
  showError?: boolean;
  context?: Record<string, any>;
}

/**
 * Execute an async operation with automatic loading, success, and error notifications
 */
export async function withNotifications<T>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
): Promise<T> {
  const {
    loadingMessage = 'messages.processing',
    successMessage = 'messages.operationSuccess',
    errorMessage = 'messages.operationError',
    showLoading = true,
    showSuccess = true,
    showError = true,
    context,
  } = options;

  let hideLoading: (() => void) | null = null;

  try {
    // Show loading notification
    if (showLoading) {
      hideLoading = NotificationService.loading(loadingMessage);
    }

    // Execute the operation
    const result = await operation();

    // Hide loading and show success
    if (hideLoading) {
      hideLoading();
    }
    
    if (showSuccess) {
      NotificationService.success(successMessage);
    }

    return result;
  } catch (error) {
    // Hide loading notification
    if (hideLoading) {
      hideLoading();
    }

    // Convert to AppError and show error notification
    const appError = handleGenericError(error, context);
    
    if (showError) {
      if (errorMessage === 'messages.operationError') {
        // Use the AppError's localized message
        NotificationService.error(appError);
      } else {
        // Use the custom error message
        NotificationService.error(errorMessage);
      }
    }

    throw appError;
  }
}

/**
 * Execute a CRUD create operation with automatic notifications
 */
export async function withCreateNotifications<T>(
  operation: () => Promise<T>,
  entityName: string,
  options: Omit<AsyncOperationOptions, 'successMessage' | 'errorMessage'> = {}
): Promise<T> {
  return withNotifications(operation, {
    ...options,
    successMessage: `messages.createSuccess`,
    errorMessage: `messages.createError`,
    context: { entity: entityName, operation: 'create', ...options.context },
  });
}

/**
 * Execute a CRUD update operation with automatic notifications
 */
export async function withUpdateNotifications<T>(
  operation: () => Promise<T>,
  entityName: string,
  options: Omit<AsyncOperationOptions, 'successMessage' | 'errorMessage'> = {}
): Promise<T> {
  return withNotifications(operation, {
    ...options,
    successMessage: `messages.updateSuccess`,
    errorMessage: `messages.updateError`,
    context: { entity: entityName, operation: 'update', ...options.context },
  });
}

/**
 * Execute a CRUD delete operation with automatic notifications
 */
export async function withDeleteNotifications<T>(
  operation: () => Promise<T>,
  entityName: string,
  options: Omit<AsyncOperationOptions, 'successMessage' | 'errorMessage'> = {}
): Promise<T> {
  return withNotifications(operation, {
    ...options,
    successMessage: `messages.deleteSuccess`,
    errorMessage: `messages.deleteError`,
    context: { entity: entityName, operation: 'delete', ...options.context },
  });
}

/**
 * Execute a form submission with automatic notifications
 */
export async function withFormSubmitNotifications<T>(
  operation: () => Promise<T>,
  options: Omit<AsyncOperationOptions, 'successMessage' | 'errorMessage'> = {}
): Promise<T> {
  return withNotifications(operation, {
    ...options,
    loadingMessage: 'messages.saving',
    successMessage: 'messages.submitSuccess',
    errorMessage: 'messages.submitError',
    context: { operation: 'form-submit', ...options.context },
  });
}

/**
 * Execute a data loading operation with automatic error notifications
 * (typically doesn't show success notifications for loading)
 */
export async function withLoadNotifications<T>(
  operation: () => Promise<T>,
  entityName: string,
  options: Omit<AsyncOperationOptions, 'successMessage' | 'errorMessage' | 'showSuccess'> = {}
): Promise<T> {
  return withNotifications(operation, {
    ...options,
    showSuccess: false,
    loadingMessage: 'messages.loading',
    errorMessage: `messages.loadError`,
    context: { entity: entityName, operation: 'load', ...options.context },
  });
}

/**
 * Execute an authentication operation with automatic notifications
 */
export async function withAuthNotifications<T>(
  operation: () => Promise<T>,
  operationType: 'login' | 'logout' | 'register' | 'update',
  options: Omit<AsyncOperationOptions, 'successMessage' | 'errorMessage'> = {}
): Promise<T> {
  const messageMap = {
    login: { success: 'messages.loginSuccess', error: 'messages.loginError' },
    logout: { success: 'messages.logoutSuccess', error: 'messages.loginError' },
    register: { success: 'messages.submitSuccess', error: 'messages.submitError' },
    update: { success: 'messages.updateSuccess', error: 'messages.updateError' },
  };

  const messages = messageMap[operationType];

  return withNotifications(operation, {
    ...options,
    successMessage: messages.success,
    errorMessage: messages.error,
    context: { operation: `auth-${operationType}`, ...options.context },
  });
}

/**
 * Batch execute multiple operations with a single loading notification
 */
export async function withBatchNotifications<T>(
  operations: Array<() => Promise<any>>,
  options: AsyncOperationOptions = {}
): Promise<T[]> {
  const {
    loadingMessage = 'messages.processing',
    successMessage = 'messages.operationSuccess',
    errorMessage = 'messages.operationError',
    showLoading = true,
    showSuccess = true,
    showError = true,
    context,
  } = options;

  let hideLoading: (() => void) | null = null;

  try {
    // Show loading notification
    if (showLoading) {
      hideLoading = NotificationService.loading(loadingMessage);
    }

    // Execute all operations
    const results = await Promise.all(operations.map(op => op()));

    // Hide loading and show success
    if (hideLoading) {
      hideLoading();
    }
    
    if (showSuccess) {
      NotificationService.success(successMessage);
    }

    return results;
  } catch (error) {
    // Hide loading notification
    if (hideLoading) {
      hideLoading();
    }

    // Convert to AppError and show error notification
    const appError = handleGenericError(error, context);
    
    if (showError) {
      NotificationService.error(appError);
    }

    throw appError;
  }
}

/**
 * Execute an operation with retry logic and notifications
 */
export async function withRetryNotifications<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  options: AsyncOperationOptions = {}
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt === 1) {
        // First attempt - show normal notifications
        return await withNotifications(operation, options);
      } else {
        // Retry attempts - only show loading, no success message until final success
        return await withNotifications(operation, {
          ...options,
          loadingMessage: `messages.processing`,
          showSuccess: true, // Show success on successful retry
        });
      }
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Show retry notification
        NotificationService.warning(`Attempt ${attempt} failed, retrying...`);
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // All retries failed
  const appError = handleGenericError(lastError, { 
    ...options.context, 
    maxRetries, 
    operation: 'retry-failed' 
  });
  
  if (options.showError !== false) {
    NotificationService.error(appError);
  }
  
  throw appError;
}                                                 