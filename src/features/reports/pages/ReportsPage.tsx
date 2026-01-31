import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  DatePicker,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  message,
  Typography,
  Space,
  Divider,
  Tabs,
} from 'antd';
import { BarChartOutlined, DownloadOutlined, DollarOutlined, CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs, { type Dayjs } from 'dayjs';
import { useReports } from '../hooks/useReports';
import { useHotel } from '../../../contexts/HotelContext';
import { PDFExportService } from '../../../utils/pdfExport';
import type { OccupancyReportData, RevenueReportData, ReservationReportData } from '../../../services/reportService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * ReportsPage component - manages hotel reports and analytics
 * Displays occupancy, revenue, and reservation reports with export functionality
 * Supports responsive design for mobile, tablet, and desktop
 */
export function ReportsPage() {
  const { t } = useTranslation('reports');
  const { currentHotel } = useHotel();
  const { generateOccupancyReport, getOccupancySummary, generateRevenueReport, generateReservationReport, loading } = useReports();
  const [occupancyForm] = Form.useForm();
  const [revenueForm] = Form.useForm();
  const [reservationForm] = Form.useForm();
  const [reportData, setReportData] = useState<OccupancyReportData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null);
  const [reservationData, setReservationData] = useState<ReservationReportData | null>(null);
  const [summary, setSummary] = useState<{
    averageOccupancy: number;
    maxOccupancy: number;
    minOccupancy: number;
    totalDays: number;
  } | null>(null);
  const [currentDateRange, setCurrentDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Refresh all reports data
   */
  const refreshReports = () => {
    // Clear all data to force refresh
    setReportData([]);
    setRevenueData(null);
    setReservationData(null);
    setSummary(null);
    setCurrentDateRange(null);
  };

  /**
   * Handle form submission to generate occupancy report
   */
  const handleGenerateOccupancyReport = async (values: { dateRange: [Dayjs, Dayjs] }) => {
    try {
      const [startDate, endDate] = values.dateRange;
      const filters = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };

      // Store current date range for PDF export
      setCurrentDateRange(filters);

      // Generate report data and summary in parallel
      const [data, summaryData] = await Promise.all([
        generateOccupancyReport(filters),
        getOccupancySummary(filters),
      ]);

      setReportData(data);
      setSummary(summaryData);
      message.success(t('occupancy.success'));
    } catch (error) {
      console.error('Error generating occupancy report:', error);
      message.error(t('occupancy.error'));
    }
  };

  /**
   * Handle form submission to generate revenue report
   */
  const handleGenerateRevenueReport = async (values: { dateRange: [Dayjs, Dayjs] }) => {
    try {
      const [startDate, endDate] = values.dateRange;
      const filters = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };

      // Store current date range for PDF export
      setCurrentDateRange(filters);

      const data = await generateRevenueReport(filters);
      setRevenueData(data);
      message.success(t('revenue.success'));
    } catch (error) {
      console.error('Error generating revenue report:', error);
      message.error(t('revenue.error'));
    }
  };

  /**
   * Handle form submission to generate reservation report
   */
  const handleGenerateReservationReport = async (values: { dateRange: [Dayjs, Dayjs] }) => {
    try {
      const [startDate, endDate] = values.dateRange;
      const filters = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };

      // Store current date range for PDF export
      setCurrentDateRange(filters);

      const data = await generateReservationReport(filters);
      setReservationData(data);
      message.success(t('reservation.success'));
    } catch (error) {
      console.error('Error generating reservation report:', error);
      message.error(t('reservation.error'));
    }
  };

  /**
   * Export occupancy report data to CSV
   */
  const exportOccupancyToCSV = () => {
    if (reportData.length === 0) {
      message.warning(t('occupancy.noData'));
      return;
    }

    const headers = [
      t('occupancy.table.date'),
      t('occupancy.table.totalRooms'),
      t('occupancy.table.occupiedRooms'),
      t('occupancy.table.occupancyPercentage'),
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.date,
        row.totalRooms,
        row.occupiedRooms,
        `${row.occupancyPercentage}%`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `occupancy-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export revenue report data to CSV
   */
  const exportRevenueToCSV = () => {
    if (!revenueData) {
      message.warning(t('revenue.noData'));
      return;
    }

    const headers = [
      'Category',
      'Item',
      'Revenue',
      'Count',
    ];

    const csvContent = [
      headers.join(','),
      // Summary data
      'Summary,Total Revenue,' + revenueData.totalRevenue + ',',
      'Summary,Room Revenue,' + revenueData.roomRevenue + ',',
      'Summary,Service Revenue,' + revenueData.serviceRevenue + ',',
      '',
      // Room type data
      'Room Types,Room Type,Revenue,Reservations',
      ...revenueData.revenueByRoomType.map(row => [
        'Room Types',
        row.roomTypeName,
        row.revenue,
        row.reservationCount,
      ].join(',')),
      '',
      // Service data
      'Services,Service,Revenue,Orders',
      ...revenueData.revenueByService.map(row => [
        'Services',
        row.serviceName,
        row.revenue,
        row.orderCount,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `revenue-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export occupancy report data to PDF
   */
  const exportOccupancyToPDF = () => {
    if (reportData.length === 0 || !currentHotel || !currentDateRange) {
      message.warning(t('occupancy.noData'));
      return;
    }

    try {
      PDFExportService.exportOccupancyToPDF(
        reportData,
        summary,
        currentHotel.name,
        currentDateRange,
        t
      );
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF');
    }
  };

  /**
   * Export revenue report data to PDF
   */
  const exportRevenueToPDF = () => {
    if (!revenueData || !currentHotel || !currentDateRange) {
      message.warning(t('revenue.noData'));
      return;
    }

    try {
      PDFExportService.exportRevenueToPDF(
        revenueData,
        currentHotel.name,
        currentDateRange,
        t
      );
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF');
    }
  };

  /**
   * Export reservation report data to PDF
   */
  const exportReservationToPDF = () => {
    if (!reservationData || !currentHotel || !currentDateRange) {
      message.warning(t('reservation.noData'));
      return;
    }

    try {
      PDFExportService.exportReservationToPDF(
        reservationData,
        currentHotel.name,
        currentDateRange,
        t
      );
      message.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Failed to export PDF');
    }
  };

  /**
   * Export reservation report data to CSV
   */
  const exportReservationToCSV = () => {
    if (!reservationData) {
      message.warning(t('reservation.noData'));
      return;
    }

    const headers = [
      'Category',
      'Item',
      'Count',
      'Percentage',
    ];

    const csvContent = [
      headers.join(','),
      // Summary data
      'Summary,Total Bookings,' + reservationData.summary.totalBookings + ',',
      'Summary,Total Cancellations,' + reservationData.summary.totalCancellations + ',',
      'Summary,Total No-Shows,' + reservationData.summary.totalNoShows + ',',
      'Summary,Cancellation Rate,' + reservationData.summary.cancellationRate + '%,',
      'Summary,No-Show Rate,' + reservationData.summary.noShowRate + '%,',
      '',
      // Bookings by source
      'Bookings by Source,Source,Count,Percentage',
      ...reservationData.bookingsBySource.map(row => [
        'Bookings by Source',
        row.source,
        row.count,
        row.percentage + '%',
      ].join(',')),
      '',
      // Cancellations and no-shows by date
      'Cancellations by Date,Date,Cancelled,No-Shows,Total',
      ...reservationData.cancellationsAndNoShows.map(row => [
        'Cancellations by Date',
        row.date,
        row.cancelled,
        row.noShows,
        row.total,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservation-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Table columns configuration for occupancy report
   */
  const occupancyColumns = [
    {
      title: t('occupancy.table.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: t('occupancy.table.totalRooms'),
      dataIndex: 'totalRooms',
      key: 'totalRooms',
      align: 'center' as const,
    },
    {
      title: t('occupancy.table.occupiedRooms'),
      dataIndex: 'occupiedRooms',
      key: 'occupiedRooms',
      align: 'center' as const,
    },
    {
      title: t('occupancy.table.occupancyPercentage'),
      dataIndex: 'occupancyPercentage',
      key: 'occupancyPercentage',
      align: 'center' as const,
      render: (percentage: number) => `${percentage}%`,
      sorter: (a: OccupancyReportData, b: OccupancyReportData) => a.occupancyPercentage - b.occupancyPercentage,
    },
  ];

  /**
   * Table columns configuration for room type revenue
   */
  const roomTypeRevenueColumns = [
    {
      title: t('revenue.roomTypes.table.roomType'),
      dataIndex: 'roomTypeName',
      key: 'roomTypeName',
    },
    {
      title: t('revenue.roomTypes.table.revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (revenue: number) => `$${revenue.toLocaleString()}`,
      sorter: (a: any, b: any) => a.revenue - b.revenue,
    },
    {
      title: t('revenue.roomTypes.table.reservations'),
      dataIndex: 'reservationCount',
      key: 'reservationCount',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.reservationCount - b.reservationCount,
    },
  ];

  /**
   * Table columns configuration for service revenue
   */
  const serviceRevenueColumns = [
    {
      title: t('revenue.services.table.service'),
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: t('revenue.services.table.revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      render: (revenue: number) => `$${revenue.toLocaleString()}`,
      sorter: (a: any, b: any) => a.revenue - b.revenue,
    },
    {
      title: t('revenue.services.table.orders'),
      dataIndex: 'orderCount',
      key: 'orderCount',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.orderCount - b.orderCount,
    },
  ];

  /**
   * Table columns configuration for bookings by source
   */
  const bookingsBySourceColumns = [
    {
      title: t('reservation.bookingsBySource.table.source'),
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: t('reservation.bookingsBySource.table.count'),
      dataIndex: 'count',
      key: 'count',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.count - b.count,
    },
    {
      title: t('reservation.bookingsBySource.table.percentage'),
      dataIndex: 'percentage',
      key: 'percentage',
      align: 'center' as const,
      render: (percentage: number) => `${percentage}%`,
      sorter: (a: any, b: any) => a.percentage - b.percentage,
    },
  ];

  /**
   * Table columns configuration for cancellations and no-shows
   */
  const cancellationsAndNoShowsColumns = [
    {
      title: t('reservation.cancellationsAndNoShows.table.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: any, b: any) => a.date.localeCompare(b.date),
    },
    {
      title: t('reservation.cancellationsAndNoShows.table.cancelled'),
      dataIndex: 'cancelled',
      key: 'cancelled',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.cancelled - b.cancelled,
    },
    {
      title: t('reservation.cancellationsAndNoShows.table.noShows'),
      dataIndex: 'noShows',
      key: 'noShows',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.noShows - b.noShows,
    },
    {
      title: t('reservation.cancellationsAndNoShows.table.total'),
      dataIndex: 'total',
      key: 'total',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.total - b.total,
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
        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
          <BarChartOutlined style={{ marginRight: '8px' }} />
          {t('title')}
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={refreshReports}
          loading={loading}
          size="middle"
        >
          {t('refresh', { ns: 'common' })}
        </Button>
      </div>

      {/* Reports Tabs */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
      }}>
        <Tabs 
          defaultActiveKey="occupancy"
          size={isMobile ? 'small' : 'middle'}
          items={[
            {
              key: 'occupancy',
              label: t('occupancy.title'),
              children: (
                <div style={{ padding: '24px' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('occupancy.description')}
                  </Text>

                  {/* Filters Form */}
                  <Form
                    form={occupancyForm}
                    layout={isMobile ? 'vertical' : 'inline'}
                    onFinish={handleGenerateOccupancyReport}
                    style={{ marginBottom: 24 }}
                  >
                    <Form.Item
                      name="dateRange"
                      label={t('occupancy.filters.startDate')}
                      rules={[{ required: true, message: 'Please select date range' }]}
                    >
                      <RangePicker
                        format="YYYY-MM-DD"
                        placeholder={[t('occupancy.filters.startDate'), t('occupancy.filters.endDate')]}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      >
                        {t('occupancy.filters.generate')}
                      </Button>
                    </Form.Item>
                  </Form>

                  {/* Summary Statistics */}
                  {summary && (
                    <>
                      <Title level={4}>{t('occupancy.summary.title')}</Title>
                      <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('occupancy.summary.averageOccupancy')}
                            value={summary.averageOccupancy}
                            suffix="%"
                            precision={2}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('occupancy.summary.maxOccupancy')}
                            value={summary.maxOccupancy}
                            suffix="%"
                            precision={2}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('occupancy.summary.minOccupancy')}
                            value={summary.minOccupancy}
                            suffix="%"
                            precision={2}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('occupancy.summary.totalDays')}
                            value={summary.totalDays}
                          />
                        </Col>
                      </Row>
                      <Divider />
                    </>
                  )}

                  {/* Export Actions */}
                  {reportData.length > 0 && (
                    <Space style={{ marginBottom: 16 }} wrap>
                      <Button icon={<DownloadOutlined />} onClick={exportOccupancyToCSV}>
                        {t('export.csv')}
                      </Button>
                      <Button icon={<DownloadOutlined />} onClick={exportOccupancyToPDF}>
                        {t('export.pdf')}
                      </Button>
                    </Space>
                  )}

                  {/* Report Table */}
                  <Table
                    columns={occupancyColumns}
                    dataSource={reportData}
                    rowKey="date"
                    loading={loading}
                    scroll={{ x: 600 }}
                    locale={{
                      emptyText: t('occupancy.noData'),
                    }}
                    pagination={{
                      pageSize: isMobile ? 5 : 10,
                      showSizeChanger: !isMobile,
                      showQuickJumper: !isMobile,
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} / ${total}`,
                      responsive: true,
                      size: isMobile ? 'small' : 'default',
                    }}
                    size={isMobile ? 'small' : 'middle'}
                  />
                </div>
              ),
            },
            {
              key: 'revenue',
              label: t('revenue.title'),
              children: (
                <div style={{ padding: '24px' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('revenue.description')}
                  </Text>

                  {/* Filters Form */}
                  <Form
                    form={revenueForm}
                    layout={isMobile ? 'vertical' : 'inline'}
                    onFinish={handleGenerateRevenueReport}
                    style={{ marginBottom: 24 }}
                  >
                    <Form.Item
                      name="dateRange"
                      label={t('revenue.filters.startDate')}
                      rules={[{ required: true, message: 'Please select date range' }]}
                    >
                      <RangePicker
                        format="YYYY-MM-DD"
                        placeholder={[t('revenue.filters.startDate'), t('revenue.filters.endDate')]}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading} 
                        icon={<DollarOutlined />}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      >
                        {t('revenue.filters.generate')}
                      </Button>
                    </Form.Item>
                  </Form>

                  {/* Revenue Summary */}
                  {revenueData && (
                    <>
                      <Title level={4}>{t('revenue.summary.title')}</Title>
                      <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title={t('revenue.summary.totalRevenue')}
                            value={revenueData.totalRevenue}
                            prefix="$"
                            precision={2}
                          />
                        </Col>
                        <Col xs={12} sm={8}>
                          <Statistic
                            title={t('revenue.summary.roomRevenue')}
                            value={revenueData.roomRevenue}
                            prefix="$"
                            precision={2}
                          />
                        </Col>
                        <Col xs={12} sm={8}>
                          <Statistic
                            title={t('revenue.summary.serviceRevenue')}
                            value={revenueData.serviceRevenue}
                            prefix="$"
                            precision={2}
                          />
                        </Col>
                      </Row>
                      <Divider />

                      {/* Export Actions */}
                      <Space style={{ marginBottom: 16 }} wrap>
                        <Button icon={<DownloadOutlined />} onClick={exportRevenueToCSV}>
                          {t('export.csv')}
                        </Button>
                        <Button icon={<DownloadOutlined />} onClick={exportRevenueToPDF}>
                          {t('export.pdf')}
                        </Button>
                      </Space>

                      {/* Revenue by Room Type */}
                      <Title level={4}>{t('revenue.roomTypes.title')}</Title>
                      <Table
                        columns={roomTypeRevenueColumns}
                        dataSource={revenueData.revenueByRoomType}
                        rowKey="roomTypeId"
                        loading={loading}
                        scroll={{ x: 400 }}
                        locale={{
                          emptyText: t('revenue.noData'),
                        }}
                        pagination={false}
                        style={{ marginBottom: 24 }}
                        size={isMobile ? 'small' : 'middle'}
                      />

                      {/* Revenue by Service */}
                      <Title level={4}>{t('revenue.services.title')}</Title>
                      <Table
                        columns={serviceRevenueColumns}
                        dataSource={revenueData.revenueByService}
                        rowKey="serviceId"
                        loading={loading}
                        scroll={{ x: 400 }}
                        locale={{
                          emptyText: t('revenue.noData'),
                        }}
                        pagination={false}
                        size={isMobile ? 'small' : 'middle'}
                      />
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'reservation',
              label: t('reservation.title'),
              children: (
                <div style={{ padding: '24px' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {t('reservation.description')}
                  </Text>

                  {/* Filters Form */}
                  <Form
                    form={reservationForm}
                    layout={isMobile ? 'vertical' : 'inline'}
                    onFinish={handleGenerateReservationReport}
                    style={{ marginBottom: 24 }}
                  >
                    <Form.Item
                      name="dateRange"
                      label={t('reservation.filters.startDate')}
                      rules={[{ required: true, message: 'Please select date range' }]}
                    >
                      <RangePicker
                        format="YYYY-MM-DD"
                        placeholder={[t('reservation.filters.startDate'), t('reservation.filters.endDate')]}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading} 
                        icon={<CalendarOutlined />}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      >
                        {t('reservation.filters.generate')}
                      </Button>
                    </Form.Item>
                  </Form>

                  {/* Reservation Summary */}
                  {reservationData && (
                    <>
                      <Title level={4}>{t('reservation.summary.title')}</Title>
                      <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('reservation.summary.totalBookings')}
                            value={reservationData.summary.totalBookings}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('reservation.summary.totalCancellations')}
                            value={reservationData.summary.totalCancellations}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('reservation.summary.totalNoShows')}
                            value={reservationData.summary.totalNoShows}
                          />
                        </Col>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('reservation.summary.cancellationRate')}
                            value={reservationData.summary.cancellationRate}
                            suffix="%"
                            precision={2}
                          />
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col xs={12} sm={6}>
                          <Statistic
                            title={t('reservation.summary.noShowRate')}
                            value={reservationData.summary.noShowRate}
                            suffix="%"
                            precision={2}
                          />
                        </Col>
                      </Row>
                      <Divider />

                      {/* Export Actions */}
                      <Space style={{ marginBottom: 16 }} wrap>
                        <Button icon={<DownloadOutlined />} onClick={exportReservationToCSV}>
                          {t('export.csv')}
                        </Button>
                        <Button icon={<DownloadOutlined />} onClick={exportReservationToPDF}>
                          {t('export.pdf')}
                        </Button>
                      </Space>

                      {/* Bookings by Source */}
                      <Title level={4}>{t('reservation.bookingsBySource.title')}</Title>
                      <Table
                        columns={bookingsBySourceColumns}
                        dataSource={reservationData.bookingsBySource}
                        rowKey="source"
                        loading={loading}
                        scroll={{ x: 400 }}
                        locale={{
                          emptyText: t('reservation.noData'),
                        }}
                        pagination={false}
                        style={{ marginBottom: 24 }}
                        size={isMobile ? 'small' : 'middle'}
                      />

                      {/* Cancellations and No-Shows */}
                      <Title level={4}>{t('reservation.cancellationsAndNoShows.title')}</Title>
                      <Table
                        columns={cancellationsAndNoShowsColumns}
                        dataSource={reservationData.cancellationsAndNoShows}
                        rowKey="date"
                        loading={loading}
                        scroll={{ x: 500 }}
                        locale={{
                          emptyText: t('reservation.noData'),
                        }}
                        pagination={{
                          pageSize: isMobile ? 5 : 10,
                          showSizeChanger: !isMobile,
                          showQuickJumper: !isMobile,
                          showTotal: (total, range) =>
                            `${range[0]}-${range[1]} / ${total}`,
                          responsive: true,
                          size: isMobile ? 'small' : 'default',
                        }}
                        size={isMobile ? 'small' : 'middle'}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}