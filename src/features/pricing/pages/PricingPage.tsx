import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Space,
  Modal,
  Typography,
  Input,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRoomTypes } from '../hooks/useRoomTypes';
import { RoomTypeForm } from '../components/RoomTypeForm';
import { RoomTypeFilters } from '../components/RoomTypeFilters';
import { RoomTypeTable } from '../components/RoomTypeTable';
import { RoomTypeDetailsModal } from '../components/RoomTypeDetailsModal';
import type { RoomType, CreateRoomTypeInput } from '../../../types';

const { Title, Text } = Typography;
const { Search } = Input;

interface FilterState {
  searchText: string;
  capacityRange: [number, number];
  priceRange: [number, number];
  amenityFilter: string[];
}

/**
 * PricingPage component - manages room types and pricing
 * Displays a table of room types with create, edit, delete, and view details functionality
 * Includes filtering and search capabilities
 * Supports responsive design for mobile, tablet, and desktop
 */
export function PricingPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    capacityRange: [1, 10],
    priceRange: [0, 10000000],
    amenityFilter: [],
  });

  const { roomTypes, loading, createRoomType, updateRoomType, deleteRoomType, refresh } =
    useRoomTypes();
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Get all unique amenities from room types for filter options
   */
  const allAmenities = useMemo(() => {
    const amenitiesSet = new Set<string>();
    roomTypes.forEach(roomType => {
      roomType.amenities.forEach(amenity => amenitiesSet.add(amenity));
    });
    return Array.from(amenitiesSet).sort();
  }, [roomTypes]);

  /**
   * Get price range from all room types
   */
  const priceRange = useMemo(() => {
    if (roomTypes.length === 0) return [0, 10000000];
    const prices = roomTypes.map(rt => rt.basePrice);
    return [Math.min(...prices), Math.max(...prices)];
  }, [roomTypes]);

  /**
   * Filter room types based on current filter state
   */
  const filteredRoomTypes = useMemo(() => {
    return roomTypes.filter(roomType => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = roomType.name.toLowerCase().includes(searchLower);
        const descriptionMatch = 
          (roomType.description?.en?.toLowerCase().includes(searchLower)) ||
          (roomType.description?.vi?.toLowerCase().includes(searchLower));
        const amenityMatch = roomType.amenities.some(amenity => 
          amenity.toLowerCase().includes(searchLower)
        );
        
        if (!nameMatch && !descriptionMatch && !amenityMatch) {
          return false;
        }
      }

      // Capacity range filter
      if (roomType.capacity < filters.capacityRange[0] || 
          roomType.capacity > filters.capacityRange[1]) {
        return false;
      }

      // Price range filter
      if (roomType.basePrice < filters.priceRange[0] || 
          roomType.basePrice > filters.priceRange[1]) {
        return false;
      }

      // Amenity filter
      if (filters.amenityFilter.length > 0) {
        const hasRequiredAmenities = filters.amenityFilter.every(amenity =>
          roomType.amenities.includes(amenity)
        );
        if (!hasRequiredAmenities) {
          return false;
        }
      }

      return true;
    });
  }, [roomTypes, filters]);

  /**
   * Handle search input change
   */
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  /**
   * Handle search input change
   */
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }));
  };

  /**
   * Toggle filters visibility
   */
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  /**
   * Close filters (for mobile drawer)
   */
  const closeFilters = () => {
    setShowFilters(false);
  };
  /**
   * Handle create room type button click
   */
  const handleCreate = () => {
    setEditingRoomType(undefined);
    setIsModalVisible(true);
  };

  /**
   * Handle edit room type button click
   */
  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setIsModalVisible(true);
  };

  /**
   * Handle view details button click
   */
  const handleViewDetails = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setDetailModalVisible(true);
  };

  /**
   * Handle row click to view room type details on mobile
   */
  const handleRowClick = (record: RoomType) => {
    if (isMobile) {
      handleViewDetails(record);
    }
  };

  /**
   * Handle delete room type
   */
  const handleDelete = async (id: string) => {
    try {
      await deleteRoomType(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  /**
   * Show delete confirmation modal
   */
  const showDeleteConfirm = (record: RoomType) => {
    Modal.confirm({
      title: t('roomTypes.deleteConfirm'),
      icon: <ExclamationCircleOutlined />,
      content: `${record.name}`,
      okText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      okButtonProps: { danger: true },
      onOk: () => handleDelete(record.id),
    });
  };

  /**
   * Handle form modal cancel
   */
  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingRoomType(undefined);
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: CreateRoomTypeInput) => {
    try {
      setFormLoading(true);
      if (editingRoomType) {
        await updateRoomType(editingRoomType.id, data);
      } else {
        await createRoomType(data);
      }
      setIsModalVisible(false);
      setEditingRoomType(undefined);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Format price with Vietnamese locale
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div style={{ padding: '1px' }}>
      {/* Mobile row hover styles */}
      {isMobile && (
        <style>
          {`
            .mobile-clickable-row:hover {
              background-color: #f5f5f5 !important;
            }
            .mobile-clickable-row:active {
              background-color: #e6f7ff !important;
            }
          `}
        </style>
      )}

      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '24px' }} data-tour="pricing-title">{t('title')}</Title>
          {isMobile && (
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {t('columns.tapToView')}
            </Text>
          )}
        </div>
        <Space wrap size="small">
          <Button
            icon={<FilterOutlined />}
            onClick={toggleFilters}
            type={showFilters ? 'primary' : 'default'}
            size="middle"
          >
            {t('filters.toggle')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={refresh}
            loading={loading}
            size="middle"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="middle"
            data-tour="create-room-type"
          >
            {t('roomTypes.create')}
          </Button>
        </Space>
      </div>

      {/* Search Bar */}
      <div style={{ 
        marginBottom: '16px',
        position: isMobile ? 'sticky' : 'static',
        top: isMobile ? '0' : 'auto',
        zIndex: isMobile ? 10 : 'auto',
        backgroundColor: '#fff',
        paddingTop: isMobile ? '8px' : '0',
        paddingBottom: isMobile ? '8px' : '0'
      }}>
        <Search
          placeholder={t('filters.searchPlaceholder')}
          allowClear
          enterButton={<SearchOutlined />}
          size={isMobile ? 'middle' : 'large'}
          value={filters.searchText}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
        />
      </div>

      {/* Filters */}
      <RoomTypeFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        allAmenities={allAmenities}
        priceRange={priceRange as [number, number]}
        showFilters={showFilters}
        onCloseFilters={closeFilters}
        isMobile={isMobile}
        formatPrice={formatPrice}
      />

      {/* Results Summary */}
      {(filters.searchText || filters.amenityFilter.length > 0 || 
        filters.capacityRange[0] > 1 || filters.capacityRange[1] < 10 ||
        filters.priceRange[0] > priceRange[0] || filters.priceRange[1] < priceRange[1]) && (
        <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#f0f2f5', borderRadius: '6px' }}>
          <Text type="secondary">
            {t('filters.resultsCount', { 
              count: filteredRoomTypes.length, 
              total: roomTypes.length 
            })}
          </Text>
        </div>
      )}

      {/* Room Types Table */}
      <div data-tour="pricing-table">
        <RoomTypeTable
          roomTypes={filteredRoomTypes}
          loading={loading}
          isMobile={isMobile}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={showDeleteConfirm}
          onRowClick={handleRowClick}
          formatPrice={formatPrice}
        />
      </div>

      {/* Create/Edit Room Type Modal */}
      <Modal
        title={editingRoomType ? t('roomTypes.edit') : t('roomTypes.create')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: 800, top: 20 }}
      >
        <RoomTypeForm
          roomType={editingRoomType}
          onSubmit={handleFormSubmit}
          onCancel={handleModalCancel}
          loading={formLoading}
        />
      </Modal>

      {/* Room Type Details Modal */}
      <RoomTypeDetailsModal
        roomType={selectedRoomType}
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedRoomType(null);
        }}
        onEdit={handleEdit}
        onDelete={showDeleteConfirm}
        isMobile={isMobile}
        formatPrice={formatPrice}
      />
    </div>
  );
}
