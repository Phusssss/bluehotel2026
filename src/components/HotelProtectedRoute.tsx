import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useHotel } from '../contexts/HotelContext';

interface HotelProtectedRouteProps {
  permissions?: Array<'owner' | 'manager' | 'receptionist' | 'housekeeping'>;
}

export function HotelProtectedRoute({ permissions: _permissions }: HotelProtectedRouteProps) {
  const { currentHotel, loading } = useHotel();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        width: '100%'
      }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Redirect to hotel selection if no hotel is selected
  if (!currentHotel) {
    return <Navigate to="/select-hotel" replace />;
  }

  // TODO: Implement permission checking when we have user permissions in HotelContext
  // For now, we'll allow access if a hotel is selected
  // In the future, we need to:
  // 1. Add userPermission to HotelContext
  // 2. Check if user's permission is in the allowed permissions array
  
  // if (permissions && userPermission && !permissions.includes(userPermission)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  return <Outlet />;
}
