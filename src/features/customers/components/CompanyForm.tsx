import { useEffect } from 'react';
import { Form, Input, InputNumber, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Company } from '../../../types';

const { TextArea } = Input;

/**
 * Form values interface
 */
export interface CompanyFormValues {
  name: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  contactPerson?: string;
  discountRate?: number;
}

/**
 * Props interface
 */
interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (values: CompanyFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Company form component for creating and editing companies
 */
export function CompanyForm({
  company,
  onSubmit,
  onCancel,
  loading = false,
}: CompanyFormProps) {
  const { t } = useTranslation('customers');
  const [form] = Form.useForm<CompanyFormValues>();

  // Populate form when editing
  useEffect(() => {
    if (company) {
      form.setFieldsValue({
        name: company.name,
        taxId: company.taxId,
        address: company.address,
        phone: company.phone,
        email: company.email,
        contactPerson: company.contactPerson,
        discountRate: company.discountRate,
      });
    } else {
      form.resetFields();
    }
  }, [company, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = (values: CompanyFormValues) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      <Form.Item
        name="name"
        label={t('companyForm.name')}
        rules={[
          { required: true, message: t('companyForm.nameRequired') },
          { max: 200, message: t('companyForm.nameTooLong') },
        ]}
      >
        <Input placeholder={t('companyForm.namePlaceholder')} />
      </Form.Item>

      <Form.Item
        name="taxId"
        label={t('companyForm.taxId')}
        rules={[
          { required: true, message: t('companyForm.taxIdRequired') },
          { max: 50, message: t('companyForm.taxIdTooLong') },
        ]}
      >
        <Input placeholder={t('companyForm.taxIdPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="address"
        label={t('companyForm.address')}
        rules={[
          { required: true, message: t('companyForm.addressRequired') },
        ]}
      >
        <TextArea
          rows={2}
          placeholder={t('companyForm.addressPlaceholder')}
        />
      </Form.Item>

      <Form.Item
        name="phone"
        label={t('companyForm.phone')}
        rules={[
          { required: true, message: t('companyForm.phoneRequired') },
        ]}
      >
        <Input placeholder={t('companyForm.phonePlaceholder')} />
      </Form.Item>

      <Form.Item
        name="email"
        label={t('companyForm.email')}
        rules={[
          { required: true, message: t('companyForm.emailRequired') },
          { type: 'email', message: t('companyForm.emailInvalid') },
        ]}
      >
        <Input placeholder={t('companyForm.emailPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="contactPerson"
        label={t('companyForm.contactPerson')}
      >
        <Input placeholder={t('companyForm.contactPersonPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="discountRate"
        label={t('companyForm.discountRate')}
        tooltip={t('companyForm.discountRateTooltip')}
      >
        <InputNumber
          min={0}
          max={100}
          precision={2}
          placeholder={t('companyForm.discountRatePlaceholder')}
          style={{ width: '100%' }}
          addonAfter="%"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('common:common.save')}
          </Button>
          <Button onClick={onCancel} disabled={loading}>
            {t('common:common.cancel')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
