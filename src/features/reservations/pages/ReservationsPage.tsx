import { useState, useMemo, useEffect } from 'react';
import {
  Card,
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
import { EditReservationForm } from '../components/EditReservationForm';
import type { Reservation, ReservationFilters } from '../../../types';

const { RangePicker } = DatePicker;

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

export function ReservationsPage() {
  const { t } = useTranslation('reservations');
  const [filters, setFilters] = useState<ReservationFilters>({});
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'table' | 'calendar'>('table');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { reservations, loading, refresh, cancelReservation, checkIn, checkOut } = useReservations(filters);

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

  const handleClearFilters = () => {
    setDateRange(null);
    setStatusFilter('all');
    setSourceFilter('all');
    setFilters({});
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDetailsModalOpen(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditModalOpen(true);
  };

  const handleCancelReservation = async (id: string) => {
    await cancelReservation(id);
  };

  const handleCheckIn = async (id: string) => {
    await checkIn(id);
  };

  const handleCheckOut = async (id: string) => {
    await checkOut(id);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedReservation(null);
    refresh();
  };

  const columns: ColumnsType<Reservation> = useMemo(() => [
    {
      title: t('table.confirmationNumber'),
      dataIndex: 'confirmationNumber',
      key: 'confirmationNumber',
      width: isMobile ? 120 : 150,
      fixed: isMobile ? undefined : 'left',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: t('table.checkIn'),
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      width: 100,
      render: (date: string) => dayjs(date).format(isMobile ? 'MM/DD' : 'YYYY-MM-DD'),
      sorter: (a, b) => a.checkInDate.localeCompare(b.checkInDate),
    },
    {
      title: t('table.checkOut'),
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      width: 100,
      render: (date: string) => dayjs(date).format(isMobile ? 'MM/DD' : 'YYYY-MM-DD'),
    },
    ...(!isMobile ? [{
      title: t('table.guests'),
      dataIndex: 'numberOfGuests',
      key: 'numberOfGuests',
      width: 80,
      align: 'center' as const,
    }] : []),
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: isMobile ? 100 : 130,
      render: (status: Reservation['status']) => (
        <Tag color={getStatusColor(status)}>
          {isMobile ? status.substring(0, 4) : t(`status.${status}`)}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: t('table.source'),
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: Reservation['source']) => t(`source.${source}`),
    }] : []),
    ...(!isMobile ? [{
      title: t('table.totalPrice'),
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => price.toLocaleString(),
    }] : []),
    {
      title: t('table.actions'),
      key: 'actions',
      width: isMobile ? 80 : 200,
      fixed: isMobile ? undefined : 'right',
      render: (_, record) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            {!isMobile && t('actions.view')}
          </Button>

          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditReservation(record)}
            >
              {!isMobile && t('actions.edit')}
            </Button>
          )}

          {(record.status === 'confirmed' || record.status === 'pending') && (
            <Button
              type="link"
              size="small"
              icon={<LoginOutlined />}
              onClick={() => handleCheckIn(record.id)}
            >
              {!isMobile && t('actions.checkIn')}
            </Button>
          )}

          {record.status === 'checked-in' && (
            <Button
              type="link"
              size="small"
              icon={<LogoutOutlined />}
              onClick={() => handleCheckOut(record.id)}
            >
              {!isMobile && t('actions.checkOut')}
            </Button>
          )}

          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Popconfirm
              title={t('actions.cancel')}
              description={!isMobile ? "Are you sure you want to cancel this reservation?" : "Cancel?"}
              onConfirm={() => handleCancelReservation(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
              >
                {!isMobile && t('actions.cancel')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [t, isMobile, handleCheckIn, handleCheckOut, handleCancelReservation]);

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      <Card
        title={t('title')}
        extra={
          <Space size={isMobile ? 'small' : 'middle'}>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && 'Refresh'}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? t('create') : t('createButton')}
            </Button>
          </Space>
        }
      >
        {/* View Tabs */}
        <Tabs
          activeKey={activeView}
          onChange={(key) => setActiveView(key as 'table' | 'calendar')}
          size={isMobile ? 'small' : 'middle'}
          items={[
            {
              key: 'table',
              label: (
                <span>
                  <TableOutlined />
                  {!isMobile && t('views.table')}
                </span>
              ),
            },
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined />
                  {!isMobile && t('views.calendar')}
                </span>
              ),
            },
          ]}
        />

        {/* Filters - Only show for table view */}
        {activeView === 'table' && (
          <Card
            size="small"
            style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
          >
            <Row gutter={[8, 8]}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                  <strong>{t('filters.dateRange')}</strong>
                </div>
                <RangePicker
                  style={{ width: '100%' }}
                  size={isMobile ? 'small' : 'middle'}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
                  format="YYYY-MM-DD"
                />
              </Col>

              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                  <strong>{t('filters.status')}</strong>
                </div>
                <Select
                  style={{ width: '100%' }}
                  size={isMobile ? 'small' : 'middle'}
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
                <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                  <strong>{t('filters.source')}</strong>
                </div>
                <Select
                  style={{ width: '100%' }}
                  size={isMobile ? 'small' : 'middle'}
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

            <Row style={{ marginTop: isMobile ? 8 : 16 }}>
              <Col span={24}>
                <Space size={isMobile ? 'small' : 'middle'}>
                  <Button 
                    type="primary" 
                    onClick={handleApplyFilters}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {t('filters.apply')}
                  </Button>
                  <Button 
                    onClick={handleClearFilters}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {t('filters.clearFilters')}
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Table View */}
        {activeView === 'table' && (
          <Table
            columns={columns}
            dataSource={reservations}
            rowKey="id"
            loading={loading}
            scroll={{ x: isMobile ? 600 : 1200 }}
            pagination={{
              pageSize: isMobile ? 10 : 20,
              showSizeChanger: !isMobile,
              showTotal: (total) => isMobile ? `${total}` : `Total ${total} reservations`,
              simple: isMobile,
            }}
            size={isMobile ? 'small' : 'middle'}
            locale={{
              emptyText: t('messages.noData'),
            }}
          />
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <div style={{ overflowX: 'auto' }}>
            <TapeChart
              reservations={reservations}
              loading={loading}
              onReservationClick={handleViewDetails}
            />
          </div>
        )}
      </Card>

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
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0 } : undefined}
      >
        <CreateReservationForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setCreateModalOpen(false)}
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
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0 } : undefined}
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
