import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Row,
  Col,
  Popconfirm,
  Tabs,
  Modal,
  Typography,
  Divider,
  Input,
  Card,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CloseOutlined,
  LoginOutlined,
  LogoutOutlined,
  ReloadOutlined,
  TableOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { useReservations } from '../hooks/useReservations';
import { ReservationDetailsModal } from '../components/ReservationDetailsModal';
import { TapeChart } from '../components/TapeChart';
import { CreateReservationForm } from '../components/CreateReservationForm';
import { CreateGroupBookingForm } from '../components/CreateGroupBookingForm';
import { GroupReservationCard } from '../components/GroupReservationCard';
import { EditReservationForm } from '../components/EditReservationForm';
import type { Reservation, ReservationFilters } from '../../../types';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Search } = Input;

interface FilterState {
  searchText: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  status: string;
  source: string;
}

interface FilterState {
  searchText: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  status: string;
  source: string;
}
const getStatusColor = (status: Reservation['status']) => {
  const colors: Record<Reservation['status'], string> = {
    pending: 'orange',
    confirmed: 'blue',
    'checked-in': 'green',
    'checked-out': 'default',
    cancelled: 'red',
    'no-show': 'red',
  };
  return colors[status];
};

/**
 * ReservationsPage component - manages hotel reservations
 * Displays reservations in table or calendar view with filtering and management
 * Supports responsive design for mobile, tablet, and desktop
 */
