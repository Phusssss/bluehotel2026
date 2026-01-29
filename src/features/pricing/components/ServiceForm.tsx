import { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Select,
  Switch,
  Space,
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { Service } from '../../../types';
import type { CreateServiceInput } from '../../../services/serviceService';

const { TextArea } = Input;

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: CreateServiceInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormValues {
  name: string;
  description: {
    en: string;
    vi: string;
  };
  price: number;
  category: 'laundry' | 'food' | 'transport' | 'spa' | 'other';
  taxable: boolean;
  active: boolean;
}

export function ServiceForm({
  service,
  onSubmit,
  onCancel,
  loading = false,
}: ServiceFormProps) {
  const [form] = Form.useForm<FormValues>();
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      form.setFieldsValue({
        name: service.name,
        description: {
          en: service.description.en || '',
          vi: service.description.vi || '',
        },
        price: service.price,
        category: service.category,
        taxable: service.taxable,
        active: service.active,
      });
    }
  }, [service, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      const data: Partial<CreateServiceInput> = {
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        taxable: values.taxable,
        active: values.active,
      };

      // Only include hotelId when creating (not editing)
      if (!isEditing) {
        data.hotelId = ''; // Will be set by the hook
      }

      await onSubmit(data as CreateServiceInput);
    } catch (error) {
      // Error handling is done in the parent component
      throw error;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        taxable: true,
        active: true,
        category: 'other',
      }}
    >
      <Card title={isEditing ? t('services.edit') : t('services.create')}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={t('services.name')}
              rules={[
                { required: true, message: t('services.validation.nameRequired') },
              ]}
            >
              <Input placeholder={t('services.namePlaceholder')} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="price"
              label={t('services.price')}
              rules={[
                { required: true, message: t('services.validation.priceRequired') },
                { type: 'number', min: 0, message: t('services.validation.priceMin') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('services.pricePlaceholder')}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="category"
              label={t('services.category')}
              rules={[
                { required: true, message: t('services.validation.categoryRequired') },
              ]}
            >
              <Select placeholder={t('services.categoryPlaceholder')}>
                <Select.Option value="laundry">{t('services.categories.laundry')}</Select.Option>
                <Select.Option value="food">{t('services.categories.food')}</Select.Option>
                <Select.Option value="transport">{t('services.categories.transport')}</Select.Option>
                <Select.Option value="spa">{t('services.categories.spa')}</Select.Option>
                <Select.Option value="other">{t('services.categories.other')}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['description', 'en']}
              label={`${t('services.description')} (English)`}
            >
              <TextArea
                rows={3}
                placeholder={t('services.descriptionPlaceholder')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['description', 'vi']}
              label={`${t('services.description')} (Tiếng Việt)`}
            >
              <TextArea
                rows={3}
                placeholder={t('services.descriptionPlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="taxable"
              label={t('services.taxable')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="active"
              label={t('services.active')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {tCommon('buttons.save')}
            </Button>
            <Button onClick={onCancel}>
              {tCommon('buttons.cancel')}
            </Button>
          </Space>
        </Form.Item>
      </Card>
    </Form>
  );
}
