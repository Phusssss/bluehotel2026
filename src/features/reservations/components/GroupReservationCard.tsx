import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Typography,
  Popconfirm,
  message,
} from 'antd';
import {
  DownOutlined,
  UpOutlined,
  LoginOutlined,
  LogoutOutlined,
  CloseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useHotel } from '../../../contexts/HotelContext';
import { reservationService } from '../../../services/reservationService';
import type { Reservation } from '../../../types';

const { Text, Title } = Typography;

interface GroupReservationCardProps {
  reservations: Reservation[];
  onUpdate: () => void;
  onViewDetails?: (reservation: Reservation) => void;
}

/**
 * Get color for reservation status tag
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
 * GroupReservationCard component - displays a group booking with all its reservations
 * Shows summary information and allows expanding to see individual room details
 * Provides group actions like check-in all, check-out all, and cancel all
 */
export function GroupReservationCard({
  reservations,
  onUpdate,
  onViewDetails,
}: GroupReservationCardProps) {
  const { t } = useTranslation('reservations');
  const { currentHotel } = useHotel();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!reservations || reservations.length === 0) {
    return null;
  }

  // Get group information from first reservation
  const firstReservation = reservations[0];
  const groupId = firstReservation.groupId!;
  const groupSize = firstReservation.groupSize || reservations.length;
  const status = firstReservation.status;

  // Calculate total price
  const totalPrice = reservations.reduce(
    (sum, res) => sum + (res.totalPrice || 0),
    0
  );

  // Check if all reservations have the same status
  const allSameStatus = reservations.every((res) => res.status === status);

  /**
   * Handle group check-in
   */
  const handleCheckInGroup = async () => {
    if (!currentHotel) return;

    setLoading(true);
    try {
      await reservationService.checkInGroup(currentHotel.id, groupId);
      message.success(t('groupBooking.checkInSuccess'));
      onUpdate();
    } catch (error: any) {
      console.error('Error checking in group:', error);
      message.error(error.message || t('groupBooking.checkInError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle group check-out
   */
  const handleCheckOutGroup = async () => {
    if (!currentHotel) return;

    setLoading(true);
    try {
      await reservationService.checkOutGroup(currentHotel.id, groupId);
      message.success(t('groupBooking.checkOutSuccess'));
      onUpdate();
    } catch (error: any) {
      console.error('Error checking out group:', error);
      message.error(error.message || t('groupBooking.checkOutError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle group cancellation
   */
  const handleCancelGroup = async () => {
    if (!currentHotel) return;

    setLoading(true);
    try {
      await reservationService.cancelGroupBooking(currentHotel.id, groupId);
      message.success(t('groupBooking.cancelSuccess'));
      onUpdate();
    } catch (error: any) {
      console.error('Error cancelling group:', error);
      message.error(error.message || t('groupBooking.cancelError'));
    } finally {
      setLoading(false);
    }
  };

  // Determine which group actions are available
  const canCheckIn =
    allSameStatus && (status === 'pending' || status === 'confirmed');
  const canCheckOut = allSameStatus && status === 'checked-in';
  const canCancel =
    allSameStatus && (status === 'pending' || status === 'confirmed');

  return (
    <Card
      style={{
        marginBottom: 16,
        border: '2px solid #1890ff',
        borderRadius: 8,
      }}
      bodyStyle={{ padding: 16 }}
    >
      {/* Group Header */}
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <Space direction="vertical" size={4}>
            <Space>
              <Tag color="blue" icon={<TeamOutlined />}>
                {t('groupBooking.groupLabel')}
              </Tag>
              <Tag color={getStatusColor(status)}>
                {t(`status.${status}`)}
              </Tag>
            </Space>
            <Text strong style={{ fontSize: 16 }}>
              {firstReservation.confirmationNumber}
            </Text>
            <Text type="secondary">
              {t('groupBooking.totalRooms')}: {groupSize}
            </Text>
          </Space>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t('form.checkInDate')}:</Text>
            <Text>{dayjs(firstReservation.checkInDate).format('YYYY-MM-DD')}</Text>
            <Text type="secondary">{t('form.checkOutDate')}:</Text>
            <Text>{dayjs(firstReservation.checkOutDate).format('YYYY-MM-DD')}</Text>
          </Space>
        </Col>

        <Col xs={24} sm={24} md={8} style={{ textAlign: 'right' }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">{t('groupBooking.totalPrice')}:</Text>
            <Title level={4} style={{ margin: 0 }}>
              {totalPrice.toLocaleString()} {currentHotel?.currency}
            </Title>
            <Button
              type="link"
              icon={expanded ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setExpanded(!expanded)}
              style={{ padding: 0 }}
            >
              {expanded
                ? t('groupBooking.hideDetails')
                : t('groupBooking.showDetails')}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Expanded Details */}
      {expanded && (
        <>
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Title level={5}>{t('groupBooking.roomDetails')}</Title>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {reservations.map((reservation, index) => (
                <Card
                  key={reservation.id}
                  size="small"
                  style={{ backgroundColor: '#fafafa' }}
                  hoverable
                  onClick={() => onViewDetails?.(reservation)}
                >
                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={8}>
                      <Space direction="vertical" size={0}>
                        <Text strong>
                          {t('groupBooking.room')} {index + 1}
                        </Text>
                        <Text type="secondary">
                          {t('modal.confirmationNumber')}:{' '}
                          {reservation.confirmationNumber}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={12} sm={8}>
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{t('table.room')}:</Text>
                        <Text>
                          {/* Room number would come from joined data */}
                          {reservation.roomId}
                        </Text>
                      </Space>
                    </Col>
                    <Col xs={12} sm={8} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{t('form.total')}:</Text>
                        <Text strong>
                          {reservation.totalPrice.toLocaleString()}{' '}
                          {currentHotel?.currency}
                        </Text>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </div>

          {/* Group Actions */}
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Space wrap>
              {canCheckIn && (
                <Popconfirm
                  title={t('groupBooking.checkInAllConfirm')}
                  description={t('groupBooking.checkInAllDescription', {
                    count: groupSize,
                  })}
                  onConfirm={handleCheckInGroup}
                  okText={t('common.yes')}
                  cancelText={t('common.no')}
                >
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    loading={loading}
                  >
                    {t('groupBooking.checkInAll')}
                  </Button>
                </Popconfirm>
              )}

              {canCheckOut && (
                <Popconfirm
                  title={t('groupBooking.checkOutAllConfirm')}
                  description={t('groupBooking.checkOutAllDescription', {
                    count: groupSize,
                  })}
                  onConfirm={handleCheckOutGroup}
                  okText={t('common.yes')}
                  cancelText={t('common.no')}
                >
                  <Button
                    type="primary"
                    icon={<LogoutOutlined />}
                    loading={loading}
                  >
                    {t('groupBooking.checkOutAll')}
                  </Button>
                </Popconfirm>
              )}

              {canCancel && (
                <Popconfirm
                  title={t('groupBooking.cancelAllConfirm')}
                  description={t('groupBooking.cancelAllDescription', {
                    count: groupSize,
                  })}
                  onConfirm={handleCancelGroup}
                  okText={t('common.yes')}
                  cancelText={t('common.no')}
                >
                  <Button danger icon={<CloseOutlined />} loading={loading}>
                    {t('groupBooking.cancelAll')}
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        </>
      )}
    </Card>
  );
}
