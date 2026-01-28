import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Typography,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { RoomTypeForm } from '../components/RoomTypeForm';
import type { RoomType, CreateRoomTypeInput } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export function PricingPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  const { roomTypes, loading, createRoomType, updateRoomType, deleteRoomType, refresh } =
    useRoomTypes();
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  const handleCreate = () => {
    setEditingRoomType(undefined);
    setIsModalVisible(true);
  };

  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRoomType(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRoomType(undefined);
  };

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const columns: ColumnsType<RoomType> = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (description) => {
        const text = description?.en || description?.vi || '';
        return text.length > 50 ? `${text.substring(0, 50)}...` : text;
      },
    },
    {
      title: t('columns.basePrice'),
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price) => formatPrice(price),
      sorter: (a, b) => a.basePrice - b.basePrice,
    },
    {
      title: t('columns.capacity'),
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => `${capacity} ${capacity === 1 ? 'guest' : 'guests'}`,
      sorter: (a, b) => a.capacity - b.capacity,
    },
    {
      title: t('columns.amenities'),
      dataIndex: 'amenities',
      key: 'amenities',
      render: (amenities: string[]) => (
        <Space wrap>
          {amenities.slice(0, 3).map((amenity, index) => (
            <Tag key={index}>{amenity}</Tag>
          ))}
          {amenities.length > 3 && <Tag>+{amenities.length - 3} more</Tag>}
        </Space>
      ),
    },
    {
      title: t('columns.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {tCommon('buttons.edit')}
          </Button>
          <Popconfirm
            title={t('roomTypes.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={tCommon('buttons.delete')}
            cancelText={tCommon('buttons.cancel')}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            >
              {tCommon('buttons.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{t('title')}</Title>
      </div>

      <Card
        title={t('roomTypes.title')}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
            >
              {tCommon('common.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              {t('roomTypes.create')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={roomTypes}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${tCommon('common.of')} ${total} ${tCommon('common.items')}`,
          }}
        />
      </Card>

      <Modal
        title={editingRoomType ? t('roomTypes.edit') : t('roomTypes.create')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <RoomTypeForm
          roomType={editingRoomType}
          onSubmit={handleFormSubmit}
          onCancel={handleModalCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}