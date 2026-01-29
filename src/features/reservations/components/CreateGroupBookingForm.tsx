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
  Steps,
  Table,
  Tag,
  Alert,
  Spin,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useHotel } from '../../../contexts/HotelContext';
import { customerService } from '../../../services/customerService';
import { roomTypeService } from '../../../services/roomTypeService';
import { reservationService } from '../../../services/reservationService';
import { calculateReservationPrice } from '../../../utils/pricingCalculator';
import type {
  Customer,
  RoomType,
  Room,
  RoomTypeAvailabilityRequest,
  RoomTypeAvailabilityResult,
  AlternativeRoomType,
} from '../../../types';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface RoomTypeSelection {
  roomTypeId: string;
  quantity: number;
}

interface SelectedRoom {
  roomId: string;
  roomTypeId: string;
  numberOfGuests: number;
  roomNumber: string;
  roomTypeName: string;
  totalPrice: number;
  priceBreakdown?: Array<{ date: string; price: number; dayOfWeek: string }>;
  subtotal?: number;
  tax?: number;
  nights?: number;
}

interface CreateGroupBookingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * CreateGroupBookingForm - Multi-step form for creating group bookings
 * 
 * This component allows users to create multiple room reservations in a single transaction.
 * It includes:
 * - Step 1: Select customer, dates, source, and room types with quantities
 * - Step 2: Check availability and select specific rooms (with alternatives if needed)
 * - Step 3: Review booking details and confirm
 * 
 * Features:
 * - Automatic room availability checking
 * - Alternative room type suggestions when requested types are unavailable
 * - Price calculation with breakdown by date and day of week
 * - Prevents duplicate room selection across different room types
 */
