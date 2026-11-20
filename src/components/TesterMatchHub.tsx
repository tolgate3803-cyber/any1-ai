import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Trophy, 
  Flame, 
  Bell, 
  HelpCircle, 
  ArrowRight, 
  Share2, 
  Upload, 
  Coins, 
  Zap, 
  Search, 
  Filter,
  AlertTriangle,
  PlayCircle,
  ThumbsUp,
  Award,
  ChevronRight,
  Info,
  UserCheck,
  CalendarCheck,
  CheckSquare,
  Square,
  Star,
  RefreshCw,
  LayoutDashboard,
  CheckCheck,
  CreditCard,
  Pencil,
  Trash2
} from 'lucide-react';
import PaymentCheckoutModal from './PaymentCheckoutModal';

interface TesterMember {
  id: string;
  name: string;
  device: string;
  day: number;
  status: 'active' | 'warning' | 'completed';
  verifiedAt: string;
  todayExecuted: boolean;
}

interface AppItem {
  id: string;
  name: string;
  packageName: string;
  webTestingUrl: string;
  storeUrl: string;
  category: string;
  developer: string;
  currentTesters: number;
  targetTesters: number;
  daysElapsed: number;
  totalDays: number;
  createdAt: string;
  summary: string;
  iconBg: string;
  isMine?: boolean;
  testersList?: TesterMember[];
}

interface ParticipatingTest {
  appId: string;
  appName: string;
  packageName: string;
  developer: string;
  iconBg: string;
  webTestingUrl: string;
  startedAt: string;
  daysElapsed: number;
  totalDays: number;
  todayChecked: boolean;
  history: boolean[]; // 14 days boolean
}

const DEFAULT_MY_APP: AppItem = {
  id: 'any1-ai',
  name: 'any1.ai (AI 사주/타로/운세/라이프)',
  packageName: 'com.any1.ai',
  webTestingUrl: 'https://play.google.com/apps/testing/com.any1.ai',
  storeUrl: 'https://play.google.com/store/apps/details?id=com.any1.ai',
  category: '운세/라이프스타일',
  developer: '오로라크라운 (나)',
  currentTesters: 7,
  targetTesters: 12,
  daysElapsed: 2,
  totalDays: 14,
  createdAt: '2026-11-06',
  summary: 'AI 정밀 사주 분석 및 타로 카드 리딩, 일상 맞춤 운세 솔루션',
  iconBg: 'from-cyan-500 to-blue-600',
  isMine: true,
  testersList: [
    { id: 't1', name: '오로라크라운 (나)', device: 'Galaxy Z Fold6', day: 2, status: 'active', verifiedAt: '방금 전 인증', todayExecuted: true },
    { id: 't2', name: '개발꿈나무99', device: 'Galaxy S24', day: 2, status: 'active', verifiedAt: '1시간 전 인증', todayExecuted: true },
    { id: 't3', name: '플러터장인', device: 'Galaxy S23 Ultra', day: 2, status: 'active', verifiedAt: '3시간 전 인증', todayExecuted: true },
    { id: 't4', name: '코딩하는직장인', device: 'Galaxy Z Flip5', day: 2, status: 'active', verifiedAt: '어제 인증', todayExecuted: true },
    { id: 't5', name: '인디메이커K', device: 'Galaxy A54', day: 2, status: 'active', verifiedAt: '어제 인증', todayExecuted: true },
    { id: 't6', name: '앱출시도전러', device: 'Pixel 8', day: 1, status: 'active', verifiedAt: '어제 인증', todayExecuted: true },
    { id: 't7', name: '수호천사dev', device: 'Galaxy S22+', day: 1, status: 'active', verifiedAt: '어제 인증', todayExecuted: true },
  ]
};

const INITIAL_PARTICIPATING_TESTS: ParticipatingTest[] = [
  {
    appId: 'pomodoro-focus',
    appName: '포커스 타이머 - 뽀모도로 몰입 타이머',
    packageName: 'com.pomodoro.deepfocus',
    developer: '몰입연구소',
    iconBg: 'from-rose-500 to-amber-500',
    webTestingUrl: 'https://play.google.com/apps/testing/com.pomodoro.deepfocus',
    startedAt: '2026-10-27',
    daysElapsed: 12,
    totalDays: 14,
    todayChecked: true,
    history: [true, true, true, true, true, true, true, true, true, true, true, true, false, false]
  },
  {
    appId: 'kind-budget',
    appName: '착한 가계부 - 영수증 사진 자동 장부',
    packageName: 'com.kindmoney.budgetbook',
    developer: '핀테크인디',
    iconBg: 'from-emerald-500 to-teal-600',
    webTestingUrl: 'https://play.google.com/apps/testing/com.kindmoney.budgetbook',
    startedAt: '2026-11-01',
    daysElapsed: 7,
    totalDays: 14,
    todayChecked: false,
    history: [true, true, true, true, true, true, true, false, false, false, false, false, false, false]
  }
];

const INITIAL_COMMUNITY_APPS: AppItem[] = [
  {
    id: 'pomodoro-focus',
    name: '포커스 타이머 - 뽀모도로 몰입 타이머',
    packageName: 'com.pomodoro.deepfocus',
    webTestingUrl: 'https://play.google.com/apps/testing/com.pomodoro.deepfocus',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.pomodoro.deepfocus',
    category: '생산성/도구',
    developer: '몰입연구소',
    currentTesters: 11,
    targetTesters: 12,
    daysElapsed: 12,
    totalDays: 14,
    createdAt: '2026-10-27',
    summary: '25분 집중 + 5분 휴식 과학적 뽀모도로 인터벌 타이머',
    iconBg: 'from-rose-500 to-amber-500',
  },
  {
    id: 'kind-budget',
    name: '착한 가계부 - 영수증 사진 자동 장부',
    packageName: 'com.kindmoney.budgetbook',
    webTestingUrl: 'https://play.google.com/apps/testing/com.kindmoney.budgetbook',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.kindmoney.budgetbook',
    category: '금융/자산',
    developer: '핀테크인디',
    currentTesters: 9,
    targetTesters: 12,
    daysElapsed: 7,
    totalDays: 14,
    createdAt: '2026-11-01',
    summary: '영수증 촬영 시 OCR로 지출 카테고리와 금액을 자동 기록하는 스마트 가계부',
    iconBg: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'word-master',
    name: '수능/토익 필수 영단어 3000',
    packageName: 'com.voca.wordmaster3000',
    webTestingUrl: 'https://play.google.com/apps/testing/com.voca.wordmaster3000',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.voca.wordmaster3000',
    category: '교육/어학',
    developer: '에듀보카',
    currentTesters: 5,
    targetTesters: 12,
    daysElapsed: 3,
    totalDays: 14,
    createdAt: '2026-11-05',
    summary: '망각곡선 기반 자동 복습 팝업 및 깜빡이 영단어 암기 앱',
    iconBg: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'plant-diary',
    name: '초록이 일기 - 반려식물 물주기 알림',
    packageName: 'com.greenplant.diary',
    webTestingUrl: 'https://play.google.com/apps/testing/com.greenplant.diary',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.greenplant.diary',
    category: '라이프/원예',
    developer: '식물집사K',
    currentTesters: 8,
    targetTesters: 12,
    daysElapsed: 6,
    totalDays: 14,
    createdAt: '2026-11-02',
    summary: '화분별 권장 물주기 주기와 분갈이 일정을 자동 계산해주는 가드닝 플래너',
    iconBg: 'from-green-600 to-lime-600',
  },
  {
    id: 'noise-meter',
    name: '정밀 소음측정기 & 층간소음 데시벨 기록기',
    packageName: 'com.noisesensor.dbmeter',
    webTestingUrl: 'https://play.google.com/apps/testing/com.noisesensor.dbmeter',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.noisesensor.dbmeter',
    category: '유틸리티/센서',
    developer: '테크엔지니어',
    currentTesters: 10,
    targetTesters: 12,
    daysElapsed: 10,
    totalDays: 14,
    createdAt: '2026-10-29',
    summary: '마이크 센서 기반 실시간 dB 측정 및 일자별 소음 발생 그래프 리포트 생성',
    iconBg: 'from-amber-500 to-orange-600',
  },
  {
    id: 'gratitude-log',
    name: '하루 한 줄 감사일기 (미니멀 다이어리)',
    packageName: 'com.gratitude.minimaldiary',
    webTestingUrl: 'https://play.google.com/apps/testing/com.gratitude.minimaldiary',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.gratitude.minimaldiary',
    category: '도서/문학',
    developer: '마음챙김공방',
    currentTesters: 6,
    targetTesters: 12,
    daysElapsed: 4,
    totalDays: 14,
    createdAt: '2026-11-04',
    summary: '잠들기 전 1분, 하루 중 감사했던 일 3가지를 적고 마음을 정돈하는 감성 일기',
    iconBg: 'from-pink-500 to-rose-600',
  }
];

