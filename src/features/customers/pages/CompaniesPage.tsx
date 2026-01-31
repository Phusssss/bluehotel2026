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
  Dropdown,
  Select,
  Row,
  Col,
  Drawer,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCompanies } from '../hooks/useCompanies';
import { CompanyForm, type CompanyFormValues } from '../components/CompanyForm';
import type { Company } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface FilterState {
  searchText: string;
  hasDiscount: string; // 'all' | 'yes' | 'no'
}

/**
 * Companies list page component
 * Displays all companies/partners with search and filter functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function CompaniesPage() {
  const { t } = useTranslation('customers');
  const { 
    companies, 
    loading, 
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    hasDiscount: 'all',
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
   * Filter companies based on current filter state
   */
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = company.name.toLowerCase().includes(searchLower);
        const emailMatch = company.email.toLowerCase().includes(searchLower);
        const taxIdMatch = company.taxId.toLowerCase().includes(searchLower);
        const contactMatch = company.contactPerson?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !emailMatch && !taxIdMatch && !contactMatch) {
          return false;
        }
      }

      // Discount filter
      if (filters.hasDiscount !== 'all') {
        const hasDiscount = !!(company.discountRate && company.discountRate > 0);
        if (filters.hasDiscount === 'yes' && !hasDiscount) {
          return false;
        }
        if (filters.hasDiscount === 'no' && hasDiscount) {
          return false;
        }
      }

      return true;
    });
  }, [companies, filters]);

  /**
   * Handle search input change
   */
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }));
  };

  /**
   * Handle discount filter change
   */
  const handleDiscountFilterChange = (value: string) => {
    setFilters(prev => ({ ...prev, hasDiscount: value }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      searchText: '',
      hasDiscount: 'all',
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
      await fetchCompanies();
      message.success(t('common:common.refresh'));
    } catch (error) {
      message.error(t('companyMessages.loadError'));
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
              {t('companyFilters.discount')}
            </label>
            <Select
              placeholder={t('companyFilters.discountPlaceholder')}
              value={filters.hasDiscount}
              onChange={handleDiscountFilterChange}
              style={{ width: '100%' }}
            >
              <Option value="all">{t('companyFilters.discountAll')}</Option>
              <Option value="yes">{t('companyFilters.discountYes')}</Option>
              <Option value="no">{t('companyFilters.discountNo')}</Option>
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
   * Open form modal for creating new company
   */
  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsFormModalOpen(true);
  };

  /**
   * Open form modal for editing existing company
   */
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsFormModalOpen(true);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = async (values: CompanyFormValues) => {
    setFormLoading(true);
    try {
      if (selectedCompany) {
        // Update existing company
        await updateCompany(selectedCompany.id, values);
        message.success(t('companyMessages.updateSuccess'));
      } else {
        // Create new company
        await createCompany(values);
        message.success(t('companyMessages.createSuccess'));
      }
      setIsFormModalOpen(false);
      setSelectedCompany(null);
    } catch (error: any) {
      const errorMessage = selectedCompany 
        ? t('companyMessages.updateError')
        : t('companyMessages.createError');
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
    setSelectedCompany(null);
  };

  /**
   * Handle company deletion
   */
  const handleDeleteCompany = async (companyId: string) => {
    try {
      await deleteCompany(companyId);
      message.success(t('companyMessages.deleteSuccess'));
    } catch (error: any) {
      if (error.message.includes('linked customers')) {
        message.error(t('companyMessages.deleteWithCustomers'));
      } else {
        message.error(t('companyMessages.deleteError'));
      }
    }
  };

  /**
   * Get action menu items for dropdown
   */
  const getActionMenu = (record: Company): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('editCompany'),
      onClick: () => handleEditCompany(record),
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
          title: t('companyMessages.deleteConfirm'),
          content: record.name,
          okText: t('common:common.yes'),
          cancelText: t('common:common.no'),
          okButtonProps: { danger: true },
          onOk: () => handleDeleteCompany(record.id),
        });
      },
    },
  ];

  /**
   * Table columns configuration with responsive breakpoints
   */
  const columns: ColumnsType<Company> = [
    {
      title: t('companyTable.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <strong>{name}</strong>,
      width: 200,
      ellipsis: true,
    },
    {
      title: t('companyTable.taxId'),
      dataIndex: 'taxId',
      key: 'taxId',
      width: 150,
      responsive: ['md'],
    },
    {
      title: t('companyTable.email'),
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      responsive: ['lg'],
      ellipsis: true,
    },
    {
      title: t('companyTable.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      responsive: ['md'],
    },
    {
      title: t('companyTable.contactPerson'),
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (contactPerson?: string) => contactPerson || '-',
      responsive: ['xl'],
      ellipsis: true,
    },
    {
      title: t('companyTable.discountRate'),
      dataIndex: 'discountRate',
      key: 'discountRate',
      render: (discountRate?: number) =>
        discountRate ? <Tag color="green">{discountRate}%</Tag> : '-',
      responsive: ['lg'],
      width: 120,
      align: 'center',
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
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>{t('companiesTitle')}</Title>
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
            icon={<PlusOutlined />}
            onClick={handleAddCompany}
            size="middle"
          >
            {t('addCompany')}
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
          placeholder={t('companySearchPlaceholder')}
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
      {(filters.searchText || filters.hasDiscount !== 'all') && (
        <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Text type="secondary">
            {t('companyFilters.resultsCount', { 
              count: filteredCompanies.length, 
              total: companies.length 
            })}
          </Text>
        </div>
      )}

      {/* Companies Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Table
          columns={columns}
          dataSource={filteredCompanies}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
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
            emptyText: t('noCompanies'),
          }}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      {/* Company Form Modal */}
      <Modal
        title={selectedCompany ? t('editCompany') : t('addCompany')}
        open={isFormModalOpen}
        onCancel={handleFormCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: 600, top: 20 }}
        destroyOnClose
      >
        <CompanyForm
          company={selectedCompany}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
