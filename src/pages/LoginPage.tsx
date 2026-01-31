import { Button, Card } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import logoImage from '../assets/logo.png';

export function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      // Check if user needs to complete profile
      const needsProfileCompletion = !user.phone || !user.address;
      
      if (needsProfileCompletion) {
        navigate('/user-info');
        return;
      }
      
      if (user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            marginBottom: '32px',
            textAlign: 'center',
            padding: '24px',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <img 
            src={logoImage} 
            alt="Hotel Management System" 
            style={{ 
              height: 300, 
              width: 300,
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Login Card */}
        <Card
          style={{ 
            width: '100%', 
            textAlign: 'center',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e8e9ea',
          }}
          bodyStyle={{ padding: '40px 32px' }}
        >
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#2c3e50',
          }}>
            Hotel Management System
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#6c757d', 
            marginBottom: '32px',
            lineHeight: '1.5',
          }}>
            Chào mừng bạn đến với hệ thống quản lý khách sạn
          </p>
          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleSignIn}
            loading={loading}
            block
            style={{
              height: '48px',
              fontSize: '16px',
              borderRadius: '8px',
              fontWeight: '500',
              backgroundColor: '#2c3e50',
              borderColor: '#2c3e50',
            }}
          >
            Đăng nhập với Google
          </Button>
        </Card>
      </div>
    </div>
  );
}
