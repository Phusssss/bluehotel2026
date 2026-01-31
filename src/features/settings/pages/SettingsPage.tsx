import { Tabs, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { HotelUsersTab } from '../components/HotelUsersTab';

const { Title } = Typography;

/**
 * SettingsPage component - manages hotel settings and configurations
 * Displays settings tabs for users, general settings, etc.
 * Supports responsive design for mobile, tablet, and desktop
 */
export function SettingsPage() {
  const { t } = useTranslation('settings');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      children: (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Title level={4}>{t('tabs.general')}</Title>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {t('tabs.generalComingSoon')}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '1px' }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          {t('title')}
        </Title>
      </div>

      {/* Settings Tabs */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Tabs 
          items={tabItems} 
          size={isMobile ? 'small' : 'middle'}
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
}