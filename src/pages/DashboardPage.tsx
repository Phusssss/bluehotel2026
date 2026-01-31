import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Spin, 
  Alert, 
  Typography, 
  Divider, 
  Button, 
  Switch,
  Space
} from 'antd';
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
  BarChartOutlined,
  AppstoreOutlined,
  PieChartOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslationLoader } from '../hooks/useTranslationLoader';
import { useDashboard } from '../features/dashboard/hooks/useDashboard';

const { Title } = Typography;

export function DashboardPage() {
  const { loading: translationLoading } = useTranslationLoader('dashboard');
  const { t } = useTranslation('dashboard');
  const { metrics, loading, error, refresh } = useDashboard();
  const [isSimpleView, setIsSimpleView] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!metrics) return null;

    // Room status pie chart data
    const roomStatusData = [
      { name: t('occupiedRooms'), value: metrics.occupiedRooms, color: '#1890ff' },
      { name: t('availableRooms'), value: metrics.availableRooms, color: '#52c41a' },
      { name: t('dirtyRooms'), value: metrics.dirtyRoomsCount, color: '#faad14' },
      { name: t('maintenanceRooms'), value: metrics.maintenanceRoomsCount, color: '#ff4d4f' },
    ].filter(item => item.value > 0);

    // Revenue comparison data
    const revenueData = [
      { 
        period: t('revenueToday'), 
        value: metrics.revenueToday,
        formattedValue: formatCurrency(metrics.revenueToday)
      },
      { 
        period: t('revenueThisMonth'), 
        value: metrics.revenueThisMonth,
        formattedValue: formatCurrency(metrics.revenueThisMonth)
      },
    ];

    // Weekly occupancy trend (mock data for demonstration)
    const weeklyTrend = [
      { day: 'T2', occupancy: Math.max(0, metrics.occupancyToday - 15 + Math.random() * 10) },
      { day: 'T3', occupancy: Math.max(0, metrics.occupancyToday - 10 + Math.random() * 10) },
      { day: 'T4', occupancy: Math.max(0, metrics.occupancyToday - 5 + Math.random() * 10) },
      { day: 'T5', occupancy: Math.max(0, metrics.occupancyToday + Math.random() * 5) },
      { day: 'T6', occupancy: Math.max(0, metrics.occupancyToday + 5 + Math.random() * 10) },
      { day: 'T7', occupancy: Math.max(0, metrics.occupancyToday + 10 + Math.random() * 15) },
      { day: 'CN', occupancy: Math.max(0, metrics.occupancyToday + 15 + Math.random() * 20) },
    ];

    // Activity comparison data
    const activityData = [
      { 
        activity: t('checkInsToday'), 
        count: metrics.checkInsToday,
        color: '#52c41a'
      },
      { 
        activity: t('checkOutsToday'), 
        count: metrics.checkOutsToday,
        color: '#1890ff'
      },
    ];

    return {
      roomStatusData,
      revenueData,
      weeklyTrend,
      activityData,
    };
  }, [metrics, t, formatCurrency]);

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

  // Simple view component (original layout)
  const SimpleView = () => (
    <div>
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
              suffix="VND"
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value as number)}
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
              suffix="VND"
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value as number)}
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

  // Chart view component
  const ChartView = () => (
    <div>
      {/* Key Metrics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card data-tour="occupancy-card">
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
          <Card data-tour="revenue-card">
            <Statistic
              title={t('revenueToday')}
              value={metrics.revenueToday}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="VND"
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value as number)}
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
              suffix="VND"
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value as number)}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Room Status Pie Chart */}
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <PieChartOutlined />
              {t('roomStatus')}
            </Space>
          }>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData?.roomStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData?.roomStatusData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Revenue Comparison Bar Chart */}
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <BarChartOutlined />
              {t('revenueComparison')}
            </Space>
          }>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number) + ' VND', 'Doanh thu']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Bar dataKey="value" fill="#1890ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Weekly Occupancy Trend */}
        <Col xs={24} lg={8}>
          <Card title={
            <Space>
              <LineChartOutlined />
              Xu hướng công suất tuần
            </Space>
          }>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData?.weeklyTrend}>
                  <defs>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Công suất']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#1890ff" 
                    fillOpacity={1} 
                    fill="url(#colorOccupancy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Activity Comparison */}
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <BarChartOutlined />
              {t('todayActivity')}
            </Space>
          }>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData?.activityData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="activity" 
                    tick={{ fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Số lượng']}
                    labelStyle={{ color: '#666' }}
                  />
                  <Bar dataKey="count" fill="#52c41a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Occupancy Gauge Alternative */}
        <Col xs={24} lg={12}>
          <Card title={
            <Space>
              <PieChartOutlined />
              {t('occupancyToday')}
            </Space>
          }>
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: `conic-gradient(${metrics.occupancyToday > 80 ? '#52c41a' : metrics.occupancyToday > 60 ? '#faad14' : '#ff4d4f'} ${metrics.occupancyToday * 3.6}deg, #f0f0f0 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: metrics.occupancyToday > 80 ? '#52c41a' : metrics.occupancyToday > 60 ? '#faad14' : '#ff4d4f'
                  }}>
                    {metrics.occupancyToday.toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                  {metrics.occupiedRooms}/{metrics.totalRooms} phòng
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  {metrics.occupancyToday > 80 ? 'Cao' : metrics.occupancyToday > 60 ? 'Trung bình' : 'Thấp'}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Activity Row */}
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
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '8px' : '24px' }}>
      {translationLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="Loading translations..." />
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <Title level={2} style={{ margin: 0 }} data-tour="dashboard-title">{t('title')}</Title>
            <Space wrap>
              <Space data-tour="view-toggle">
                <span>{t('simpleView')}</span>
                <Switch
                  checked={!isSimpleView}
                  onChange={(checked) => setIsSimpleView(!checked)}
                  checkedChildren={<BarChartOutlined />}
                  unCheckedChildren={<AppstoreOutlined />}
                />
                <span>{t('chartView')}</span>
              </Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={refresh}
                type="default"
              >
                {t('refresh')}
              </Button>
            </Space>
          </div>

          {/* Content */}
          {isSimpleView ? <SimpleView /> : <ChartView />}
        </>
      )}
    </div>
  );
}
