import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  message,
  Tag,
  Modal,
  Drawer,
  Dropdown,
  Select,
  Row,
  Col,
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
  FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../hooks/useCustomers';
import { CustomerForm, type CustomerFormValues } from '../components/CustomerForm';
import { CustomerBookingHistory } from '../components/CustomerBookingHistory';
import type { Customer } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface FilterState {
  searchText: string;
  nationality: string;
  hasCompany: string; // 'all' | 'yes' | 'no'
}

/**
 * Customers list page component
 * Displays all customers with search and filter functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function CustomersPage() {
  const { t } = useTranslation('customers');
  const { 
    customers, 
    loading, 
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    nationality: '',
    hasCompany: 'all',
  });

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Get all unique nationalities from customers for filter options
   */
  const allNationalities = useMemo(() => {
    const nationalitiesSet = new Set<string>();
    customers.forEach(customer => {
      if (customer.nationality) {
        nationalitiesSet.add(customer.nationality);
      }
    });
    return Array.from(nationalitiesSet).sort();
  }, [customers]);

  /**
   * Filter customers based on current filter state
   */
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = customer.name.toLowerCase().includes(searchLower);
        const emailMatch = customer.email.toLowerCase().includes(searchLower);
        const phoneMatch = customer.phone.toLowerCase().includes(searchLower);
        const addressMatch = customer.address?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !emailMatch && !phoneMatch && !addressMatch) {
          return false;
        }
      }

      // Nationality filter
      if (filters.nationality && customer.nationality !== filters.nationality) {
        return false;
      }

      // Company filter
      if (filters.hasCompany !== 'all') {
        const hasCompany = !!customer.companyId;
        if (filters.hasCompany === 'yes' && !hasCompany) {
          return false;
        }
        if (filters.hasCompany === 'no' && hasCompany) {
          return false;
        }
      }

      return true;
    });
  }, [customers, filters]);

  /**
   * Handle search input change
   */
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }));
  };

  /**
   * Handle nationality filter change
   */
  const handleNationalityChange = (value: string) => {
    setFilters(prev => ({ ...prev, nationality: value }));
  };

  /**
   * Handle company filter change
   */
  const handleCompanyFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, hasCompany: value }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      searchText: '',
      nationality: '',
      hasCompany: 'all',
    });
  };

  /**
   * Toggle filters visibility
   */
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  /**
   * Close filters (for mobile drawer)
   */
  const closeFilters = () => {
    setShowFilters(false);
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    clearFilters();
    try {
      await fetchCustomers();
      message.success(t('common:common.refresh'));
    } catch (error) {
      message.error(t('messages.loadError'));
    }
  };

  /**
   * Render filter content
   */
  const renderFilterContent = () => (
    <div style={{ padding: isMobile ? '0' : '16px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.nationality')}
            </label>
            <Select
              placeholder={t('filters.nationalityPlaceholder')}
              value={filters.nationality}
              onChange={handleNationalityChange}
              style={{ width: '100%' }}
              allowClear
            >
              {allNationalities.map(nationality => (
                <Option key={nationality} value={nationality}>
                  {nationality}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.company')}
            </label>
            <Select
              placeholder={t('filters.companyPlaceholder')}
              value={filters.hasCompany}
              onChange={handleCompanyFilterChange}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('filters.companyAll')}</Option>
              <Option value="yes">{t('filters.companyYes')}</Option>
              <Option value="no">{t('filters.companyNo')}</Option>
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div style={{ display: 'flex', alignItems: 'end', height: '100%' }}>
            <Button 
              onClick={clearFilters}
              style={{ width: '100%' }}
            >
              {t('filters.clear')}
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* Mobile: Apply and Close buttons */}
      {isMobile && (
        <div style={{ 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: '12px'
        }}>
          <Button 
            type="primary" 
            onClick={closeFilters}
            style={{ flex: 1 }}
          >
            {t('filters.apply')}
          </Button>
          <Button 
            onClick={closeFilters}
            style={{ flex: 1 }}
          >
            {t('common:buttons.close')}
          </Button>
        </div>
      )}
    </div>
  );
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
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <Title level={2} style={{ margin: 0, fontSize: '24px' }} data-tour="customers-title">{t('title')}</Title>
        <Space wrap size="small">
          <Button
            icon={<FilterOutlined />}
            onClick={toggleFilters}
            type={showFilters ? 'primary' : 'default'}
            size="middle"
          >
            {t('filters.toggle')}
          </Button>
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
            data-tour="create-customer"
          >
            {t('addCustomer')}
          </Button>
        </Space>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        marginBottom: '16px',
        position: isMobile ? 'sticky' : 'static',
        top: isMobile ? '0' : 'auto',
        zIndex: isMobile ? 10 : 'auto',
        backgroundColor: '#fff',
        paddingTop: isMobile ? '8px' : '0',
        paddingBottom: isMobile ? '8px' : '0'
      }}>
        <Search
          placeholder={t('searchPlaceholder')}
          allowClear
          enterButton={<SearchOutlined />}
          size={isMobile ? 'middle' : 'large'}
          value={filters.searchText}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
          style={{ marginBottom: showFilters && !isMobile ? '16px' : '0' }}
        />
        
        {/* Desktop: Inline filters */}
        {showFilters && !isMobile && (
          <Card size="small" style={{ marginTop: '16px' }}>
            {renderFilterContent()}
          </Card>
        )}
      </div>

      {/* Mobile: Bottom drawer for filters */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterOutlined />
            {t('filters.title')}
          </div>
        }
        placement="bottom"
        onClose={closeFilters}
        open={showFilters && isMobile}
        height="75vh"
        styles={{
          body: { padding: '16px' },
          header: { 
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '12px'
          }
        }}
        destroyOnClose={false}
      >
        {renderFilterContent()}
      </Drawer>

      {/* Results Summary */}
      {(filters.searchText || filters.nationality || filters.hasCompany !== 'all') && (
        <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Text type="secondary">
            {t('filters.resultsCount', { 
              count: filteredCustomers.length, 
              total: customers.length 
            })}
          </Text>
        </div>
      )}

      {/* Customers Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Table
          data-tour="customers-table"
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          scroll={{ x: 600 }}
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} / ${total}`,
            responsive: true,
            size: isMobile ? 'small' : 'default',
          }}
          locale={{
            emptyText: t('noCustomers'),
          }}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

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
