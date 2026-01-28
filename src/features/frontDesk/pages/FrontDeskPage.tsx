import { useState, useMemo, useEffect } from 'react';
import { Card, Tabs, Table, Button, Space, Tag, Empty, Input } from 'antd';
import { ReloadOutlined, LoginOutlined, LogoutOutlined, EyeOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useFrontDesk, type ReservationWithDetails } from '../hooks/useFrontDesk';
import { ReservationDetailsModal } from '../../reservations/components/ReservationDetailsModal';
import type { Reservation } from '../../../types';

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
 */
export function FrontDeskPage() {
  const { t } = useTranslation('frontDesk');
  const { t: tReservations } = useTranslation('reservations');
  const { arrivals, inHouse, departures, searchResults, loading, searching, refresh, checkIn, checkOut, search, clearSearch } = useFrontDesk();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('arrivals');

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    await checkIn(id);
  };

  /**
   * Check out a guest
   */
  const handleCheckOut = async (id: string) => {
    await checkOut(id);
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
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
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
        width: isMobile ? 120 : 200,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              {!isMobile && t('actions.viewDetails')}
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<LoginOutlined />}
              onClick={() => handleCheckIn(record.id)}
            >
              {t('actions.checkIn')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, tReservations, isMobile, handleCheckIn]
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
        width: isMobile ? 100 : 150,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              {!isMobile && t('actions.viewDetails')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, isMobile]
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
        width: isMobile ? 120 : 200,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              {!isMobile && t('actions.viewDetails')}
            </Button>
            <Button
              type="primary"
              size="small"
              danger
              icon={<LogoutOutlined />}
              onClick={() => handleCheckOut(record.id)}
            >
              {t('actions.checkOut')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, isMobile, handleCheckOut]
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
        width: isMobile ? 100 : 150,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              {!isMobile && t('actions.viewDetails')}
            </Button>
          </Space>
        ),
      },
    ],
    [t, tReservations, isMobile]
  );

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      <Card
        title={t('title')}
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            {!isMobile && 'Refresh'}
          </Button>
        }
      >
        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: '100%', maxWidth: 600 }}>
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={searching}
            >
              {!isMobile && t('search.button')}
            </Button>
            {searchResults.length > 0 && (
              <Button
                icon={<CloseOutlined />}
                onClick={handleClearSearch}
              >
                {!isMobile && t('search.clear')}
              </Button>
            )}
          </Space.Compact>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'arrivals',
              label: t('tabs.arrivals'),
              children: (
                <div>
                  <Table
                    columns={arrivalsColumns}
                    dataSource={arrivals}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: isMobile ? 800 : 1000 }}
                    pagination={{
                      pageSize: isMobile ? 10 : 20,
                      showSizeChanger: !isMobile,
                      showTotal: (total) => !isMobile ? `Total ${total} arrivals` : `${total}`,
                      simple: isMobile,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('arrivals.noArrivals')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'inHouse',
              label: t('tabs.inHouse'),
              children: (
                <div>
                  <Table
                    columns={inHouseColumns}
                    dataSource={inHouse}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: isMobile ? 800 : 1000 }}
                    pagination={{
                      pageSize: isMobile ? 10 : 20,
                      showSizeChanger: !isMobile,
                      showTotal: (total) => !isMobile ? `Total ${total} guests` : `${total}`,
                      simple: isMobile,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('inHouse.noGuests')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'departures',
              label: t('tabs.departures'),
              children: (
                <div>
                  <Table
                    columns={departuresColumns}
                    dataSource={departures}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: isMobile ? 800 : 1000 }}
                    pagination={{
                      pageSize: isMobile ? 10 : 20,
                      showSizeChanger: !isMobile,
                      showTotal: (total) => !isMobile ? `Total ${total} departures` : `${total}`,
                      simple: isMobile,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('departures.noDepartures')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
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
                  <Table
                    columns={searchColumns}
                    dataSource={searchResults}
                    rowKey="id"
                    loading={searching}
                    scroll={{ x: isMobile ? 900 : 1200 }}
                    pagination={{
                      pageSize: isMobile ? 10 : 20,
                      showSizeChanger: !isMobile,
                      showTotal: (total) => !isMobile ? `Total ${total} results` : `${total}`,
                      simple: isMobile,
                    }}
                    locale={{
                      emptyText: (
                        <Empty
                          description={t('search.noResults')}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      ),
                    }}
                  />
                </div>
              ),
            }] : []),
          ]}
        />
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
    </div>
  );
}
