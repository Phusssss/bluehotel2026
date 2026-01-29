import { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Typography,
  Tag,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { RoomTypeForm } from '../components/RoomTypeForm';
import { RoomTypeDetailModal } from '../components/RoomTypeDetailModal';
import type { RoomType, CreateRoomTypeInput } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

/**
 * PricingPage component - manages room types and pricing
 * Displays a table of room types with create, edit, delete, and view details functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function PricingPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const { roomTypes, loading, createRoomType, updateRoomType, deleteRoomType, refresh } =
    useRoomTypes();
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  /**
   * Handle create room type button click
   */
  const handleCreate = () => {
    setEditingRoomType(undefined);
    setIsModalVisible(true);
  };

  /**
   * Handle edit room type button click
   */
  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setIsModalVisible(true);
  };

  /**
   * Handle view details button click
   */
  const handleViewDetails = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setDetailModalVisible(true);
  };

  /**
   * Handle delete room type
   */
  const handleDelete = async (id: string) => {
    try {
      await deleteRoomType(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  /**
   * Show delete confirmation modal
   */
  const showDeleteConfirm = (record: RoomType) => {
    Modal.confirm({
      title: t('roomTypes.deleteConfirm'),
      icon: <ExclamationCircleOutlined />,
      content: `${record.name}`,
      okText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      okButtonProps: { danger: true },
      onOk: () => handleDelete(record.id),
    });
  };

  /**
   * Handle form modal cancel
   */
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRoomType(undefined);
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: CreateRoomTypeInput) => {
    try {
      setFormLoading(true);
      if (editingRoomType) {
        await updateRoomType(editingRoomType.id, data);
      } else {
        await createRoomType(data);
      }
      setIsModalVisible(false);
      setEditingRoomType(undefined);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Format price with Vietnamese locale
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  /**
   * Get action menu items for dropdown
   */
  const getActionMenu = (record: RoomType): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('roomTypes.details'),
      onClick: () => handleViewDetails(record),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: tCommon('buttons.edit'),
      onClick: () => handleEdit(record),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: tCommon('buttons.delete'),
      danger: true,
      onClick: () => showDeleteConfirm(record),
    },
  ];

  /**
   * Table columns configuration with responsive breakpoints
   */
  const columns: ColumnsType<RoomType> = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 150,
      ellipsis: true,
      render: (name, record) => (
        <Button
          type="link"
          onClick={() => handleViewDetails(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {name}
        </Button>
      ),
    },
    {
      title: t('columns.basePrice'),
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price) => formatPrice(price),
      sorter: (a, b) => a.basePrice - b.basePrice,
      width: 120,
    },
    {
      title: t('columns.capacity'),
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => `${capacity}`,
      sorter: (a, b) => a.capacity - b.capacity,
      width: 80,
      responsive: ['sm'],
    },
    {
      title: t('columns.amenities'),
      dataIndex: 'amenities',
      key: 'amenities',
      render: (amenities: string[]) => (
        <Space wrap>
          {amenities.slice(0, 2).map((amenity, index) => (
            <Tag key={index}>{amenity}</Tag>
          ))}
          {amenities.length > 2 && <Tag>+{amenities.length - 2}</Tag>}
        </Space>
      ),
      responsive: ['md'],
      ellipsis: true,
    },
    {
      title: t('columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (description) => {
        const text = description?.en || description?.vi || '';
        return text.length > 40 ? `${text.substring(0, 40)}...` : text;
      },
      responsive: ['lg'],
      ellipsis: true,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenu(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '1px' }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>{t('title')}</Title>
        <Space wrap size="small">
          <Button
            icon={<ReloadOutlined />}
            onClick={refresh}
            loading={loading}
            size="middle"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="middle"
          >
            {t('roomTypes.create')}
          </Button>
        </Space>
      </div>

      {/* Room Types Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Table
          columns={columns}
          dataSource={roomTypes}
          rowKey="id"
          loading={loading}
          scroll={{ x: 600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total}`,
            responsive: true,
            size: 'default',
          }}
          size="middle"
        />
      </div>

      {/* Create/Edit Room Type Modal */}
      <Modal
        title={editingRoomType ? t('roomTypes.edit') : t('roomTypes.create')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
      >
        <RoomTypeForm
          roomType={editingRoomType}
          onSubmit={handleFormSubmit}
          onCancel={handleModalCancel}
          loading={formLoading}
        />
      </Modal>

      {/* Room Type Detail Modal */}
      <RoomTypeDetailModal
        roomType={selectedRoomType}
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedRoomType(null);
        }}
      />
    </div>
  );
}
