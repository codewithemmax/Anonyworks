import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      
      if (!token) {
        if (requireAuth) {
          navigate('/login');
        }
        setLoading(false);
        return;
      }

      try {
        const response = await api.fetch('/api/user/profile');
        const data = await response.json();
        
        if (data.success) {
          if (!requireAuth) {
            navigate('/dashboard');
          }
        } else {
          api.logout();
          if (requireAuth) {
            navigate('/login');
          }
        }
      } catch (error) {
        api.logout();
        if (requireAuth) {
          navigate('/login');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}