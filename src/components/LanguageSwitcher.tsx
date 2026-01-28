import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user, updateUserProfile } = useAuth();

  const handleChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    
    // Persist to user profile if logged in
    if (user) {
      try {
        await updateUserProfile({ language: languageCode });
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      style={{ width: 120 }}
      options={SUPPORTED_LANGUAGES.map((lang) => ({
        label: lang.name,
        value: lang.code,
      }))}
    />
  );
}
