import { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { HotelUser } from '../../../types';

interface AddUserModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (userEmail: string, permission: HotelUser['permission']) => Promise<void>;
}

interface FormValues {
  email: string;
  permission: HotelUser['permission'];
}

export function AddUserModal({ visible, onCancel, onSubmit }: AddUserModalProps) {
  const { t } = useTranslation('settings');
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values.email, values.permission);
      form.resetFields();
    } catch (error) {
      // Form validation error or submission error
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const permissionOptions = [
    {
      value: 'manager' as const,
      label: t('users.permissions.manager'),
      description: t('users.permissionDescriptions.manager'),
    },
    {
      value: 'receptionist' as const,
      label: t('users.permissions.receptionist'),
      description: t('users.permissionDescriptions.receptionist'),
    },
    {
      value: 'housekeeping' as const,
      label: t('users.permissions.housekeeping'),
      description: t('users.permissionDescriptions.housekeeping'),
    },
  ];

  return (
    <Modal
      title={t('users.addUser')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={t('common.add')}
      cancelText={t('common.cancel')}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ permission: 'receptionist' }}
      >
        <Form.Item
          name="email"
          label={t('users.form.email')}
          rules={[
            { required: true, message: t('users.form.emailRequired') },
            { type: 'email', message: t('users.form.emailInvalid') },
          ]}
        >
          <Input
            placeholder={t('users.form.emailPlaceholder')}
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="permission"
          label={t('users.form.permission')}
          rules={[{ required: true, message: t('users.form.permissionRequired') }]}
        >
          <Select
            placeholder={t('users.form.permissionPlaceholder')}
            options={permissionOptions.map(option => ({
              value: option.value,
              label: (
                <div>
                  <div>{option.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {option.description}
                  </div>
                </div>
              ),
            }))}
          />
        </Form.Item>
      </Form>

      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <strong>{t('users.form.note')}:</strong> {t('users.form.noteDescription')}
        </div>
      </div>
    </Modal>
  );
}