import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Map, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Info, 
  RotateCw, 
  ArrowUp,
  Layout,
  Home,
  Sliders,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';

export interface DirectionItem {
  dir: string;
  type: string;
  desc: string;
}

export interface PrescriptionItem {
  room: string;
  title: string;
  status: '최상' | '양호' | '주의' | '경고' | string;
  text: string;
  remedy: string;
}

export interface PungsuAnalysisData {
  analysisType: 'interior' | 'compass' | 'water-veins' | string;
  kuaNumber?: string;
  favorableDirections?: DirectionItem[];
  unfavorableDirections?: DirectionItem[];
  interiorPrescriptions?: PrescriptionItem[];
  elementBalance?: {
    wood?: number;
    fire?: number;
    earth?: number;
    metal?: number;
    water?: number;
    [key: string]: number | undefined;
  };
  generalAdvice: string;
}

interface PungsuViewProps {
  data: PungsuAnalysisData;
}

export default function PungsuView({ data }: PungsuViewProps) {
  const [activeTab, setActiveTab] = useState<'compass' | 'prescriptions' | 'elements'>('compass');
  const [rotationAngle, setRotationAngle] = useState(0);
  const [adviceCopied, setAdviceCopied] = useState(false);
  const [directionsCopied, setDirectionsCopied] = useState(false);
  const [prescriptionsCopied, setPrescriptionsCopied] = useState(false);
  const [fullReportCopied, setFullReportCopied] = useState(false);

  const copyDirections = async () => {
    let text = "천명에 따른 길방(吉方) 및 피해야 할 흉방(凶方) 분석 결과:\n\n";
    if (data.favorableDirections) {
      text += "[길방 (Favorable)]\n";
      data.favorableDirections.forEach(item => {
        text += `- 방위: ${item.dir} (${item.type})\n  설명: ${item.desc}\n`;
      });
      text += "\n";
    }
    if (data.unfavorableDirections) {
      text += "[흉방 (Unfavorable)]\n";
      data.unfavorableDirections.forEach(item => {
        text += `- 방위: ${item.dir} (${item.type})\n  설명: ${item.desc}\n`;
      });
    }
    try {
      await navigator.clipboard.writeText(text);
      setDirectionsCopied(true);
      setTimeout(() => setDirectionsCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyPrescriptions = async () => {
    let text = "공간 배치 및 비보 처방 결과:\n\n";
    if (data.interiorPrescriptions) {
      data.interiorPrescriptions.forEach((item, idx) => {
        text += `[${idx + 1}] 공간: ${item.room}\n- 상태: ${item.status}\n- 제목: ${item.title}\n- 설명: ${item.text}\n- AI 풍수 비보 처방: ${item.remedy}\n\n`;
      });
    }
    try {
      await navigator.clipboard.writeText(text);
      setPrescriptionsCopied(true);
      setTimeout(() => setPrescriptionsCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyFullReport = async () => {
    let text = `☯️ AI 명가 풍수지리 처방서 ☯️\n\n`;
    if (data.kuaNumber) {
      text += `본명괘 (本命卦): ${data.kuaNumber}\n\n`;
    }
    text += `===============================\n`;
    text += `1. 천명에 따른 길방(吉方) 및 피해야 할 흉방(凶方)\n`;
    text += `===============================\n`;
    if (data.favorableDirections) {
      text += `[길방 (Favorable)]\n`;
      data.favorableDirections.forEach(item => {
        text += `- ${item.dir} (${item.type}): ${item.desc}\n`;
      });
    }
    if (data.unfavorableDirections) {
      text += `\n[흉방 (Unfavorable)]\n`;
      data.unfavorableDirections.forEach(item => {
        text += `- ${item.dir} (${item.type}): ${item.desc}\n`;
      });
    }
    text += `\n\n===============================\n`;
    text += `2. 공간 배치 및 비보 처방\n`;
    text += `===============================\n`;
    if (data.interiorPrescriptions) {
      data.interiorPrescriptions.forEach(item => {
        text += `[${item.room}] ${item.title} (상태: ${item.status})\n- 진단: ${item.text}\n- 풍수 처방: ${item.remedy}\n\n`;
      });
    }
    text += `===============================\n`;
    text += `3. AI 풍수 마스터 종합 처세 조언\n`;
    text += `===============================\n`;
    text += `${data.generalAdvice}\n`;
    
    try {
      await navigator.clipboard.writeText(text);
      setFullReportCopied(true);
      setTimeout(() => setFullReportCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '최상':
        return <CheckCircle2 size={16} className="text-neon" />;
      case '양호':
        return <CheckCircle2 size={16} className="text-lime-400" />;
      case '주의':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case '경고':
        return <XCircle size={16} className="text-red-500 animate-pulse" />;
      default:
        return <HelpCircle size={16} className="text-text-light/40" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '최상':
        return 'bg-neon/10 border-neon/30 text-neon';
      case '양호':
        return 'bg-lime-500/10 border-lime-500/20 text-lime-400';
      case '주의':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case '경고':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-white/5 border-white/10 text-text-light/60';
    }
  };

  const getElementColor = (el: string) => {
    switch (el) {
      case 'wood': return 'bg-emerald-500';
      case 'fire': return 'bg-red-500';
      case 'earth': return 'bg-amber-600';
      case 'metal': return 'bg-slate-300';
      case 'water': return 'bg-cyan-500';
      default: return 'bg-neon';
    }
  };

  const getElementNameKorean = (el: string) => {
    switch (el) {
      case 'wood': return '목 (木) - 성정과 활력';
      case 'fire': return '화 (火) - 열정과 승진';
      case 'earth': return '토 (土) - 안정과 부동산';
      case 'metal': return '금 (金) - 결단과 재물축적';
      case 'water': return '수 (水) - 지혜와 유통';
      default: return el;
    }
  };

  const rotateCompass = () => {
    setRotationAngle(prev => prev + 45);
  };

  // Cardinal directions layout for compass (degree from Top (North))
  const compassDirections = [
    { name: '북 (子)', angle: 0, isGood: true, label: 'North' },
    { name: '동북 (艮)', angle: 45, isGood: false, label: 'Northeast' },
    { name: '동 (震)', angle: 90, isGood: true, label: 'East' },
    { name: '남동 (巽)', angle: 135, isGood: true, label: 'Southeast' },
    { name: '남 (離)', angle: 180, isGood: true, label: 'South' },
    { name: '남서 (坤)', angle: 225, isGood: false, label: 'Southwest' },
    { name: '서 (兌)', angle: 270, isGood: false, label: 'West' },
    { name: '북서 (乾)', angle: 315, isGood: false, label: 'Northwest' }
  ];

  return (
    <div id="pungsu_view_root" className="w-full bg-white/[0.01] border border-border-dark p-6 md:p-8 rounded-none">
      {/* Top Header Banner */}
      <div className="relative mb-8 p-6 border border-neon/20 bg-neon/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-neon animate-[scan_3s_ease-in-out_infinite]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-neon rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-neon">AI Feng Shui & Spatial Alignment</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
              AI 명가 <span className="text-neon">풍수지리 처방서</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyFullReport}
              className="px-3.5 py-2 bg-neon text-bg-dark font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer rounded"
              title="전체 처방 결과 텍스트 복사"
            >
              {fullReportCopied ? <Check size={12} /> : <Copy size={12} />}
              {fullReportCopied ? '전체 복사 완료' : '전체 처방 복사'}
            </button>
            {data.kuaNumber && (
              <div className="px-4 py-2 bg-black/40 border border-neon/20 font-mono text-[11px] font-bold text-neon flex items-center gap-2 rounded">
                <Compass size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
                본명괘 (本命卦): <span className="font-black text-white">{data.kuaNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-dark mb-8">
        <button
          onClick={() => setActiveTab('compass')}
          className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'compass' 
              ? 'border-neon text-neon bg-white/[0.02]' 
              : 'border-transparent text-text-light/40 hover:text-white'
          }`}
        >
          <Compass size={14} />
          공간 길방 분석 (나침반)
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'prescriptions' 
              ? 'border-neon text-neon bg-white/[0.02]' 
              : 'border-transparent text-text-light/40 hover:text-white'
          }`}
        >
          <Home size={14} />
          공간 배치 및 비보 처방
        </button>
        <button
          onClick={() => setActiveTab('elements')}
          className={`px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'elements' 
              ? 'border-neon text-neon bg-white/[0.02]' 
              : 'border-transparent text-text-light/40 hover:text-white'
          }`}
        >
          <Sliders size={14} />
          오행 기운 분석
        </button>
      </div>

      {/* Content Block */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'compass' && (
            <motion.div
              key="compass_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Compass Interactive UI */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center py-6">
                <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full border border-white/10 bg-black/40 flex items-center justify-center p-4 shadow-[0_0_50px_rgba(207,255,4,0.03)]">
                  {/* Rotating Compass Outer Rim */}
                  <motion.div
                    animate={{ rotate: rotationAngle }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="absolute inset-2 rounded-full border-4 border-double border-white/10 flex items-center justify-center"
                  >
                    {/* Tick Marks */}
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-[1px] h-3 bg-white/10"
                        style={{ transform: `rotate(${i * 15}deg) translateY(-130px)` }}
                      />
                    ))}

                    {/* Cardinal Letters */}
                    {compassDirections.map((dir, idx) => {
                      const angle = dir.angle;
                      // Determine if this dir is highlighted as favorable or not based on our response
                      const isFavorable = data.favorableDirections?.some(f => f.dir.includes(dir.name.substring(0, 1)));
                      const isUnfavorable = data.unfavorableDirections?.some(u => u.dir.includes(dir.name.substring(0, 1)));

                      let textClass = 'text-text-light/40';
                      let borderStyle = '';
                      if (isFavorable) {
                        textClass = 'text-neon font-black drop-shadow-[0_0_8px_rgba(207,255,4,0.3)]';
                      } else if (isUnfavorable) {
                        textClass = 'text-red-500 font-bold';
                      }

                      return (
                        <div
                          key={idx}
                          className="absolute flex flex-col items-center justify-center"
                          style={{ transform: `rotate(${angle}deg) translateY(-100px) rotate(${-angle}deg)` }}
                        >
                          <span className={`text-[10px] md:text-xs tracking-tight ${textClass}`}>
                            {dir.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* Inner Compass Star */}
                    <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-bg-dark">
                      <div className="w-3 h-3 bg-neon rounded-full" />
                    </div>
                  </motion.div>

                  {/* Static Needle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-4 h-full flex flex-col items-center justify-between py-8">
                      {/* Red magnetic north needle point */}
                      <ArrowUp className="text-red-500 animate-pulse" size={24} />
                      <div className="w-1 h-32 bg-gradient-to-b from-red-500 to-white/10" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={rotateCompass}
                  className="mt-6 px-4 py-2 border border-neon/20 hover:border-neon bg-neon/5 hover:bg-neon/10 text-neon font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCw size={12} />
                  나침반 회전하기
                </button>
              </div>

              {/* Directional Analysis Details */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-neon flex items-center gap-2">
                      <ShieldCheck size={14} />
                      천명에 따른 길방(吉方) 및 피해야 할 흉방(凶方)
                    </h3>
                    <button
                      type="button"
                      onClick={copyDirections}
                      className="px-2.5 py-1 bg-black/60 hover:bg-neon hover:text-bg-dark border border-white/10 hover:border-neon text-[9px] font-black uppercase tracking-wider text-text-light transition-all flex items-center gap-1 cursor-pointer rounded"
                      title="방위 분석 결과 복사"
                    >
                      {directionsCopied ? <Check size={10} /> : <Copy size={10} />}
                      {directionsCopied ? '복사됨' : '복사'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Favorable Directions */}
                    {data.favorableDirections && data.favorableDirections.map((item, idx) => (
                      <div key={`fav-${idx}`} className="p-4 bg-neon/5 border border-neon/10 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center text-neon text-[10px] font-black shrink-0 mt-0.5">
                          吉
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-white">{item.dir}</span>
                            <span className="text-[9px] font-bold text-neon uppercase tracking-wider px-1.5 py-0.5 bg-neon/10">{item.type}</span>
                          </div>
                          <p className="text-[11px] text-text-light/60 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}

                    {/* Unfavorable Directions */}
                    {data.unfavorableDirections && data.unfavorableDirections.map((item, idx) => (
                      <div key={`unfav-${idx}`} className="p-4 bg-red-500/[0.02] border border-red-500/10 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-[10px] font-black shrink-0 mt-0.5">
                          凶
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-white">{item.dir}</span>
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider px-1.5 py-0.5 bg-red-500/10">{item.type}</span>
                          </div>
                          <p className="text-[11px] text-text-light/60 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div
              key="prescriptions_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-neon flex items-center gap-2">
                  <Home size={14} />
                  공간 배치 및 맞춤형 비보 처방 결과
                </h3>
                <button
                  type="button"
                  onClick={copyPrescriptions}
                  className="px-2.5 py-1 bg-black/60 hover:bg-neon hover:text-bg-dark border border-white/10 hover:border-neon text-[9px] font-black uppercase tracking-wider text-text-light transition-all flex items-center gap-1 cursor-pointer rounded"
                  title="처방 리스트 전체 복사"
                >
                  {prescriptionsCopied ? <Check size={10} /> : <Copy size={10} />}
                  {prescriptionsCopied ? '복사됨' : '복사'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.interiorPrescriptions && data.interiorPrescriptions.map((item, idx) => (
                  <div key={idx} className="p-6 border border-border-dark bg-white/[0.01] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-text-light/40">
                          [{item.room}]
                        </span>
                        <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(item.status)} flex items-center gap-1`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mb-2">{item.title}</h4>
                      <p className="text-[11px] text-text-light/50 leading-relaxed font-medium mb-4">{item.text}</p>
                    </div>
                    <div className="mt-4 p-4 bg-neon/[0.02] border border-neon/10">
                      <div className="text-[9px] font-mono font-black text-neon uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Sparkles size={10} />
                        AI 풍수 비보(裨補) 처방
                      </div>
                      <p className="text-[11px] text-text-light/80 leading-relaxed font-bold">{item.remedy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'elements' && (
            <motion.div
              key="elements_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {data.elementBalance && (
                <div className="p-6 border border-border-dark bg-white/[0.01]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neon mb-6 flex items-center gap-2">
                    <Sliders size={14} />
                    공간 오행 에너지 밸런스 지수 (五行 能量指數)
                  </h3>
                  <div className="space-y-5">
                    {Object.entries(data.elementBalance).map(([key, val]) => {
                      if (typeof val !== 'number') return null;
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-light/80 font-bold">{getElementNameKorean(key)}</span>
                            <span className="font-mono font-black text-white">{val}%</span>
                          </div>
                          <div className="h-2 w-full bg-black/40 border border-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full ${getElementColor(key)}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* General Advice Banner */}
      <div className="mt-8 p-6 border border-white/5 bg-white/[0.02] relative group/advice">
        <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none opacity-5 border-t border-r border-neon" />
        <div className="absolute top-4 right-4 z-10 opacity-60 group-hover/advice:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(data.generalAdvice);
                setAdviceCopied(true);
                setTimeout(() => setAdviceCopied(false), 2000);
              } catch (err) {
                console.error("Failed to copy advice!", err);
              }
            }}
            className="p-1.5 bg-black/60 hover:bg-neon border border-white/10 hover:border-neon text-[9px] font-black uppercase tracking-wider text-text-light hover:text-bg-dark transition-all flex items-center gap-1 cursor-pointer rounded"
            title="조언 복사하기"
          >
            {adviceCopied ? <Check size={10} /> : <Copy size={10} />}
            {adviceCopied ? '복사됨' : '복사'}
          </button>
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-neon mb-3 flex items-center gap-2">
          <Info size={14} />
          AI 풍수 마스터 종합 처세 조언
        </h3>
        <p className="text-xs text-text-light/70 leading-relaxed font-medium pr-14">
          {data.generalAdvice}
        </p>
      </div>
    </div>
  );
}
