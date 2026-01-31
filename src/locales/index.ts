import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import only essential translations that are needed immediately
import enCommon from './en/common.json';
import viCommon from './vi/common.json';
import enSidebar from './en/sidebar.json';
import viSidebar from './vi/sidebar.json';

// Initial resources with only essential namespaces
const initialResources = {
  en: {
    common: enCommon,
    sidebar: enSidebar,
  },
  vi: {
    common: viCommon,
    sidebar: viSidebar,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: initialResources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'sidebar'], // Start with only essential namespaces
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Lazy loading functions for each namespace
export const loadNamespace = async (namespace: string, language: string = i18n.language) => {
  // Check if namespace is already loaded
  if (i18n.hasResourceBundle(language, namespace)) {
    return;
  }

  try {
    let translations;
    
    // Dynamic imports for each namespace
    switch (namespace) {
      case 'dashboard':
        if (language === 'en') {
          translations = (await import('./en/dashboard.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/dashboard.json')).default;
        }
        break;
      case 'reservations':
        if (language === 'en') {
          translations = (await import('./en/reservations.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/reservations.json')).default;
        }
        break;
      case 'frontDesk':
        if (language === 'en') {
          translations = (await import('./en/frontDesk.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/frontDesk.json')).default;
        }
        break;
      case 'rooms':
        if (language === 'en') {
          translations = (await import('./en/rooms.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/rooms.json')).default;
        }
        break;
      case 'pricing':
        if (language === 'en') {
          translations = (await import('./en/pricing.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/pricing.json')).default;
        }
        break;
      case 'customers':
        if (language === 'en') {
          translations = (await import('./en/customers.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/customers.json')).default;
        }
        break;
      case 'reports':
        if (language === 'en') {
          translations = (await import('./en/reports.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/reports.json')).default;
        }
        break;
      case 'settings':
        if (language === 'en') {
          translations = (await import('./en/settings.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/settings.json')).default;
        }
        break;
      case 'admin':
        if (language === 'en') {
          translations = (await import('./en/admin.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/admin.json')).default;
        }
        break;
      case 'tour':
        if (language === 'en') {
          translations = (await import('./en/tour.json')).default;
        } else if (language === 'vi') {
          translations = (await import('./vi/tour.json')).default;
        }
        break;
      default:
        console.warn(`Unknown namespace: ${namespace}`);
        return;
    }

    if (translations) {
      // Add the namespace to the list of available namespaces
      if (i18n.options.ns && Array.isArray(i18n.options.ns) && !i18n.options.ns.includes(namespace)) {
        i18n.options.ns.push(namespace);
      }
      
      // Add the resource bundle
      i18n.addResourceBundle(language, namespace, translations);
    }
  } catch (error) {
    console.error(`Failed to load namespace ${namespace} for language ${language}:`, error);
  }
};

// Helper function to load multiple namespaces
export const loadNamespaces = async (namespaces: string[], language: string = i18n.language) => {
  await Promise.all(namespaces.map(ns => loadNamespace(ns, language)));
};

export default i18n;
