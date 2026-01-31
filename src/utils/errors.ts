import { FirebaseError } from 'firebase/app';

// Lazy import i18n to avoid circular dependencies and build issues
let i18n: any = null;
try {
  i18n = require('../locales').default;
} catch (error) {
  // i18n not available, will fall back to default messages
  console.warn('i18n not available for error translations');
}

/**
 * Custom application error class that extends the native Error class
 * Provides structured error handling with localization support
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(language?: string): string {
    // If i18n is not available, return the original message
    if (!i18n) {
      return this.message;
    }
    
    const lng = language || i18n.language || 'en';
    
    // Try to get localized message from translations
    const translationKey = `errors.${this.code}`;
    const localizedMessage = i18n.t(translationKey, { lng });
    
    // If translation exists and is different from the key, use it
    if (localizedMessage !== translationKey) {
      return localizedMessage;
    }
    
    // Fall back to the original message
    return this.message;
  }

  /**
   * Convert error to JSON for logging or API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Firebase error code to user-friendly error mapping
 */
const FIREBASE_ERROR_MAPPING: Record<string, { code: string; message: string; statusCode: number }> = {
  // Authentication errors
  'auth/user-not-found': {
    code: 'USER_NOT_FOUND',
    message: 'User account not found',
    statusCode: 404,
  },
  'auth/wrong-password': {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    statusCode: 401,
  },
  'auth/invalid-email': {
    code: 'INVALID_EMAIL',
    message: 'Invalid email address',
    statusCode: 400,
  },
  'auth/user-disabled': {
    code: 'USER_DISABLED',
    message: 'User account has been disabled',
    statusCode: 403,
  },
  'auth/too-many-requests': {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many failed attempts. Please try again later',
    statusCode: 429,
  },
  'auth/network-request-failed': {
    code: 'NETWORK_ERROR',
    message: 'Network error. Please check your connection',
    statusCode: 503,
  },

  // Firestore errors
  'firestore/permission-denied': {
    code: 'PERMISSION_DENIED',
    message: 'You do not have permission to perform this action',
    statusCode: 403,
  },
  'firestore/not-found': {
    code: 'DOCUMENT_NOT_FOUND',
    message: 'The requested document was not found',
    statusCode: 404,
  },
  'firestore/already-exists': {
    code: 'DOCUMENT_ALREADY_EXISTS',
    message: 'A document with this identifier already exists',
    statusCode: 409,
  },
  'firestore/resource-exhausted': {
    code: 'QUOTA_EXCEEDED',
    message: 'Database quota exceeded. Please try again later',
    statusCode: 429,
  },
  'firestore/failed-precondition': {
    code: 'PRECONDITION_FAILED',
    message: 'Operation failed due to a precondition failure',
    statusCode: 412,
  },
  'firestore/aborted': {
    code: 'OPERATION_ABORTED',
    message: 'Operation was aborted due to a conflict',
    statusCode: 409,
  },
  'firestore/out-of-range': {
    code: 'INVALID_RANGE',
    message: 'Invalid range specified',
    statusCode: 400,
  },
  'firestore/unimplemented': {
    code: 'NOT_IMPLEMENTED',
    message: 'This operation is not implemented',
    statusCode: 501,
  },
  'firestore/internal': {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error. Please try again later',
    statusCode: 500,
  },
  'firestore/unavailable': {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service is temporarily unavailable. Please try again later',
    statusCode: 503,
  },
  'firestore/data-loss': {
    code: 'DATA_LOSS',
    message: 'Unrecoverable data loss or corruption',
    statusCode: 500,
  },
  'firestore/unauthenticated': {
    code: 'UNAUTHENTICATED',
    message: 'Authentication required to perform this action',
    statusCode: 401,
  },
  'firestore/invalid-argument': {
    code: 'INVALID_ARGUMENT',
    message: 'Invalid argument provided',
    statusCode: 400,
  },
  'firestore/deadline-exceeded': {
    code: 'TIMEOUT',
    message: 'Operation timed out. Please try again',
    statusCode: 408,
  },
  'firestore/cancelled': {
    code: 'OPERATION_CANCELLED',
    message: 'Operation was cancelled',
    statusCode: 499,
  },

  // Storage errors
  'storage/object-not-found': {
    code: 'FILE_NOT_FOUND',
    message: 'File not found',
    statusCode: 404,
  },
  'storage/bucket-not-found': {
    code: 'BUCKET_NOT_FOUND',
    message: 'Storage bucket not found',
    statusCode: 404,
  },
  'storage/project-not-found': {
    code: 'PROJECT_NOT_FOUND',
    message: 'Firebase project not found',
    statusCode: 404,
  },
  'storage/quota-exceeded': {
    code: 'STORAGE_QUOTA_EXCEEDED',
    message: 'Storage quota exceeded',
    statusCode: 429,
  },
  'storage/unauthenticated': {
    code: 'STORAGE_UNAUTHENTICATED',
    message: 'Authentication required for storage access',
    statusCode: 401,
  },
  'storage/unauthorized': {
    code: 'STORAGE_UNAUTHORIZED',
    message: 'Not authorized to access this file',
    statusCode: 403,
  },
  'storage/retry-limit-exceeded': {
    code: 'STORAGE_RETRY_LIMIT_EXCEEDED',
    message: 'Maximum retry limit exceeded',
    statusCode: 429,
  },
  'storage/invalid-checksum': {
    code: 'STORAGE_INVALID_CHECKSUM',
    message: 'File checksum validation failed',
    statusCode: 400,
  },
  'storage/canceled': {
    code: 'STORAGE_CANCELLED',
    message: 'File upload was cancelled',
    statusCode: 499,
  },
  'storage/invalid-event-name': {
    code: 'STORAGE_INVALID_EVENT',
    message: 'Invalid storage event name',
    statusCode: 400,
  },
  'storage/invalid-url': {
    code: 'STORAGE_INVALID_URL',
    message: 'Invalid storage URL',
    statusCode: 400,
  },
  'storage/invalid-argument': {
    code: 'STORAGE_INVALID_ARGUMENT',
    message: 'Invalid storage argument',
    statusCode: 400,
  },
  'storage/no-default-bucket': {
    code: 'STORAGE_NO_DEFAULT_BUCKET',
    message: 'No default storage bucket configured',
    statusCode: 500,
  },
  'storage/cannot-slice-blob': {
    code: 'STORAGE_CANNOT_SLICE_BLOB',
    message: 'Cannot slice file blob',
    statusCode: 400,
  },
  'storage/server-file-wrong-size': {
    code: 'STORAGE_SERVER_FILE_WRONG_SIZE',
    message: 'Server file size mismatch',
    statusCode: 400,
  },
};

