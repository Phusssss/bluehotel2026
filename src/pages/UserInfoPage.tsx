import { Form, Input, Select, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useValidationRules } from '../utils/validation';

const { Option } = Select;

interface UserInfoFormValues {
  displayName: string;
  phone: string;
  address: string;
  language: string;
  timezone: string;
}

export function UserInfoPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm<UserInfoFormValues>();
  const { updateUserProfile, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const validation = useValidationRules(t);

  const handleSubmit = async (values: UserInfoFormValues) => {
    setLoading(true);
    try {
      await updateUserProfile(values);
      message.success(t('userInfo.success'));
      navigate('/add-hotel');
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error(t('userInfo.error'));
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
      }}
    >
      <Card
        style={{ width: 600 }}
        title={t('userInfo.title')}
        extra={<LanguageSwitcher />}
      >
        <p style={{ marginBottom: 24 }}>
          {t('userInfo.welcome')}
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            displayName: user?.displayName || '',
            language: user?.language || 'en',
            timezone: 'Asia/Ho_Chi_Minh',
          }}
        >
          <Form.Item
            name="displayName"
            label={t('userInfo.fullName')}
            rules={[
              validation.requiredTrim(),
              validation.minLength(2),
              validation.maxLength(100),
            ]}
          >
            <Input placeholder={t('userInfo.fullNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="phone"
            label={t('userInfo.phone')}
            rules={[
              validation.requiredTrim(),
              validation.phone(),
              validation.minLength(10),
              validation.maxLength(20),
            ]}
          >
            <Input placeholder={t('userInfo.phonePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="address"
            label={t('userInfo.address')}
            rules={[
              validation.requiredTrim(),
              validation.minLength(10),
              validation.maxLength(500),
            ]}
          >
            <Input.TextArea rows={3} placeholder={t('userInfo.addressPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="language"
            label={t('userInfo.language')}
            rules={[validation.required()]}
          >
            <Select>
              <Option value="en">English</Option>
              <Option value="vi">Tiếng Việt</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timezone"
            label={t('userInfo.timezone')}
            rules={[validation.required()]}
          >
            <Select>
              <Option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</Option>
              <Option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</Option>
              <Option value="Asia/Singapore">Asia/Singapore (GMT+8)</Option>
              <Option value="UTC">UTC (GMT+0)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('buttons.continue')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
