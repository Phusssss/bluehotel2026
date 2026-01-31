import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../notifications';
import { AppError } from '../errors';

// Mock Ant Design message
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(() => vi.fn()), // Returns a function to hide loading
  config: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('antd', () => ({
  message: mockMessage,
}));

// Mock i18n
const mockI18n = {
  t: vi.fn((key: string, options?: any) => {
    // Simple mock translation
    if (key === 'messages.operationSuccess') return 'Operation completed successfully';
    if (key === 'messages.operationError') return 'Operation failed';
    if (key === 'messages.createSuccess') return `${options?.entity || 'Item'} created successfully`;
    if (key === 'messages.updateSuccess') return `${options?.entity || 'Item'} updated successfully`;
    if (key === 'messages.deleteSuccess') return `${options?.entity || 'Item'} deleted successfully`;
    if (key === 'messages.hotelSelected') return `${options?.hotel} selected`;
    return key; // Return key if no translation found
  }),
  language: 'en',
};

vi.mock('../locales', () => ({
  default: mockI18n,
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Notifications', () => {
    it('should display success notification with localized message', () => {
      NotificationService.success('messages.operationSuccess');
      
      expect(mockMessage.success).toHaveBeenCalledWith('Operation completed successfully');
    });

    it('should display error notification with localized message', () => {
      NotificationService.error('messages.operationError');
      
      expect(mockMessage.error).toHaveBeenCalledWith('Operation failed');
    });

    it('should display warning notification with localized message', () => {
      NotificationService.warning('messages.sessionExpired');
      
      expect(mockMessage.warning).toHaveBeenCalledWith('messages.sessionExpired');
    });

    it('should display info notification with localized message', () => {
      NotificationService.info('messages.loading');
      
      expect(mockMessage.info).toHaveBeenCalledWith('messages.loading');
    });

    it('should display loading notification and return hide function', () => {
      const hideFunction = vi.fn();
      mockMessage.loading.mockReturnValueOnce(hideFunction);
      
      const hide = NotificationService.loading('messages.loading');
      
      expect(mockMessage.loading).toHaveBeenCalledWith('messages.loading');
      expect(hide).toBe(hideFunction);
    });
  });

  describe('Error Handling', () => {
    it('should handle AppError instances', () => {
      const appError = new AppError('Test error', 'TEST_ERROR', 400);
      
      NotificationService.error(appError);
      
      expect(mockMessage.error).toHaveBeenCalledWith('Test error');
    });

    it('should handle regular Error instances', () => {
      const error = new Error('Regular error');
      
      NotificationService.error(error);
      
      expect(mockMessage.error).toHaveBeenCalledWith('Regular error');
    });

    it('should handle string error messages', () => {
      NotificationService.error('messages.operationError');
      
      expect(mockMessage.error).toHaveBeenCalledWith('Operation failed');
    });
  });

  describe('Message Interpolation', () => {
    it('should support message interpolation', () => {
      NotificationService.success('messages.createSuccess', { entity: 'Room' });
      
      expect(mockMessage.success).toHaveBeenCalledWith('Room created successfully');
    });

    it('should support interpolation with multiple variables', () => {
      NotificationService.success('messages.hotelSelected', { hotel: 'Grand Hotel' });
      
      expect(mockMessage.success).toHaveBeenCalledWith('Grand Hotel selected');
    });
  });

  describe('Configuration', () => {
    it('should configure message settings', () => {
      const config = { duration: 5, maxCount: 3 };
      
      NotificationService.configure(config);
      
      expect(mockMessage.config).toHaveBeenCalledWith(config);
    });

    it('should destroy all messages', () => {
      NotificationService.destroy();
      
      expect(mockMessage.destroy).toHaveBeenCalled();
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to key when translation is not available', () => {
      NotificationService.success('unknown.key');
      
      expect(mockMessage.success).toHaveBeenCalledWith('unknown.key');
    });

    it('should handle missing i18n gracefully', () => {
      // Mock i18n as null to simulate missing i18n
      vi.doMock('../locales', () => ({
        default: null,
      }));

      NotificationService.success('messages.operationSuccess');
      
      expect(mockMessage.success).toHaveBeenCalledWith('messages.operationSuccess');
    });
  });
});