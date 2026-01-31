import { Modal, List, Button, Empty, Spin } from 'antd';
import { useHotel } from '../contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface HotelSelectionModalProps {
  open: boolean;
  onCancel?: () => void;
}

export function HotelSelectionModal({ open, onCancel }: HotelSelectionModalProps) {
  const { hotels, selectHotel, loading } = useHotel();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleSelectHotel = (hotelId: string) => {
    selectHotel(hotelId);
    navigate('/dashboard');
  };

  const handleAddHotel = () => {
    navigate('/add-hotel');
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      closable={!!onCancel}
      maskClosable={false}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : hotels.length === 0 ? (
        <div>
          <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>{t('selectHotel.title')}</h3>
          <Empty description={t('selectHotel.noHotels')} />
          <Button 
            type="primary" 
            onClick={handleAddHotel}
            style={{ marginTop: 16 }}
            block
          >
            {t('selectHotel.addFirstHotel')}
          </Button>
        </div>
      ) : (
        <>
          <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>{t('selectHotel.title')}</h3>
          <List
            dataSource={hotels}
            renderItem={(hotel) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<HomeOutlined style={{ fontSize: 24 }} />}
                  title={hotel.name}
                  description={hotel.address}
                />
                <Button
                  type="primary"
                  onClick={() => handleSelectHotel(hotel.id)}
                >
                  {t('selectHotel.select')}
                </Button>
              </List.Item>
            )}
          />
          <Button 
            onClick={handleAddHotel}
            style={{ marginTop: 16 }}
            block
          >
            {t('selectHotel.addAnother')}
          </Button>
        </>
      )}
    </Modal>
  );
}
