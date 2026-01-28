import { Form, Input, Button, Card, message, TimePicker, InputNumber } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useHotel } from '../contexts/HotelContext';
import { useState } from 'react';
import dayjs from 'dayjs';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface HotelFormValues {
  name: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: dayjs.Dayjs;
  checkOutTime: dayjs.Dayjs;
  taxRate: number;
  currency: string;
}

export function AddHotelPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm<HotelFormValues>();
  const { addHotel } = useHotel();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: HotelFormValues) => {
    setLoading(true);
    try {
      await addHotel({
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        checkInTime: values.checkInTime.format('HH:mm'),
        checkOutTime: values.checkOutTime.format('HH:mm'),
        taxRate: values.taxRate,
        currency: values.currency,
      });
      message.success(t('addHotel.success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding hotel:', error);
      message.error(t('addHotel.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '24px',
      }}
    >
      <Card
        style={{ width: 700 }}
        title={t('addHotel.title')}
        extra={<LanguageSwitcher />}
      >
        <p style={{ marginBottom: 24 }}>
          {t('addHotel.description')}
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            checkInTime: dayjs('14:00', 'HH:mm'),
            checkOutTime: dayjs('12:00', 'HH:mm'),
            taxRate: 10,
            currency: 'VND',
          }}
        >
          <Form.Item
            name="name"
            label={t('addHotel.hotelName')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input placeholder={t('addHotel.hotelNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="address"
            label={t('addHotel.address')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input.TextArea rows={2} placeholder={t('addHotel.addressPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="phone"
            label={t('addHotel.phone')}
            rules={[
              { required: true, message: t('validation.required') },
              { pattern: /^[0-9+\-\s()]+$/, message: t('validation.phone') },
            ]}
          >
            <Input placeholder={t('userInfo.phonePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('addHotel.email')}
            rules={[
              { required: true, message: t('validation.required') },
              { type: 'email', message: t('validation.email') },
            ]}
          >
            <Input placeholder={t('addHotel.emailPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="checkInTime"
            label={t('addHotel.checkInTime')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="checkOutTime"
            label={t('addHotel.checkOutTime')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="taxRate"
            label={t('addHotel.taxRate')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: '100%' }}
              placeholder="10"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            label={t('addHotel.currency')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input placeholder={t('addHotel.currencyPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('addHotel.addButton')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
