import { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  DatePicker,
  Space,
  Divider,
  Typography,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { RoomType, CreateRoomTypeInput, SeasonalPricing } from '../../../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface RoomTypeFormProps {
  roomType?: RoomType;
  onSubmit: (data: CreateRoomTypeInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface FormValues {
  name: string;
  description: {
    en: string;
    vi: string;
  };
  basePrice: number;
  capacity: number;
  amenities: string;
  weekdayPricing: {
    monday?: number;
    tuesday?: number;
    wednesday?: number;
    thursday?: number;
    friday?: number;
    saturday?: number;
    sunday?: number;
  };
  seasonalPricing: Array<{
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
    price: number;
  }>;
}

export function RoomTypeForm({
  roomType,
  onSubmit,
  onCancel,
  loading = false,
}: RoomTypeFormProps) {
  const [form] = Form.useForm<FormValues>();
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  const isEditing = !!roomType;

  useEffect(() => {
    if (roomType) {
      form.setFieldsValue({
        name: roomType.name,
        description: {
          en: roomType.description.en || '',
          vi: roomType.description.vi || '',
        },
        basePrice: roomType.basePrice,
        capacity: roomType.capacity,
        amenities: roomType.amenities.join(', '),
        weekdayPricing: roomType.weekdayPricing || {},
        seasonalPricing: roomType.seasonalPricing?.map((season) => ({
          startDate: dayjs(season.startDate),
          endDate: dayjs(season.endDate),
          price: season.price,
        })) || [],
      });
    }
  }, [roomType, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      // Validate seasonal pricing dates
      const seasonalPricing: SeasonalPricing[] = values.seasonalPricing?.map((season) => {
        if (season.endDate.isBefore(season.startDate)) {
          throw new Error(t('roomTypes.errors.invalidDateRange'));
        }
        return {
          startDate: season.startDate.format('YYYY-MM-DD'),
          endDate: season.endDate.format('YYYY-MM-DD'),
          price: season.price,
        };
      }) || [];

      // Check for overlapping seasonal pricing
      for (let i = 0; i < seasonalPricing.length; i++) {
        for (let j = i + 1; j < seasonalPricing.length; j++) {
          const period1 = seasonalPricing[i];
          const period2 = seasonalPricing[j];

          if (
            period1.startDate < period2.endDate &&
            period1.endDate > period2.startDate
          ) {
            throw new Error(t('roomTypes.errors.seasonalOverlap'));
          }
        }
      }

      const data: Partial<CreateRoomTypeInput> = {
        name: values.name,
        description: values.description,
        basePrice: values.basePrice,
        capacity: values.capacity,
        amenities: values.amenities
          ? values.amenities
              .split(',')
              .map((amenity) => amenity.trim())
              .filter((amenity) => amenity.length > 0)
          : [],
        weekdayPricing: values.weekdayPricing,
        seasonalPricing: seasonalPricing.length > 0 ? seasonalPricing : undefined,
      };

      // Only include hotelId when creating (not editing)
      if (!isEditing) {
        data.hotelId = ''; // Will be set by the hook
      }

      await onSubmit(data as CreateRoomTypeInput);
    } catch (error) {
      // Error handling is done in the parent component
      throw error;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        weekdayPricing: {},
        seasonalPricing: [],
      }}
    >
      <Card title={isEditing ? t('roomTypes.edit') : t('roomTypes.create')}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={t('roomTypes.name')}
              rules={[
                { required: true, message: t('roomTypes.validation.nameRequired') },
              ]}
            >
              <Input placeholder={t('roomTypes.namePlaceholder')} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="basePrice"
              label={t('roomTypes.basePrice')}
              rules={[
                { required: true, message: t('roomTypes.validation.basePriceRequired') },
                { type: 'number', min: 1, message: t('roomTypes.validation.basePriceMin') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('roomTypes.basePricePlaceholder')}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="capacity"
              label={t('roomTypes.capacity')}
              rules={[
                { required: true, message: t('roomTypes.validation.capacityRequired') },
                { type: 'number', min: 1, message: t('roomTypes.validation.capacityMin') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('roomTypes.capacityPlaceholder')}
                min={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name={['description', 'en']}
              label={`${t('roomTypes.description')} (English)`}
            >
              <TextArea
                rows={3}
                placeholder={t('roomTypes.descriptionPlaceholder')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name={['description', 'vi']}
              label={`${t('roomTypes.description')} (Tiếng Việt)`}
            >
              <TextArea
                rows={3}
                placeholder={t('roomTypes.descriptionPlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="amenities"
          label={t('roomTypes.amenities')}
        >
          <Input placeholder={t('roomTypes.amenitiesPlaceholder')} />
        </Form.Item>

        <Divider />

        <Title level={4}>{t('roomTypes.weekdayPricing')}</Title>
        <Row gutter={16}>
          {[
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ].map((day) => (
            <Col span={3} key={day}>
              <Form.Item
                name={['weekdayPricing', day]}
                label={t(`roomTypes.${day}`)}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Divider />

        <Title level={4}>{t('roomTypes.seasonalPricing')}</Title>
        <Form.List name="seasonalPricing">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: 16 }}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    >
                      {t('roomTypes.removeSeasonalPricing')}
                    </Button>
                  }
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'startDate']}
                        label={t('roomTypes.startDate')}
                        rules={[
                          { required: true, message: t('roomTypes.validation.startDateRequired') },
                        ]}
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'endDate']}
                        label={t('roomTypes.endDate')}
                        rules={[
                          { required: true, message: t('roomTypes.validation.endDateRequired') },
                        ]}
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'price']}
                        label={t('roomTypes.price')}
                        rules={[
                          { required: true, message: t('roomTypes.validation.priceRequired') },
                          { type: 'number', min: 1, message: t('roomTypes.validation.priceMin') },
                        ]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  {t('roomTypes.addSeasonalPricing')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {tCommon('buttons.save')}
            </Button>
            <Button onClick={onCancel}>
              {tCommon('buttons.cancel')}
            </Button>
          </Space>
        </Form.Item>
      </Card>
    </Form>
  );
}