import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  message,
  Modal,
  Row,
  Col,
  Space,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { roomService } from '../../../services/roomService';
import { useValidationRules } from '../../../utils/validation';
import type { Room, RoomType } from '../../../types';

const { Option } = Select;
const { TextArea } = Input;

interface EditRoomFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  room: Room | null;
  roomTypes: RoomType[];
}

interface RoomFormValues {
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  notes?: string;
}

export function EditRoomForm({
  visible,
  onCancel,
  onSuccess,
  room,
  roomTypes,
}: EditRoomFormProps) {
  const [form] = Form.useForm<RoomFormValues>();
  const { t } = useTranslation('rooms');
  const validation = useValidationRules(t);
  const [loading, setLoading] = useState(false);

  // Populate form when room changes
  useEffect(() => {
    if (room && visible) {
      form.setFieldsValue({
        roomNumber: room.roomNumber,
        roomTypeId: room.roomTypeId,
        floor: room.floor,
        notes: room.notes || '',
      });
    }
  }, [room, visible, form]);

  const handleSubmit = async (values: RoomFormValues) => {
    if (!room) {
      message.error(t('crud.errors.noRoom'));
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<Room> = {
        roomNumber: values.roomNumber.trim(),
        roomTypeId: values.roomTypeId,
        floor: values.floor,
        notes: values.notes?.trim(),
      };

      await roomService.updateRoom(room.id, updateData);
      message.success(t('crud.messages.updateSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error updating room:', error);
      if (error instanceof Error) {
        if (error.message === 'Room number already exists') {
          message.error(t('crud.errors.roomNumberExists'));
        } else if (error.message === 'Room not found') {
          message.error(t('crud.errors.roomNotFound'));
        } else {
          message.error(t('crud.messages.updateError'));
        }
      } else {
        message.error(t('crud.messages.updateError'));
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
      title={t('crud.modal.editTitle')}
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
              {t('crud.form.update')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}