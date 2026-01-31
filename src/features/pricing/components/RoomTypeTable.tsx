import { Table, Button, Space, Tag, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RoomType } from '../../../types';

interface RoomTypeTableProps {
  roomTypes: RoomType[];
  loading: boolean;
  isMobile: boolean;
  onViewDetails: (roomType: RoomType) => void;
  onEdit: (roomType: RoomType) => void;
  onDelete: (roomType: RoomType) => void;
  onRowClick: (record: RoomType) => void;
  formatPrice: (price: number) => string;
}

export function RoomTypeTable({
  roomTypes,
  loading,
  isMobile,
  onViewDetails,
  onEdit,
  onDelete,
  onRowClick,
  formatPrice,
}: RoomTypeTableProps) {
  const { t } = useTranslation('pricing');
  const { t: tCommon } = useTranslation('common');

  /**
   * Get action menu items for dropdown
   */
  const getActionMenu = (record: RoomType): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('roomTypes.viewDetails'),
      onClick: () => onViewDetails(record),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: tCommon('buttons.edit'),
      onClick: () => onEdit(record),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: tCommon('buttons.delete'),
      danger: true,
      onClick: () => onDelete(record),
    },
  ];

  /**
   * Table columns configuration with responsive breakpoints
   */
  const columns: ColumnsType<RoomType> = [
    {
      title: t('columns.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 'auto',
      ellipsis: true,
      render: (name, record) => (
        <Button
          type="link"
          onClick={() => onViewDetails(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {name}
        </Button>
      ),
    },
    {
      title: t('columns.basePrice'),
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price) => formatPrice(price),
      sorter: (a, b) => a.basePrice - b.basePrice,
      width: 'auto',
    },
    {
      title: t('columns.capacity'),
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity) => `${capacity}`,
      sorter: (a, b) => a.capacity - b.capacity,
      width: 'auto',
      responsive: ['sm'],
    },
    {
      title: t('columns.amenities'),
      dataIndex: 'amenities',
      key: 'amenities',
      width: 'auto',
      render: (amenities: string[]) => (
        <Space wrap>
          {amenities.slice(0, 2).map((amenity, index) => (
            <Tag key={index}>{amenity}</Tag>
          ))}
          {amenities.length > 2 && <Tag>+{amenities.length - 2}</Tag>}
        </Space>
      ),
      responsive: ['md'],
      ellipsis: true,
    },
    {
      title: t('columns.description'),
      dataIndex: 'description',
      key: 'description',
      width: 'auto',
      render: (description) => {
        const text = description?.en || description?.vi || '';
        return text.length > 40 ? `${text.substring(0, 40)}...` : text;
      },
      responsive: ['lg'],
      ellipsis: true,
    },
    {
      title: '',
      key: 'actions',
      width: isMobile ? 60 : 'auto',
      fixed: 'right' as const,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenu(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
    }}>
      <Table
        columns={columns}
        dataSource={roomTypes}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        tableLayout="auto"
        onRow={(record) => ({
          onClick: () => onRowClick(record),
          style: { 
            cursor: isMobile ? 'pointer' : 'default' 
          },
        })}
        rowClassName={() => 
          isMobile ? 'mobile-clickable-row' : ''
        }
        pagination={{
          pageSize: isMobile ? 5 : 10,
          showSizeChanger: !isMobile,
          showQuickJumper: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} / ${total}`,
          responsive: true,
          size: isMobile ? 'small' : 'default',
        }}
        size={isMobile ? 'small' : 'middle'}
      />
    </div>
  );
}