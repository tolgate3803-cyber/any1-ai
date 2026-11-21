import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Trash2, 
  Globe, 
  Activity, 
  Clock, 
  Search, 
  Terminal, 
  UserCheck, 
  Server, 
  AlertTriangle, 
  FileCode,
  MapPin,
  Compass,
  Cpu,
  Monitor,
  Key,
  Check,
  CreditCard,
  Landmark,
  Wallet,
  CheckCircle2,
  XCircle,
  Info,
  Smartphone,
  Layers,
  Package,
  Megaphone
} from 'lucide-react';
import AdManagerPanel from './AdManagerPanel';

interface VisitLog {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  regionName: string;
  city: string;
  userAgent: string;
  referrer: string;
  featureAccess: string;
}

interface AdminOrderRecord {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  appName: string;
  packageName: string;
  depositorName: string;
  contact: string;
  email: string;
  paymentMethod: 'bank_transfer' | 'remittance_link' | 'toss_pg';
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
  paymentKey?: string;
}

interface AdminPaymentConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  remittanceUrl: string;
  contactInfo: string;
  paymentNotice: string;
  tossClientKey: string;
  tossSecretKey: string;
}

interface PaymentStats {
  totalConfirmedRevenue: number;
  pendingCount: number;
  paidCount: number;
  totalCount: number;
}

interface AdminDashboardProps {
  onBack?: () => void;
  onOpenIconGuide?: () => void;
  onOpenBuildSync?: () => void;
  onOpenAssets?: () => void;
}

