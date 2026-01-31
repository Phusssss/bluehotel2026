import React from 'react';
import { Alert } from 'antd';
import { WifiOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../contexts/OfflineContext';

/**
 * OfflineIndicator component
 * Shows a warning banner when the user is offline
 */
export function OfflineIndicator() {
  const { t } = useTranslation('common');
  const { isOffline } = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <Alert
      message={t('offline.title')}
      description={t('offline.description')}
      type="warning"
      icon={<WifiOutlined />}
      showIcon
      banner
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: 0,
      }}
    />
  );
}