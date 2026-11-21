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
import AdBillboard from './components/AdBillboard';
import SiteMembershipCheckoutModal from './components/SiteMembershipCheckoutModal';
import { FEATURES } from './types';
import {
  fetchMembershipStatus,
  notifyMembershipChanged,
  setStoredMembershipOrderId,
  TrialStatus
} from './utils/membershipClient';
import { Key, Shield, X, Eye, EyeOff, CheckCircle, AlertCircle, Cpu, Search, Sun, Sparkles, Home, Lock, Unlock, CreditCard, Crown } from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: 'fortune', label: '사주·운세·궁합' },
  { id: 'media', label: '음성·요약·글쓰기' },
  { id: 'travel', label: '여행' },
  { id: 'business', label: '웹·개발' }
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
  const [isTesterHubUnlocked, setIsTesterHubUnlocked] = useState(false);
  const [isAdBoardUnlocked, setIsAdBoardUnlocked] = useState(false);
  const [verifiedAdminPassword, setVerifiedAdminPassword] = useState('');
  const [pendingLockTarget, setPendingLockTarget] = useState<'tester-hub' | 'ad-board' | null>(null);
  const [lockPasswordInput, setLockPasswordInput] = useState('');
  const [lockAuthError, setLockAuthError] = useState('');
  const [lockAuthLoading, setLockAuthLoading] = useState(false);
  const [showLockPassword, setShowLockPassword] = useState(false);
  const [isSiteCheckoutOpen, setIsSiteCheckoutOpen] = useState(false);
  const [siteCheckoutInitialMode, setSiteCheckoutInitialMode] = useState<'checkout' | 'lookup'>('checkout');
  const [upgradeReason, setUpgradeReason] = useState<'exhausted' | 'voluntary' | null>(null);
  const [upgradeFeatureTitle, setUpgradeFeatureTitle] = useState<string | undefined>(undefined);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    freeTrialLimit: 3,
    freeUsed: 0,
    freeRemaining: 3,
    membership: null
  });

  // Sync visitor trial quota & active paid membership with server
  useEffect(() => {
    let active = true;
    const syncMembership = async () => {
      const next = await fetchMembershipStatus();
      if (active && next) {
        setTrialStatus(next);
      }
    };
    void syncMembership();

    const onTrial = (ev: Event) => {
      const detail = (ev as CustomEvent).detail || {};
      setTrialStatus((prev) => ({
        ...prev,
        freeTrialLimit: detail.freeTrialLimit ?? prev.freeTrialLimit,
        freeUsed: detail.freeUsed ?? prev.freeUsed,
        freeRemaining: detail.freeRemaining ?? prev.freeRemaining
      }));
    };
    const onMembership = () => {
      void syncMembership();
    };
    const onOpenUpgrade = (ev: Event) => {
      const detail = (ev as CustomEvent).detail || {};
      setUpgradeReason(detail.reason === 'exhausted' ? 'exhausted' : 'voluntary');
      setUpgradeFeatureTitle(detail.featureTitle);
      setSiteCheckoutInitialMode('checkout');
      setIsSiteCheckoutOpen(true);
    };

    window.addEventListener('any1:trial-updated', onTrial);
    window.addEventListener('any1:membership-changed', onMembership);
    window.addEventListener('any1:open-upgrade', onOpenUpgrade);
    return () => {
      active = false;
      window.removeEventListener('any1:trial-updated', onTrial);
      window.removeEventListener('any1:membership-changed', onMembership);
      window.removeEventListener('any1:open-upgrade', onOpenUpgrade);
    };
  }, []);

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
                setStoredMembershipOrderId(orderId);
                notifyMembershipChanged();
                setPaymentBanner({
                  type: 'success',
                  message: `카드/PG 결제가 최종 승인되어 유료 이용권이 즉시 활성화되었습니다! (주문번호: ${orderId})`
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

  const handleOpenProtectedSection = (target: 'tester-hub' | 'ad-board') => {
    if (target === 'tester-hub' && isTesterHubUnlocked) {
      setActiveId('tester-hub');
      return;
    }
    if (target === 'ad-board' && isAdBoardUnlocked) {
      setActiveId('ad-board');
      return;
    }
    setLockPasswordInput('');
    setLockAuthError('');
    setShowLockPassword(false);
    setPendingLockTarget(target);
  };

  const handleVerifyProtectedPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLockTarget) return;
    if (!lockPasswordInput.trim()) {
      setLockAuthError('비밀번호를 입력해 주세요.');
      return;
    }
    setLockAuthLoading(true);
    setLockAuthError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: lockPasswordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const target = pendingLockTarget;
        setVerifiedAdminPassword(lockPasswordInput);
        if (target === 'ad-board') {
          setIsAdBoardUnlocked(true);
        } else {
          setIsTesterHubUnlocked(true);
        }
        setPendingLockTarget(null);
        setLockPasswordInput('');
        setActiveId(target);
      } else {
        setLockAuthError(data.error || '비밀번호가 일치하지 않습니다.');
      }
    } catch {
      setLockAuthError('서버와 통신하지 못했습니다.');
    } finally {
      setLockAuthLoading(false);
    }
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
              className="px-3 py-1.5 bg-neon/10 hover:bg-neon/20 text-neon border border-neon/30 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sun size={13} />
              <span>오늘의 운세</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUpgradeReason('voluntary');
                setUpgradeFeatureTitle(undefined);
                setSiteCheckoutInitialMode(trialStatus.membership?.active ? 'lookup' : 'checkout');
                setIsSiteCheckoutOpen(true);
              }}
              className={`px-3 py-1.5 border rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                trialStatus.membership?.active
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border-amber-400/40'
              }`}
            >
              {trialStatus.membership?.active ? <Crown size={13} /> : <CreditCard size={13} />}
              <span>
                {trialStatus.membership?.active
                  ? '유료 이용권 사용 중'
                  : savedApiKey
                    ? '이용권 결제'
                    : `이용권 결제 · 무료 ${trialStatus.freeRemaining}회`}
              </span>
            </button>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-3 py-1.5 transition-colors font-bold rounded-md flex items-center gap-1.5 border cursor-pointer whitespace-nowrap shrink-0 ${
                savedApiKey 
                  ? 'bg-neon/10 text-neon border-neon/50 hover:bg-neon hover:text-bg-dark' 
                  : 'bg-white/5 text-text-light/75 border-border-dark hover:border-neon/40 hover:text-white'
              }`}
            >
              <Key size={12} />
              <span className="hidden sm:inline">{savedApiKey ? 'API 키 관리' : 'AI 설정'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenProtectedSection('ad-board')}
              title="광고판 · 홍보 영상 관리 (관리자 전용)"
              className={`px-2.5 py-1.5 transition-colors font-bold rounded-md flex items-center gap-1 border cursor-pointer whitespace-nowrap shrink-0 ${
                activeId === 'ad-board'
                  ? 'bg-neon text-bg-dark border-neon'
                  : 'bg-transparent text-text-light/40 hover:text-neon border-transparent hover:border-border-dark'
              }`}
            >
              {isAdBoardUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
              <span>광고판</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenProtectedSection('tester-hub')}
              title="테스터 매칭 마이페이지 (관리자 전용)"
              className={`px-2.5 py-1.5 transition-colors font-bold rounded-md flex items-center gap-1 border cursor-pointer whitespace-nowrap shrink-0 ${
                activeId === 'tester-hub'
                  ? 'bg-neon text-bg-dark border-neon'
                  : 'bg-transparent text-text-light/40 hover:text-neon border-transparent hover:border-border-dark'
              }`}
            >
              {isTesterHubUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
              <span>품앗이</span>
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
                      <button
                        type="button"
                        onClick={() => {
                          setUpgradeReason('voluntary');
                          setUpgradeFeatureTitle(undefined);
                          setSiteCheckoutInitialMode('checkout');
                          setIsSiteCheckoutOpen(true);
                        }}
                        className="px-5 py-3 bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/45 font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard size={15} className="text-amber-300" />
                        <span>유료 이용권 · 카드/계좌결제</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUpgradeReason(null);
                          setUpgradeFeatureTitle(undefined);
                          setSiteCheckoutInitialMode('lookup');
                          setIsSiteCheckoutOpen(true);
                        }}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 text-text-light/80 hover:text-white border border-border-dark font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Search size={14} className="text-neon" />
                        <span>결제 · 이용권 인증</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-text-light/55 mt-3.5 leading-relaxed">
                      <span className="text-emerald-300 font-bold">상시 무료:</span> 오늘의 운세 &amp; 궁합 ·{' '}
                      <span className="text-amber-300 font-bold">무료 3회 체험 후 유료 전환:</span> 정밀 사주·작명·관상·풍수·AI 성우·문서요약·여행비서
                      {!trialStatus.membership?.active && !savedApiKey && (
                        <span className="text-neon font-bold ml-1.5">
                          (현재 무료 체험 {trialStatus.freeRemaining}/{trialStatus.freeTrialLimit}회 남음)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0 self-center md:self-auto">
                    <img 
                      src="/icon.svg" 
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl shadow-[0_0_50px_rgba(0,243,255,0.25)] border border-white/10" 
                      alt="ANY1 AI" 
                    />
                  </div>
                </section>

                {/* Live Video & Copy Ad Billboard */}
                <AdBillboard mode="dashboard" />

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
            ) : activeId === 'ad-board' ? (
              <motion.div
                key="ad-board"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                className="p-6 sm:p-10 flex-grow"
              >
                {isAdBoardUnlocked ? (
                  <div className="space-y-4">
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-neon flex items-center gap-1.5">
                        <Unlock size={12} />
                        <span>관리자 전용 비공개 페이지</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdBoardUnlocked(false);
                          setActiveId('dashboard');
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold text-text-light/70 hover:text-neon border border-border-dark hover:border-neon/40 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock size={11} />
                        <span>다시 잠그기</span>
                      </button>
                    </div>
                    <AdBillboard
                      mode="page"
                      adminPassword={verifiedAdminPassword}
                      onBackToDashboard={() => setActiveId('dashboard')}
                    />
                  </div>
                ) : (
                  <div className="max-w-md mx-auto my-auto p-6 w-full">
                    <div className="bg-[#0d0f12] border border-border-dark rounded-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/40 flex items-center justify-center text-neon mx-auto">
                        <Lock size={20} />
                      </div>
                      <h2 className="text-base font-black text-white">관리자 전용 비공개 페이지입니다</h2>
                      <p className="text-xs text-text-light/60">
                        비밀번호를 입력해야 광고판 · 홍보 영상 관리 페이지를 열람할 수 있습니다.
                      </p>
                      <div className="flex gap-2 justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveId('dashboard')}
                          className="px-4 py-2 border border-border-dark text-xs font-bold text-text-light/70 hover:text-white rounded-lg cursor-pointer"
                        >
                          홈으로 돌아가기
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenProtectedSection('ad-board')}
                          className="px-4 py-2 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg cursor-pointer"
                        >
                          비밀번호 입력하기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                {isTesterHubUnlocked ? (
                  <>
                    <div className="px-6 sm:px-10 pt-4 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-bold text-neon flex items-center gap-1.5">
                        <Unlock size={12} />
                        <span>관리자 전용 비공개 페이지</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTesterHubUnlocked(false);
                          setActiveId('dashboard');
                        }}
                        className="px-3 py-1.5 text-[11px] font-bold text-text-light/70 hover:text-neon border border-border-dark hover:border-neon/40 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock size={11} />
                        <span>다시 잠그기</span>
                      </button>
                    </div>
                    <TesterMatchHub
                      onBackToDashboard={() => setActiveId('dashboard')}
                      onOpenBuildSyncGuide={() => setIsBuildSyncGuideOpen(true)}
                    />
                  </>
                ) : (
                  <div className="max-w-md mx-auto my-auto p-6 w-full">
                    <div className="bg-[#0d0f12] border border-border-dark rounded-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/40 flex items-center justify-center text-neon mx-auto">
                        <Lock size={20} />
                      </div>
                      <h2 className="text-base font-black text-white">관리자 전용 비공개 페이지입니다</h2>
                      <p className="text-xs text-text-light/60">
                        비밀번호를 입력해야 테스터 매칭 마이페이지(품앗이)를 열람할 수 있습니다.
                      </p>
                      <div className="flex gap-2 justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveId('dashboard')}
                          className="px-4 py-2 border border-border-dark text-xs font-bold text-text-light/70 hover:text-white rounded-lg cursor-pointer"
                        >
                          홈으로 돌아가기
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenProtectedSection('tester-hub')}
                          className="px-4 py-2 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg cursor-pointer"
                        >
                          비밀번호 입력하기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Hidden Private Section Password Modal (광고판 / 품앗이) */}
      <AnimatePresence>
        {pendingLockTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingLockTarget(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-sm bg-[#0d0f12] border border-border-dark p-6 rounded-2xl shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/40 flex items-center justify-center text-neon shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">비공개 관리자 인증</h3>
                    <p className="text-[11px] text-text-light/55 mt-0.5">
                      {pendingLockTarget === 'ad-board'
                        ? '광고판 · 홍보 영상 관리 입장 비밀번호 입력'
                        : '테스터 매칭 마이페이지(품앗이) 입장 비밀번호 입력'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingLockTarget(null)}
                  className="text-text-light/50 hover:text-white p-1 rounded-lg cursor-pointer"
                  aria-label="닫기"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleVerifyProtectedPassword} className="space-y-4">
                <div className="relative">
                  <input
                    type={showLockPassword ? 'text' : 'password'}
                    autoFocus
                    value={lockPasswordInput}
                    onChange={(e) => setLockPasswordInput(e.target.value)}
                    placeholder="관리자 비밀번호 입력"
                    className="w-full bg-black/60 border border-border-dark focus:border-neon px-3.5 py-2.5 pr-10 text-sm text-white rounded-lg outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLockPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light/50 hover:text-neon cursor-pointer"
                    aria-label="비밀번호 표시 전환"
                  >
                    {showLockPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {lockAuthError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{lockAuthError}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingLockTarget(null)}
                    className="flex-1 py-2.5 border border-border-dark text-xs font-bold text-text-light/70 hover:text-white rounded-lg cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={lockAuthLoading}
                    className="flex-1 py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Unlock size={13} />
                    <span>{lockAuthLoading ? '확인 중...' : '입장하기'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Site Visitor Paid Membership Checkout Modal */}
      <SiteMembershipCheckoutModal
        isOpen={isSiteCheckoutOpen}
        onClose={() => {
          setIsSiteCheckoutOpen(false);
          setUpgradeReason(null);
          setUpgradeFeatureTitle(undefined);
        }}
        initialMode={siteCheckoutInitialMode}
        upgradeReason={upgradeReason}
        upgradeFeatureTitle={upgradeFeatureTitle}
      />
    </div>
  );
}
