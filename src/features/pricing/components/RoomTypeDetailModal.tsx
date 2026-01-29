import { Modal, Descriptions, Tag, Space, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import type { RoomType } from '../../../types';

/**
 * Props for RoomTypeDetailModal component
 */
interface RoomTypeDetailModalProps {
  /** Room type to display details for */
  roomType: RoomType | null;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * RoomTypeDetailModal component - displays detailed information about a room type
 * Shows base price, capacity, amenities, weekday pricing, and seasonal pricing
 */
export function RoomTypeDetailModal({
  roomType,
  visible,
  onClose,
}: RoomTypeDetailModalProps) {
  const { t } = useTranslation('pricing');
  const { i18n } = useTranslation();

  if (!roomType) return null;

  /**
   * Format price with Vietnamese locale
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  /**
   * Get description in current language with fallback
   */
  const getDescription = () => {
    return roomType.description?.[i18n.language] || roomType.description?.en || roomType.description?.vi || '';
  };

  /**
   * Weekday names mapping for translation
   */
  const weekdayNames = {
    monday: t('weekdays.monday'),
    tuesday: t('weekdays.tuesday'),
    wednesday: t('weekdays.wednesday'),
    thursday: t('weekdays.thursday'),
    friday: t('weekdays.friday'),
    saturday: t('weekdays.saturday'),
    sunday: t('weekdays.sunday'),
  };

  return (
    <Modal
      title={roomType.name}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="90%"
      style={{ maxWidth: 700, top: 20 }}
    >
      {/* Basic Information */}
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label={t('details.name')}>
          {roomType.name}
        </Descriptions.Item>

        <Descriptions.Item label={t('details.description')}>
          {getDescription()}
        </Descriptions.Item>

        <Descriptions.Item label={t('details.basePrice')}>
          <strong style={{ fontSize: '16px', color: '#1890ff' }}>
            {formatPrice(roomType.basePrice)} VND
          </strong>
        </Descriptions.Item>

        <Descriptions.Item label={t('details.capacity')}>
          {roomType.capacity} {roomType.capacity === 1 ? 'guest' : 'guests'}
        </Descriptions.Item>

        <Descriptions.Item label={t('details.amenities')}>
          <Space wrap>
            {roomType.amenities.map((amenity, index) => (
              <Tag key={index} color="blue">
                {amenity}
              </Tag>
            ))}
          </Space>
        </Descriptions.Item>
      </Descriptions>

      {/* Weekday Pricing Section */}
      {roomType.weekdayPricing && Object.keys(roomType.weekdayPricing).length > 0 && (
        <>
          <Divider orientation="left">{t('details.weekdayPricing')}</Divider>
          <Descriptions column={2} bordered size="small">
            {Object.entries(roomType.weekdayPricing).map(([day, price]) => (
              price !== undefined && (
                <Descriptions.Item 
                  key={day} 
                  label={weekdayNames[day as keyof typeof weekdayNames]}
                >
                  {formatPrice(price)} VND
                </Descriptions.Item>
              )
            ))}
          </Descriptions>
        </>
      )}

      {/* Seasonal Pricing Section */}
      {roomType.seasonalPricing && roomType.seasonalPricing.length > 0 && (
        <>
          <Divider orientation="left">{t('details.seasonalPricing')}</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            {roomType.seasonalPricing.map((season, index) => (
              <Descriptions key={index} column={1} bordered size="small">
                <Descriptions.Item label={t('details.period')}>
                  {season.startDate} → {season.endDate}
                </Descriptions.Item>
                <Descriptions.Item label={t('details.price')}>
                  <strong style={{ color: '#52c41a' }}>
                    {formatPrice(season.price)} VND
                  </strong>
                </Descriptions.Item>
              </Descriptions>
            ))}
          </Space>
        </>
      )}
    </Modal>
  );
}