export default function AdminDashboard({
  onBack,
  onOpenIconGuide,
  onOpenBuildSync,
  onOpenAssets
}: AdminDashboardProps = {}) {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Admin Console active section tab
  const [adminTab, setAdminTab] = useState<'traffic' | 'payments' | 'ads'>('traffic');

  // Payment & order management states
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalConfirmedRevenue: 0,
    pendingCount: 0,
    paidCount: 0,
    totalCount: 0
  });
  const [paymentConfig, setPaymentConfig] = useState<AdminPaymentConfig>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    remittanceUrl: '',
    contactInfo: '010-2459-9811 / tolgate3803@gmail.com',
    paymentNotice: '입금 확인 후 이용권 승인 및 안내 메일/연락을 빠르게 보내드립니다.',
    tossClientKey: '',
    tossSecretKey: ''
  });
  const [showTossKeys, setShowTossKeys] = useState(false);
  const [savingPaymentCfg, setSavingPaymentCfg] = useState(false);
  const [paymentCfgMessage, setPaymentCfgMessage] = useState<{ success?: boolean; text?: string }>({});
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'paid' | 'completed' | 'cancelled'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderNotesDraft, setOrderNotesDraft] = useState<Record<string, string>>({});

  // New admin password update states
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [changeStatus, setChangeStatus] = useState<{ success?: boolean; message?: string; error?: string }>({});

  // Check if they already unlocked it in this session
  useEffect(() => {
    const savedPass = localStorage.getItem('any1_admin_password');
    if (savedPass) {
      setPassword(savedPass);
      verifyPassword(savedPass);
    }
  }, []);

  // Handle auto-refresh
  useEffect(() => {
    if (isAuthorized && autoRefresh) {
      refreshTimer.current = setInterval(() => {
        fetchLogs(password, true);
        fetchOrders(password, true);
      }, 5000); // refresh every 5s
    } else {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    }
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [isAuthorized, autoRefresh, password]);

  const verifyPassword = async (passToVerify: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passToVerify })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthorized(true);
        setLogs(data.visits);
        localStorage.setItem('any1_admin_password', passToVerify);
        fetchOrders(passToVerify, true);
      } else {
        setError(data.error || '비밀번호가 올바르지 않습니다.');
        setIsAuthorized(false);
      }
    } catch (err) {
      setError('서버와 통신하는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (pass: string, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch('/api/admin/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.visits);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const fetchOrders = async (pass: string, quiet = false) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        if (data.stats) setPaymentStats(data.stats);
        if (!quiet && data.paymentConfig) {
          setPaymentConfig(data.paymentConfig);
        } else if (data.paymentConfig) {
          setPaymentConfig((prev) => ({
            ...data.paymentConfig,
            bankName: prev.bankName || data.paymentConfig.bankName,
            accountNumber: prev.accountNumber || data.paymentConfig.accountNumber,
            accountHolder: prev.accountHolder || data.paymentConfig.accountHolder,
            remittanceUrl: prev.remittanceUrl || data.paymentConfig.remittanceUrl,
            contactInfo: prev.contactInfo || data.paymentConfig.contactInfo,
            paymentNotice: prev.paymentNotice || data.paymentConfig.paymentNotice
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPaymentCfg(true);
    setPaymentCfgMessage({});
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          config: paymentConfig
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.paymentConfig) setPaymentConfig(data.paymentConfig);
        setPaymentCfgMessage({
          success: true,
          text: '정산 계좌 및 결제 설정이 저장되어 고객 결제창에 즉시 반영되었습니다!'
        });
      } else {
        setPaymentCfgMessage({
          success: false,
          text: data.error || '결제 설정 저장에 실패했습니다.'
        });
      }
    } catch {
      setPaymentCfgMessage({
        success: false,
        text: '서버와 통신 중 오류가 발생했습니다.'
      });
    } finally {
      setSavingPaymentCfg(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: AdminOrderRecord['status']
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const adminNote = orderNotesDraft[orderId];
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          status,
          ...(typeof adminNote === 'string' ? { adminNote } : {})
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchOrders(password, true);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPassword(password);
  };

  const handleLogout = () => {
    localStorage.removeItem('any1_admin_password');
    setIsAuthorized(false);
    setPassword('');
    setLogs([]);
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdminPassword(generated);
    setChangeStatus({});
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.trim().length < 4) {
      setChangeStatus({ error: '비밀번호는 최소 4자 이상이어야 합니다.' });
      return;
    }
    
    setIsChanging(true);
    setChangeStatus({});
    
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword: newAdminPassword.trim()
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setChangeStatus({ success: true, message: '보안 비밀번호가 성공적으로 변경 및 반영되었습니다!' });
        const updatedPass = newAdminPassword.trim();
        setPassword(updatedPass);
        localStorage.setItem('any1_admin_password', updatedPass);
        setNewAdminPassword('');
      } else {
        setChangeStatus({ error: data.error || '비밀번호 변경 중 오류가 발생했습니다.' });
      }
    } catch (err) {
      setChangeStatus({ error: '서버와 통신하는 중 오류가 발생했습니다.' });
    } finally {
      setIsChanging(false);
    }
  };

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.ip?.toLowerCase().includes(term) ||
      log.country?.toLowerCase().includes(term) ||
      log.regionName?.toLowerCase().includes(term) ||
      log.city?.toLowerCase().includes(term) ||
      log.featureAccess?.toLowerCase().includes(term) ||
      log.userAgent?.toLowerCase().includes(term)
    );
  });

  // Calculate stats
  const totalVisits = logs.length;
  const uniqueIps = new Set(logs.map(l => l.ip)).size;
  
  // Unique countries and regions
  const uniqueCountries = new Set(logs.filter(l => l.country && l.country !== 'Unknown' && l.country !== 'API Node').map(l => l.country)).size;
  const uniqueRegions = new Set(logs.filter(l => l.regionName && l.regionName !== 'Unknown' && l.regionName !== 'Engine Core').map(l => l.regionName)).size;

  // Feature usage count
  const featureStats: Record<string, number> = {};
  logs.forEach(log => {
    const f = log.featureAccess || 'Unknown';
    featureStats[f] = (featureStats[f] || 0) + 1;
  });
  const sortedFeatures = Object.entries(featureStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto py-24 font-mono">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-dark border border-border-dark p-8 rounded shadow-2xl relative"
        >
          {/* Futuristic corner lines */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon" />

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 border border-neon bg-neon/5 flex items-center justify-center rounded-full mb-4 animate-[pulse_2s_infinite]">
              <Lock size={28} className="text-neon" />
            </div>
            <span className="text-[10px] text-neon uppercase tracking-[0.3em] font-black mb-1">Restricted Area</span>
            <h2 className="text-xl font-black text-text-light uppercase tracking-wide">
              개발자 제어 콘솔
            </h2>
            <p className="text-xs text-text-light/40 font-sans mt-2">
              실시간 접속 분석 및 시스템 로그 조회를 위해 보안 비밀번호를 입력해 주십시오.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] text-text-light/50 font-bold uppercase tracking-wider block">
                ADMIN ACCESS PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full bg-black/40 border border-border-dark px-4 py-3 text-sm text-text-light outline-none focus:border-neon font-mono text-center tracking-widest rounded-sm transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 rounded-sm font-sans">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-neon hover:bg-white text-bg-dark text-xs font-black uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  <Unlock size={14} />
                  CONSOLE UNLOCK
                </>
              )}
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 text-xs text-text-light/50 hover:text-white transition-colors border border-transparent hover:border-border-dark rounded-sm uppercase tracking-wider"
              >
                ← 일반 대시보드로 돌아가기
              </button>
            )}
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-4">
            <p className="text-[10px] text-text-light/30 leading-relaxed font-sans">
              비밀번호는 보안을 위해 서버 사이드 세션과 비교 분석됩니다.<br />
              (기본 설정 비밀번호는 <code className="bg-white/5 px-1 text-neon/70 rounded">admin1234</code> 입니다)
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-mono max-w-7xl mx-auto py-4">
      {/* Admin Title & Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-dark pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-neon font-black tracking-[0.3em] uppercase block mb-1">
              <Shield size={10} className="inline mr-1 -mt-0.5" /> SYSTEM OPERATIONS COMMAND CENTER
            </span>
            {onBack && (
              <button
                onClick={onBack}
                className="px-2.5 py-0.5 text-[10px] border border-neon/40 text-neon hover:bg-neon hover:text-bg-dark rounded font-bold uppercase tracking-wider transition-all"
              >
                ← 나가기
              </button>
            )}
          </div>
          <h2 className="text-3xl font-black text-text-light uppercase tracking-wider">
            실시간 트래픽 & 관제 대시보드
          </h2>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
          <div className="flex items-center gap-2 bg-black/40 border border-border-dark px-3 py-2 rounded-sm text-xs">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-neon w-3.5 h-3.5"
            />
            <label htmlFor="auto-refresh" className="text-[10px] text-text-light/60 font-bold uppercase tracking-wide cursor-pointer select-none">
              실시간 자동 갱신 (5초)
            </label>
          </div>

          <button
            onClick={() => {
              fetchLogs(password);
              fetchOrders(password);
            }}
            disabled={loading}
            className="px-4 py-2 border border-border-dark hover:border-neon text-[10px] font-bold text-text-light hover:text-neon transition-all flex items-center gap-1.5 uppercase rounded-sm cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] font-bold transition-all uppercase rounded-sm cursor-pointer"
          >
            콘솔 잠금
          </button>
        </div>
      </div>

      {/* Console Section Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-border-dark pb-4">
        <button
          type="button"
          onClick={() => setAdminTab('traffic')}
          className={`px-4 py-2.5 text-xs font-black rounded-sm transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'traffic'
              ? 'bg-neon text-bg-dark shadow-[0_0_15px_rgba(0,243,255,0.25)]'
              : 'bg-black/30 border border-border-dark text-text-light/60 hover:text-white hover:border-neon/50'
          }`}
        >
          <Activity size={14} />
          <span>실시간 트래픽 &amp; 보안 관제</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('payments');
            fetchOrders(password, false);
          }}
          className={`px-4 py-2.5 text-xs font-black rounded-sm transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'payments'
              ? 'bg-neon text-bg-dark shadow-[0_0_15px_rgba(0,243,255,0.25)]'
              : 'bg-black/30 border border-border-dark text-text-light/60 hover:text-white hover:border-neon/50'
          }`}
        >
          <CreditCard size={14} />
          <span>결제·정산 &amp; 입금계좌 관리</span>
          {paymentStats.pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                adminTab === 'payments'
                  ? 'bg-bg-dark text-neon'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              대기 {paymentStats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('ads')}
          className={`px-4 py-2.5 text-xs font-black rounded-sm transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'ads'
              ? 'bg-neon text-bg-dark shadow-[0_0_15px_rgba(0,243,255,0.25)]'
              : 'bg-black/30 border border-border-dark text-text-light/60 hover:text-white hover:border-neon/50'
          }`}
        >
          <Megaphone size={14} />
          <span>광고판 · 영상 관리</span>
        </button>

        {onOpenIconGuide && (
          <button
            type="button"
            onClick={onOpenIconGuide}
            className="px-3.5 py-2.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone size={13} />
            <span>아이콘 일치 가이드</span>
          </button>
        )}

        {onOpenBuildSync && (
          <button
            type="button"
            onClick={onOpenBuildSync}
            className="px-3.5 py-2.5 text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers size={13} />
            <span>빌드·콘솔 동기화</span>
          </button>
        )}

        {onOpenAssets && (
          <button
            type="button"
            onClick={onOpenAssets}
            className="px-3.5 py-2.5 text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package size={13} />
            <span>스토어 그래픽 에셋</span>
          </button>
        )}
      </div>

      {adminTab === 'ads' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-neon/5 border border-neon/25 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-text-light/80">
              <span className="font-black text-neon">관리자 전용 광고판 관리</span> · 여기서 홍보 영상을 올리거나 수정/숨기기 하면 메인 화면 광고판에 즉시 반영됩니다.
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                메인 화면에서 바로 확인하기
              </button>
            )}
          </div>
          <AdManagerPanel adminPassword={password} />
        </div>
      ) : adminTab === 'payments' ? (
        <div className="space-y-8 font-sans">
          {/* Payment Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-neon">
                <Wallet size={48} />
              </div>
              <span className="text-[10px] text-neon uppercase tracking-widest font-bold block mb-1">
                CONFIRMED REVENUE
              </span>
              <h3 className="text-2xl font-black text-text-light">
                {paymentStats.totalConfirmedRevenue.toLocaleString()}{' '}
                <span className="text-xs font-normal text-text-light/40">원</span>
              </h3>
              <p className="text-[10px] text-text-light/40 mt-2 font-sans">입금 확인·배정 완료된 누적 매출</p>
            </div>

            <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-400">
                <Clock size={48} />
              </div>
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block mb-1">
                PENDING ORDERS
              </span>
              <h3 className="text-2xl font-black text-amber-300">
                {paymentStats.pendingCount} <span className="text-xs font-normal text-text-light/40">건</span>
              </h3>
              <p className="text-[10px] text-text-light/40 mt-2 font-sans">입금 확인이 필요한 신규 신청 건</p>
            </div>

            <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-400">
                <CheckCircle2 size={48} />
              </div>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold block mb-1">
                PAID / COMPLETED
              </span>
              <h3 className="text-2xl font-black text-emerald-400">
                {paymentStats.paidCount} <span className="text-xs font-normal text-text-light/40">건</span>
              </h3>
              <p className="text-[10px] text-text-light/40 mt-2 font-sans">입금 확인 및 이용권·배정 완료 건</p>
            </div>

            <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-400">
                <Landmark size={48} />
              </div>
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold block mb-1">
                SETTLEMENT ACCOUNT
              </span>
              <h3 className="text-sm font-black text-white truncate mt-1">
                {paymentConfig.bankName && paymentConfig.accountNumber
                  ? `${paymentConfig.bankName} ${paymentConfig.accountNumber}`
                  : '미등록 (아래에서 설정)'}
              </h3>
              <p className="text-[10px] text-text-light/40 mt-2 font-sans">
                {paymentConfig.tossClientKey && paymentConfig.tossSecretKey
                  ? '토스페이먼츠 PG 키 연동됨'
                  : '무통장 계좌 / 간편송금 대기 모드'}
              </p>
            </div>
          </div>

          {/* Settlement & Bank Account Settings Form */}
          <div className="bg-black/30 border border-border-dark p-6 rounded-sm space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border border-neon bg-neon/5 flex items-center justify-center rounded-full shrink-0">
                  <Landmark size={18} className="text-neon" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    실제 입금받을 계좌 · 송금링크 · PG 결제 설정
                  </h4>
                  <p className="text-xs text-text-light/55 mt-0.5">
                    여기에 본인 은행 계좌나 토스/카카오페이 송금 링크, 카드 PG 키를 저장하면 방문자가 유료 이용권 결제 시 즉시 카드결제 또는 계좌입금을 진행할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePaymentConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-text-light/70 font-bold mb-1.5">입금 은행명</label>
                  <input
                    type="text"
                    value={paymentConfig.bankName}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bankName: e.target.value })}
                    placeholder="예: 카카오뱅크, 국민은행, 토스뱅크"
                    className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon"
                  />
                </div>
                <div>
                  <label className="block text-text-light/70 font-bold mb-1.5">입금 계좌번호</label>
                  <input
                    type="text"
                    value={paymentConfig.accountNumber}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountNumber: e.target.value })}
                    placeholder="예: 3333-01-1234567"
                    className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon font-mono"
                  />
                </div>
                <div>
                  <label className="block text-text-light/70 font-bold mb-1.5">예금주명</label>
                  <input
                    type="text"
                    value={paymentConfig.accountHolder}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, accountHolder: e.target.value })}
                    placeholder="예: 홍길동 (또는 오로라크라운)"
                    className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-text-light/70 font-bold mb-1.5">
                    토스·카카오페이 간편 송금 링크 (선택)
                  </label>
                  <input
                    type="url"
                    value={paymentConfig.remittanceUrl}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, remittanceUrl: e.target.value })}
                    placeholder="예: https://toss.me/내아이디 또는 https://qr.kakaopay.com/..."
                    className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon font-mono"
                  />
                </div>
                <div>
                  <label className="block text-text-light/70 font-bold mb-1.5">고객 문의 연락처 / 이메일</label>
                  <input
                    type="text"
                    value={paymentConfig.contactInfo}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, contactInfo: e.target.value })}
                    placeholder="예: tolgate3803@gmail.com 또는 오픈카톡 URL"
                    className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-text-light/70 font-bold mb-1.5">결제 완료/접수 후 안내 문구</label>
                <input
                  type="text"
                  value={paymentConfig.paymentNotice}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, paymentNotice: e.target.value })}
                  className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon"
                />
              </div>

              {/* Optional PG API Keys */}
              <div className="border border-white/10 rounded-sm p-4 bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setShowTossKeys(!showTossKeys)}
                  className="w-full flex items-center justify-between text-xs font-bold text-neon cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard size={14} />
                    <span>[선택] 토스페이먼츠 PG 카드 자동결제 키 연동 (사업자 가입 완료 시)</span>
                  </span>
                  <span>{showTossKeys ? '접기 ▲' : '설정 열기 ▼'}</span>
                </button>

                {showTossKeys && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                    <div>
                      <label className="block text-text-light/70 font-bold mb-1.5">Toss Client Key</label>
                      <input
                        type="text"
                        value={paymentConfig.tossClientKey}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, tossClientKey: e.target.value })}
                        placeholder="test_ck_... 또는 live_ck_..."
                        className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-text-light/70 font-bold mb-1.5">
                        Toss Secret Key (서버 전용 보안 보관)
                      </label>
                      <input
                        type="password"
                        value={paymentConfig.tossSecretKey}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, tossSecretKey: e.target.value })}
                        placeholder="test_sk_... 또는 live_sk_..."
                        className="w-full bg-black/40 border border-border-dark px-3.5 py-2.5 text-white rounded-sm outline-none focus:border-neon font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-sm bg-blue-500/10 border border-blue-500/25 text-xs text-blue-200 flex items-start gap-2.5 leading-relaxed">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-300" />
                <div>
                  <strong>웹 결제 vs 구글 플레이 앱 결제 안내:</strong> 웹사이트(웹 브라우저)에서 ANY1 AI 유료 이용권 또는 서비스 상품을 판매할 때는 위의 계좌이체·간편송금·토스페이먼츠로 바로 정산받으실 수 있습니다. 단, 구글 플레이 스토어에서 다운받은 <strong>안드로이드 앱 내부에서 앱 자체 디지털 기능/구독을 판매</strong>하실 때는 구글 정책상 Google Play Billing(인앱 결제)을 사용해야 합니다.
                </div>
              </div>

              {paymentCfgMessage.text && (
                <div
                  className={`p-3 rounded-sm text-xs flex items-center gap-2 border ${
                    paymentCfgMessage.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {paymentCfgMessage.success ? <Check size={14} /> : <AlertTriangle size={14} />}
                  <span>{paymentCfgMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPaymentCfg}
                  className="px-6 py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  {savingPaymentCfg ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>입금 계좌 및 결제 설정 저장하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Orders Management Table */}
          <div className="bg-black/20 border border-border-dark rounded-sm p-5 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-white/10">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} className="text-neon" />
                <span>결제 · 신청 주문 관리 ({orders.length}건)</span>
              </h4>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className="bg-black/40 border border-border-dark px-3 py-1.5 text-xs text-white rounded-sm outline-none focus:border-neon"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">입금 확인 대기</option>
                  <option value="paid">입금 확인 완료</option>
                  <option value="completed">승인/배정 완료</option>
                  <option value="cancelled">취소됨</option>
                </select>
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="주문번호, 입금자, 앱명, 이메일 검색"
                    className="w-full bg-black/40 border border-border-dark pl-8 pr-3 py-1.5 text-xs text-white rounded-sm outline-none focus:border-neon"
                  />
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-light/40" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-light/80 border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black text-text-light/40 uppercase bg-white/[0.01]">
                    <th className="py-3 px-3">주문번호 / 접수일</th>
                    <th className="py-3 px-3">상품 / 금액</th>
                    <th className="py-3 px-3">앱 / 신청자(입금자)</th>
                    <th className="py-3 px-3">상태</th>
                    <th className="py-3 px-3">메모 및 입금 확인 처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders
                    .filter((o) => {
                      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
                      const q = orderSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        o.id.toLowerCase().includes(q) ||
                        o.appName.toLowerCase().includes(q) ||
                        o.depositorName.toLowerCase().includes(q) ||
                        o.email.toLowerCase().includes(q) ||
                        o.contact.toLowerCase().includes(q)
                      );
                    })
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02] align-top">
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <div className="font-bold text-white">{order.id}</div>
                          <div className="text-[10px] text-text-light/40 mt-0.5">
                            {new Date(order.createdAt).toLocaleString('ko-KR')}
                          </div>
                          <div className="text-[10px] text-cyan-300/80 mt-0.5">
                            {order.paymentMethod === 'toss_pg'
                              ? '토스PG 카드'
                              : order.paymentMethod === 'remittance_link'
                                ? '간편송금 링크'
                                : '무통장입금'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">
                            {order.planName || (order.planId === 'vip_allpass' ? 'VIP 올패스' : '패스트트랙 12')}
                          </div>
                          <div className="font-mono font-black text-neon mt-0.5">
                            {order.amount.toLocaleString()}원
                          </div>
                        </td>
                        <td className="py-3 px-3 space-y-0.5">
                          <div className="font-bold text-white">
                            {order.appName}{' '}
                            {order.packageName && (
                              <span className="font-mono text-[10px] text-text-light/50">
                                ({order.planId?.startsWith('any1_') ? `메모: ${order.packageName}` : order.packageName})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px]">
                            입금자: <strong className="text-amber-200">{order.depositorName}</strong>
                          </div>
                          <div className="text-[10px] text-text-light/60">
                            {order.contact} / {order.email}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {order.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              입금 대기중
                            </span>
                          )}
                          {order.status === 'paid' && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-neon border border-neon/30 text-[10px] font-bold">
                              입금 확인됨
                            </span>
                          )}
                          {order.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              승인 완료
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-bold">
                              취소됨
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 space-y-2 min-w-[230px]">
                          <input
                            type="text"
                            value={orderNotesDraft[order.id] ?? order.adminNote ?? ''}
                            onChange={(e) =>
                              setOrderNotesDraft((prev) => ({ ...prev, [order.id]: e.target.value }))
                            }
                            placeholder="고객에게 보여줄 안내 메모 입력..."
                            className="w-full bg-black/40 border border-border-dark px-2.5 py-1 text-[11px] text-white rounded-sm outline-none focus:border-neon"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                              className="px-2 py-1 bg-cyan-500/20 hover:bg-neon hover:text-bg-dark text-neon border border-neon/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              입금 확인
                            </button>
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500 hover:text-bg-dark text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              승인 완료
                            </button>
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="px-2 py-1 bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-0.5"
                            >
                              <XCircle size={10} />
                              <span>취소</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-light/40">
                        아직 접수된 유료 결제/신청 주문이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-neon">
            <Activity size={50} />
          </div>
          <span className="text-[10px] text-neon uppercase tracking-widest font-bold block mb-1">TOTAL HITS</span>
          <h3 className="text-3xl font-black text-text-light">{totalVisits} <span className="text-xs font-normal text-text-light/40">회</span></h3>
          <p className="text-[10px] text-text-light/40 mt-2 font-sans">누적 페이지 뷰 및 분석 API 호출 수</p>
        </div>

        <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-neon">
            <Monitor size={50} />
          </div>
          <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold block mb-1">UNIQUE IPS</span>
          <h3 className="text-3xl font-black text-text-light">{uniqueIps} <span className="text-xs font-normal text-text-light/40">개</span></h3>
          <p className="text-[10px] text-text-light/40 mt-2 font-sans">중복을 제외한 고유 방문자 회선 수</p>
        </div>

        <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-neon">
            <Globe size={50} />
          </div>
          <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold block mb-1">COUNTRIES / REGIONS</span>
          <h3 className="text-3xl font-black text-text-light">{uniqueCountries} <span className="text-xs text-text-light/40">/ {uniqueRegions}</span></h3>
          <p className="text-[10px] text-text-light/40 mt-2 font-sans">국가별 및 도시/지역별 인입 다양성</p>
        </div>

        <div className="bg-black/30 border border-border-dark p-5 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-neon">
            <Cpu size={50} />
          </div>
          <span className="text-[10px] text-yellow-500 uppercase tracking-widest font-bold block mb-1">SYSTEM STATE</span>
          <h3 className="text-3xl font-black text-emerald-400">ACTIVE <span className="text-xs font-normal text-emerald-500/60">ONLINE</span></h3>
          <p className="text-[10px] text-text-light/40 mt-2 font-sans">엔진 및 트래픽 실시간 수집 정상 동작 중</p>
        </div>
      </div>

      {/* Admin Password Management Card */}
      <div className="bg-black/30 border border-border-dark p-6 rounded-sm relative overflow-hidden space-y-4">
        {/* Futuristic corner indicators */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon/50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon/50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon/50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon/50" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-neon bg-neon/5 flex items-center justify-center rounded-full">
              <Key size={18} className="text-neon" />
            </div>
            <div>
              <h4 className="text-sm font-black text-text-light uppercase tracking-wider">
                관리자 보안 비밀번호 설정 &amp; 생성기
              </h4>
              <p className="text-[11px] text-text-light/40 font-sans mt-0.5">
                안전한 실시간 분석 관제를 위해, 기본 암호(admin1234) 대신 강력한 독립형 비밀번호를 발급하거나 임의 생성하여 적용할 수 있습니다.
              </p>
            </div>
          </div>
          
          <div className="text-right whitespace-nowrap">
            <span className="text-[10px] bg-neon/15 text-neon font-black font-mono border border-neon/30 px-2.5 py-1 uppercase rounded-sm">
              세션 활성 보안 등급: HIGH
            </span>
          </div>
        </div>

        <form onSubmit={handlePasswordChangeSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-8 space-y-2">
            <label className="text-[10px] text-text-light/50 font-bold uppercase tracking-wider block">
              새로운 관리자 비밀번호 입력 또는 자동 생성
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={newAdminPassword}
                  onChange={(e) => {
                    setNewAdminPassword(e.target.value);
                    setChangeStatus({});
                  }}
                  placeholder="새로운 비밀번호를 입력하시거나 우측의 '자동 생성'을 누르세요"
                  className="w-full bg-black/40 border border-border-dark px-4 py-2.5 text-xs text-text-light outline-none focus:border-neon font-mono rounded-sm transition-all"
                />
                {newAdminPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newAdminPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neon hover:text-white"
                    title="복사하기"
                  >
                    복사
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-border-dark hover:border-neon text-[10px] font-bold text-text-light hover:text-neon transition-all uppercase rounded-sm"
              >
                임의 생성
              </button>
            </div>
          </div>

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={isChanging}
              className="w-full py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black uppercase tracking-wider transition-all rounded-sm flex items-center justify-center gap-1.5"
            >
              {isChanging ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  비밀번호 저장 중...
                </>
              ) : (
                <>
                  <Check size={13} />
                  새 비밀번호 적용하기
                </>
              )}
            </button>
          </div>
        </form>

        {changeStatus.error && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 rounded-sm font-sans"
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{changeStatus.error}</span>
          </motion.div>
        )}

        {changeStatus.success && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2 rounded-sm font-sans"
          >
            <Check size={14} className="shrink-0 mt-0.5" />
            <span>{changeStatus.message} <strong>(다음 접속부터 새 비밀번호를 입력해야 합니다.)</strong></span>
          </motion.div>
        )}
      </div>

      {/* Analytics & Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Clicked Features */}
        <div className="bg-black/20 border border-border-dark p-5 rounded-sm space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-xs font-black text-neon uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={14} /> 인기 기능 분석 순위
            </h4>
          </div>
          {sortedFeatures.length === 0 ? (
            <p className="text-xs text-text-light/30 italic py-6 text-center font-sans">수집된 분석 요청 기록이 아직 없습니다.</p>
          ) : (
            <div className="space-y-3.5">
              {sortedFeatures.map(([feature, count], idx) => {
                const maxCount = sortedFeatures[0][1];
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={feature} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-light/70 truncate max-w-[200px] font-sans font-bold">
                        {idx + 1}. {feature}
                      </span>
                      <span className="text-neon font-bold font-mono">{count}회</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neon transition-all duration-500 rounded-full" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Browser & Referrer Insights */}
        <div className="bg-black/20 border border-border-dark p-5 rounded-sm space-y-4 lg:col-span-2">
          <div className="border-b border-white/5 pb-3">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={14} /> 실시간 런타임 환경 & 유입 출처
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] text-text-light/40 uppercase font-bold tracking-wider block">최근 유입 Referrers</span>
              <ul className="space-y-2 text-xs">
                {logs.slice(0, 5).map((log, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-white/[0.01] px-2.5 py-1.5 border border-white/5 rounded-sm">
                    <span className="text-text-light/70 truncate max-w-[200px] font-sans">{log.referrer || 'Direct'}</span>
                    <span className="text-[9px] text-text-light/30 uppercase">{formatTime(log.timestamp).split(' ')[3]}</span>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="text-xs text-text-light/30 italic font-sans">인입 기록 없음</li>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-text-light/40 uppercase font-bold tracking-wider block">마지막 인입 환경 (UserAgent)</span>
              <ul className="space-y-2 text-xs">
                {logs.slice(0, 5).map((log, idx) => (
                  <li key={idx} className="flex gap-2 items-center bg-white/[0.01] px-2.5 py-1.5 border border-white/5 rounded-sm">
                    <Monitor size={10} className="text-neon shrink-0" />
                    <span className="text-text-light/70 truncate font-mono text-[10px]">{log.userAgent}</span>
                  </li>
                ))}
                {logs.length === 0 && (
                  <li className="text-xs text-text-light/30 italic font-sans">인입 기록 없음</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Logs Feed */}
      <div className="bg-black/20 border border-border-dark rounded-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-white/5">
          <h4 className="text-xs font-black text-text-light uppercase tracking-wider flex items-center gap-2">
            <Activity className="text-neon animate-pulse" size={14} />
            실시간 방문 및 분석 히스토리 피드
          </h4>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="IP, 국가, 도시, 기능으로 검색..."
              className="w-full bg-black/40 border border-border-dark/60 focus:border-neon px-9 py-1.5 text-xs text-text-light placeholder:text-text-light/20 outline-none rounded-sm"
            />
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/30" />
          </div>
        </div>

        {/* Live log entries */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-text-light/70 border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black text-text-light/30 uppercase tracking-widest bg-white/[0.01]">
                <th className="py-3 px-4">접속 시간</th>
                <th className="py-3 px-4">네트워크 주소 (IP)</th>
                <th className="py-3 px-4">위치 (국가/도시)</th>
                <th className="py-3 px-4">이동 / 활성 이벤트</th>
                <th className="py-3 px-4 max-w-[200px] truncate">유입 소스 및 환경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredLogs.map((log) => {
                const isApiCall = log.featureAccess.includes('분석 요청 수행');
                return (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-text-light/50 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={11} className="text-text-light/30" />
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-text-light/80">
                      {log.ip}
                    </td>
                    <td className="py-3 px-4">
                      {log.country === 'API Node' ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-neon/15 text-neon font-black font-mono border border-neon/20 rounded-sm">
                          API CORE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-text-light/70">
                          <MapPin size={11} className="text-blue-400" />
                          {log.country !== 'Unknown' ? `${log.country} (${log.regionName})` : '지오 분리 중...'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-sm ${
                        isApiCall 
                          ? 'bg-neon/15 text-neon border border-neon/25' 
                          : 'bg-white/5 text-text-light/80 border border-white/10'
                      }`}>
                        {isApiCall ? <Cpu size={9} /> : <Compass size={9} />}
                        {log.featureAccess}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-[10px] text-text-light/40 font-mono">
                      Ref: {log.referrer} | {log.userAgent}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-light/30 italic">
                    조회 조건에 만족하는 로그 이력이 존재하지 않습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
