import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Spin,
  Modal,
  Form,
  Input,
  message,
  Empty,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  UserAddOutlined,
  CheckOutlined,
  CloseOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useMaintenance } from '../hooks/useMaintenance';
import type { MaintenanceTicket, Room } from '../../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

/**
 * Status color mapping for ticket status tags
 */
const STATUS_COLORS: Record<MaintenanceTicket['status'], string> = {
  open: 'orange',
  'in-progress': 'blue',
  resolved: 'green',
  closed: 'default',
};

/**
 * Priority color mapping for priority tags
 */
const PRIORITY_COLORS: Record<MaintenanceTicket['priority'], string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

/**
 * MaintenanceBoard component - displays maintenance tickets with management
 */
export function MaintenanceBoard() {
  const { t } = useTranslation('rooms');
  const { t: tCommon } = useTranslation('common');
  const {
    tickets,
    rooms,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getRoomById,
    createTicket,
    assignTicket,
    resolveTicket,
    closeTicket,
    refresh,
  } = useMaintenance();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [createForm] = Form.useForm();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      message.error(error.message || t('maintenance.messages.loadError'));
    }
  }, [error, t]);

  /**
   * Handle status filter change
   */
  const handleStatusChange = (value: MaintenanceTicket['status'] | undefined) => {
    updateFilters({ ...filters, status: value });
  };

  /**
   * Handle priority filter change
   */
  const handlePriorityChange = (value: MaintenanceTicket['priority'] | undefined) => {
    updateFilters({ ...filters, priority: value });
  };

  /**
   * Handle assigned to filter change
   */
  const handleAssignedToChange = (value: string | undefined) => {
    updateFilters({ ...filters, assignedTo: value });
  };

  /**
   * Handle room filter change
   */
  const handleRoomChange = (value: string | undefined) => {
    updateFilters({ ...filters, roomId: value });
  };

  /**
   * Handle reset filters
   */
  const handleResetFilters = () => {
    resetFilters();
  };

  /**
   * Open create ticket modal
   */
  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  /**
   * Handle create ticket
   */
  const handleCreateTicket = async (values: any) => {
    setActionLoading(true);
    try {
      await createTicket({
        roomId: values.roomId,
        issue: values.issue,
        description: values.description,
        priority: values.priority || 'normal',
        status: 'open',
        assignedTo: values.assignedTo,
      });
      message.success(t('maintenance.messages.createSuccess'));
      setCreateModalVisible(false);
      createForm.resetFields();
    } catch (error) {
      message.error(t('maintenance.messages.createError'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Open assign modal
   */
  const openAssignModal = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setSelectedAssignee(ticket.assignedTo);
    setAssignModalVisible(true);
  };

  /**
   * Handle assign ticket
   */
  const handleAssignTicket = async () => {
    if (!selectedTicket || !selectedAssignee) return;

    setActionLoading(true);
    try {
      await assignTicket(selectedTicket.id, selectedAssignee);
      message.success(t('maintenance.messages.assignSuccess'));
      setAssignModalVisible(false);
      setSelectedTicket(null);
      setSelectedAssignee(undefined);
    } catch (error) {
      message.error(t('maintenance.messages.assignError'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle resolve ticket
   */
  const handleResolveTicket = async (ticket: MaintenanceTicket) => {
    setActionLoading(true);
    try {
      await resolveTicket(ticket.id);
      message.success(t('maintenance.messages.resolveSuccess'));
    } catch (error) {
      message.error(t('maintenance.messages.resolveError'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle close ticket
   */
  const handleCloseTicket = async (ticket: MaintenanceTicket) => {
    setActionLoading(true);
    try {
      await closeTicket(ticket.id);
      message.success(t('maintenance.messages.closeSuccess'));
    } catch (error) {
      message.error(t('maintenance.messages.closeError'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get available rooms for maintenance (not already under maintenance)
   */
  const getAvailableRooms = (): Room[] => {
    return rooms.filter((room) => room.status !== 'maintenance');
  };

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<MaintenanceTicket> = [
    {
      title: t('maintenance.table.room'),
      dataIndex: 'roomId',
      key: 'roomId',
      render: (roomId: string) => {
        const room = getRoomById(roomId);
        return <Tag color="blue">{room?.roomNumber || roomId}</Tag>;
      },
      width: isMobile ? 80 : 100,
      fixed: isMobile ? undefined : 'left',
    },
    {
      title: t('maintenance.table.issue'),
      dataIndex: 'issue',
      key: 'issue',
      ellipsis: true,
      width: isMobile ? 120 : 150,
    },
    {
      title: t('maintenance.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: MaintenanceTicket['priority']) => (
        <Tag color={PRIORITY_COLORS[priority]}>
          {isMobile ? priority.substring(0, 3).toUpperCase() : t(`maintenance.priority.${priority}`)}
        </Tag>
      ),
      width: isMobile ? 80 : 100,
    },
    {
      title: t('maintenance.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: MaintenanceTicket['status']) => (
        <Tag color={STATUS_COLORS[status]}>
          {isMobile ? status.substring(0, 4) : t(`maintenance.ticketStatus.${status}`)}
        </Tag>
      ),
      width: isMobile ? 80 : 120,
    },
    {
      title: t('maintenance.table.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: string | undefined) => 
        assignedTo || t('maintenance.actions.unassigned'),
      width: 120,
      responsive: ['lg'],
    },
    {
      title: t('maintenance.table.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => {
        if (!createdAt) return '-';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return dayjs(date).format(isMobile ? 'MM/DD' : 'MMM DD, HH:mm');
      },
      width: isMobile ? 80 : 120,
      responsive: ['lg'],
    },
    {
      title: t('maintenance.table.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          {record.status === 'open' && (
            <Tooltip title={t('maintenance.actions.assign')}>
              <Button
                type="link"
                icon={<UserAddOutlined />}
                onClick={() => openAssignModal(record)}
                size="small"
                style={{ padding: 0 }}
              >
                {!isMobile && t('maintenance.actions.assign')}
              </Button>
            </Tooltip>
          )}
          {record.status === 'in-progress' && (
            <Tooltip title={t('maintenance.actions.resolve')}>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleResolveTicket(record)}
                size="small"
                loading={actionLoading}
                style={{ padding: 0 }}
              >
                {!isMobile && t('maintenance.actions.resolve')}
              </Button>
            </Tooltip>
          )}
          {record.status === 'resolved' && (
            <Tooltip title={t('maintenance.actions.close')}>
              <Button
                type="link"
                icon={<CloseOutlined />}
                onClick={() => handleCloseTicket(record)}
                size="small"
                loading={actionLoading}
                style={{ padding: 0 }}
              >
                {!isMobile && t('maintenance.actions.close')}
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: isMobile ? 80 : 120,
      fixed: 'right',
    },
  ];

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      <Card
        title={
          <Space>
            <ToolOutlined />
            {t('maintenance.title')}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && t('maintenance.actions.create')}
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refresh} 
              loading={loading}
              size={isMobile ? 'small' : 'middle'}
            >
              {!isMobile && tCommon('common.refresh')}
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Card
          size="small"
          style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
        >
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('maintenance.filters.status')}</strong>
              </div>
              <Select
                placeholder={t('maintenance.filters.status')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.status}
                onChange={handleStatusChange}
                allowClear
              >
                <Option value={undefined}>{t('maintenance.filters.statusAll')}</Option>
                <Option value="open">{t('maintenance.ticketStatus.open')}</Option>
                <Option value="in-progress">{t('maintenance.ticketStatus.in-progress')}</Option>
                <Option value="resolved">{t('maintenance.ticketStatus.resolved')}</Option>
                <Option value="closed">{t('maintenance.ticketStatus.closed')}</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('maintenance.filters.priority')}</strong>
              </div>
              <Select
                placeholder={t('maintenance.filters.priority')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.priority}
                onChange={handlePriorityChange}
                allowClear
              >
                <Option value={undefined}>{t('maintenance.filters.priorityAll')}</Option>
                <Option value="low">{t('maintenance.priority.low')}</Option>
                <Option value="normal">{t('maintenance.priority.normal')}</Option>
                <Option value="high">{t('maintenance.priority.high')}</Option>
                <Option value="urgent">{t('maintenance.priority.urgent')}</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('maintenance.filters.room')}</strong>
              </div>
              <Select
                placeholder={t('maintenance.filters.room')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.roomId}
                onChange={handleRoomChange}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                <Option value={undefined}>{t('maintenance.filters.roomAll')}</Option>
                {rooms.map((room) => (
                  <Option key={room.id} value={room.id}>
                    {room.roomNumber}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('maintenance.filters.assignedTo')}</strong>
              </div>
              <Input
                placeholder={t('maintenance.filters.assignedTo')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.assignedTo}
                onChange={(e) => handleAssignedToChange(e.target.value || undefined)}
                allowClear
              />
            </Col>
          </Row>

          <Row style={{ marginTop: isMobile ? 8 : 16 }}>
            <Col span={24}>
              <Space size={isMobile ? 'small' : 'middle'}>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleResetFilters}
                  size={isMobile ? 'small' : 'middle'}
                >
                  {tCommon('filters.reset')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Spin spinning={loading} tip={t('maintenance.loadingTickets')}>
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            scroll={{ x: isMobile ? 600 : 800 }}
            pagination={{
              pageSize: isMobile ? 10 : 20,
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: (total, range) => 
                isMobile 
                  ? `${total}` 
                  : `${range[0]}-${range[1]} ${tCommon('common.of')} ${total} ${tCommon('common.items')}`,
              simple: isMobile,
            }}
            locale={{
              emptyText: (
                <Empty
                  description={t('maintenance.noTickets')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            size={isMobile ? 'small' : 'middle'}
          />
        </Spin>
      </Card>

      {/* Create Ticket Modal */}
      <Modal
        title={t('maintenance.modal.createTitle')}
        open={createModalVisible}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        confirmLoading={actionLoading}
        okText={t('maintenance.modal.create')}
        cancelText={t('maintenance.modal.cancel')}
        width={isMobile ? '100%' : 600}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0 } : undefined}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTicket}
          style={{ padding: '16px 0' }}
        >
          <Form.Item
            name="roomId"
            label={t('maintenance.form.room')}
            rules={[{ required: true, message: t('maintenance.form.roomRequired') }]}
          >
            <Select
              placeholder={t('maintenance.form.roomPlaceholder')}
              showSearch
              optionFilterProp="children"
            >
              {getAvailableRooms().map((room) => (
                <Option key={room.id} value={room.id}>
                  {room.roomNumber}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="issue"
            label={t('maintenance.form.issue')}
            rules={[{ required: true, message: t('maintenance.form.issueRequired') }]}
          >
            <Input placeholder={t('maintenance.form.issuePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('maintenance.form.description')}
            rules={[{ required: true, message: t('maintenance.form.descriptionRequired') }]}
          >
            <TextArea
              rows={4}
              placeholder={t('maintenance.form.descriptionPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label={t('maintenance.form.priority')}
            initialValue="normal"
          >
            <Select>
              <Option value="low">{t('maintenance.priority.low')}</Option>
              <Option value="normal">{t('maintenance.priority.normal')}</Option>
              <Option value="high">{t('maintenance.priority.high')}</Option>
              <Option value="urgent">{t('maintenance.priority.urgent')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="assignedTo"
            label={t('maintenance.form.assignedTo')}
          >
            <Input placeholder={t('maintenance.form.assignedToPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Ticket Modal */}
      <Modal
        title={t('maintenance.modal.assignTitle')}
        open={assignModalVisible}
        onOk={handleAssignTicket}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedTicket(null);
          setSelectedAssignee(undefined);
        }}
        confirmLoading={actionLoading}
        okText={t('maintenance.modal.assign')}
        cancelText={t('maintenance.modal.cancel')}
        width={isMobile ? '100%' : 400}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0 } : undefined}
      >
        <div style={{ padding: '16px 0' }}>
          <Input
            placeholder={t('maintenance.modal.assigneePlaceholder')}
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}