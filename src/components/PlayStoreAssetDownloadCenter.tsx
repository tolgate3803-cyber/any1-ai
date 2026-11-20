import { useState } from 'react';
import { Download, Copy, Check, ExternalLink, ShieldCheck, Smartphone, Image as ImageIcon, Sparkles, AlertTriangle, HelpCircle } from 'lucide-react';

interface AssetDownloadCenterProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function PlayStoreAssetDownloadCenter({ onClose, isModal = false }: AssetDownloadCenterProps) {
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<Record<string, boolean>>({});
  const [copiedPrivacy, setCopiedPrivacy] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://any1.ai';
  const privacyUrl = `${baseUrl}/privacy.html`;

  const assets = [
    {
      id: 'icon',
      title: '1. 앱 아이콘 (필수)',
      filename: 'icon.png',
      url: '/icon.png',
      size: '512 x 512 px',
      format: 'PNG',
      desc: '구글 플레이 스토어 검색 결과 및 홈 화면에 표시되는 공식 정사각 앱 아이콘입니다.',
      color: 'from-cyan-500/20 to-blue-500/10',
      badge: '스토어 아이콘'
    },
    {
      id: 'feature',
      title: '2. 그래픽 이미지 (필수 - 2번째 에셋)',
      filename: 'feature-graphic.png',
      url: '/feature-graphic.png',
      size: '1024 x 500 px',
      format: 'PNG',
      desc: '사용자님이 질문하신 "다른 하나는 뭘 넣어야 하나요?"의 정답입니다! 스토어 메인 상단 추천 배너로 필수입니다.',
      color: 'from-lime-500/20 to-emerald-500/10',
      badge: '상단 와이드 배너'
    },
    {
      id: 'screenshot1',
      title: '3. 휴대전화 스크린샷 1 (필수)',
      filename: 'screenshot-1.png',
      url: '/screenshot-1.png',
      size: '1080 x 1920 px',
      format: 'PNG',
      desc: 'AI TOTAL 메인 대시보드와 24개 통합 인공지능 기능 카테고리를 보여주는 스크린샷입니다.',
      color: 'from-purple-500/20 to-indigo-500/10',
      badge: '스크린샷 1'
    },
    {
      id: 'screenshot2',
      title: '4. 휴대전화 스크린샷 2 (필수)',
      filename: 'screenshot-2.png',
      url: '/screenshot-2.png',
      size: '1080 x 1920 px',
      format: 'PNG',
      desc: '원광만세력 정통 100% 일치 정밀 사주 명식과 대운·세운 풀이 실행 화면 스크린샷입니다. (스크린샷은 최소 2장 필수)',
      color: 'from-amber-500/20 to-yellow-500/10',
      badge: '스크린샷 2'
    }
  ];

