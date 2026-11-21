import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
  Settings,
  X,
  Film,
  Video
} from 'lucide-react';
import { AdItem } from '../types';
import AdManagerPanel from './AdManagerPanel';

interface AdBillboardProps {
  mode?: 'dashboard' | 'page';
  adminPassword?: string;
  onBackToDashboard?: () => void;
}

const ACCENT_STYLES: Record<
  AdItem['accentColor'],
  { border: string; text: string; button: string; tickerBg: string }
> = {
  lime: {
    border: 'border-neon/35',
    text: 'text-neon',
    button: 'bg-neon hover:bg-white text-bg-dark',
    tickerBg: 'bg-neon/10 border-t border-neon/25 text-neon'
  },
  cyan: {
    border: 'border-cyan-400/35',
    text: 'text-cyan-300',
    button: 'bg-cyan-400 hover:bg-white text-bg-dark',
    tickerBg: 'bg-cyan-500/10 border-t border-cyan-400/25 text-cyan-200'
  },
  amber: {
    border: 'border-amber-400/35',
    text: 'text-amber-300',
    button: 'bg-amber-400 hover:bg-white text-bg-dark',
    tickerBg: 'bg-amber-500/10 border-t border-amber-400/25 text-amber-200'
  },
  rose: {
    border: 'border-rose-400/35',
    text: 'text-rose-300',
    button: 'bg-rose-400 hover:bg-white text-bg-dark',
    tickerBg: 'bg-rose-500/10 border-t border-rose-400/25 text-rose-200'
  }
};

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/i
  );
  return match?.[1] || null;
}

