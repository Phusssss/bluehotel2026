import { useState } from 'react';
import {
  Card,
  Button,
  Modal,
  Typography,
  Tabs,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { ServiceOrderForm } from '../components/ServiceOrderForm';
import { useServiceOrders } from '../hooks/useServiceOrders';

const { Title } = Typography;

export function ServiceOrdersPage() {
  const { t } = useTranslation('pricing');
  const { createServiceOrder, loading } = useServiceOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = () => {
    setIsModalOpen(true);
  };

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
      console.error('Error creating service order:', error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Card
        title={<Title level={3}>{t('serviceOrders.title')}</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('serviceOrders.createButton')}
          </Button>
        }
      >
        <Tabs
          items={[
            {
              key: 'pos',
              label: t('serviceOrders.pos'),
              children: (
                <div style={{ padding: '24px 0' }}>
                  <Typography.Paragraph>
                    {t('serviceOrders.posDescription')}
                  </Typography.Paragraph>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('serviceOrders.createOrder')}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={t('serviceOrders.createTitle')}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={700}
        destroyOnClose
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
