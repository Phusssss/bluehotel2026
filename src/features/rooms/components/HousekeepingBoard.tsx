import { useState, useEffect } from 'react';
import {
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
  Typography,
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

const { Title } = Typography;
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
 * Matches PricingPage UI style for consistency
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

  /**
   * Show error message if there's an error
   */
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
   * Table columns configuration with responsive breakpoints
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
      width: 100,
    },
    {
      title: t('housekeeping.table.taskType'),
      dataIndex: 'taskType',
      key: 'taskType',
      render: (taskType: HousekeepingTask['taskType']) => (
        <span>{t(`housekeeping.taskType.${taskType}`)}</span>
      ),
      width: 120,
      responsive: ['md'],
    },
    {
      title: t('housekeeping.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: HousekeepingTask['priority']) => (
        <Tag color={PRIORITY_COLORS[priority]}>
          {t(`housekeeping.priority.${priority}`)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: t('housekeeping.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: HousekeepingTask['status']) => (
        <Tag color={STATUS_COLORS[status]}>
          {t(`housekeeping.taskStatus.${status}`)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: t('housekeeping.table.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: string | undefined) => getStaffName(assignedTo),
      width: 120,
      responsive: ['lg'],
      ellipsis: true,
    },
    {
      title: t('housekeeping.table.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => {
        if (!createdAt) return '-';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        return dayjs(date).format('MMM DD, HH:mm');
      },
      width: 120,
      responsive: ['lg'],
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'completed' && (
            <Button
              type="link"
              icon={<UserAddOutlined />}
              onClick={() => openAssignModal(record)}
              size="small"
              style={{ padding: 0 }}
            >
              {t('housekeeping.actions.assign')}
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
              {t('housekeeping.actions.complete')}
            </Button>
          )}
        </Space>
      ),
      width: 100,
    },
  ];

  return (
    <div style={{ padding: '1px' }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>{t('housekeeping.title')}</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={refresh} 
          loading={loading}
          size="middle"
        >
          {tCommon('common.refresh')}
        </Button>
      </div>

      {/* Filters Card */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Select
              placeholder={t('housekeeping.filters.taskStatus')}
              style={{ width: '100%' }}
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
            <Select
              placeholder={t('housekeeping.filters.taskType')}
              style={{ width: '100%' }}
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
            <Select
              placeholder={t('housekeeping.filters.priority')}
              style={{ width: '100%' }}
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
            <Select
              placeholder={t('housekeeping.filters.assignedTo')}
              style={{ width: '100%' }}
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

        <Row style={{ marginTop: '16px' }}>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResetFilters}
            >
              {tCommon('filters.reset')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Spin spinning={loading} tip={t('housekeeping.loadingTasks')}>
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: false,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} / ${total}`,
              responsive: true,
              size: 'default',
            }}
            locale={{
              emptyText: (
                <Empty
                  description={t('housekeeping.noTasks')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            size="middle"
          />
        </Spin>
      </div>

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
        width="95%"
        style={{ maxWidth: 400, top: 20 }}
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
