import { useState, useEffect } from 'react';
import { Sun, Heart, Sparkles, Compass, Clock, Palette, ArrowRight, RefreshCw, UserCheck, Crown } from 'lucide-react';
import { openUpgradeCheckout } from '../utils/membershipClient';

interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  unknownHour: boolean;
  isSolar: boolean;
  isLeapMonth: boolean;
  isMale: boolean;
}

interface DailyFortuneViewProps {
  onOpenFullSaju?: () => void;
}

const STORAGE_KEY = 'any1_saved_birth_profile';

const DEFAULT_BIRTH: BirthInput = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 0,
  unknownHour: false,
  isSolar: true,
  isLeapMonth: false,
  isMale: true
};

const DEFAULT_PARTNER: BirthInput = {
  year: 1992,
  month: 8,
  day: 20,
  hour: 10,
  minute: 0,
  unknownHour: true,
  isSolar: true,
  isLeapMonth: false,
  isMale: false
};

function parseSajuHourString(rawHour: string | null): { unknownHour: boolean; hour: number; minute: number } {
  if (!rawHour) return { unknownHour: false, hour: 12, minute: 0 };
  if (rawHour === 'unknown') return { unknownHour: true, hour: 12, minute: 0 };
  if (rawHour.includes(':')) {
    const [hStr, mStr] = rawHour.split(':');
    return {
      unknownHour: false,
      hour: Math.min(23, Math.max(0, parseInt(hStr, 10) || 0)),
      minute: Math.min(59, Math.max(0, parseInt(mStr, 10) || 0))
    };
  }
  return {
    unknownHour: false,
    hour: Math.min(23, Math.max(0, parseInt(rawHour, 10) || 12)),
    minute: 0
  };
}

function formatSajuHourString(b: BirthInput): string {
  if (b.unknownHour) return 'unknown';
  const snappedMin = Math.floor(b.minute / 10) * 10;
  return `${String(b.hour).padStart(2, '0')}:${String(snappedMin).padStart(2, '0')}`;
}

function loadSyncedBirth(): BirthInput {
  try {
    // Prefer any1_saju_* if present so Daily Fortune and Full Saju are always 100% identical
    const sajuY = localStorage.getItem('any1_saju_year');
    const sajuM = localStorage.getItem('any1_saju_month');
    const sajuD = localStorage.getItem('any1_saju_day');
    if (sajuY && sajuM && sajuD) {
      const hInfo = parseSajuHourString(localStorage.getItem('any1_saju_hour'));
      const cal = localStorage.getItem('any1_saju_calendar') || 'solar';
      const gen = localStorage.getItem('any1_saju_gender') || 'male';
      const leap = localStorage.getItem('any1_saju_leap') === 'true';
      return {
        year: parseInt(sajuY, 10) || 1990,
        month: parseInt(sajuM, 10) || 1,
        day: parseInt(sajuD, 10) || 1,
        hour: hInfo.hour,
        minute: hInfo.minute,
        unknownHour: hInfo.unknownHour,
        isSolar: cal !== 'lunar',
        isLeapMonth: cal === 'lunar' && leap,
        isMale: gen !== 'female'
      };
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_BIRTH, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_BIRTH;
}

function syncBirthToStorage(b: BirthInput) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
    localStorage.setItem('any1_saju_year', String(b.year));
    localStorage.setItem('any1_saju_month', String(b.month));
    localStorage.setItem('any1_saju_day', String(b.day));
    localStorage.setItem('any1_saju_hour', formatSajuHourString(b));
    localStorage.setItem('any1_saju_calendar', b.isSolar ? 'solar' : 'lunar');
    localStorage.setItem('any1_saju_leap', String(!b.isSolar && b.isLeapMonth));
    localStorage.setItem('any1_saju_gender', b.isMale ? 'male' : 'female');
    localStorage.setItem('any1_saju_inputMode', 'date');
  } catch {}
}

