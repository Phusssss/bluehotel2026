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
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCompanies } from '../hooks/useCompanies';
import { CompanyForm, type CompanyFormValues } from '../components/CompanyForm';
import type { Company } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

/**
 * Companies list page component
 * Displays all companies/partners with search functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function CompaniesPage() {
  const { t } = useTranslation('customers');
  const { 
    companies, 
    loading, 
    searchCompanies, 
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * Handle search input change
   */
  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    setSearching(true);

    try {
      await searchCompanies(value);
    } catch (error) {
      message.error(t('companyMessages.loadError'));
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
      await fetchCompanies();
      message.success(t('common:common.refresh'));
    } catch (error) {
      message.error(t('companyMessages.loadError'));
    }
  };

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
            {t('companiesTitle')}
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
              icon={<PlusOutlined />}
              onClick={handleAddCompany}
              size="middle"
            >
              {t('addCompany')}
            </Button>
          </Space>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder={t('companySearchPlaceholder')}
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
            {t('totalCompanies')}: {companies.length}
          </Tag>
        </div>

        {/* Table */}
        <Spin spinning={loading && !searching}>
          <Table
            columns={columns}
            dataSource={companies}
            rowKey="id"
            scroll={{ x: 800 }}
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
              emptyText: t('noCompanies'),
            }}
            size="middle"
          />
        </Spin>
      </Card>

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