export function ReservationsPage() {
  const { t } = useTranslation('reservations');
  const [filters, setFilters] = useState<ReservationFilters>({});
  const [localFilters, setLocalFilters] = useState<FilterState>({
    searchText: '',
    dateRange: null,
    status: 'all',
    source: 'all',
  });
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'calendar'>('table');
  const [showFilters, setShowFilters] = useState(false);
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

  const { reservations, loading, refresh, cancelReservation, checkIn, checkOut } = useReservations(filters);

  /**
   * Group reservations by groupId
   * Returns an object with grouped and single reservations
   */
  const { groupedReservations, singleReservations } = useMemo(() => {
    const groups = new Map<string, Reservation[]>();
    const singles: Reservation[] = [];

    reservations.forEach((reservation) => {
      if (reservation.isGroupBooking && reservation.groupId) {
        const existing = groups.get(reservation.groupId) || [];
        existing.push(reservation);
        groups.set(reservation.groupId, existing);
      } else {
        singles.push(reservation);
      }
    });

    // Sort reservations within each group by groupIndex
    groups.forEach((group) => {
      group.sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0));
    });

    return {
      groupedReservations: Array.from(groups.values()),
      singleReservations: singles,
    };
  }, [reservations]);

  /**
   * Apply filters to reservation list
   */
  const handleApplyFilters = () => {
    const newFilters: ReservationFilters = {};

    if (localFilters.dateRange && localFilters.dateRange[0] && localFilters.dateRange[1]) {
      newFilters.startDate = localFilters.dateRange[0].format('YYYY-MM-DD');
      newFilters.endDate = localFilters.dateRange[1].format('YYYY-MM-DD');
    }

    if (localFilters.status !== 'all') {
      newFilters.status = localFilters.status as Reservation['status'];
    }

    if (localFilters.source !== 'all') {
      newFilters.source = localFilters.source as Reservation['source'];
    }

    setFilters(newFilters);
  };

  /**
   * Handle search input change
   */
  const handleSearch = (value: string) => {
    setLocalFilters(prev => ({ ...prev, searchText: value }));
  };

  /**
   * Handle date range change
   */
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setLocalFilters(prev => ({ ...prev, dateRange: dates }));
  };

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, status: value }));
  };

  /**
   * Handle source filter change
   */
  const handleSourceFilterChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, source: value }));
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setLocalFilters({
      searchText: '',
      dateRange: null,
      status: 'all',
      source: 'all',
    });
    setFilters({});
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
              {t('filters.dateRange')}
            </label>
            <RangePicker
              style={{ width: '100%' }}
              size="middle"
              value={localFilters.dateRange}
              onChange={handleDateRangeChange}
              format="YYYY-MM-DD"
            />
          </div>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.status')}
            </label>
            <Select
              style={{ width: '100%' }}
              size="middle"
              value={localFilters.status}
              onChange={handleStatusFilterChange}
              options={[
                { label: t('status.all'), value: 'all' },
                { label: t('status.pending'), value: 'pending' },
                { label: t('status.confirmed'), value: 'confirmed' },
                { label: t('status.checked-in'), value: 'checked-in' },
                { label: t('status.checked-out'), value: 'checked-out' },
                { label: t('status.cancelled'), value: 'cancelled' },
                { label: t('status.no-show'), value: 'no-show' },
              ]}
            />
          </div>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.source')}
            </label>
            <Select
              style={{ width: '100%' }}
              size="middle"
              value={localFilters.source}
              onChange={handleSourceFilterChange}
              options={[
                { label: t('source.all'), value: 'all' },
                { label: t('source.direct'), value: 'direct' },
                { label: t('source.booking.com'), value: 'booking.com' },
                { label: t('source.airbnb'), value: 'airbnb' },
                { label: t('source.phone'), value: 'phone' },
                { label: t('source.walk-in'), value: 'walk-in' },
                { label: t('source.other'), value: 'other' },
              ]}
            />
          </div>
        </Col>
      </Row>
      
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Space>
            <Button 
              type="primary" 
              onClick={() => {
                handleApplyFilters();
                if (isMobile) closeFilters();
              }}
              size="middle"
            >
              {t('filters.apply')}
            </Button>
            <Button 
              onClick={handleClearFilters}
              size="middle"
            >
              {t('filters.clearFilters')}
            </Button>
          </Space>
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
            onClick={() => {
              handleApplyFilters();
              closeFilters();
            }}
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
   * Open reservation details modal
   */
  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDetailsModalOpen(true);
  };

  /**
   * Open edit reservation modal
   */
  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditModalOpen(true);
  };

  /**
   * Cancel a reservation
   */
  const handleCancelReservation = async (id: string) => {
    await cancelReservation(id);
  };

  /**
   * Check in a guest
   */
  const handleCheckIn = async (id: string) => {
    await checkIn(id);
  };

  /**
   * Check out a guest
   */
  const handleCheckOut = async (id: string) => {
    await checkOut(id);
  };

  /**
   * Handle successful reservation creation
   */
  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    refresh();
  };

  /**
   * Handle successful group booking creation
   */
  const handleCreateGroupSuccess = () => {
    setCreateGroupModalOpen(false);
    refresh();
  };

  /**
   * Handle successful reservation edit
   */
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedReservation(null);
    refresh();
  };

  /**
   * Table columns configuration with responsive breakpoints
   */
  const columns: ColumnsType<Reservation> = useMemo(() => [
    {
      title: t('table.confirmationNumber'),
      dataIndex: 'confirmationNumber',
      key: 'confirmationNumber',
      width: 150,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: t('table.checkIn'),
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => a.checkInDate.localeCompare(b.checkInDate),
    },
    {
      title: t('table.checkOut'),
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('table.guests'),
      dataIndex: 'numberOfGuests',
      key: 'numberOfGuests',
      width: 80,
      align: 'center' as const,
      responsive: ['sm'],
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: Reservation['status']) => (
        <Tag color={getStatusColor(status)}>
          {t(`status.${status}`)}
        </Tag>
      ),
    },
    {
      title: t('table.source'),
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: Reservation['source']) => t(`source.${source}`),
      responsive: ['md'],
    },
    {
      title: t('table.totalPrice'),
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => price.toLocaleString(),
      responsive: ['lg'],
    },
    {
      title: t('table.actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            style={{ padding: 0 }}
          >
            {t('actions.view')}
          </Button>

          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditReservation(record)}
              style={{ padding: 0 }}
            >
              {t('actions.edit')}
            </Button>
          )}

          {(record.status === 'confirmed' || record.status === 'pending') && (
            <Button
              type="link"
              size="small"
              icon={<LoginOutlined />}
              onClick={() => handleCheckIn(record.id)}
              style={{ padding: 0 }}
            >
              {t('actions.checkIn')}
            </Button>
          )}

          {record.status === 'checked-in' && (
            <Button
              type="link"
              size="small"
              icon={<LogoutOutlined />}
              onClick={() => handleCheckOut(record.id)}
              style={{ padding: 0 }}
            >
              {t('actions.checkOut')}
            </Button>
          )}

          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Popconfirm
              title={t('actions.cancel')}
              description="Are you sure you want to cancel this reservation?"
              onConfirm={() => handleCancelReservation(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                style={{ padding: 0 }}
              >
                {t('actions.cancel')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [t, handleCheckIn, handleCheckOut, handleCancelReservation]);

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
            type="default"
            icon={<PlusOutlined />}
            onClick={() => setCreateGroupModalOpen(true)}
            size="middle"
          >
            {t('groupBooking.createButton')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
            size="middle"
          >
            {t('createButton')}
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
          placeholder={t('filters.searchPlaceholder')}
          allowClear
          enterButton={<SearchOutlined />}
          size={isMobile ? 'middle' : 'large'}
          value={localFilters.searchText}
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

      {/* View Tabs and Content */}
      <div>
        <Tabs
          activeKey={activeView}
          onChange={(key) => setActiveView(key as 'table' | 'calendar')}
          size="middle"
          items={[
            {
              key: 'table',
              label: (
                <span>
                  <TableOutlined /> {t('views.table')}
                </span>
              ),
            },
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined /> {t('views.calendar')}
                </span>
              ),
            },
          ]}
        />

        {/* Table View */}
        {activeView === 'table' && (
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            {/* Group Bookings Section */}
            {groupedReservations.length > 0 && (
              <div style={{ padding: '16px' }}>
                <Typography.Title level={4} style={{ marginBottom: 16 }}>
                  {t('groupBooking.title')}
                </Typography.Title>
                {groupedReservations.map((group) => (
                  <GroupReservationCard
                    key={group[0].groupId}
                    reservations={group}
                    onUpdate={refresh}
                    onViewDetails={handleViewDetails}
                  />
                ))}
                {singleReservations.length > 0 && (
                  <Divider style={{ margin: '24px 0' }} />
                )}
              </div>
            )}

            {/* Single Reservations Section */}
            {singleReservations.length > 0 && (
              <div style={{ padding: groupedReservations.length > 0 ? '0 16px 16px' : '16px' }}>
                {groupedReservations.length > 0 && (
                  <Typography.Title level={4} style={{ marginBottom: 16 }}>
                    {t('singleReservations')}
                  </Typography.Title>
                )}
                <Table
                  columns={columns}
                  dataSource={singleReservations}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 1200 }}
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
                  locale={{
                    emptyText: t('messages.noData'),
                  }}
                />
              </div>
            )}

            {/* No data message */}
            {groupedReservations.length === 0 && singleReservations.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                {t('messages.noData')}
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px',
            padding: '16px',
            overflow: 'auto',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            <TapeChart
              reservations={reservations}
              loading={loading}
              onReservationClick={handleViewDetails}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      <ReservationDetailsModal
        reservation={selectedReservation}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedReservation(null);
        }}
      />

      {/* Create Reservation Modal */}
      <Modal
        title={t('createButton')}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
      >
        <CreateReservationForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>

      {/* Create Group Booking Modal */}
      <Modal
        title={t('groupBooking.createButton')}
        open={createGroupModalOpen}
        onCancel={() => setCreateGroupModalOpen(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: 1000, top: 20 }}
      >
        <CreateGroupBookingForm
          onSuccess={handleCreateGroupSuccess}
          onCancel={() => setCreateGroupModalOpen(false)}
        />
      </Modal>

      {/* Edit Reservation Modal */}
      <Modal
        title={t('editButton')}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedReservation(null);
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
      >
        {selectedReservation && (
          <EditReservationForm
            reservation={selectedReservation}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setEditModalOpen(false);
              setSelectedReservation(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
