import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Typography,
  Space,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ServiceOrderForm } from '../components/ServiceOrderForm';
import { useServiceOrders } from '../hooks/useServiceOrders';

const { Title, Text } = Typography;

/**
 * ServiceOrdersPage component - manages service orders (POS system)
 * Displays service orders with create functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function ServiceOrdersPage() {
  const { t } = useTranslation('pricing');
  const { createServiceOrder, loading } = useServiceOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  /**
   * Handle create service order button click
   */
  const handleCreate = () => {
    setIsModalOpen(true);
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: {
    reservationId: string;
    serviceId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }) => {
    try {
      await createServiceOrder(data);
      setIsModalOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  /**
   * Handle form modal cancel
   */
  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>{t('serviceOrders.title')}</Title>
        <Space wrap size="small">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
            loading={loading}
            size="middle"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="middle"
          >
            {t('serviceOrders.createButton')}
          </Button>
        </Space>
      </div>

      {/* Point of Sale Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Title level={3} style={{ marginBottom: '16px' }}>
            {t('serviceOrders.pos')}
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: '24px', fontSize: '16px' }}>
            {t('serviceOrders.posDescription')}
          </Text>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            size="large"
          >
            {t('serviceOrders.createOrder')}
          </Button>
        </div>
      </div>

      {/* Create Service Order Modal */}
      <Modal
        title={t('serviceOrders.createTitle')}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: 700, top: 20 }}
      >
        <ServiceOrderForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Modal>
    </div>
  );
}
