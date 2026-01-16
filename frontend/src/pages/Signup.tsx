import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserTypeCard from '../components/UserTypeCard';

type UserType = 'individual' | 'company' | null;

export default function Signup() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleNext = async () => {
    if (step === 1 && userType) {
      setStep(2);
    } else if (step === 2) {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            userType
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Account created! Check console for OTP (email integration pending)');
          navigate('/login');
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert('Signup failed. Please try again.');
      }
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
          <p className="text-zinc-400">Step {step} of 2</p>
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
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-purple-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => step === 1 ? navigate('/') : setStep(1)}
            className="px-6 py-3 rounded-lg border border-zinc-700 hover:border-purple-500 transition-all"
          >
            {step === 1 ? 'Back' : 'Previous'}
          </button>
          <button
            onClick={handleNext}
            disabled={step === 1 && !userType}
            className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {step === 2 ? 'Create Account' : 'Next'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
