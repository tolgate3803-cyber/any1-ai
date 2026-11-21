import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CreditCard,
  Landmark,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  ShieldCheck,
  Receipt,
  RefreshCw,
  ArrowRight,
  Crown,
  Lock,
  Eye,
  EyeOff,
  Phone,
  UserCheck
} from 'lucide-react';
import {
  getStoredMembershipOrderId,
  notifyMembershipChanged,
  setStoredMembershipOrderId
} from '../utils/membershipClient';

interface SitePlanInfo {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  price: number;
}

interface PublicPaymentConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  remittanceUrl: string;
  contactInfo: string;
  paymentNotice: string;
  tossClientKey: string;
  tossEnabled: boolean;
}

interface OrderReceipt {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  appName: string;
  packageName?: string;
  depositorName: string;
  paymentMethod: 'bank_transfer' | 'remittance_link' | 'toss_pg';
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

interface SiteMembershipCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'checkout' | 'lookup';
  upgradeReason?: 'exhausted' | 'voluntary' | null;
  upgradeFeatureTitle?: string;
}

const DEFAULT_SITE_PLANS: SitePlanInfo[] = [
  {
    id: 'any1_1month',
    name: 'ANY1 AI 1개월 무제한 이용권',
    badge: '인기',
    description: '정밀 사주·궁합·작명·관상·풍수지리 + AI 성우·문서요약·여행비서 전 기능 30일 이용',
    price: 9900
  },
  {
    id: 'any1_6month',
    name: 'ANY1 AI 6개월 프리미엄 패스',
    badge: '18% 할인',
    description: '전 기능 180일 무제한 이용 + 우선 응답 및 맞춤 안내 지원',
    price: 49000
  },
  {
    id: 'any1_1year',
    name: 'ANY1 AI 1년 VIP 연간 이용권',
    badge: '최대 혜택',
    description: '365일 전 기능 무제한 + 1:1 정밀 맞춤 상담 및 VIP 우선 처리',
    price: 89000
  }
];

const loadTossPaymentsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://js.tosspayments.com/v1/payment"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('토스페이먼츠 SDK 로드 실패')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('토스페이먼츠 결제창을 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });
};

function isSafeHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

