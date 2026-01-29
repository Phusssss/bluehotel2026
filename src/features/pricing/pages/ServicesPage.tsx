import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Tag,
  Switch,
  Popconfirm,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { useServices } from '../hooks/useServices';
import { ServiceForm } from '../components/ServiceForm';
import { useHotel } from '../../../contexts/HotelContext';
import type { Service } from '../../../types';
import type { CreateServiceInput } from '../../../services/serviceService';

const { Title } = Typography;

export function ServicesPage() {
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');
  const { currentHotel } = useHotel();
  const {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
  } = useServices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      await toggleServiceStatus(id, active);
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const handleFormSubmit = async (data: CreateServiceInput) => {
    try {
      setFormLoading(true);
      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data);
      }
      setIsModalOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const getCategoryColor = (category: Service['category']) => {
    const colors: Record<Service['category'], string> = {
      laundry: 'blue',
      food: 'green',
      transport: 'orange',
      spa: 'purple',
      other: 'default',
    };
    return colors[category];
  };

  const columns: ColumnsType<Service> = [
    {
      title: t('services.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      fixed: 'left',
      width: 150,
    },
    {
      title: t('services.description'),
      dataIndex: 'description',
      key: 'description',
      render: (description) => description.en || description.vi || '-',
      ellipsis: true,
      responsive: ['md'] as any,
    },
    {
      title: t('services.price'),
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString()} ${currentHotel?.currency}`,
      sorter: (a, b) => a.price - b.price,
      width: 120,
    },
    {
      title: t('services.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {t(`services.categories.${category}`)}
        </Tag>
      ),
      filters: [
        { text: t('services.categories.laundry'), value: 'laundry' },
        { text: t('services.categories.food'), value: 'food' },
        { text: t('services.categories.transport'), value: 'transport' },
        { text: t('services.categories.spa'), value: 'spa' },
        { text: t('services.categories.other'), value: 'other' },
      ],
      onFilter: (value, record) => record.category === value,
      width: 120,
      responsive: ['lg'] as any,
    },
    {
      title: t('services.taxable'),
      dataIndex: 'taxable',
      key: 'taxable',
      render: (taxable) => (
        <Tag color={taxable ? 'green' : 'default'}>
          {taxable ? tCommon('yes') : tCommon('no')}
        </Tag>
      ),
      width: 100,
      responsive: ['xl'] as any,
    },
    {
      title: t('services.active'),
      dataIndex: 'active',
      key: 'active',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
        />
      ),
      width: 80,
    },
    {
      title: tCommon('actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            {tCommon('buttons.edit')}
          </Button>
          <Popconfirm
            title={t('services.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={tCommon('buttons.yes')}
            cancelText={tCommon('buttons.no')}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              {tCommon('buttons.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 150,
      fixed: 'right',
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={3}>{t('services.title')}</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t('services.createButton')}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t('services.totalItems', { count: total }),
          }}
        />
      </Card>

      <Modal
        title={
          editingService ? t('services.editTitle') : t('services.createTitle')
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ServiceForm
          service={editingService || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
