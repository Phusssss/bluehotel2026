import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadNamespace, loadNamespaces } from '../locales';

/**
 * Hook to lazy load translation namespaces
 * @param namespaces - Single namespace or array of namespaces to load
 * @returns loading state and translation function
 */
export function useTranslationLoader(namespaces: string | string[]) {
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true);
      try {
        if (Array.isArray(namespaces)) {
          await loadNamespaces(namespaces, i18n.language);
        } else {
          await loadNamespace(namespaces, i18n.language);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [namespaces, i18n.language]);

  // Also load translations when language changes
  useEffect(() => {
    const handleLanguageChange = async (lng: string) => {
      setLoading(true);
      try {
        if (Array.isArray(namespaces)) {
          await loadNamespaces(namespaces, lng);
        } else {
          await loadNamespace(namespaces, lng);
        }
      } catch (error) {
        console.error('Failed to load translations for new language:', error);
      } finally {
        setLoading(false);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [namespaces, i18n]);

  return { loading, t };
}

/**
 * Hook to lazy load a single namespace with translation function
 * @param namespace - Namespace to load
 * @returns loading state and translation function for that namespace
 */
export function useNamespaceTranslation(namespace: string) {
  const { loading } = useTranslationLoader(namespace);
  const { t } = useTranslation(namespace);
  
  return { loading, t };
}