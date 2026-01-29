import { useState } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  message,
  Spin,
  Tag,
  Modal,
  Drawer,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerForm, type CustomerFormValues } from '../components/CustomerForm';
import { CustomerBookingHistory } from '../components/CustomerBookingHistory';
import type { Customer } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

/**
 * Customers list page component
 * Displays all customers with search functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function CustomersPage() {
  const { t } = useTranslation('customers');
  const { 
    customers, 
    loading, 
    searchCustomers, 
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * Handle search input change
   */
  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    setSearching(true);

    try {
      await searchCustomers(value);
    } catch (error) {
      message.error(t('messages.loadError'));
    } finally {
      setSearching(false);
    }
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    setSearchTerm('');
    try {
      await fetchCustomers();
      message.success(t('common:common.refresh'));
    } catch (error) {
      message.error(t('messages.loadError'));
    }
  };

  /**
   * Open form modal for creating new customer
   */
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormModalOpen(true);
  };

  /**
   * Open form modal for editing existing customer
   */
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormModalOpen(true);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = async (values: CustomerFormValues) => {
    setFormLoading(true);
    try {
      if (selectedCustomer) {
        // Update existing customer
        await updateCustomer(selectedCustomer.id, values);
        message.success(t('messages.updateSuccess'));
      } else {
        // Create new customer
        await createCustomer(values);
        message.success(t('messages.createSuccess'));
      }
      setIsFormModalOpen(false);
      setSelectedCustomer(null);
    } catch (error: any) {
      const errorMessage = selectedCustomer 
        ? t('messages.updateError')
        : t('messages.createError');
      message.error(error.message || errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle form modal cancel
   */
  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setSelectedCustomer(null);
  };

  /**
   * Handle customer deletion
   */
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      message.success(t('messages.deleteSuccess'));
    } catch (error: any) {
      if (error.message.includes('existing reservations')) {
        message.error(t('messages.deleteWithReservations'));
      } else {
        message.error(t('messages.deleteError'));
      }
    }
  };

  /**
   * Open booking history drawer
   */
  const handleViewBookingHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryDrawerOpen(true);
  };

  /**
   * Close booking history drawer
   */
  const handleCloseHistoryDrawer = () => {
    setIsHistoryDrawerOpen(false);
    setSelectedCustomer(null);
  };

  /**
   * Get action menu items for dropdown
   */
  const getActionMenu = (record: Customer): MenuProps['items'] => [
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: t('viewBookingHistory'),
      onClick: () => handleViewBookingHistory(record),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('editCustomer'),
      onClick: () => handleEditCustomer(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('common:common.delete'),
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: t('messages.deleteConfirm'),
          content: record.name,
          okText: t('common:common.yes'),
          cancelText: t('common:common.no'),
          okButtonProps: { danger: true },
          onOk: () => handleDeleteCustomer(record.id),
        });
      },
    },
  ];

  /**
   * Table columns configuration with responsive breakpoints
   */
  const columns: ColumnsType<Customer> = [
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <strong>{name}</strong>,
      width: 150,
      ellipsis: true,
    },
    {
      title: t('table.email'),
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      responsive: ['md'],
      ellipsis: true,
    },
    {
      title: t('table.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: t('table.address'),
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address?: string) => address || '-',
      responsive: ['lg'],
    },
    {
      title: t('table.nationality'),
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality?: string) =>
        nationality ? <Tag color="blue">{nationality}</Tag> : '-',
      responsive: ['lg'],
      width: 120,
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
      <Card>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
            {t('title')}
          </Title>
          <Space wrap size="small">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              size="middle"
            />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleAddCustomer}
              size="middle"
            >
              {t('addCustomer')}
            </Button>
          </Space>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder={t('searchPlaceholder')}
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            loading={searching}
            style={{ maxWidth: '600px' }}
          />
        </div>

        {/* Statistics */}
        <div style={{ marginBottom: '16px' }}>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
            {t('totalCustomers')}: {customers.length}
          </Tag>
        </div>

        {/* Table */}
        <Spin spinning={loading && !searching}>
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            scroll={{ x: 600 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: false,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total}`,
              responsive: true,
              size: 'default',
            }}
            locale={{
              emptyText: t('noCustomers'),
            }}
            size="middle"
          />
        </Spin>
      </Card>

      {/* Customer Form Modal */}
      <Modal
        title={selectedCustomer ? t('editCustomer') : t('addCustomer')}
        open={isFormModalOpen}
        onCancel={handleFormCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: 600, top: 20 }}
        destroyOnClose
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>

      {/* Booking History Drawer */}
      <Drawer
        title={`${t('bookingHistory')} - ${selectedCustomer?.name || ''}`}
        placement="right"
        onClose={handleCloseHistoryDrawer}
        open={isHistoryDrawerOpen}
        width="95%"
        style={{ maxWidth: 900 }}
        destroyOnClose
      >
        {selectedCustomer && (
          <CustomerBookingHistory customerId={selectedCustomer.id} />
        )}
      </Drawer>
    </div>
  );
}