const SHARED_GOOGLE_GROUP = 'any1-testers-union@googlegroups.com';

interface TesterMatchHubProps {
  onBackToDashboard: () => void;
  onOpenBuildSyncGuide?: () => void;
}

export default function TesterMatchHub({ onBackToDashboard, onOpenBuildSyncGuide }: TesterMatchHubProps) {
  const [activeTab, setActiveTab] = useState<'mypage' | 'my-apps' | 'explore' | 'guide' | 'pricing'>('mypage');
  
  // Storage states
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('any1_tester_credits');
    return saved !== null ? parseInt(saved, 10) : 12; // Initial credits
  });

  const [myApps, setMyApps] = useState<AppItem[]>(() => {
    const saved = localStorage.getItem('any1_registered_apps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [DEFAULT_MY_APP];
      }
    }
    return [DEFAULT_MY_APP];
  });

  const [participatingTests, setParticipatingTests] = useState<ParticipatingTest[]>(() => {
    const saved = localStorage.getItem('any1_participating_tests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PARTICIPATING_TESTS;
      }
    }
    return INITIAL_PARTICIPATING_TESTS;
  });

  const [communityApps, setCommunityApps] = useState<AppItem[]>(() => {
    const saved = localStorage.getItem('any1_community_apps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_COMMUNITY_APPS;
      }
    }
    return INITIAL_COMMUNITY_APPS;
  });

  const [testedAppIds, setTestedAppIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('any1_tested_app_ids');
    return saved ? JSON.parse(saved) : ['pomodoro-focus', 'kind-budget'];
  });

  // Modals & UI feedback
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [verifyModalApp, setVerifyModalApp] = useState<AppItem | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<'fasttrack12' | 'vip_allpass'>('fasttrack12');
  const [checkoutMode, setCheckoutMode] = useState<'checkout' | 'lookup'>('checkout');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedGroup, setCopiedGroup] = useState(false);
  const [copiedKakao, setCopiedKakao] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Form states for new/edit app registration
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newAppName, setNewAppName] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newTestingUrl, setNewTestingUrl] = useState('');
  const [newStoreUrl, setNewStoreUrl] = useState('');
  const [newCategory, setNewCategory] = useState('유틸리티');
  const [newSummary, setNewSummary] = useState('');

  // Save changes
  useEffect(() => {
    localStorage.setItem('any1_tester_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('any1_registered_apps', JSON.stringify(myApps));
  }, [myApps]);

  useEffect(() => {
    localStorage.setItem('any1_participating_tests', JSON.stringify(participatingTests));
  }, [participatingTests]);

  useEffect(() => {
    localStorage.setItem('any1_community_apps', JSON.stringify(communityApps));
  }, [communityApps]);

  useEffect(() => {
    localStorage.setItem('any1_tested_app_ids', JSON.stringify(testedAppIds));
  }, [testedAppIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopy = (text: string, type: 'group' | 'kakao') => {
    navigator.clipboard.writeText(text);
    if (type === 'group') {
      setCopiedGroup(true);
      setTimeout(() => setCopiedGroup(false), 2000);
      showToast('구글 그룹스 이메일이 복사되었습니다! 플레이 콘솔 테스터에 붙여넣으세요.');
    } else {
      setCopiedKakao(true);
      setTimeout(() => setCopiedKakao(false), 2000);
      showToast('카카오톡 맞테스트 모집 양식이 복사되었습니다!');
    }
  };

  // Toggle daily execution check for a tested app
  const handleToggleDailyCheck = (appId: string) => {
    setParticipatingTests(prev => prev.map(item => {
      if (item.appId === appId) {
        const nextState = !item.todayChecked;
        if (nextState) {
          showToast(`✅ "${item.appName}" 오늘 1분 실행 체크 완료! 14일 연속 유지가 성공적으로 기록되었습니다.`);
        } else {
          showToast(`체크가 취소되었습니다.`);
        }
        return {
          ...item,
          todayChecked: nextState
        };
      }
      return item;
    }));
  };

  const openNewRegisterModal = () => {
    setEditingAppId(null);
    setNewAppName('');
    setNewPackageName('');
    setNewTestingUrl('');
    setNewStoreUrl('');
    setNewCategory('유틸리티');
    setNewSummary('');
    setIsRegisterModalOpen(true);
  };

  const handleOpenEditApp = (app: AppItem) => {
    setEditingAppId(app.id);
    setNewAppName(app.name);
    setNewPackageName(app.packageName);
    setNewTestingUrl(app.webTestingUrl || '');
    setNewStoreUrl(app.storeUrl || '');
    setNewCategory(app.category || '유틸리티');
    setNewSummary(app.summary || '');
    setIsRegisterModalOpen(true);
  };

  const handleDeleteMyApp = (app: AppItem) => {
    if (confirmDeleteId !== app.id) {
      setConfirmDeleteId(app.id);
      setTimeout(() => {
        setConfirmDeleteId(prev => (prev === app.id ? null : prev));
      }, 4000);
      return;
    }
    setMyApps(prev => prev.filter(item => item.id !== app.id));
    setConfirmDeleteId(null);
    showToast(`🗑️ "${app.name}" 앱이 목록에서 삭제되었습니다.`);
  };

  // Register new app or update existing app
  const handleRegisterApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim() || !newPackageName.trim()) {
      showToast('⚠️ 앱 이름과 패키지명을 모두 입력해 주세요.');
      return;
    }

    const trimmedName = newAppName.trim();
    const trimmedPkg = newPackageName.trim();
    const resolvedTestingUrl = newTestingUrl.trim() || `https://play.google.com/apps/testing/${trimmedPkg}`;
    const resolvedStoreUrl = newStoreUrl.trim() || `https://play.google.com/store/apps/details?id=${trimmedPkg}`;

    if (editingAppId) {
      setMyApps(prev =>
        prev.map(item =>
          item.id === editingAppId
            ? {
                ...item,
                name: trimmedName,
                packageName: trimmedPkg,
                webTestingUrl: resolvedTestingUrl,
                storeUrl: resolvedStoreUrl,
                category: newCategory,
                summary: newSummary.trim() || item.summary
              }
            : item
        )
      );
      setIsRegisterModalOpen(false);
      setEditingAppId(null);
      setNewAppName('');
      setNewPackageName('');
      setNewTestingUrl('');
      setNewStoreUrl('');
      setNewSummary('');
      showToast(`✅ "${trimmedName}" 앱 정보가 수정되었습니다!`);
      return;
    }

    if (credits >= 12) {
      setCredits(prev => Math.max(0, prev - 12));
    } else {
      showToast('🎁 신규 환영 무료 혜택이 적용되어 크레딧 차감 없이 등록되었습니다!');
    }

    const created: AppItem = {
      id: `app-${Date.now()}`,
      name: trimmedName,
      packageName: trimmedPkg,
      webTestingUrl: resolvedTestingUrl,
      storeUrl: resolvedStoreUrl,
      category: newCategory,
      developer: '오로라크라운 (나)',
      currentTesters: 1, // Self
      targetTesters: 12,
      daysElapsed: 1,
      totalDays: 14,
      createdAt: new Date().toISOString().split('T')[0],
      summary: newSummary.trim() || '신규 등록된 맞테스트 애플리케이션',
      iconBg: 'from-violet-500 to-indigo-600',
      isMine: true,
      testersList: [
        { id: `t-me-${Date.now()}`, name: '오로라크라운 (나)', device: 'Android', day: 1, status: 'active', verifiedAt: '방금 전 등록', todayExecuted: true }
      ]
    };

    setMyApps(prev => [created, ...prev]);
    setIsRegisterModalOpen(false);

    // Reset inputs
    setNewAppName('');
    setNewPackageName('');
    setNewTestingUrl('');
    setNewStoreUrl('');
    setNewSummary('');

    showToast(`🎉 "${created.name}" 앱이 성공적으로 등록되었습니다! 12인 맞테스트 매칭이 시작됩니다.`);
    setActiveTab('mypage');
  };

  // Verify test on community app
  const handleConfirmVerification = () => {
    if (!verifyModalApp) return;

    if (!testedAppIds.includes(verifyModalApp.id)) {
      setTestedAppIds(prev => [...prev, verifyModalApp.id]);
      setCredits(prev => prev + 1);

      // Add to participating tests in MyPage
      const newPart: ParticipatingTest = {
        appId: verifyModalApp.id,
        appName: verifyModalApp.name,
        packageName: verifyModalApp.packageName,
        developer: verifyModalApp.developer,
        iconBg: verifyModalApp.iconBg,
        webTestingUrl: verifyModalApp.webTestingUrl,
        startedAt: new Date().toISOString().split('T')[0],
        daysElapsed: 1,
        totalDays: 14,
        todayChecked: true,
        history: [true, false, false, false, false, false, false, false, false, false, false, false, false, false]
      };
      setParticipatingTests(prev => [newPart, ...prev]);

      // Increment community app tester count
      setCommunityApps(prev => prev.map(app => {
        if (app.id === verifyModalApp.id) {
          return {
            ...app,
            currentTesters: Math.min(app.targetTesters, app.currentTesters + 1)
          };
        }
        return app;
      }));

      showToast(`✨ 인증 완료! +1 크레딧 지급 및 마이페이지 체크리스트에 추가되었습니다.`);
    } else {
      showToast('이미 테스트 및 인증이 완료된 앱입니다.');
    }

    setVerifyModalApp(null);
  };

  // Send daily reminder to all testers
  const handleSendReminder = (appName: string) => {
    showToast(`🔔 "${appName}" 참여 테스터 전원에게 알림 발송 완료! ("오늘의 앱 1분 실행 요청")`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-dark text-text-light font-sans pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-neon text-bg-dark px-5 py-3 rounded-lg shadow-[0_10px_30px_rgba(0,243,255,0.4)] font-bold text-xs flex items-center gap-2 border border-black/20"
          >
            <Sparkles size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner / Header Bar */}
      <div className="border-b border-border-dark bg-bg-card/40 backdrop-blur-md px-6 lg:px-10 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-light/50 mb-2">
              <button 
                onClick={onBackToDashboard}
                className="hover:text-neon transition-colors"
              >
                any1.ai 대시보드
              </button>
              <span>/</span>
              <span className="text-neon font-medium">테스터 매칭 마이페이지 대시보드</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon to-cyan-400 flex items-center justify-center text-bg-dark shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                <Smartphone size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black italic tracking-tight text-white flex items-center gap-3">
                  <span>TESTER MATCH 14</span>
                  <span className="text-[10px] font-mono not-italic font-bold bg-neon/15 text-neon border border-neon/30 px-2 py-0.5 rounded tracking-widest uppercase">
                    MyPage Dashboard
                  </span>
                </h1>
                <p className="text-xs text-text-light/60 mt-0.5">
                  내 앱 등록 및 맞테스트 요청, 타 개발자 앱 일일 실행 체크리스트를 한눈에 관리하는 대시보드
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 bg-white/5 border border-border-dark p-2 rounded-xl">
            <div className="px-3.5 py-1.5 border-r border-border-dark flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-light/40 flex items-center gap-1">
                <Coins size={12} className="text-amber-400" />
                보유 크레딧
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-amber-300">
                {credits} <span className="text-xs font-sans font-medium text-text-light/50">C</span>
              </span>
            </div>

            <div className="px-3.5 py-1.5 border-r border-border-dark flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-light/40 flex items-center gap-1">
                <Smartphone size={12} className="text-neon" />
                내 등록 앱
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-white">
                {myApps.length} <span className="text-xs font-sans font-medium text-text-light/50">개</span>
              </span>
            </div>

            <div className="px-3.5 py-1.5 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-text-light/40 flex items-center gap-1">
                <CheckSquare size={12} className="text-lime-400" />
                수행 중인 테스트
              </span>
              <span className="text-lg font-black font-mono tabular-nums text-lime-400">
                {participatingTests.length} <span className="text-xs font-sans font-medium text-text-light/50">건</span>
              </span>
            </div>

            <button
              onClick={openNewRegisterModal}
              className="ml-2 px-4 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus size={15} className="stroke-[3]" />
              <span>내 앱 등록 & 맞테스트 요청</span>
            </button>
          </div>
        </div>

        {/* Global Google Group Quick Copy Bar */}
        <div className="mt-6 p-3 bg-neon/5 border border-neon/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-neon/20 text-neon flex items-center justify-center shrink-0 font-bold font-mono">
              ★
            </span>
            <div>
              <span className="font-bold text-white">1초 자동 연동 이메일: </span>
              <span className="text-text-light/70">
                구글 콘솔 테스터에 아래 <strong className="text-neon">공용 구글 그룹스</strong>만 등록하면, 테스터들에게 이메일을 안 물어봐도 누구나 다운로드 가능합니다!
              </span>
            </div>
          </div>
          <button
            onClick={() => handleCopy(SHARED_GOOGLE_GROUP, 'group')}
            className="px-3 py-1.5 bg-bg-dark hover:bg-white/10 border border-neon/40 text-neon rounded-lg font-mono text-xs flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
          >
            <span>{SHARED_GOOGLE_GROUP}</span>
            {copiedGroup ? <Check size={14} className="text-lime-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 lg:px-10 border-b border-border-dark flex items-center gap-2 pt-4 bg-bg-dark">
        <button
          onClick={() => setActiveTab('mypage')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'mypage'
              ? 'border-neon text-neon bg-neon/5'
              : 'border-transparent text-text-light/50 hover:text-white'
          }`}
        >
          <LayoutDashboard size={15} />
          <span>👤 테스터 매칭 마이페이지</span>
        </button>

        <button
          onClick={() => setActiveTab('my-apps')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my-apps'
              ? 'border-neon text-neon bg-neon/5'
              : 'border-transparent text-text-light/50 hover:text-white'
          }`}
        >
          <Smartphone size={15} />
          <span>내 등록 앱 & 14일 심층 현황 ({myApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'explore'
              ? 'border-neon text-neon bg-neon/5'
              : 'border-transparent text-text-light/50 hover:text-white'
          }`}
        >
          <Search size={15} />
          <span>맞테스트 찾기 & 크레딧 적립 ({communityApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'guide'
              ? 'border-neon text-neon bg-neon/5'
              : 'border-transparent text-text-light/50 hover:text-white'
          }`}
        >
          <HelpCircle size={15} />
          <span>구글 콘솔 1분 연동 가이드</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pricing'
              ? 'border-neon text-neon bg-neon/5'
              : 'border-transparent text-text-light/50 hover:text-white'
          }`}
        >
          <Zap size={15} className="text-amber-400" />
          <span>패스트트랙 (12명 즉시 배정)</span>
        </button>
      </div>

      {/* Main Content Viewport */}
      <div className="px-6 lg:px-10 py-8 max-w-7xl w-full mx-auto">
        
        {/* ========================================================================= */}
        {/* TAB: MY PAGE DASHBOARD (CORE USER REQUEST) */}
        {/* ========================================================================= */}
        {activeTab === 'mypage' && (
          <div className="space-y-8">
            
            {/* 1. Developer Profile & Quick Stats Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-bg-card via-white/[0.02] to-bg-card border border-border-dark flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-neon flex items-center justify-center text-bg-dark font-black text-2xl shadow-[0_0_20px_rgba(0,243,255,0.3)] shrink-0">
                  오
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg font-black text-white">오로라크라운</h2>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      신뢰도 S등급 파트너 (14일 완주율 100%)
                    </span>
                    <span className="text-xs text-text-light/40 font-mono">tolgate3803@gmail.com</span>
                  </div>
                  <p className="text-xs text-text-light/70">
                    현재 <strong>내 앱 1개 맞테스트 요청 중</strong>이며, 동료 개발자의 <strong>앱 {participatingTests.length}개를 성실히 테스트</strong>하고 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={openNewRegisterModal}
                  className="px-4 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} className="stroke-[3]" />
                  <span>새 맞테스트 요청 등록</span>
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-border-dark text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Search size={14} />
                  <span>새 앱 맞테스트 찾기 (+1C)</span>
                </button>
              </div>
            </div>

            {/* 2. SECTION: 내가 요청한 맞테스트 (내 앱 관리) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Smartphone size={18} className="text-neon" />
                  <span>내가 요청한 맞테스트 앱 ({myApps.length}건)</span>
                </h3>
                <span className="text-xs text-text-light/50 font-mono">
                  12명 달성 및 14일 경과 시 정식 출시 가능
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {myApps.map((app) => {
                  const percentTesters = Math.min(100, Math.round((app.currentTesters / app.targetTesters) * 100));
                  const percentDays = Math.min(100, Math.round((app.daysElapsed / app.totalDays) * 100));
                  const daysRemaining = Math.max(0, app.totalDays - app.daysElapsed);

                  return (
                    <div 
                      key={app.id}
                      className="p-6 rounded-2xl bg-bg-card border border-border-dark hover:border-neon/40 transition-all space-y-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-white font-black text-lg shadow shrink-0`}>
                            {app.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-black text-white">{app.name}</h4>
                              <span className="text-[10px] font-mono text-neon bg-neon/10 px-2 py-0.5 rounded border border-neon/30">
                                {app.category}
                              </span>
                              <span className="text-[10px] font-mono text-text-light/40">
                                {app.packageName}
                              </span>
                            </div>
                            <p className="text-xs text-text-light/60 mt-1">{app.summary}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <a
                            href={app.webTestingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-border-dark text-xs rounded-lg flex items-center gap-1.5 text-text-light hover:text-white transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>스토어 링크</span>
                          </a>
                          <button
                            onClick={() => {
                              const kakaoFormat = `안녕하세요! 구글 비공개 14일 맞테스트 구합니다.\n• 앱 이름: ${app.name}\n• 패키지명: ${app.packageName}\n• 테스터 참여 링크: ${app.webTestingUrl}\n맞테스트 1:1 톡 주시면 상대방 앱도 즉시 설치하고 14일간 절대 삭제 없이 맞테스트 해드립니다!`;
                              handleCopy(kakaoFormat, 'kakao');
                            }}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-lg flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                          >
                            <Share2 size={12} />
                            <span>카톡 양식 복사</span>
                          </button>
                          <button
                            onClick={() => handleSendReminder(app.name)}
                            className="px-3 py-1.5 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Bell size={12} />
                            <span>실행 요청 알림</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditApp(app)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-border-dark text-text-light hover:text-white text-xs rounded-lg flex items-center gap-1 font-bold transition-colors cursor-pointer"
                          >
                            <Pencil size={12} />
                            <span>수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMyApp(app)}
                            className={`px-3 py-1.5 border text-xs rounded-lg flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                              confirmDeleteId === app.id
                                ? 'bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30'
                                : 'bg-white/5 border-border-dark text-text-light/70 hover:text-red-400 hover:border-red-500/40'
                            }`}
                          >
                            <Trash2 size={12} />
                            <span>{confirmDeleteId === app.id ? '삭제 확인' : '삭제'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress meters strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-border-dark/40">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-text-light/60 font-sans font-bold flex items-center gap-1">
                              <Users size={13} className="text-neon" />
                              테스터 모집률
                            </span>
                            <span className="text-neon font-black">{app.currentTesters} / {app.targetTesters} 명 ({percentTesters}%)</span>
                          </div>
                          <div className="w-full h-2 bg-bg-dark rounded-full overflow-hidden">
                            <div className="h-full bg-neon rounded-full" style={{ width: `${percentTesters}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-text-light/60 font-sans font-bold flex items-center gap-1">
                              <Clock size={13} className="text-lime-400" />
                              14일 유지 진행률
                            </span>
                            <span className="text-lime-400 font-black">{app.daysElapsed} / {app.totalDays} 일차 (D-{daysRemaining})</span>
                          </div>
                          <div className="w-full h-2 bg-bg-dark rounded-full overflow-hidden">
                            <div className="h-full bg-lime-400 rounded-full" style={{ width: `${percentDays}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SECTION: 내가 참여 중인 다른 개발자 앱 맞테스트 (체크리스트 UI) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <CheckSquare size={18} className="text-lime-400" />
                    <span>내가 테스트 중인 다른 개발자 앱 ({participatingTests.length}건)</span>
                  </h3>
                  <p className="text-xs text-text-light/60 mt-0.5">
                    매일 하루 1회 30초 이상 앱을 실행하고 체크 버튼을 눌러주시면 상호 신뢰도가 유지됩니다.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="text-xs font-bold text-neon hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>더 많은 앱 테스트하고 크레딧 모으기</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participatingTests.map((test) => {
                  const daysRemaining = Math.max(0, test.totalDays - test.daysElapsed);
                  return (
                    <div 
                      key={test.appId}
                      className={`p-5 rounded-2xl bg-bg-card border transition-all space-y-4 ${
                        test.todayChecked 
                          ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.08)]' 
                          : 'border-border-dark hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${test.iconBg} flex items-center justify-center text-white font-bold text-sm shadow shrink-0`}>
                            {test.appName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-snug">{test.appName}</h4>
                            <p className="text-[11px] font-mono text-text-light/40">{test.packageName}</p>
                            <span className="text-[10px] text-text-light/50 font-mono mt-0.5 block">
                              개발자: {test.developer} · 시작일: {test.startedAt}
                            </span>
                          </div>
                        </div>

                        <a
                          href={test.webTestingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-text-light/60 hover:text-white transition-colors"
                          title="스토어에서 앱 열기"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      {/* 14-Day Calendar Visual Tracker */}
                      <div className="space-y-1.5 p-3 bg-white/[0.02] rounded-xl border border-border-dark/40">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-text-light/60">14일 유지 진행:</span>
                          <span className="text-lime-400 font-bold">{test.daysElapsed} / 14일차 (D-{daysRemaining})</span>
                        </div>
                        {/* 14 day check boxes */}
                        <div className="grid grid-cols-14 gap-1 pt-1">
                          {test.history.map((isDone, idx) => (
                            <div
                              key={idx}
                              title={`Day ${idx + 1}: ${isDone ? '완료' : '대기'}`}
                              className={`h-4 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold ${
                                isDone 
                                  ? 'bg-emerald-500 text-bg-dark' 
                                  : idx < test.daysElapsed 
                                    ? 'bg-amber-500/30 text-amber-300' 
                                    : 'bg-white/5 text-text-light/20'
                              }`}
                            >
                              {idx + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Today Execution Action Checkbox Button */}
                      <button
                        onClick={() => handleToggleDailyCheck(test.appId)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          test.todayChecked
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {test.todayChecked ? (
                            <CheckSquare size={16} className="text-emerald-400" />
                          ) : (
                            <Square size={16} className="text-amber-400" />
                          )}
                          <span>
                            {test.todayChecked ? '오늘 1분 실행 완료됨 (인증됨)' : '오늘 앱 1회 실행 체크하기'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono opacity-70">
                          {test.todayChecked ? '✓ 유지 중' : '클릭하여 체크'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. SECTION: 상호 맞교환 매칭 파트너 검증표 */}
            <div className="space-y-3 border-t border-border-dark pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <UserCheck size={18} className="text-neon" />
                  <span>1:1 상호 맞테스트 파트너 교환 현황</span>
                </h3>
                <span className="text-xs text-text-light/50">
                  내가 상대방 앱을 깔아주고, 상대방도 내 앱을 깔아준 상호 검증 내역
                </span>
              </div>

              <div className="overflow-x-auto border border-border-dark rounded-xl bg-bg-card/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-dark bg-white/[0.02] text-text-light/40 text-[10px] uppercase font-mono">
                      <th className="py-3 px-4">맞테스트 파트너</th>
                      <th className="py-3 px-4">파트너의 앱</th>
                      <th className="py-3 px-4">내가 설치함</th>
                      <th className="py-3 px-4">상대가 내 앱 설치함</th>
                      <th className="py-3 px-4">14일 유지 상태</th>
                      <th className="py-3 px-4 text-right">상호 신뢰도</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark/40 font-mono text-[11px]">
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-neon flex items-center justify-center text-[10px]">몰</div>
                        <span>몰입연구소</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-text-light/80">포커스 타이머</td>
                      <td className="py-3 px-4 text-emerald-400 font-sans font-bold flex items-center gap-1">
                        <Check size={13} /> 설치 완료 (12일차)
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-sans font-bold">
                        ✓ any1.ai 설치 완료 (2일차)
                      </td>
                      <td className="py-3 px-4 text-lime-400">정상 유지 중 (D-2)</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                          100% 매칭
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">핀</div>
                        <span>핀테크인디</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-text-light/80">착한 가계부</td>
                      <td className="py-3 px-4 text-emerald-400 font-sans font-bold flex items-center gap-1">
                        <Check size={13} /> 설치 완료 (7일차)
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-sans font-bold">
                        ✓ any1.ai 설치 완료 (2일차)
                      </td>
                      <td className="py-3 px-4 text-lime-400">정상 유지 중 (D-7)</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                          100% 매칭
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: MY APPS & 14-DAY PROGRESS */}
        {/* ========================================================================= */}
        {activeTab === 'my-apps' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>내 등록 앱 14일 진행 현황</span>
                  <span className="text-xs font-normal text-text-light/50 font-mono">
                    (12명 테스터 참여 및 14일 유지 모니터링)
                  </span>
                </h2>
                <p className="text-xs text-text-light/60 mt-1">
                  12명이 참여하고 14일이 경과하면 구글 플레이 콘솔에서 [프로덕션 신청] 버튼이 활성화됩니다.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openNewRegisterModal}
                  className="px-3.5 py-2 bg-neon/10 hover:bg-neon hover:text-bg-dark border border-neon/50 text-neon font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>새 앱 추가 등록</span>
                </button>
              </div>
            </div>

            {/* My Apps Cards */}
            <div className="space-y-6">
              {myApps.map((app) => {
                const percentTesters = Math.min(100, Math.round((app.currentTesters / app.targetTesters) * 100));
                const percentDays = Math.min(100, Math.round((app.daysElapsed / app.totalDays) * 100));
                const daysRemaining = Math.max(0, app.totalDays - app.daysElapsed);

                return (
                  <div 
                    key={app.id} 
                    className="bg-bg-card/70 border border-border-dark hover:border-border-dark/80 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl"
                  >
                    {/* Header line */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-dark/60 pb-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0`}>
                          {app.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-black text-white">{app.name}</h3>
                            <span className="text-[10px] font-mono text-neon bg-neon/10 px-2 py-0.5 rounded border border-neon/30">
                              {app.category}
                            </span>
                            <span className="text-[10px] font-mono text-text-light/50">
                              패키지: {app.packageName}
                            </span>
                          </div>
                          <p className="text-xs text-text-light/70">{app.summary}</p>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={app.webTestingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-border-dark text-xs rounded-lg flex items-center gap-1.5 text-text-light hover:text-white transition-colors"
                        >
                          <ExternalLink size={13} />
                          <span>스토어 테스트 링크</span>
                        </a>

                        <button
                          onClick={() => {
                            const kakaoFormat = `안녕하세요! 구글 비공개 14일 맞테스트 구합니다.\n• 앱 이름: ${app.name}\n• 패키지명: ${app.packageName}\n• 테스터 참여 링크: ${app.webTestingUrl}\n맞테스트 1:1 톡 주시면 상대방 앱도 즉시 설치하고 14일간 절대 삭제 없이 맞테스트 해드립니다!`;
                            handleCopy(kakaoFormat, 'kakao');
                          }}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-lg flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                        >
                          <Share2 size={13} />
                          <span>카톡 맞테스트 양식 복사</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditApp(app)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-border-dark text-text-light hover:text-white text-xs rounded-lg flex items-center gap-1 font-bold transition-colors cursor-pointer"
                        >
                          <Pencil size={13} />
                          <span>수정</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMyApp(app)}
                          className={`px-3 py-1.5 border text-xs rounded-lg flex items-center gap-1 font-bold transition-colors cursor-pointer ${
                            confirmDeleteId === app.id
                              ? 'bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30'
                              : 'bg-white/5 border-border-dark text-text-light/70 hover:text-red-400 hover:border-red-500/40'
                          }`}
                        >
                          <Trash2 size={13} />
                          <span>{confirmDeleteId === app.id ? '삭제 확인' : '삭제'}</span>
                        </button>

                        <button
                          onClick={() => handleSendReminder(app.name)}
                          className="px-3.5 py-1.5 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,243,255,0.2)] cursor-pointer"
                        >
                          <Bell size={13} />
                          <span>테스터 전원 실행 알림</span>
                        </button>
                      </div>
                    </div>

                    {/* Twin Progress Meters (Testers + 14-Day Streak) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-5 rounded-xl border border-border-dark/40">
                      {/* Metric 1: Tester Count */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-text-light flex items-center gap-1.5">
                            <Users size={14} className="text-neon" />
                            <span>12인 테스터 참여율</span>
                          </span>
                          <span className="font-mono tabular-nums text-neon font-black">
                            {app.currentTesters} / {app.targetTesters} 명 ({percentTesters}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-bg-dark rounded-full overflow-hidden border border-border-dark">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-neon rounded-full transition-all duration-500"
                            style={{ width: `${percentTesters}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-text-light/50 font-mono">
                          <span>최소 요건: 12명</span>
                          <span>{app.targetTesters - app.currentTesters > 0 ? `${app.targetTesters - app.currentTesters}명 추가 필요` : '✓ 12명 달성 완료'}</span>
                        </div>
                      </div>

                      {/* Metric 2: 14-Day Streak */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-text-light flex items-center gap-1.5">
                            <Clock size={14} className="text-lime-400" />
                            <span>14일 연속 테스트 유지 현황</span>
                          </span>
                          <span className="font-mono tabular-nums text-lime-400 font-black">
                            {app.daysElapsed} / {app.totalDays} 일차 ({percentDays}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-bg-dark rounded-full overflow-hidden border border-border-dark">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full transition-all duration-500"
                            style={{ width: `${percentDays}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-text-light/50 font-mono">
                          <span>시작일: {app.createdAt}</span>
                          <span className="text-amber-400 font-bold">
                            {daysRemaining > 0 ? `D-${daysRemaining}일 남음 (예상 신청일: 11월 20일)` : '🎉 14일 충족! 프로덕션 신청 가능'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Joined Testers Table */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-white flex items-center gap-2">
                          <ShieldCheck size={14} className="text-neon" />
                          <span>현재 활성 테스터 명단 ({app.testersList?.length || 0}명)</span>
                        </h4>
                        <span className="text-[11px] text-text-light/50">
                          실시간 접속 확인: 7명 전원 정상 유지 중
                        </span>
                      </div>

                      <div className="overflow-x-auto border border-border-dark rounded-xl bg-bg-dark/50">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border-dark bg-white/[0.02] text-text-light/40 text-[10px] uppercase font-mono">
                              <th className="py-2.5 px-4">테스터 닉네임</th>
                              <th className="py-2.5 px-4">사용 기기</th>
                              <th className="py-2.5 px-4">유지 일수</th>
                              <th className="py-2.5 px-4">최근 인증 상태</th>
                              <th className="py-2.5 px-4 text-right">상태</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-dark/40 font-mono text-[11px]">
                            {app.testersList?.map((t) => (
                              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-neon/10 text-neon flex items-center justify-center text-[10px]">
                                    {t.name.charAt(0)}
                                  </div>
                                  <span>{t.name}</span>
                                </td>
                                <td className="py-2.5 px-4 text-text-light/70">{t.device}</td>
                                <td className="py-2.5 px-4 text-lime-400 font-bold">{t.day}일차 완료</td>
                                <td className="py-2.5 px-4 text-text-light/60 font-sans">{t.verifiedAt}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                    <CheckCircle2 size={11} />
                                    정상 유지
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EXPLORE & EARN CREDITS */}
        {/* ========================================================================= */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>맞테스트 참여하고 크레딧 모으기</span>
                  <span className="text-xs font-normal text-text-light/50 font-mono">
                    (남의 앱 1개 설치 = +1 크레딧 = 내 앱 테스터 1명 확보)
                  </span>
                </h2>
                <p className="text-xs text-text-light/60 mt-1">
                  동료 개발자의 앱을 테스트하고 인증하면 즉시 크레딧이 충전되어 내 앱의 테스터로 교환할 수 있습니다.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative min-w-[200px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="앱 이름 또는 패키지 검색..."
                    className="w-full bg-bg-card border border-border-dark pl-9 pr-3 py-1.5 text-xs text-text-light rounded-lg outline-none focus:border-neon"
                  />
                </div>
              </div>
            </div>

            {/* Grid of Community Apps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityApps
                .filter(app => {
                  const matchSearch = app.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                                      app.packageName.toLowerCase().includes(searchFilter.toLowerCase());
                  return matchSearch;
                })
                .map((app) => {
                  const isTested = testedAppIds.includes(app.id);
                  const daysRemaining = app.totalDays - app.daysElapsed;

                  return (
                    <div 
                      key={app.id} 
                      className={`bg-bg-card/70 border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                        isTested 
                          ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                          : 'border-border-dark hover:border-neon/50'
                      }`}
                    >
                      <div>
                        {/* Top bar */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-white font-black text-lg shadow shrink-0`}>
                            {app.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-mono text-neon bg-neon/10 px-2 py-0.5 rounded border border-neon/30">
                              {app.category}
                            </span>
                            <span className="text-[10px] text-text-light/40 mt-1 font-mono">
                              개발자: {app.developer}
                            </span>
                          </div>
                        </div>

                        {/* Title & info */}
                        <h3 className="font-bold text-white text-base leading-snug mb-1">
                          {app.name}
                        </h3>
                        <p className="text-[11px] font-mono text-text-light/40 mb-3 truncate">
                          {app.packageName}
                        </p>
                        <p className="text-xs text-text-light/70 line-clamp-2 leading-relaxed mb-4">
                          {app.summary}
                        </p>

                        {/* Progress */}
                        <div className="space-y-1.5 p-3 bg-white/[0.02] rounded-xl border border-border-dark/40 mb-4 text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-text-light/50">모집 인원:</span>
                            <span className="text-neon font-bold">{app.currentTesters} / {app.targetTesters} 명</span>
                          </div>
                          <div className="w-full h-1.5 bg-bg-dark rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neon rounded-full" 
                              style={{ width: `${(app.currentTesters / app.targetTesters) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] pt-1 text-text-light/40">
                            <span>진행: {app.daysElapsed}일차</span>
                            <span className="text-amber-400 font-bold">D-{daysRemaining}일 남음</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 pt-2">
                        <a
                          href={app.webTestingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-border-dark text-xs text-center rounded-lg flex items-center justify-center gap-1.5 text-text-light hover:text-white transition-colors"
                        >
                          <ExternalLink size={13} />
                          <span>1. 테스터 참여 링크 열기</span>
                        </a>

                        <button
                          onClick={() => setVerifyModalApp(app)}
                          disabled={isTested}
                          className={`w-full py-2.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isTested 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                              : 'bg-neon hover:bg-cyan-300 text-bg-dark shadow-[0_0_12px_rgba(0,243,255,0.2)]'
                          }`}
                        >
                          {isTested ? (
                            <>
                              <CheckCircle2 size={14} />
                              <span>인증 완료 (+1C 획득됨)</span>
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              <span>2. 설치 인증하고 +1 크레딧 받기</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: STEP-BY-STEP TUTORIAL */}
        {/* ========================================================================= */}
        {activeTab === 'guide' && (
          <div className="space-y-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>구글 플레이 콘솔 1분 연동 완벽 가이드</span>
                </h2>
                <p className="text-xs text-text-light/60 mt-1">
                  복잡한 과정 없이 가장 빠르고 안전하게 12인 14일 조건을 통과하는 표준 방법입니다.
                </p>
              </div>
              {onOpenBuildSyncGuide && (
                <button
                  onClick={onOpenBuildSyncGuide}
                  className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <AlertTriangle size={15} />
                  <span>다른 앱 표시·빌드 동기화 진단하기</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-bg-card/70 border border-border-dark p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neon text-bg-dark font-black flex items-center justify-center text-sm">
                    1
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Google 그룹스(Google Groups) 주소 복사하기
                  </h3>
                </div>
                <p className="text-xs text-text-light/70 leading-relaxed pl-11">
                  구글 콘솔에서 테스터 12명의 이메일을 일일이 묻고 적지 않아도 됩니다. 아래 공용 그룹 이메일 하나만 등록하면 연합 테스터들이 자동으로 앱을 설치할 수 있습니다.
                </p>
                <div className="pl-11 pt-1 flex items-center gap-3">
                  <code className="px-3 py-2 bg-bg-dark border border-neon/40 text-neon font-mono text-xs rounded-lg">
                    {SHARED_GOOGLE_GROUP}
                  </code>
                  <button
                    onClick={() => handleCopy(SHARED_GOOGLE_GROUP, 'group')}
                    className="px-3 py-2 bg-neon/10 hover:bg-neon hover:text-bg-dark border border-neon/40 text-neon text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>복사하기</span>
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-bg-card/70 border border-border-dark p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neon text-bg-dark font-black flex items-center justify-center text-sm">
                    2
                  </span>
                  <h3 className="text-base font-bold text-white">
                    구글 플레이 콘솔 테스터 탭에 등록하기
                  </h3>
                </div>
                <div className="text-xs text-text-light/70 leading-relaxed pl-11 space-y-2">
                  <p>1. 구글 플레이 콘솔 ➜ 내 앱(any1.ai) ➜ 왼쪽 <strong>비공개 테스트</strong> 클릭</p>
                  <p>2. 상단 <strong>[테스터]</strong> 탭 클릭 ➜ 아래로 스크롤하여 <strong>Google 그룹스</strong> 선택</p>
                  <p>3. 복사한 <code>{SHARED_GOOGLE_GROUP}</code> 주소를 추가하고 오른쪽 아래 <strong>[변경사항 저장]</strong> 클릭!</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-bg-card/70 border border-border-dark p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-neon text-bg-dark font-black flex items-center justify-center text-sm">
                    3
                  </span>
                  <h3 className="text-base font-bold text-white">
                    비공개 테스트 참여 링크 복사하여 이 사이트에 등록하기
                  </h3>
                </div>
                <div className="text-xs text-text-light/70 leading-relaxed pl-11 space-y-2">
                  <p>테스터 탭 맨 아래에 있는 <strong>"웹에서 참여"</strong> 링크(예: <code>https://play.google.com/apps/testing/...</code>)를 복사해 상단의 <strong>[내 앱 등록하기]</strong> 버튼을 누르고 붙여넣으시면 즉시 매칭이 시작됩니다!</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="border-t border-border-dark pt-6 space-y-4">
              <h3 className="text-base font-bold text-white">자주 묻는 질문 (FAQ)</h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-white/[0.02] border border-border-dark rounded-xl">
                  <span className="font-bold text-neon block mb-1">Q. 14일 동안 앱을 스마트폰에서 지우면 안 되나요?</span>
                  <p className="text-text-light/70">네, 절대 지우시면 안 됩니다! 구글 시스템이 매일 활성 설치 기기 수를 체크하므로 14일이 끝나고 정식 출시 승인이 날 때까지 유지해야 합니다.</p>
                </div>

                <div className="p-4 bg-white/[0.02] border border-border-dark rounded-xl">
                  <span className="font-bold text-neon block mb-1">Q. 매일 앱을 실행해 봐야 하나요?</span>
                  <p className="text-text-light/70">구글 심사관은 앱이 단순히 깔려만 있는지, 실제로 켜서 사용하는지를 데이터로 봅니다. 하루 1번 30초 정도 앱을 열어 피드백을 주는 것이 100% 승인의 비결입니다.</p>
                </div>

                <div className="p-4 bg-white/[0.02] border border-border-dark rounded-xl">
                  <span className="font-bold text-neon block mb-1">Q. 14일이 지나면 어떻게 되나요?</span>
                  <p className="text-text-light/70">구글 콘솔 대시보드의 비활성화되어 있던 [프로덕션 신청] 파란 버튼이 켜집니다. 그 버튼을 누르고 간단한 테스트 결과 설문을 제출하면 1~2일 내에 정식 출시됩니다!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FAST-TRACK / PRICING */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>바쁜 1인 개발자를 위한 패스트트랙 요금제</span>
                </h2>
                <p className="text-xs text-text-light/60 mt-1">
                  품앗이할 시간이 부족한 개발자분들을 위해 전문 인증 테스터 12~20명을 즉시 100% 보증 배정해 드립니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckoutMode('lookup');
                  setIsCheckoutModalOpen(true);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-border-dark hover:border-neon text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search size={13} className="text-neon" />
                <span>내 결제·신청 내역 조회</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan 1 */}
              <div className="bg-bg-card/70 border border-border-dark p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold text-text-light/50 uppercase">Free Community</span>
                  <h3 className="text-xl font-black text-white mt-1">상호 품앗이</h3>
                  <p className="text-xs text-text-light/60 mt-2">다른 개발자의 앱을 테스트하고 12 크레딧을 모아 무료로 내 앱을 출시하세요.</p>
                  
                  <div className="mt-6 mb-6">
                    <span className="text-3xl font-black text-white font-mono">0원</span>
                    <span className="text-xs text-text-light/40 ml-1">/ 평생 무료</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-text-light/70">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span>1:1 상호 맞테스트 매칭</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span>설치 인증 및 크레딧 시스템</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span>14일 유지 진행률 트래커</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setActiveTab('explore')}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-border-dark text-xs font-bold rounded-lg transition-colors text-white cursor-pointer"
                >
                  지금 품앗이 시작하기
                </button>
              </div>

              {/* Plan 2: Best Value */}
              <div className="bg-bg-card border-2 border-neon p-6 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-[0_0_30px_rgba(0,243,255,0.15)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neon text-bg-dark text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow">
                  가장 인기 (BEST)
                </div>

                <div>
                  <span className="text-xs font-mono font-bold text-neon uppercase">Instant 12 Testers</span>
                  <h3 className="text-xl font-black text-white mt-1">패스트트랙 12</h3>
                  <p className="text-xs text-text-light/60 mt-2">내가 남의 앱을 깔지 않아도 12명의 전담 테스터가 즉시 배정되어 14일을 완주합니다.</p>
                  
                  <div className="mt-6 mb-6">
                    <span className="text-3xl font-black text-neon font-mono">29,000원</span>
                    <span className="text-xs text-text-light/40 ml-1">/ 1개 앱</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-text-light/80">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span><strong>12명 전담 실기기 테스터 24시간 내 배정</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span><strong>14일 연속 앱 유지 100% 보증</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span>매일 1회 실행 및 접속 데이터 보증</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-neon shrink-0" />
                      <span>중도 탈락 발생 시 즉시 무료 대체 투입</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setCheckoutPlanId('fasttrack12');
                    setCheckoutMode('checkout');
                    setIsCheckoutModalOpen(true);
                  }}
                  className="w-full py-3 bg-neon hover:bg-cyan-300 text-bg-dark text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} />
                  <span>패스트트랙 12 신청하기 (29,000원)</span>
                </button>
              </div>

              {/* Plan 3: VIP Guaranteed */}
              <div className="bg-bg-card/70 border border-border-dark p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">100% Safe Pass</span>
                  <h3 className="text-xl font-black text-white mt-1">VIP 올패스 보증형</h3>
                  <p className="text-xs text-text-light/60 mt-2">20명 여유 배정 + 정식 출시 반려 시 100% 전액 환불 또는 무료 재테스트.</p>
                  
                  <div className="mt-6 mb-6">
                    <span className="text-3xl font-black text-amber-300 font-mono">49,000원</span>
                    <span className="text-xs text-text-light/40 ml-1">/ 1개 앱</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-text-light/70">
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-amber-400 shrink-0" />
                      <span><strong>20명 넉넉한 테스터 풀 배정</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-amber-400 shrink-0" />
                      <span>정성스러운 구글 스토어 비공개 피드백 10건 작성</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-amber-400 shrink-0" />
                      <span>프로덕션 질문지 작성 모범 답변 가이드 제공</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={14} className="text-amber-400 shrink-0" />
                      <span>출시 반려 시 100% 무료 재테스트 보증</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setCheckoutPlanId('vip_allpass');
                    setCheckoutMode('checkout');
                    setIsCheckoutModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} />
                  <span>VIP 올패스 신청하기 (49,000원)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REGISTER APP MODAL */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card border border-border-dark rounded-2xl max-w-lg w-full p-6 lg:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neon text-bg-dark flex items-center justify-center font-bold">
                    {editingAppId ? <Pencil size={16} /> : <Plus size={18} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingAppId ? '내 앱 정보 수정' : '내 앱 맞테스트 등록'}
                    </h3>
                    <p className="text-[11px] text-text-light/50">
                      {editingAppId
                        ? '앱 이름, 패키지명, 테스트 링크, 한 줄 소개를 바로 고칠 수 있습니다'
                        : '30초 만에 등록하고 12인 맞테스터 매칭을 시작하세요'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setEditingAppId(null);
                  }}
                  className="text-text-light/40 hover:text-white text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterApp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-text-light/70 font-bold mb-1">앱 이름 *</label>
                  <input
                    type="text"
                    required
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="예: 뭐든대행, AI 스마트 가계부"
                    className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon font-sans"
                  />
                </div>

                <div>
                  <label className="block text-text-light/70 font-bold mb-1">안드로이드 패키지명 *</label>
                  <input
                    type="text"
                    required
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                    placeholder="예: com.mycompany.myapp"
                    className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-light/70 font-bold mb-1">카테고리</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon font-sans"
                    >
                      <option value="유틸리티">유틸리티/도구</option>
                      <option value="생산성">생산성/업무</option>
                      <option value="라이프스타일">라이프/생활</option>
                      <option value="금융">금융/가계부</option>
                      <option value="교육">교육/어학</option>
                      <option value="엔터테인먼트">엔터테인먼트/게임</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-light/70 font-bold mb-1">등록 비용 / 크레딧</label>
                    <div className="p-2.5 bg-bg-dark border border-border-dark rounded-lg flex items-center justify-between text-amber-300 font-mono font-bold">
                      <span className="text-lime-400 font-bold text-xs">무료 (환영 혜택 지원)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCredits(prev => prev + 12);
                          showToast('⚡ +12 크레딧이 무료 충전되었습니다!');
                        }}
                        className="text-[10px] bg-neon/15 hover:bg-neon hover:text-bg-dark text-neon border border-neon/30 px-2 py-0.5 rounded transition-colors font-sans cursor-pointer"
                      >
                        +12C 무료충전
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-text-light/70 font-bold mb-1">
                    구글 플레이 비공개 테스트 링크 (웹 참여 링크)
                  </label>
                  <input
                    type="url"
                    value={newTestingUrl}
                    onChange={(e) => setNewTestingUrl(e.target.value)}
                    placeholder="https://play.google.com/apps/testing/com.example.app"
                    className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-text-light/40 mt-1">
                    * 비워두시면 입력하신 패키지명으로 자동 완성됩니다.
                  </p>
                </div>

                <div>
                  <label className="block text-text-light/70 font-bold mb-1">앱 한 줄 소개</label>
                  <input
                    type="text"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="테스터들이 어떤 앱인지 쉽게 알 수 있도록 적어주세요."
                    className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setEditingAppId(null);
                    }}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-text-light text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{editingAppId ? '수정 내용 저장하기' : '등록 및 12명 매칭 시작'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERIFY TEST MODAL */}
      <AnimatePresence>
        {verifyModalApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-card border border-border-dark rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-border-dark pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-neon" />
                  <h3 className="font-bold text-white text-base">앱 설치 및 1일차 테스트 인증</h3>
                </div>
                <button
                  onClick={() => setVerifyModalApp(null)}
                  className="text-text-light/40 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-white/[0.02] border border-border-dark rounded-xl flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${verifyModalApp.iconBg} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {verifyModalApp.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">{verifyModalApp.name}</h4>
                  <p className="text-[10px] text-text-light/40 font-mono">{verifyModalApp.packageName}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-text-light/80">
                <p className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-neon/20 text-neon flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                  <span>아래 링크를 눌러 구글 플레이 스토어에서 앱을 설치했는지 확인합니다.</span>
                </p>
                <div className="pl-6">
                  <a
                    href={verifyModalApp.webTestingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>{verifyModalApp.webTestingUrl}</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <p className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-neon/20 text-neon flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                  <span>앱을 실행하여 30초 이상 둘러본 후 14일간 앱을 삭제하지 않고 유지해 주세요.</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setVerifyModalApp(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-light text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  다음에 하기
                </button>
                <button
                  onClick={handleConfirmVerification}
                  className="px-5 py-2 bg-neon hover:bg-cyan-300 text-bg-dark text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>설치 완료 및 마이페이지에 등록</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REAL PAYMENT & ORDER LOOKUP MODAL */}
      <PaymentCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        initialPlanId={checkoutPlanId}
        initialMode={checkoutMode}
        onSuccessToast={(msg) => showToast(msg)}
      />
    </div>
  );
}
