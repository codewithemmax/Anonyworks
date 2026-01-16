import { motion } from 'framer-motion';
import { Shield, MessageSquare, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FeatureCard from '../components/FeatureCard';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-primary">AnonyWorks</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-lg border border-zinc-700 hover:border-purple-500 transition-all"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark transition-all"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-6 py-20 text-center"
      >
        <h1 className="text-6xl font-bold mb-6">
          The bridge for honest,
          <br />
          <span className="text-primary">anonymous feedback</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
          Empower your team with truly anonymous feedback powered by AI scrubbing technology
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon={Shield}
            title="True Anonymity"
            description="Your identity is protected with military-grade encryption and AI-powered content scrubbing"
          />
          <FeatureCard
            icon={MessageSquare}
            title="Gemini-Powered Scrubbing"
            description="Advanced AI removes identifying information while preserving the essence of your feedback"
          />
          <FeatureCard
            icon={BarChart}
            title="Actionable Insights"
            description="Transform anonymous feedback into meaningful data-driven decisions for your organization"
          />
        </div>
      </motion.div>
    </div>
  );
}
