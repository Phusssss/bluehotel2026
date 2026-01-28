import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Space, Empty, Spin, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useHotel } from '../../../contexts/HotelContext';
import { roomService } from '../../../services/roomService';
import type { Reservation, Room } from '../../../types';

dayjs.extend(isBetween);

interface TapeChartProps {
  reservations: Reservation[];
  loading: boolean;
  onReservationClick?: (reservation: Reservation) => void;
}

interface RoomReservation {
  room: Room;
  reservations: Reservation[];
}

const DAYS_TO_SHOW = 14; // Show 2 weeks
const CELL_WIDTH = 60; // Width of each day cell in pixels
const ROW_HEIGHT = 50; // Height of each room row in pixels

const getStatusColor = (status: Reservation['status']) => {
  const colors: Record<Reservation['status'], string> = {
    pending: '#faad14',
    confirmed: '#1890ff',
    'checked-in': '#52c41a',
    'checked-out': '#d9d9d9',
    cancelled: '#ff4d4f',
    'no-show': '#ff4d4f',
  };
  return colors[status];
};

export function TapeChart({ reservations, loading, onReservationClick }: TapeChartProps) {
  const { t } = useTranslation('reservations');
  const { currentHotel } = useHotel();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf('day'));
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

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentHotel) return;
      
      try {
        setRoomsLoading(true);
        const roomsData = await roomService.getRooms(currentHotel.id);
        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [currentHotel]);

  // Generate date range
  const dateRange = useMemo(() => {
    const dates: Dayjs[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      dates.push(startDate.add(i, 'day'));
    }
    return dates;
  }, [startDate]);

  // Group reservations by room
  const roomReservations = useMemo<RoomReservation[]>(() => {
    return rooms.map((room) => ({
      room,
      reservations: reservations.filter((res) => res.roomId === room.id),
    }));
  }, [rooms, reservations]);

  // Navigate to previous week
  const handlePreviousWeek = () => {
    setStartDate((prev) => prev.subtract(7, 'day'));
  };

  // Navigate to next week
  const handleNextWeek = () => {
    setStartDate((prev) => prev.add(7, 'day'));
  };

  // Navigate to today
  const handleToday = () => {
    setStartDate(dayjs().startOf('day'));
  };

  // Calculate reservation position and width
  const getReservationStyle = (reservation: Reservation) => {
    const checkIn = dayjs(reservation.checkInDate);
    const checkOut = dayjs(reservation.checkOutDate);
    const endDate = startDate.add(DAYS_TO_SHOW, 'day');

    // Check if reservation overlaps with visible date range
    if (checkOut.isBefore(startDate) || checkIn.isAfter(endDate)) {
      return null;
    }

    // Calculate start position
    const visibleCheckIn = checkIn.isBefore(startDate) ? startDate : checkIn;
    const daysFromStart = visibleCheckIn.diff(startDate, 'day');
    const left = daysFromStart * CELL_WIDTH;

    // Calculate width
    const visibleCheckOut = checkOut.isAfter(endDate) ? endDate : checkOut;
    const nights = visibleCheckOut.diff(visibleCheckIn, 'day');
    const width = nights * CELL_WIDTH;

    return {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: getStatusColor(reservation.status),
    };
  };

  if (roomsLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <Empty
        description={t('tapeChart.noRooms')}
        style={{ padding: '50px' }}
      />
    );
  }

  return (
    <div>
      {/* Navigation Controls */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '8px' : '0',
          alignItems: isMobile ? 'stretch' : 'center',
        }}>
          <Space size={isMobile ? 'small' : 'middle'} style={{ flexWrap: 'wrap' }}>
            <Button
              icon={<LeftOutlined />}
              onClick={handlePreviousWeek}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? t('tapeChart.prev') : t('tapeChart.previousWeek')}
            </Button>
            <Button
              icon={<CalendarOutlined />}
              onClick={handleToday}
              size={isMobile ? 'small' : 'middle'}
            >
              {t('tapeChart.today')}
            </Button>
            <Button
              icon={<RightOutlined />}
              onClick={handleNextWeek}
              size={isMobile ? 'small' : 'middle'}
            >
              {isMobile ? t('tapeChart.next') : t('tapeChart.nextWeek')}
            </Button>
          </Space>
          <span style={{ 
            marginLeft: isMobile ? 0 : 16, 
            marginTop: isMobile ? 8 : 0,
            fontWeight: 'bold',
            fontSize: isMobile ? '12px' : '14px',
          }}>
            {isMobile 
              ? `${startDate.format('MM/DD')} - ${startDate.add(DAYS_TO_SHOW - 1, 'day').format('MM/DD')}`
              : `${startDate.format('MMM DD, YYYY')} - ${startDate.add(DAYS_TO_SHOW - 1, 'day').format('MMM DD, YYYY')}`
            }
          </span>
        </div>
      </Card>

      {/* Tape Chart */}
      <Card bodyStyle={{ padding: 0, overflow: 'auto' }}>
        <div style={{ minWidth: `${CELL_WIDTH * DAYS_TO_SHOW + 150}px` }}>
          {/* Header Row - Dates */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid #d9d9d9',
              backgroundColor: '#fafafa',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {/* Room column header */}
            <div
              style={{
                width: '150px',
                padding: '12px',
                fontWeight: 'bold',
                borderRight: '1px solid #d9d9d9',
                backgroundColor: '#fafafa',
              }}
            >
              {t('tapeChart.room')}
            </div>

            {/* Date headers */}
            {dateRange.map((date) => {
              const isToday = date.isSame(dayjs(), 'day');
              return (
                <div
                  key={date.format('YYYY-MM-DD')}
                  style={{
                    width: `${CELL_WIDTH}px`,
                    padding: '8px 4px',
                    textAlign: 'center',
                    borderRight: '1px solid #e8e8e8',
                    backgroundColor: isToday ? '#e6f7ff' : '#fafafa',
                    fontWeight: isToday ? 'bold' : 'normal',
                  }}
                >
                  <div style={{ fontSize: '12px' }}>{date.format('ddd')}</div>
                  <div style={{ fontSize: '14px' }}>{date.format('DD')}</div>
                  <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                    {date.format('MMM')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Room Rows */}
          {roomReservations.map(({ room, reservations: roomRes }) => (
            <div
              key={room.id}
              style={{
                display: 'flex',
                borderBottom: '1px solid #e8e8e8',
                minHeight: `${ROW_HEIGHT}px`,
              }}
            >
              {/* Room number */}
              <div
                style={{
                  width: '150px',
                  padding: '12px',
                  fontWeight: 'bold',
                  borderRight: '1px solid #d9d9d9',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {room.roomNumber}
              </div>

              {/* Calendar grid */}
              <div style={{ position: 'relative', flex: 1 }}>
                {/* Grid cells */}
                <div style={{ display: 'flex' }}>
                  {dateRange.map((date) => {
                    const isToday = date.isSame(dayjs(), 'day');
                    return (
                      <div
                        key={date.format('YYYY-MM-DD')}
                        style={{
                          width: `${CELL_WIDTH}px`,
                          height: `${ROW_HEIGHT}px`,
                          borderRight: '1px solid #f0f0f0',
                          backgroundColor: isToday ? '#f0f9ff' : 'transparent',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Reservation bars */}
                {roomRes.map((reservation) => {
                  const style = getReservationStyle(reservation);
                  if (!style) return null;

                  const nights = dayjs(reservation.checkOutDate).diff(
                    dayjs(reservation.checkInDate),
                    'day'
                  );

                  return (
                    <Tooltip
                      key={reservation.id}
                      title={
                        <div>
                          <div><strong>{reservation.confirmationNumber}</strong></div>
                          <div>{t(`status.${reservation.status}`)}</div>
                          <div>{dayjs(reservation.checkInDate).format('MMM DD')} - {dayjs(reservation.checkOutDate).format('MMM DD')}</div>
                          <div>{nights} {t('tapeChart.nights')}</div>
                        </div>
                      }
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          height: `${ROW_HEIGHT - 16}px`,
                          ...style,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          padding: '0 4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                        onClick={() => onReservationClick?.(reservation)}
                      >
                        {reservation.confirmationNumber}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Empty state if no reservations */}
          {reservations.length === 0 && (
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <Empty description={t('tapeChart.noReservations')} />
            </div>
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card size="small" style={{ marginTop: 16 }}>
        <Space wrap>
          <span style={{ fontWeight: 'bold' }}>Legend:</span>
          {(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'] as const).map((status) => (
            <Space key={status} size="small">
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: getStatusColor(status),
                  borderRadius: '4px',
                }}
              />
              <span>{t(`status.${status}`)}</span>
            </Space>
          ))}
        </Space>
      </Card>
    </div>
  );
}
