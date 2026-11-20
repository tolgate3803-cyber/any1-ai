import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Download, CheckCircle2, ArrowRight, Sparkles, RefreshCw, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface AppIconGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export default function AppIconGuideModal({ isOpen, onClose, deferredPrompt }: AppIconGuideModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'phone' | 'androidStudio'>('phone');

  if (!isOpen) return null;

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          onClose();
        }
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    } else {
      // Fallback guide
      alert(
        '크롬 브라우저 오른쪽 상단 [⋮] (점 3개) 메뉴를 누른 후\n[앱 설치] 또는 [홈 화면에 추가]를 선택하시면 고화질 네온 아이콘으로 등록됩니다!'
      );
    }
  };

  const handleDownloadIcon = async (filename: string, url: string) => {
    try {
      setDownloadSuccess(true);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch {
      window.open(url, '_blank');
      setDownloadSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#070a0f] border border-cyan-500/30 p-6 sm:p-8 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.15)] z-10 custom-scrollbar my-auto text-text-light"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon" />

        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-border-dark">
          <div>
            <span className="text-[10px] text-neon uppercase tracking-widest font-black flex items-center gap-1.5 mb-1">
              <Sparkles size={12} /> App Icon Alignment Guide
            </span>
            <h3 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              <span>홈 화면 아이콘 일치 가이드</span>
              <span className="text-xs font-normal text-text-light/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                회색 'R' ➜ Any1 AI 네온 구체 로고
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-light/50 hover:text-neon transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visual Comparison: What Happened */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/20 via-bg-card to-cyan-950/20 border border-white/10 mb-6">
          <div className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-400" />
            왜 홈 화면에 회색 'R' 글자가 나왔을까요?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before (What happened) */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-red-500/30 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-zinc-700 flex items-center justify-center font-bold text-2xl text-zinc-300 relative shrink-0 shadow-inner">
                R
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white p-0.5 shadow flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-red-500" />
                </div>
              </div>
              <div>
                <div className="text-xs font-black text-red-400 mb-0.5">현재: 임시 북마크 바로가기</div>
                <p className="text-[11px] text-text-light/60 leading-tight">
                  구글 클라우드런 도메인(<span className="text-zinc-300">.run.app</span>)의 'R'을 첫 글자로 임시 생성한 일반 웹 북마크입니다.
                </p>
              </div>
            </div>

            {/* Target (What we want) */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-neon/40 flex items-center gap-3.5 shadow-[0_0_15px_rgba(0,243,255,0.1)]">
              <div className="w-14 h-14 rounded-2xl bg-black border border-neon/50 flex items-center justify-center relative shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                <img src="/icon.svg" alt="Any1 AI Official Icon" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-xs font-black text-neon mb-0.5">목표: Any1 AI 정식 네온 로고</div>
                <p className="text-[11px] text-text-light/80 leading-tight">
                  크롬 딱지 없이 실제 플레이스토어 앱처럼 고화질 네온 구체 로고로 깔끔하게 실행됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border-dark mb-6">
          <button
            onClick={() => setActiveTab('phone')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'phone'
                ? 'border-neon text-neon'
                : 'border-transparent text-text-light/40 hover:text-text-light'
            }`}
          >
            <Smartphone size={16} />
            <span>1. 스마트폰 홈 화면 아이콘 교체 (10초 완료)</span>
          </button>
          <button
            onClick={() => setActiveTab('androidStudio')}
            className={`pb-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'androidStudio'
                ? 'border-neon text-neon'
                : 'border-transparent text-text-light/40 hover:text-text-light'
            }`}
          >
            <Layers size={16} />
            <span>2. 안드로이드 스튜디오(APK) 아이콘 교체</span>
          </button>
        </div>

        {/* Tab Content: Smartphone Home Screen */}
        {activeTab === 'phone' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <span className="w-5 h-5 rounded-full bg-neon/20 text-neon flex items-center justify-center text-[11px] border border-neon/40">1</span>
                스마트폰에서 기존 회색 'R' 아이콘 삭제
              </div>
              <p className="text-xs text-text-light/70 pl-7 leading-relaxed">
                현재 갤럭시 Z 폴드6 홈 화면(Microsoft 앱 폴더 안)에 생성된 <strong className="text-white">회색 [R] Any1 AI 아이콘</strong>을 
                손가락으로 1초간 꾹 눌러 <strong className="text-red-400">[홈 화면에서 삭제]</strong>를 누릅니다.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <span className="w-5 h-5 rounded-full bg-neon/20 text-neon flex items-center justify-center text-[11px] border border-neon/40">2</span>
                크롬 새로고침 후 정식 고화질 [앱 설치] 진행
              </div>
              <p className="text-xs text-text-light/70 pl-7 leading-relaxed">
                방금 시스템에 고화질 전용 앱 아이콘 세트를 완벽 등록했습니다. 
                크롬 화면을 <strong>새로고침(F5 또는 위에서 아래로 당기기)</strong>한 후, 
                아래 버튼을 누르거나 크롬 오른쪽 상단 <strong className="text-neon">[⋮] 점 3개 메뉴 ➜ [앱 설치]</strong>를 터치합니다.
              </p>
            </div>

            {/* Direct Action Box */}
            <div className="p-5 rounded-2xl bg-cyan-950/30 border border-neon/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-black border border-neon/50 p-1 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                  <img src="/icon.svg" alt="Any1 AI" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">정식 네온 로고로 홈 화면에 설치</div>
                  <div className="text-[11px] text-neon/80">크롬 딱지 없는 풀스크린 독립형 WebAPK 모드로 실행됩니다.</div>
                </div>
              </div>
              <button
                onClick={handlePwaInstall}
                className="w-full sm:w-auto px-6 py-3 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Smartphone size={16} />
                <span>홈 화면에 네온 앱 설치하기</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Android Studio APK Icon */}
        {activeTab === 'androidStudio' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <span className="w-5 h-5 rounded-full bg-neon/20 text-neon flex items-center justify-center text-[11px] border border-neon/40">1</span>
                고화질 512x512 정식 앱 아이콘(PNG) 다운로드
              </div>
              <p className="text-xs text-text-light/70 pl-7 leading-relaxed">
                안드로이드 스튜디오와 구글 플레이 콘솔에 등록할 정식 512x512 고해상도 투명 배경 PNG 아이콘을 다운로드합니다.
              </p>
              <div className="pl-7">
                <button
                  onClick={() => handleDownloadIcon('icon.png', '/icon.png')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2 border border-white/20 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{downloadSuccess ? '다운로드 완료!' : 'icon.png (512x512) 다운로드'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <span className="w-5 h-5 rounded-full bg-neon/20 text-neon flex items-center justify-center text-[11px] border border-neon/40">2</span>
                안드로이드 스튜디오에서 1초 만에 아이콘 적용하기
              </div>
              <div className="pl-7 text-xs text-text-light/70 space-y-1.5 leading-relaxed font-mono">
                <div>1. 안드로이드 스튜디오 상단 메뉴에서 <span className="text-neon font-bold">File ➜ New ➜ Image Asset</span> 클릭</div>
                <div>2. <span className="text-white">Asset Type</span>을 <span className="text-neon font-bold">Image</span>로 선택</div>
                <div>3. <span className="text-white">Path</span>에 방금 다운로드한 <span className="text-neon">icon.png</span> 파일 지정</div>
                <div>4. 하단 <span className="text-white font-bold">[Next]</span> ➜ <span className="text-neon font-bold">[Finish]</span> 누르면 끝!</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-lime-400 shrink-0" />
              <div className="text-xs text-lime-200">
                이렇게 적용 후 AAB를 빌드하면 스마트폰에 설치할 때도 기본 안드로이드 로봇이 아닌 <strong>Any1 AI 네온 구체 로고</strong>로 설치됩니다!
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border-dark flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