/**
 * Convert Firebase error to AppError with user-friendly message
 */
export function handleFirebaseError(error: FirebaseError, context?: Record<string, any>): AppError {
  const errorMapping = FIREBASE_ERROR_MAPPING[error.code];
  
  if (errorMapping) {
    return new AppError(
      errorMapping.message,
      errorMapping.code,
      errorMapping.statusCode,
      true,
      { ...context, originalError: error.code }
    );
  }
  
  // Handle unknown Firebase errors
  return new AppError(
    'An unexpected error occurred. Please try again later.',
    'FIREBASE_UNKNOWN_ERROR',
    500,
    true,
    { ...context, originalError: error.code, originalMessage: error.message }
  );
}

/**
 * Handle generic errors and convert them to AppError
 */
export function handleGenericError(error: unknown, context?: Record<string, any>): AppError {
  // If it's already an AppError, return as is
  if (error instanceof AppError) {
    return error;
  }
  
  // If it's a Firebase error, handle it specifically
  if (error instanceof Error && 'code' in error) {
    return handleFirebaseError(error as FirebaseError, context);
  }
  
  // If it's a regular Error, convert to AppError
  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      'GENERIC_ERROR',
      500,
      true,
      { ...context, originalMessage: error.message, stack: error.stack }
    );
  }
  
  // Handle non-Error objects
  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    false,
    { ...context, originalError: error }
  );
}

/**
 * Utility function to safely execute async operations with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleGenericError(error, context);
  }
}

/**
 * Utility function to safely execute sync operations with error handling
 */
export function safeSync<T>(
  operation: () => T,
  context?: Record<string, any>
): T {
  try {
    return operation();
  } catch (error) {
    throw handleGenericError(error, context);
  }
}

/**
 * Log error with structured information
 */
export function logError(error: AppError | Error, context?: Record<string, any>): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error instanceof AppError ? error.toJSON() : {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };
  
  console.error('Application Error:', errorInfo);
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or similar
}

/**
 * Common business logic errors
 */
export const BusinessErrors = {
  ROOM_NOT_AVAILABLE: (dates: { checkIn: string; checkOut: string }) =>
    new AppError(
      'Room is not available for the selected dates',
      'ROOM_NOT_AVAILABLE',
      409,
      true,
      { dates }
    ),
  
  ROOM_NUMBER_EXISTS: (roomNumber: string) =>
    new AppError(
      'Room number already exists',
      'ROOM_NUMBER_EXISTS',
      409,
      true,
      { roomNumber }
    ),
  
  INVALID_DATE_RANGE: () =>
    new AppError(
      'Check-out date must be after check-in date',
      'INVALID_DATE_RANGE',
      400,
      true
    ),
  
  RESERVATION_NOT_EDITABLE: (status: string) =>
    new AppError(
      'Cannot edit reservation in current status',
      'RESERVATION_NOT_EDITABLE',
      409,
      true,
      { status }
    ),
  
  CANNOT_DELETE_ROOM_WITH_RESERVATIONS: () =>
    new AppError(
      'Cannot delete room with active reservations',
      'CANNOT_DELETE_ROOM_WITH_RESERVATIONS',
      409,
      true
    ),
  
  HOTEL_ACCESS_DENIED: (hotelId: string) =>
    new AppError(
      'You do not have access to this hotel',
      'HOTEL_ACCESS_DENIED',
      403,
      true,
      { hotelId }
    ),
  
  INSUFFICIENT_PERMISSIONS: (requiredPermission: string) =>
    new AppError(
      'Insufficient permissions to perform this action',
      'INSUFFICIENT_PERMISSIONS',
      403,
      true,
      { requiredPermission }
    ),
};