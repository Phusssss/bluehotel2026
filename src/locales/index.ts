import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './en/common.json';
import viCommon from './vi/common.json';
import enSidebar from './en/sidebar.json';
import viSidebar from './vi/sidebar.json';
import enDashboard from './en/dashboard.json';
import viDashboard from './vi/dashboard.json';
import enReservations from './en/reservations.json';
import viReservations from './vi/reservations.json';
import enFrontDesk from './en/frontDesk.json';
import viFrontDesk from './vi/frontDesk.json';
import enRooms from './en/rooms.json';
import viRooms from './vi/rooms.json';

const resources = {
  en: {
    common: enCommon,
    sidebar: enSidebar,
    dashboard: enDashboard,
    reservations: enReservations,
    frontDesk: enFrontDesk,
    rooms: enRooms,
  },
  vi: {
    common: viCommon,
    sidebar: viSidebar,
    dashboard: viDashboard,
    reservations: viReservations,
    frontDesk: viFrontDesk,
    rooms: viRooms,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'sidebar', 'dashboard', 'reservations', 'frontDesk', 'rooms'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
