import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Alert,
  Tooltip,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useHotelUsers, HotelUserWithDetails } from '../hooks/useHotelUsers';
import { useAuth } from '../../../contexts/AuthContext';
import { AddUserModal } from './AddUserModal';
import { EditUserPermissionModal } from './EditUserPermissionModal';
import { HotelUser } from '../../../types';

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
  const [selectedUser, setSelectedUser] = useState<HotelUserWithDetails | null>(null);

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

  const columns = [
    {
      title: t('users.table.name'),
      dataIndex: ['user', 'displayName'],
      key: 'name',
      render: (name: string, record: HotelUserWithDetails) => (
        <Space>
          <img
            src={record.user.photoURL}
            alt={name}
            style={{ width: 32, height: 32, borderRadius: '50%' }}
          />
          <div>
            <div>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.user.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: t('users.table.permission'),
      dataIndex: 'permission',
      key: 'permission',
      render: (permission: HotelUser['permission']) => (
        <Tag
          icon={permissionIcons[permission]}
          color={permissionColors[permission]}
        >
          {t(`users.permissions.${permission}`)}
        </Tag>
      ),
    },
    {
      title: t('users.table.phone'),
      dataIndex: ['user', 'phone'],
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: t('users.table.status'),
      dataIndex: ['user', 'status'],
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {t(`users.status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('users.table.actions'),
      key: 'actions',
      render: (_: any, record: HotelUserWithDetails) => {
        const isCurrentUser = record.userId === currentUser?.uid;
        const isOwner = record.permission === 'owner';
        
        return (
          <Space>
            {canManageUsers && !isCurrentUser && (
              <Tooltip title={t('users.actions.editPermission')}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEditPermission(record)}
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{t('users.title')}</h3>
        {canManageUsers && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
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
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            t('common.pagination', {
              start: range[0],
              end: range[1],
              total,
            }),
        }}
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
    </div>
  );
}