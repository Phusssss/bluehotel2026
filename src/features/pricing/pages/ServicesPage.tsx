import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Tag,
  Switch,
  Typography,
  Input,
  Select,
  Card,
  Row,
  Col,
  Drawer,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { useServices } from '../hooks/useServices';
import { ServiceForm } from '../components/ServiceForm';
import { useHotel } from '../../../contexts/HotelContext';
import type { Service } from '../../../types';
import type { CreateServiceInput } from '../../../services/serviceService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface FilterState {
  searchText: string;
  category: Service['category'] | 'all';
  active: 'all' | 'active' | 'inactive';
}

/**
 * ServicesPage component - manages hotel services
 * Displays a table of services with create, edit, delete, and toggle status functionality
 * Includes filtering and search capabilities
 * Supports responsive design for mobile, tablet, and desktop
 */
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
    refresh,
  } = useServices();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    category: 'all',
    active: 'all',
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
   * Filter services based on current filter state
   */
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = service.name.toLowerCase().includes(searchLower);
        const descriptionMatch = 
          (service.description?.en?.toLowerCase().includes(searchLower)) ||
          (service.description?.vi?.toLowerCase().includes(searchLower));
        
        if (!nameMatch && !descriptionMatch) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && service.category !== filters.category) {
        return false;
      }

      // Active status filter
      if (filters.active !== 'all') {
        const isActive = service.active;
        if (filters.active === 'active' && !isActive) {
          return false;
        }
        if (filters.active === 'inactive' && isActive) {
          return false;
        }
      }

      return true;
    });
  }, [services, filters]);

  /**
   * Handle search input change
   */
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }));
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (value: Service['category'] | 'all') => {
    setFilters(prev => ({ ...prev, category: value }));
  };

  /**
   * Handle active status filter change
   */
  const handleActiveFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setFilters(prev => ({ ...prev, active: value }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      searchText: '',
      category: 'all',
      active: 'all',
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
   * Render filter content
   */
  const renderFilterContent = () => (
    <div style={{ padding: isMobile ? '0' : '16px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('services.filters.category')}
            </label>
            <Select
              placeholder={t('services.filters.categoryPlaceholder')}
              value={filters.category}
              onChange={handleCategoryChange}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('services.filters.categoryAll')}</Option>
              <Option value="laundry">{t('services.categories.laundry')}</Option>
              <Option value="food">{t('services.categories.food')}</Option>
              <Option value="transport">{t('services.categories.transport')}</Option>
              <Option value="spa">{t('services.categories.spa')}</Option>
              <Option value="other">{t('services.categories.other')}</Option>
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('services.filters.status')}
            </label>
            <Select
              placeholder={t('services.filters.statusPlaceholder')}
              value={filters.active}
              onChange={handleActiveFilterChange}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('services.filters.statusAll')}</Option>
              <Option value="active">{t('services.filters.statusActive')}</Option>
              <Option value="inactive">{t('services.filters.statusInactive')}</Option>
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
            {tCommon('buttons.close')}
          </Button>
        </div>
      )}
    </div>
  );

  const handleCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  /**
   * Handle delete service
   */
  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  /**
   * Show delete confirmation modal
   */
  const showDeleteConfirm = (record: Service) => {
    Modal.confirm({
      title: t('services.deleteConfirm'),
      icon: <ExclamationCircleOutlined />,
      content: `${record.name}`,
      okText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      okButtonProps: { danger: true },
      onOk: () => handleDelete(record.id),
    });
  };

  /**
   * Handle toggle service status
   */
  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      await toggleServiceStatus(id, active);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  /**
   * Handle form submission
   */
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
      // Error handling is done in the hook
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle form modal cancel
   */
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  /**
   * Get category color for tags
   */
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

  /**
   * Get action menu items for dropdown
   */
  const getActionMenu = (record: Service): MenuProps['items'] => [
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
  const columns: ColumnsType<Service> = [
    {
      title: t('services.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 150,
      ellipsis: true,
    },
    {
      title: t('services.description'),
      dataIndex: 'description',
      key: 'description',
      render: (description) => {
        const text = description?.en || description?.vi || '';
        return text.length > 40 ? `${text.substring(0, 40)}...` : text;
      },
      ellipsis: true,
      responsive: ['md'],
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
      width: 120,
      responsive: ['lg'],
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
      responsive: ['xl'],
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
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>{t('services.title')}</Title>
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
            {t('services.createButton')}
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
          placeholder={t('services.filters.searchPlaceholder')}
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
      >
        {renderFilterContent()}
      </Drawer>

      {/* Results Summary */}
      {(filters.searchText || filters.category !== 'all' || filters.active !== 'all') && (
        <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Text type="secondary">
            {t('services.filters.resultsCount', { 
              count: filteredServices.length, 
              total: services.length 
            })}
          </Text>
        </div>
      )}

      {/* Services Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Table
          columns={columns}
          dataSource={filteredServices}
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
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      {/* Create/Edit Service Modal */}
      <Modal
        title={editingService ? t('services.editTitle') : t('services.createTitle')}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
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
