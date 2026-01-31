import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Modal,
  Row,
  Col,
  Space,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { useHotel } from '../../../contexts/HotelContext';
import { roomService } from '../../../services/roomService';
import { useValidationRules } from '../../../utils/validation';
import { useNotifications } from '../../../hooks/useNotifications';
import type { CreateRoomInput, RoomType } from '../../../types';

const { Option } = Select;
const { TextArea } = Input;

interface CreateRoomFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  roomTypes: RoomType[];
}

interface RoomFormValues {
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  notes?: string;
}

export function CreateRoomForm({
  visible,
  onCancel,
  onSuccess,
  roomTypes,
}: CreateRoomFormProps) {
  const [form] = Form.useForm<RoomFormValues>();
  const { t } = useTranslation('rooms');
  const { currentHotel } = useHotel();
  const validation = useValidationRules(t);
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: RoomFormValues) => {
    if (!currentHotel) {
      notifications.hotel.noSelection();
      return;
    }

    setLoading(true);
    try {
      const roomData: CreateRoomInput = {
        hotelId: currentHotel.id,
        roomNumber: values.roomNumber.trim(),
        roomTypeId: values.roomTypeId,
        floor: values.floor,
        status: 'vacant',
        notes: values.notes?.trim(),
      };

      await roomService.createRoom(roomData);
      notifications.crud.createSuccess(t('entities.room'));
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Error creating room:', error);
      if (error instanceof Error) {
        if (error.message === 'Room number already exists') {
          notifications.notifyError('crud.errors.roomNumberExists');
        } else {
          notifications.crud.createError(t('entities.room'));
        }
      } else {
        notifications.crud.createError(t('entities.room'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={t('crud.modal.createTitle')}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: '24px' }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="roomNumber"
              label={t('crud.form.roomNumber')}
              rules={[
                validation.requiredTrim(),
                validation.maxLength(20),
                validation.roomNumber(),
              ]}
            >
              <Input
                placeholder={t('crud.form.roomNumberPlaceholder')}
                maxLength={20}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="roomTypeId"
              label={t('crud.form.roomType')}
              rules={[validation.required()]}
            >
              <Select placeholder={t('crud.form.roomTypePlaceholder')}>
                {roomTypes.map((roomType) => (
                  <Option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="floor"
              label={t('crud.form.floor')}
              rules={[
                validation.required(),
                validation.numberRange(-5, 100),
              ]}
            >
              <InputNumber
                placeholder={t('crud.form.floorPlaceholder')}
                style={{ width: '100%' }}
                min={-5}
                max={100}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label={t('crud.form.notes')}
          rules={[validation.maxLength(500)]}
        >
          <TextArea
            placeholder={t('crud.form.notesPlaceholder')}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>
              {t('crud.form.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('crud.form.create')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}