export default function AdBillboard({ mode = 'dashboard', adminPassword, onBackToDashboard }: AdBillboardProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [mediaErrorId, setMediaErrorId] = useState<string | null>(null);
  const [isPortraitMedia, setIsPortraitMedia] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const fetchPublicAds = async () => {
    try {
      const res = await fetch('/api/ads');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.ads)) {
        setAds(data.ads);
      }
    } catch {
      // Silent fallback to empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPublicAds();
  }, []);

  useEffect(() => {
    if (activeIndex >= ads.length && ads.length > 0) {
      setActiveIndex(0);
    }
  }, [ads.length, activeIndex]);

  // Auto-advance only when multiple non-YouTube ads exist and user isn't hovering
  useEffect(() => {
    if (ads.length <= 1 || isHovered) return;
    const current = ads[activeIndex];
    if (current?.mediaType === 'youtube' || current?.mediaType === 'video') {
      return;
    }
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ads.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [ads, activeIndex, isHovered]);

  const currentAd = ads[activeIndex] || null;
  const accent = currentAd ? ACCENT_STYLES[currentAd.accentColor] || ACCENT_STYLES.lime : ACCENT_STYLES.lime;

  useEffect(() => {
    setIsPortraitMedia(false);
  }, [currentAd?.id, currentAd?.mediaUrl]);

  const handlePrev = () => {
    if (ads.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    if (ads.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % ads.length);
  };

  const handleAdsUpdated = (updatedActiveAds: AdItem[]) => {
    setAds(updatedActiveAds);
    setActiveIndex(0);
    setMediaErrorId(null);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const renderBillboardSurface = () => {
    if (loading) {
      if (mode === 'dashboard') return null;
      return (
        <div className="bg-[#0d0f12] border border-border-dark rounded-2xl p-6 sm:p-8 animate-pulse">
          <div className="h-5 w-40 bg-white/10 rounded mb-4" />
          <div className="h-44 w-full bg-white/5 rounded-xl" />
        </div>
      );
    }

    if (!currentAd) {
      if (mode === 'dashboard') return null;
      return (
        <div className="bg-[#0d0f12] border border-border-dark rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-dark flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Megaphone size={16} className="text-neon shrink-0" />
              <span className="font-black text-white">홍보 · 광고판</span>
              <span className="text-text-light/30">·</span>
              <span className="text-text-light/55">영상 · 배너 · 안내 문구 직접 게시</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                현재 공개 중인 광고가 없습니다
              </h2>
              <p className="text-xs sm:text-sm text-text-light/65 leading-relaxed">
                아래 입력창에서 홍보 동영상이나 안내 문구를 등록하시면 메인 화면 전광판에 바로 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const youtubeId = currentAd.mediaType === 'youtube' ? extractYoutubeId(currentAd.mediaUrl) : null;
    const effectiveAspectMode = currentAd.aspectMode || 'blur16x9';
    const hasMediaBox =
      currentAd.mediaType !== 'text' && Boolean(currentAd.mediaUrl) && mediaErrorId !== currentAd.id;

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`bg-[#0d0f12] border ${accent.border} rounded-2xl overflow-hidden transition-colors`}
      >
        {/* Top Billboard Header Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-border-dark flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs min-w-0">
            <Megaphone size={15} className={`${accent.text} shrink-0`} />
            <span className={`font-black whitespace-nowrap ${accent.text}`}>{currentAd.badge}</span>
            <span className="text-text-light/25">·</span>
            <span className="text-text-light/60 truncate">Any1 AI 공식 광고판</span>
            {ads.length > 1 && (
              <>
                <span className="text-text-light/25">·</span>
                <span className="font-mono tabular-nums text-text-light/55">
                  {activeIndex + 1} / {ads.length}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ads.length > 1 && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="이전 광고"
                  className="p-1.5 border border-border-dark hover:border-neon/50 rounded-lg text-text-light/70 hover:text-white cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="다음 광고"
                  className="p-1.5 border border-border-dark hover:border-neon/50 rounded-lg text-text-light/70 hover:text-white cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Main Content Grid */}
        <div
          className={`grid grid-cols-1 ${
            hasMediaBox ? 'lg:grid-cols-12 items-stretch' : ''
          }`}
        >
          {hasMediaBox && (
            <div
              className={`lg:col-span-7 bg-black relative flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-border-dark ${
                effectiveAspectMode !== 'original'
                  ? 'aspect-video w-full'
                  : 'min-h-[220px] sm:min-h-[280px]'
              }`}
            >
              {youtubeId ? (
                <iframe
                  key={currentAd.id}
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1`}
                  title={currentAd.title || '홍보 동영상'}
                  className="w-full h-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : currentAd.mediaType === 'image' ? (
                <>
                  {effectiveAspectMode === 'blur16x9' && isPortraitMedia && (
                    <img
                      src={currentAd.mediaUrl}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60 pointer-events-none"
                    />
                  )}
                  <img
                    key={currentAd.id}
                    src={currentAd.mediaUrl}
                    alt={currentAd.title || '광고 배너'}
                    referrerPolicy="no-referrer"
                    onLoad={(e) => {
                      setIsPortraitMedia(e.currentTarget.naturalWidth < e.currentTarget.naturalHeight);
                    }}
                    onError={() => setMediaErrorId(currentAd.id)}
                    className={`relative z-10 w-full h-full ${
                      effectiveAspectMode === 'crop16x9'
                        ? 'object-cover'
                        : effectiveAspectMode === 'blur16x9'
                          ? 'object-contain'
                          : 'max-h-[380px] object-contain'
                    }`}
                  />
                </>
              ) : (
                <>
                  {effectiveAspectMode === 'blur16x9' && isPortraitMedia && (
                    <video
                      ref={bgVideoRef}
                      key={`${currentAd.id}-bg`}
                      src={currentAd.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-65 pointer-events-none"
                    />
                  )}
                  <video
                    ref={videoRef}
                    key={currentAd.id}
                    src={currentAd.mediaUrl}
                    controls
                    autoPlay
                    muted={isMuted}
                    loop={ads.length <= 1}
                    playsInline
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      setIsPortraitMedia(v.videoWidth > 0 && v.videoHeight > 0 && v.videoWidth < v.videoHeight);
                    }}
                    onPlay={() => {
                      if (bgVideoRef.current && videoRef.current) {
                        bgVideoRef.current.currentTime = videoRef.current.currentTime;
                        void bgVideoRef.current.play().catch(() => {});
                      }
                    }}
                    onPause={() => {
                      bgVideoRef.current?.pause();
                    }}
                    onSeeked={() => {
                      if (bgVideoRef.current && videoRef.current) {
                        bgVideoRef.current.currentTime = videoRef.current.currentTime;
                      }
                    }}
                    onEnded={() => {
                      if (ads.length > 1) handleNext();
                    }}
                    onError={() => setMediaErrorId(currentAd.id)}
                    className={`relative z-10 w-full h-full ${
                      effectiveAspectMode === 'crop16x9'
                        ? 'object-cover bg-black'
                        : effectiveAspectMode === 'blur16x9'
                          ? 'object-contain'
                          : 'max-h-[380px] object-contain bg-black'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="z-20 absolute top-3 right-3 px-2.5 py-1.5 bg-black/75 hover:bg-black text-white border border-white/20 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-neon" />}
                    <span>{isMuted ? '소리 켜기' : '음소거'}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {mediaErrorId === currentAd.id && currentAd.mediaType !== 'text' && (
            <div className="lg:col-span-7 bg-black/60 flex flex-col items-center justify-center gap-2 p-8 border-b lg:border-b-0 lg:border-r border-border-dark text-center min-h-[220px]">
              <Film size={28} className="text-text-light/40" />
              <p className="text-xs text-text-light/60">
                영상을 불러오지 못했습니다. 관리 화면에서 영상 파일이나 주소를 다시 확인해 주세요.
              </p>
            </div>
          )}

          {/* Ad Text & Action Side */}
          <div
            className={`${
              hasMediaBox || mediaErrorId === currentAd.id ? 'lg:col-span-5' : ''
            } p-6 sm:p-8 flex flex-col justify-between gap-5`}
          >
            <div className="space-y-3">
              {currentAd.title && (
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug text-balance">
                  {currentAd.title}
                </h2>
              )}
              {currentAd.description && (
                <p className="text-sm text-text-light/75 leading-relaxed whitespace-pre-line">
                  {currentAd.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {currentAd.linkUrl ? (
                <a
                  href={currentAd.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-5 py-2.5 ${accent.button} text-xs font-black rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap`}
                >
                  <span>{currentAd.linkLabel || '자세히 보기'}</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span className="text-xs text-text-light/45">홍보 · 안내 전광판</span>
              )}

              {ads.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {ads.map((adItem, idx) => (
                    <button
                      key={adItem.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`${idx + 1}번 광고 보기`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === activeIndex ? 'w-6 bg-neon' : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Ticker Bar */}
        {currentAd.tickerText && (
          <div className={`px-5 sm:px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${accent.tickerBg}`}>
            <span className="shrink-0">안내</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{currentAd.tickerText}</span>
          </div>
        )}
      </div>
    );
  };

  if (mode === 'page') {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-dark pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              광고판 · 홍보 영상 관리
            </h1>
            <p className="text-xs sm:text-sm text-text-light/65 mt-1">
              내가 원하는 광고 문구와 홍보 동영상·유튜브 영상을 올리고 메인 화면 광고판 모습을 바로 확인할 수 있습니다.
            </p>
          </div>
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 border border-border-dark hover:border-neon text-xs font-bold text-text-light hover:text-neon rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              홈으로 돌아가기
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold text-text-light/60">현재 메인 화면에 보이는 광고판 미리보기</div>
          {renderBillboardSurface()}
        </div>

        <AdManagerPanel adminPassword={adminPassword} onAdsUpdated={handleAdsUpdated} />
      </div>
    );
  }

  if (!currentAd) return null;

  return (
    <section className="px-6 sm:px-10 pt-6">
      {renderBillboardSurface()}

      {/* Quick In-Place Ad Management Modal */}
      <AnimatePresence>
        {isManagerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManagerModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#080a0d] border border-border-dark p-5 sm:p-7 rounded-2xl shadow-2xl z-10 my-auto"
            >
              <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-border-dark">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    광고판 문구 · 동영상 직접 관리
                  </h2>
                  <p className="text-xs text-text-light/60 mt-0.5">
                    등록하거나 수정하면 메인 화면 광고판에 즉시 반영됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManagerModalOpen(false)}
                  className="p-2 text-text-light/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer"
                  aria-label="창 닫기"
                >
                  <X size={18} />
                </button>
              </div>

              <AdManagerPanel onAdsUpdated={handleAdsUpdated} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
