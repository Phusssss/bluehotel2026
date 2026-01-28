import { useState } from 'react';
import { Card, Button, Alert, Space, Typography, Divider } from 'antd';
import { DatabaseOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { seedReservationData } from '../utils/seedData';

const { Title, Paragraph, Text } = Typography;

export function SeedDataPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    roomTypes: string[];
    rooms: string[];
    customers: string[];
  } | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setResults(null);

    try {
      const data = await seedReservationData();
      setResults(data);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error seeding data:', err);
      setError(err.message || 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <DatabaseOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={2}>Seed Sample Data</Title>
            <Paragraph>
              Tạo dữ liệu mẫu để test chức năng đặt phòng cho hotel ID: <Text code>hqjikjkTipom9MMBFlxB</Text>
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={4}>Dữ liệu sẽ được tạo:</Title>
            <ul>
              <li>
                <strong>3 Room Types</strong> (Loại phòng):
                <ul>
                  <li>Standard Room - 500,000 VND/đêm, 2 người</li>
                  <li>Deluxe Room - 800,000 VND/đêm (cuối tuần 900k-950k), 3 người</li>
                  <li>Suite Room - 1,500,000 VND/đêm (cuối tuần 1.8M-2M), 4 người</li>
                </ul>
              </li>
              <li>
                <strong>20 Rooms</strong> (Phòng cụ thể):
                <ul>
                  <li>Tầng 1: 101-105 (Standard)</li>
                  <li>Tầng 2: 201-203 (Standard), 204-206 (Deluxe)</li>
                  <li>Tầng 3: 301-304 (Deluxe), 305-306 (Suite)</li>
                  <li>Tầng 4: 401-403 (Suite)</li>
                </ul>
              </li>
              <li>
                <strong>8 Customers</strong> (Khách hàng):
                <ul>
                  <li>6 khách Việt Nam</li>
                  <li>2 khách quốc tế (USA, Spain)</li>
                </ul>
              </li>
            </ul>
          </div>

          <Alert
            message="Lưu ý"
            description="Bạn cần đăng nhập và có quyền truy cập hotel hqjikjkTipom9MMBFlxB để tạo dữ liệu. Kiểm tra console để xem chi tiết quá trình tạo dữ liệu."
            type="info"
            showIcon
          />

          <Button
            type="primary"
            size="large"
            icon={<DatabaseOutlined />}
            loading={loading}
            onClick={handleSeedData}
            block
          >
            {loading ? 'Đang tạo dữ liệu...' : 'Tạo dữ liệu mẫu'}
          </Button>

          {success && results && (
            <Alert
              message="Thành công!"
              description={
                <div>
                  <p>Đã tạo xong dữ liệu mẫu:</p>
                  <ul>
                    <li>{results.roomTypes.length} Room Types</li>
                    <li>{results.rooms.length} Rooms</li>
                    <li>{results.customers.length} Customers</li>
                  </ul>
                  <p>Bây giờ bạn có thể vào trang Reservations để test chức năng đặt phòng!</p>
                </div>
              }
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          {error && (
            <Alert
              message="Lỗi!"
              description={
                <div>
                  <p>{error}</p>
                  <p>
                    <strong>Có thể do:</strong>
                  </p>
                  <ul>
                    <li>Bạn chưa đăng nhập</li>
                    <li>Không có quyền truy cập hotel này</li>
                    <li>Firestore rules chặn quyền ghi</li>
                  </ul>
                  <p>Kiểm tra console để xem chi tiết lỗi.</p>
                </div>
              }
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
