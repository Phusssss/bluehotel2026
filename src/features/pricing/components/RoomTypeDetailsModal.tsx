import { Modal, Space, Button, Typography, Descriptions, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { RoomType } from '../../../types';

const { Title } = Typography;

interface RoomTypeDetailsModalProps {
  roomType: RoomType | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (roomType: RoomType) => void;
  onDelete: (roomType: RoomType) => void;
  isMobile: boolean;
  formatPrice: (price: number) => string;
}

export function RoomTypeDetailsModal({
  roomType,
  visible,
  onClose,
  onEdit,
  onDelete,
  isMobile,
  formatPrice,
}: RoomTypeDetailsModalProps) {
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  return (
    <Modal
      title={t('roomTypes.details')}
      open={visible}
      onCancel={onClose}
      width="95%"
      style={{ maxWidth: 800, top: 20 }}
      footer={
        roomType && (
          <Space>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                onClose();
                onEdit(roomType);
              }}
            >
              {tCommon('buttons.edit')}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                onClose();
                onDelete(roomType);
              }}
            >
              {tCommon('buttons.delete')}
            </Button>
            <Button onClick={onClose}>
              {tCommon('buttons.cancel')}
            </Button>
          </Space>
        )
      }
    >
      {roomType && (
        <div>
          <Title level={4}>{t('details.name')}</Title>
          <Descriptions bordered column={isMobile ? 1 : 2}>
            <Descriptions.Item label={t('details.name')}>
              <strong>{roomType.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label={t('details.basePrice')}>
              {formatPrice(roomType.basePrice)} VND
            </Descriptions.Item>
            <Descriptions.Item label={t('details.capacity')}>
              {roomType.capacity} {roomType.capacity === 1 ? 'guest' : 'guests'}
            </Descriptions.Item>
            <Descriptions.Item label={t('details.amenities')} span={isMobile ? 1 : 2}>
              <Space wrap>
                {roomType.amenities.map((amenity, index) => (
                  <Tag key={index}>{amenity}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('details.description')} span={2}>
              {roomType.description?.en || roomType.description?.vi || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* Weekday Pricing */}
          {roomType.weekdayPricing && Object.keys(roomType.weekdayPricing).length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>{t('details.weekdayPricing')}</Title>
              <Descriptions bordered column={isMobile ? 1 : 2} size="small">
                {Object.entries(roomType.weekdayPricing).map(([day, price]) => (
                  <Descriptions.Item key={day} label={t(`weekdays.${day}`)}>
                    {formatPrice(price)} VND
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>
          )}

          {/* Seasonal Pricing */}
          {roomType.seasonalPricing && roomType.seasonalPricing.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <Title level={5}>{t('details.seasonalPricing')}</Title>
              <Descriptions bordered column={1} size="small">
                {roomType.seasonalPricing.map((season, index) => (
                  <Descriptions.Item 
                    key={index} 
                    label={`${season.startDate} - ${season.endDate}`}
                  >
                    {formatPrice(season.price)} VND
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}