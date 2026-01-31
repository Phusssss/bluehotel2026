import React from 'react';
import { Spin } from 'antd';
import { useTranslationLoader } from '../hooks/useTranslationLoader';

interface WithTranslationsOptions {
  namespaces: string | string[];
  fallback?: React.ReactNode;
}

/**
 * Higher-order component that loads translations before rendering the wrapped component
 * @param Component - The component to wrap
 * @param options - Configuration options
 * @returns Wrapped component with translation loading
 */
export function withTranslations<P extends object>(
  Component: React.ComponentType<P>,
  options: WithTranslationsOptions
) {
  const WrappedComponent = (props: P) => {
    const { loading } = useTranslationLoader(options.namespaces);

    if (loading) {
      return (
        options.fallback || (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading translations..." />
          </div>
        )
      );
    }

    return <Component {...props} />;
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withTranslations(${Component.displayName || Component.name})`;

  return WrappedComponent;
}