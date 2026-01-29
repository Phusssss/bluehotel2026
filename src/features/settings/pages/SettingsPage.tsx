import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { HotelUsersTab } from '../components/HotelUsersTab';

export function SettingsPage() {
  const { t } = useTranslation('settings');

  const tabItems = [
    {
      key: 'users',
      label: (
        <span>
          <TeamOutlined />
          {t('tabs.users')}
        </span>
      ),
      children: <HotelUsersTab />,
    },
    {
      key: 'general',
      label: (
        <span>
          <SettingOutlined />
          {t('tabs.general')}
        </span>
      ),
      children: <div>{t('tabs.generalComingSoon')}</div>,
    },
  ];

  return (
    <div>
      <h1>{t('title')}</h1>
      <Tabs items={tabItems} />
    </div>
  );
}