export function CreateGroupBookingForm({
  onSuccess,
  onCancel,
}: CreateGroupBookingFormProps) {
  const [form] = Form.useForm();
  const { t } = useTranslation('reservations');
  const { currentHotel } = useHotel();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomTypeSelections, setRoomTypeSelections] = useState<
    RoomTypeSelection[]
  >([{ roomTypeId: '', quantity: 1 }]);
  const [availabilityResults, setAvailabilityResults] = useState<
    RoomTypeAvailabilityResult[]
  >([]);
  const [alternatives, setAlternatives] = useState<
    Map<string, AlternativeRoomType[]>
  >(new Map());
  const [availableRoomsByType, setAvailableRoomsByType] = useState<
    Map<string, Room[]>
  >(new Map());
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Form values
  const [customerId, setCustomerId] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [source, setSource] = useState<string>('direct');
  const [notes, setNotes] = useState<string>('');

  // Load customers and room types on mount
  useEffect(() => {
    if (currentHotel) {
      loadCustomers();
      loadRoomTypes();
    }
  }, [currentHotel]);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers(currentHotel!.id);
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      message.error(t('form.loadCustomersError'));
    }
  };

  const loadRoomTypes = async () => {
    try {
      const data = await roomTypeService.getRoomTypes(currentHotel!.id);
      setRoomTypes(data);
    } catch (error) {
      console.error('Error loading room types:', error);
      message.error(t('form.loadRoomTypesError'));
    }
  };

  const addRoomTypeSelection = () => {
    setRoomTypeSelections([
      ...roomTypeSelections,
      { roomTypeId: '', quantity: 1 },
    ]);
  };

  const removeRoomTypeSelection = (index: number) => {
    const newSelections = roomTypeSelections.filter((_, i) => i !== index);
    setRoomTypeSelections(newSelections);
  };

  const updateRoomTypeSelection = (
    index: number,
    field: keyof RoomTypeSelection,
    value: string | number
  ) => {
    const newSelections = [...roomTypeSelections];
    newSelections[index] = { ...newSelections[index], [field]: value };
    setRoomTypeSelections(newSelections);
  };

  const handleStep1Next = async () => {
    try {
      await form.validateFields([
        'customerId',
        'checkInDate',
        'checkOutDate',
        'source',
      ]);

      // Validate room type selections
      const validSelections = roomTypeSelections.filter(
        (sel) => sel.roomTypeId && sel.quantity > 0
      );

      if (validSelections.length === 0) {
        message.error(t('groupBooking.selectAtLeastOneRoomType'));
        return;
      }

      // Store form values
      setCustomerId(form.getFieldValue('customerId'));
      setCheckInDate(form.getFieldValue('checkInDate').format('YYYY-MM-DD'));
      setCheckOutDate(form.getFieldValue('checkOutDate').format('YYYY-MM-DD'));
      setSource(form.getFieldValue('source'));
      setNotes(form.getFieldValue('notes') || '');

      // Check availability
      await checkGroupAvailability(validSelections);
      setCurrentStep(1);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const checkGroupAvailability = async (
    selections: RoomTypeSelection[]
  ) => {
    setCheckingAvailability(true);
    try {
      const checkInStr = form.getFieldValue('checkInDate').format('YYYY-MM-DD');
      const checkOutStr = form.getFieldValue('checkOutDate').format('YYYY-MM-DD');

      const requests: RoomTypeAvailabilityRequest[] = selections.map((sel) => ({
        roomTypeId: sel.roomTypeId,
        quantity: sel.quantity,
      }));

      const results = await reservationService.checkGroupAvailability(
        currentHotel!.id,
        checkInStr,
        checkOutStr,
        requests
      );

      setAvailabilityResults(results);

      // Load available rooms for each room type
      const roomsMap = new Map<string, Room[]>();
      const alternativesMap = new Map<string, AlternativeRoomType[]>();

      for (const result of results) {
        const rooms = await reservationService.getAvailableRooms(
          currentHotel!.id,
          checkInStr,
          checkOutStr,
          result.roomTypeId
        );
        roomsMap.set(result.roomTypeId, rooms);

        // If not fully available, find alternatives
        if (!result.isAvailable) {
          const alts = await reservationService.findAlternativeRoomTypes(
            currentHotel!.id,
            checkInStr,
            checkOutStr,
            result.roomTypeId,
            result.requested
          );
          alternativesMap.set(result.roomTypeId, alts);

          // Also load rooms for alternatives
          for (const alt of alts) {
            const altRooms = await reservationService.getAvailableRooms(
              currentHotel!.id,
              checkInStr,
              checkOutStr,
              alt.roomTypeId
            );
            roomsMap.set(alt.roomTypeId, altRooms);
          }
        }
      }

      setAvailableRoomsByType(roomsMap);
      setAlternatives(alternativesMap);
    } catch (error) {
      console.error('Error checking availability:', error);
      message.error(t('groupBooking.availabilityCheckError'));
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleStep2Next = () => {
    if (selectedRooms.length === 0) {
      message.error(t('groupBooking.selectAtLeastOneRoom'));
      return;
    }
    setCurrentStep(2);
  };

  const handleRoomSelection = (
    roomTypeId: string,
    room: Room,
    numberOfGuests: number
  ) => {
    const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
    if (!roomType) return;

    // Calculate price for this room
    const pricing = calculateReservationPrice(
      {
        roomType,
        checkInDate,
        checkOutDate,
      },
      currentHotel!.taxRate
    );

    // Add day of week to breakdown
    const breakdownWithDayOfWeek = pricing.breakdown.map((item) => ({
      ...item,
      dayOfWeek: dayjs(item.date).format('dddd'), // e.g., "Monday", "Tuesday"
    }));

    const selectedRoom: SelectedRoom = {
      roomId: room.id,
      roomTypeId,
      numberOfGuests,
      roomNumber: room.roomNumber,
      roomTypeName: roomType.name,
      totalPrice: pricing.total,
      priceBreakdown: breakdownWithDayOfWeek,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      nights: pricing.nights,
    };

    // Check if room is already selected
    const existingIndex = selectedRooms.findIndex(
      (r) => r.roomId === room.id
    );

    if (existingIndex >= 0) {
      // Update existing selection
      const newSelectedRooms = [...selectedRooms];
      newSelectedRooms[existingIndex] = selectedRoom;
      setSelectedRooms(newSelectedRooms);
    } else {
      // Add new selection
      setSelectedRooms([...selectedRooms, selectedRoom]);
    }
  };

  const handleRoomDeselection = (roomId: string) => {
    setSelectedRooms(selectedRooms.filter((r) => r.roomId !== roomId));
  };

  const handleSubmit = async () => {
    if (!currentHotel) {
      message.error(t('form.noHotelSelected'));
      return;
    }

    setLoading(true);
    try {
      const reservations = selectedRooms.map((room) => ({
        roomId: room.roomId,
        roomTypeId: room.roomTypeId,
        numberOfGuests: room.numberOfGuests,
        totalPrice: room.totalPrice,
      }));

      await reservationService.createGroupBooking({
        hotelId: currentHotel.id,
        customerId,
        checkInDate,
        checkOutDate,
        source: source as any,
        notes,
        reservations,
      });

      message.success(t('groupBooking.createSuccess'));
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating group booking:', error);
      message.error(error.message || t('groupBooking.createError'));
    } finally {
      setLoading(false);
    }
  };

  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs().startOf('day');
  };

  const calculateTotalPrice = () => {
    return selectedRooms.reduce((sum, room) => sum + room.totalPrice, 0);
  };

  // Step 1: Select customer, dates, source, and room types
  const renderStep1 = () => (
    <div>
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
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
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
                  return Promise.reject(
                    new Error(t('form.checkOutAfterCheckIn'))
                  );
                },
              }),
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider>{t('groupBooking.roomTypeSelection')}</Divider>

      {roomTypeSelections.map((selection, index) => (
        <Row key={index} gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Select
              placeholder={t('form.roomTypePlaceholder')}
              value={selection.roomTypeId || undefined}
              onChange={(value) =>
                updateRoomTypeSelection(index, 'roomTypeId', value)
              }
              style={{ width: '100%' }}
              options={roomTypes.map((roomType) => ({
                label: `${roomType.name} - ${roomType.basePrice.toLocaleString()} ${
                  currentHotel?.currency
                }`,
                value: roomType.id,
              }))}
            />
          </Col>
          <Col xs={16} md={8}>
            <InputNumber
              min={1}
              value={selection.quantity}
              onChange={(value) =>
                updateRoomTypeSelection(index, 'quantity', value || 1)
              }
              style={{ width: '100%' }}
              placeholder={t('groupBooking.quantity')}
            />
          </Col>
          <Col xs={8} md={4}>
            {roomTypeSelections.length > 1 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeRoomTypeSelection(index)}
              />
            )}
          </Col>
        </Row>
      ))}

      <Button
        type="dashed"
        onClick={addRoomTypeSelection}
        icon={<PlusOutlined />}
        style={{ marginBottom: 16 }}
      >
        {t('groupBooking.addRoomType')}
      </Button>

      <Form.Item name="notes" label={t('form.notes')}>
        <TextArea
          rows={3}
          placeholder={t('form.notesPlaceholder')}
          maxLength={500}
          showCount
        />
      </Form.Item>
    </div>
  );

  // Step 2: Display availability and select specific rooms
  const renderStep2 = () => (
    <div>
      {checkingAvailability ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            {t('groupBooking.checkingAvailability')}
          </div>
        </div>
      ) : (
        <>
          {availabilityResults.map((result) => {
            const roomType = roomTypes.find(
              (rt) => rt.id === result.roomTypeId
            );
            const availableRooms =
              availableRoomsByType.get(result.roomTypeId) || [];
            const alts = alternatives.get(result.roomTypeId) || [];

            return (
              <Card
                key={result.roomTypeId}
                style={{ marginBottom: 16 }}
                title={
                  <Space>
                    {roomType?.name}
                    {result.isAvailable ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        {t('groupBooking.available')}
                      </Tag>
                    ) : (
                      <Tag color="warning" icon={<WarningOutlined />}>
                        {t('groupBooking.partiallyAvailable')}
                      </Tag>
                    )}
                  </Space>
                }
              >
                <Text>
                  {t('groupBooking.requested')}: {result.requested} |{' '}
                  {t('groupBooking.available')}: {result.available}
                </Text>

                {availableRooms.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>{t('groupBooking.selectRooms')}</Title>
                    <Row gutter={[16, 16]}>
                      {/* First, show selected rooms for this room type */}
                      {selectedRooms
                        .filter((sr) => sr.roomTypeId === result.roomTypeId)
                        .map((selectedRoom) => {
                          const room = availableRooms.find((r) => r.id === selectedRoom.roomId);
                          if (!room) return null;
                          
                          return (
                            <Col key={room.id} xs={24} sm={12} md={8}>
                              <Card
                                size="small"
                                hoverable
                                style={{
                                  border: '2px solid #1890ff',
                                }}
                                onClick={() => {
                                  handleRoomDeselection(room.id);
                                }}
                              >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <Text strong>
                                    {t('form.roomNumber')} {room.roomNumber}
                                  </Text>
                                  <Text type="secondary">
                                    {t('form.floor')} {room.floor}
                                  </Text>
                                  <Tag color="blue">
                                    {t('groupBooking.selected')}
                                  </Tag>
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                      
                      {/* Then, show available rooms that are not selected anywhere */}
                      {availableRooms
                        .filter((room) => {
                          // Filter out ALL rooms that are already selected
                          const isAlreadySelected = selectedRooms.some(
                            (r) => r.roomId === room.id
                          );
                          return !isAlreadySelected;
                        })
                        .slice(0, result.requested - selectedRooms.filter((sr) => sr.roomTypeId === result.roomTypeId).length)
                        .map((room) => {
                          return (
                            <Col key={room.id} xs={24} sm={12} md={8}>
                              <Card
                                size="small"
                                hoverable
                                onClick={() => {
                                  handleRoomSelection(
                                    result.roomTypeId,
                                    room,
                                    1
                                  );
                                }}
                              >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <Text strong>
                                    {t('form.roomNumber')} {room.roomNumber}
                                  </Text>
                                  <Text type="secondary">
                                    {t('form.floor')} {room.floor}
                                  </Text>
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                    </Row>
                  </div>
                )}

                {!result.isAvailable && alts.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Alert
                      message={t('groupBooking.alternativesAvailable')}
                      description={t('groupBooking.alternativesDescription')}
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    {alts.map((alt) => {
                      const altRooms =
                        availableRoomsByType.get(alt.roomTypeId) || [];
                      return (
                        <Card
                          key={alt.roomTypeId}
                          size="small"
                          style={{ marginBottom: 8 }}
                          title={
                            <Space>
                              {alt.roomType.name}
                              <Tag color="blue">
                                {alt.priceComparison > 0 ? '+' : ''}
                                {alt.priceComparison}%
                              </Tag>
                            </Space>
                          }
                        >
                          <Row gutter={[16, 16]}>
                            {/* First, show selected rooms for this alternative room type */}
                            {selectedRooms
                              .filter((sr) => sr.roomTypeId === alt.roomTypeId)
                              .map((selectedRoom) => {
                                const room = altRooms.find((r) => r.id === selectedRoom.roomId);
                                if (!room) return null;
                                
                                return (
                                  <Col key={room.id} xs={24} sm={12} md={8}>
                                    <Card
                                      size="small"
                                      hoverable
                                      style={{
                                        border: '2px solid #1890ff',
                                      }}
                                      onClick={() => {
                                        handleRoomDeselection(room.id);
                                      }}
                                    >
                                      <Space
                                        direction="vertical"
                                        style={{ width: '100%' }}
                                      >
                                        <Text strong>
                                          {t('form.roomNumber')} {room.roomNumber}
                                        </Text>
                                        <Text type="secondary">
                                          {t('form.floor')} {room.floor}
                                        </Text>
                                        <Tag color="blue">
                                          {t('groupBooking.selected')}
                                        </Tag>
                                      </Space>
                                    </Card>
                                  </Col>
                                );
                              })}
                            
                            {/* Then, show available rooms that are not selected anywhere */}
                            {altRooms
                              .filter((room) => {
                                // Filter out ALL rooms that are already selected
                                const isAlreadySelected = selectedRooms.some(
                                  (r) => r.roomId === room.id
                                );
                                return !isAlreadySelected;
                              })
                              .slice(0, result.requested - result.available - selectedRooms.filter((sr) => sr.roomTypeId === alt.roomTypeId).length)
                              .map((room) => {
                                return (
                                  <Col key={room.id} xs={24} sm={12} md={8}>
                                    <Card
                                      size="small"
                                      hoverable
                                      onClick={() => {
                                        handleRoomSelection(
                                          alt.roomTypeId,
                                          room,
                                          1
                                        );
                                      }}
                                    >
                                      <Space
                                        direction="vertical"
                                        style={{ width: '100%' }}
                                      >
                                        <Text strong>
                                          {t('form.roomNumber')} {room.roomNumber}
                                        </Text>
                                        <Text type="secondary">
                                          {t('form.floor')} {room.floor}
                                        </Text>
                                      </Space>
                                    </Card>
                                  </Col>
                                );
                              })}
                          </Row>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );

  // Step 3: Review and confirm
  const renderStep3 = () => {
    const totalPrice = calculateTotalPrice();

    return (
      <div>
        <Card title={t('groupBooking.bookingSummary')} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>{t('form.customer')}:</Text>
            </Col>
            <Col span={12}>
              <Text>
                {customers.find((c) => c.id === customerId)?.name || '-'}
              </Text>
            </Col>

            <Col span={12}>
              <Text strong>{t('form.checkInDate')}:</Text>
            </Col>
            <Col span={12}>
              <Text>{checkInDate}</Text>
            </Col>

            <Col span={12}>
              <Text strong>{t('form.checkOutDate')}:</Text>
            </Col>
            <Col span={12}>
              <Text>{checkOutDate}</Text>
            </Col>

            <Col span={12}>
              <Text strong>{t('form.source')}:</Text>
            </Col>
            <Col span={12}>
              <Text>{t(`source.${source}`)}</Text>
            </Col>

            <Col span={12}>
              <Text strong>{t('groupBooking.totalRooms')}:</Text>
            </Col>
            <Col span={12}>
              <Text>{selectedRooms.length}</Text>
            </Col>
          </Row>
        </Card>

        <Card title={t('groupBooking.selectedRooms')} style={{ marginBottom: 16 }}>
          <Table
            dataSource={selectedRooms}
            rowKey="roomId"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => {
                if (!record.priceBreakdown || record.priceBreakdown.length === 0) {
                  return <div style={{ padding: '8px 16px' }}>Không có dữ liệu chi tiết giá</div>;
                }
                
                return (
                  <div style={{ padding: '8px 16px', backgroundColor: '#fafafa' }}>
                    <Text strong style={{ fontSize: 16 }}>Chi tiết giá theo ngày:</Text>
                    <Table
                      dataSource={record.priceBreakdown}
                      rowKey="date"
                      pagination={false}
                      size="small"
                      style={{ marginTop: 12 }}
                      columns={[
                        {
                          title: 'Ngày',
                          dataIndex: 'date',
                          key: 'date',
                          render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
                        },
                        {
                          title: 'Thứ',
                          dataIndex: 'dayOfWeek',
                          key: 'dayOfWeek',
                          render: (day: string) => {
                            const dayMap: Record<string, string> = {
                              'Monday': 'Thứ 2',
                              'Tuesday': 'Thứ 3',
                              'Wednesday': 'Thứ 4',
                              'Thursday': 'Thứ 5',
                              'Friday': 'Thứ 6',
                              'Saturday': 'Thứ 7',
                              'Sunday': 'Chủ nhật',
                            };
                            return dayMap[day] || day;
                          },
                        },
                        {
                          title: 'Giá',
                          dataIndex: 'price',
                          key: 'price',
                          render: (price: number) =>
                            `${price.toLocaleString()} ${currentHotel?.currency}`,
                        },
                      ]}
                    />
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #d9d9d9' }}>
                      <Row gutter={16}>
                        <Col span={12}></Col>
                        <Col span={12}>
                          <Space direction="vertical" size={4} style={{ width: '100%', textAlign: 'right' }}>
                            <Text>Tạm tính: <strong>{record.subtotal?.toLocaleString()} {currentHotel?.currency}</strong></Text>
                            <Text>Thuế ({currentHotel?.taxRate}%): <strong>{record.tax?.toLocaleString()} {currentHotel?.currency}</strong></Text>
                            <Text style={{ fontSize: 16 }}>Tổng cộng: <strong style={{ color: '#1890ff' }}>{record.totalPrice.toLocaleString()} {currentHotel?.currency}</strong></Text>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  </div>
                );
              },
              rowExpandable: (record) => !!record.priceBreakdown && record.priceBreakdown.length > 0,
            }}
            columns={[
              {
                title: t('form.roomNumber'),
                dataIndex: 'roomNumber',
                key: 'roomNumber',
              },
              {
                title: t('form.roomType'),
                dataIndex: 'roomTypeName',
                key: 'roomTypeName',
              },
              {
                title: t('form.numberOfGuests'),
                dataIndex: 'numberOfGuests',
                key: 'numberOfGuests',
              },
              {
                title: `${t('form.nights')} / ${t('form.total')}`,
                key: 'priceInfo',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{record.nights} đêm</Text>
                    <Text strong>{record.totalPrice.toLocaleString()} {currentHotel?.currency}</Text>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Card style={{ backgroundColor: '#f5f5f5' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Title level={4}>{t('groupBooking.grandTotal')}:</Title>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Title level={4}>
                {totalPrice.toLocaleString()} {currentHotel?.currency}
              </Title>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  const steps = [
    {
      title: t('groupBooking.step1Title'),
      content: renderStep1(),
    },
    {
      title: t('groupBooking.step2Title'),
      content: renderStep2(),
    },
    {
      title: t('groupBooking.step3Title'),
      content: renderStep3(),
    },
  ];

  return (
    <div>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step) => (
          <Steps.Step key={step.title} title={step.title} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          source: 'direct',
        }}
      >
        <div style={{ minHeight: 400 }}>{steps[currentStep].content}</div>

        <Divider />

        <Space>
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>
              {t('groupBooking.back')}
            </Button>
          )}
          {currentStep === 0 && (
            <Button type="primary" onClick={handleStep1Next}>
              {t('groupBooking.next')}
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="primary" onClick={handleStep2Next}>
              {t('groupBooking.next')}
            </Button>
          )}
          {currentStep === 2 && (
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {t('groupBooking.submit')}
            </Button>
          )}
          <Button onClick={onCancel}>{t('form.cancel')}</Button>
        </Space>
      </Form>
    </div>
  );
}
