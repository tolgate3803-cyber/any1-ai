import { motion } from 'motion/react';
import { SIDEBAR_ITEMS } from '../types';
import { User } from 'lucide-react';

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ activeId, onSelect }: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-bg-dark border-r border-border-dark flex flex-col overflow-y-auto sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <img src="/icon.svg" className="w-10 h-10 rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.25)] border border-white/10" alt="ANY1 AI Logo" />
          <div className="flex flex-col">
            <span className="text-[9px] tracking-[0.25em] font-bold text-neon uppercase leading-none mb-1">AI 생활 플랫폼</span>
            <h1 className="text-lg font-black italic tracking-tighter leading-none">ANY1 AI</h1>
          </div>
        </div>

        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[11px] font-bold tracking-wider transition-all ${
                  isActive
                    ? 'bg-neon text-bg-dark shadow-[0_0_12px_rgba(0,243,255,0.25)]'
                    : 'text-text-light/60 hover:text-neon hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <item.icon size={14} />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border-dark space-y-4">
        <div 
          onClick={() => onSelect('admin-dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          title="관리자 콘솔"
        >
          <div className="w-8 h-8 border border-neon/50 rounded-full flex items-center justify-center group-hover:bg-neon/10 transition-colors">
            <User size={14} className="text-neon" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-text-light group-hover:text-neon transition-colors">Any1 AI 회원</span>
            <span className="text-[9px] text-neon/70">서비스 정상 가동 중</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border-dark/60 flex flex-col gap-1.5 text-[10px]">
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-light/50 hover:text-neon underline transition-colors flex items-center gap-1.5"
          >
            <span>📜 개인정보처리방침</span>
          </a>
          <span className="text-text-light/30 text-[9px]">문의: tolgate3803@gmail.com</span>
        </div>
      </div>
    </aside>
  );
}
