import { useState, useEffect } from 'react';
import { Modal, Form, Select, Avatar, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useValidationRules } from '../../../utils/validation';
import { HotelUser } from '../../../types';
import { HotelUserWithDetails } from '../hooks/useHotelUsers';

interface EditUserPermissionModalProps {
  visible: boolean;
  user: HotelUserWithDetails | null;
  onCancel: () => void;
  onSubmit: (permission: HotelUser['permission']) => Promise<void>;
}

interface FormValues {
  permission: HotelUser['permission'];
}

export function EditUserPermissionModal({
  visible,
  user,
  onCancel,
  onSubmit,
}: EditUserPermissionModalProps) {
  const { t } = useTranslation('settings');
  const [form] = Form.useForm<FormValues>();
  const validation = useValidationRules(t);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && visible) {
      form.setFieldsValue({
        permission: user.permission,
      });
    }
  }, [user, visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values.permission);
    } catch (error) {
      // Form validation error or submission error handled by parent
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
      value: 'owner' as const,
      label: t('users.permissions.owner'),
      description: t('users.permissionDescriptions.owner'),
    },
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

  if (!user) return null;

  return (
    <Modal
      title={t('users.editPermission')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
    >
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Avatar src={user.user.photoURL} size={48} />
          <div>
            <div style={{ fontWeight: 500 }}>{user.user.displayName}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>{user.user.email}</div>
          </div>
        </Space>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="permission"
          label={t('users.form.permission')}
          rules={[validation.required()]}
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

      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
        <div style={{ fontSize: '12px', color: '#d46b08' }}>
          <strong>{t('users.form.warning')}:</strong> {t('users.form.warningDescription')}
        </div>
      </div>
    </Modal>
  );
}