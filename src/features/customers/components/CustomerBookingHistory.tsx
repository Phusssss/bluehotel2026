import { useState, useEffect } from 'react';
import { Table, Tag, Spin, Empty, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { Reservation } from '../../../types';
import { customerService } from '../../../services/customerService';
import { useHotel } from '../../../contexts/HotelContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface CustomerBookingHistoryProps {
  customerId: string;
}

/**
 * Component to display customer booking history
 */
export function CustomerBookingHistory({ customerId }: CustomerBookingHistoryProps) {
  const { t } = useTranslation(['customers', 'reservations']);
  const { currentHotel } = useHotel();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBookingHistory = async () => {
      if (!currentHotel) return;
      
      setLoading(true);
      try {
        const history = await customerService.getCustomerBookingHistory(
          currentHotel.id,
          customerId
        );
        setReservations(history);
      } catch (error) {
        console.error('Error fetching booking history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (customerId && currentHotel) {
      fetchBookingHistory();
    }
  }, [customerId, currentHotel]);

  /**
   * Get status color for reservation status tag
   */
  const getStatusColor = (status: Reservation['status']): string => {
    const statusColors: Record<Reservation['status'], string> = {
      'pending': 'orange',
      'confirmed': 'blue',
      'checked-in': 'green',
      'checked-out': 'default',
      'cancelled': 'red',
      'no-show': 'volcano',
    };
    return statusColors[status] || 'default';
  };

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<Reservation> = [
    {
      title: t('reservations:table.confirmationNumber'),
      dataIndex: 'confirmationNumber',
      key: 'confirmationNumber',
      render: (confirmationNumber: string) => (
        <Text strong>{confirmationNumber}</Text>
      ),
    },
    {
      title: t('reservations:table.checkInDate'),
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.checkInDate).unix() - dayjs(b.checkInDate).unix(),
    },
    {
      title: t('reservations:table.checkOutDate'),
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: t('reservations:table.nights'),
      key: 'nights',
      render: (_, record) => {
        const nights = dayjs(record.checkOutDate).diff(dayjs(record.checkInDate), 'day');
        return `${nights} ${nights === 1 ? t('reservations:night') : t('reservations:nights')}`;
      },
    },
    {
      title: t('reservations:table.guests'),
      dataIndex: 'numberOfGuests',
      key: 'numberOfGuests',
    },
    {
      title: t('reservations:table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: Reservation['status']) => (
        <Tag color={getStatusColor(status)}>
          {t(`reservations:status.${status}`)}
        </Tag>
      ),
      filters: [
        { text: t('reservations:status.pending'), value: 'pending' },
        { text: t('reservations:status.confirmed'), value: 'confirmed' },
        { text: t('reservations:status.checked-in'), value: 'checked-in' },
        { text: t('reservations:status.checked-out'), value: 'checked-out' },
        { text: t('reservations:status.cancelled'), value: 'cancelled' },
        { text: t('reservations:status.no-show'), value: 'no-show' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('reservations:table.totalPrice'),
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `$${price.toLocaleString()}`,
      sorter: (a, b) => a.totalPrice - b.totalPrice,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Empty
        description={t('customers:noBookingHistory')}
        style={{ padding: '40px' }}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={reservations}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: false,
        showTotal: (total) => `${total} ${t('reservations:totalReservations')}`,
      }}
    />
  );
}
