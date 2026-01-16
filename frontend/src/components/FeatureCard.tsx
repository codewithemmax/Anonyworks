import { motion } from 'framer-motion';
import type { LucideProps } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-zinc-800 hover:border-purple-500/50 transition-all"
    >
      <Icon className="w-12 h-12 text-primary mb-4" />
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </motion.div>
  );
}
