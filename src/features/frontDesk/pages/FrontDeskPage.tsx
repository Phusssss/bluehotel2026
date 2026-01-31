import { useState, useMemo } from 'react';
import { Tabs, Table, Button, Space, Tag, Empty, Input, Typography } from 'antd';
import { ReloadOutlined, LoginOutlined, LogoutOutlined, EyeOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useFrontDesk, type ReservationWithDetails } from '../hooks/useFrontDesk';
import { ReservationDetailsModal } from '../../reservations/components/ReservationDetailsModal';
import type { Reservation } from '../../../types';

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
 * Front Desk Page Component
 * Displays three tabs: Arrivals, In-House, and Departures
 * Allows front desk staff to check in/out guests and view reservation details
 * Supports responsive design for mobile, tablet, and desktop
 */
export function FrontDeskPage() {
  const { t } = useTranslation('frontDesk');
  const { t: tReservations } = useTranslation('reservations');
  const { arrivals, inHouse, departures, searchResults, loading, searching, refresh, checkIn, checkOut, checkInGroup, checkOutGroup, search, clearSearch } = useFrontDesk();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('arrivals');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * Open reservation details modal
   */
  const handleViewDetails = (reservation: ReservationWithDetails) => {
    setSelectedReservation(reservation);
    setDetailsModalOpen(true);
  };

  /**
   * Check in a guest
   */
  const handleCheckIn = async (id: string) => {
    setActionLoading(`checkin-${id}`);
    try {
      await checkIn(id);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Check out a guest
   */
  const handleCheckOut = async (id: string) => {
    setActionLoading(`checkout-${id}`);
    try {
      await checkOut(id);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handle search submission
   */
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await search(searchQuery);
      setActiveTab('search');
    }
  };

  /**
   * Handle search clear
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
    setActiveTab('arrivals');
  };

  /**
   * Handle search input key press
   */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Check in a group booking
   */
  const handleCheckInGroup = async (groupId: string) => {
    setActionLoading(`checkin-group-${groupId}`);
    try {
      await checkInGroup(groupId);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Check out a group booking
   */
  const handleCheckOutGroup = async (groupId: string) => {
    setActionLoading(`checkout-group-${groupId}`);
    try {
      await checkOutGroup(groupId);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Table columns for Arrivals tab
   * Shows pending/confirmed reservations with check-in today
   */
  const arrivalsColumns: ColumnsType<ReservationWithDetails> = useMemo(
    () => [
      {
        title: t('table.confirmationNumber'),
        dataIndex: 'confirmationNumber',
        key: 'confirmationNumber',
        width: 150,
        render: (text: string, record: ReservationWithDetails) => (
          <Space direction="vertical" size={0}>
            <strong>{text}</strong>
            {record.isGroupBooking && record.groupId && (
              <Tag color="purple" style={{ fontSize: '11px' }}>
                {t('group.indicator')} ({record.groupSize} {t('group.rooms', { count: record.groupSize })})
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: t('table.guestName'),
        dataIndex: 'customerName',
        key: 'customerName',
        width: 200,
      },
      {
        title: t('table.roomNumber'),
        dataIndex: 'roomNumber',
        key: 'roomNumber',
        width: 100,
        render: (text: string) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: t('table.roomType'),
        dataIndex: 'roomTypeName',
        key: 'roomTypeName',
        width: 150,
      },
      {
        title: t('table.numberOfGuests'),
        dataIndex: 'numberOfGuests',
        key: 'numberOfGuests',
        width: 100,
        align: 'center',
      },
      {
        title: t('table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: Reservation['status']) => (
          <Tag color={getStatusColor(status)}>{tReservations(`status.${status}`)}</Tag>
        ),
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
              {t('actions.viewDetails')}
            </Button>
            {record.isGroupBooking && record.groupId && record.groupIndex === 1 ? (
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                loading={actionLoading === `checkin-group-${record.groupId}`}
                onClick={() => handleCheckInGroup(record.groupId!)}
              >
                {t('actions.checkInGroup')}
              </Button>
            ) : !record.isGroupBooking ? (
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                loading={actionLoading === `checkin-${record.id}`}
                onClick={() => handleCheckIn(record.id)}
              >
                {t('actions.checkIn')}
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [t, tReservations, handleCheckIn, handleCheckInGroup]
  );

  /**
   * Table columns for In-House tab
   * Shows all currently checked-in guests
   */
  const inHouseColumns: ColumnsType<ReservationWithDetails> = useMemo(
    () => [
      {
        title: t('table.confirmationNumber'),
        dataIndex: 'confirmationNumber',
        key: 'confirmationNumber',
        width: 150,
        render: (text: string) => <strong>{text}</strong>,
      },
      {
        title: t('table.guestName'),
        dataIndex: 'customerName',
        key: 'customerName',
        width: 200,
      },
      {
        title: t('table.roomNumber'),
        dataIndex: 'roomNumber',
        key: 'roomNumber',
        width: 100,
        render: (text: string) => <Tag color="green">{text}</Tag>,
      },
      {
        title: t('table.roomType'),
        dataIndex: 'roomTypeName',
        key: 'roomTypeName',
        width: 150,
      },
      {
        title: t('table.checkInDate'),
        dataIndex: 'checkInDate',
        key: 'checkInDate',
        width: 120,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: t('table.checkOutDate'),
        dataIndex: 'checkOutDate',
        key: 'checkOutDate',
        width: 120,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: t('table.numberOfGuests'),
        dataIndex: 'numberOfGuests',
        key: 'numberOfGuests',
        width: 100,
        align: 'center',
      },
      {
        title: t('table.actions'),
        key: 'actions',
        width: 150,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              style={{ padding: 0 }}
            >
              {t('actions.viewDetails')}
            </Button>
          </Space>
        ),
      },
    ],
    [t]
  );

  /**
   * Table columns for Departures tab
   * Shows checked-in guests with checkout today
   */
  const departuresColumns: ColumnsType<ReservationWithDetails> = useMemo(
    () => [
      {
        title: t('table.confirmationNumber'),
        dataIndex: 'confirmationNumber',
        key: 'confirmationNumber',
        width: 150,
        render: (text: string, record: ReservationWithDetails) => (
          <Space direction="vertical" size={0}>
            <strong>{text}</strong>
            {record.isGroupBooking && record.groupId && (
              <Tag color="purple" style={{ fontSize: '11px' }}>
                {t('group.indicator')} ({record.groupSize} {t('group.rooms', { count: record.groupSize })})
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: t('table.guestName'),
        dataIndex: 'customerName',
        key: 'customerName',
        width: 200,
      },
      {
        title: t('table.roomNumber'),
        dataIndex: 'roomNumber',
        key: 'roomNumber',
        width: 100,
        render: (text: string) => <Tag color="orange">{text}</Tag>,
      },
      {
        title: t('table.roomType'),
        dataIndex: 'roomTypeName',
        key: 'roomTypeName',
        width: 150,
      },
      {
        title: t('table.numberOfGuests'),
        dataIndex: 'numberOfGuests',
        key: 'numberOfGuests',
        width: 100,
        align: 'center',
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
              {t('actions.viewDetails')}
            </Button>
            {record.isGroupBooking && record.groupId && record.groupIndex === 1 ? (
              <Button
                type="primary"
                size="small"
                danger
                icon={<LogoutOutlined />}
                loading={actionLoading === `checkout-group-${record.groupId}`}
                onClick={() => handleCheckOutGroup(record.groupId!)}
              >
                {t('actions.checkOutGroup')}
              </Button>
            ) : !record.isGroupBooking ? (
              <Button
                type="primary"
                size="small"
                danger
                icon={<LogoutOutlined />}
                loading={actionLoading === `checkout-${record.id}`}
                onClick={() => handleCheckOut(record.id)}
              >
                {t('actions.checkOut')}
              </Button>
            ) : null}
          </Space>
        ),
      },
    ],
    [t, handleCheckOut, handleCheckOutGroup]
  );

  /**
   * Table columns for Search Results tab
   * Shows all matching reservations with full details
   */
  const searchColumns: ColumnsType<ReservationWithDetails> = useMemo(
    () => [
      {
        title: t('table.confirmationNumber'),
        dataIndex: 'confirmationNumber',
        key: 'confirmationNumber',
        width: 150,
        render: (text: string) => <strong>{text}</strong>,
      },
      {
        title: t('table.guestName'),
        dataIndex: 'customerName',
        key: 'customerName',
        width: 200,
      },
      {
        title: t('table.roomNumber'),
        dataIndex: 'roomNumber',
        key: 'roomNumber',
        width: 100,
        render: (text: string) => <Tag color="blue">{text}</Tag>,
      },
      {
        title: t('table.roomType'),
        dataIndex: 'roomTypeName',
        key: 'roomTypeName',
        width: 150,
      },
      {
        title: t('table.checkInDate'),
        dataIndex: 'checkInDate',
        key: 'checkInDate',
        width: 120,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: t('table.checkOutDate'),
        dataIndex: 'checkOutDate',
        key: 'checkOutDate',
        width: 120,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      },
      {
        title: t('table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: Reservation['status']) => (
          <Tag color={getStatusColor(status)}>{tReservations(`status.${status}`)}</Tag>
        ),
      },
      {
        title: t('table.actions'),
        key: 'actions',
        width: 150,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              style={{ padding: 0 }}
            >
              {t('actions.viewDetails')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, tReservations]
  );

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
        <Button
          icon={<ReloadOutlined />}
          onClick={refresh}
          loading={loading}
          size="middle"
        />
      </div>

      {/* Search Bar */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Space.Compact style={{ width: '100%', maxWidth: 600 }}>
          <Input
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={searching}
          >
            {t('search.button')}
          </Button>
          {searchResults.length > 0 && (
            <Button
              icon={<CloseOutlined />}
              onClick={handleClearSearch}
            >
              {t('search.clear')}
            </Button>
          )}
        </Space.Compact>
      </div>

      {/* Tabs and Tables */}
      <div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'arrivals',
              label: t('tabs.arrivals'),
              children: (
                <div style={{ 
                  background: '#fff', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                }}>
                  <Table
                    columns={arrivalsColumns}
                    dataSource={arrivals}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: false,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} / ${total}`,
                      responsive: true,
                      size: 'default',
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('arrivals.noArrivals')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                    size="middle"
                  />
                </div>
              ),
            },
            {
              key: 'inHouse',
              label: t('tabs.inHouse'),
              children: (
                <div style={{ 
                  background: '#fff', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                }}>
                  <Table
                    columns={inHouseColumns}
                    dataSource={inHouse}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: false,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} / ${total}`,
                      responsive: true,
                      size: 'default',
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('inHouse.noGuests')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                    size="middle"
                  />
                </div>
              ),
            },
            {
              key: 'departures',
              label: t('tabs.departures'),
              children: (
                <div style={{ 
                  background: '#fff', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                }}>
                  <Table
                    columns={departuresColumns}
                    dataSource={departures}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: false,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} / ${total}`,
                      responsive: true,
                      size: 'default',
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('departures.noDepartures')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                    size="middle"
                  />
                </div>
              ),
            },
            ...(searchResults.length > 0 ? [{
              key: 'search',
              label: `${t('tabs.search')} (${searchResults.length})`,
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Tag color="blue">{t('search.resultsCount', { count: searchResults.length })}</Tag>
                  </div>
                  <div style={{ 
                    background: '#fff', 
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                  }}>
                    <Table
                      columns={searchColumns}
                      dataSource={searchResults}
                      rowKey="id"
                      loading={searching}
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
                      locale={{
                        emptyText: (
                          <Empty
                            description={t('search.noResults')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        ),
                      }}
                      size="middle"
                    />
                  </div>
                </div>
              ),
            }] : []),
          ]}
        />
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
    </div>
  );
}
