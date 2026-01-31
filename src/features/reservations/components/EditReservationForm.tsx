import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  message,
  Space,
  Divider,
  Row,
  Col,
  Card,
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useHotel } from '../../../contexts/HotelContext';
import { customerService } from '../../../services/customerService';
import { roomTypeService } from '../../../services/roomTypeService';
import { reservationService } from '../../../services/reservationService';
import { roomService } from '../../../services/roomService';
import type { Customer, RoomType, Room, Reservation } from '../../../types';

const { TextArea } = Input;

interface ReservationFormValues {
  customerId: string;
  roomTypeId: string;
  roomId: string;
  checkInDate: Dayjs;
  checkOutDate: Dayjs;
  numberOfGuests: number;
  source: string;
  notes?: string;
}

interface EditReservationFormProps {
  reservation: Reservation;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditReservationForm({ reservation, onSuccess, onCancel }: EditReservationFormProps) {
  const [form] = Form.useForm<ReservationFormValues>();
  const { t } = useTranslation('reservations');
  const { currentHotel } = useHotel();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<{
    nights: number;
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);

  // Load customers and room types on mount
  useEffect(() => {
    if (currentHotel) {
      loadCustomers();
      loadRoomTypes();
    }
  }, [currentHotel]);

  // Initialize form with reservation data
  useEffect(() => {
    if (reservation && roomTypes.length > 0) {
      const roomType = roomTypes.find((rt) => rt.id === reservation.roomTypeId);
      setSelectedRoomType(roomType || null);
      
      form.setFieldsValue({
        customerId: reservation.customerId,
        roomTypeId: reservation.roomTypeId,
        roomId: reservation.roomId,
        checkInDate: dayjs(reservation.checkInDate),
        checkOutDate: dayjs(reservation.checkOutDate),
        numberOfGuests: reservation.numberOfGuests,
        source: reservation.source,
        notes: reservation.notes,
      });
      
      // Load available rooms for the current dates
      checkAvailability(
        dayjs(reservation.checkInDate),
        dayjs(reservation.checkOutDate),
        reservation.roomTypeId,
        reservation.roomId
      );
    }
  }, [reservation, roomTypes]);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const data = await customerService.getCustomers(currentHotel!.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      message.error(t('form.loadCustomersError'));
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadRoomTypes = async () => {
    try {
      setLoadingRoomTypes(true);
      const data = await roomTypeService.getRoomTypes(currentHotel!.id);
      setRoomTypes(data);
    } catch (error) {
      console.error('Error loading room types:', error);
      message.error(t('form.loadRoomTypesError'));
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const handleRoomTypeChange = (roomTypeId: string) => {
    const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
    setSelectedRoomType(roomType || null);
    
    // Reset room selection and available rooms
    form.setFieldValue('roomId', undefined);
    setAvailableRooms([]);
    setPriceBreakdown(null);
    
    // Check availability if dates are selected
    const checkInDate = form.getFieldValue('checkInDate');
    const checkOutDate = form.getFieldValue('checkOutDate');
    if (checkInDate && checkOutDate && roomTypeId) {
      checkAvailability(checkInDate, checkOutDate, roomTypeId);
    }
  };

  const handleDateChange = () => {
    const checkInDate = form.getFieldValue('checkInDate');
    const checkOutDate = form.getFieldValue('checkOutDate');
    const roomTypeId = form.getFieldValue('roomTypeId');
    const currentRoomId = form.getFieldValue('roomId');
    
    // Reset room selection
    form.setFieldValue('roomId', undefined);
    setAvailableRooms([]);
    setPriceBreakdown(null);
    
    if (checkInDate && checkOutDate && roomTypeId) {
      checkAvailability(checkInDate, checkOutDate, roomTypeId, currentRoomId);
    }
  };

  const checkAvailability = async (
    checkInDate: Dayjs,
    checkOutDate: Dayjs,
    roomTypeId: string,
    currentRoomId?: string
  ) => {
    setLoadingRooms(true);
    try {
      const checkInStr = checkInDate.format('YYYY-MM-DD');
      const checkOutStr = checkOutDate.format('YYYY-MM-DD');
      
      const rooms = await reservationService.getAvailableRooms(
        currentHotel!.id,
        checkInStr,
        checkOutStr,
        roomTypeId
      );
      
      // Include the current room in available rooms if it's not already there
      if (currentRoomId) {
        const currentRoomExists = rooms.some(r => r.id === currentRoomId);
        if (!currentRoomExists) {
          // Fetch the current room directly from roomService
          const currentRoom = await roomService.getRoomById(currentRoomId);
          if (currentRoom && currentRoom.roomTypeId === roomTypeId) {
            rooms.push(currentRoom);
          }
        }
      }
      
      setAvailableRooms(rooms);
      
      if (rooms.length === 0) {
        message.warning(t('form.noAvailableRooms'));
      }
      
      // Calculate price if room type is selected
      if (selectedRoomType) {
        const pricing = roomTypeService.calculateTotalPrice(
          selectedRoomType,
          checkInStr,
          checkOutStr,
          currentHotel!.taxRate
        );
        setPriceBreakdown(pricing);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      message.error(t('form.availabilityCheckError'));
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSubmit = async (values: ReservationFormValues) => {
    if (!currentHotel) {
      message.error(t('form.noHotelSelected'));
      return;
    }

    setLoading(true);
    try {
      const checkInStr = values.checkInDate.format('YYYY-MM-DD');
      const checkOutStr = values.checkOutDate.format('YYYY-MM-DD');
      
      // Calculate total price
      let totalPrice = reservation.totalPrice;
      if (selectedRoomType) {
        const pricing = roomTypeService.calculateTotalPrice(
          selectedRoomType,
          checkInStr,
          checkOutStr,
          currentHotel.taxRate
        );
        totalPrice = pricing.total;
      }
      
      await reservationService.updateReservation(reservation.id, {
        customerId: values.customerId,
        roomId: values.roomId,
        roomTypeId: values.roomTypeId,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        numberOfGuests: values.numberOfGuests,
        source: values.source as any,
        totalPrice,
        notes: values.notes,
      });
      
      message.success(t('form.updateSuccess'));
      onSuccess();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      message.error(error.message || t('form.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current: Dayjs) => {
    // Disable dates before today
    return current && current < dayjs().startOf('day');
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="customerId"
            label={t('form.customer')}
            rules={[{ required: true, message: t('form.customerRequired') }]}
          >
            <Select
              showSearch
              placeholder={t('form.customerPlaceholder')}
              loading={loadingCustomers}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={customers.map((customer) => ({
                label: `${customer.name} (${customer.email})`,
                value: customer.id,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="roomTypeId"
            label={t('form.roomType')}
            rules={[{ required: true, message: t('form.roomTypeRequired') }]}
          >
            <Select
              placeholder={t('form.roomTypePlaceholder')}
              loading={loadingRoomTypes}
              onChange={handleRoomTypeChange}
              options={roomTypes.map((roomType) => ({
                label: `${roomType.name} - ${roomType.basePrice.toLocaleString()} ${currentHotel?.currency}`,
                value: roomType.id,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="checkInDate"
            label={t('form.checkInDate')}
            rules={[{ required: true, message: t('form.checkInRequired') }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
              onChange={handleDateChange}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="checkOutDate"
            label={t('form.checkOutDate')}
            rules={[
              { required: true, message: t('form.checkOutRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const checkIn = getFieldValue('checkInDate');
                  if (!value || !checkIn || value.isAfter(checkIn)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('form.checkOutAfterCheckIn')));
                },
              }),
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
              onChange={handleDateChange}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="roomId"
            label={t('form.room')}
            rules={[{ required: true, message: t('form.roomRequired') }]}
          >
            <Select
              placeholder={t('form.roomPlaceholder')}
              loading={loadingRooms}
              disabled={availableRooms.length === 0}
              options={availableRooms.map((room) => ({
                label: `${t('form.roomNumber')} ${room.roomNumber} - ${t('form.floor')} ${room.floor}`,
                value: room.id,
              }))}
              notFoundContent={
                availableRooms.length === 0 ? t('form.noAvailableRooms') : null
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="numberOfGuests"
            label={t('form.numberOfGuests')}
            rules={[
              { required: true, message: t('form.numberOfGuestsRequired') },
              {
                type: 'number',
                min: 1,
                message: t('form.numberOfGuestsMin'),
              },
              () => ({
                validator(_, value) {
                  if (!selectedRoomType || !value) {
                    return Promise.resolve();
                  }
                  if (value <= selectedRoomType.capacity) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      t('form.numberOfGuestsMax', {
                        max: selectedRoomType.capacity,
                      })
                    )
                  );
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={selectedRoomType?.capacity}
              placeholder={t('form.numberOfGuestsPlaceholder')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="source"
            label={t('form.source')}
            rules={[{ required: true, message: t('form.sourceRequired') }]}
          >
            <Select
              placeholder={t('form.sourcePlaceholder')}
              options={[
                { label: t('source.direct'), value: 'direct' },
                { label: t('source.booking.com'), value: 'booking.com' },
                { label: t('source.airbnb'), value: 'airbnb' },
                { label: t('source.phone'), value: 'phone' },
                { label: t('source.walk-in'), value: 'walk-in' },
                { label: t('source.other'), value: 'other' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="notes" label={t('form.notes')}>
        <TextArea
          rows={3}
          placeholder={t('form.notesPlaceholder')}
          maxLength={500}
          showCount
        />
      </Form.Item>

      {priceBreakdown && (
        <>
          <Divider />
          <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
            <Row gutter={16}>
              <Col span={12}>
                <strong>{t('form.nights')}:</strong>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                {priceBreakdown.nights}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <strong>{t('form.subtotal')}:</strong>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                {priceBreakdown.subtotal.toLocaleString()} {currentHotel?.currency}
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <strong>{t('form.tax')} ({currentHotel?.taxRate}%):</strong>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                {priceBreakdown.tax.toLocaleString()} {currentHotel?.currency}
              </Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <strong style={{ fontSize: 16 }}>{t('form.total')}:</strong>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: 16 }}>
                  {priceBreakdown.total.toLocaleString()} {currentHotel?.currency}
                </strong>
              </Col>
            </Row>
          </Card>
        </>
      )}

      <Divider />

      <Form.Item style={{ marginBottom: 0 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('form.update')}
          </Button>
          <Button onClick={onCancel}>
            {t('form.cancel')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
