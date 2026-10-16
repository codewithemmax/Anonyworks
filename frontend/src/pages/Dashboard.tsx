import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Plus, Link, Copy, Eye, EyeOff, Clock, Trash2, StopCircle, Share2 } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../components/Toast';
import { useSessionLive } from '../hooks/useSessionLive';

interface SessionRecord {
  id: string;
  title: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  force_professional?: boolean;
  report_category?: string;
  case_status?: 'open' | 'under_review' | 'resolved';
  case_reference?: string;
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
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [showOriginal, setShowOriginal] = useState<{[key: number]: boolean}>({});
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('workplace_incident');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{type: 'end' | 'delete', sessionId: string} | null>(null);
  const navigate = useNavigate();


  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);


  const liveMessages = useSessionLive(selectedSession || undefined, messages);
  useEffect(() => {

    const fetchProfile = async () => {
      try {
        const response = await api.fetch('/api/user/profile');
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
          fetchSessions();
        }
      } catch (error) {
        console.error('Failed to fetch profile');
      }
    };

    fetchProfile();
  }, [navigate]);

  const fetchSessions = async () => {
    try {
      const response = await api.fetch('/api/user/sessions');
      const data = await response.json();
      const sessionList = data.sessions || data.pits || [];
      
      if (data.success) {
        setSessions(sessionList);
        if (sessionList.length > 0 && !selectedSession) {
          setSelectedSession(sessionList[0].id);
          fetchMessages(sessionList[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions');
    }
  };

  const createSession = async () => {
    if (showTitleInput) {
      if (isCreatingSession) return; // Prevent double clicks
      setIsCreatingSession(true);
      try {
        const response = await api.fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle, reportCategory })
        });
        const data = await response.json();
        const createdSessionId = data.sessionId || data.pitId;
        
        if (response.ok && data.success && createdSessionId) {
          fetchSessions();
          setSelectedSession(createdSessionId);
          fetchMessages(createdSessionId);
          setShowTitleInput(false);
          setNewTitle('');
          setReportCategory('workplace_incident');
        } else {
          toast.error(data.message || 'Failed to create session');
        }
      } catch (error) {
        toast.error('Failed to create session');
      } finally {
        setIsCreatingSession(false);
      }
    } else {
      setShowTitleInput(true);
    }
  };

  const updateCaseStatus = async (sessionId: string, status: SessionRecord['case_status']) => {
    try {
      const response = await api.fetch(`/api/session/${sessionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setSessions((current) => current.map((session) => (
          session.id === sessionId ? { ...session, case_status: data.status } : session
        )));
        toast.success('Case status updated');
      } else {
        toast.error(data.message || 'Failed to update case status');
      }
    } catch {
      toast.error('Failed to update case status');
    }
  };

  const toggleSessionProfessionalMode = async (sessionId: string, forceProfessional: boolean) => {
    try {
      const response = await api.fetch(`/api/session/${sessionId}/professional`, {
        method: 'PUT',
        body: JSON.stringify({ forceProfessional })
      });
      
      if (response.ok) {
        fetchSessions(); // Refresh sessions to show updated state
        toast.success(`Professional mode ${forceProfessional ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to update professional mode');
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const response = await api.fetch(`/api/session/${sessionId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages');
      setMessages([]);
    }
  };

  const copyLink = (sessionId: string) => {
    const url = `${window.location.origin}/session/${sessionId}`;
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

  const handleLogout = async () => {
    api.logout();
    navigate('/login');
  };

  const endSession = async (sessionId: string) => {
    try {
      const response = await api.fetch(`/api/session/${sessionId}/end`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Feedback session ended');
        fetchSessions();
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
      }
    } catch (error) {
      toast.error('Failed to end session');
    }
    setConfirmAction(null);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await api.fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Session deleted');
        fetchSessions();
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
      }
    } catch (error) {
      toast.error('Failed to delete session');
    }
    setConfirmAction(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const selectedSessionData = sessions.find((session) => session.id === selectedSession);

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex flex-row sm:flex-row justify-between items-center p-4 sm:p-6 max-w-7xl mx-auto border-b border-zinc-800 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">AnonyWorks</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-red-500 hover:text-red-500 transition-all text-sm sm:text-base"
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
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome, {user.name}!</h2>
          <p className="text-zinc-400">Manage your feedback sessions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sessions Sidebar */}
          <div className="lg:col-span-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-lg sm:text-xl font-bold">Your Sessions</h3>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                {showTitleInput && (
                  <>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Enter case title"
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none text-sm w-full"
                      onKeyPress={(e) => e.key === 'Enter' && createSession()}
                      autoFocus
                    />
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none text-sm w-full"
                    >
                      <option value="workplace_incident">Workplace incident</option>
                      <option value="harassment">Harassment or discrimination</option>
                      <option value="safety">Safety concern</option>
                      <option value="policy">Policy or ethics concern</option>
                    </select>
                  </>
                )}
                <button
                  onClick={createSession}
                  disabled={isCreatingSession}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  {isCreatingSession ? 'Creating...' : (showTitleInput ? 'Create' : 'New Session')}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p className="mb-4">No active sessions</p>
                  <button
                    onClick={createSession}
                    className="flex items-center text-white gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark transition-all mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Start Your First Session
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      setSelectedSession(session.id);
                      fetchMessages(session.id);
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedSession === session.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-zinc-800 bg-white/5 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium truncate">{session.title}</h4>
                      <div className="flex gap-1 items-center">
                        {user.user_type === 'company' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSessionProfessionalMode(session.id, true);
                            }}
                            className="p-1 rounded text-xs bg-purple-600 text-white"
                            title="Professional Mode Always On"
                          >
                            Pro
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyLink(session.id);
                          }}
                          className="p-1 hover:bg-zinc-700 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction({type: 'end', sessionId: session.id});
                          }}
                          className="p-1 hover:bg-orange-700 rounded text-orange-400"
                        >
                          <StopCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmAction({type: 'delete', sessionId: session.id});
                          }}
                          className="p-1 hover:bg-red-700 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeRemaining(session.expires_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 gap-2">
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {session.case_status?.replace('_', ' ') || 'open'}
                      </span>
                      {session.case_reference && <span className="text-xs text-zinc-500">{session.case_reference}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-2">
            {selectedSessionData ? (
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{selectedSessionData.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeRemaining(selectedSessionData.expires_at)}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <span className="text-zinc-400">Case status</span>
                        <select
                          value={selectedSessionData.case_status || 'open'}
                          onChange={(event) => updateCaseStatus(selectedSessionData.id, event.target.value as SessionRecord['case_status'])}
                          className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-purple-500"
                        >
                          <option value="open">Open</option>
                          <option value="under_review">Under review</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        {selectedSessionData.case_reference && (
                          <span className="text-xs text-zinc-500">{selectedSessionData.case_reference}</span>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2 items-center'>
                      <button
                        onClick={() => copyLink(selectedSessionData.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button className="flex items-center p-3 hover:bg-zinc-700 active:bg-zinc-900 rounded-lg" onClick={() => navigator.share({
                            title: "Anonyworks Session",
                            url: selectedSessionData.id
                          })}>
                        <Share2 className='w-5 h-5' />
                      </button>
                    </div>
                    
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-zinc-900 rounded-lg">
                    <Link className="w-4 h-4 text-zinc-400" />
                    <code className="text-sm text-zinc-300 sm:whitespace-nowrap">{window.location.origin}/session/{selectedSessionData.id}</code>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className='width-full justify-between flex items-center mb-4'>
                    <h3 className="text-xl font-bold">Messages ({liveMessages.length})</h3>
                    {liveMessages.length > 0 && (
                      <button 
                      onClick={() => navigate(`/view-message/${selectedSessionData.id}`)}
                        className='text-lg font-bold bg-primary hover:bg-primary-dark p-3 rounded-xl transition-all'
                      >
                        View Messages
                      </button>
                    )}
                  </div>
                  
                  {liveMessages.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <p>No messages yet. Share your pit link to start receiving feedback!</p>
                    </div>
                  ) : (
                    liveMessages.map((message) => (
                      <div 
                        key={message.id} 
                        onClick={() => navigate(`/view-message/${selectedSessionData.id}`)}
                        className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800 hover:border-purple-500 active:border-purple-800 transition-all cursor-pointer"
                      >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOriginal(message.id);
                              }}
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
                <p>Select a session to view messages</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {confirmAction.type === 'end' ? 'End Session?' : 'Delete Session?'}
            </h3>
            <p className="text-zinc-400 mb-6">
              {confirmAction.type === 'end' 
                ? 'This will stop accepting new messages but keep existing ones.' 
                : 'This will permanently delete the session and all messages.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAction.type === 'end' ? endSession(confirmAction.sessionId) : deleteSession(confirmAction.sessionId)}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  confirmAction.type === 'end' 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmAction.type === 'end' ? 'End Session' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}