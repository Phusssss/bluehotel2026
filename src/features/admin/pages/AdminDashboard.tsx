import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Descriptions,
  List,
  Typography,
  Spin,
  Alert,
} from 'antd';
import {
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../hooks/useAdmin';
import { User, Hotel } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export function AdminDashboard() {
  const { t } = useTranslation('admin');
  const {
    users,
    loading,
    error,
    refreshUsers,
    lockUser,
    unlockUser,
    resetUserPermissions,
    getUserHotels,
  } = useAdmin();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHotels, setUserHotels] = useState<Hotel[]>([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [loadingUserHotels, setLoadingUserHotels] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsModalVisible(true);
    setLoadingUserHotels(true);

    try {
      const hotels = await getUserHotels(user.uid);
      setUserHotels(hotels);
    } catch (err) {
      message.error(t('users.messages.loadError'));
    } finally {
      setLoadingUserHotels(false);
    }
  };

  const handleLockUser = (user: User) => {
    Modal.confirm({
      title: t('users.actions.lockUser'),
      content: t('users.confirmations.lockUser'),
      onOk: async () => {
        try {
          setActionLoading(user.uid);
          await lockUser(user.uid);
          message.success(t('users.messages.userLocked'));
        } catch (err) {
          message.error(t('users.messages.actionError'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleUnlockUser = (user: User) => {
    Modal.confirm({
      title: t('users.actions.unlockUser'),
      content: t('users.confirmations.unlockUser'),
      onOk: async () => {
        try {
          setActionLoading(user.uid);
          await unlockUser(user.uid);
          message.success(t('users.messages.userUnlocked'));
        } catch (err) {
          message.error(t('users.messages.actionError'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleResetPermissions = (user: User) => {
    Modal.confirm({
      title: t('users.actions.resetPermissions'),
      content: t('users.confirmations.resetPermissions'),
      onOk: async () => {
        try {
          setActionLoading(user.uid);
          await resetUserPermissions(user.uid);
          message.success(t('users.messages.permissionsReset'));
        } catch (err) {
          message.error(t('users.messages.actionError'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      title: t('users.columns.name'),
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text: string, record: User) => (
        <Space>
          <img
            src={record.photoURL}
            alt={text}
            style={{ width: 32, height: 32, borderRadius: '50%' }}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: t('users.columns.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('users.columns.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: User['role']) => (
        <Tag color={role === 'super_admin' ? 'red' : 'blue'}>
          {t(`users.role.${role}`)}
        </Tag>
      ),
    },
    {
      title: t('users.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: User['status']) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`users.status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('users.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => dayjs(createdAt.toDate()).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('users.columns.actions'),
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            {t('users.actions.viewDetails')}
          </Button>
          {record.status === 'active' ? (
            <Button
              type="text"
              danger
              icon={<LockOutlined />}
              loading={actionLoading === record.uid}
              onClick={() => handleLockUser(record)}
            >
              {t('users.actions.lockUser')}
            </Button>
          ) : (
            <Button
              type="text"
              icon={<UnlockOutlined />}
              loading={actionLoading === record.uid}
              onClick={() => handleUnlockUser(record)}
            >
              {t('users.actions.unlockUser')}
            </Button>
          )}
          <Button
            type="text"
            danger
            icon={<UserDeleteOutlined />}
            loading={actionLoading === record.uid}
            onClick={() => handleResetPermissions(record)}
          >
            {t('users.actions.resetPermissions')}
          </Button>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <Alert
        message={t('users.messages.loadError')}
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{t('title')}</Title>
        <Text type="secondary">{t('subtitle')}</Text>
      </div>

      <Card
        title={t('users.title')}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshUsers}
            loading={loading}
          >
            {t('common.refresh')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="uid"
          loading={loading}
          locale={{
            emptyText: t('users.empty'),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
        />
      </Card>

      <Modal
        title={t('userDetails.title')}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedUser(null);
          setUserHotels([]);
        }}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <div>
            <Title level={4}>{t('userDetails.basicInfo')}</Title>
            <Descriptions bordered column={2}>
              <Descriptions.Item label={t('userDetails.fields.displayName')}>
                {selectedUser.displayName}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.email')}>
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.phone')}>
                {selectedUser.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.address')}>
                {selectedUser.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.language')}>
                {selectedUser.language}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.timezone')}>
                {selectedUser.timezone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.role')}>
                <Tag color={selectedUser.role === 'super_admin' ? 'red' : 'blue'}>
                  {t(`users.role.${selectedUser.role}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.status')}>
                <Tag color={selectedUser.status === 'active' ? 'green' : 'red'}>
                  {t(`users.status.${selectedUser.status}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.createdAt')}>
                {dayjs(selectedUser.createdAt.toDate()).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label={t('userDetails.fields.updatedAt')}>
                {dayjs(selectedUser.updatedAt.toDate()).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>{t('userDetails.hotels')}</Title>
              {loadingUserHotels ? (
                <Spin />
              ) : userHotels.length > 0 ? (
                <List
                  dataSource={userHotels}
                  renderItem={(hotel) => (
                    <List.Item>
                      <List.Item.Meta
                        title={hotel.name}
                        description={
                          <div>
                            <div>{hotel.address}</div>
                            <div>{hotel.phone} • {hotel.email}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">{t('userDetails.noHotels')}</Text>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}