import { useState, useMemo } from 'react';
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

/**
 * Get color for reservation status tag
 * @param status - Reservation status
 * @returns Color string for Ant Design Tag
 */
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
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'calendar'>('table');

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

    if (dateRange && dateRange[0] && dateRange[1]) {
      newFilters.startDate = dateRange[0].format('YYYY-MM-DD');
      newFilters.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    if (statusFilter !== 'all') {
      newFilters.status = statusFilter as Reservation['status'];
    }

    if (sourceFilter !== 'all') {
      newFilters.source = sourceFilter as Reservation['source'];
    }

    setFilters(newFilters);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setDateRange(null);
    setStatusFilter('all');
    setSourceFilter('all');
    setFilters({});
  };

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

        {/* Filters - Only show for table view */}
        {activeView === 'table' && (
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 8 }}>
                  <strong>{t('filters.dateRange')}</strong>
                </div>
                <RangePicker
                  style={{ width: '100%' }}
                  size="middle"
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
                  format="YYYY-MM-DD"
                />
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 8 }}>
                  <strong>{t('filters.status')}</strong>
                </div>
                <Select
                  style={{ width: '100%' }}
                  size="middle"
                  value={statusFilter}
                  onChange={setStatusFilter}
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
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 8 }}>
                  <strong>{t('filters.source')}</strong>
                </div>
                <Select
                  style={{ width: '100%' }}
                  size="middle"
                  value={sourceFilter}
                  onChange={setSourceFilter}
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
              </Col>
            </Row>

            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Space>
                  <Button 
                    type="primary" 
                    onClick={handleApplyFilters}
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
          </div>
        )}

        {/* Table View */}
        {activeView === 'table' && (
          <div style={{ 
            background: '#fff', 
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            {/* Group Bookings Section */}
            {groupedReservations.length > 0 && (
              <>
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
              </>
            )}

            {/* Single Reservations Section */}
            {singleReservations.length > 0 && (
              <>
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
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: false,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} / ${total}`,
                    responsive: true,
                    size: 'default',
                  }}
                  size="middle"
                  locale={{
                    emptyText: t('messages.noData'),
                  }}
                />
              </>
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
