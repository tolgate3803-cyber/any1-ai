import { useState, useEffect, useRef } from 'react';
import {
  Video,
  Image as ImageIcon,
  Type,
  Upload,
  Link2,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Megaphone
} from 'lucide-react';
import { AdItem } from '../types';

interface AdManagerPanelProps {
  adminPassword?: string;
  onAdsUpdated?: (activeAds: AdItem[]) => void;
}

const ACCENT_OPTIONS: Array<{
  id: AdItem['accentColor'];
  label: string;
  swatchClass: string;
}> = [
  { id: 'lime', label: '네온 라임', swatchClass: 'bg-[#CFFF04]' },
  { id: 'cyan', label: '일렉트릭 시안', swatchClass: 'bg-cyan-400' },
  { id: 'amber', label: '골드 앰버', swatchClass: 'bg-amber-400' },
  { id: 'rose', label: '로즈 레드', swatchClass: 'bg-rose-400' }
];

function extractYoutubeIdClient(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/i
  );
  return match?.[1] || null;
}

export default function AdManagerPanel({ adminPassword, onAdsUpdated }: AdManagerPanelProps) {
  const [password, setPassword] = useState(
    () => adminPassword || localStorage.getItem('any1_admin_password') || ''
  );
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [ads, setAds] = useState<AdItem[]>([]);
  const [loadingAds, setLoadingAds] = useState(false);

  // Editor form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<'video' | 'image' | 'text'>('video');
  const [badge, setBadge] = useState('추천 홍보');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tickerText, setTickerText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('자세히 보기');
  const [accentColor, setAccentColor] = useState<AdItem['accentColor']>('lime');
  const [aspectMode, setAspectMode] = useState<NonNullable<AdItem['aspectMode']>>('blur16x9');
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notifyParent = (allAds: AdItem[]) => {
    if (onAdsUpdated) {
      const activeOnly = allAds
        .filter((item) => item.isActive)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      onAdsUpdated(activeOnly);
    }
  };

  const loadAllAds = async (passToUse: string, silent = false) => {
    if (!passToUse) return false;
    if (!silent) setAuthLoading(true);
    setLoadingAds(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/ads/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passToUse })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        localStorage.setItem('any1_admin_password', passToUse);
        setAds(data.ads || []);
        notifyParent(data.ads || []);
        return true;
      } else {
        setIsUnlocked(false);
        if (!silent) {
          setAuthError(data.error || '비밀번호가 일치하지 않습니다.');
        }
        return false;
      }
    } catch {
      if (!silent) {
        setAuthError('서버와 통신하지 못했습니다.');
      }
      return false;
    } finally {
      setAuthLoading(false);
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    const initialPass = adminPassword || localStorage.getItem('any1_admin_password') || '';
    if (initialPass) {
      setPassword(initialPass);
      void loadAllAds(initialPass, true);
    }
  }, [adminPassword]);

  const resetForm = () => {
    setEditingId(null);
    setMediaMode('video');
    setBadge('추천 홍보');
    setTitle('');
    setDescription('');
    setTickerText('');
    setMediaUrl('');
    setLinkUrl('');
    setLinkLabel('자세히 보기');
    setAccentColor('lime');
    setAspectMode('blur16x9');
    setIsActive(true);
  };

  const handleEditClick = (item: AdItem) => {
    setEditingId(item.id);
    if (item.mediaType === 'image') setMediaMode('image');
    else if (item.mediaType === 'text') setMediaMode('text');
    else setMediaMode('video');
    setBadge(item.badge || '추천 홍보');
    setTitle(item.title || '');
    setDescription(item.description || '');
    setTickerText(item.tickerText || '');
    setMediaUrl(item.mediaUrl || '');
    setLinkUrl(item.linkUrl || '');
    setLinkLabel(item.linkLabel || '자세히 보기');
    setAccentColor(item.accentColor || 'lime');
    setAspectMode(item.aspectMode || 'blur16x9');
    setIsActive(item.isActive);
    setFeedback(null);
  };

  const parseJsonSafe = async (res: Response) => {
    const raw = await res.text();
    try {
      return JSON.parse(raw);
    } catch {
      return { error: `서버 응답 오류 (코드 ${res.status})` };
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        text: '파일 크기가 150MB를 넘습니다. 150MB 이하 영상을 올려주시거나 유튜브 링크를 입력해 주세요.'
      });
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setUploadStatusText('파일 전송 준비 중...');
    setFeedback(null);

    try {
      const CHUNK_SIZE = 1.5 * 1024 * 1024; // 1.5MB safe chunk size for Cloud Run & Render proxies
      const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
      const uploadId = `u_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const slice = file.slice(start, end);

        const pct = Math.min(95, Math.round(((chunkIndex + 1) / totalChunks) * 90));
        setUploadPercent(pct);
        setUploadStatusText(
          `동영상 업로드 중... ${pct}% (${(end / (1024 * 1024)).toFixed(1)}MB / ${(file.size / (1024 * 1024)).toFixed(1)}MB)`
        );

        const chunkRes = await fetch('/api/admin/ads/upload-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-admin-password': password,
            'x-upload-id': uploadId,
            'x-chunk-index': String(chunkIndex)
          },
          body: slice
        });
        const chunkData = await parseJsonSafe(chunkRes);
        if (!chunkRes.ok || !chunkData.success) {
          throw new Error(chunkData.error || `업로드 실패 (${chunkRes.status})`);
        }
      }

      const fitMode =
        aspectMode === 'original' ? 'original' : aspectMode === 'crop16x9' ? 'crop' : 'blur';

      setUploadPercent(96);
      setUploadStatusText(
        fitMode === 'original'
          ? '파일 마무리 중...'
          : '9:16 세로 영상도 16:9 가로 광고판 규격으로 자동 변형 중... (잠시만 기다려 주세요)'
      );

      const completeRes = await fetch('/api/admin/ads/upload-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          uploadId,
          fileName: file.name || 'ad_video.mp4',
          fileType: file.type || '',
          totalChunks,
          fitMode
        })
      });
      const data = await parseJsonSafe(completeRes);
      if (completeRes.ok && data.success) {
        setUploadPercent(100);
        setMediaUrl(data.url);
        setMediaMode(data.mediaType === 'image' ? 'image' : 'video');
        if (data.aspectMode) setAspectMode(data.aspectMode);
        setFeedback({
          type: 'success',
          text: data.converted16x9
            ? `"${file.name}" 업로드 및 16:9 자동 변형이 완료되었습니다! 아래 [광고판에 등록하기] 버튼을 눌러 게시하세요.`
            : `"${file.name}" 업로드가 완료되었습니다! 아래 [광고판에 등록하기] 버튼을 눌러 게시하세요.`
        });
      } else {
        throw new Error(data.error || '파일 처리에 실패했습니다.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || '파일 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.'
      });
    } finally {
      setUploading(false);
      setUploadStatusText('');
      setUploadPercent(0);
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMedia = mediaMode === 'text' ? '' : mediaUrl.trim();
    if (!title.trim() && !description.trim() && !trimmedMedia) {
      setFeedback({
        type: 'error',
        text: '광고 문구나 동영상(이미지) 중 최소 한 가지 이상을 입력해 주세요.'
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const computedMediaType: AdItem['mediaType'] =
        mediaMode === 'text' || !trimmedMedia
          ? 'text'
          : extractYoutubeIdClient(trimmedMedia)
            ? 'youtube'
            : mediaMode === 'image'
              ? 'image'
              : 'video';

      const payload = {
        badge: badge.trim() || '추천 홍보',
        title: title.trim(),
        description: description.trim(),
        tickerText: tickerText.trim(),
        mediaType: computedMediaType,
        mediaUrl: trimmedMedia,
        linkUrl: linkUrl.trim(),
        linkLabel: linkLabel.trim() || '자세히 보기',
        accentColor,
        aspectMode,
        isActive
      };

      const url = editingId
        ? `/api/admin/ads/${encodeURIComponent(editingId)}`
        : '/api/admin/ads';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ad: payload })
      });
      const data = await parseJsonSafe(res);

      if (res.ok && data.success) {
        setAds(data.ads || []);
        notifyParent(data.ads || []);
        setFeedback({
          type: 'success',
          text: editingId
            ? '광고 내용이 수정되어 광고판에 즉시 반영되었습니다!'
            : '새 광고가 등록되어 광고판에 바로 게시되었습니다!'
        });
        resetForm();
      } else {
        setFeedback({
          type: 'error',
          text: data.error || '저장에 실패했습니다.'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: '저장 중 서버 통신 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdItem) => {
    try {
      const res = await fetch(`/api/admin/ads/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          ad: { isActive: !item.isActive }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.ads || []);
        notifyParent(data.ads || []);
      }
    } catch {
      // Ignore silent failure
    }
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= ads.length) return;
    const nextList = [...ads];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIdx, 0, moved);
    const orderedIds = nextList.map((a) => a.id);

    setAds(nextList);
    try {
      const res = await fetch('/api/admin/ads/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, orderedIds })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.ads || nextList);
        notifyParent(data.ads || nextList);
      }
    } catch {
      // Keep optimistic order or refresh on next load
    }
  };

  const handleDeleteAd = async (item: AdItem) => {
    try {
      const res = await fetch(`/api/admin/ads/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAds(data.ads || []);
        notifyParent(data.ads || []);
        if (editingId === item.id) resetForm();
        setFeedback({ type: 'success', text: '광고가 삭제되었습니다.' });
      }
    } catch {
      setFeedback({ type: 'error', text: '삭제 요청 중 오류가 발생했습니다.' });
    }
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="bg-[#0d0f12] border border-border-dark p-6 rounded-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-neon/10 border border-neon/40 flex items-center justify-center text-neon shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">광고판 관리자 잠금 해제</h3>
              <p className="text-xs text-text-light/60 mt-0.5">
                아무나 광고를 바꾸지 못하도록 관리자 비밀번호 확인 후 바로 수정할 수 있습니다.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void loadAllAds(password, false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-text-light/80 mb-1.5">
                관리자 비밀번호
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-sm text-white rounded-lg outline-none focus:border-neon font-mono"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>확인 중...</span>
                </>
              ) : (
                <>
                  <Unlock size={14} />
                  <span>잠금 풀고 광고 올리기</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const previewYoutubeId = mediaUrl ? extractYoutubeIdClient(mediaUrl) : null;

  return (
    <div className="space-y-8 font-sans">
      {/* Add / Edit Ad Form */}
      <form
        onSubmit={handleSaveAd}
        className="bg-[#0d0f12] border border-border-dark p-5 sm:p-6 rounded-xl space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-dark pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/35 flex items-center justify-center text-neon shrink-0">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {editingId ? '광고 내용 수정하기' : '새 광고 문구 · 동영상 올리기'}
              </h3>
              <p className="text-xs text-text-light/60 mt-0.5">
                원하는 홍보 문구와 동영상 파일(또는 유튜브 링크)을 넣으면 메인 광고판에 바로 표시됩니다.
              </p>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs font-bold text-text-light/75 hover:text-white border border-border-dark rounded-lg cursor-pointer whitespace-nowrap"
            >
              새 광고 작성으로 전환
            </button>
          )}
        </div>

        {/* Step 1: Media Type Switcher */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-light/80">
            1. 광고 형태 선택
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setMediaMode('video')}
              className={`px-4 py-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mediaMode === 'video'
                  ? 'bg-neon text-bg-dark border-neon'
                  : 'bg-black/40 text-text-light/70 border-border-dark hover:border-neon/50 hover:text-white'
              }`}
            >
              <Video size={15} />
              <span>동영상 · 유튜브 넣기</span>
            </button>

            <button
              type="button"
              onClick={() => setMediaMode('image')}
              className={`px-4 py-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mediaMode === 'image'
                  ? 'bg-neon text-bg-dark border-neon'
                  : 'bg-black/40 text-text-light/70 border-border-dark hover:border-neon/50 hover:text-white'
              }`}
            >
              <ImageIcon size={15} />
              <span>이미지 배너 넣기</span>
            </button>

            <button
              type="button"
              onClick={() => setMediaMode('text')}
              className={`px-4 py-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                mediaMode === 'text'
                  ? 'bg-neon text-bg-dark border-neon'
                  : 'bg-black/40 text-text-light/70 border-border-dark hover:border-neon/50 hover:text-white'
              }`}
            >
              <Type size={15} />
              <span>문구 전용 전광판</span>
            </button>
          </div>
        </div>

        {/* Step 2: Upload / URL Input (when video or image selected) */}
        {mediaMode !== 'text' && (
          <div className="p-4 rounded-xl bg-black/40 border border-border-dark space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-white">
                  {mediaMode === 'video'
                    ? '2. 동영상 파일 올리기 또는 영상 링크 입력'
                    : '2. 배너 이미지 올리기 또는 이미지 링크 입력'}
                </h4>
                <p className="text-[11px] text-text-light/55 mt-0.5">
                  {mediaMode === 'video'
                    ? '폰/PC의 영상(최대 150MB, 9:16 세로 영상 포함)을 올리거나 유튜브 주소를 붙여넣으세요.'
                    : 'JPG·PNG·WEBP 이미지를 직접 올리거나 이미지 주소를 입력해 주세요.'}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={mediaMode === 'video' ? 'video/*,.mp4,.mov,.webm,.mkv,.3gp,.m4v,.avi' : 'image/*'}
                className="hidden"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) void handleFileSelected(chosen);
                  e.target.value = '';
                }}
              />

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white/10 hover:bg-neon hover:text-bg-dark text-white border border-neon/40 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{uploadPercent > 0 ? `${uploadPercent}% 처리 중` : '업로드 중...'}</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>
                      {mediaMode === 'video'
                        ? '내 폰/PC에서 동영상 선택'
                        : '내 폰/PC에서 사진 선택'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {mediaMode === 'video' && (
              <div className="p-3 rounded-lg bg-bg-dark/80 border border-border-dark space-y-2">
                <div className="text-[11px] font-bold text-text-light/80">
                  세로(9:16) 영상 → 16:9 가로 광고판 자동 변형 방식
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAspectMode('blur16x9')}
                    className={`px-3 py-2 rounded-lg border font-bold text-left cursor-pointer transition-colors ${
                      aspectMode === 'blur16x9'
                        ? 'border-neon bg-neon/15 text-neon'
                        : 'border-border-dark bg-black/40 text-text-light/65 hover:text-white'
                    }`}
                  >
                    <div>16:9 블러 배경 (추천)</div>
                    <div className="text-[10px] font-normal opacity-75 mt-0.5">
                      9:16 영상 안 잘리고 양옆 채움
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectMode('crop16x9')}
                    className={`px-3 py-2 rounded-lg border font-bold text-left cursor-pointer transition-colors ${
                      aspectMode === 'crop16x9'
                        ? 'border-neon bg-neon/15 text-neon'
                        : 'border-border-dark bg-black/40 text-text-light/65 hover:text-white'
                    }`}
                  >
                    <div>16:9 화면 꽉 채우기</div>
                    <div className="text-[10px] font-normal opacity-75 mt-0.5">
                      가운데 기준으로 16:9 크롭
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectMode('original')}
                    className={`px-3 py-2 rounded-lg border font-bold text-left cursor-pointer transition-colors ${
                      aspectMode === 'original'
                        ? 'border-neon bg-neon/15 text-neon'
                        : 'border-border-dark bg-black/40 text-text-light/65 hover:text-white'
                    }`}
                  >
                    <div>원본 비율 그대로</div>
                    <div className="text-[10px] font-normal opacity-75 mt-0.5">
                      올린 영상 크기 그대로 유지
                    </div>
                  </button>
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-neon">
                  <span>{uploadStatusText || '업로드 중...'}</span>
                  <span className="font-mono tabular-nums">{uploadPercent}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon transition-all duration-200"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-light/70 flex items-center gap-1.5">
                <Link2 size={12} className="text-neon" />
                <span>
                  {mediaMode === 'video'
                    ? '또는 유튜브 / MP4 동영상 주소 직접 입력'
                    : '또는 이미지 주소 직접 입력'}
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={
                    mediaMode === 'video'
                      ? '예: https://www.youtube.com/watch?v=... 또는 /uploads/ads/...'
                      : '예: https://... 또는 파일 선택 버튼으로 업로드'
                  }
                  className="flex-1 bg-bg-dark border border-border-dark px-3.5 py-2 text-xs text-white rounded-lg outline-none focus:border-neon font-mono"
                />
                {mediaUrl && (
                  <button
                    type="button"
                    onClick={() => setMediaUrl('')}
                    className="px-3 py-2 text-xs font-bold text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 cursor-pointer whitespace-nowrap"
                  >
                    비우기
                  </button>
                )}
              </div>
              {mediaUrl.startsWith('/uploads/ads/') && (
                <p className="text-[11px] text-amber-300/80">
                  * 무료 서버(Render Free)는 서버가 재시작되면 직접 올린 파일이 지워질 수 있습니다. 오래 유지할 영상은 유튜브 링크를 함께 활용하시면 안전합니다.
                </p>
              )}
            </div>

            {/* Live Media Preview */}
            {mediaUrl && (
              <div
                className={`rounded-lg overflow-hidden border border-border-dark bg-black flex items-center justify-center relative ${
                  aspectMode !== 'original' ? 'aspect-video w-full max-w-lg mx-auto' : 'max-h-64'
                }`}
              >
                {previewYoutubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${previewYoutubeId}?rel=0&playsinline=1`}
                    title="광고 영상 미리보기"
                    className="w-full h-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : mediaMode === 'image' ? (
                  <>
                    {aspectMode === 'blur16x9' && (
                      <img
                        src={mediaUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60 pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <img
                      src={mediaUrl}
                      alt="광고 이미지 미리보기"
                      className={`relative z-10 w-full h-full ${
                        aspectMode === 'crop16x9' ? 'object-cover' : 'object-contain'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  </>
                ) : (
                  <>
                    {aspectMode === 'blur16x9' && (
                      <video
                        src={mediaUrl}
                        autoPlay
                        loop
                        playsInline
                        muted
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60 pointer-events-none"
                      />
                    )}
                    <video
                      src={mediaUrl}
                      controls
                      playsInline
                      muted
                      className={`relative z-10 w-full h-full ${
                        aspectMode === 'crop16x9' ? 'object-cover bg-black' : 'object-contain'
                      }`}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Ad Text & Link Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-text-light/80 mb-1.5">
              상단 라벨 (짧은 구분)
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="예: 추천 홍보, 공지, 특별 이벤트"
              className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-white rounded-lg outline-none focus:border-neon"
            />
          </div>

          <div>
            <label className="block font-bold text-text-light/80 mb-1.5">
              강조 테두리 색상
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccentColor(opt.id)}
                  className={`py-2 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    accentColor === opt.id
                      ? 'border-white bg-white/10 text-white'
                      : 'border-border-dark bg-black/40 text-text-light/60 hover:text-white'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.swatchClass}`} />
                  <span className="truncate">{opt.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-text-light/80 mb-1.5">
              광고 제목 문구 (선택 — 영상만 올려도 등록 가능)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 사장님 매장·상품 홍보 영상, 이곳에 바로 올려보세요!"
              className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-sm text-white rounded-lg outline-none focus:border-neon font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-text-light/80 mb-1.5">
              광고 상세 문구
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="방문자에게 보여주고 싶은 안내 문구, 전화번호, 이벤트 내용을 자유롭게 적어주세요."
              className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-xs text-white rounded-lg outline-none focus:border-neon leading-relaxed"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-text-light/80 mb-1.5">
              하단 한 줄 전광판 문구 (선택)
            </label>
            <input
              type="text"
              value={tickerText}
              onChange={(e) => setTickerText(e.target.value)}
              placeholder="예: 오늘만 특별 할인 진행 중 · 문의 010-0000-0000"
              className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-xs text-white rounded-lg outline-none focus:border-neon"
            />
          </div>

          <div>
            <label className="block font-bold text-text-light/80 mb-1.5">
              클릭 시 이동할 주소 URL (선택)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="예: https://youtube.com/... 또는 홈페이지 주소"
              className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-xs text-white rounded-lg outline-none focus:border-neon font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-text-light/80 mb-1.5">
              이동 버튼 문구 (선택)
            </label>
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="예: 자세히 보기, 상담 신청하기"
              className="w-full bg-black/50 border border-border-dark px-3.5 py-2.5 text-xs text-white rounded-lg outline-none focus:border-neon"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border-dark">
          <label className="flex items-center gap-2 text-xs font-bold text-text-light/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-neon"
            />
            <span>저장 즉시 메인 광고판에 공개하기</span>
          </label>

          <button
            type="submit"
            disabled={saving || uploading}
            className="px-6 py-3 bg-neon hover:bg-white text-bg-dark text-xs font-black rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>저장 중...</span>
              </>
            ) : (
              <>
                {editingId ? <Check size={14} /> : <Plus size={14} />}
                <span>{editingId ? '수정한 광고 저장하기' : '광고판에 등록하기'}</span>
              </>
            )}
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
                : 'bg-red-500/15 border-red-500/35 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check size={14} className="shrink-0" />
            ) : (
              <AlertCircle size={14} className="shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </form>

      {/* Registered Ads List */}
      <div className="bg-[#0d0f12] border border-border-dark p-5 sm:p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-border-dark pb-3">
          <h4 className="text-sm font-black text-white">
            등록된 광고 목록 ({ads.length}개)
          </h4>
          <button
            type="button"
            onClick={() => void loadAllAds(password, true)}
            className="px-3 py-1.5 text-xs font-bold text-text-light/70 hover:text-neon border border-border-dark rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={loadingAds ? 'animate-spin' : ''} />
            <span>새로고침</span>
          </button>
        </div>

        {ads.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-light/50">
            아직 등록한 광고가 없습니다. 위 입력창에서 광고 문구와 영상을 추가해 보세요!
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.isActive
                    ? 'bg-black/40 border-border-dark'
                    : 'bg-black/20 border-border-dark/60 opacity-65'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-light/60">
                    <span className="font-bold text-neon">{item.badge}</span>
                    <span>·</span>
                    <span>
                      {item.mediaType === 'video'
                        ? '동영상 파일/MP4'
                        : item.mediaType === 'youtube'
                          ? '유튜브 영상'
                          : item.mediaType === 'image'
                            ? '이미지 배너'
                            : '문구 전용'}
                    </span>
                    <span>·</span>
                    <span className={item.isActive ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                      {item.isActive ? '노출 중' : '숨김 상태'}
                    </span>
                  </div>
                  <div className="text-sm font-black text-white truncate">
                    {item.title || '(제목 없음)'}
                  </div>
                  {item.description && (
                    <p className="text-xs text-text-light/65 line-clamp-2">{item.description}</p>
                  )}
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:underline font-mono truncate max-w-full"
                    >
                      <ExternalLink size={11} />
                      <span className="truncate">{item.linkUrl}</span>
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => void handleMoveOrder(idx, -1)}
                    className="p-2 border border-border-dark rounded-lg text-text-light/70 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="위로 올리기"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === ads.length - 1}
                    onClick={() => void handleMoveOrder(idx, 1)}
                    className="p-2 border border-border-dark rounded-lg text-text-light/70 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="아래로 내리기"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(item)}
                    className="px-3 py-2 border border-border-dark rounded-lg text-xs font-bold text-text-light/80 hover:text-neon flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {item.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{item.isActive ? '숨기기' : '노출하기'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditClick(item)}
                    className="px-3 py-2 border border-neon/40 bg-neon/10 hover:bg-neon hover:text-bg-dark rounded-lg text-xs font-bold text-neon flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>수정</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAd(item)}
                    className="px-3 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 rounded-lg text-xs font-bold text-red-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
