import { Modal, Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Reservation } from '../../../types';
import dayjs from 'dayjs';

interface ReservationDetailsModalProps {
  reservation: Reservation | null;
  open: boolean;
  onClose: () => void;
}

const getStatusColor = (status: Reservation['status']) => {
  const colors: Record<Reservation['status'], string> = {
    pending: 'orange',
    confirmed: 'blue',
    'checked-in': 'green',
    'checked-out': 'default',
    cancelled: 'red',
    'no-show': 'red',
  };
  return colors[status];
};

export function ReservationDetailsModal({
  reservation,
  open,
  onClose,
}: ReservationDetailsModalProps) {
  const { t } = useTranslation('reservations');

  if (!reservation) return null;

  const balance = reservation.totalPrice - reservation.paidAmount;

  return (
    <Modal
      title={t('modal.title')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label={t('modal.confirmationNumber')} span={2}>
          <strong>{reservation.confirmationNumber}</strong>
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.status')}>
          <Tag color={getStatusColor(reservation.status)}>
            {t(`status.${reservation.status}`)}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.source')}>
          {t(`source.${reservation.source}`)}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.checkInDate')}>
          {dayjs(reservation.checkInDate).format('YYYY-MM-DD')}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.checkOutDate')}>
          {dayjs(reservation.checkOutDate).format('YYYY-MM-DD')}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.numberOfGuests')}>
          {reservation.numberOfGuests}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.totalPrice')}>
          {reservation.totalPrice.toLocaleString()}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.paidAmount')}>
          {reservation.paidAmount.toLocaleString()}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.balance')}>
          <strong style={{ color: balance > 0 ? '#ff4d4f' : '#52c41a' }}>
            {balance.toLocaleString()}
          </strong>
        </Descriptions.Item>

        {reservation.notes && (
          <Descriptions.Item label={t('modal.notes')} span={2}>
            {reservation.notes}
          </Descriptions.Item>
        )}

        <Descriptions.Item label={t('modal.createdAt')}>
          {reservation.createdAt && typeof reservation.createdAt === 'object' && 'toDate' in reservation.createdAt
            ? dayjs(reservation.createdAt.toDate()).format('YYYY-MM-DD HH:mm')
            : dayjs(reservation.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>

        <Descriptions.Item label={t('modal.updatedAt')}>
          {reservation.updatedAt && typeof reservation.updatedAt === 'object' && 'toDate' in reservation.updatedAt
            ? dayjs(reservation.updatedAt.toDate()).format('YYYY-MM-DD HH:mm')
            : dayjs(reservation.updatedAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>

        {reservation.checkedInAt && (
          <Descriptions.Item label={t('modal.checkedInAt')} span={2}>
            {typeof reservation.checkedInAt === 'object' && 'toDate' in reservation.checkedInAt
              ? dayjs(reservation.checkedInAt.toDate()).format('YYYY-MM-DD HH:mm')
              : dayjs(reservation.checkedInAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        )}

        {reservation.checkedOutAt && (
          <Descriptions.Item label={t('modal.checkedOutAt')} span={2}>
            {typeof reservation.checkedOutAt === 'object' && 'toDate' in reservation.checkedOutAt
              ? dayjs(reservation.checkedOutAt.toDate()).format('YYYY-MM-DD HH:mm')
              : dayjs(reservation.checkedOutAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
}
