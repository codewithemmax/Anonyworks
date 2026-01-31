import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
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
      // Check for Google OAuth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !api.getToken()) {
        try {
          const response = await api.fetch('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.user_metadata.full_name,
              googleId: session.user.id
            })
          });
          
          const data = await response.json();
          if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Google auth sync failed:', error);
        }
      }
      
      const token = api.getToken();
      
      if (!token) {
        if (requireAuth) {
          navigate('/login');
        }
        setLoading(false);
        return;
      }

      // Skip profile check for non-auth required routes
      if (!requireAuth) {
        navigate('/dashboard');
        setLoading(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await api.fetch('/api/user/profile', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-lg">Loading...</div>
          <div className="text-sm text-zinc-400 mt-2">This may take a moment on first load</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}