import { ArrowRight } from 'lucide-react';
import { Feature } from '../types';
import { motion } from 'motion/react';

interface FeatureCardProps {
  feature: Feature;
  onClick: (id: string) => void;
}

export default function FeatureCard({ feature, onClick }: FeatureCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2, x: 2, transition: { duration: 0.1 } }}
      onClick={() => onClick(feature.id)}
      className="bg-bg-dark p-6 border border-border-dark hover:border-neon transition-all text-left group flex flex-col h-full relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="text-neon group-hover:scale-110 transition-transform">
          <feature.icon size={24} strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-bold text-neon opacity-40 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
          Init
        </span>
      </div>
      
      <h3 className="text-lg font-black uppercase tracking-tight text-text-light mb-3 group-hover:text-neon transition-colors leading-none">
        {feature.title}
      </h3>
      <p className="text-text-light/40 text-[10px] leading-relaxed flex-grow font-medium uppercase tracking-wide">
        {feature.description}
      </p>

      <div className="mt-6 flex justify-between items-center pt-4 border-t border-border-dark">
        <span className="text-[9px] font-black text-text-light/20 uppercase tracking-[0.2em]">0{Math.floor(Math.random() * 9 + 1)} / STREAM</span>
        <ArrowRight size={14} className="text-neon translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
      </div>
    </motion.button>
  );
}
