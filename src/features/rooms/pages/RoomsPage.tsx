import { useState } from 'react';
import {
  Card,
  Table,
  Select,
  Input,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Spin,
  Segmented,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  TableOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRooms } from '../hooks/useRooms';
import { FloorMapView } from '../components/FloorMapView';
import type { Room } from '../../../types';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

/**
 * Status color mapping for room status tags
 */
const STATUS_COLORS: Record<Room['status'], string> = {
  vacant: 'green',
  occupied: 'blue',
  dirty: 'orange',
  maintenance: 'red',
  reserved: 'purple',
};

type ViewMode = 'table' | 'floor';

/**
 * RoomsPage component - displays list of rooms with filtering
 */
export function RoomsPage() {
  const { t } = useTranslation('rooms');
  const {
    rooms,
    roomTypes,
    loading,
    filters,
    updateFilters,
    resetFilters,
    getRoomTypeName,
    getUniqueFloors,
  } = useRooms();

  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  /**
   * Handle status filter change
   */
  const handleStatusChange = (value: Room['status'] | undefined) => {
    updateFilters({ ...filters, status: value });
  };

  /**
   * Handle room type filter change
   */
  const handleRoomTypeChange = (value: string | undefined) => {
    updateFilters({ ...filters, roomTypeId: value });
  };

  /**
   * Handle floor filter change
   */
  const handleFloorChange = (value: number | undefined) => {
    updateFilters({ ...filters, floor: value });
  };

  /**
   * Handle reset filters
   */
  const handleResetFilters = () => {
    resetFilters();
    setSearchText('');
  };

  /**
   * Filter rooms by search text (room number)
   */
  const filteredRooms = rooms.filter((room) =>
    room.roomNumber.toLowerCase().includes(searchText.toLowerCase())
  );

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<Room> = [
    {
      title: t('table.roomNumber'),
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      sorter: (a, b) => a.roomNumber.localeCompare(b.roomNumber),
      width: 120,
      fixed: 'left',
    },
    {
      title: t('table.roomType'),
      dataIndex: 'roomTypeId',
      key: 'roomTypeId',
      render: (roomTypeId: string) => getRoomTypeName(roomTypeId),
      responsive: ['md'],
    },
    {
      title: t('table.floor'),
      dataIndex: 'floor',
      key: 'floor',
      sorter: (a, b) => a.floor - b.floor,
      width: 80,
      responsive: ['sm'],
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: Room['status']) => (
        <Tag color={STATUS_COLORS[status]}>
          {t(`status.${status}`)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: t('table.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      responsive: ['lg'],
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Title level={2} style={{ margin: 0 }}>{t('title')}</Title>
        
        <Segmented
          value={viewMode}
          onChange={(value) => setViewMode(value as ViewMode)}
          options={[
            {
              label: (
                <span style={{ padding: '0 8px' }}>
                  <TableOutlined /> {t('viewMode.table')}
                </span>
              ),
              value: 'table',
            },
            {
              label: (
                <span style={{ padding: '0 8px' }}>
                  <AppstoreOutlined /> {t('viewMode.floor')}
                </span>
              ),
              value: 'floor',
            },
          ]}
        />
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Input
              placeholder={t('filters.search')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder={t('filters.status')}
              style={{ width: '100%' }}
              value={filters.status}
              onChange={handleStatusChange}
              allowClear
            >
              <Option value={undefined}>{t('filters.statusAll')}</Option>
              <Option value="vacant">{t('status.vacant')}</Option>
              <Option value="occupied">{t('status.occupied')}</Option>
              <Option value="dirty">{t('status.dirty')}</Option>
              <Option value="maintenance">{t('status.maintenance')}</Option>
              <Option value="reserved">{t('status.reserved')}</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder={t('filters.roomType')}
              style={{ width: '100%' }}
              value={filters.roomTypeId}
              onChange={handleRoomTypeChange}
              allowClear
            >
              <Option value={undefined}>{t('filters.roomTypeAll')}</Option>
              {roomTypes.map((roomType) => (
                <Option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder={t('filters.floor')}
              style={{ width: '100%' }}
              value={filters.floor}
              onChange={handleFloorChange}
              allowClear
            >
              <Option value={undefined}>{t('filters.floorAll')}</Option>
              {getUniqueFloors().map((floor) => (
                <Option key={floor} value={floor}>
                  {floor}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Row style={{ marginTop: '16px' }}>
          <Col>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                {t('filters.reset')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading} tip={t('loading')}>
        {viewMode === 'table' ? (
          <Card>
            <Table
              columns={columns}
              dataSource={filteredRooms}
              rowKey="id"
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} rooms`,
                responsive: true,
              }}
              locale={{
                emptyText: t('noData'),
              }}
            />
          </Card>
        ) : (
          <FloorMapView
            rooms={filteredRooms}
            getRoomTypeName={getRoomTypeName}
          />
        )}
      </Spin>
    </div>
  );
}
