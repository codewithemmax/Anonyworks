import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.fetch('/api/user/profile');
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch profile');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-zinc-800">
        <h1 className="text-2xl font-bold text-primary">AnonyWorks</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-red-500 hover:text-red-500 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
          <h2 className="text-3xl font-bold mb-6">Welcome, {user.name}!</h2>
          
          <div className="space-y-4 text-zinc-400">
            <p><span className="text-white font-medium">Email:</span> {user.email}</p>
            <p><span className="text-white font-medium">Account Type:</span> {user.user_type}</p>
            <p><span className="text-white font-medium">Verified:</span> {user.is_verified ? '✅ Yes' : '❌ No'}</p>
            <p><span className="text-white font-medium">Member Since:</span> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-8 p-6 rounded-xl bg-purple-500/10 border border-purple-500/50">
          <h3 className="text-xl font-bold mb-2">🎉 Authentication Working!</h3>
          <p className="text-zinc-400">
            Your JWT token is stored in localStorage and automatically sent with protected API requests.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
