import { useState } from 'react';
import { Modal, Typography, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { roomService } from '../../../services/roomService';
import type { Room } from '../../../types';

const { Text } = Typography;

interface DeleteRoomModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  room: Room | null;
}

export function DeleteRoomModal({
  visible,
  onCancel,
  onSuccess,
  room,
}: DeleteRoomModalProps) {
  const { t } = useTranslation('rooms');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!room) {
      message.error(t('crud.errors.noRoom'));
      return;
    }

    setLoading(true);
    try {
      await roomService.deleteRoom(room.id);
      message.success(t('crud.messages.deleteSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error deleting room:', error);
      if (error instanceof Error) {
        if (error.message === 'Cannot delete room with active reservations') {
          message.error(t('crud.errors.hasActiveReservations'));
        } else if (error.message === 'Room not found') {
          message.error(t('crud.errors.roomNotFound'));
        } else {
          message.error(t('crud.messages.deleteError'));
        }
      } else {
        message.error(t('crud.messages.deleteError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          {t('crud.modal.deleteTitle')}
        </span>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleDelete}
      okText={t('crud.modal.deleteConfirm')}
      cancelText={t('crud.form.cancel')}
      okButtonProps={{ danger: true, loading }}
      width={500}
    >
      <div style={{ marginTop: '16px' }}>
        <Text>
          {t('crud.modal.deleteMessage', { roomNumber: room?.roomNumber })}
        </Text>
        <br />
        <br />
        <Text type="warning">
          {t('crud.modal.deleteWarning')}
        </Text>
      </div>
    </Modal>
  );
}