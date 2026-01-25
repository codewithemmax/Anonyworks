import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, Eye, EyeOff, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserTypeCard from '../components/UserTypeCard';
import { toast } from '../components/Toast';
import { api } from '../utils/api';

type UserType = 'individual' | 'company' | null;

export default function Signup() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleNext = async () => {
    if (step === 1 && userType) {
      setStep(2);
    } else if (step === 2) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match!');
        return;
      }
      
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters!');
        return;
      }

      try {
        const response = await api.fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('OTP sent! Check your email.');
          setStep(3);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error('Failed to send OTP. Please try again.');
      }
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const response = await api.fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          userType,
          otp
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Account created successfully! Please login.');
        navigate('/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Account creation failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Join AnonyWorks</h1>
          <p className="text-zinc-400">Step {step} of 3</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <UserTypeCard
                icon={User}
                title="Individual"
                description="For personal use and individual feedback"
                selected={userType === 'individual'}
                onClick={() => setUserType('individual')}
              />
              <UserTypeCard
                icon={Building2}
                title="Company"
                description="For organizations and team collaboration"
                selected={userType === 'company'}
                onClick={() => setUserType('company')}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {userType === 'company' ? 'Organization Name' : 'Username'}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all"
                      placeholder={userType === 'company' ? 'Acme Corp' : 'johndoe'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto"
            >
              <div className="p-8 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800">
                <div className="text-center mb-6">
                  <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-zinc-400 text-sm">
                    We've sent a 6-digit code to {formData.email}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6}
                    className="w-full px-6 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Verify & Complete Signup
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => {
              if (step === 1) navigate('/');
              else if (step === 2) setStep(1);
              else setStep(2);
            }}
            className="px-6 py-3 rounded-lg border border-zinc-700 hover:border-purple-500 transition-all"
          >
            {step === 1 ? 'Back' : 'Previous'}
          </button>
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={step === 1 && !userType}
              className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {step === 2 ? 'Create Account' : 'Next'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}