export default function SiteMembershipCheckoutModal({
  isOpen,
  onClose,
  initialMode = 'checkout',
  upgradeReason = null,
  upgradeFeatureTitle
}: SiteMembershipCheckoutModalProps) {
  const [mode, setMode] = useState<'checkout' | 'lookup'>(initialMode);
  const [plans, setPlans] = useState<SitePlanInfo[]>(DEFAULT_SITE_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('any1_1month');
  const [config, setConfig] = useState<PublicPaymentConfig>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    remittanceUrl: '',
    contactInfo: '010-2459-9811 / tolgate3803@gmail.com',
    paymentNotice: '입금 확인 후 이용권 승인 및 안내 메일/연락을 빠르게 보내드립니다.',
    tossClientKey: '',
    tossEnabled: false
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Checkout form fields
  const [depositorName, setDepositorName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'remittance_link' | 'toss_pg'>('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<OrderReceipt | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Admin quick recipient info editor states (password-verified on server)
  const [isEditingRecipient, setIsEditingRecipient] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editRemittanceUrl, setEditRemittanceUrl] = useState('');
  const [editTossClientKey, setEditTossClientKey] = useState('');
  const [editTossSecretKey, setEditTossSecretKey] = useState('');
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [recipientNotice, setRecipientNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Order lookup & pass activation states
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<OrderReceipt[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activationMessage, setActivationMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string>(() => getStoredMembershipOrderId());

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormError('');
      setCreatedOrder(null);
      setIsEditingRecipient(false);
      setRecipientNotice(null);
      setActivationMessage(null);
      setActiveOrderId(getStoredMembershipOrderId());
      setAdminPasswordInput('');
      setEditTossSecretKey('');
      void fetchPaymentConfig();
    }
  }, [isOpen, initialMode]);

  const fetchPaymentConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/payments/public-config');
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.sitePlans) && data.sitePlans.length > 0) {
          setPlans(data.sitePlans);
        }
        if (data.config) {
          setConfig(data.config);
          setEditBankName(data.config.bankName || '');
          setEditAccountNumber(data.config.accountNumber || '');
          setEditAccountHolder(data.config.accountHolder || '');
          setEditContactInfo(data.config.contactInfo || '010-2459-9811 / tolgate3803@gmail.com');
          setEditRemittanceUrl(data.config.remittanceUrl || '');
          setEditTossClientKey(data.config.tossClientKey || '');
          if (data.config.tossEnabled) {
            setPaymentMethod('toss_pg');
          } else {
            setPaymentMethod((prev) => (prev === 'toss_pg' ? 'bank_transfer' : prev));
          }
        }
      }
    } catch {
      // keep defaults
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveRecipientInfo = async () => {
    setRecipientNotice(null);
    if (!adminPasswordInput.trim()) {
      setRecipientNotice({ type: 'error', text: '관리자 비밀번호를 입력해 주세요.' });
      return;
    }
    if (!editBankName.trim() || !editAccountNumber.trim() || !editAccountHolder.trim()) {
      setRecipientNotice({
        type: 'error',
        text: '입금받을 은행명, 계좌번호, 예금주명을 모두 입력해 주세요.'
      });
      return;
    }
    if (editRemittanceUrl.trim() && !isSafeHttpUrl(editRemittanceUrl)) {
      setRecipientNotice({
        type: 'error',
        text: '간편 송금 링크는 https:// 또는 http:// 로 시작해야 합니다.'
      });
      return;
    }

    setSavingRecipient(true);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPasswordInput,
          config: {
            bankName: editBankName.trim(),
            accountNumber: editAccountNumber.trim(),
            accountHolder: editAccountHolder.trim(),
            contactInfo: editContactInfo.trim() || '010-2459-9811 / tolgate3803@gmail.com',
            remittanceUrl: editRemittanceUrl.trim(),
            tossClientKey: editTossClientKey.trim(),
            ...(editTossSecretKey.trim() ? { tossSecretKey: editTossSecretKey.trim() } : {})
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRecipientNotice({
          type: 'error',
          text: data.error || '저장에 실패했습니다. 관리자 비밀번호를 확인해 주세요.'
        });
        return;
      }

      setAdminPasswordInput('');
      setEditTossSecretKey('');
      setIsEditingRecipient(false);
      await fetchPaymentConfig();
      setRecipientNotice({
        type: 'success',
        text: '입금받을 계좌 및 판매자 정보가 저장되어 결제창에 즉시 반영되었습니다.'
      });
    } catch {
      setRecipientNotice({ type: 'error', text: '서버 통신 중 오류가 발생했습니다.' });
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleCopy = (value: string, fieldKey: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const hasBankAccount = Boolean(config.bankName && config.accountNumber);
  const safeRemittanceUrl = isSafeHttpUrl(config.remittanceUrl) ? config.remittanceUrl.trim() : '';

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!depositorName.trim() || !contact.trim() || !email.trim()) {
      setFormError('입금자(결제자) 성함, 연락처, 이메일을 모두 입력해 주세요.');
      return;
    }

    if (paymentMethod === 'remittance_link' && !safeRemittanceUrl) {
      setFormError('간편 송금 링크가 아직 등록되지 않았습니다. 무통장 계좌입금을 선택해 주세요.');
      return;
    }

    if (paymentMethod === 'toss_pg' && (!config.tossEnabled || !config.tossClientKey)) {
      setFormError('카드결제가 아직 연동되지 않았습니다. 무통장 계좌입금을 이용해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          appName: 'ANY1 AI 유료 이용권',
          depositorName: depositorName.trim(),
          contact: contact.trim(),
          email: email.trim(),
          note: note.trim(),
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || '결제 신청 처리 중 오류가 발생했습니다.');
        return;
      }

      const order: OrderReceipt = data.order;
      try {
        localStorage.setItem('any1_last_order_id', order.id);
      } catch {
        // ignore storage errors
      }

      if (paymentMethod === 'toss_pg' && config.tossEnabled && config.tossClientKey) {
        try {
          await loadTossPaymentsScript();
          if (window.TossPayments) {
            const tossPayments = window.TossPayments(config.tossClientKey);
            await tossPayments.requestPayment('카드', {
              amount: order.amount,
              orderId: order.id,
              orderName: order.planName,
              customerName: order.depositorName,
              customerEmail: email.trim(),
              successUrl: `${window.location.origin}/?tossStatus=success`,
              failUrl: `${window.location.origin}/?tossStatus=fail`
            });
            return;
          }
        } catch (pgErr: any) {
          setFormError(
            pgErr?.message ||
              '카드 결제창 호출이 취소되었거나 차단되었습니다. 아래 생성된 주문번호로 무통장 입금 또는 다시 결제를 진행해 주세요.'
          );
          setCreatedOrder(order);
          return;
        }
      }

      setCreatedOrder(order);
    } catch {
      setFormError('서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeLookup = async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) {
      setLookupError('주문번호(ORD-...) 또는 결제 시 입력한 이메일을 입력해 주세요.');
      return;
    }

    setLookupLoading(true);
    setLookupError('');
    try {
      const isEmail = q.includes('@');
      const param = isEmail ? `email=${encodeURIComponent(q)}` : `orderId=${encodeURIComponent(q)}`;
      const res = await fetch(`/api/orders/lookup?${param}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLookupResults(data.orders || []);
      } else {
        setLookupError(data.error || '결제 조회에 실패했습니다.');
      }
    } catch {
      setLookupError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleActivateMembership = async (orderIdOrEmail: string, isEmail = false) => {
    setActivatingId(orderIdOrEmail);
    setActivationMessage(null);
    try {
      const res = await fetch('/api/membership/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEmail ? { email: orderIdOrEmail } : { orderId: orderIdOrEmail })
      });
      const data = await res.json();
      if (res.ok && data.success && data.membership?.active) {
        setStoredMembershipOrderId(data.membership.orderId);
        setActiveOrderId(data.membership.orderId);
        notifyMembershipChanged();
        const expText = data.membership.expiresAt
          ? new Date(data.membership.expiresAt).toLocaleDateString('ko-KR')
          : '';
        setActivationMessage({
          type: 'success',
          text: `${data.membership.planName}이(가) 이 브라우저에 적용되었습니다!${expText ? ` (이용 만료일: ${expText})` : ''}`
        });
      } else if (data.pending) {
        setActivationMessage({
          type: 'info',
          text: data.error || '아직 입금 확인 대기 중입니다. 관리자가 입금을 확인하면 바로 활성화됩니다.'
        });
      } else {
        setActivationMessage({
          type: 'error',
          text: data.error || '유료 이용권을 활성화할 수 없습니다.'
        });
      }
    } catch {
      setActivationMessage({ type: 'error', text: '서버 통신 중 오류가 발생했습니다.' });
    } finally {
      setActivatingId(null);
    }
  };

  const renderStatusBadge = (status: OrderReceipt['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-neon border border-neon/40">
            <CheckCircle2 size={12} /> 결제 확인 완료 · 유료 이용 가능
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
            <ShieldCheck size={12} /> 이용권 승인 완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/40">
            취소됨
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Clock size={12} /> 입금 확인 대기중
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0b1019] border border-border-dark rounded-2xl shadow-2xl z-10 p-5 sm:p-7 my-auto text-text-light"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon/15 border border-neon/40 flex items-center justify-center text-neon shrink-0">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    ANY1 AI 유료 이용권 결제 센터
                  </h3>
                  <p className="text-[11px] text-text-light/60 mt-0.5">
                    신용·체크카드 결제 또는 무통장 계좌입금으로 원하는 이용권을 간편하게 결제할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-light/50 hover:text-white transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Exhausted Trial Conversion Banner */}
            {upgradeReason === 'exhausted' && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/45 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="space-y-0.5">
                  <div className="font-black text-amber-300">
                    초기 무료 체험 3회를 모두 사용하셨습니다
                    {upgradeFeatureTitle ? ` (${upgradeFeatureTitle})` : ''}
                  </div>
                  <p className="text-[11px] text-amber-100/85">
                    아래에서 카드·계좌 결제로 유료 전환하거나, 이미 결제하셨다면 주문번호로 바로 활성화하세요.
                  </p>
                </div>
                {mode !== 'lookup' && (
                  <button
                    type="button"
                    onClick={() => setMode('lookup')}
                    className="px-3 py-1.5 bg-black/40 hover:bg-black/60 border border-amber-300/40 text-amber-200 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    기존 결제 인증 →
                  </button>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mt-4 mb-5 border-b border-white/5 pb-3">
              <button
                type="button"
                onClick={() => setMode('checkout')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'checkout'
                    ? 'bg-neon text-bg-dark shadow-[0_0_12px_rgba(0,243,255,0.25)]'
                    : 'bg-white/5 text-text-light/60 hover:text-white'
                }`}
              >
                <Receipt size={14} />
                <span>카드·계좌 결제하기</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('lookup');
                  try {
                    const savedOrderId = localStorage.getItem('any1_last_order_id');
                    if (savedOrderId && !lookupQuery) {
                      setLookupQuery(savedOrderId);
                      void executeLookup(savedOrderId);
                    }
                  } catch {
                    // ignore
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'lookup'
                    ? 'bg-neon text-bg-dark shadow-[0_0_12px_rgba(0,243,255,0.25)]'
                    : 'bg-white/5 text-text-light/60 hover:text-white'
                }`}
              >
                <Search size={14} />
                <span>내 결제 · 이용권 확인</span>
              </button>
            </div>

            {mode === 'checkout' ? (
              createdOrder ? (
                /* ================= ORDER RECEIPT VIEW ================= */
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> 유료 이용권 결제 신청이 접수되었습니다
                      </span>
                      {renderStatusBadge(createdOrder.status)}
                    </div>
                    <div className="flex items-center justify-between bg-black/30 px-3.5 py-2.5 rounded-lg border border-white/10 mt-2">
                      <div>
                        <span className="text-[10px] text-text-light/50 block">주문번호 (결제 확인 시 필요)</span>
                        <span className="font-mono text-sm font-black text-white">{createdOrder.id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdOrder.id, 'orderId')}
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-neon hover:text-bg-dark rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === 'orderId' ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedField === 'orderId' ? '복사됨' : '번호 복사'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-2.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-text-light/50 shrink-0">선택 이용권</span>
                      <span className="font-bold text-white text-right">{createdOrder.planName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-text-light/50 shrink-0">입금자명</span>
                      <span className="font-bold text-white">{createdOrder.depositorName}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-text-light/60 font-bold">결제(입금) 금액</span>
                      <span className="text-lg font-black text-neon font-mono tabular-nums">
                        {createdOrder.amount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  {createdOrder.paymentMethod === 'remittance_link' && safeRemittanceUrl ? (
                    <div className="p-5 rounded-xl bg-cyan-950/30 border border-neon/40 space-y-3">
                      <h4 className="text-xs font-black text-neon flex items-center gap-1.5">
                        <ExternalLink size={14} /> 간편 송금 링크로 즉시 입금하기
                      </h4>
                      <p className="text-xs text-text-light/80 leading-relaxed">
                        아래 버튼을 눌러 송금 화면에서 <strong>{createdOrder.amount.toLocaleString()}원</strong>을 입금해 주세요. 입금자명은{' '}
                        <strong className="text-white">{createdOrder.depositorName}</strong>으로 맞춰주시면 빠르게 확인됩니다.
                      </p>
                      <a
                        href={safeRemittanceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-neon hover:bg-cyan-300 text-bg-dark text-xs font-black rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>간편 송금 페이지 열기 ({createdOrder.amount.toLocaleString()}원)</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-cyan-950/30 border border-neon/40 space-y-3">
                      <h4 className="text-xs font-black text-neon flex items-center gap-1.5">
                        <Landmark size={14} /> 계좌입금 안내
                      </h4>
                      {hasBankAccount ? (
                        <div className="space-y-2 bg-black/40 p-3.5 rounded-lg border border-white/10 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-text-light/50">은행 / 예금주</span>
                            <span className="font-bold text-white">
                              {config.bankName} {config.accountHolder ? `· ${config.accountHolder}` : ''}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-text-light/50">계좌번호</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-neon">{config.accountNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(config.accountNumber, 'acct')}
                                className="px-2 py-1 bg-white/10 hover:bg-neon hover:text-bg-dark rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedField === 'acct' ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedField === 'acct' ? '복사됨' : '계좌 복사'}</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-text-light/50">입금 금액</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white tabular-nums">
                                {createdOrder.amount.toLocaleString()}원
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(String(createdOrder.amount), 'amt')}
                                className="px-2 py-1 bg-white/10 hover:bg-neon hover:text-bg-dark rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedField === 'amt' ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedField === 'amt' ? '복사됨' : '금액 복사'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200 leading-relaxed">
                          관리자가 입금 계좌를 최종 등록 중입니다. 주문번호(<strong>{createdOrder.id}</strong>)를 아래 문의처로 보내주시면 즉시 계좌를 안내해 드립니다.
                        </div>
                      )}
                      {config.paymentNotice && (
                        <p className="text-[11px] text-text-light/70 leading-relaxed">{config.paymentNotice}</p>
                      )}
                      <p className="text-[11px] text-text-light/55">
                        입금 확인 및 이용 문의: <strong className="text-white">{config.contactInfo || 'tolgate3803@gmail.com'}</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2.5 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLookupQuery(createdOrder.id);
                        setMode('lookup');
                        void executeLookup(createdOrder.id);
                      }}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-border-dark rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search size={14} />
                      <span>결제 상태 확인하기</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-neon hover:bg-white text-bg-dark rounded-lg text-xs font-black cursor-pointer"
                    >
                      확인 완료
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= CHECKOUT FORM VIEW ================= */
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  {/* Step 1: Plan Selector */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-text-light/85 block">1. 유료 이용권 선택</label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {plans.map((plan) => {
                        const active = selectedPlanId === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                              active
                                ? 'bg-neon/10 border-neon shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                                : 'bg-white/[0.02] border-border-dark hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs sm:text-sm font-black truncate ${active ? 'text-neon' : 'text-white'}`}>
                                  {plan.name}
                                </span>
                                {plan.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neon/15 text-neon border border-neon/30 shrink-0">
                                    {plan.badge}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-sm sm:text-base font-black text-white tabular-nums shrink-0">
                                {plan.price.toLocaleString()}원
                              </span>
                            </div>
                            {plan.description && (
                              <p className="text-[11px] text-text-light/60 mt-1 leading-snug">{plan.description}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Applicant Info */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-light/85 block">2. 결제자 / 입금자 정보</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-text-light/65 mb-1 font-semibold">성함 (입금자명) *</label>
                        <input
                          type="text"
                          required
                          value={depositorName}
                          onChange={(e) => setDepositorName(e.target.value)}
                          placeholder="실제 입금/결제하실 성함"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                      <div>
                        <label className="block text-text-light/65 mb-1 font-semibold">연락처 (휴대폰 또는 카톡 ID) *</label>
                        <input
                          type="text"
                          required
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="예: 010-1234-5678"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                      <div>
                        <label className="block text-text-light/65 mb-1 font-semibold">영수증·안내받을 이메일 *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="예: user@gmail.com"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                      <div>
                        <label className="block text-text-light/65 mb-1 font-semibold">요청사항 / 메모 (선택)</label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="예: 주로 이용할 기능이나 문의 내용"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Payment Method */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-text-light/85 block">3. 결제 방식 선택</label>
                    <div className="space-y-2">
                      {/* Card Payment (Toss Payments PG) */}
                      <button
                        type="button"
                        disabled={!config.tossEnabled}
                        onClick={() => config.tossEnabled && setPaymentMethod('toss_pg')}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          !config.tossEnabled
                            ? 'bg-white/[0.01] border-border-dark/60 opacity-65 cursor-not-allowed'
                            : paymentMethod === 'toss_pg'
                              ? 'bg-neon/10 border-neon cursor-pointer'
                              : 'bg-white/[0.02] border-border-dark hover:border-white/25 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <CreditCard size={16} className="text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                              <span>신용·체크카드 결제 (토스페이먼츠)</span>
                              {!config.tossEnabled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-light/65 font-normal">
                                  PG 키 연동 대기 중
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-light/60 mt-0.5">
                              {config.tossEnabled
                                ? '국내외 신용·체크카드 및 간편결제로 즉시 결제하고 바로 승인됩니다.'
                                : '관리자 페이지에서 토스페이먼츠 키를 입력하면 카드결제가 자동 활성화됩니다. (현재 계좌입금 가능)'}
                            </p>
                          </div>
                        </div>
                        {config.tossEnabled && (
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              paymentMethod === 'toss_pg' ? 'border-neon bg-neon' : 'border-white/30'
                            }`}
                          >
                            {paymentMethod === 'toss_pg' && <span className="w-1.5 h-1.5 rounded-full bg-bg-dark" />}
                          </span>
                        )}
                      </button>

                      {/* Bank Transfer */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                          paymentMethod === 'bank_transfer'
                            ? 'bg-neon/10 border-neon'
                            : 'bg-white/[0.02] border-border-dark hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Landmark size={16} className="text-neon shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-white">무통장 계좌입금 (수수료 0원)</div>
                            <p className="text-[11px] text-text-light/60 mt-0.5">
                              {loadingConfig
                                ? '입금 계좌 정보 확인 중...'
                                : hasBankAccount
                                  ? `${config.bankName} ${config.accountNumber} (${config.accountHolder || '예금주 확인'})`
                                  : `신청 접수 후 안내 계좌 또는 문의처(${config.contactInfo})를 통해 바로 입금`}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            paymentMethod === 'bank_transfer' ? 'border-neon bg-neon' : 'border-white/30'
                          }`}
                        >
                          {paymentMethod === 'bank_transfer' && <span className="w-1.5 h-1.5 rounded-full bg-bg-dark" />}
                        </span>
                      </button>

                      {/* Remittance Link (if configured) */}
                      {safeRemittanceUrl && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('remittance_link')}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            paymentMethod === 'remittance_link'
                              ? 'bg-neon/10 border-neon'
                              : 'bg-white/[0.02] border-border-dark hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <ExternalLink size={16} className="text-cyan-300 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-bold text-white">토스·카카오페이 간편 송금 링크</div>
                              <p className="text-[11px] text-text-light/60 mt-0.5">
                                신청 후 송금 링크 버튼을 눌러 스마트폰에서 바로 송금합니다.
                              </p>
                            </div>
                          </div>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              paymentMethod === 'remittance_link' ? 'border-neon bg-neon' : 'border-white/30'
                            }`}
                          >
                            {paymentMethod === 'remittance_link' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-bg-dark" />
                            )}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Prominent Recipient (Seller) & Deposit Account Info Box */}
                    <div className="mt-3 p-4 rounded-xl bg-cyan-950/25 border border-neon/35 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black text-neon flex items-center gap-1.5">
                          <UserCheck size={14} />
                          <span>입금받을 사람 (판매자) · 계좌 정보</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientNotice(null);
                            setIsEditingRecipient((prev) => !prev);
                          }}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-white/15 bg-white/5 hover:border-neon/50 hover:text-neon text-text-light/80 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Lock size={11} />
                          <span>{isEditingRecipient ? '입력창 닫기' : hasBankAccount ? '관리자 정보 수정' : '내 입금계좌 등록하기'}</span>
                        </button>
                      </div>

                      {recipientNotice && (
                        <div
                          className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 border ${
                            recipientNotice.type === 'success'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                              : 'bg-red-500/15 border-red-500/40 text-red-200'
                          }`}
                        >
                          {recipientNotice.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          <span>{recipientNotice.text}</span>
                        </div>
                      )}

                      {hasBankAccount ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-black/45 p-3 rounded-lg border border-white/10 text-xs">
                          <div>
                            <span className="text-[10px] text-text-light/50 block">입금 은행 · 예금주 (받는 분)</span>
                            <span className="font-bold text-white">
                              {config.bankName}
                              {config.accountHolder ? ` · 예금주: ${config.accountHolder}` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-light/50 block">입금 계좌번호</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-neon text-sm">{config.accountNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(config.accountNumber, 'previewAcct')}
                                className="px-2 py-0.5 bg-white/10 hover:bg-neon hover:text-bg-dark rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copiedField === 'previewAcct' ? <Check size={10} /> : <Copy size={10} />}
                                <span>{copiedField === 'previewAcct' ? '복사됨' : '복사'}</span>
                              </button>
                            </div>
                          </div>
                          <div className="sm:col-span-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                            <span className="text-text-light/60 flex items-center gap-1.5">
                              <Phone size={12} className="text-neon shrink-0" />
                              <span>입금 확인 · 판매자 연락처:</span>
                            </span>
                            <strong className="text-white">
                              {config.contactInfo || '010-2459-9811 / tolgate3803@gmail.com'}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-200 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold">아직 입금받을 은행 · 계좌번호 · 예금주가 등록되지 않았습니다.</span>
                            <span className="text-white/90">
                              연락처: {config.contactInfo || '010-2459-9811 / tolgate3803@gmail.com'}
                            </span>
                          </div>
                          {!isEditingRecipient && (
                            <p className="text-amber-100/80 leading-relaxed">
                              사이트 운영자이시면 오른쪽 위 <strong>[내 입금계좌 등록하기]</strong> 버튼을 눌러 본인 계좌번호·예금주·카드결제 키를 바로 등록하실 수 있습니다.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Inline Password-Protected Admin Recipient Setup */}
                      {isEditingRecipient && (
                        <div className="p-3.5 rounded-xl bg-black/60 border border-neon/40 space-y-3 text-xs">
                          <div className="text-[11px] font-black text-neon flex items-center gap-1.5">
                            <Lock size={12} />
                            <span>관리자 전용 — 입금받을 내 정보 &amp; 카드결제 설정</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                관리자 비밀번호 *
                              </label>
                              <div className="relative">
                                <input
                                  type={showAdminPassword ? 'text' : 'password'}
                                  value={adminPasswordInput}
                                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                                  placeholder="관리자 비밀번호 입력"
                                  className="w-full bg-bg-dark border border-border-dark px-3 py-2 pr-9 rounded-lg text-white outline-none focus:border-neon font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowAdminPassword((p) => !p)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-light/50 hover:text-neon cursor-pointer"
                                  aria-label="비밀번호 표시 전환"
                                >
                                  {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                입금 은행명 *
                              </label>
                              <input
                                type="text"
                                value={editBankName}
                                onChange={(e) => setEditBankName(e.target.value)}
                                placeholder="예: 카카오뱅크, 국민은행, 농협"
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                예금주명 (입금받을 분) *
                              </label>
                              <input
                                type="text"
                                value={editAccountHolder}
                                onChange={(e) => setEditAccountHolder(e.target.value)}
                                placeholder="본인 성함 입력"
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                계좌번호 *
                              </label>
                              <input
                                type="text"
                                value={editAccountNumber}
                                onChange={(e) => setEditAccountNumber(e.target.value)}
                                placeholder="예: 3333-01-1234567"
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                판매자 연락처 · 이메일
                              </label>
                              <input
                                type="text"
                                value={editContactInfo}
                                onChange={(e) => setEditContactInfo(e.target.value)}
                                placeholder="010-2459-9811 / tolgate3803@gmail.com"
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                간편 송금 링크 (선택)
                              </label>
                              <input
                                type="url"
                                value={editRemittanceUrl}
                                onChange={(e) => setEditRemittanceUrl(e.target.value)}
                                placeholder="https://toss.me/..."
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                토스페이먼츠 Client Key (선택)
                              </label>
                              <input
                                type="text"
                                value={editTossClientKey}
                                onChange={(e) => setEditTossClientKey(e.target.value)}
                                placeholder="카드결제 사용 시 입력"
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-text-light/70 mb-1 font-semibold">
                                토스페이먼츠 Secret Key (선택)
                              </label>
                              <input
                                type="password"
                                value={editTossSecretKey}
                                onChange={(e) => setEditTossSecretKey(e.target.value)}
                                placeholder="서버 보안 저장 (변경 시만 입력)"
                                className="w-full bg-bg-dark border border-border-dark px-3 py-2 rounded-lg text-white outline-none focus:border-neon font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditingRecipient(false)}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-text-light/70 rounded-lg font-bold cursor-pointer"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              disabled={savingRecipient}
                              onClick={() => void handleSaveRecipientInfo()}
                              className="px-4 py-1.5 bg-neon hover:bg-white text-bg-dark font-black rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              {savingRecipient ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                              <span>{savingRecipient ? '저장 중...' : '저장하고 결제창에 반영'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Footer Submit */}
                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-text-light/50 block">최종 결제 금액</span>
                      <span className="text-lg font-black text-neon font-mono tabular-nums">
                        {currentPlan.price.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-text-light text-xs font-bold rounded-lg cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.28)] flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>처리 중...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {paymentMethod === 'toss_pg'
                                ? `${currentPlan.price.toLocaleString()}원 카드결제 진행`
                                : `${currentPlan.price.toLocaleString()}원 신청 및 계좌 확인`}
                            </span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )
            ) : (
              /* ================= ORDER LOOKUP VIEW ================= */
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void executeLookup(lookupQuery);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40" />
                    <input
                      type="text"
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="주문번호 (예: ORD-20261121-XXXXXX) 또는 이메일 입력"
                      className="w-full bg-bg-dark border border-border-dark pl-9 pr-3 py-2.5 rounded-lg text-xs text-white outline-none focus:border-neon"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="px-4 py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    {lookupLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
                    <span>조회</span>
                  </button>
                </form>

                {lookupError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{lookupError}</span>
                  </div>
                )}

                {activationMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                      activationMessage.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        : activationMessage.type === 'info'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-red-500/15 border-red-500/40 text-red-200'
                    }`}
                  >
                    {activationMessage.type === 'success' ? (
                      <CheckCircle2 size={15} className="shrink-0" />
                    ) : activationMessage.type === 'info' ? (
                      <Clock size={15} className="shrink-0" />
                    ) : (
                      <AlertCircle size={15} className="shrink-0" />
                    )}
                    <span>{activationMessage.text}</span>
                  </div>
                )}

                {lookupResults === null ? (
                  <div className="p-8 text-center border border-dashed border-border-dark rounded-xl text-xs text-text-light/55">
                    결제 시 발급된 <strong>주문번호</strong> 또는 입력하신 <strong>이메일 주소</strong>로 결제 상태 조회 및 유료 이용권 즉시 적용이 가능합니다.
                  </div>
                ) : lookupResults.length === 0 ? (
                  <div className="p-8 text-center border border-border-dark rounded-xl text-xs text-text-light/55">
                    일치하는 결제 내역이 없습니다. 주문번호 또는 이메일을 다시 확인해 주세요.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {lookupResults.map((order) => {
                      const canActivate =
                        (order.status === 'paid' || order.status === 'completed') &&
                        order.planId?.startsWith('any1_');
                      const isCurrentActive = activeOrderId === order.id;

                      return (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-mono font-bold text-white">{order.id}</span>
                            {renderStatusBadge(order.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-light/70">
                            <div>
                              상품: <strong className="text-white">{order.planName}</strong>
                            </div>
                            <div className="text-right font-mono font-bold text-neon tabular-nums">
                              {order.amount.toLocaleString()}원
                            </div>
                            <div>
                              입금자: <strong className="text-white">{order.depositorName}</strong>
                            </div>
                            <div className="text-right">
                              {order.paymentMethod === 'toss_pg'
                                ? '카드결제 (PG)'
                                : order.paymentMethod === 'remittance_link'
                                  ? '간편 송금'
                                  : '무통장 계좌입금'}
                            </div>
                          </div>
                          {order.adminNote && (
                            <div className="p-2.5 rounded-lg bg-neon/5 border border-neon/25 text-[11px] text-cyan-200">
                              관리자 안내: {order.adminNote}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                            <span className="text-[10px] text-text-light/40">
                              접수일시: {new Date(order.createdAt).toLocaleString('ko-KR')}
                            </span>
                            {canActivate && (
                              <button
                                type="button"
                                disabled={activatingId === order.id}
                                onClick={() => void handleActivateMembership(order.id)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-colors flex items-center gap-1.5 cursor-pointer ${
                                  isCurrentActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-neon hover:bg-white text-bg-dark'
                                }`}
                              >
                                <Crown size={12} />
                                <span>
                                  {activatingId === order.id
                                    ? '적용 중...'
                                    : isCurrentActive
                                      ? '현재 이 브라우저에 적용 중'
                                      : '이 브라우저에 유료 이용권 적용하기'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
