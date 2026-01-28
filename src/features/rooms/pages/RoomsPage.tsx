import { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  TableOutlined,
  AppstoreOutlined,
  ToolOutlined,
  HomeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRooms } from '../hooks/useRooms';
import { FloorMapView } from '../components/FloorMapView';
import { HousekeepingBoard } from '../components/HousekeepingBoard';
import { MaintenanceBoard } from '../components/MaintenanceBoard';
import { CreateRoomForm } from '../components/CreateRoomForm';
import { EditRoomForm } from '../components/EditRoomForm';
import { DeleteRoomModal } from '../components/DeleteRoomModal';
import type { Room } from '../../../types';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

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
type TabKey = 'rooms' | 'housekeeping' | 'maintenance';

/**
 * RoomsPage component - displays list of rooms with filtering and CRUD operations
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
    refresh,
  } = useRooms();

  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<TabKey>('rooms');
  const [isMobile, setIsMobile] = useState(false);
  
  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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
   * Handle create room
   */
  const handleCreateRoom = () => {
    setCreateModalVisible(true);
  };

  /**
   * Handle edit room
   */
  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setEditModalVisible(true);
  };

  /**
   * Handle delete room
   */
  const handleDeleteRoom = (room: Room) => {
    setSelectedRoom(room);
    setDeleteModalVisible(true);
  };

  /**
   * Handle modal close without refresh
   */
  const handleModalClose = () => {
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setDeleteModalVisible(false);
    setSelectedRoom(null);
  };

  /**
   * Handle modal success and refresh
   */
  const handleModalSuccess = () => {
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setDeleteModalVisible(false);
    setSelectedRoom(null);
    refresh();
  };

  /**
   * Get action menu items for a room
   */
  const getActionMenuItems = (room: Room): MenuProps['items'] => [
    {
      key: 'edit',
      label: t('crud.actions.edit'),
      icon: <EditOutlined />,
      onClick: () => handleEditRoom(room),
    },
    {
      key: 'delete',
      label: t('crud.actions.delete'),
      icon: <DeleteOutlined />,
      onClick: () => handleDeleteRoom(room),
      danger: true,
    },
  ];

  /**
   * Filter rooms by search text (room number)
   */
  const filteredRooms = rooms.filter((room) =>
    room.roomNumber.toLowerCase().includes(searchText.toLowerCase())
  );

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<Room> = useMemo(() => [
    {
      title: t('table.roomNumber'),
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      sorter: (a, b) => a.roomNumber.localeCompare(b.roomNumber),
      width: isMobile ? 100 : 120,
      fixed: isMobile ? undefined : 'left',
      render: (text: string) => <strong>{text}</strong>,
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
      width: isMobile ? 60 : 80,
      responsive: ['sm'],
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: Room['status']) => (
        <Tag color={STATUS_COLORS[status]}>
          {isMobile ? t(`status.${status}`).substring(0, 4) : t(`status.${status}`)}
        </Tag>
      ),
      width: isMobile ? 80 : 120,
    },
    ...(!isMobile ? [{
      title: t('table.notes'),
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      responsive: ['lg'] as any,
    }] : []),
    {
      title: t('table.actions'),
      key: 'actions',
      width: isMobile ? 60 : 80,
      fixed: isMobile ? undefined : 'right',
      render: (_, room) => (
        <Dropdown
          menu={{ items: getActionMenuItems(room) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
          />
        </Dropdown>
      ),
    },
  ], [t, isMobile, getRoomTypeName, getActionMenuItems]);

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <Title level={2} style={{ margin: 0 }}>{t('title')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateRoom}
          size={isMobile ? 'small' : 'middle'}
        >
          {isMobile ? t('crud.actions.create').substring(0, 6) : t('crud.actions.create')}
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={[
          {
            key: 'rooms',
            label: (
              <span>
                <TableOutlined />
                {t('title')}
              </span>
            ),
            children: (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  marginBottom: '16px'
                }}>
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
                        scroll={{ x: isMobile ? 600 : 800 }}
                        pagination={{
                          pageSize: isMobile ? 10 : 20,
                          showSizeChanger: !isMobile,
                          showTotal: (total) => isMobile ? `${total}` : `Total ${total} rooms`,
                          responsive: true,
                          simple: isMobile,
                        }}
                        size={isMobile ? 'small' : 'middle'}
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
              </>
            ),
          },
          {
            key: 'housekeeping',
            label: (
              <span>
                <HomeOutlined />
                {t('housekeeping.title')}
              </span>
            ),
            children: <HousekeepingBoard />,
          },
          {
            key: 'maintenance',
            label: (
              <span>
                <ToolOutlined />
                {t('maintenance.title')}
              </span>
            ),
            children: <MaintenanceBoard />,
          },
        ]}
      />

      {/* CRUD Modals */}
      <CreateRoomForm
        visible={createModalVisible}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
        roomTypes={roomTypes}
      />

      <EditRoomForm
        visible={editModalVisible}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
        room={selectedRoom}
        roomTypes={roomTypes}
      />

      <DeleteRoomModal
        visible={deleteModalVisible}
        onCancel={handleModalClose}
        onSuccess={handleModalSuccess}
        room={selectedRoom}
      />
    </div>
  );
}
