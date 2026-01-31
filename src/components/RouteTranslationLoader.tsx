import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadNamespaces } from '../locales';
import { getRouteTranslations } from '../utils/routeTranslations';
import { useTranslation } from 'react-i18next';

interface RouteTranslationLoaderProps {
  children: React.ReactNode;
}

/**
 * Component that automatically loads translations based on the current route
 * Should be placed inside the router but outside individual route components
 */
export function RouteTranslationLoader({ children }: RouteTranslationLoaderProps) {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadRouteTranslations = async () => {
      const requiredNamespaces = getRouteTranslations(location.pathname);
      
      if (requiredNamespaces.length > 0) {
        try {
          await loadNamespaces(requiredNamespaces, i18n.language);
        } catch (error) {
          console.error('Failed to load route translations:', error);
        }
      }
    };

    loadRouteTranslations();
  }, [location.pathname, i18n.language]);

  return <>{children}</>;
}