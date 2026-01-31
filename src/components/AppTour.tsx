import { useEffect, createContext, useContext, useState } from 'react';
import { TourProvider, useTour } from '@reactour/tour';
import { Button, Modal, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface TourStep {
  selector: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// Simplified tour context
const TourContext = createContext<{
  isTourActive: boolean;
  shouldCloseDrawer: boolean;
  startTour: () => void;
  endTour: () => void;
}>({
  isTourActive: false,
  shouldCloseDrawer: false,
  startTour: () => {},
  endTour: () => {},
});

export const useTourContext = () => useContext(TourContext);

// Component to track tour step changes
function TourStepTracker({ onStepChange }: { onStepChange: (step: number) => void }) {
  const { currentStep } = useTour();
  
  useEffect(() => {
    onStepChange(currentStep);
  }, [currentStep, onStepChange]);
  
  return null;
}

export function AppTour({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('tour');
  const [isTourActive, setIsTourActive] = useState(false);
  const [shouldCloseDrawer, setShouldCloseDrawer] = useState(false);

  const startTour = () => {
    setIsTourActive(true);
    setShouldCloseDrawer(false);
  };

  const endTour = () => {
    setIsTourActive(false);
    setShouldCloseDrawer(false);
  };

  // Sidebar tour steps - chỉ giải thích các menu trong sidebar
  const sidebarTourSteps: TourStep[] = [
    {
      selector: '[data-tour="dashboard-menu"]',
      content: t('sidebar.dashboard', 'Trang Tổng quan - xem thống kê tổng thể của khách sạn: công suất phòng, doanh thu, biểu đồ...'),
      position: 'right',
    },
    {
      selector: '[data-tour="reservations-menu"]',
      content: t('sidebar.reservations', 'Quản lý Đặt phòng - tạo, chỉnh sửa và theo dõi tất cả các đặt phòng của khách hàng.'),
      position: 'right',
    },
    {
      selector: '[data-tour="front-desk-menu"]',
      content: t('sidebar.frontDesk', 'Front Desk - thực hiện check-in, check-out khách hàng và quản lý các hoạt động hàng ngày.'),
      position: 'right',
    },
    {
      selector: '[data-tour="rooms-menu"]',
      content: t('sidebar.rooms', 'Quản lý Phòng - tạo phòng, xem trạng thái phòng, quản lý dọn dẹp và bảo trì.'),
      position: 'right',
    },
    {
      selector: '[data-tour="pricing-menu"]',
      content: t('sidebar.pricing', 'Quản lý Giá - thiết lập loại phòng, giá cả và các tiện nghi cho từng loại phòng.'),
      position: 'right',
    },
    {
      selector: '[data-tour="services-menu"]',
      content: t('sidebar.services', 'Quản lý Dịch vụ - tạo các dịch vụ bổ sung như spa, nhà hàng, giặt ủi để tăng doanh thu.'),
      position: 'right',
    },
    {
      selector: '[data-tour="customers-menu"]',
      content: t('sidebar.customers', 'Quản lý Khách hàng - lưu trữ thông tin khách hàng, lịch sử đặt phòng và thông tin liên hệ.'),
      position: 'right',
    },
    {
      selector: '[data-tour="reports-menu"]',
      content: t('sidebar.reports', 'Báo cáo - xem các báo cáo doanh thu, công suất phòng và phân tích hiệu quả kinh doanh.'),
      position: 'right',
    },
    {
      selector: '[data-tour="settings-menu"]',
      content: t('sidebar.settings', 'Cài đặt - quản lý người dùng, phân quyền và cấu hình hệ thống.'),
      position: 'right',
    },
    {
      selector: '[data-tour="theme-switcher"]',
      content: t('sidebar.theme', 'Chuyển đổi giao diện sáng/tối theo sở thích của bạn.'),
      position: 'bottom',
    },
    {
      selector: '[data-tour="language-switcher"]',
      content: t('sidebar.language', 'Chuyển đổi ngôn ngữ giữa Tiếng Việt và English.'),
      position: 'bottom',
    },
  ];

  const steps = sidebarTourSteps.map((step, index) => ({
    selector: step.selector,
    content: (
      <div style={{ padding: '16px', maxWidth: '350px' }}>
        <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
          Bước {index + 1} / {sidebarTourSteps.length}
        </div>
        <div style={{ marginBottom: '16px', lineHeight: '1.5' }}>
          {step.content}
        </div>
      </div>
    ),
    position: step.position || 'bottom',
  }));

  return (
    <TourContext.Provider value={{ isTourActive, shouldCloseDrawer, startTour, endTour }}>
      <TourProvider
        steps={steps}
        showBadge={false}
        showCloseButton={true}
        showNavigation={true}
        showDots={true}
        disableDotsNavigation={false}
        disableKeyboardNavigation={false}
        className="tour-mask"
        styles={{
          popover: (base) => ({
            ...base,
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e8e8e8',
          }),
          maskArea: (base) => ({
            ...base,
            rx: 8,
          }),
          badge: (base) => ({
            ...base,
            backgroundColor: '#1890ff',
          }),
        }}
        beforeClose={() => {
          localStorage.setItem('tour-completed-sidebar', 'true');
          message.success('Hoàn thành hướng dẫn hệ thống!');
          endTour();
          return true;
        }}
        onClickMask={() => {
          // Prevent closing tour by clicking mask during mobile tour
          return false;
        }}
      >
        <TourStepTracker 
          onStepChange={(step) => {
            // Close drawer when reaching theme/language switcher steps (steps 10-11)
            if (step >= 9) {
              setShouldCloseDrawer(true);
            }
          }}
        />
        {children}
      </TourProvider>
    </TourContext.Provider>
  );
}

export function TourButton() {
  const { setIsOpen } = useTour();
  const { t } = useTranslation('tour');
  const { startTour } = useTourContext();

  const handleStartTour = () => {
    // Reset tour completion status
    localStorage.removeItem('tour-completed-sidebar');
    
    // Start tour context first
    startTour();
    
    // Small delay to ensure drawer opens before tour starts
    setTimeout(() => {
      setIsOpen(true);
    }, 300);
  };

  return (
    <Button
      type="primary"
      icon={<QuestionCircleOutlined />}
      onClick={handleStartTour}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      title={t('startTour', 'Bắt đầu hướng dẫn')}
    />
  );
}

export function AutoTour() {
  const { setIsOpen } = useTour();
  const { startTour } = useTourContext();

  useEffect(() => {
    // Auto start tour for new users
    const tourCompleted = localStorage.getItem('tour-completed-sidebar');
    const isFirstVisit = !localStorage.getItem('app-visited');
    
    if (!tourCompleted && isFirstVisit) {
      // Show welcome modal first
      Modal.info({
        title: '🎉 Chào mừng đến với Hệ thống Quản lý Khách sạn!',
        content: (
          <div>
            <p>Chúng tôi sẽ hướng dẫn bạn các chức năng chính của hệ thống.</p>
            <p>Hướng dẫn sẽ giải thích:</p>
            <ul>
              <li>Các menu trong thanh điều hướng</li>
              <li>Chức năng của từng trang</li>
              <li>Cách sử dụng các tính năng cơ bản</li>
            </ul>
            <p><strong>Lưu ý:</strong> Trên mobile, chúng tôi sẽ mở menu để bạn có thể xem các chức năng.</p>
          </div>
        ),
        okText: 'Bắt đầu hướng dẫn',
        width: 500,
        onOk: () => {
          // Start tour context first
          startTour();
          
          setTimeout(() => {
            setIsOpen(true);
          }, 300);
        },
      });
      
      // Mark app as visited
      localStorage.setItem('app-visited', 'true');
    }
  }, [setIsOpen, startTour]);

  return null;
}