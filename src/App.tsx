import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import FeatureCard from './components/FeatureCard';
import FeatureDetail from './components/FeatureDetail';
import AdminDashboard from './components/AdminDashboard';
import PlayStoreAssetDownloadCenter from './components/PlayStoreAssetDownloadCenter';
import TesterMatchHub from './components/TesterMatchHub';
import AppIconGuideModal from './components/AppIconGuideModal';
import AndroidBuildSyncGuideModal from './components/AndroidBuildSyncGuideModal';
import DailyFortuneView from './components/DailyFortuneView';
import { FEATURES } from './types';
import { Key, Shield, X, Eye, EyeOff, CheckCircle, AlertCircle, Cpu, Search, Smartphone, ArrowRight, Sun, Sparkles, Home } from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: 'fortune', label: '사주·운세·궁합' },
  { id: 'media', label: '음성·요약·글쓰기' },
  { id: 'travel', label: '여행·생활' },
  { id: 'business', label: '비즈니스·개발' }
];

export default function App() {
  const [activeId, setActiveId] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isIconGuideOpen, setIsIconGuideOpen] = useState(false);
  const [isBuildSyncGuideOpen, setIsBuildSyncGuideOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentBanner, setPaymentBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Catch PWA beforeinstallprompt event for 1-click install
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);
  
  // Load initial API key from localStorage
  const [savedApiKey, setSavedApiKey] = useState(() => {
    return localStorage.getItem('any1_custom_gemini_api_key') || '';
  });
  
  const [inputApiKey, setInputApiKey] = useState(savedApiKey);
  const [showKey, setShowKey] = useState(false);

  // Keep input synchronized if saved key changes
  useEffect(() => {
    setInputApiKey(savedApiKey);
  }, [savedApiKey]);

  // 1. Initial visitor tracking trigger (once per session)
  useEffect(() => {
    const hasLogged = sessionStorage.getItem('any1_session_logged');
    if (hasLogged) return;

    const logVisit = async () => {
      try {
        await fetch('/api/admin/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            referrer: document.referrer || 'Direct',
            featureAccess: 'Dashboard Home (최초 방문)'
          })
        });
        sessionStorage.setItem('any1_session_logged', 'true');
      } catch (err) {
        // Silent catch to prevent console errors
      }
    };

    const timer = setTimeout(logVisit, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Secret Admin Access via URL (?admin=true or ?admin=1) or hotkey (Ctrl+Shift+A) + Toss PG redirect handling
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || params.get('admin') === '1') {
        setActiveId('admin-dashboard');
      }

      const tossStatus = params.get('tossStatus');
      if (tossStatus === 'success') {
        const paymentKey = params.get('paymentKey');
        const orderId = params.get('orderId');
        const amount = params.get('amount');
        window.history.replaceState({}, document.title, window.location.pathname);

        if (paymentKey && orderId && amount) {
          fetch('/api/payments/toss-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) })
          })
            .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
            .then(({ ok, data }) => {
              if (ok && data.success) {
                setPaymentBanner({
                  type: 'success',
                  message: `카드/PG 결제가 최종 승인되었습니다! (주문번호: ${orderId})`
                });
              } else {
                setPaymentBanner({
                  type: 'error',
                  message: data.error || 'PG 결제 승인 확인 중 오류가 발생했습니다.'
                });
              }
            })
            .catch(() => {
              setPaymentBanner({
                type: 'error',
                message: 'PG 결제 승인 서버 통신 중 오류가 발생했습니다.'
              });
            });
        }
      } else if (tossStatus === 'fail') {
        const failMsg = params.get('message') || '결제가 취소되었거나 실패했습니다.';
        window.history.replaceState({}, document.title, window.location.pathname);
        setPaymentBanner({ type: 'error', message: failMsg });
      }
    } catch (e) {
      // Ignore if not supported
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveId(prev => (prev === 'admin-dashboard' ? 'dashboard' : 'admin-dashboard'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Active feature tracking trigger on navigation
  useEffect(() => {
    if (activeId && activeId !== 'dashboard' && activeId !== 'admin-dashboard') {
      const activeF = FEATURES.find(f => f.id === activeId);
      if (activeF) {
        fetch('/api/admin/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureAccess: `${activeF.title} (기능 화면 진입)`,
            referrer: 'Sidebar Navigation'
          })
        }).catch(err => console.warn(err));
      }
    }
  }, [activeId]);

  const activeFeature = FEATURES.find(f => f.id === activeId);

  const handleSaveKey = () => {
    const trimmed = inputApiKey.trim();
    if (trimmed) {
      localStorage.setItem('any1_custom_gemini_api_key', trimmed);
      setSavedApiKey(trimmed);
    } else {
      localStorage.removeItem('any1_custom_gemini_api_key');
      setSavedApiKey('');
    }
    setIsAuthModalOpen(false);
  };

  const handleClearKey = () => {
    localStorage.removeItem('any1_custom_gemini_api_key');
    setSavedApiKey('');
    setInputApiKey('');
    setIsAuthModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-bg-dark font-sans text-text-light selection:bg-neon selection:text-bg-dark">
      <Sidebar activeId={activeId} onSelect={setActiveId} />
      
      <main className="flex-grow flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-16 sm:h-20 border-b border-border-dark bg-bg-dark/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 sm:px-10 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${savedApiKey ? 'bg-neon' : 'bg-lime-400'}`} />
            <span className="text-xs font-black tracking-wider text-white flex items-center gap-2 truncate">
              ANY1 AI
              {savedApiKey ? (
                <span className="text-[10px] text-neon bg-neon/10 border border-neon/25 px-2 py-0.5 font-bold rounded shrink-0">개인 키 연결됨</span>
              ) : (
                <span className="text-[10px] text-lime-300 bg-lime-500/10 border border-lime-500/25 px-2 py-0.5 font-bold rounded shrink-0 hidden sm:inline-flex">
                  실시간 AI 서비스
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-2 sm:gap-3 text-[11px] font-bold items-center shrink-0">
            {activeId !== 'dashboard' && (
              <button
                onClick={() => setActiveId('dashboard')}
                className="px-3 py-1.5 text-text-light/80 hover:text-neon border border-border-dark hover:border-neon/40 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Home size={13} />
                <span>홈</span>
              </button>
            )}
            <button
              onClick={() => setActiveId('daily-fortune')}
              className="px-3 py-1.5 bg-neon/10 hover:bg-neon/20 text-neon border border-neon/30 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sun size={13} />
              <span>오늘의 운세</span>
            </button>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-3 py-1.5 transition-colors font-bold rounded-md flex items-center gap-1.5 border cursor-pointer ${
                savedApiKey 
                  ? 'bg-neon/10 text-neon border-neon/50 hover:bg-neon hover:text-bg-dark' 
                  : 'bg-white/5 text-text-light/75 border-border-dark hover:border-neon/40 hover:text-white'
              }`}
            >
              <Key size={12} />
              <span className="hidden sm:inline">{savedApiKey ? 'API 키 관리' : 'AI 설정'}</span>
            </button>
          </div>
        </header>
 
        {/* Payment Redirect Result Banner */}
        {paymentBanner && (
          <div
            className={`mx-6 mt-4 px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              paymentBanner.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-red-500/15 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {paymentBanner.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span>{paymentBanner.message}</span>
            </div>
            <button
              onClick={() => setPaymentBanner(null)}
              className="text-white/60 hover:text-white cursor-pointer"
              aria-label="배너 닫기"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            {activeId === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1"
              >
                {/* Hero section */}
                <section className="px-6 sm:px-10 py-10 sm:py-14 border-b border-border-dark flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="max-w-3xl">
                    <span className="text-[11px] tracking-[0.2em] font-bold text-neon uppercase mb-3 block">
                      한국형 정밀 만세력 · AI 성우 · 실생활 비서
                    </span>
                    <h1 className="text-5xl sm:text-7xl lg:text-[84px] leading-[0.9] font-black italic tracking-tighter uppercase mb-5">
                      ANY1 <span className="text-neon">AI</span>
                    </h1>
                    <p className="text-text-light/70 text-sm sm:text-base max-w-xl leading-relaxed font-medium mb-6">
                      천문 만세력 기반 오늘의 운세·궁합·정밀 사주·작명부터 AI 성우 음성 낭독, 쉬운 문서 요약과 맞춤 여행 비서까지 누구나 바로 쓸 수 있는 실용 AI 플랫폼입니다.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveId('daily-fortune')}
                        className="px-5 py-3 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(0,243,255,0.28)] flex items-center gap-2 cursor-pointer"
                      >
                        <Sun size={15} />
                        <span>오늘의 운세 &amp; 궁합 바로 보기</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveId('saju')}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white border border-border-dark hover:border-neon/50 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={15} className="text-neon" />
                        <span>평생 정밀 사주 보기</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0 self-center md:self-auto">
                    <img 
                      src="/icon.svg" 
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl shadow-[0_0_50px_rgba(0,243,255,0.25)] border border-white/10" 
                      alt="ANY1 AI" 
                    />
                  </div>
                </section>
 
                {/* 14-Day Tester Mutual Match Promotion Banner */}
                <div className="mx-6 sm:mx-10 my-6 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-bg-card to-blue-950/40 border border-neon/30 shadow-[0_0_25px_rgba(0,243,255,0.12)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neon text-bg-dark flex items-center justify-center font-black shrink-0 shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-neon font-bold tracking-widest uppercase bg-neon/15 px-2 py-0.5 rounded border border-neon/30">
                          NEW ENGINE
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-white">
                          테스터 매칭 마이페이지 & 14일 자동 품앗이 센터
                        </h2>
                      </div>
                      <p className="text-xs text-text-light/70 max-w-2xl leading-relaxed">
                        개인 개발자 12명 14일 비공개 테스트 규정 완벽 대응! 내 앱을 30초 만에 등록하고, 동료 개발자의 앱 일일 실행 체크리스트를 한눈에 관리하세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveId('tester-hub')}
                      className="w-full sm:w-auto px-5 py-3 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>테스터 매칭 마이페이지 바로가기</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Category Filter and Quick Search Controls */}
                <div className="px-10 py-6 border-b border-border-dark bg-white/[0.01] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {CATEGORY_TABS.map((tab) => {
                      const count = tab.id === 'all' 
                        ? FEATURES.length 
                        : FEATURES.filter(f => f.category === tab.id).length;
                      const isActive = selectedCategory === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setSelectedCategory(tab.id)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5 border ${
                            isActive
                              ? 'bg-neon text-bg-dark border-neon shadow-[0_0_12px_rgba(0,243,255,0.25)]'
                              : 'bg-bg-dark text-text-light/50 border-border-dark hover:border-neon/40 hover:text-white'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                            isActive ? 'bg-bg-dark text-neon' : 'bg-white/5 text-text-light/40'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[240px] max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="기능 및 키워드 검색..."
                      className="w-full bg-bg-dark border border-border-dark pl-9 pr-3 py-2 text-xs text-text-light placeholder:text-text-light/25 font-mono outline-none focus:border-neon rounded-sm"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-light/40 hover:text-neon"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid Section */}
                {(() => {
                  const filtered = FEATURES.filter(feature => {
                    const matchesCat = 
                      selectedCategory === 'all' 
                        ? true 
                        : feature.category === selectedCategory;

                    const matchesSearch = 
                      searchQuery.trim() === ''
                        ? true
                        : (
                            feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            feature.suggestions.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                          );

                    return matchesCat && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-16 text-center border-b border-border-dark">
                        <p className="text-text-light/40 text-sm mb-4 font-mono">
                          검색어 "{searchQuery}"에 해당하는 AI 기능이 없습니다.
                        </p>
                        <button
                          onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                          className="px-4 py-2 bg-neon/10 border border-neon/30 text-neon text-xs font-bold uppercase rounded-sm hover:bg-neon hover:text-bg-dark transition-all"
                        >
                          전체 기능 보기
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-b border-border-dark">
                      {filtered.map((feature, idx) => (
                        <motion.div
                          key={feature.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.015 }}
                          className="border border-border-dark -ml-[1px] -mt-[1px]"
                        >
                          <FeatureCard 
                            feature={feature} 
                            onClick={(id) => setActiveId(id)} 
                          />
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}

                {/* Footer Section */}
                <footer className="mt-auto py-6 border-t border-border-dark flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-10 text-[11px] text-text-light/40">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-text-light/60">any1.ai</span>
                    <span>&copy; 2026 All rights reserved.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <a 
                      href="/privacy.html" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-neon/80 hover:text-neon underline underline-offset-4 transition-colors"
                    >
                      개인정보처리방침 (Privacy Policy)
                    </a>
                    <span className="text-text-light/20">|</span>
                    <span>문의: tolgate3803@gmail.com</span>
                    <span className="text-text-light/20">|</span>
                    <span 
                      onClick={() => setActiveId('admin-dashboard')}
                      className="text-neon/60 font-mono text-[10px] cursor-pointer hover:text-neon transition-colors select-none"
                      title="Admin Operations"
                    >
                      v1.0.0 Stable
                    </span>
                  </div>
                </footer>
              </motion.div>
            ) : activeId === 'daily-fortune' ? (
              <motion.div
                key="daily-fortune"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                className="p-6 sm:p-10 flex-grow"
              >
                <DailyFortuneView onOpenFullSaju={() => setActiveId('saju')} />
              </motion.div>
            ) : activeId === 'tester-hub' ? (
              <motion.div
                key="tester-hub"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                className="flex-grow flex flex-col"
              >
                <TesterMatchHub
                  onBackToDashboard={() => setActiveId('dashboard')}
                  onOpenBuildSyncGuide={() => setIsBuildSyncGuideOpen(true)}
                />
              </motion.div>
            ) : activeId === 'admin-dashboard' ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="p-6 md:p-10 flex-grow"
              >
                <AdminDashboard
                  onBack={() => setActiveId('dashboard')}
                  onOpenIconGuide={() => setIsIconGuideOpen(true)}
                  onOpenBuildSync={() => setIsBuildSyncGuideOpen(true)}
                  onOpenAssets={() => setIsAssetModalOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="p-10 flex-grow"
              >
                {activeFeature && (
                  <FeatureDetail 
                    featureId={activeFeature.id}
                    title={activeFeature.title}
                    description={activeFeature.description}
                    suggestions={activeFeature.suggestions}
                    customApiKey={savedApiKey}
                    onApiKeyChange={(key) => {
                      if (key) {
                        localStorage.setItem('any1_custom_gemini_api_key', key);
                        setSavedApiKey(key);
                      } else {
                        localStorage.removeItem('any1_custom_gemini_api_key');
                        setSavedApiKey('');
                      }
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Authorize Settings Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-bg-dark border border-border-dark p-6 rounded shadow-2xl z-10 font-mono"
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-neon uppercase tracking-widest font-black flex items-center gap-1.5 mb-1">
                    <Shield size={12} /> AI 엔진 설정
                  </span>
                  <h3 className="text-lg font-black text-text-light tracking-wide">
                    AI 서비스 연결 관리 (선택 사항)
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-text-light/40 hover:text-neon transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Indicator */}
              <div className="mb-6 p-4 border border-border-dark/80 bg-white/[0.01] rounded-sm text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-light/40 font-bold uppercase">현재 연결 상태:</span>
                  {savedApiKey ? (
                    <span className="text-[10px] px-2 py-0.5 bg-neon/15 border border-neon/30 text-neon font-black rounded-sm flex items-center gap-1">
                      <Cpu size={10} /> 개인 키 연결됨
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-lime-500/15 border border-lime-500/30 text-lime-400 font-black rounded-sm flex items-center gap-1">
                      <CheckCircle size={10} /> 기본 AI 서비스 가동 중
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-light/70 leading-relaxed font-sans">
                  {savedApiKey ? (
                    "입력하신 개인 Gemini API 키로 모든 AI 기능이 연결되어 있습니다."
                  ) : (
                    "별도 설정 없이도 오늘의 운세·정밀 사주·궁합·작명·성우 음성 변환 등 모든 기본 기능을 바로 이용하실 수 있습니다. 개인 Gemini API 키가 있으신 경우 아래에 선택 등록할 수 있습니다."
                  )}
                </p>
              </div>

              {/* Input section */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-light/60 flex items-center justify-between">
                    <span>Personal Gemini API Key</span>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-neon hover:underline text-[9px] lowercase tracking-normal"
                    >
                      Get key from Google AI Studio ↗
                    </a>
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-bg-dark border border-border-dark px-4 py-3 text-xs text-text-light placeholder:text-text-light/20 outline-none focus:border-neon font-mono rounded-sm pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/30 hover:text-neon transition-colors"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 border border-yellow-500/15 bg-yellow-500/[0.02] text-[10.5px] text-yellow-500/75 leading-relaxed font-sans rounded-sm space-y-1">
                  <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <AlertCircle size={12} className="shrink-0" /> 클라이언트 사이드 보안 안내
                  </div>
                  <p>
                    입력하신 개인 키는 서버의 데이터베이스에 절대 저장되거나 영구 기록되지 않습니다. 브라우저의 전용 안전 영역(<code className="bg-white/5 px-1 font-mono text-[9px]">localStorage</code>)에 암호화 보관되며, AI 서비스 호출 시에만 종단간 보안 통신망(HTTPS)을 통해 일회성으로 안전하게 연동됩니다.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  {savedApiKey && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="flex-1 py-3 border border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all rounded-sm uppercase tracking-wider"
                    >
                      Clear Key
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="flex-1 py-3 bg-neon text-bg-dark hover:bg-white text-xs font-black transition-all rounded-sm uppercase tracking-widest"
                  >
                    Save & Activate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Play Store Assets Download Modal */}
      <AnimatePresence>
        {isAssetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssetModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#080b11] border border-border-dark p-6 sm:p-8 rounded-2xl shadow-2xl z-10 custom-scrollbar my-auto"
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon" />

              <div className="flex justify-between items-start mb-6 pb-4 border-b border-border-dark">
                <div>
                  <span className="text-[10px] text-neon uppercase tracking-widest font-black flex items-center gap-1.5 mb-1">
                    <Shield size={12} /> Google Play Console Asset Package
                  </span>
                  <h3 className="text-xl font-black text-white tracking-wide">
                    구글 플레이 스토어 필수 그래픽 에셋 다운로드 센터
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAssetModalOpen(false)}
                  className="text-text-light/50 hover:text-neon transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <PlayStoreAssetDownloadCenter onClose={() => setIsAssetModalOpen(false)} isModal={true} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Icon Alignment Guide Modal */}
      <AppIconGuideModal
        isOpen={isIconGuideOpen}
        onClose={() => setIsIconGuideOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Android Studio & Play Console Build Sync Guide Modal */}
      <AndroidBuildSyncGuideModal
        isOpen={isBuildSyncGuideOpen}
        onClose={() => setIsBuildSyncGuideOpen(false)}
      />
    </div>
  );
}
