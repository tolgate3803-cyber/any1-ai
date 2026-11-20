import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Sparkles, 
  BookOpen, 
  Info, 
  Compass, 
  TrendingUp, 
  Heart, 
  Award,
  Layers,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import SajuChart from './SajuChart';

interface SyllableDetail {
  char: string;
  hangul: string;
  meaning: string;
  strokes: number;
  element: string; // 목(木), 화(火), 토(土), 금(金), 수(水)
}

interface StrokeLuck {
  strokes: number;
  grade: string; // 吉 (길), 大吉 (대길), 凶 (흉) 등
  desc: string;
}

interface NameRecommendation {
  hangul: string;
  hanja: string;
  syllables: SyllableDetail[];
  strokesAnalysis: {
    won: StrokeLuck;   // 원격 (초년운)
    hyung: StrokeLuck; // 형격 (청년운)
    i: StrokeLuck;     // 이격 (장년운)
    jung: StrokeLuck;  // 정격 (말년운)
  };
  soundHarmony: string; // 음령오행 분석
  overallMeaning: string; // 종합 해독 및 축원
}

interface NamingAnalysisData {
  sajuData?: any;
  sajuSummary: {
    strongElements: string[];
    weakElements: string[];
    supplementElement: string;
    advice: string;
  };
  recommendations: NameRecommendation[];
}

interface NamingViewProps {
  data: NamingAnalysisData;
}

