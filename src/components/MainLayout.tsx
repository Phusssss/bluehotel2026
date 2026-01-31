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
  ShoppingOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHotel } from '../contexts/HotelContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { AppTour, TourButton, AutoTour, useTourContext } from './AppTour';
import logoImage from '../assets/logo.png';

const { Header, Sider, Content } = Layout;

function MainLayoutContent() {
  const { t } = useTranslation('sidebar');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { currentHotel } = useHotel();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use tour context to check if tour is active
  const { isTourActive, shouldCloseDrawer } = useTourContext();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open mobile drawer when tour starts
  useEffect(() => {
    if (isTourActive && isMobile) {
      setMobileDrawerOpen(true);
    }
  }, [isTourActive, isMobile]);

  // Close drawer when tour reaches theme/language switcher steps
  useEffect(() => {
    if (shouldCloseDrawer && isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [shouldCloseDrawer, isMobile]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('dashboard'),
      'data-tour': 'dashboard-menu',
    },
    {
      key: '/reservations',
      icon: <CalendarOutlined />,
      label: t('reservations'),
      'data-tour': 'reservations-menu',
    },
    {
      key: '/front-desk',
      icon: <TeamOutlined />,
      label: t('frontDesk'),
      'data-tour': 'front-desk-menu',
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: t('rooms'),
      'data-tour': 'rooms-menu',
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
      'data-tour': 'pricing-menu',
    },
    {
      key: '/services',
      icon: <ShoppingOutlined />,
      label: t('services'),
      'data-tour': 'services-menu',
    },
    {
      key: '/service-orders',
      icon: <ShoppingCartOutlined />,
      label: t('serviceOrders'),
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: t('customers'),
      'data-tour': 'customers-menu',
    },
    {
      key: '/companies',
      icon: <TeamOutlined />,
      label: t('companies'),
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: t('reports'),
      'data-tour': 'reports-menu',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('settings'),
      'data-tour': 'settings-menu',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    // Close mobile drawer after navigation (only when tour is not active or should close)
    if (isMobile && (!isTourActive || shouldCloseDrawer)) {
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
                padding: '0 16px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <img 
                src={logoImage} 
                alt="Hotel MS" 
                style={{ 
                  height: collapsed ? 150 : 200, 
                  width: collapsed ? 150 : 200,
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
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
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={logoImage} 
                alt="Hotel MS" 
                style={{ 
                  width: 200,
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          }
          placement="left"
          onClose={() => {
            // Only allow closing drawer when tour is not active or should close
            if (!isTourActive || shouldCloseDrawer) {
              setMobileDrawerOpen(false);
            }
          }}
          open={mobileDrawerOpen}
          width={250}
          styles={{ body: { padding: 0 } }}
          maskClosable={!isTourActive || shouldCloseDrawer} // Allow close on mask click when should close
          closable={!isTourActive || shouldCloseDrawer} // Show close button when should close
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
                maxWidth: isMobile ? '120px' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {currentHotel?.name || 'No Hotel Selected'}
              </div>
            </Space>
            <Space size={isMobile ? 'small' : 'middle'}>
              <div data-tour="theme-switcher">
                <ThemeSwitcher />
              </div>
              <div data-tour="language-switcher">
                <LanguageSwitcher />
              </div>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }} data-tour="user-menu">
                  <Avatar src={user?.photoURL} icon={<UserOutlined />} />
                  {!isMobile && <span>{user?.displayName}</span>}
                </Space>
              </Dropdown>
            </Space>
          </Header>
          <Content
            style={{
              margin: isMobile ? '1px' : '24px',
              padding: isMobile ? 16 : 24,
              background: '#fff',
              minHeight: 280,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
        
        {/* Tour Components */}
        <TourButton />
        <AutoTour />
      </Layout>
  );
}

export function MainLayout() {
  return (
    <AppTour>
      <MainLayoutContent />
    </AppTour>
  );
}
