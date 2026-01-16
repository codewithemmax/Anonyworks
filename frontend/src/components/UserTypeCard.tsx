import { motion } from 'framer-motion';
import type { LucideProps } from 'lucide-react';

interface UserTypeCardProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export default function UserTypeCard({ icon: Icon, title, description, selected, onClick }: UserTypeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }} // Added for better mobile/click feel
      onClick={onClick}
      className={`p-8 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
        selected
          ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(124,58,237,0.3)]'
          : 'border-zinc-800 bg-white/5 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]'
      }`}
    >
      {/* Icon color shifts based on selection */}
      <Icon 
        className={`w-12 h-12 mb-4 transition-colors ${
          selected ? 'text-purple-400' : 'text-zinc-500'
        }`} 
      />
      
      <h3 className={`text-2xl font-bold mb-2 transition-colors ${
        selected ? 'text-white' : 'text-zinc-200'
      }`}>
        {title}
      </h3>
      
      <p className="text-zinc-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}