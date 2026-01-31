import { Button, Space, Card, Typography, Divider } from 'antd';
import { useNotifications } from '../hooks/useNotifications';
import { AppError } from '../utils/errors';

const { Title, Paragraph } = Typography;

/**
 * Demo component to showcase the notification system
 * This component demonstrates various notification patterns
 */
export function NotificationDemo() {
  const notifications = useNotifications();

  const handleBasicSuccess = () => {
    notifications.success('messages.operationSuccess');
  };

  const handleBasicError = () => {
    notifications.error('messages.operationError');
  };

  const handleBasicWarning = () => {
    notifications.warning('messages.sessionExpired');
  };

  const handleBasicInfo = () => {
    notifications.info('messages.loading');
  };

  const handleAppError = () => {
    const error = new AppError(
      'This is a test error',
      'TEST_ERROR',
      400,
      true,
      { context: 'demo' }
    );
    notifications.error(error);
  };

  const handleCrudSuccess = () => {
    notifications.crud.createSuccess('Room');
  };

  const handleCrudError = () => {
    notifications.crud.deleteError('Reservation');
  };

  const handleFormValidation = () => {
    notifications.form.validationError();
  };

  const handleAuthSuccess = () => {
    notifications.auth.loginSuccess();
  };

  const handleHotelSelection = () => {
    notifications.hotel.selected('Grand Hotel');
  };

  const handleLoadingDemo = () => {
    const hide = notifications.loading('messages.processing');
    
    // Simulate async operation
    setTimeout(() => {
      hide();
      notifications.success('messages.operationSuccess');
    }, 2000);
  };

  const handleInterpolation = () => {
    notifications.notifySuccess('messages.hotelSelected', { hotel: 'Demo Hotel' });
  };

  return (
    <Card title="Notification System Demo" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Title level={4}>Basic Notifications</Title>
      <Paragraph>
        These demonstrate the basic notification types with localized messages.
      </Paragraph>
      <Space wrap>
        <Button type="primary" onClick={handleBasicSuccess}>
          Success
        </Button>
        <Button danger onClick={handleBasicError}>
          Error
        </Button>
        <Button onClick={handleBasicWarning}>
          Warning
        </Button>
        <Button type="dashed" onClick={handleBasicInfo}>
          Info
        </Button>
        <Button onClick={handleLoadingDemo}>
          Loading (2s)
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Error Handling</Title>
      <Paragraph>
        These demonstrate error handling with AppError instances.
      </Paragraph>
      <Space wrap>
        <Button danger onClick={handleAppError}>
          AppError Example
        </Button>
      </Space>

      <Divider />

      <Title level={4}>CRUD Operations</Title>
      <Paragraph>
        These demonstrate common CRUD operation notifications.
      </Paragraph>
      <Space wrap>
        <Button type="primary" onClick={handleCrudSuccess}>
          Create Success
        </Button>
        <Button danger onClick={handleCrudError}>
          Delete Error
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Form Operations</Title>
      <Paragraph>
        These demonstrate form-related notifications.
      </Paragraph>
      <Space wrap>
        <Button onClick={handleFormValidation}>
          Validation Error
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Authentication</Title>
      <Paragraph>
        These demonstrate authentication-related notifications.
      </Paragraph>
      <Space wrap>
        <Button type="primary" onClick={handleAuthSuccess}>
          Login Success
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Hotel Management</Title>
      <Paragraph>
        These demonstrate hotel-specific notifications.
      </Paragraph>
      <Space wrap>
        <Button type="primary" onClick={handleHotelSelection}>
          Hotel Selected
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Message Interpolation</Title>
      <Paragraph>
        These demonstrate dynamic message content with variables.
      </Paragraph>
      <Space wrap>
        <Button onClick={handleInterpolation}>
          Hotel Selected (with name)
        </Button>
      </Space>
    </Card>
  );
}

export default NotificationDemo;