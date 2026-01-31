import { Card, Row, Col, Slider, Select, Button, Drawer } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface FilterState {
  searchText: string;
  capacityRange: [number, number];
  priceRange: [number, number];
  amenityFilter: string[];
}

interface RoomTypeFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  allAmenities: string[];
  priceRange: [number, number];
  showFilters: boolean;
  onCloseFilters: () => void;
  isMobile: boolean;
  formatPrice: (price: number) => string;
}

export function RoomTypeFilters({
  filters,
  onFiltersChange,
  allAmenities,
  priceRange,
  showFilters,
  onCloseFilters,
  isMobile,
  formatPrice,
}: RoomTypeFiltersProps) {
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  /**
   * Handle capacity range change
   */
  const handleCapacityRangeChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      onFiltersChange({ ...filters, capacityRange: value as [number, number] });
    }
  };

  /**
   * Handle price range change
   */
  const handlePriceRangeChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      onFiltersChange({ ...filters, priceRange: value as [number, number] });
    }
  };

  /**
   * Handle amenity filter change
   */
  const handleAmenityFilterChange = (value: string[]) => {
    onFiltersChange({ ...filters, amenityFilter: value });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    onFiltersChange({
      searchText: '',
      capacityRange: [1, 10],
      priceRange: priceRange,
      amenityFilter: [],
    });
  };

  /**
   * Render filter content
   */
  const renderFilterContent = () => (
    <div style={{ padding: isMobile ? '0' : '16px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.capacity')}
            </label>
            <Slider
              range
              min={1}
              max={10}
              value={filters.capacityRange}
              onChange={handleCapacityRangeChange}
              marks={{
                1: '1',
                5: '5',
                10: '10+'
              }}
            />
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.priceRange')}
            </label>
            <Slider
              range
              min={priceRange[0]}
              max={priceRange[1]}
              value={filters.priceRange}
              onChange={handlePriceRangeChange}
              step={100000}
              tipFormatter={(value) => formatPrice(value || 0)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              {t('filters.amenities')}
            </label>
            <Select
              mode="multiple"
              placeholder={t('filters.amenitiesPlaceholder')}
              value={filters.amenityFilter}
              onChange={handleAmenityFilterChange}
              style={{ width: '100%' }}
              maxTagCount="responsive"
            >
              {allAmenities.map(amenity => (
                <Option key={amenity} value={amenity}>
                  {amenity}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col xs={24} sm={12} md={2}>
          <div style={{ display: 'flex', alignItems: 'end', height: '100%' }}>
            <Button 
              onClick={clearFilters}
              style={{ width: '100%' }}
            >
              {t('filters.clear')}
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* Mobile: Apply and Close buttons */}
      {isMobile && (
        <div style={{ 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          gap: '12px'
        }}>
          <Button 
            type="primary" 
            onClick={onCloseFilters}
            style={{ flex: 1 }}
          >
            {t('filters.apply')}
          </Button>
          <Button 
            onClick={onCloseFilters}
            style={{ flex: 1 }}
          >
            {tCommon('buttons.close')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: Inline filters */}
      {showFilters && !isMobile && (
        <Card size="small" style={{ marginBottom: '16px' }}>
          {renderFilterContent()}
        </Card>
      )}

      {/* Mobile: Bottom drawer for filters */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilterOutlined />
            {t('filters.title')}
          </div>
        }
        placement="bottom"
        onClose={onCloseFilters}
        open={showFilters && isMobile}
        height="75vh"
        styles={{
          body: { padding: '16px' },
          header: { 
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '12px'
          }
        }}
      >
        {renderFilterContent()}
      </Drawer>
    </>
  );
}