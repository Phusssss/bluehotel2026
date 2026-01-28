import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { HotelProvider } from './contexts/HotelContext';
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
import './locales';

function App() {
  return (
    <ConfigProvider>
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
                    <Route path="/rooms" element={<div>Rooms (Coming Soon)</div>} />
                    <Route path="/pricing" element={<div>Pricing (Coming Soon)</div>} />
                    <Route path="/customers" element={<div>Customers (Coming Soon)</div>} />
                    <Route path="/reports" element={<div>Reports (Coming Soon)</div>} />
                    <Route path="/settings" element={<div>Settings (Coming Soon)</div>} />
                  </Route>
                </Route>
              </Route>

              {/* Super admin routes */}
              <Route element={<ProtectedRoute roles={['super_admin']} />}>
                <Route path="/admin" element={<div>Admin Dashboard (Coming Soon)</div>} />
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

export default App;
