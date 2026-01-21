import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus, Link, Copy, Eye, EyeOff, Clock  } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../components/Toast';

interface Pit {
  id: string;
  title: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

interface Message {
  id: number;
  original_message: string;
  processed_message: string;
  is_professional: boolean;
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [pits, setPits] = useState<Pit[]>([]);
  const [selectedPit, setSelectedPit] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showOriginal, setShowOriginal] = useState<{[key: number]: boolean}>({});
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
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
          fetchPits();
        }
      } catch (error) {
        console.error('Failed to fetch profile');
      }
    };

    fetchProfile();
  }, [navigate]);

  const fetchPits = async () => {
    try {
      const response = await api.fetch('/api/user/pits');
      const data = await response.json();
      
      if (data.success) {
        setPits(data.pits);
        if (data.pits.length > 0 && !selectedPit) {
          setSelectedPit(data.pits[0].id);
          fetchMessages(data.pits[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pits');
    }
  };

  const createPit = async () => {
    if (showTitleInput) {
      try {
        const response = await api.fetch('/api/pit/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle })
        });
        const data = await response.json();
        
        if (data.success) {
          fetchPits();
          setSelectedPit(data.pitId);
          fetchMessages(data.pitId);
          setShowTitleInput(false);
          setNewTitle('');
        }
      } catch (error) {
        toast.error('Failed to create pit');
      }
    } else {
      setShowTitleInput(true);
    }
  };

  const fetchMessages = async (pitId: string) => {
    try {
      const response = await api.fetch(`/api/pit/${pitId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
      setMessages([]);
    }
  };

  const copyLink = (pitId: string) => {
    const url = `${window.location.origin}/pit/${pitId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const toggleOriginal = (messageId: number) => {
    setShowOriginal(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

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

  const selectedPitData = pits.find(p => p.id === selectedPit);

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
        className="max-w-7xl mx-auto px-6 py-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user.name}!</h2>
          <p className="text-zinc-400">Manage your feedback pits</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pits Sidebar */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Your Pits</h3>
              <div className="flex flex-col gap-2">
                {showTitleInput && (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter pit title"
                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && createPit()}
                    autoFocus
                  />
                )}
                <button
                  onClick={createPit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {showTitleInput ? 'Create' : 'New Pit'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {pits.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p className="mb-4">No active pits</p>
                  <button
                    onClick={createPit}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark transition-all mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Start Your First Pit
                  </button>
                </div>
              ) : (
                pits.map((pit) => (
                  <div
                    key={pit.id}
                    onClick={() => {
                      setSelectedPit(pit.id);
                      fetchMessages(pit.id);
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedPit === pit.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-zinc-800 bg-white/5 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium truncate">{pit.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(pit.id);
                        }}
                        className="p-1 hover:bg-zinc-700 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeRemaining(pit.expires_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2">
            {selectedPitData ? (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{selectedPitData.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeRemaining(selectedPitData.expires_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyLink(selectedPitData.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-zinc-900 rounded-lg">
                    <Link className="w-4 h-4 text-zinc-400" />
                    <code className="text-sm text-zinc-300">{window.location.origin}/pit/{selectedPitData.id}</code>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className='width-full justify-between flex items-center mb-4'>
                    <h3 className="text-xl font-bold">Messages ({messages.length})</h3>
                    {messages.length > 0 && (
                      <button 
                        onClick={() => navigate(`/view-message/${selectedPitData.id}`)}
                        className='text-lg font-bold bg-primary hover:bg-primary-dark p-2 rounded-xl transition-all'
                      >
                        View Messages
                      </button>
                    )}
                  </div>
                  
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <p>No messages yet. Share your pit link to start receiving feedback!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800 hover:border-purple-500 active:border-purple-800 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            {message.is_professional && (
                              <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                                Professional Mode
                              </span>
                            )}
                            <span className="text-xs text-zinc-400">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          {message.is_professional && (
                            <button
                              onClick={() => toggleOriginal(message.id)}
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all text-sm"
                            >
                              {showOriginal[message.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              {showOriginal[message.id] ? 'Hide Original' : 'View Original'}
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-zinc-400 mb-2">
                              {message.is_professional ? 'Professional Version:' : 'Message:'}
                            </h4>
                            <p className="text-white">{message.processed_message || message.original_message}</p>
                          </div>
                          
                          {showOriginal[message.id] && message.is_professional && (
                            <div>
                              <h4 className="text-sm font-medium text-zinc-400 mb-2">Original Message:</h4>
                              <p className="text-zinc-300 italic">{message.original_message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-400">
                <p>Select a pit to view messages</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}