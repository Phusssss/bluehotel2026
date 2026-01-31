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
  Drawer,
  Modal,
  Descriptions,
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
  FilterOutlined,
  EyeOutlined,
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

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface FilterState {
  searchText: string;
  status: Room['status'] | undefined;
  roomTypeId: string | undefined;
  floor: number | undefined;
}

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

  const [localFilters, setLocalFilters] = useState<FilterState>({
    searchText: '',
    status: undefined,
    roomTypeId: undefined,
    floor: undefined,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeTab, setActiveTab] = useState<TabKey>('rooms');
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
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
   * Handle search input change
   */
  const handleSearch = (value: string) => {
    setLocalFilters(prev => ({ ...prev, searchText: value }));
  };

  /**
   * Handle status filter change
   */
  const handleStatusChange = (value: Room['status'] | undefined) => {
    setLocalFilters(prev => ({ ...prev, status: value }));
    updateFilters({ ...filters, status: value });
  };

  /**
   * Handle room type filter change
   */
  const handleRoomTypeChange = (value: string | undefined) => {
    setLocalFilters(prev => ({ ...prev, roomTypeId: value }));
    updateFilters({ ...filters, roomTypeId: value });
  };

  /**
   * Handle floor filter change
   */
  const handleFloorChange = (value: number | undefined) => {
    setLocalFilters(prev => ({ ...prev, floor: value }));
    updateFilters({ ...filters, floor: value });
  };

  /**
   * Handle reset filters
   */
  const handleResetFilters = () => {
    setLocalFilters({
      searchText: '',
      status: undefined,
      roomTypeId: undefined,
      floor: undefined,
    });
    resetFilters();
  };

  /**
   * Toggle filters visibility
   */
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  /**
   * Close filters (for mobile drawer)
   */
  const closeFilters = () => {
    setShowFilters(false);
  };

  /**
   * Render filter content
   */
  const renderFilterContent = () => (
    <div style={{ padding: isMobile ? '0' : '16px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.status')}
            </label>
            <Select
              placeholder={t('filters.status')}
              style={{ width: '100%' }}
              value={localFilters.status}
              onChange={handleStatusChange}
              allowClear
            >
              <Option value="vacant">{t('status.vacant')}</Option>
              <Option value="occupied">{t('status.occupied')}</Option>
              <Option value="dirty">{t('status.dirty')}</Option>
              <Option value="maintenance">{t('status.maintenance')}</Option>
              <Option value="reserved">{t('status.reserved')}</Option>
            </Select>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.roomType')}
            </label>
            <Select
              placeholder={t('filters.roomType')}
              style={{ width: '100%' }}
              value={localFilters.roomTypeId}
              onChange={handleRoomTypeChange}
              allowClear
            >
              {roomTypes.map((roomType) => (
                <Option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.floor')}
            </label>
            <Select
              placeholder={t('filters.floor')}
              style={{ width: '100%' }}
              value={localFilters.floor}
              onChange={handleFloorChange}
              allowClear
            >
              {getUniqueFloors().map((floor) => (
                <Option key={floor} value={floor}>
                  {floor}
                </Option>
              ))}
            </Select>
          </div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <div style={{ display: 'flex', alignItems: 'end', height: '100%' }}>
            <Button 
              onClick={handleResetFilters}
              style={{ width: '100%' }}
            >
              {t('filters.reset')}
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* Mobile: Apply and Close buttons */}
      {isMobile && (
        <div style={{ 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: '12px'
        }}>
          <Button 
            type="primary" 
            onClick={closeFilters}
            style={{ flex: 1 }}
          >
            {t('filters.apply')}
          </Button>
          <Button 
            onClick={closeFilters}
            style={{ flex: 1 }}
          >
            {t('common:buttons.close')}
          </Button>
        </div>
      )}
    </div>
  );

  /**
   * Handle view room details
   */
  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setDetailsModalVisible(true);
  };

  /**
   * Handle row click to view room details on mobile
   */
  const handleRowClick = (record: Room) => {
    if (isMobile) {
      handleViewDetails(record);
    }
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
    setDetailsModalVisible(false);
    setSelectedRoom(null);
  };

  /**
   * Handle modal success and refresh
   */
  const handleModalSuccess = () => {
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setDeleteModalVisible(false);
    setDetailsModalVisible(false);
    setSelectedRoom(null);
    refresh();
  };

  /**
   * Get action menu items for a room
   */
  const getActionMenuItems = (room: Room): MenuProps['items'] => [
    {
      key: 'view',
      label: t('crud.actions.view'),
      icon: <EyeOutlined />,
      onClick: () => handleViewDetails(room),
    },
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
    room.roomNumber.toLowerCase().includes(localFilters.searchText.toLowerCase())
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
      width: 'auto',
      ellipsis: true,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: t('table.roomType'),
      dataIndex: 'roomTypeId',
      key: 'roomTypeId',
      width: 'auto',
      ellipsis: true,
      render: (roomTypeId: string) => getRoomTypeName(roomTypeId),
      responsive: ['md'],
    },
    {
      title: t('table.floor'),
      dataIndex: 'floor',
      key: 'floor',
      sorter: (a, b) => a.floor - b.floor,
      width: 'auto',
      responsive: ['sm'],
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 'auto',
      render: (status: Room['status']) => (
        <Tag color={STATUS_COLORS[status]}>
          {isMobile ? t(`status.${status}`).substring(0, 4) : t(`status.${status}`)}
        </Tag>
      ),
    },
    ...(!isMobile ? [{
      title: t('table.notes'),
      dataIndex: 'notes',
      key: 'notes',
      width: 'auto',
      ellipsis: true,
      responsive: ['lg'] as any,
    }] : []),
    {
      title: t('table.actions'),
      key: 'actions',
      width: isMobile ? 60 : 'auto',
      fixed: 'right' as const,
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
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ], [t, isMobile, getRoomTypeName, getActionMenuItems]);

  return (
    <div style={{ padding: '1px' }}>
      {/* Mobile row hover styles */}
      {isMobile && (
        <style>
          {`
            .mobile-clickable-row:hover {
              background-color: #f5f5f5 !important;
            }
            .mobile-clickable-row:active {
              background-color: #e6f7ff !important;
            }
          `}
        </style>
      )}

      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '24px' }} data-tour="rooms-title">{t('title')}</Title>
          {isMobile && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('table.tapToView')}
            </Text>
          )}
        </div>
        <Space wrap size="small">
          <Button
            icon={<FilterOutlined />}
            onClick={toggleFilters}
            type={showFilters ? 'primary' : 'default'}
            size="middle"
          >
            {t('filters.toggle')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={refresh}
            loading={loading}
            size="middle"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateRoom}
            size="middle"
            data-tour="create-room"
          >
            {t('crud.actions.create')}
          </Button>
        </Space>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        marginBottom: '16px',
        position: isMobile ? 'sticky' : 'static',
        top: isMobile ? '0' : 'auto',
        zIndex: isMobile ? 10 : 'auto',
        backgroundColor: '#fff',
        paddingTop: isMobile ? '8px' : '0',
        paddingBottom: isMobile ? '8px' : '0'
      }}>
        <Search
          placeholder={t('filters.search')}
          allowClear
          enterButton={<SearchOutlined />}
          size={isMobile ? 'middle' : 'large'}
          value={localFilters.searchText}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
          style={{ marginBottom: showFilters && !isMobile ? '16px' : '0' }}
        />
        
        {/* Desktop: Inline filters */}
        {showFilters && !isMobile && (
          <Card size="small" style={{ marginTop: '16px' }}>
            {renderFilterContent()}
          </Card>
        )}
      </div>

      {/* Mobile: Bottom drawer for filters */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterOutlined />
            {t('filters.title')}
          </div>
        }
        placement="bottom"
        onClose={closeFilters}
        open={showFilters && isMobile}
        height="75vh"
        styles={{
          body: { padding: '16px' },
          header: { 
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '12px'
          }
        }}
      >
        {renderFilterContent()}
      </Drawer>
      {/* Tabs Content */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
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
                <div style={{ padding: '16px' }}>
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
                              <TableOutlined /> {!isMobile && t('viewMode.table')}
                            </span>
                          ),
                          value: 'table',
                        },
                        {
                          label: (
                            <span style={{ padding: '0 8px' }}>
                              <AppstoreOutlined /> {!isMobile && t('viewMode.floor')}
                            </span>
                          ),
                          value: 'floor',
                        },
                      ]}
                    />
                  </div>

                  <Spin spinning={loading} tip={t('loading')}>
                    {viewMode === 'table' ? (
                      <Table
                        data-tour="rooms-table"
                        columns={columns}
                        dataSource={filteredRooms}
                        rowKey="id"
                        scroll={{ x: 'max-content' }}
                        tableLayout="auto"
                        onRow={(record) => ({
                          onClick: () => handleRowClick(record),
                          style: { 
                            cursor: isMobile ? 'pointer' : 'default' 
                          },
                        })}
                        rowClassName={(record) => 
                          isMobile ? 'mobile-clickable-row' : ''
                        }
                        pagination={{
                          pageSize: isMobile ? 5 : 10,
                          showSizeChanger: !isMobile,
                          showQuickJumper: false,
                          showTotal: (total, range) =>
                            `${range[0]}-${range[1]} / ${total}`,
                          responsive: true,
                          size: isMobile ? 'small' : 'default',
                        }}
                        size={isMobile ? 'small' : 'middle'}
                        locale={{
                          emptyText: t('noData'),
                        }}
                      />
                    ) : (
                      <FloorMapView
                        rooms={filteredRooms}
                        getRoomTypeName={getRoomTypeName}
                      />
                    )}
                  </Spin>
                </div>
              ),
            },
            {
              key: 'housekeeping',
              label: (
                <span>
                  <HomeOutlined />
                  {!isMobile && t('housekeeping.title')}
                </span>
              ),
              children: <div style={{ padding: '16px' }}><HousekeepingBoard /></div>,
            },
            {
              key: 'maintenance',
              label: (
                <span>
                  <ToolOutlined />
                  {!isMobile && t('maintenance.title')}
                </span>
              ),
              children: <div style={{ padding: '16px' }}><MaintenanceBoard /></div>,
            },
          ]}
        />
      </div>

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

      {/* Room Details Modal */}
      <Modal
        title={t('details.title')}
        open={detailsModalVisible}
        onCancel={handleModalClose}
        width="95%"
        style={{ maxWidth: 600, top: 20 }}
        footer={
          selectedRoom && (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setDetailsModalVisible(false);
                  handleEditRoom(selectedRoom);
                }}
              >
                {t('crud.actions.edit')}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setDetailsModalVisible(false);
                  handleDeleteRoom(selectedRoom);
                }}
              >
                {t('crud.actions.delete')}
              </Button>
              <Button onClick={handleModalClose}>
                {t('crud.form.cancel')}
              </Button>
            </Space>
          )
        }
      >
        {selectedRoom && (
          <div>
            <Title level={4}>{t('details.basicInfo')}</Title>
            <Descriptions bordered column={isMobile ? 1 : 2}>
              <Descriptions.Item label={t('details.roomNumber')}>
                <strong>{selectedRoom.roomNumber}</strong>
              </Descriptions.Item>
              <Descriptions.Item label={t('details.roomType')}>
                {getRoomTypeName(selectedRoom.roomTypeId)}
              </Descriptions.Item>
              <Descriptions.Item label={t('details.floor')}>
                {selectedRoom.floor}
              </Descriptions.Item>
              <Descriptions.Item label={t('details.status')}>
                <Tag color={STATUS_COLORS[selectedRoom.status]}>
                  {t(`status.${selectedRoom.status}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('details.notes')} span={isMobile ? 1 : 2}>
                {selectedRoom.notes || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('details.createdAt')}>
                {selectedRoom.createdAt ? new Date(selectedRoom.createdAt.toDate()).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('details.updatedAt')}>
                {selectedRoom.updatedAt ? new Date(selectedRoom.updatedAt.toDate()).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
}
