import { Card, Row, Col, Typography, Tag, Tooltip, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Room } from '../../../types';

const { Title, Text } = Typography;

/**
 * Status color mapping for room status
 */
const STATUS_COLORS: Record<Room['status'], string> = {
  vacant: '#52c41a',
  occupied: '#1890ff',
  dirty: '#fa8c16',
  maintenance: '#f5222d',
  reserved: '#722ed1',
};

/**
 * Status background color mapping (lighter versions)
 */
const STATUS_BG_COLORS: Record<Room['status'], string> = {
  vacant: '#f6ffed',
  occupied: '#e6f7ff',
  dirty: '#fff7e6',
  maintenance: '#fff1f0',
  reserved: '#f9f0ff',
};

interface FloorMapViewProps {
  rooms: Room[];
  getRoomTypeName: (roomTypeId: string) => string;
}

/**
 * FloorMapView component - displays rooms organized by floor
 */
export function FloorMapView({ rooms, getRoomTypeName }: FloorMapViewProps) {
  const { t } = useTranslation('rooms');

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = [];
    }
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  // Sort floors in descending order (top floor first)
  const floors = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => b - a);

  if (floors.length === 0) {
    return (
      <Empty
        description={t('noData')}
        style={{ padding: '60px 0' }}
      />
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {floors.map((floor) => {
        const floorRooms = roomsByFloor[floor].sort((a, b) =>
          a.roomNumber.localeCompare(b.roomNumber)
        );

        return (
          <Card
            key={floor}
            style={{ marginBottom: '24px' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>
                  {t('floorMap.floor')} {floor}
                </Title>
                <Text type="secondary">
                  {floorRooms.length} {t('floorMap.roomCount')}
                </Text>
              </div>
            }
          >
            <Row gutter={[12, 12]}>
              {floorRooms.map((room) => (
                <Col
                  key={room.id}
                  xs={12}
                  sm={8}
                  md={6}
                  lg={4}
                  xl={3}
                >
                  <Tooltip
                    title={
                      <div>
                        <div><strong>{room.roomNumber}</strong></div>
                        <div>{getRoomTypeName(room.roomTypeId)}</div>
                        <div>{t(`status.${room.status}`)}</div>
                        {room.notes && <div style={{ marginTop: 4 }}>{room.notes}</div>}
                      </div>
                    }
                  >
                    <Card
                      size="small"
                      hoverable
                      style={{
                        backgroundColor: STATUS_BG_COLORS[room.status],
                        borderColor: STATUS_COLORS[room.status],
                        borderWidth: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                      bodyStyle={{ padding: '8px' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                        {room.roomNumber}
                      </div>
                      <Tag
                        color={STATUS_COLORS[room.status]}
                        style={{ margin: 0, fontSize: '11px' }}
                      >
                        {t(`status.${room.status}`)}
                      </Tag>
                    </Card>
                  </Tooltip>
                </Col>
              ))}
            </Row>
          </Card>
        );
      })}
    </div>
  );
}
