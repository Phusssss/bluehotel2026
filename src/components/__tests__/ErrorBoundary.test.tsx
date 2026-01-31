import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../locales';

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Test component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="no-error">No error</div>;
}

// Test component wrapper with i18n
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByTestId('no-error').textContent).toBe('No error');
  });

  it('should render error UI when there is an error', () => {
    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Refresh Page/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Show Details/i })).toBeDefined();
  });

  it('should log error to console when error occurs', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error caught by ErrorBoundary:',
      expect.any(Error),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });

  it('should reload page when refresh button is clicked', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /Refresh Page/i });
    fireEvent.click(refreshButton);

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should show error details when show details button is clicked', () => {
    // Mock window.alert
    const alertMock = vi.fn();
    window.alert = alertMock;

    render(
      <TestWrapper>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </TestWrapper>
    );

    const showDetailsButton = screen.getByRole('button', { name: /Show Details/i });
    fireEvent.click(showDetailsButton);

    expect(alertMock).toHaveBeenCalledWith('Error: Test error');
  });
});