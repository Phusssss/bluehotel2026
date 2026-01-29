import { Card, Row, Col, Statistic, Spin, Alert, Typography, Divider, Button } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
  CalendarOutlined,
  ClearOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '../features/dashboard/hooks/useDashboard';
import { useHotel } from '../contexts/HotelContext';

const { Title } = Typography;

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const { currentHotel } = useHotel();
  const { metrics, loading, error, refresh } = useDashboard();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message={t('error')}
        description={error.message}
        type="error"
        showIcon
        action={
          <Button size="small" danger onClick={refresh}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  if (!metrics) {
    return (
      <Alert
        message={t('noData')}
        type="info"
        showIcon
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>{t('title')}</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={refresh}
          type="default"
        >
          {t('refresh')}
        </Button>
      </div>

      {/* Occupancy and Revenue Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('occupancyToday')}
              value={metrics.occupancyToday}
              precision={1}
              prefix={<HomeOutlined />}
              suffix="%"
              valueStyle={{ color: metrics.occupancyToday > 80 ? '#3f8600' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('occupancyThisWeek')}
              value={metrics.occupancyThisWeek}
              precision={1}
              prefix={<HomeOutlined />}
              suffix="%"
              valueStyle={{ color: metrics.occupancyThisWeek > 80 ? '#3f8600' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('revenueToday')}
              value={metrics.revenueToday}
              precision={0}
              prefix={<DollarOutlined />}
              suffix={currentHotel?.currency || 'VND'}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('revenueThisMonth')}
              value={metrics.revenueThisMonth}
              precision={0}
              prefix={<DollarOutlined />}
              suffix={currentHotel?.currency || 'VND'}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">{t('todayActivity')}</Divider>

      {/* Today's Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('checkInsToday')}
              value={metrics.checkInsToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('checkOutsToday')}
              value={metrics.checkOutsToday}
              prefix={<LogoutOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('dirtyRooms')}
              value={metrics.dirtyRoomsCount}
              prefix={<ClearOutlined />}
              valueStyle={{ color: metrics.dirtyRoomsCount > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('maintenanceRooms')}
              value={metrics.maintenanceRoomsCount}
              prefix={<ToolOutlined />}
              valueStyle={{ color: metrics.maintenanceRoomsCount > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">{t('roomStatus')}</Divider>

      {/* Room Status Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('totalRooms')}
              value={metrics.totalRooms}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('occupiedRooms')}
              value={metrics.occupiedRooms}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('availableRooms')}
              value={metrics.availableRooms}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
