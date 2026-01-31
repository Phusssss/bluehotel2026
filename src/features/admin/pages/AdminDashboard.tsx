import { useState, useEffect } from 'react';
import {
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
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  UserDeleteOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Hotel } from '../../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/**
 * AdminDashboard component - manages system users and administration
 * Displays user management with view, lock, unlock, and delete functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function AdminDashboard() {
  const { t } = useTranslation('admin');
  const { user: currentUser } = useAuth();
  const {
    users,
    loading,
    error,
    refreshUsers,
    lockUser,
    unlockUser,
    resetUserPermissions,
    deleteUser,
    getUserHotels,
  } = useAdmin();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userHotels, setUserHotels] = useState<Hotel[]>([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [loadingUserHotels, setLoadingUserHotels] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleDeleteUser = (user: User) => {
    // Prevent super admin from deleting their own account
    if (currentUser?.uid === user.uid) {
      message.error(t('users.messages.cannotDeleteSelf'));
      return;
    }

    Modal.confirm({
      title: t('users.actions.deleteUser'),
      content: t('users.confirmations.deleteUser'),
      okText: t('buttons.delete', { ns: 'common' }),
      okType: 'danger',
      onOk: async () => {
        try {
          setActionLoading(user.uid);
          await deleteUser(user.uid);
          message.success(t('users.messages.userDeleted'));
        } catch (err) {
          message.error(t('users.messages.actionError'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  /**
   * Handle row click to view user details on mobile
   */
  const handleRowClick = (record: User) => {
    if (isMobile) {
      handleViewDetails(record);
    }
  };

  /**
   * Table columns configuration with responsive breakpoints
   */
  const columns: ColumnsType<User> = [
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
          <div>
            <Text strong>{text}</Text>
            {isMobile && (
              <div>
                <Tag 
                  color={record.role === 'super_admin' ? 'red' : 'blue'}
                  style={{ marginTop: '4px' }}
                >
                  {t(`users.role.${record.role}`)}
                </Tag>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: t('users.columns.email'),
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
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
      responsive: ['md'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
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
      responsive: ['lg'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
    },
    {
      title: t('users.columns.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => dayjs(createdAt.toDate()).format('YYYY-MM-DD HH:mm'),
      responsive: ['xl'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
    },
    {
      title: t('users.columns.actions'),
      key: 'actions',
      width: isMobile ? 60 : 200,
      render: (_: any, record: User) => {
        const isCurrentUser = currentUser?.uid === record.uid;
        
        if (isMobile) {
          // On mobile, just show a simple view button or chevron
          return (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(record);
              }}
              size="small"
            />
          );
        }
        
        return (
          <Space size="small" wrap>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              size="small"
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
                disabled={isCurrentUser}
                size="small"
              >
                {t('users.actions.lockUser')}
              </Button>
            ) : (
              <Button
                type="text"
                icon={<UnlockOutlined />}
                loading={actionLoading === record.uid}
                onClick={() => handleUnlockUser(record)}
                size="small"
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
              disabled={isCurrentUser}
              size="small"
            >
              {t('users.actions.resetPermissions')}
            </Button>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={actionLoading === record.uid}
              onClick={() => handleDeleteUser(record)}
              disabled={isCurrentUser}
              size="small"
            >
              {t('users.actions.deleteUser')}
            </Button>
          </Space>
        );
      },
    },
  ];

  if (error) {
    return (
      <div style={{ padding: '1px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
            <UserOutlined style={{ marginRight: '8px' }} />
            {t('title')}
          </Title>
        </div>
        <Alert
          message={t('users.messages.loadError')}
          description={error.message}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '1px' }}>
      {/* Mobile row hover styles */}
      {isMobile && (
        <style>
          {`
            .mobile-clickable-row:hover {
              background-color: #f5f5f5 !important;
            }
            .mobile-clickable-row:active {
              background-color: #e6f7ff !important;
            }
          `}
        </style>
      )}
      
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
            <UserOutlined style={{ marginRight: '8px' }} />
            {t('title')}
          </Title>
          <Text type="secondary">{t('subtitle')}</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={refreshUsers}
          loading={loading}
          size="middle"
        >
          {t('common.refresh')}
        </Button>
      </div>

      {/* Users Management */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0 }}>
            {t('users.title')}
            {isMobile && (
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '14px', fontWeight: 'normal' }}>
                ({t('users.tapToView', { ns: 'admin' }) || 'Tap to view details'})
              </Text>
            )}
          </Title>
        </div>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="uid"
          loading={loading}
          scroll={{ x: 600 }}
          locale={{
            emptyText: t('users.empty'),
          }}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total}`,
            responsive: true,
            size: isMobile ? 'small' : 'default',
          }}
          size={isMobile ? 'small' : 'middle'}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { 
              cursor: isMobile ? 'pointer' : 'default' 
            },
          })}
          rowClassName={(record) => 
            isMobile ? 'mobile-clickable-row' : ''
          }
        />
      </div>

      {/* User Details Modal */}
      <Modal
        title={t('userDetails.title')}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedUser(null);
          setUserHotels([]);
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
      >
        {selectedUser && (
          <div>
            <Title level={4}>{t('userDetails.basicInfo')}</Title>
            <Descriptions bordered column={isMobile ? 1 : 2}>
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