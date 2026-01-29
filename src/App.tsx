import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { HotelProvider } from './contexts/HotelContext';
import { ThemeProvider, useTheme, themeColors } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HotelProtectedRoute } from './components/HotelProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SelectHotelPage } from './pages/SelectHotelPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { UserInfoPage } from './pages/UserInfoPage';
import { AddHotelPage } from './pages/AddHotelPage';
import { SeedDataPage } from './pages/SeedDataPage';
import { ReservationsPage } from './features/reservations/pages/ReservationsPage';
import { FrontDeskPage } from './features/frontDesk/pages/FrontDeskPage';
import { RoomsPage } from './features/rooms/pages/RoomsPage';
import { HousekeepingBoard } from './features/rooms/components/HousekeepingBoard';
import { PricingPage } from './features/pricing/pages/PricingPage';
import { ServicesPage } from './features/pricing/pages/ServicesPage';
import { ServiceOrdersPage } from './features/pricing/pages/ServiceOrdersPage';
import { CustomersPage } from './features/customers/pages/CustomersPage';
import { CompaniesPage } from './features/customers/pages/CompaniesPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { AdminDashboard } from './features/admin/pages/AdminDashboard';
import { initializeProtection } from './utils/protection';
import { initAdvancedProtection } from './utils/advancedProtection';
import './locales';

/**
 * AppContent component with theme configuration
 * Separated to access useTheme hook inside ThemeProvider
 */
function AppContent() {
  const { color } = useTheme();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: themeColors[color],
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <HotelProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected routes - require authentication */}
              <Route element={<ProtectedRoute roles={['regular']} />}>
                <Route path="/user-info" element={<UserInfoPage />} />
                <Route path="/add-hotel" element={<AddHotelPage />} />
                <Route path="/select-hotel" element={<SelectHotelPage />} />
                <Route path="/seed-data" element={<SeedDataPage />} />
                
                {/* Hotel-specific routes - require hotel selection */}
                <Route element={<HotelProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/reservations" element={<ReservationsPage />} />
                    <Route path="/front-desk" element={<FrontDeskPage />} />
                    <Route path="/rooms" element={<RoomsPage />} />
                    <Route path="/housekeeping" element={<HousekeepingBoard />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/service-orders" element={<ServiceOrdersPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/companies" element={<CompaniesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Super admin routes */}
              <Route element={<ProtectedRoute roles={['super_admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </HotelProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

function App() {
  // Initialize protection measures
  React.useEffect(() => {
    initializeProtection();
    initAdvancedProtection();
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
