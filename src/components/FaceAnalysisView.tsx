import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Sparkles, 
  Shield, 
  Flame, 
  TrendingUp, 
  Activity, 
  HelpCircle, 
  Info,
  Layers, 
  Compass, 
  BookOpen, 
  Eye, 
  CheckCircle2, 
  Heart, 
  Coins, 
  Briefcase 
} from 'lucide-react';

interface FeatureDetail {
  type: string;
  meaning: string;
  score: number;
  details: string;
}

interface FaceAnalysisData {
  forehead: FeatureDetail;
  eyebrows: FeatureDetail;
  eyes: FeatureDetail;
  nose: FeatureDetail;
  mouth: FeatureDetail;
  philtrum: FeatureDetail;
  ears: FeatureDetail;
  headShape: FeatureDetail;
  boneStructure: FeatureDetail;
  overall: {
    personality: string;
    wealth: string;
    career: string;
    health: string;
    summary: string;
  };
}

interface FaceAnalysisViewProps {
  data: FaceAnalysisData;
}

export default function FaceAnalysisView({ data }: FaceAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<'samjung' | 'features' | 'overall'>('features');
  const [selectedFeature, setSelectedFeature] = useState<keyof Omit<FaceAnalysisData, 'overall'>>('forehead');

  const featuresMeta = {
    forehead: { label: '이마 (상정)', eng: 'Forehead', desc: '초년운, 지성, 관록, 부모덕' },
    eyebrows: { label: '눈썹 (보수궁)', eng: 'Eyebrows', desc: '대인관계, 형제덕, 지혜, 감성' },
    eyes: { label: '눈 (감찰궁)', eng: 'Eyes', desc: '정신, 총명함, 배우자운, 마음의 창' },
    nose: { label: '코 (재백궁)', eng: 'Nose', desc: '재물운, 주관, 자존심, 중년운' },
    mouth: { label: '입 (출납궁)', eng: 'Mouth', desc: '말년운, 소통, 신용, 자녀덕, 가정운' },
    philtrum: { label: '인중 (수명선)', eng: 'Philtrum', desc: '건강, 수명, 후손운, 재물의 흐름' },
    ears: { label: '귀 (채청관)', eng: 'Ears', desc: '지혜, 인품, 장수, 근원적 건강운' },
    headShape: { label: '머리모양', eng: 'Head Shape', desc: '기질, 재능의 성격, 전반적인 기조' },
    boneStructure: { label: '골격 및 턱', eng: 'Bone Structure', desc: '의지력, 인내심, 지지 세력, 말년 지지' }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-neon border-neon/30 bg-neon/10';
    if (score >= 80) return 'text-lime-400 border-lime-400/30 bg-lime-400/10';
    return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-neon shadow-[0_0_10px_rgba(207,255,4,0.5)]';
    if (score >= 80) return 'bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]';
    return 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]';
  };

  // Three Divisions (삼정) Analysis helper
  const samjungData = {
    sangjung: {
      title: "상정 (上停) - 이마에서 눈썹까지",
      period: "초년운 (1세 ~ 30세)",
      symbol: "하늘 (天)",
      desc: "지성과 정신 능력, 부모덕과 학업운을 상징합니다. 이마가 넓고 깨끗하면 초년에 영리하고 귀인(부모 등)의 조력을 크게 입어 순조롭게 출발하는 기운을 갖습니다.",
      features: ["forehead"],
      grade: data.forehead.score >= 85 ? "우수 (A+)" : "보통 (B)"
    },
    jungjung: {
      title: "중정 (中停) - 눈썹에서 코끝까지",
      period: "중년운 (31세 ~ 50세)",
      symbol: "인간 (人)",
      desc: "본인의 의지력, 주관, 독립심, 추진력과 사회적 자립을 상징합니다. 코와 눈, 눈썹이 수려하면 중년기에 강한 돌파력으로 재물과 지위를 자수성가하여 축적하는 기조를 띱니다.",
      features: ["nose", "eyes", "eyebrows"],
      grade: Math.max(data.nose.score, data.eyes.score) >= 88 ? "극상 (S)" : "우수 (A)"
    },
    hajung: {
      title: "하정 (下停) - 인중에서 턱끝까지",
      period: "말년운 (51세 ~ 노년)",
      symbol: "대지 (地)",
      desc: "인내심, 포용력, 자녀운, 부하 및 추종자의 덕을 상징합니다. 입과 턱, 인중이 균형 잡히고 두툼하면 노년에 거두어들이는 수확이 풍성하고 평안하며 안락한 안식처를 이룹니다.",
      features: ["mouth", "philtrum", "boneStructure", "ears"],
      grade: Math.max(data.mouth.score, data.philtrum.score) >= 85 ? "우수 (A)" : "보통 (B)"
    }
  };

  return (
    <div className="w-full bg-white/[0.01] border border-border-dark p-6 md:p-8 rounded-none">
      {/* Top Banner with HUD Scan Effect */}
      <div className="relative mb-8 p-6 border border-neon/20 bg-neon/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-neon animate-[scan_3s_ease-in-out_infinite]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-neon rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-neon">Physiognomy Neural Analysis</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
              AI 관상 정밀 해독 <span className="text-neon">결과 보고서</span>
            </h2>
          </div>
          <div className="px-4 py-2 bg-black/40 border border-white/10 font-mono text-[10px] font-bold text-text-light/60">
            SCAN_STATUS: <span className="text-neon">COMPLETED (100%)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-dark mb-8">
        {[
          { id: 'features', label: '8대 부위별 상세 분석', icon: Eye },
          { id: 'samjung', label: '삼정(초·중·말년) 해독', icon: Layers },
          { id: 'overall', label: '종합 운세 판독', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none px-6 py-4 border-b-2 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all ${
                activeTab === tab.id 
                  ? 'border-neon text-neon bg-neon/5' 
                  : 'border-transparent text-text-light/40 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Column: Feature Selector */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <span className="text-[9px] font-mono font-black uppercase tracking-[0.25em] text-text-light/30 block mb-2">// Select Facial Node</span>
              {Object.entries(featuresMeta).map(([key, meta]) => {
                const isSelected = selectedFeature === key;
                const fData = data[key as keyof Omit<FaceAnalysisData, 'overall'>];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedFeature(key as any)}
                    className={`p-4 border transition-all text-left flex items-center justify-between ${
                      isSelected 
                        ? 'border-neon bg-neon/10 text-white' 
                        : 'border-white/5 bg-white/[0.01] text-text-light/60 hover:border-white/20 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isSelected && <div className="w-1.5 h-1.5 bg-neon rounded-full" />}
                        <span className={`text-xs font-bold ${isSelected ? 'text-neon' : 'text-text-light'}`}>{meta.label}</span>
                        <span className="text-[10px] text-text-light/20 font-mono">{meta.eng}</span>
                      </div>
                      <p className="text-[10px] text-text-light/40 truncate max-w-[240px]">{fData.type}</p>
                    </div>
                    
                    <div className={`px-2.5 py-1 border text-[10px] font-mono font-black ${getScoreColor(fData.score)}`}>
                      {fData.score}%
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Detailed Node View */}
            <div className="lg:col-span-7 flex flex-col border border-border-dark bg-white/[0.01] p-6 md:p-8 relative">
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-5 border-t border-r border-neon" />
              <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none opacity-5 border-b border-l border-neon" />
              
              <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
                <div>
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-neon block mb-1">Active Diagnostic Node</span>
                  <h3 className="text-2xl font-black text-white italic tracking-tight">{featuresMeta[selectedFeature].label}</h3>
                  <p className="text-[11px] text-text-light/40 uppercase tracking-widest mt-1 font-semibold">{featuresMeta[selectedFeature].desc}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-mono text-text-light/30 uppercase">Node Energy</span>
                  <span className="text-3xl font-mono font-black text-neon">{data[selectedFeature].score}%</span>
                </div>
              </div>

              {/* Progress gauge bar */}
              <div className="mb-6 bg-white/5 h-2 w-full overflow-hidden border border-white/10 relative">
                <div 
                  className={`h-full transition-all duration-500 ${getScoreBarColor(data[selectedFeature].score)}`} 
                  style={{ width: `${data[selectedFeature].score}%` }} 
                />
              </div>

              {/* Content sections */}
              <div className="space-y-6 flex-grow">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60 mb-2 flex items-center gap-2">
                    <Info size={12} />
                    형태 판독 결과
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 text-white font-bold text-sm">
                    {data[selectedFeature].type}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60 mb-2 flex items-center gap-2">
                    <Compass size={12} />
                    동양 관상학적 암시 및 운세
                  </div>
                  <p className="text-xs text-text-light/80 leading-relaxed font-medium">
                    {data[selectedFeature].meaning}
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon/60 mb-2 flex items-center gap-2">
                    <BookOpen size={12} />
                    부위별 상세 운세 분석
                  </div>
                  <p className="text-xs text-text-light/50 leading-relaxed font-medium">
                    {data[selectedFeature].details}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'samjung' && (
          <motion.div
            key="samjung"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(samjungData).map(([key, item]) => (
                <div key={key} className="p-6 border border-border-dark bg-white/[0.01] hover:border-neon/30 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-0.5 bg-neon/10 border border-neon/20 text-[9px] font-mono font-black text-neon uppercase tracking-wider">
                        {item.symbol}
                      </span>
                      <span className="text-[10px] font-mono text-text-light/40">{item.period}</span>
                    </div>
                    <h4 className="text-lg font-black text-white mb-2 italic tracking-tight">{item.title}</h4>
                    <p className="text-xs text-text-light/50 leading-relaxed font-medium mb-6">{item.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-light/30 uppercase tracking-wider">포함 부위</span>
                    <div className="flex gap-1.5">
                      {item.features.map(f => (
                        <span key={f} className="text-[10px] px-2 py-0.5 bg-white/5 text-text-light/60 font-medium">
                          {featuresMeta[f as keyof typeof featuresMeta]?.label.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tripartite Division Advice Block */}
            <div className="p-6 border border-border-dark bg-white/[0.01] mt-8">
              <div className="flex items-center gap-3 mb-3 text-neon">
                <Info size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider">동양 관상학의 핵심, 삼정(三停) 해독 기조</h4>
              </div>
              <p className="text-xs text-text-light/40 leading-relaxed font-medium">
                인간의 얼굴은 하늘(상정), 인간(중정), 땅(하정)의 기운을 모두 담고 있는 우주적인 소우주입니다. 세 부위의 크기와 골격, 조화가 균등할수록 삶의 굴곡이 없고 평온한 길성(吉星)을 띠게 됩니다. 어느 한 곳이 지나치게 발달하거나 왜소한 경우 특정 시기에 부침을 겪을 수 있으므로 다른 부위들의 장점을 결합하여 조화를 모색해야 합니다.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'overall' && (
          <motion.div
            key="overall"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Fortune Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { 
                  title: '성격 및 타고난 천성 (Personality)', 
                  desc: data.overall.personality, 
                  icon: User, 
                  color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' 
                },
                { 
                  title: '평생 재물 및 축적운 (Wealth)', 
                  desc: data.overall.wealth, 
                  icon: Coins, 
                  color: 'text-neon border-neon/20 bg-neon/5' 
                },
                { 
                  title: '직업 및 사회 성공운 (Career)', 
                  desc: data.overall.career, 
                  icon: Briefcase, 
                  color: 'text-lime-400 border-lime-400/20 bg-lime-400/5' 
                },
                { 
                  title: '건강 및 생명 에너지 (Health)', 
                  desc: data.overall.health, 
                  icon: Activity, 
                  color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' 
                }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`p-6 border ${item.color} flex flex-col gap-4`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-black/40 border border-white/5 rounded-full">
                        <Icon size={18} />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">{item.title}</h4>
                    </div>
                    <p className="text-xs text-text-light/80 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="p-8 border border-neon/30 bg-neon/5 relative overflow-hidden mt-6">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="text-neon" size={18} />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">종합 처세와 조언 (Oracle Advice)</h4>
                </div>
                <p className="text-xs text-text-light leading-relaxed font-medium">
                  {data.overall.summary}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
