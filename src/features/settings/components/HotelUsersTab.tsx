import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Alert,
  Tooltip,
  Modal,
  Descriptions,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  ToolOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useHotelUsers, HotelUserWithDetails } from '../hooks/useHotelUsers';
import { useAuth } from '../../../contexts/AuthContext';
import { AddUserModal } from './AddUserModal';
import { EditUserPermissionModal } from './EditUserPermissionModal';
import { HotelUser } from '../../../types';

const { Title, Text } = Typography;

const permissionIcons = {
  owner: <CrownOutlined />,
  manager: <TeamOutlined />,
  receptionist: <UserOutlined />,
  housekeeping: <ToolOutlined />,
};

const permissionColors = {
  owner: 'gold',
  manager: 'blue',
  receptionist: 'green',
  housekeeping: 'orange',
};

export function HotelUsersTab() {
  const { t } = useTranslation('settings');
  const { user: currentUser } = useAuth();
  const {
    hotelUsers,
    loading,
    error,
    addUser,
    updateUserPermission,
    removeUser,
    refresh,
    canManageUsers,
  } = useHotelUsers();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HotelUserWithDetails | null>(null);
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

  const handleAddUser = async (userEmail: string, permission: HotelUser['permission']) => {
    try {
      await addUser(userEmail, permission);
      message.success(t('users.addSuccess'));
      setAddModalVisible(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('users.addError'));
    }
  };

  const handleEditPermission = (user: HotelUserWithDetails) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleViewDetails = (user: HotelUserWithDetails) => {
    setSelectedUser(user);
    setDetailsModalVisible(true);
  };

  /**
   * Handle row click to view user details on mobile
   */
  const handleRowClick = (record: HotelUserWithDetails) => {
    if (isMobile) {
      handleViewDetails(record);
    }
  };

  const handleUpdatePermission = async (permission: HotelUser['permission']) => {
    if (!selectedUser) return;

    try {
      await updateUserPermission(selectedUser.userId, permission);
      message.success(t('users.updateSuccess'));
      setEditModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('users.updateError'));
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(userId);
      message.success(t('users.removeSuccess'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('users.removeError'));
    }
  };

  const columns: ColumnsType<HotelUserWithDetails> = [
    {
      title: t('users.table.name'),
      dataIndex: ['user', 'displayName'],
      key: 'name',
      ellipsis: true,
      render: (name: string, record: HotelUserWithDetails) => (
        <Space>
          {record.user.photoURL ? (
            <img
              src={record.user.photoURL}
              alt={name}
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #f0f0f0'
              }}
              onError={(e) => {
                // Fallback to UserOutlined icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const iconDiv = document.createElement('div');
                  iconDiv.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;';
                  iconDiv.innerHTML = '<svg viewBox="64 64 896 896" focusable="false" data-icon="user" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.3 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>';
                  parent.insertBefore(iconDiv, target);
                }
              }}
            />
          ) : (
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              background: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#999',
              border: '1px solid #f0f0f0'
            }}>
              <UserOutlined />
            </div>
          )}
          <div>
            <Text strong>{name}</Text>
            {isMobile && (
              <div>
                <Tag
                  icon={permissionIcons[record.permission]}
                  color={permissionColors[record.permission]}
                  style={{ marginTop: '4px' }}
                >
                  {t(`users.permissions.${record.permission}`)}
                </Tag>
              </div>
            )}
            {!isMobile && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.user.email}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: t('users.table.permission'),
      dataIndex: 'permission',
      key: 'permission',
      width: 'auto',
      render: (permission: HotelUser['permission']) => (
        <Tag
          icon={permissionIcons[permission]}
          color={permissionColors[permission]}
        >
          {t(`users.permissions.${permission}`)}
        </Tag>
      ),
      responsive: ['md'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
    },
    {
      title: t('users.table.phone'),
      dataIndex: ['user', 'phone'],
      key: 'phone',
      width: 'auto',
      render: (phone: string) => phone || '-',
      responsive: ['lg'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
    },
    {
      title: t('users.table.status'),
      dataIndex: ['user', 'status'],
      key: 'status',
      width: 'auto',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`users.status.${status}`)}
        </Tag>
      ),
      responsive: ['lg'] as ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')[],
    },
    {
      title: t('users.table.actions'),
      key: 'actions',
      width: isMobile ? 60 : 'auto',
      fixed: 'right',
      render: (_: unknown, record: HotelUserWithDetails) => {
        const isCurrentUser = record.userId === currentUser?.uid;
        const isOwner = record.permission === 'owner';
        
        if (isMobile) {
          // On mobile, just show a simple view button
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
          <Space>
            <Tooltip title={t('users.actions.viewDetails')}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
                size="small"
              />
            </Tooltip>
            {canManageUsers && !isCurrentUser && (
              <Tooltip title={t('users.actions.editPermission')}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditPermission(record)}
                  size="small"
                />
              </Tooltip>
            )}
            {canManageUsers && !isCurrentUser && !isOwner && (
              <Popconfirm
                title={t('users.actions.removeConfirm')}
                description={t('users.actions.removeDescription')}
                onConfirm={() => handleRemoveUser(record.userId)}
                okText={t('common.yes')}
                cancelText={t('common.no')}
              >
                <Tooltip title={t('users.actions.remove')}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  if (error) {
    return (
      <Alert
        message={t('users.error')}
        description={error.message}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={refresh}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  }

  return (
    <div>
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

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {isMobile && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('users.tapToView') || 'Tap to view details'}
            </Text>
          )}
        </div>
        {canManageUsers && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
            size="large"
          >
            {t('users.addUser')}
          </Button>
        )}
      </div>

      {!canManageUsers && (
        <Alert
          message={t('users.noPermission')}
          description={t('users.noPermissionDescription')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={hotelUsers}
        loading={loading}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        tableLayout="auto"
        pagination={{
          pageSize: isMobile ? 5 : 10,
          showSizeChanger: !isMobile,
          showQuickJumper: !isMobile,
          showTotal: (total, range) =>
            t('common.pagination', {
              start: range[0],
              end: range[1],
              total,
            }),
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

      <AddUserModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAddUser}
      />

      <EditUserPermissionModal
        visible={editModalVisible}
        user={selectedUser}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdatePermission}
      />

      {/* User Details Modal */}
      <Modal
        title={t('users.details.title')}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedUser(null);
        }}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
        footer={
          selectedUser && (
            <Space>
              {canManageUsers && selectedUser.userId !== currentUser?.uid && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setDetailsModalVisible(false);
                    handleEditPermission(selectedUser);
                  }}
                >
                  {t('users.actions.editPermission')}
                </Button>
              )}
              {canManageUsers && selectedUser.userId !== currentUser?.uid && selectedUser.permission !== 'owner' && (
                <Popconfirm
                  title={t('users.actions.removeConfirm')}
                  description={t('users.actions.removeDescription')}
                  onConfirm={() => {
                    setDetailsModalVisible(false);
                    handleRemoveUser(selectedUser.userId);
                  }}
                  okText={t('common.yes')}
                  cancelText={t('common.no')}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    {t('users.actions.remove')}
                  </Button>
                </Popconfirm>
              )}
              <Button onClick={() => setDetailsModalVisible(false)}>
                {t('common.cancel')}
              </Button>
            </Space>
          )
        }
      >
        {selectedUser && (
          <div>
            <Title level={4}>{t('users.details.basicInfo')}</Title>
            <Descriptions bordered column={isMobile ? 1 : 2}>
              <Descriptions.Item label={t('users.table.name')}>
                <Space>
                  {selectedUser.user.photoURL ? (
                    <img
                      src={selectedUser.user.photoURL}
                      alt={selectedUser.user.displayName}
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #f0f0f0'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const iconDiv = document.createElement('div');
                          iconDiv.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;';
                          iconDiv.innerHTML = '<svg viewBox="64 64 896 896" focusable="false" data-icon="user" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.3 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>';
                          parent.insertBefore(iconDiv, target);
                        }
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: '#f0f0f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: '#999',
                      border: '1px solid #f0f0f0'
                    }}>
                      <UserOutlined />
                    </div>
                  )}
                  {selectedUser.user.displayName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.details.email')}>
                {selectedUser.user.email}
              </Descriptions.Item>
              <Descriptions.Item label={t('users.table.phone')}>
                {selectedUser.user.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('users.details.address')}>
                {selectedUser.user.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('users.table.permission')}>
                <Tag
                  icon={permissionIcons[selectedUser.permission]}
                  color={permissionColors[selectedUser.permission]}
                >
                  {t(`users.permissions.${selectedUser.permission}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.details.permissionDescription')}>
                {t(`users.permissionDescriptions.${selectedUser.permission}`)}
              </Descriptions.Item>
              <Descriptions.Item label={t('users.table.status')}>
                <Tag color={selectedUser.user.status === 'active' ? 'green' : 'red'}>
                  {t(`users.status.${selectedUser.user.status}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('users.details.language')}>
                {selectedUser.user.language || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}