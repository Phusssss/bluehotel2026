import { useEffect } from 'react';
import { Form, Input, Button, Space, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Customer } from '../../../types';
import { useCompanies } from '../hooks/useCompanies';
import { useValidationRules } from '../../../utils/validation';

const { TextArea } = Input;

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  idNumber?: string;
  companyId?: string;
  preferences?: string;
  notes?: string;
}

/**
 * Customer form component for creating and editing customers
 */
export function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  loading = false,
}: CustomerFormProps) {
  const { t } = useTranslation('customers');
  const [form] = Form.useForm<CustomerFormValues>();
  const { companies, loading: companiesLoading } = useCompanies();
  const validation = useValidationRules(t);

  // Populate form when editing existing customer
  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        nationality: customer.nationality,
        idNumber: customer.idNumber,
        companyId: customer.companyId,
        preferences: customer.preferences,
        notes: customer.notes,
      });
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  const handleSubmit = async (values: CustomerFormValues) => {
    try {
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      // Error handling is done in parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* Name - Required */}
      <Form.Item
        name="name"
        label={t('form.name')}
        rules={[
          validation.requiredTrim(),
          validation.minLength(2),
          validation.maxLength(100),
        ]}
      >
        <Input
          placeholder={t('form.namePlaceholder')}
          size="large"
        />
      </Form.Item>

      {/* Email - Required */}
      <Form.Item
        name="email"
        label={t('form.email')}
        rules={[
          validation.requiredTrim(),
          validation.email(),
          validation.maxLength(100),
        ]}
      >
        <Input
          placeholder={t('form.emailPlaceholder')}
          size="large"
          type="email"
        />
      </Form.Item>

      {/* Phone - Required */}
      <Form.Item
        name="phone"
        label={t('form.phone')}
        rules={[
          validation.requiredTrim(),
          validation.phone(),
          validation.minLength(10),
          validation.maxLength(20),
        ]}
      >
        <Input
          placeholder={t('form.phonePlaceholder')}
          size="large"
        />
      </Form.Item>

      {/* Address - Optional */}
      <Form.Item
        name="address"
        label={t('form.address')}
        rules={[validation.maxLength(500)]}
      >
        <Input
          placeholder={t('form.addressPlaceholder')}
          size="large"
        />
      </Form.Item>

      {/* Nationality - Optional */}
      <Form.Item
        name="nationality"
        label={t('form.nationality')}
        rules={[validation.maxLength(50)]}
      >
        <Input
          placeholder={t('form.nationalityPlaceholder')}
          size="large"
        />
      </Form.Item>

      {/* ID Number - Optional */}
      <Form.Item
        name="idNumber"
        label={t('form.idNumber')}
        rules={[
          validation.maxLength(50),
          validation.alphanumeric(t('form.idNumberInvalid')),
        ]}
      >
        <Input
          placeholder={t('form.idNumberPlaceholder')}
          size="large"
        />
      </Form.Item>

      {/* Company - Optional */}
      <Form.Item
        name="companyId"
        label={t('form.company')}
      >
        <Select
          placeholder={t('form.companyPlaceholder')}
          size="large"
          allowClear
          showSearch
          loading={companiesLoading}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={companies.map((company) => ({
            label: company.name,
            value: company.id,
          }))}
        />
      </Form.Item>

      {/* Preferences - Optional */}
      <Form.Item
        name="preferences"
        label={t('form.preferences')}
        rules={[validation.maxLength(500)]}
      >
        <TextArea
          placeholder={t('form.preferencesPlaceholder')}
          rows={2}
          showCount
          maxLength={500}
        />
      </Form.Item>

      {/* Notes - Optional */}
      <Form.Item
        name="notes"
        label={t('form.notes')}
        rules={[validation.maxLength(1000)]}
      >
        <TextArea
          placeholder={t('form.notesPlaceholder')}
          rows={3}
          showCount
          maxLength={1000}
        />
      </Form.Item>

      {/* Form Actions */}
      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
          >
            {customer ? t('common:common.save') : t('common:common.create')}
          </Button>
          <Button
            onClick={onCancel}
            disabled={loading}
            size="large"
          >
            {t('common:common.cancel')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
