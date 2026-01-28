import { Button, Card } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
        background: '#f0f2f5',
      }}
    >
      <Card
        style={{ width: 400, textAlign: 'center' }}
        title="Hotel Management System"
      >
        <h2>Welcome</h2>
        <p>Sign in to continue</p>
        <Button
          type="primary"
          size="large"
          icon={<GoogleOutlined />}
          onClick={handleSignIn}
          loading={loading}
          block
        >
          Sign in with Google
        </Button>
      </Card>
    </div>
  );
}