  const triggerDownload = async (url: string, filename: string, id: string) => {
    try {
      setDownloadStatus(prev => ({ ...prev, [id]: true }));
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [id]: false }));
      }, 1500);
    } catch (e) {
      // Fallback: direct window.open or link click
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.click();
      setDownloadStatus(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      await triggerDownload(asset.url, asset.filename, asset.id);
      await new Promise(res => setTimeout(res, 400));
    }
    setDownloadingAll(false);
  };

  const handleCopyPrivacy = () => {
    navigator.clipboard.writeText(privacyUrl);
    setCopiedPrivacy(true);
    setTimeout(() => setCopiedPrivacy(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Important Alert: Do not pay $10 */}
      <div className="p-4 bg-red-500/15 border-2 border-red-500/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[10px] rounded uppercase tracking-wider">
                결제 금지 경고
              </span>
              <h4 className="text-sm font-black text-white">
                PrivacyPolicies 10달러 유료 결제는 절대 하지 마세요!
              </h4>
            </div>
            <p className="text-xs text-text-light/80 mt-1 leading-relaxed">
              외부 사이트에 10달러를 결제하실 필요가 전혀 없습니다! 본 웹앱에 <strong className="text-neon underline">100% 무료 공식 개인정보처리방침 웹페이지</strong>가 이미 완성되어 있습니다. 아래 링크를 복사하여 구글 플레이 콘솔에 넣으시면 <strong>0원</strong>으로 바로 통과됩니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={handleCopyPrivacy}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all w-full md:w-auto ${
              copiedPrivacy
                ? 'bg-neon text-bg-dark font-black shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            {copiedPrivacy ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPrivacy ? '무료 URL 복사 완료!' : '무료 방침 URL 복사'}</span>
          </button>
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-white/5 hover:bg-white/10 text-text-light/70 hover:text-white rounded-lg border border-white/10 shrink-0"
            title="개인정보처리방침 미리보기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-neon/15 via-white/[0.02] to-transparent p-5 border border-border-dark rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-neon/20 border border-neon/40 text-neon text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              구글 플레이 필수 에셋 다운로드 센터
            </span>
            <span className="text-white/40 text-[10px] font-mono">규격 100% 일치 보장</span>
          </div>
          <h3 className="text-base md:text-lg font-black text-white">
            에셋 2개 질문 답변: "앱 아이콘" + "그래픽 이미지" + "스크린샷 2장"
          </h3>
          <p className="text-xs text-text-light/70 mt-1 leading-relaxed">
            구글 플레이 콘솔에서 요구하는 규격(512x512, 1024x500, 1080x1920)에 맞게 완벽 제작된 4개 에셋입니다. 아래 버튼을 눌러 스마트폰이나 PC에 즉시 저장하세요!
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="px-5 py-3 bg-neon text-bg-dark font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{downloadingAll ? '4개 파일 다운로드 중...' : '⚡ 4개 에셋 전체 한 번에 받기'}</span>
        </button>
      </div>

      {/* Mobile Save Tip */}
      <div className="p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-lg flex items-center gap-3 text-xs text-blue-200">
        <Smartphone className="w-5 h-5 text-blue-400 shrink-0" />
        <p className="leading-relaxed">
          <strong>스마트폰 꿀팁:</strong> 다운로드 버튼이 작동하지 않을 경우, 아래 각 <strong>이미지를 손가락으로 1~2초간 꾹 누르면(길게 터치)</strong> 브라우저 메뉴에 <strong>[이미지 다운로드]</strong> 또는 <strong>[이미지 저장]</strong>이 나타나 갤러리에 바로 저장할 수 있습니다!
        </p>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="border border-border-dark bg-[#0a0d14] rounded-xl overflow-hidden flex flex-col justify-between hover:border-neon/40 transition-all shadow-xl"
          >
            {/* Asset Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-neon/15 text-neon rounded border border-neon/30">
                    {asset.badge}
                  </span>
                  <span className="text-[10px] font-mono text-white/50">
                    {asset.size} • {asset.format}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  {asset.title}
                </h4>
              </div>

              <button
                onClick={() => triggerDownload(asset.url, asset.filename, asset.id)}
                className="px-3.5 py-1.5 bg-neon/10 hover:bg-neon hover:text-bg-dark border border-neon/40 text-neon font-black text-xs rounded flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {downloadStatus[asset.id] ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloadStatus[asset.id] ? '저장됨!' : '다운로드'}</span>
              </button>
            </div>

            {/* Visual Image Preview */}
            <div className="p-4 flex flex-col items-center justify-center bg-black/40 min-h-[220px]">
              <div className="relative group max-w-full flex items-center justify-center">
                <img
                  src={asset.url}
                  alt={asset.title}
                  className={`rounded-lg border border-white/10 shadow-2xl object-contain transition-transform group-hover:scale-[1.02] ${
                    asset.id === 'icon' 
                      ? 'w-36 h-36' 
                      : asset.id === 'feature' 
                        ? 'w-full max-h-36' 
                        : 'w-36 max-h-64'
                  }`}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button
                    onClick={() => triggerDownload(asset.url, asset.filename, asset.id)}
                    className="px-3 py-1.5 bg-neon text-bg-dark font-black text-xs rounded flex items-center gap-1 shadow-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PC/폰에 저장</span>
                  </button>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded"
                    title="새 창에서 원본 보기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <span className="text-[10px] text-white/30 mt-2 font-mono">
                (이미지를 꾹 누르면 모바일 갤러리에 바로 저장 가능)
              </span>
            </div>

            {/* Asset Footer Description */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01]">
              <p className="text-xs text-text-light/70 leading-relaxed font-sans">
                {asset.desc}
              </p>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-white/40 font-mono">파일: {asset.filename}</span>
                <a
                  href={asset.url}
                  download={asset.filename}
                  className="text-neon hover:underline font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>직접 받기</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions on where to upload in Google Play Console */}
      <div className="p-5 border border-border-dark bg-black/50 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-neon" />
          <h4 className="text-xs font-black uppercase text-neon tracking-wider">
            Google Play Console 등록 위치 안내 (어디에 올려야 하나요?)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-text-light/80">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
            <span className="text-neon font-bold block mb-1">1. [스토어 등록정보] → [앱 아이콘]</span>
            <p className="text-[11px] text-white/60">
              방금 다운로드한 <strong>icon.png (512x512)</strong>를 업로드합니다.
            </p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
            <span className="text-neon font-bold block mb-1">2. [스토어 등록정보] → [그래픽 이미지]</span>
            <p className="text-[11px] text-white/60">
              "2번째 에셋"인 <strong>feature-graphic.png (1024x500)</strong>를 업로드합니다.
            </p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
            <span className="text-neon font-bold block mb-1">3. [휴대전화 스크린샷] (최소 2개)</span>
            <p className="text-[11px] text-white/60">
              <strong>screenshot-1.png</strong>와 <strong>screenshot-2.png</strong> 2개를 모두 드래그하여 업로드합니다.
            </p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded">
            <span className="text-neon font-bold block mb-1">4. [개인정보처리방침 URL]</span>
            <p className="text-[11px] text-white/60">
              위의 [무료 방침 URL 복사]를 눌러 <strong>{privacyUrl}</strong>를 붙여넣으세요. ($10 결제 금지!)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
