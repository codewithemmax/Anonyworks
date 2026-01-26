import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Clock, Sparkles } from 'lucide-react';
import { api } from '../utils/api';
import { usePitLive } from '../hooks/usePitLive';

interface Message {
  id: number;
  original_message: string;
  processed_message: string;
  is_professional: boolean;
  created_at: string;
}

export default function ViewMessage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loading, setLoading] = useState(true);
  // Inside your ViewMessage component
  const { pitId } = useParams<{ pitId: string }>();

  // 1. Rename your fetched state to 'history' or keep as is
  const [messages, setMessages] = useState<Message[]>([]);

  // 2. Add the live hook. It will manage the "real-time" version of the array.
  const liveMessages = usePitLive(pitId, messages);

  // 3. Update your 'currentMessage' reference to use the live array
  const currentMessage = liveMessages[currentIndex];

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchMessages();
  }, [pitId, navigate]);

  const fetchMessages = async () => {
    try {
      const response = await api.fetch(`/api/pit/${pitId}/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const nextMessage = () => {
    if (currentIndex < liveMessages.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowOriginal(false);
    }
  };

  const prevMessage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowOriginal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading Messages...</div>
      </div>
    );
  }

  if (liveMessages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Messages Yet</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-b border-zinc-800 gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h1 className="text-lg sm:text-xl font-bold text-center">Message {currentIndex + 1} of {liveMessages.length}</h1>

        {currentMessage?.is_professional && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all text-sm"
          >
            {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showOriginal ? 'Original' : 'Professional'}
          </button>
        )}
      </div>

      {/* Large Message Display */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${showOriginal}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl text-center"
          >
            <div className="p-6 sm:p-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-zinc-800">
              {/* Badges */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                {currentMessage.is_professional && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                    <Sparkles className="w-4 h-4" />
                    Professional Mode
                  </div>
                )}
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Clock className="w-4 h-4" />
                  {new Date(currentMessage.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Large Text */}
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-light leading-relaxed text-white break-words">
                {showOriginal ? currentMessage.original_message : (currentMessage.processed_message || currentMessage.original_message)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 border-t border-zinc-800 gap-4">
        <button
          onClick={prevMessage}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-all text-sm sm:text-base order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Progress Dots */}
        <div className="flex gap-2 order-1 sm:order-2 overflow-x-auto max-w-full px-2">
          {liveMessages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all flex-shrink-0 ${
                index === currentIndex ? 'bg-purple-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextMessage}
          disabled={currentIndex === liveMessages.length - 1}
          className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-all text-sm sm:text-base order-3"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}