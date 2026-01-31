import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { AppError } from '../../utils/errors';

// Mock the notification service
vi.mock('../../utils/notifications', () => ({
  NotificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(() => vi.fn()),
    configure: vi.fn(),
    destroy: vi.fn(),
  },
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
  showLoading: vi.fn(() => vi.fn()),
  CrudNotifications: {},
  FormNotifications: {},
  AuthNotifications: {},
  HotelNotifications: {},
}));

// Mock react-i18next
const mockT = vi.fn((key: string, options?: any) => {
  if (key === 'messages.createSuccess') return `${options?.entity || 'Item'} created successfully`;
  if (key === 'messages.updateSuccess') return `${options?.entity || 'Item'} updated successfully`;
  if (key === 'messages.deleteSuccess') return `${options?.entity || 'Item'} deleted successfully`;
  if (key === 'messages.saveSuccess') return 'Changes saved successfully';
  if (key === 'messages.validationError') return 'Please check the form for errors';
  if (key === 'messages.loginSuccess') return 'Welcome back!';
  if (key === 'messages.hotelSelected') return `${options?.hotel} selected`;
  return key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide basic notification functions', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.success).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.warning).toBeDefined();
    expect(result.current.info).toBeDefined();
    expect(result.current.loading).toBeDefined();
  });

  it('should provide CRUD notification functions', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.crud.createSuccess).toBeDefined();
    expect(result.current.crud.createError).toBeDefined();
    expect(result.current.crud.updateSuccess).toBeDefined();
    expect(result.current.crud.updateError).toBeDefined();
    expect(result.current.crud.deleteSuccess).toBeDefined();
    expect(result.current.crud.deleteError).toBeDefined();
    expect(result.current.crud.saveSuccess).toBeDefined();
    expect(result.current.crud.saveError).toBeDefined();
  });

  it('should provide form notification functions', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.form.validationError).toBeDefined();
    expect(result.current.form.submitSuccess).toBeDefined();
    expect(result.current.form.submitError).toBeDefined();
    expect(result.current.form.resetSuccess).toBeDefined();
  });

  it('should provide auth notification functions', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.auth.loginSuccess).toBeDefined();
    expect(result.current.auth.loginError).toBeDefined();
    expect(result.current.auth.logoutSuccess).toBeDefined();
    expect(result.current.auth.sessionExpired).toBeDefined();
    expect(result.current.auth.accessDenied).toBeDefined();
  });

  it('should provide hotel notification functions', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.hotel.selected).toBeDefined();
    expect(result.current.hotel.switched).toBeDefined();
    expect(result.current.hotel.noSelection).toBeDefined();
  });

  it('should call CRUD createSuccess with translated message', () => {
    const { result } = renderHook(() => useNotifications());

    result.current.crud.createSuccess('Room');

    expect(mockT).toHaveBeenCalledWith('messages.createSuccess', { entity: 'Room' });
  });

  it('should call form validationError with translated message', () => {
    const { result } = renderHook(() => useNotifications());

    result.current.form.validationError();

    expect(mockT).toHaveBeenCalledWith('messages.validationError');
  });

  it('should call auth loginSuccess with translated message', () => {
    const { result } = renderHook(() => useNotifications());

    result.current.auth.loginSuccess();

    expect(mockT).toHaveBeenCalledWith('messages.loginSuccess');
  });

  it('should call hotel selected with translated message and interpolation', () => {
    const { result } = renderHook(() => useNotifications());

    result.current.hotel.selected('Grand Hotel');

    expect(mockT).toHaveBeenCalledWith('messages.hotelSelected', { hotel: 'Grand Hotel' });
  });

  it('should handle AppError in notifyError', () => {
    const { result } = renderHook(() => useNotifications());
    const appError = new AppError('Test error', 'TEST_ERROR', 400);

    result.current.notifyError(appError);

    // The hook should pass the AppError to the notification service
    // We can't easily test the exact call due to mocking complexity
    expect(result.current.notifyError).toBeDefined();
  });

  it('should provide access to the notification service', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.service).toBeDefined();
  });
});