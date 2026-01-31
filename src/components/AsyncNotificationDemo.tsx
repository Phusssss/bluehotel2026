import { useState } from 'react';
import { Button, Space, Card, Typography, Divider, Switch } from 'antd';
import { 
  withNotifications,
  withCreateNotifications,
  withUpdateNotifications,
  withDeleteNotifications,
  withFormSubmitNotifications,
  withLoadNotifications,
  withAuthNotifications,
  withBatchNotifications,
  withRetryNotifications,
} from '../utils/asyncNotifications';

const { Title, Paragraph } = Typography;

/**
 * Demo component to showcase async notification utilities
 */
export function AsyncNotificationDemo() {
  const [shouldFail, setShouldFail] = useState(false);

  // Simulate async operations
  const simulateSuccess = async (delay: number = 1000) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return { success: true, data: 'Operation completed' };
  };

  const simulateFailure = async (delay: number = 1000) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    throw new Error('Simulated operation failure');
  };

  const simulateOperation = (delay?: number) => 
    shouldFail ? simulateFailure(delay) : simulateSuccess(delay);

  // Basic async notification
  const handleBasicAsync = async () => {
    try {
      await withNotifications(
        () => simulateOperation(),
        {
          loadingMessage: 'messages.processing',
          successMessage: 'messages.operationSuccess',
          errorMessage: 'messages.operationError',
        }
      );
    } catch (error) {
      // Error is already handled by withNotifications
      console.log('Operation failed:', error);
    }
  };

  // CRUD operations
  const handleCreateOperation = async () => {
    try {
      await withCreateNotifications(
        () => simulateOperation(),
        'Room'
      );
    } catch (error) {
      console.log('Create failed:', error);
    }
  };

  const handleUpdateOperation = async () => {
    try {
      await withUpdateNotifications(
        () => simulateOperation(),
        'Reservation'
      );
    } catch (error) {
      console.log('Update failed:', error);
    }
  };

  const handleDeleteOperation = async () => {
    try {
      await withDeleteNotifications(
        () => simulateOperation(),
        'Customer'
      );
    } catch (error) {
      console.log('Delete failed:', error);
    }
  };

  // Form submission
  const handleFormSubmit = async () => {
    try {
      await withFormSubmitNotifications(
        () => simulateOperation(2000) // Longer delay for form submission
      );
    } catch (error) {
      console.log('Form submission failed:', error);
    }
  };

  // Data loading
  const handleDataLoad = async () => {
    try {
      await withLoadNotifications(
        () => simulateOperation(),
        'Hotels'
      );
    } catch (error) {
      console.log('Data loading failed:', error);
    }
  };

  // Authentication
  const handleLogin = async () => {
    try {
      await withAuthNotifications(
        () => simulateOperation(),
        'login'
      );
    } catch (error) {
      console.log('Login failed:', error);
    }
  };

  // Batch operations
  const handleBatchOperations = async () => {
    try {
      await withBatchNotifications([
        () => simulateOperation(500),
        () => simulateOperation(800),
        () => simulateOperation(600),
      ], {
        loadingMessage: 'messages.processing',
        successMessage: 'All operations completed successfully',
        errorMessage: 'Some operations failed',
      });
    } catch (error) {
      console.log('Batch operations failed:', error);
    }
  };

  // Retry operations
  const handleRetryOperation = async () => {
    try {
      await withRetryNotifications(
        () => simulateOperation(500),
        3, // Max 3 retries
        {
          loadingMessage: 'messages.processing',
          successMessage: 'Operation succeeded after retry',
          errorMessage: 'Operation failed after all retries',
        }
      );
    } catch (error) {
      console.log('Retry operation failed:', error);
    }
  };

  // Custom notifications with different options
  const handleCustomNotifications = async () => {
    try {
      await withNotifications(
        () => simulateOperation(1500),
        {
          loadingMessage: 'messages.uploading',
          successMessage: 'File uploaded successfully',
          errorMessage: 'File upload failed',
          showLoading: true,
          showSuccess: true,
          showError: true,
          context: { fileType: 'image', size: '2MB' },
        }
      );
    } catch (error) {
      console.log('Custom operation failed:', error);
    }
  };

  // Silent operation (no success notification)
  const handleSilentOperation = async () => {
    try {
      await withNotifications(
        () => simulateOperation(),
        {
          showSuccess: false, // Don't show success notification
          showLoading: true,
          showError: true,
        }
      );
    } catch (error) {
      console.log('Silent operation failed:', error);
    }
  };

  return (
    <Card title="Async Notification Utilities Demo" style={{ maxWidth: 800, margin: '20px auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Simulate Failure:</span>
          <Switch 
            checked={shouldFail} 
            onChange={setShouldFail}
            checkedChildren="Fail"
            unCheckedChildren="Success"
          />
        </Space>
      </div>

      <Title level={4}>Basic Async Operations</Title>
      <Paragraph>
        These demonstrate basic async operations with loading, success, and error notifications.
      </Paragraph>
      <Space wrap>
        <Button type="primary" onClick={handleBasicAsync}>
          Basic Async
        </Button>
        <Button onClick={handleCustomNotifications}>
          Custom Messages
        </Button>
        <Button onClick={handleSilentOperation}>
          Silent Success
        </Button>
      </Space>

      <Divider />

      <Title level={4}>CRUD Operations</Title>
      <Paragraph>
        These demonstrate CRUD operations with entity-specific notifications.
      </Paragraph>
      <Space wrap>
        <Button type="primary" onClick={handleCreateOperation}>
          Create Room
        </Button>
        <Button onClick={handleUpdateOperation}>
          Update Reservation
        </Button>
        <Button danger onClick={handleDeleteOperation}>
          Delete Customer
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Specialized Operations</Title>
      <Paragraph>
        These demonstrate specialized operation types with appropriate notifications.
      </Paragraph>
      <Space wrap>
        <Button onClick={handleFormSubmit}>
          Form Submit (2s)
        </Button>
        <Button onClick={handleDataLoad}>
          Load Data
        </Button>
        <Button type="primary" onClick={handleLogin}>
          Login
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Advanced Operations</Title>
      <Paragraph>
        These demonstrate advanced patterns like batch operations and retry logic.
      </Paragraph>
      <Space wrap>
        <Button onClick={handleBatchOperations}>
          Batch Operations
        </Button>
        <Button onClick={handleRetryOperation}>
          Retry Operation
        </Button>
      </Space>

      <Divider />

      <Title level={4}>Usage Examples</Title>
      <Paragraph>
        <strong>Basic Usage:</strong>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
{`await withNotifications(
  () => apiCall(),
  {
    loadingMessage: 'messages.saving',
    successMessage: 'messages.saveSuccess',
    errorMessage: 'messages.saveError'
  }
);`}
        </pre>
      </Paragraph>
      <Paragraph>
        <strong>CRUD Usage:</strong>
        <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
{`await withCreateNotifications(
  () => roomService.createRoom(data),
  'Room'
);`}
        </pre>
      </Paragraph>
    </Card>
  );
}

export default AsyncNotificationDemo;