import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Send, Shield, LogIn, UserPlus } from 'lucide-react';
import { toast } from '../components/Toast';
import { api } from '../utils/api';

export default function Pit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isProfessional, setIsProfessional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.fetch(`/api/pit/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, isProfessional })
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        setMessage('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
            <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
            <p className="text-zinc-400 mb-6">Your feedback has been delivered anonymously.</p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-all"
            >
              Send Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-purple-500 transition-all text-sm"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-all text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Anonymous Feedback</h1>
          <p className="text-zinc-400 text-sm sm:text-base">Share your honest thoughts. Your identity is protected.</p>
        </div>

        <div className="p-4 sm:p-6 md:p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your feedback here..."
                className="w-full h-40 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-zinc-900 border border-zinc-800 gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Professional Mode</h3>
                  <p className="text-xs sm:text-sm text-zinc-400">Let Gemini rewrite your feedback professionally</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfessional(!isProfessional)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isProfessional ? 'bg-purple-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isProfessional ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Anonymously
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Shield className="w-4 h-4" />
              <span>Sent Anonymously - No IP or personal data collected</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}