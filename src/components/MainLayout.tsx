import { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Space, Drawer } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  HomeOutlined,
  DollarOutlined,
  UserOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SwapOutlined,
  MenuOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHotel } from '../contexts/HotelContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const { t } = useTranslation('sidebar');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { currentHotel } = useHotel();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('dashboard'),
    },
    {
      key: '/reservations',
      icon: <CalendarOutlined />,
      label: t('reservations'),
    },
    {
      key: '/front-desk',
      icon: <TeamOutlined />,
      label: t('frontDesk'),
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: t('rooms'),
    },
    {
      key: '/housekeeping',
      icon: <ToolOutlined />,
      label: t('housekeeping'),
    },
    {
      key: '/pricing',
      icon: <DollarOutlined />,
      label: t('pricing'),
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: t('customers'),
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: t('reports'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('settings'),
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSwitchHotel = () => {
    navigate('/select-hotel');
  };

  const userMenuItems = [
    {
      key: 'switch-hotel',
      icon: <SwapOutlined />,
      label: 'Switch Hotel',
      onClick: handleSwitchHotel,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleSignOut,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="light"
          width={250}
          breakpoint="lg"
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: collapsed ? 16 : 20,
              fontWeight: 'bold',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {collapsed ? 'HMS' : 'Hotel MS'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        title="Hotel MS"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={250}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 0 }}
        />
      </Drawer>

      <Layout>
        <Header
          style={{
            padding: isMobile ? '0 16px' : '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
            <div style={{ 
              fontSize: isMobile ? 14 : 16, 
              fontWeight: 500,
              maxWidth: isMobile ? '150px' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {currentHotel?.name || 'No Hotel Selected'}
            </div>
          </Space>
          <Space size={isMobile ? 'small' : 'middle'}>
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={user?.photoURL} icon={<UserOutlined />} />
                {!isMobile && <span>{user?.displayName}</span>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: isMobile ? '16px' : '24px',
            padding: isMobile ? 16 : 24,
            background: '#fff',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
