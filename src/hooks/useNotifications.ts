import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  NotificationService, 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showLoading,
  CrudNotifications,
  FormNotifications,
  AuthNotifications,
  HotelNotifications
} from '../utils/notifications';
import { AppError } from '../utils/errors';

/**
 * Custom hook that provides notification functions with automatic translation context
 */
export function useNotifications() {
  const { t } = useTranslation('common');

  // Basic notification functions
  const success = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    showSuccess(messageKey, interpolation);
  }, []);

  const error = useCallback((messageKeyOrError: string | AppError | Error, interpolation?: Record<string, any>) => {
    showError(messageKeyOrError, interpolation);
  }, []);

  const warning = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    showWarning(messageKey, interpolation);
  }, []);

  const info = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    showInfo(messageKey, interpolation);
  }, []);

  const loading = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    return showLoading(messageKey, interpolation);
  }, []);

  // Convenience functions with pre-translated messages
  const notifySuccess = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    const message = t(messageKey, interpolation);
    NotificationService.success(message);
  }, [t]);

  const notifyError = useCallback((messageKeyOrError: string | AppError | Error, interpolation?: Record<string, any>) => {
    if (typeof messageKeyOrError === 'string') {
      const message = t(messageKeyOrError, interpolation);
      NotificationService.error(message);
    } else {
      NotificationService.error(messageKeyOrError, interpolation);
    }
  }, [t]);

  const notifyWarning = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    const message = t(messageKey, interpolation);
    NotificationService.warning(message);
  }, [t]);

  const notifyInfo = useCallback((messageKey: string, interpolation?: Record<string, any>) => {
    const message = t(messageKey, interpolation);
    NotificationService.info(message);
  }, [t]);

  // CRUD operation notifications
  const crud = {
    createSuccess: useCallback((entityName: string) => {
      const message = t('messages.createSuccess', { entity: entityName });
      NotificationService.success(message);
    }, [t]),

    createError: useCallback((entityName: string) => {
      const message = t('messages.createError', { entity: entityName });
      NotificationService.error(message);
    }, [t]),

    updateSuccess: useCallback((entityName: string) => {
      const message = t('messages.updateSuccess', { entity: entityName });
      NotificationService.success(message);
    }, [t]),

    updateError: useCallback((entityName: string) => {
      const message = t('messages.updateError', { entity: entityName });
      NotificationService.error(message);
    }, [t]),

    deleteSuccess: useCallback((entityName: string) => {
      const message = t('messages.deleteSuccess', { entity: entityName });
      NotificationService.success(message);
    }, [t]),

    deleteError: useCallback((entityName: string) => {
      const message = t('messages.deleteError', { entity: entityName });
      NotificationService.error(message);
    }, [t]),

    loadError: useCallback((entityName: string) => {
      const message = t('messages.loadError', { entity: entityName });
      NotificationService.error(message);
    }, [t]),

    saveSuccess: useCallback(() => {
      const message = t('messages.saveSuccess');
      NotificationService.success(message);
    }, [t]),

    saveError: useCallback(() => {
      const message = t('messages.saveError');
      NotificationService.error(message);
    }, [t]),
  };

  // Form operation notifications
  const form = {
    validationError: useCallback(() => {
      const message = t('messages.validationError');
      NotificationService.error(message);
    }, [t]),

    submitSuccess: useCallback(() => {
      const message = t('messages.submitSuccess');
      NotificationService.success(message);
    }, [t]),

    submitError: useCallback(() => {
      const message = t('messages.submitError');
      NotificationService.error(message);
    }, [t]),

    resetSuccess: useCallback(() => {
      const message = t('messages.resetSuccess');
      NotificationService.success(message);
    }, [t]),
  };

  // Authentication notifications
  const auth = {
    loginSuccess: useCallback(() => {
      const message = t('messages.loginSuccess');
      NotificationService.success(message);
    }, [t]),

    loginError: useCallback(() => {
      const message = t('messages.loginError');
      NotificationService.error(message);
    }, [t]),

    logoutSuccess: useCallback(() => {
      const message = t('messages.logoutSuccess');
      NotificationService.success(message);
    }, [t]),

    sessionExpired: useCallback(() => {
      const message = t('messages.sessionExpired');
      NotificationService.warning(message);
    }, [t]),

    accessDenied: useCallback(() => {
      const message = t('messages.accessDenied');
      NotificationService.error(message);
    }, [t]),
  };

  // Hotel management notifications
  const hotel = {
    selected: useCallback((hotelName: string) => {
      const message = t('messages.hotelSelected', { hotel: hotelName });
      NotificationService.success(message);
    }, [t]),

    switched: useCallback((hotelName: string) => {
      const message = t('messages.hotelSwitched', { hotel: hotelName });
      NotificationService.info(message);
    }, [t]),

    noSelection: useCallback(() => {
      const message = t('messages.noHotelSelected');
      NotificationService.warning(message);
    }, [t]),
  };

  return {
    // Basic functions
    success,
    error,
    warning,
    info,
    loading,
    
    // Functions with automatic translation
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    
    // Grouped convenience functions
    crud,
    form,
    auth,
    hotel,
    
    // Direct access to service
    service: NotificationService,
  };
}

export default useNotifications;