export default function NamingView({ data }: NamingViewProps) {
  const [selectedNameIdx, setSelectedNameIdx] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'strokes' | 'harmony'>('details');

  const selectedName = data.recommendations[selectedNameIdx];

  const [adviceCopied, setAdviceCopied] = useState(false);
  const [detailsCopied, setDetailsCopied] = useState(false);
  const [harmonyCopied, setHarmonyCopied] = useState(false);
  const [certCopied, setCertCopied] = useState(false);

  const copyAdvice = async () => {
    try {
      await navigator.clipboard.writeText(data.sajuSummary.advice);
      setAdviceCopied(true);
      setTimeout(() => setAdviceCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(selectedName.overallMeaning);
      setDetailsCopied(true);
      setTimeout(() => setDetailsCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyHarmony = async () => {
    try {
      await navigator.clipboard.writeText(selectedName.soundHarmony);
      setHarmonyCopied(true);
      setTimeout(() => setHarmonyCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyCert = async () => {
    let text = `☯️ AI 명문 성명학 작명 인증서 ☯️\n\n`;
    text += `추천 이름: ${selectedName.hangul} (${selectedName.hanja})\n`;
    text += `오행 배열: ${selectedName.syllables.map(s => `${s.char}(${s.element})`).join(' → ')}\n\n`;
    text += `[음령오행 및 소리 조화]\n${selectedName.soundHarmony}\n\n`;
    text += `[성명학적 이름 총평]\n${selectedName.overallMeaning}\n\n`;
    text += `[수리사격 분석]\n`;
    text += `- 원격 (초년운): ${selectedName.strokesAnalysis.won.strokes}획 [${selectedName.strokesAnalysis.won.grade}] - ${selectedName.strokesAnalysis.won.desc}\n`;
    text += `- 형격 (청년운): ${selectedName.strokesAnalysis.hyung.strokes}획 [${selectedName.strokesAnalysis.hyung.grade}] - ${selectedName.strokesAnalysis.hyung.desc}\n`;
    text += `- 이격 (장년운): ${selectedName.strokesAnalysis.i.strokes}획 [${selectedName.strokesAnalysis.i.grade}] - ${selectedName.strokesAnalysis.i.desc}\n`;
    text += `- 정격 (말년운): ${selectedName.strokesAnalysis.jung.strokes}획 [${selectedName.strokesAnalysis.jung.grade}] - ${selectedName.strokesAnalysis.jung.desc}\n`;

    try {
      await navigator.clipboard.writeText(text);
      setCertCopied(true);
      setTimeout(() => setCertCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const getGradeBgColor = (grade: string) => {
    if (grade.includes('대길') || grade === '吉' || grade === '大吉') {
      return 'bg-neon/10 border-neon/30 text-neon';
    }
    if (grade.includes('길')) {
      return 'bg-lime-400/10 border-lime-400/30 text-lime-400';
    }
    return 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400';
  };

  const getElementColor = (element: string) => {
    switch (element.replace(/[^목화토금수]/g, '')) {
      case '목': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      case '화': return 'text-red-400 border-red-400/20 bg-red-400/5';
      case '토': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case '금': return 'text-slate-300 border-slate-300/20 bg-slate-300/5';
      case '수': return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5';
      default: return 'text-text-light/60 border-white/5 bg-white/[0.01]';
    }
  };

  const getSuriOhaeng = (strokes: number): { ohaeng: string; digit: number } => {
    const lastDigit = strokes % 10;
    if (lastDigit === 1 || lastDigit === 6) return { ohaeng: '수(水)', digit: lastDigit };
    if (lastDigit === 2 || lastDigit === 7) return { ohaeng: '화(火)', digit: lastDigit };
    if (lastDigit === 3 || lastDigit === 8) return { ohaeng: '목(木)', digit: lastDigit };
    if (lastDigit === 4 || lastDigit === 9) return { ohaeng: '금(金)', digit: lastDigit };
    return { ohaeng: '토(土)', digit: lastDigit }; // 5, 0 (10)
  };

  return (
    <div className="w-full bg-white/[0.01] border border-border-dark p-6 md:p-8 rounded-none">
      {/* Top Header Banner */}
      <div className="relative mb-8 p-6 border border-neon/20 bg-neon/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-neon animate-[scan_3s_ease-in-out_infinite]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-neon rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-neon">Name Generation & Saju Balance</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
              AI 명문 성명학 <span className="text-neon">작명 인증서</span>
            </h2>
          </div>
          <div className="px-4 py-2 bg-black/40 border border-white/10 font-mono text-[10px] font-bold text-text-light/60">
            ENGINE: <span className="text-neon">SAJU_HARMONY_v2.5</span>
          </div>
        </div>
      </div>

      {/* Saju Manseoryeok Chart (정밀만세력) */}
      {data.sajuData && (
        <div className="mb-8 p-6 border border-border-dark bg-white/[0.01] relative">
          <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none opacity-5 border-t border-r border-neon" />
          <h3 className="text-xs font-black uppercase tracking-widest text-neon mb-4 flex items-center gap-2">
            <Compass size={14} />
            선천적 정밀 만세력 분석 (先天 精密萬歲曆 命式)
          </h3>
          <SajuChart data={data.sajuData} />
        </div>
      )}

      {/* Saju Balance Block */}
      <div className="mb-8 p-6 border border-border-dark bg-white/[0.01] relative">
        <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none opacity-5 border-t border-r border-neon" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-neon flex items-center gap-2">
            <Layers size={14} />
            선천적 사주 분석 및 오행 보완 전략 (先天八字 補完)
          </h3>
          <button
            onClick={copyAdvice}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-border-dark bg-black/40 text-[10px] font-black text-text-light/50 hover:text-neon hover:border-neon transition-all cursor-pointer"
          >
            {adviceCopied ? <Check size={10} strokeWidth={3} className="text-neon" /> : <Copy size={10} />}
            {adviceCopied ? '복사됨' : '조언 복사'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="p-4 bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-text-light/40 font-bold uppercase tracking-wider block">강한 기운 (旺)</span>
            <div className="flex flex-wrap gap-1.5">
              {data.sajuSummary.strongElements.map((el, idx) => (
                <span key={idx} className={`px-2 py-0.5 border text-xs font-bold ${getElementColor(el)}`}>
                  {el}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 space-y-1">
            <span className="text-[10px] text-text-light/40 font-bold uppercase tracking-wider block">부족/필요한 기운 (缺)</span>
            <div className="flex flex-wrap gap-1.5">
              {data.sajuSummary.weakElements.map((el, idx) => (
                <span key={idx} className={`px-2 py-0.5 border text-xs font-bold ${getElementColor(el)}`}>
                  {el}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 bg-neon/5 border border-neon/10 space-y-1">
            <span className="text-[10px] text-neon/60 font-bold uppercase tracking-wider block">작명 핵심 보완 오행 (用神)</span>
            <span className="text-sm font-black text-white">{data.sajuSummary.supplementElement}</span>
          </div>
        </div>
        <p className="text-xs text-text-light/50 leading-relaxed font-medium">
          {data.sajuSummary.advice}
        </p>
      </div>

      {/* Recommended Names Navigation Cards */}
      <div className="mb-8">
        <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-text-light/30 block mb-3">// RECOMMENDED MASTER NAMES</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.recommendations.map((rec, idx) => {
            const isSelected = selectedNameIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedNameIdx(idx)}
                className={`p-5 border transition-all text-left relative flex flex-col justify-between overflow-hidden ${
                  isSelected 
                    ? 'border-neon bg-neon/10 text-white shadow-[0_0_20px_rgba(207,255,4,0.05)]' 
                    : 'border-white/5 bg-white/[0.01] text-text-light/60 hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-neon text-bg-dark px-2 py-0.5 font-mono text-[8px] font-black tracking-widest uppercase">
                    SELECTED
                  </div>
                )}
                <div>
                  <div className="text-[9px] font-mono text-text-light/30 uppercase tracking-widest mb-1">
                    Recommendation #{idx + 1}
                  </div>
                  <div className="flex items-baseline gap-2.5 mb-2">
                    <span className="text-2xl font-black tracking-tight">{rec.hangul}</span>
                    <span className="text-sm font-bold text-text-light/40 tracking-wider font-serif">{rec.hanja}</span>
                  </div>
                </div>
                <div className="text-[10px] text-text-light/50 font-medium line-clamp-1 border-t border-white/5 pt-2 mt-2">
                  오행배열: {rec.syllables.map(s => s.element).join(' → ')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Report Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Grid: Character & Pronunciation Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Name Display */}
          <div className="p-6 border border-border-dark bg-white/[0.01] flex flex-col justify-between relative">
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-[0.03] border-t border-r border-white" />
            <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
              <div>
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-neon block mb-1">Active Name Certification</span>
                <h3 className="text-3xl font-black text-white italic tracking-tight">{selectedName.hangul} ({selectedName.hanja})</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={copyCert}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-neon/30 bg-neon/10 text-[9px] font-black text-neon hover:bg-neon hover:text-bg-dark transition-all cursor-pointer"
                >
                  {certCopied ? <Check size={10} strokeWidth={3} /> : <Copy size={10} />}
                  {certCopied ? '복사 완료' : '인증서 전체복사'}
                </button>
                <span className="text-[9px] font-mono text-text-light/30 uppercase mt-1">{selectedName.syllables.length}字 조합</span>
              </div>
            </div>

            {/* Syllables breakdown row */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-neon/70 uppercase tracking-wider font-bold">
                  한자별 자원오행(字源) 및 획수 수리(數理) 분석
                </span>
                <span className="text-[9px] text-text-light/40">
                  ※ 글자 배지는 뜻/부수의 &apos;자원오행&apos;입니다
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedName.syllables.map((s, idx) => {
                  const suri = getSuriOhaeng(s.strokes);
                  return (
                    <div key={idx} className="p-4 bg-white/5 border border-white/5 flex flex-col items-center text-center space-y-2 relative">
                      <span className="absolute top-1 left-2 text-[8px] font-mono text-text-light/20">字 {idx + 1}</span>
                      <div className="text-3xl font-black font-serif text-white">{s.char}</div>
                      <div className="text-xs font-bold text-neon">{s.hangul}</div>
                      <div className="text-[10px] font-medium text-text-light/40 leading-tight">{s.meaning}</div>
                      <div className="flex flex-col gap-1 w-full pt-2 border-t border-white/5 text-[9px]">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-text-light/40 font-mono">자원오행(뜻/부수)</span>
                          <span className={`px-1.5 py-0.5 border font-bold ${getElementColor(s.element)}`}>
                            {s.element}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-text-light/40 font-mono">획수(수리오행)</span>
                          <span className="font-mono text-text-light/80">
                            {s.strokes}획 <span className="text-neon/70 font-bold">[{suri.digit} → {suri.ohaeng}]</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs for details */}
            <div className="flex border-b border-white/5 mb-6">
              {[
                { id: 'details', label: '종합 해독', icon: BookOpen },
                { id: 'strokes', label: '수리 4격 수사', icon: Layers },
                { id: 'harmony', label: '음령오행 조화', icon: Compass }
              ].map((subTab) => {
                const Icon = subTab.icon;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id as any)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                      activeSubTab === subTab.id 
                        ? 'border-neon text-neon bg-neon/5' 
                        : 'border-transparent text-text-light/40 hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    {subTab.label}
                  </button>
                );
              })}
            </div>

            {/* Sub Tab contents */}
            <AnimatePresence mode="wait">
              {activeSubTab === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60 flex items-center gap-1.5">
                      <Sparkles size={12} />
                      성명학적 이름 총평 (吉凶 總評)
                    </div>
                    <button
                      onClick={copyDetails}
                      className="flex items-center gap-1 px-2 py-0.5 border border-border-dark bg-black/40 text-[9px] font-black text-text-light/50 hover:text-neon hover:border-neon transition-all cursor-pointer"
                    >
                      {detailsCopied ? <Check size={8} strokeWidth={3} className="text-neon" /> : <Copy size={8} />}
                      {detailsCopied ? '복사됨' : '설명 복사'}
                    </button>
                  </div>
                  <p className="text-xs text-text-light/80 leading-relaxed font-medium bg-white/[0.01] p-4 border border-white/5">
                    {selectedName.overallMeaning}
                  </p>
                </motion.div>
              )}

              {activeSubTab === 'strokes' && (
                <motion.div
                  key="strokes"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60 flex items-center gap-1.5">
                    <Award size={12} />
                    수리사격(數理四格) 길흉 분석
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: '원격 (元格) - 초년운', data: selectedName.strokesAnalysis.won },
                      { title: '형격 (亨格) - 청년운', data: selectedName.strokesAnalysis.hyung },
                      { title: '이격 (利格) - 장년운', data: selectedName.strokesAnalysis.i },
                      { title: '정격 (貞格) - 말년운', data: selectedName.strokesAnalysis.jung }
                    ].map((item, i) => {
                      const suri = getSuriOhaeng(item.data.strokes);
                      return (
                        <div key={i} className="p-4 bg-white/5 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-light/50 font-bold">{item.title}</span>
                            <span className={`px-1.5 py-0.5 border text-[9px] font-black font-mono tracking-wider ${getGradeBgColor(item.data.grade)}`}>
                              {item.data.strokes}획 [{item.data.grade}]
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-text-light/50 bg-black/40 px-2 py-1 border border-white/5">
                            <span>수리오행(數理五行):</span>
                            <span className="text-neon font-bold">
                              {suri.ohaeng} <span className="text-text-light/40 font-normal">(끝자리 {suri.digit})</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-text-light/75 leading-relaxed font-medium">
                            {item.data.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'harmony' && (
                <motion.div
                  key="harmony"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60 flex items-center gap-1.5">
                      <Compass size={12} />
                      발음오행 및 소리 조화 (音靈五行)
                    </div>
                    <button
                      onClick={copyHarmony}
                      className="flex items-center gap-1 px-2 py-0.5 border border-border-dark bg-black/40 text-[9px] font-black text-text-light/50 hover:text-neon hover:border-neon transition-all cursor-pointer"
                    >
                      {harmonyCopied ? <Check size={8} strokeWidth={3} className="text-neon" /> : <Copy size={8} />}
                      {harmonyCopied ? '복사됨' : '설명 복사'}
                    </button>
                  </div>
                  <p className="text-xs text-text-light/80 leading-relaxed font-medium bg-white/[0.01] p-4 border border-white/5">
                    {selectedName.soundHarmony}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Grid: Naming Guides & Science of Names */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 border border-border-dark bg-white/[0.01] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Compass size={14} className="text-neon" />
              성명학(姓名學) 3대 오행 정밀 해설
            </h4>
            <div className="space-y-3.5 text-xs text-text-light/45 leading-relaxed font-medium">
              <p>
                동양 성명학에서는 <span className="text-text-light/70">&apos;자원오행&apos;</span>과 <span className="text-text-light/70">&apos;수리오행&apos;</span>, <span className="text-text-light/70">&apos;발음오행&apos;</span>의 기준이 서로 다릅니다.
              </p>
              <div className="space-y-3 border-l border-white/10 pl-3">
                <div>
                  <span className="font-bold text-neon block">1. 자원오행 (字源五行 - 한자 뜻/부수)</span>
                  <span className="text-text-light/70">한자 고유의 부수와 글자 뜻에 담긴 오행</span>입니다. 사주에서 결핍된 기운을 보완합니다.<br/>
                  <span className="text-[10px] text-text-light/50 font-mono">예: 夏(여름 하)는 10획이지만 여름(불)이므로 火, 槿(무궁화 근)은 15획이지만 나무(木)이므로 木</span>
                </div>
                <div>
                  <span className="font-bold text-neon block">2. 수리오행 (數理五行 - 획수 끝자리)</span>
                  <span className="text-text-light/70">하도낙서(河圖洛書) 수리 원리에 따른 획수의 끝자리 기준</span>입니다.<br/>
                  <span className="text-[10px] text-text-light/60 font-mono block mt-0.5">
                    • 1·6 = 수(水) | 2·7 = 화(火) | 3·8 = 목(木) | 4·9 = 금(金) | 5·10 = 토(土)
                  </span>
                  <span className="text-[10px] text-text-light/50 font-mono">
                    ※ 10획(끝자리 0/10)과 15획(끝자리 5)은 <strong>수리오행으로는 모두 토(土)</strong>입니다.
                  </span>
                </div>
                <div>
                  <span className="font-bold text-neon block">3. 발음오행 (音靈五行 - 한글 첫소리)</span>
                  <span className="text-text-light/70">이름을 부를 때 울리는 소리 파동의 상생</span>입니다.<br/>
                  <span className="text-[10px] text-text-light/50 font-mono">
                    (ㄱ/ㅋ=목, ㄴ/ㄷ/ㄹ/ㅌ=화, ㅇ/ㅎ=토, ㅅ/ㅈ/ㅊ=금, ㅁ/ㅂ/ㅍ=수)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Stamp Stamp design */}
          <div className="p-6 border border-neon/10 bg-neon/[0.02] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-neon block">ANY1 AUTHENTICATION CERTIFICATE</span>
              <p className="text-[10px] text-text-light/40 leading-tight">
                본 추천 명조는 동양 철학 정통 마의상법 및 성명사정법에 입각하여 AI 엔진으로 완벽하게 조화시킨 길명(吉名)임을 인증합니다.
              </p>
            </div>
            <div className="w-14 h-14 border border-neon/40 rounded-full flex items-center justify-center rotate-12 shrink-0 select-none">
              <span className="text-[8px] font-black font-serif text-neon tracking-wider uppercase text-center leading-none">吉名<br/>인증</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