const TIME_OPTIONS = Array.from({ length: 144 }, (_, i) => {
  const h = Math.floor(i / 6);
  const m = (i % 6) * 10;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

interface BirthSelectCardProps {
  label: string;
  value: BirthInput;
  onChange: (next: BirthInput) => void;
}

function BirthSelectCard({ label, value, onChange }: BirthSelectCardProps) {
  const selectedTimeValue = formatSajuHourString(value);

  return (
    <div className="bg-bg-dark/80 border border-border-dark rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black text-neon tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => onChange({ ...value, isMale: true })}
            className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
              value.isMale ? 'bg-neon text-bg-dark' : 'text-text-light/50 hover:text-white'
            }`}
          >
            남성
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, isMale: false })}
            className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer transition-colors ${
              !value.isMale ? 'bg-neon text-bg-dark' : 'text-text-light/50 hover:text-white'
            }`}
          >
            여성
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] text-text-light/50 font-bold mb-1">출생년도</label>
          <select
            value={value.year}
            onChange={(e) => onChange({ ...value, year: parseInt(e.target.value, 10) })}
            className="w-full bg-black/60 border border-border-dark px-3 py-2.5 rounded-lg text-sm text-white font-bold outline-none focus:border-neon"
          >
            {Array.from({ length: 107 }, (_, i) => 2026 - i).map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-text-light/50 font-bold mb-1">월</label>
          <select
            value={value.month}
            onChange={(e) => onChange({ ...value, month: parseInt(e.target.value, 10) })}
            className="w-full bg-black/60 border border-border-dark px-3 py-2.5 rounded-lg text-sm text-white font-bold outline-none focus:border-neon"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-text-light/50 font-bold mb-1">일</label>
          <select
            value={value.day}
            onChange={(e) => onChange({ ...value, day: parseInt(e.target.value, 10) })}
            className="w-full bg-black/60 border border-border-dark px-3 py-2.5 rounded-lg text-sm text-white font-bold outline-none focus:border-neon"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-text-light/50 font-bold mb-1">태어난 시간</label>
          <select
            value={selectedTimeValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'unknown') {
                onChange({ ...value, unknownHour: true });
              } else {
                const [hStr, mStr] = v.split(':');
                onChange({
                  ...value,
                  unknownHour: false,
                  hour: parseInt(hStr, 10),
                  minute: parseInt(mStr, 10)
                });
              }
            }}
            className="w-full bg-black/60 border border-border-dark px-3 py-2.5 rounded-lg text-sm text-white font-bold outline-none focus:border-neon"
          >
            <option value="unknown">시간 모름 (三柱)</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onChange({ ...value, isSolar: true, isLeapMonth: false })}
            className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer ${
              value.isSolar ? 'bg-neon text-bg-dark' : 'text-text-light/50 hover:text-white'
            }`}
          >
            양력
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, isSolar: false })}
            className={`px-3 py-1 text-[11px] font-bold rounded cursor-pointer ${
              !value.isSolar ? 'bg-neon text-bg-dark' : 'text-text-light/50 hover:text-white'
            }`}
          >
            음력
          </button>
        </div>

        {!value.isSolar && (
          <label className="flex items-center gap-1.5 text-xs text-text-light/80 cursor-pointer">
            <input
              type="checkbox"
              checked={value.isLeapMonth}
              onChange={(e) => onChange({ ...value, isLeapMonth: e.target.checked })}
              className="accent-neon"
            />
            윤달
          </label>
        )}
      </div>
    </div>
  );
}

export default function DailyFortuneView({ onOpenFullSaju }: DailyFortuneViewProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'compat'>('daily');
  const [birth, setBirth] = useState<BirthInput>(() => loadSyncedBirth());
  const [partner, setPartner] = useState<BirthInput>(DEFAULT_PARTNER);

  const [dailyData, setDailyData] = useState<any>(null);
  const [compatData, setCompatData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const fetchDailyFortune = async (target: BirthInput, saveProfile = true) => {
    setLoading(true);
    setError('');
    try {
      if (saveProfile) {
        syncBirthToStorage(target);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
      }
      const res = await fetch('/api/fortune/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '운세 조회 실패');
      }
      setDailyData(data);
    } catch (err: any) {
      setError(err.message || '오늘의 운세를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompatibility = async () => {
    syncBirthToStorage(birth);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fortune/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personA: birth, personB: partner })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '궁합 조회 실패');
      }
      setCompatData(data);
    } catch (err: any) {
      setError(err.message || '궁합 분석을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyFortune(birth, false);
  }, []);

  const handleJumpToFullSaju = () => {
    syncBirthToStorage(birth);
    sessionStorage.removeItem('any1_saju_data');
    sessionStorage.removeItem('any1_saju_response');
    sessionStorage.removeItem('any1_saju_key');
    onOpenFullSaju?.();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-dark pb-6">
        <div>
          <span className="text-[11px] font-bold text-neon tracking-widest uppercase block mb-1">
            DAILY SAJU &amp; COMPATIBILITY
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            오늘의 운세 &amp; 2인 사주 궁합
          </h2>
          <p className="text-xs sm:text-sm text-text-light/60 mt-1">
            정밀 사주보기와 동일한 천문 만세력으로 사주팔자와 오늘의 운세를 계산합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-bg-dark border border-border-dark p-1.5 rounded-xl self-start shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'daily'
                ? 'bg-neon text-bg-dark shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                : 'text-text-light/60 hover:text-white'
            }`}
          >
            <Sun size={14} className="shrink-0" />
            <span>오늘의 내 운세</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('compat');
              if (!compatData) fetchCompatibility();
            }}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'compat'
                ? 'bg-neon text-bg-dark shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                : 'text-text-light/60 hover:text-white'
            }`}
          >
            <Heart size={14} className="shrink-0" />
            <span>2인 사주 궁합</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold">
          {error}
        </div>
      )}

      {activeTab === 'daily' ? (
        <div className="space-y-6">
          {/* Input Card */}
          <div className="bg-white/[0.02] border border-border-dark rounded-2xl p-5 space-y-4">
            <BirthSelectCard
              label="내 생년월일시 (정밀 사주보기와 자동 연동)"
              value={birth}
              onChange={(next) => {
                setBirth(next);
                syncBirthToStorage(next);
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-text-light/50 flex items-center gap-2">
                {savedNotice && (
                  <span className="text-lime-400 font-bold flex items-center gap-1">
                    <UserCheck size={14} /> 저장 완료! 정밀 사주보기에도 동일하게 반영됩니다.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchDailyFortune(birth, true)}
                disabled={loading}
                className="px-6 py-3 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.25)] disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                내 정보 저장 &amp; 오늘 운세 보기
              </button>
            </div>
          </div>

          {/* Daily Result */}
          {dailyData && (
            <div className="space-y-5">
              {/* My Exact 4 Pillars Verification Bar (Matches Full Saju 100%) */}
              <div className="bg-white/[0.02] border border-border-dark rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black text-white">내 사주명식 4주 팔자 확인</span>
                  <span className="text-[11px] text-text-light/60 font-mono">
                    {dailyData.userSaju.solarDate} / {dailyData.userSaju.lunarDate}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { title: '시주', val: dailyData.userSaju.hourPillar },
                    { title: '일주 (나)', val: dailyData.userSaju.dayPillar, highlight: true },
                    { title: '월주', val: dailyData.userSaju.monthPillar },
                    { title: '년주', val: dailyData.userSaju.yearPillar }
                  ].map((p) => (
                    <div
                      key={p.title}
                      className={`p-2.5 rounded-xl border ${
                        p.highlight
                          ? 'bg-neon/10 border-neon/40 text-neon'
                          : 'bg-black/40 border-border-dark text-white'
                      }`}
                    >
                      <span className="text-[10px] text-text-light/50 block mb-0.5">{p.title}</span>
                      <span className="text-sm sm:text-base font-black">{p.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Today Iljin Summary */}
              <div className="bg-gradient-to-br from-cyan-950/50 via-bg-dark to-emerald-950/30 border border-neon/30 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded bg-neon/15 text-neon border border-neon/30 text-[11px] font-black">
                        {dailyData.today.dateLabel} · {dailyData.today.iljinHanja} ({dailyData.today.iljinKorean})
                      </span>
                      <span className="px-2.5 py-1 rounded bg-white/5 text-text-light/70 text-[11px] font-bold">
                        오늘의 십성: {dailyData.fortune.todayTenGod} · {dailyData.fortune.todayUnseong}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {dailyData.fortune.headline}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 bg-black/40 border border-neon/30 px-5 py-3 rounded-2xl">
                    <div className="text-right">
                      <span className="text-[10px] text-text-light/50 block">오늘 종합 운세</span>
                      <span className="text-3xl font-black text-neon font-mono">
                        {dailyData.fortune.scores.total}
                        <span className="text-sm text-text-light/50 ml-0.5">점</span>
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-text-light/85 leading-relaxed pt-4">
                  {dailyData.fortune.summary}
                </p>

                {dailyData.fortune.relationTags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {dailyData.fortune.relationTags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-lime-500/10 border border-lime-500/30 text-lime-300 font-bold"
                      >
                        ✦ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score Bars */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: '재물운', score: dailyData.fortune.scores.wealth, color: 'bg-amber-400' },
                  { label: '애정·대인운', score: dailyData.fortune.scores.love, color: 'bg-pink-400' },
                  { label: '직장·학업운', score: dailyData.fortune.scores.work, color: 'bg-cyan-400' },
                  { label: '컨디션·건강', score: dailyData.fortune.scores.health, color: 'bg-emerald-400' }
                ].map((item) => (
                  <div key={item.label} className="bg-white/[0.02] border border-border-dark rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-text-light/70 font-bold">{item.label}</span>
                      <span className="text-white font-black font-mono">{item.score}점</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Advice & Lucky Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-border-dark rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles size={15} className="text-neon" /> 영역별 오늘의 행동 가이드
                  </h4>
                  <div className="space-y-2.5 text-xs text-text-light/80 leading-relaxed">
                    <p><strong className="text-amber-300">💰 재물:</strong> {dailyData.fortune.details.wealth}</p>
                    <p><strong className="text-pink-300">💬 애정·대인:</strong> {dailyData.fortune.details.love}</p>
                    <p><strong className="text-cyan-300">💼 일·학업:</strong> {dailyData.fortune.details.work}</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-border-dark rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Compass size={15} className="text-lime-400" /> 내 사주({dailyData.userSaju.dayPillar}) 개운 포인트
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs text-text-light/80">
                    <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-border-dark/60">
                      <Palette size={14} className="text-neon shrink-0" />
                      <span>행운의 색상: <strong className="text-white">{dailyData.fortune.lucky.color}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-border-dark/60">
                      <Compass size={14} className="text-lime-400 shrink-0" />
                      <span>행운의 방위 / 숫자: <strong className="text-white">{dailyData.fortune.lucky.direction} · {dailyData.fortune.lucky.number}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-border-dark/60">
                      <Clock size={14} className="text-amber-300 shrink-0" />
                      <span>오늘의 골든타임: <strong className="text-white">{dailyData.fortune.lucky.goldenHour}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {onOpenFullSaju && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleJumpToFullSaju}
                    className="px-4 py-2.5 rounded-xl border border-neon/40 text-neon hover:bg-neon hover:text-bg-dark text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>내 평생 100년 대운·삼재까지 정밀 사주보기로 이어서 보기</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BirthSelectCard
              label="첫 번째 사람 (나)"
              value={birth}
              onChange={(next) => {
                setBirth(next);
                syncBirthToStorage(next);
              }}
            />
            <BirthSelectCard
              label="두 번째 사람 (상대방)"
              value={partner}
              onChange={setPartner}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={fetchCompatibility}
              disabled={loading}
              className="px-6 py-3 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.25)] disabled:opacity-50"
            >
              <Heart size={14} />
              두 사람 사주 궁합 분석하기
            </button>
          </div>

          {compatData && (
            <div className="bg-gradient-to-br from-pink-950/30 via-bg-dark to-cyan-950/30 border border-neon/30 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-pink-300 block mb-1">
                    사주 오행·일주 정밀 궁합
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {compatData.tierTitle}
                  </h3>
                </div>
                <div className="bg-black/40 border border-pink-400/40 px-5 py-3 rounded-2xl text-right shrink-0">
                  <span className="text-[10px] text-text-light/50 block">궁합 점수</span>
                  <span className="text-3xl font-black text-pink-300 font-mono">
                    {compatData.score}
                    <span className="text-sm text-text-light/50 ml-0.5">점</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-black/30 border border-border-dark p-4 rounded-xl space-y-1">
                  <span className="text-neon font-bold block">첫 번째 분 일주: {compatData.personA.dayPillar}</span>
                  <span className="text-text-light/60 block">{compatData.personA.solarDate}</span>
                  <span className="text-text-light/80 block">보충하면 좋은 오행: {compatData.personA.missingElement}</span>
                </div>
                <div className="bg-black/30 border border-border-dark p-4 rounded-xl space-y-1">
                  <span className="text-pink-300 font-bold block">두 번째 분 일주: {compatData.personB.dayPillar}</span>
                  <span className="text-text-light/60 block">{compatData.personB.solarDate}</span>
                  <span className="text-text-light/80 block">보충하면 좋은 오행: {compatData.personB.missingElement}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {compatData.chemistryTags?.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-400/30 text-pink-200 font-bold"
                  >
                    ♥ {tag}
                  </span>
                ))}
              </div>

              <div className="space-y-3 text-sm text-text-light/85 leading-relaxed">
                <p>{compatData.summary}</p>
                <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl">
                  💡 <strong>오래 잘 지내는 처방:</strong> {compatData.caution}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Freemium to Paid Conversion Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-neon/5 to-transparent border border-amber-400/35 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-amber-300">
            <Crown size={15} />
            <span>오늘의 운세·궁합은 무상 기본 기능으로 언제나 무료입니다</span>
          </div>
          <p className="text-xs text-text-light/70 leading-relaxed">
            더 깊은 <strong>평생 정밀 사주 · AI 작명 · 관상 · 풍수 · AI 성우 낭독</strong> 기능은 초기 3회 무료 체험 후 유료 이용권으로 무제한 전환할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openUpgradeCheckout('voluntary', '오늘의 운세 & 궁합')}
          className="px-4 py-2.5 bg-amber-400/20 hover:bg-amber-400 text-amber-200 hover:text-bg-dark border border-amber-400/50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Crown size={14} />
          <span>유료 이용권 전환하기</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
