import { useState, useEffect } from 'react';
import {
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  Input,
  Card,
  Row,
  Col,
  Divider,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useHotel } from '../../../contexts/HotelContext';
import { serviceService } from '../../../services/serviceService';
import { reservationService } from '../../../services/reservationService';
import type { Service, Reservation } from '../../../types';

const { TextArea } = Input;
const { Text } = Typography;

interface ServiceOrderFormProps {
  onSubmit: (data: {
    reservationId: string;
    serviceId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormValues {
  reservationId: string;
  serviceId: string;
  quantity: number;
  notes?: string;
}

export function ServiceOrderForm({
  onSubmit,
  onCancel,
  loading = false,
}: ServiceOrderFormProps) {
  const [form] = Form.useForm<FormValues>();
  const { t } = useTranslation('pricing');
  const { currentHotel } = useHotel();
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (currentHotel) {
      loadData();
    }
  }, [currentHotel]);

  const loadData = async () => {
    if (!currentHotel) return;

    try {
      setLoadingData(true);
      
      // Load active services
      const servicesData = await serviceService.getActiveServices(currentHotel.id);
      setServices(servicesData);

      // Load checked-in reservations
      const reservationsData = await reservationService.getReservations(currentHotel.id, {
        status: 'checked-in',
      });
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!selectedService) {
      return;
    }

    await onSubmit({
      reservationId: values.reservationId,
      serviceId: values.serviceId,
      quantity: values.quantity,
      unitPrice: selectedService.price,
      notes: values.notes,
    });

    form.resetFields();
    setSelectedService(null);
  };

  const calculateTotal = () => {
    const quantity = form.getFieldValue('quantity') || 0;
    if (selectedService) {
      return selectedService.price * quantity;
    }
    return 0;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        quantity: 1,
      }}
    >
      <Card>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="reservationId"
              label={t('serviceOrders.reservation')}
              rules={[
                { required: true, message: t('serviceOrders.validation.reservationRequired') },
              ]}
            >
              <Select
                placeholder={t('serviceOrders.reservationPlaceholder')}
                loading={loadingData}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={reservations.map((reservation) => ({
                  label: `${t('serviceOrders.room')} ${reservation.roomId} - ${reservation.confirmationNumber}`,
                  value: reservation.id,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="serviceId"
              label={t('serviceOrders.service')}
              rules={[
                { required: true, message: t('serviceOrders.validation.serviceRequired') },
              ]}
            >
              <Select
                placeholder={t('serviceOrders.servicePlaceholder')}
                loading={loadingData}
                onChange={handleServiceChange}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={services.map((service) => ({
                  label: `${service.name} - ${service.price.toLocaleString()} ${currentHotel?.currency}`,
                  value: service.id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="quantity"
              label={t('serviceOrders.quantity')}
              rules={[
                { required: true, message: t('serviceOrders.validation.quantityRequired') },
                { type: 'number', min: 1, message: t('serviceOrders.validation.quantityMin') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder={t('serviceOrders.quantityPlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>

        {selectedService && (
          <>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>{t('serviceOrders.unitPrice')}:</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text>
                  {selectedService.price.toLocaleString()} {currentHotel?.currency}
                </Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Text strong>{t('serviceOrders.quantity')}:</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text>{form.getFieldValue('quantity') || 1}</Text>
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong style={{ fontSize: 16 }}>
                  {t('serviceOrders.total')}:
                </Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: 16 }}>
                  {calculateTotal().toLocaleString()} {currentHotel?.currency}
                </Text>
              </Col>
            </Row>
          </>
        )}

        <Divider />

        <Form.Item name="notes" label={t('serviceOrders.notes')}>
          <TextArea
            rows={2}
            placeholder={t('serviceOrders.notesPlaceholder')}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('serviceOrders.submit')}
            </Button>
            <Button onClick={onCancel}>{t('common:buttons.cancel')}</Button>
          </Space>
        </Form.Item>
      </Card>
    </Form>
  );
}
