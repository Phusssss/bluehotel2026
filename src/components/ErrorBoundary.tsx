import { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Catches and logs errors to console
 * - Displays user-friendly error message with internationalization support
 * - Provides refresh button to recover from errors
 * - Logs errors for debugging and potential error tracking service integration
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  /**
   * Static method called when an error is thrown during rendering
   * Updates state to trigger error UI display
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  /**
   * Called when an error is caught by the boundary
   * Logs error details for debugging and potential error tracking
   */
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Log additional context for debugging
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }
  
  /**
   * Handle refresh button click
   * Reloads the page to recover from the error state
   */
  handleRefresh = () => {
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRefresh={this.handleRefresh} error={this.state.error} />;
    }
    
    return this.props.children;
  }
}

/**
 * Error fallback component with internationalization support
 * Displays user-friendly error message and recovery options
 */
function ErrorFallback({ onRefresh, error }: { onRefresh: () => void; error: Error | null }) {
  const { t } = useTranslation('common');
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Result
        status="error"
        title={t('error.title')}
        subTitle={t('error.subtitle')}
        extra={[
          <Button type="primary" onClick={onRefresh} key="refresh">
            {t('error.refreshButton')}
          </Button>,
          <Button key="details" onClick={() => {
            console.error('Error details:', error);
            alert(`Error: ${error?.message || 'Unknown error'}`);
          }}>
            {t('error.showDetails')}
          </Button>
        ]}
      />
    </div>
  );
}

export default ErrorBoundary;