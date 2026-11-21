import { ArrowRight } from 'lucide-react';
import { Feature } from '../types';
import { motion } from 'motion/react';

interface FeatureCardProps {
  feature: Feature;
  onClick: (id: string) => void;
}

export default function FeatureCard({ feature, onClick }: FeatureCardProps) {
  const isAlwaysFree = feature.id === 'daily-fortune';

  return (
    <motion.button
      whileHover={{ y: -2, x: 2, transition: { duration: 0.1 } }}
      onClick={() => onClick(feature.id)}
      className="bg-bg-dark p-6 border border-border-dark hover:border-neon transition-all text-left group flex flex-col h-full relative overflow-hidden cursor-pointer"
    >
      <div className="flex justify-between items-start mb-8 gap-2">
        <div className="text-neon group-hover:scale-110 transition-transform">
          <feature.icon size={24} strokeWidth={1.5} />
        </div>
        {isAlwaysFree ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shrink-0">
            상시 무료
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300/90 border border-amber-400/30 shrink-0">
            무료 3회 체험 · PRO
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-black uppercase tracking-tight text-text-light mb-3 group-hover:text-neon transition-colors leading-none">
        {feature.title}
      </h3>
      <p className="text-text-light/40 text-[10px] leading-relaxed flex-grow font-medium uppercase tracking-wide">
        {feature.description}
      </p>

      <div className="mt-6 flex justify-between items-center pt-4 border-t border-border-dark">
        <span className="text-[10px] font-bold text-text-light/40 group-hover:text-neon/80 transition-colors">
          {isAlwaysFree ? '누구나 바로 무료 이용' : '무료 체험 후 유료 전환'}
        </span>
        <ArrowRight size={14} className="text-neon translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
      </div>
    </motion.button>
  );
}
