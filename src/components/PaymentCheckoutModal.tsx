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
  ArrowRight
} from 'lucide-react';

interface PlanInfo {
  id: 'fasttrack12' | 'vip_allpass';
  name: string;
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

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: 'fasttrack12' | 'vip_allpass';
  initialMode?: 'checkout' | 'lookup';
  onSuccessToast?: (msg: string) => void;
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: string,
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          customerName?: string;
          customerEmail?: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}

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
    script.onerror = () => reject(new Error('토스페이먼츠 SDK를 불러올 수 없습니다.'));
    document.head.appendChild(script);
  });
};

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  initialPlanId = 'fasttrack12',
  initialMode = 'checkout',
  onSuccessToast
}: PaymentCheckoutModalProps) {
  const [mode, setMode] = useState<'checkout' | 'lookup'>(initialMode);
  const [selectedPlanId, setSelectedPlanId] = useState<'fasttrack12' | 'vip_allpass'>(initialPlanId);
  const [plans, setPlans] = useState<PlanInfo[]>([
    { id: 'fasttrack12', name: '패스트트랙 12 (12명 전담 실기기 배정)', price: 29000 },
    { id: 'vip_allpass', name: 'VIP 올패스 보증형 (20명 여유 배정 + 반려 시 100% 보증)', price: 49000 }
  ]);
  const [config, setConfig] = useState<PublicPaymentConfig>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    remittanceUrl: '',
    contactInfo: 'tolgate3803@gmail.com',
    paymentNotice: '입금 확인 후 10분~1시간 내로 전담 테스터 배정 안내를 이메일 및 연락처로 발송해 드립니다.',
    tossClientKey: '',
    tossEnabled: false
  });
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Form states
  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'remittance_link' | 'toss_pg'>('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<OrderReceipt | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lookup states
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<OrderReceipt[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedPlanId(initialPlanId);
      setFormError('');
      setCreatedOrder(null);
      fetchPaymentConfig();
    }
  }, [isOpen, initialPlanId, initialMode]);

  const fetchPaymentConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/payments/public-config');
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
        }
        if (data.config) {
          setConfig(data.config);
          if (data.config.tossEnabled) {
            // Keep default or let user choose
          } else if (paymentMethod === 'toss_pg') {
            setPaymentMethod('bank_transfer');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load payment config:', err);
    } finally {
      setLoadingConfig(false);
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!appName.trim() || !depositorName.trim() || !contact.trim() || !email.trim()) {
      setFormError('필수 입력 항목(앱 이름, 입금자명, 연락처, 이메일)을 모두 작성해 주세요.');
      return;
    }

    if (paymentMethod === 'remittance_link' && !config.remittanceUrl) {
      setFormError('간편 송금 링크가 아직 설정되지 않았습니다. 무통장 계좌이체를 선택해 주세요.');
      return;
    }

    if (paymentMethod === 'toss_pg' && (!config.tossEnabled || !config.tossClientKey)) {
      setFormError('카드/PG 결제가 아직 활성화되지 않았습니다. 계좌이체를 이용해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          appName: appName.trim(),
          packageName: packageName.trim(),
          depositorName: depositorName.trim(),
          contact: contact.trim(),
          email: email.trim(),
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || '주문 접수 중 오류가 발생했습니다.');
        return;
      }

      const order: OrderReceipt = data.order;

      // Save last order ID in localStorage for easy lookup later
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
              'PG 결제창 호출이 취소되었거나 차단되었습니다. 아래 생성된 주문번호로 무통장 입금 또는 재시도를 진행해 주세요.'
          );
          setCreatedOrder(order);
          return;
        }
      }

      setCreatedOrder(order);
      onSuccessToast?.(`✅ 주문(${order.id})이 접수되었습니다! 입금 안내를 확인해 주세요.`);
    } catch (err: any) {
      setFormError('서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeLookup = async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) {
      setLookupError('주문번호(ORD-...) 또는 신청 이메일을 입력해 주세요.');
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
        setLookupError(data.error || '주문 조회에 실패했습니다.');
      }
    } catch {
      setLookupError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(lookupQuery);
  };

  const renderStatusBadge = (status: OrderReceipt['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-neon border border-neon/40">
            <CheckCircle2 size={12} /> 입금 확인 완료 · 배정 진행중
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
            <ShieldCheck size={12} /> 테스터 배정 완료
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
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    패스트트랙 서비스 결제 · 신청 센터
                  </h3>
                  <p className="text-[11px] text-text-light/55">
                    주문 접수 및 실제 입금/카드 결제 후 전담 테스터 배정 상태를 실시간으로 확인할 수 있습니다.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-light/50 hover:text-white transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switch Tabs */}
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
                <span>결제 및 신청하기</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('lookup');
                  const savedOrderId = localStorage.getItem('any1_last_order_id');
                  if (savedOrderId && !lookupQuery) {
                    setLookupQuery(savedOrderId);
                    executeLookup(savedOrderId);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mode === 'lookup'
                    ? 'bg-neon text-bg-dark shadow-[0_0_12px_rgba(0,243,255,0.25)]'
                    : 'bg-white/5 text-text-light/60 hover:text-white'
                }`}
              >
                <Search size={14} />
                <span>내 결제·신청 조회</span>
              </button>
            </div>

            {mode === 'checkout' ? (
              createdOrder ? (
                /* ================= ORDER RECEIPT VIEW ================= */
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> 신청 및 주문이 정상 접수되었습니다
                      </span>
                      {renderStatusBadge(createdOrder.status)}
                    </div>
                    <div className="flex items-center justify-between bg-black/30 px-3.5 py-2.5 rounded-lg border border-white/10 mt-2">
                      <div>
                        <span className="text-[10px] text-text-light/50 block">주문번호 (조회 시 필요)</span>
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

                  {/* Order Summary */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-light/50">선택 상품</span>
                      <span className="font-bold text-white">{createdOrder.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-light/50">대상 앱</span>
                      <span className="font-bold text-white">
                        {createdOrder.appName}
                        {createdOrder.packageName ? ` (${createdOrder.packageName})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-light/50">입금자명</span>
                      <span className="font-bold text-white">{createdOrder.depositorName}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-text-light/60 font-bold">결제(입금) 금액</span>
                      <span className="text-lg font-black text-neon font-mono">
                        {createdOrder.amount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* Bank Transfer or Remittance Instruction */}
                  {createdOrder.paymentMethod === 'remittance_link' && config.remittanceUrl ? (
                    <div className="p-5 rounded-xl bg-cyan-950/30 border border-neon/40 space-y-3">
                      <h4 className="text-xs font-black text-neon flex items-center gap-1.5">
                        <ExternalLink size={14} /> 간편 송금 링크로 즉시 송금하기
                      </h4>
                      <p className="text-xs text-text-light/80 leading-relaxed">
                        아래 버튼을 눌러 송금 페이지에서 <strong>{createdOrder.amount.toLocaleString()}원</strong>을 입금해 주세요. 입금자명은 반드시{' '}
                        <strong className="text-white">{createdOrder.depositorName}</strong>으로 맞춰주세요.
                      </p>
                      <a
                        href={config.remittanceUrl}
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
                        <Landmark size={14} /> 입금 계좌 안내
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
                              <span className="font-mono font-bold text-white">{createdOrder.amount.toLocaleString()}원</span>
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
                          운영자가 아직 입금 계좌 정보를 등록하지 않았습니다. 주문번호(<strong>{createdOrder.id}</strong>)를 아래 문의처로 전달해 주시면 즉시 입금 계좌를 안내해 드립니다.
                        </div>
                      )}
                      {config.paymentNotice && (
                        <p className="text-[11px] text-text-light/70 leading-relaxed">{config.paymentNotice}</p>
                      )}
                      <p className="text-[11px] text-text-light/50">
                        결제 및 배정 문의: <strong className="text-white">{config.contactInfo || 'tolgate3803@gmail.com'}</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2.5 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLookupQuery(createdOrder.id);
                        setMode('lookup');
                        executeLookup(createdOrder.id);
                      }}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-border-dark rounded-lg text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search size={14} />
                      <span>내 주문 상태 조회하기</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark rounded-lg text-xs font-black cursor-pointer"
                    >
                      확인 완료
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= CHECKOUT FORM VIEW ================= */
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  {/* Plan Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-light/80 block">1. 요금제 선택</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-black ${active ? 'text-neon' : 'text-white'}`}>
                                {plan.id === 'fasttrack12' ? '패스트트랙 12' : 'VIP 올패스 보증형'}
                              </span>
                              <span className="font-mono text-sm font-black text-white">
                                {plan.price.toLocaleString()}원
                              </span>
                            </div>
                            <p className="text-[11px] text-text-light/60 leading-snug">{plan.name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer & App Details */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-light/80 block">2. 앱 및 신청자 정보</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-text-light/60 mb-1 font-semibold">앱 이름 *</label>
                        <input
                          type="text"
                          required
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          placeholder="예: Any1 AI"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                      <div>
                        <label className="block text-text-light/60 mb-1 font-semibold">패키지명 (선택)</label>
                        <input
                          type="text"
                          value={packageName}
                          onChange={(e) => setPackageName(e.target.value)}
                          placeholder="예: com.any1.ai"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-text-light/60 mb-1 font-semibold">입금자명 (신청자 성함) *</label>
                        <input
                          type="text"
                          required
                          value={depositorName}
                          onChange={(e) => setDepositorName(e.target.value)}
                          placeholder="실제 입금하실 분 성함"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                      <div>
                        <label className="block text-text-light/60 mb-1 font-semibold">연락처 (휴대폰 또는 카톡 ID) *</label>
                        <input
                          type="text"
                          required
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="예: 010-1234-5678"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-text-light/60 mb-1 font-semibold">배정 안내받을 이메일 *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="예: developer@gmail.com"
                          className="w-full bg-bg-dark border border-border-dark p-2.5 rounded-lg text-white outline-none focus:border-neon"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-text-light/80 block">3. 결제 수단 선택</label>

                    <div className="space-y-2">
                      {/* Method 1: Bank Transfer */}
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
                            <div className="text-xs font-bold text-white">무통장 입금 / 계좌이체 (수수료 0원)</div>
                            <p className="text-[11px] text-text-light/60 mt-0.5">
                              {loadingConfig
                                ? '입금 계좌 정보 확인 중...'
                                : hasBankAccount
                                  ? `${config.bankName} ${config.accountNumber} (${config.accountHolder || '예금주 확인'})`
                                  : `계좌 준비 중 (접수 후 문의처 ${config.contactInfo} 로 계좌 안내)`}
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

                      {/* Method 2: Remittance Link (if configured) */}
                      {config.remittanceUrl && (
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
                                신청 접수 후 송금 링크 버튼을 눌러 스마트폰으로 바로 송금합니다.
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

                      {/* Method 3: Toss Payments PG */}
                      <button
                        type="button"
                        disabled={!config.tossEnabled}
                        onClick={() => config.tossEnabled && setPaymentMethod('toss_pg')}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          !config.tossEnabled
                            ? 'bg-white/[0.01] border-border-dark/60 opacity-60 cursor-not-allowed'
                            : paymentMethod === 'toss_pg'
                              ? 'bg-neon/10 border-neon cursor-pointer'
                              : 'bg-white/[0.02] border-border-dark hover:border-white/25 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <CreditCard size={16} className="text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>신용카드 / 토스페이먼츠 PG 자동결제</span>
                              {!config.tossEnabled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-text-light/60 font-normal">
                                  PG 키 미연동
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-light/60 mt-0.5">
                              {config.tossEnabled
                                ? '신용·체크카드 및 간편결제로 즉시 결제하고 자동 승인됩니다.'
                                : '관리자 콘솔에서 토스페이먼츠 Client/Secret 키를 등록하면 자동 활성화됩니다.'}
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
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Footer CTA */}
                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-text-light/50 block">최종 결제 금액</span>
                      <span className="text-lg font-black text-neon font-mono">
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
                        className="px-5 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
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
                                : `${currentPlan.price.toLocaleString()}원 주문 접수 & 계좌 확인`}
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
                <form onSubmit={handleLookupSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light/40" />
                    <input
                      type="text"
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="주문번호 (예: ORD-20261115-XXXXXX) 또는 이메일 입력"
                      className="w-full bg-bg-dark border border-border-dark pl-9 pr-3 py-2.5 rounded-lg text-xs text-white outline-none focus:border-neon"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="px-4 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark text-xs font-black rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
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

                {lookupResults === null ? (
                  <div className="p-8 text-center border border-dashed border-border-dark rounded-xl text-xs text-text-light/50">
                    신청 시 발급된 <strong>주문번호</strong> 또는 입력하신 <strong>이메일 주소</strong>로 결제 및 테스터 배정 상태를 조회할 수 있습니다.
                  </div>
                ) : lookupResults.length === 0 ? (
                  <div className="p-8 text-center border border-border-dark rounded-xl text-xs text-text-light/50">
                    일치하는 신청 내역이 없습니다. 주문번호 또는 이메일을 다시 확인해 주세요.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                    {lookupResults.map((order) => (
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
                          <div className="text-right font-mono font-bold text-neon">
                            {order.amount.toLocaleString()}원
                          </div>
                          <div>
                            대상 앱: <strong className="text-white">{order.appName}</strong>
                          </div>
                          <div className="text-right">입금자: {order.depositorName}</div>
                        </div>
                        {order.adminNote && (
                          <div className="p-2.5 rounded-lg bg-neon/5 border border-neon/25 text-[11px] text-cyan-200">
                            운영자 메모: {order.adminNote}
                          </div>
                        )}
                        <div className="text-[10px] text-text-light/40">
                          접수일시: {new Date(order.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    ))}
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
