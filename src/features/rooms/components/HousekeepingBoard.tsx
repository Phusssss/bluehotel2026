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
  message,
  Empty,
} from 'antd';
import { 
  ReloadOutlined, 
  UserAddOutlined, 
  CheckOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useHousekeeping } from '../hooks/useHousekeeping';
import type { HousekeepingTask } from '../../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;

/**
 * Status color mapping for task status tags
 */
const STATUS_COLORS: Record<HousekeepingTask['status'], string> = {
  pending: 'orange',
  'in-progress': 'blue',
  completed: 'green',
};

/**
 * Priority color mapping for priority tags
 */
const PRIORITY_COLORS: Record<HousekeepingTask['priority'], string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
};

/**
 * HousekeepingBoard component - displays housekeeping tasks with assignment
 */
export function HousekeepingBoard() {
  const { t } = useTranslation('rooms');
  const { t: tCommon } = useTranslation('common');
  const {
    tasks,
    staff,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getRoomById,
    assignTask,
    completeTask,
    refresh,
  } = useHousekeeping();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState(false);
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

  // Show error message if there's an error
  useEffect(() => {
    if (error) {
      message.error(error.message || t('housekeeping.messages.loadError'));
    }
  }, [error, t]);

  /**
   * Handle task status filter change
   */
  const handleStatusChange = (value: HousekeepingTask['status'] | undefined) => {
    updateFilters({ ...filters, status: value });
  };

  /**
   * Handle task type filter change
   */
  const handleTaskTypeChange = (value: HousekeepingTask['taskType'] | undefined) => {
    updateFilters({ ...filters, taskType: value });
  };

  /**
   * Handle priority filter change
   */
  const handlePriorityChange = (value: HousekeepingTask['priority'] | undefined) => {
    updateFilters({ ...filters, priority: value });
  };

  /**
   * Handle assigned to filter change
   */
  const handleAssignedToChange = (value: string | undefined) => {
    updateFilters({ ...filters, assignedTo: value });
  };

  /**
   * Handle reset filters
   */
  const handleResetFilters = () => {
    resetFilters();
  };

  /**
   * Open assign modal
   */
  const openAssignModal = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setSelectedStaffId(task.assignedTo);
    setAssignModalVisible(true);
  };

  /**
   * Handle assign task
   */
  const handleAssignTask = async () => {
    if (!selectedTask || !selectedStaffId) return;

    setActionLoading(true);
    try {
      await assignTask(selectedTask.id, selectedStaffId);
      message.success(t('housekeeping.messages.assignSuccess'));
      setAssignModalVisible(false);
      setSelectedTask(null);
      setSelectedStaffId(undefined);
    } catch (error) {
      message.error(t('housekeeping.messages.assignError'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle complete task
   */
  const handleCompleteTask = async (task: HousekeepingTask) => {
    setActionLoading(true);
    try {
      await completeTask(task.id, task.roomId);
      message.success(t('housekeeping.messages.completeSuccess'));
    } catch (error) {
      message.error(t('housekeeping.messages.completeError'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get staff member name by ID
   */
  const getStaffName = (userId: string | undefined): string => {
    if (!userId) return t('housekeeping.actions.unassigned');
    const staffMember = staff.find((s) => s.userId === userId);
    return staffMember ? staffMember.userId : t('housekeeping.actions.unassigned');
  };

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<HousekeepingTask> = [
    {
      title: t('housekeeping.table.room'),
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
      title: t('housekeeping.table.taskType'),
      dataIndex: 'taskType',
      key: 'taskType',
      render: (taskType: HousekeepingTask['taskType']) => (
        <span>{t(`housekeeping.taskType.${taskType}`)}</span>
      ),
      width: isMobile ? 100 : 120,
      responsive: ['md'],
    },
    {
      title: t('housekeeping.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: HousekeepingTask['priority']) => (
        <Tag color={PRIORITY_COLORS[priority]}>
          {isMobile ? priority.substring(0, 3).toUpperCase() : t(`housekeeping.priority.${priority}`)}
        </Tag>
      ),
      width: isMobile ? 80 : 100,
    },
    {
      title: t('housekeeping.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: HousekeepingTask['status']) => (
        <Tag color={STATUS_COLORS[status]}>
          {isMobile ? status.substring(0, 4) : t(`housekeeping.taskStatus.${status}`)}
        </Tag>
      ),
      width: isMobile ? 80 : 120,
    },
    {
      title: t('housekeeping.table.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: string | undefined) => getStaffName(assignedTo),
      width: 120,
      responsive: ['lg'],
    },
    {
      title: t('housekeeping.table.createdAt'),
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
      title: t('housekeeping.table.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          {record.status !== 'completed' && (
            <Button
              type="link"
              icon={<UserAddOutlined />}
              onClick={() => openAssignModal(record)}
              size="small"
              style={{ padding: 0 }}
            >
              {!isMobile && t('housekeeping.actions.assign')}
            </Button>
          )}
          {record.status === 'in-progress' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleCompleteTask(record)}
              size="small"
              loading={actionLoading}
              style={{ padding: 0 }}
            >
              {!isMobile && t('housekeeping.actions.complete')}
            </Button>
          )}
        </Space>
      ),
      width: isMobile ? 80 : 100,
      fixed: 'right',
    },
  ];

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      <Card
        title={t('housekeeping.title')}
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refresh} 
            loading={loading}
            size={isMobile ? 'small' : 'middle'}
          >
            {!isMobile && tCommon('common.refresh')}
          </Button>
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
                <strong>{t('housekeeping.filters.taskStatus')}</strong>
              </div>
              <Select
                placeholder={t('housekeeping.filters.taskStatus')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.status}
                onChange={handleStatusChange}
                allowClear
              >
                <Option value={undefined}>{t('housekeeping.filters.taskStatusAll')}</Option>
                <Option value="pending">{t('housekeeping.taskStatus.pending')}</Option>
                <Option value="in-progress">{t('housekeeping.taskStatus.in-progress')}</Option>
                <Option value="completed">{t('housekeeping.taskStatus.completed')}</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('housekeeping.filters.taskType')}</strong>
              </div>
              <Select
                placeholder={t('housekeeping.filters.taskType')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.taskType}
                onChange={handleTaskTypeChange}
                allowClear
              >
                <Option value={undefined}>{t('housekeeping.filters.taskTypeAll')}</Option>
                <Option value="clean">{t('housekeeping.taskType.clean')}</Option>
                <Option value="deep-clean">{t('housekeeping.taskType.deep-clean')}</Option>
                <Option value="turndown">{t('housekeeping.taskType.turndown')}</Option>
                <Option value="inspection">{t('housekeeping.taskType.inspection')}</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('housekeeping.filters.priority')}</strong>
              </div>
              <Select
                placeholder={t('housekeeping.filters.priority')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.priority}
                onChange={handlePriorityChange}
                allowClear
              >
                <Option value={undefined}>{t('housekeeping.filters.priorityAll')}</Option>
                <Option value="low">{t('housekeeping.priority.low')}</Option>
                <Option value="normal">{t('housekeeping.priority.normal')}</Option>
                <Option value="high">{t('housekeeping.priority.high')}</Option>
                <Option value="urgent">{t('housekeeping.priority.urgent')}</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <div style={{ marginBottom: 8, fontSize: isMobile ? 12 : 14 }}>
                <strong>{t('housekeeping.filters.assignedTo')}</strong>
              </div>
              <Select
                placeholder={t('housekeeping.filters.assignedTo')}
                style={{ width: '100%' }}
                size={isMobile ? 'small' : 'middle'}
                value={filters.assignedTo}
                onChange={handleAssignedToChange}
                allowClear
              >
                <Option value={undefined}>{t('housekeeping.filters.assignedToAll')}</Option>
                {staff.map((staffMember) => (
                  <Option key={staffMember.id} value={staffMember.userId}>
                    {staffMember.userId}
                  </Option>
                ))}
              </Select>
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
        <Spin spinning={loading} tip={t('housekeeping.loadingTasks')}>
          <Table
            columns={columns}
            dataSource={tasks}
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
                  description={t('housekeeping.noTasks')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            size={isMobile ? 'small' : 'middle'}
          />
        </Spin>
      </Card>

      {/* Assign Task Modal */}
      <Modal
        title={t('housekeeping.modal.assignTitle')}
        open={assignModalVisible}
        onOk={handleAssignTask}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedTask(null);
          setSelectedStaffId(undefined);
        }}
        confirmLoading={actionLoading}
        okText={t('housekeeping.modal.confirm')}
        cancelText={t('housekeeping.modal.cancel')}
        width={isMobile ? '100%' : 400}
        style={isMobile ? { top: 0, maxWidth: '100vw', margin: 0, padding: 0 } : undefined}
      >
        <div style={{ padding: '16px 0' }}>
          <Select
            placeholder={t('housekeeping.modal.selectStaff')}
            style={{ width: '100%' }}
            value={selectedStaffId}
            onChange={setSelectedStaffId}
          >
            {staff.map((staffMember) => (
              <Option key={staffMember.id} value={staffMember.userId}>
                {staffMember.userId}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
