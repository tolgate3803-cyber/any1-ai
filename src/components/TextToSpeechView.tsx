import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
  Copy,
  Trash2,
  Sliders,
  Check,
  FileText,
  Bookmark,
  Radio,
  Music,
  Headphones,
  Globe,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface VoicePreset {
  id: string;
  name: string;
  role: string;
  category: 'korean' | 'global' | 'creative';
  lang: string;
  pitch: number;
  rate: number;
  gender: 'female' | 'male';
  description: string;
  badge: string;
  edgeVoice: string;
}

const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'ko-news-female',
    name: '민서 (Minseo)',
    role: '정통 여성 아나운서',
    category: 'korean',
    lang: 'ko-KR',
    pitch: 1.0,
    rate: 1.0,
    gender: 'female',
    description: '명료하고 정확한 표준 한국어 발음, 뉴스 및 공식 브리핑 최적화',
    badge: 'FEMALE 앵커',
    edgeVoice: 'ko-KR-SunHiNeural'
  },
  {
    id: 'ko-news-male',
    name: '도현 (Dohyun)',
    role: '정통 남성 앵커',
    category: 'korean',
    lang: 'ko-KR',
    pitch: 1.0,
    rate: 0.98,
    gender: 'male',
    description: '중후하고 묵직한 실제 남성 보이스, 신뢰감 높은 프레젠테이션 최적화',
    badge: 'MALE 앵커',
    edgeVoice: 'ko-KR-InJoonNeural'
  },
  {
    id: 'ko-narrator-female',
    name: '지아 (Jia)',
    role: '감성 오디오북 낭독가',
    category: 'korean',
    lang: 'ko-KR',
    pitch: 0.95,
    rate: 0.9,
    gender: 'female',
    description: '따뜻하고 포근한 숨결이 전해지는 문학, 시, 에세이 감성 낭독 톤',
    badge: 'FEMALE 감성',
    edgeVoice: 'ko-KR-SunHiNeural'
  },
  {
    id: 'ko-docu-male',
    name: '진우 (Jinwoo)',
    role: '다큐멘터리 해설가',
    category: 'korean',
    lang: 'ko-KR',
    pitch: 0.9,
    rate: 0.92,
    gender: 'male',
    description: '깊은 울림과 설득력을 지닌 역사, 자연, 인문 다큐멘터리 남성 나레이션',
    badge: 'MALE 해설',
    edgeVoice: 'ko-KR-InJoonNeural'
  },
  {
    id: 'ko-creator',
    name: '하율 (Hayul)',
    role: '트렌디 유튜브 크리에이터',
    category: 'korean',
    lang: 'ko-KR',
    pitch: 1.08,
    rate: 1.1,
    gender: 'female',
    description: '밝고 통통 튀는 활기찬 에너지, 유튜브 쇼츠 및 릴스 광고 텐션',
    badge: 'FEMALE 쇼츠',
    edgeVoice: 'ko-KR-SunHiNeural'
  },
  {
    id: 'ko-fairytale',
    name: '은우 (Eunwoo)',
    role: '상냥한 동화 구연 선생님',
    category: 'korean',
    lang: 'ko-KR',
    pitch: 1.12,
    rate: 0.92,
    gender: 'female',
    description: '아이들에게 책을 읽어주듯 다정하고 친근한 스토리텔링 보이스',
    badge: 'FEMALE 동화',
    edgeVoice: 'ko-KR-SunHiNeural'
  },
  {
    id: 'en-us-female',
    name: 'Claire (클레어)',
    role: 'Global US Female',
    category: 'global',
    lang: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    gender: 'female',
    description: 'Natural, smooth American English narration for business & education',
    badge: 'US FEMALE',
    edgeVoice: 'en-US-JennyNeural'
  },
  {
    id: 'en-us-male',
    name: 'James (제임스)',
    role: 'Global US Male',
    category: 'global',
    lang: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    gender: 'male',
    description: 'Authoritative, clear American English presenter voice',
    badge: 'US MALE',
    edgeVoice: 'en-US-GuyNeural'
  },
  {
    id: 'ja-female',
    name: 'Sakura (사쿠라)',
    role: 'Japanese Narration',
    category: 'global',
    lang: 'ja-JP',
    pitch: 1.0,
    rate: 1.0,
    gender: 'female',
    description: '丁寧で自然な日本語のナレーション、クリアな発音',
    badge: 'JA FEMALE',
    edgeVoice: 'ja-JP-NanamiNeural'
  }
];

const SAMPLE_SCRIPTS = [
  {
    label: '📰 정밀 뉴스 브리핑',
    text: '오늘 전국에 대체로 맑고 쾌청한 가을 날씨가 이어지겠습니다. 낮 최고 기온은 서울 21도, 대전 22도로 평년과 비슷하여 야외 활동을 하기에 아주 좋겠습니다. 다만 낮과 밤의 기온 차가 10도 이상 벌어지겠으니 환절기 건강 관리에 유의하시기 바랍니다.'
  },
  {
    label: '📖 감성 오디오북',
    text: '어린 왕자는 사막을 조용히 건너며 장미꽃을 떠올렸습니다. "내 비밀은 이거야. 아주 간단한 건데, 오직 마음으로 보아야만 분명하게 볼 수 있어. 가장 중요한 것은 눈에 보이지 않거든."'
  },
  {
    label: '🚀 첨단 AI 플랫폼 광고',
    text: '단 하나의 플랫폼으로 경험하는 무한한 인공지능의 세계! ANY1 올인원 AI 허브가 여러분의 일상과 창작을 한 차원 높여드립니다. 지금 바로 차세대 스마트 어시스턴트의 모든 기능을 무료로 경험해보세요.'
  },
  {
    label: '💼 비즈니스 투자 피칭',
    text: '안녕하십니까. 당사가 선보이는 차세대 AI 텍스트 음성 변환 엔진은 인간의 미세한 감정선과 억양을 완벽하게 학습하여 기존 기계음의 한계를 뛰어넘었습니다. 글로벌 시장을 향한 도약에 함께해 주십시오.'
  },
  {
    label: '🌟 동화 구연',
    text: '옛날 옛적 푸른 숲속 깊은 곳에 밤하늘의 별빛을 모으는 작은 요정이 살고 있었어요. 숲속 동물 친구들은 밤이 오면 요정이 밝혀주는 은은한 등불 아래 모여 따뜻한 이야기를 나누었답니다.'
  },
  {
    label: '🌎 Global English',
    text: 'Welcome to the ANY1 AI Audio Synthesis Studio. You can convert any text into hyper-realistic, natural voiceovers in seconds. Experience professional voice design right inside your browser.'
  }
];

interface SavedClip {
  id: string;
  title: string;
  text: string;
  presetName: string;
  gender: string;
  audioBase64: string;
  mimeType: string;
  createdAt: string;
  durationSeconds: number;
}

export default function TextToSpeechView() {
  const [text, setText] = useState(
    '안녕하세요! 인공지능 ANY1 음성 합성 스튜디오에 오신 것을 환영합니다. 남성 앵커, 여성 아나운서, 오디오북 등 원하시는 성우를 선택하시고 생생한 자연 음성을 직접 들어보세요.'
  );

  // Active Voice Selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ko-news-female');

  // Fine-tuning parameters
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Playback & Audio state
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [currentAudioMime, setCurrentAudioMime] = useState<string>('audio/mp3');
  const [activeVoiceLabel, setActiveVoiceLabel] = useState<string>('민서 (여성 아나운서)');

  // Equalizer visualizer
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(32).fill(8));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerIntervalRef = useRef<number | null>(null);

  // Library of saved clips
  const [savedClips, setSavedClips] = useState<SavedClip[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'studio' | 'library'>('studio');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load saved clips on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('any1_tts_saved_clips');
      if (stored) {
        setSavedClips(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load saved clips:', e);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current);
      }
    };
  }, []);

  // Preset Selection
  const handleSelectPreset = (preset: VoicePreset) => {
    setSelectedPresetId(preset.id);
    setRate(preset.rate);
    setPitch(preset.pitch);
    setActiveVoiceLabel(`${preset.name} (${preset.gender === 'male' ? '남성' : '여성'})`);
    
    // Stop and fully clear current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      stopVisualizer();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isBrowserSpeechActiveRef.current = false;
    }
    setCurrentAudioBase64(null);
    setCurrentTime(0);

    showToast(`성우 [${preset.name}] (${preset.gender === 'male' ? '남성' : '여성'} 보이스) 선택 완료`, 'success');
  };

  // Visualizer runner
  const startVisualizer = () => {
    if (visualizerIntervalRef.current) clearInterval(visualizerIntervalRef.current);
    visualizerIntervalRef.current = window.setInterval(() => {
      setVisualizerBars(
        new Array(32).fill(0).map(() => Math.floor(Math.random() * 65) + 10)
      );
    }, 80);
  };

  const stopVisualizer = () => {
    if (visualizerIntervalRef.current) {
      clearInterval(visualizerIntervalRef.current);
      visualizerIntervalRef.current = null;
    }
    setVisualizerBars(new Array(32).fill(8));
  };

  const isBrowserSpeechActiveRef = useRef<boolean>(false);

  // Safe Browser Speech Engine Fallback (Guaranteed 100% playback even in zero-network scenarios)
  const playBrowserFallback = (textToRead: string, preset: VoicePreset) => {
    if (!('speechSynthesis' in window)) {
      showToast('브라우저 음성 재생을 지원하지 않는 환경입니다.', 'error');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = preset.lang || 'ko-KR';

      let charPitch = 1.0;
      let charRate = 1.0;

      if (preset.gender === 'male' || preset.id.includes('male')) {
        charPitch = 0.65; // Distinct deep masculine pitch
        charRate = preset.id === 'ko-docu-male' ? 0.88 : 0.98;
      } else if (preset.id === 'ko-creator') {
        charPitch = 1.25;
        charRate = 1.12;
      } else if (preset.id === 'ko-fairytale') {
        charPitch = 1.15;
        charRate = 0.93;
      } else if (preset.id === 'ko-narrator-female') {
        charPitch = 0.94;
        charRate = 0.90;
      } else {
        charPitch = 1.04;
        charRate = 1.0;
      }

      utterance.pitch = Math.min(Math.max(charPitch * pitch, 0.5), 1.8);
      utterance.rate = Math.min(Math.max(charRate * rate, 0.5), 1.8);
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langVoices = voices.filter(v => v.lang.startsWith(preset.lang.slice(0, 2)));
        if (langVoices.length > 0) {
          const match = langVoices.find(v => 
            preset.gender === 'male' 
              ? (v.name.toLowerCase().includes('male') || v.name.includes('남') || v.name.includes('Korean Male') || v.name.includes('InJoon') || v.name.includes('David'))
              : (v.name.toLowerCase().includes('female') || v.name.includes('여') || v.name.includes('Korean Female') || v.name.includes('SunHi') || v.name.includes('Heami'))
          ) || langVoices[0];
          utterance.voice = match;
        }
      }

      utterance.onstart = () => {
        isBrowserSpeechActiveRef.current = true;
        setIsPlaying(true);
        setIsPaused(false);
        startVisualizer();
      };

      utterance.onend = () => {
        isBrowserSpeechActiveRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
        stopVisualizer();
      };

      utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        isBrowserSpeechActiveRef.current = false;
        setIsPlaying(false);
        setIsPaused(false);
        stopVisualizer();
      };

      window.speechSynthesis.speak(utterance);
      showToast(`로컬 음성 엔진으로 [${preset.name}] 실시간 낭독을 시작합니다.`, 'info');
    } catch (e: any) {
      console.error('SpeechSynthesis fallback error:', e);
      showToast('음성 재생을 시작할 수 없습니다.', 'error');
    }
  };

  // Generate Real Neural Audio via Server Endpoint
  const generateAndPlayAudio = async () => {
    if (!text.trim()) {
      showToast('낭독할 텍스트를 입력해주세요.', 'error');
      return;
    }

    // If browser speech is currently paused, resume it
    if (isBrowserSpeechActiveRef.current && isPaused && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      startVisualizer();
      return;
    }

    // If audio is already loaded and paused, resume playback
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      setIsPlaying(true);
      startVisualizer();
      return;
    }

    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isBrowserSpeechActiveRef.current = false;
    }

    setIsLoadingAudio(true);
    const activePreset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];
    showToast(`고음질 AI ${activePreset.gender === 'male' ? '남성' : '여성'} 성우 음성을 실시간 합성하는 중입니다...`, 'info');

    try {
      const customKey = localStorage.getItem('any1_custom_gemini_api_key') || '';
      
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.trim(),
          presetId: activePreset.id,
          rate,
          pitch,
          volume,
          customApiKey: customKey
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `서버 에러 (${res.status})`);
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error('음성 데이터 수신에 실패했습니다.');
      }

      const mimeType = data.mimeType || 'audio/mp3';
      const audioDataUri = `data:${mimeType};base64,${data.audioBase64}`;
      setCurrentAudioBase64(data.audioBase64);
      setCurrentAudioMime(mimeType);

      // Initialize HTML5 Audio with real neural sound
      const audio = new Audio(audioDataUri);
      audio.volume = volume;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime || 0);
      };

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        startVisualizer();
      };

      audio.onpause = () => {
        setIsPaused(true);
        stopVisualizer();
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTime(0);
        stopVisualizer();
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsPaused(false);
        stopVisualizer();
        // Fallback directly to browser voice on audio playback error
        playBrowserFallback(text.trim(), activePreset);
      };

      await audio.play();

      // Auto save to library
      const newClip: SavedClip = {
        id: String(Date.now()),
        title: text.substring(0, 28) + (text.length > 28 ? '...' : ''),
        text: text.trim(),
        presetName: activePreset.name,
        gender: activePreset.gender === 'male' ? '남성' : '여성',
        audioBase64: data.audioBase64,
        mimeType,
        createdAt: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        durationSeconds: Math.round(audio.duration || text.length * 0.18)
      };

      setSavedClips((prev) => {
        const updated = [newClip, ...prev.slice(0, 19)];
        localStorage.setItem('any1_tts_saved_clips', JSON.stringify(updated));
        return updated;
      });

      showToast(`성우 [${activePreset.name}] (${activePreset.gender === 'male' ? '남성' : '여성'} 보이스) 실시간 낭독 중!`, 'success');
    } catch (err: any) {
      console.warn('TTS Generation server notice:', err.message);
      // Seamless graceful fallback: play via browser speech synthesis immediately
      playBrowserFallback(text.trim(), activePreset);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Pause playback
  const handlePause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
      stopVisualizer();
    } else if (isBrowserSpeechActiveRef.current && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      stopVisualizer();
    }
  };

  // Stop playback
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isBrowserSpeechActiveRef.current = false;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    stopVisualizer();
  };

  // Download audio file
  const handleDownloadAudio = async () => {
    if (!text.trim()) {
      showToast('다운로드할 텍스트를 입력해주세요.', 'error');
      return;
    }

    const activePreset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];

    // If audio is already synthesized, download immediately
    if (currentAudioBase64) {
      downloadBase64Audio(currentAudioBase64, currentAudioMime, activePreset.name);
      return;
    }

    // Otherwise generate now and download
    setIsLoadingAudio(true);
    showToast('고음질 오디오 파일을 생성하여 다운로드하는 중입니다...', 'info');

    try {
      const customKey = localStorage.getItem('any1_custom_gemini_api_key') || '';
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          presetId: activePreset.id,
          rate,
          pitch,
          volume,
          customApiKey: customKey
        })
      });

      if (!res.ok) {
        throw new Error('오디오 생성 실패');
      }

      const data = await res.json();
      if (!data.audioBase64) throw new Error('오디오 데이터가 없습니다.');

      setCurrentAudioBase64(data.audioBase64);
      setCurrentAudioMime(data.mimeType || 'audio/mp3');
      downloadBase64Audio(data.audioBase64, data.mimeType || 'audio/mp3', activePreset.name);
      showToast('오디오 파일 다운로드가 완료되었습니다!', 'success');
    } catch (e: any) {
      showToast('다운로드 중 오류가 발생했습니다: ' + e.message, 'error');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const downloadBase64Audio = (base64: string, mime: string, voiceName: string) => {
    const ext = mime.includes('wav') ? 'wav' : 'mp3';
    const link = document.createElement('a');
    link.href = `data:${mime};base64,${base64}`;
    link.download = `ANY1_TTS_${voiceName}_${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload .txt file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      showToast('.txt 텍스트 파일만 불러올 수 있습니다.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setText(content.trim());
        setCurrentAudioBase64(null);
        showToast(`'${file.name}' 파일을 성공적으로 불러왔습니다.`, 'success');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('텍스트가 클립보드에 복사되었습니다.', 'success');
    } catch {
      showToast('클립보드 복사에 실패했습니다.', 'error');
    }
  };

  // Delete clip from library
  const handleDeleteClip = (id: string) => {
    const updated = savedClips.filter(c => c.id !== id);
    setSavedClips(updated);
    localStorage.setItem('any1_tts_saved_clips', JSON.stringify(updated));
    showToast('저장된 오디오 클립이 삭제되었습니다.', 'info');
  };

  // Play saved clip
  const handlePlaySavedClip = (clip: SavedClip) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`data:${clip.mimeType};base64,${clip.audioBase64}`);
    audioRef.current = audio;
    audio.play();
    setIsPlaying(true);
    setIsPaused(false);
    startVisualizer();
    audio.onended = () => {
      setIsPlaying(false);
      stopVisualizer();
    };
    showToast(`보관함 클립 [${clip.title}] 재생 중...`, 'info');
  };

  const activePreset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];

  return (
    <div className="w-full bg-white/[0.01] border border-border-dark p-6 md:p-8 rounded-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-8 right-8 z-50 px-5 py-3 border font-mono text-xs font-bold uppercase tracking-wider shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-neon/15 border-neon text-neon shadow-[0_0_25px_rgba(207,255,4,0.3)]'
                : toast.type === 'error'
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner */}
      <div className="relative mb-8 p-6 border border-neon/20 bg-neon/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-neon animate-[scan_3s_ease-in-out_infinite]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-neon rounded-full animate-ping" />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-neon">
                High-Fidelity AI Neural Voice Engine
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase italic flex items-center gap-3">
              <Volume2 className="text-neon" size={28} />
              AI 텍스트 <span className="text-neon">음성 변환 스튜디오 (TTS)</span>
            </h2>
            <p className="text-xs text-text-light/60 mt-1 max-w-xl">
              정통 남성 앵커, 여성 아나운서, 감성 오디오북 등 성우별 실제 고음질 목소리로 생생하게 낭독하고 다운로드하세요.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="px-3 py-1.5 bg-black/60 border border-white/10 font-mono text-[10px] font-bold text-text-light/70 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
              ENGINE: <span className="text-neon">NEURAL_SYNTH_ACTIVE (남/여 성우 분리)</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all ${
                  activeTab === 'studio'
                    ? 'bg-neon text-bg-dark font-black'
                    : 'bg-black/40 text-text-light/50 hover:text-white border border-white/10'
                }`}
              >
                음성 스튜디오
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
                  activeTab === 'library'
                    ? 'bg-neon text-bg-dark font-black'
                    : 'bg-black/40 text-text-light/50 hover:text-white border border-white/10'
                }`}
              >
                <Bookmark size={10} />
                보관함 ({savedClips.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'studio' ? (
        <div className="space-y-8">
          {/* Section 1: Distinct Voice Actors (Male & Female) */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-neon flex items-center gap-2">
                <Headphones size={13} />
                // 1. SELECT AI VOICE ACTOR (남성 / 여성 성우 선택)
              </span>
              <span className="text-[10px] font-mono text-text-light/50">
                선택된 성우: <strong className="text-neon">{activePreset.name}</strong> ({activePreset.role} · {activePreset.gender === 'male' ? '남성' : '여성'})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VOICE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                const isMale = preset.gender === 'male';
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-4 border transition-all text-left relative flex flex-col justify-between overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-neon bg-neon/10 text-white shadow-[0_0_20px_rgba(207,255,4,0.12)]'
                        : 'border-white/5 bg-white/[0.01] text-text-light/60 hover:border-white/20 hover:bg-white/[0.03]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 bg-neon text-bg-dark px-2 py-0.5 font-mono text-[8px] font-black tracking-widest uppercase">
                        SELECTED
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 font-black uppercase border ${
                            isMale
                              ? 'bg-blue-500/10 border-blue-400 text-blue-300'
                              : 'bg-rose-500/10 border-rose-400 text-rose-300'
                          }`}
                        >
                          {preset.badge}
                        </span>
                        <span className="text-sm font-black text-white">{preset.name}</span>
                      </div>
                      <div className="text-[11px] font-bold text-neon/90 mb-1">{preset.role}</div>
                      <p className="text-[10px] text-text-light/50 leading-relaxed line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-text-light/40">
                      <span className={isMale ? 'text-blue-300 font-bold' : 'text-rose-300 font-bold'}>
                        {isMale ? '♂ 실제 남성 음성' : '♀ 실제 여성 음성'}
                      </span>
                      <span>{preset.lang}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Text Input Studio */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-neon flex items-center gap-2">
                <FileText size={13} />
                // 2. INPUT TEXT SCRIPT (낭독할 텍스트 입력)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 border border-border-dark bg-black/40 text-[10px] font-black text-text-light/50 hover:text-neon hover:border-neon transition-all cursor-pointer"
                >
                  <Upload size={10} />
                  .TXT 파일 불러오기
                </button>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1 px-2.5 py-1 border border-border-dark bg-black/40 text-[10px] font-black text-text-light/50 hover:text-neon hover:border-neon transition-all cursor-pointer"
                >
                  <Copy size={10} />
                  복사
                </button>
                <button
                  onClick={() => {
                    setText('');
                    setCurrentAudioBase64(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 border border-border-dark bg-black/40 text-[10px] font-black text-text-light/50 hover:text-red-400 hover:border-red-400/40 transition-all cursor-pointer"
                >
                  <Trash2 size={10} />
                  비우기
                </button>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[9px] font-mono text-text-light/30 uppercase self-center mr-1">추천 대본:</span>
              {SAMPLE_SCRIPTS.map((script, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setText(script.text);
                    setCurrentAudioBase64(null);
                    showToast(`[${script.label}] 대본이 입력창에 적용되었습니다.`, 'info');
                  }}
                  className="px-2.5 py-1 bg-white/[0.02] border border-white/5 hover:border-neon/40 text-[10px] font-bold text-text-light/60 hover:text-neon transition-all cursor-pointer"
                >
                  {script.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative border border-border-dark bg-black/50 focus-within:border-neon transition-all">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setCurrentAudioBase64(null);
                }}
                rows={6}
                placeholder="음성으로 변환하여 듣고 싶은 문장을 자유롭게 입력하세요..."
                className="w-full p-4 bg-transparent text-sm md:text-base text-text-light font-sans leading-relaxed outline-none resize-y placeholder:text-text-light/20"
              />
              <div className="p-3 border-t border-white/5 bg-white/[0.01] flex flex-wrap justify-between items-center text-[10px] font-mono text-text-light/40">
                <div className="flex gap-4">
                  <span>글자 수: <strong className="text-white font-mono">{text.length}</strong>자</span>
                  <span>단어 수: <strong className="text-white font-mono">{text.trim() ? text.trim().split(/\s+/).length : 0}</strong>개</span>
                  <span>예상 낭독 시간: <strong className="text-neon font-mono">약 {Math.max(1, Math.round(text.length * 0.18))}초</strong></span>
                </div>
                {isPlaying && (
                  <span className="text-neon animate-pulse font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
                    현재 낭독 재생 중: {activeVoiceLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Fine-Tuning Controls */}
          <div className="p-6 border border-border-dark bg-white/[0.01]">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-neon flex items-center gap-2">
                <Sliders size={13} />
                // 3. VOICE SPEED & PITCH TUNING (속도 및 음조 조절)
              </span>
              <button
                onClick={() => {
                  setRate(1.0);
                  setPitch(1.0);
                  setVolume(1.0);
                  showToast('속도와 음높이가 표준값(1.0x)으로 초기화되었습니다.', 'info');
                }}
                className="flex items-center gap-1 text-[9px] font-mono text-text-light/40 hover:text-neon cursor-pointer"
              >
                <RotateCcw size={10} />
                기본값 복원
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Speed Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-light/60">말하기 속도 (Speed)</span>
                  <span className="text-neon font-bold">{rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-neon cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-text-light/30">
                  <span>차분함 (0.75x)</span>
                  <span>표준 (1.0x)</span>
                  <span>빠름 (1.3x)</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-light/60">음높이 (Pitch)</span>
                  <span className="text-neon font-bold">{pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-neon cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-text-light/30">
                  <span>중저음 (0.8)</span>
                  <span>원음 (1.0)</span>
                  <span>고음 (1.2)</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-light/60">음량 (Volume)</span>
                  <span className="text-neon font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  className="w-full accent-neon cursor-pointer"
                />
                <div className="flex justify-between text-[8px] font-mono text-text-light/30">
                  <span>20%</span>
                  <span>60%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Live Master Control Bar with Equalizer */}
          <div className="p-6 md:p-8 border border-neon/40 bg-black/90 relative overflow-hidden shadow-[0_0_40px_rgba(207,255,4,0.08)]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon to-transparent" />
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Left: Animated Audio Equalizer Visualizer */}
              <div className="flex flex-col items-center lg:items-start gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-neon animate-ping' : 'bg-white/20'}`} />
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-text-light/70">
                    {isLoadingAudio
                      ? 'SYNTHESIZING NEURAL AUDIO...'
                      : isPlaying
                      ? (isPaused ? 'PLAYBACK PAUSED' : 'AI VOICE PLAYING')
                      : 'READY TO PLAY'}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 border ${activePreset.gender === 'male' ? 'border-blue-400/40 text-blue-300' : 'border-rose-400/40 text-rose-300'}`}>
                    {activePreset.name} ({activePreset.gender === 'male' ? '♂ 남성' : '♀ 여성'})
                  </span>
                </div>

                {/* Equalizer bars */}
                <div className="flex items-end gap-1 h-14 px-4 py-2 bg-black/80 border border-white/5 w-full max-w-sm justify-center">
                  {visualizerBars.map((height, i) => (
                    <div
                      key={i}
                      style={{ height: `${height}%` }}
                      className={`w-1.5 transition-all duration-75 rounded-t-xs ${
                        isPlaying && !isPaused
                          ? activePreset.gender === 'male'
                            ? i % 3 === 0 ? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.6)]' : 'bg-cyan-400'
                            : i % 3 === 0 ? 'bg-neon shadow-[0_0_6px_rgba(207,255,4,0.6)]' : 'bg-lime-400'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>

                {/* Progress time */}
                {duration > 0 && (
                  <div className="text-[9px] font-mono text-text-light/40">
                    {Math.floor(currentTime)}초 / {Math.floor(duration)}초
                  </div>
                )}
              </div>

              {/* Center & Right: Playback Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
                {isLoadingAudio ? (
                  <button
                    disabled
                    className="px-8 py-4 bg-neon/50 text-bg-dark font-mono text-xs font-black uppercase tracking-widest flex items-center gap-2.5 cursor-wait"
                  >
                    <Loader2 size={16} className="animate-spin" />
                    <span>음성 합성 중...</span>
                  </button>
                ) : !isPlaying || isPaused ? (
                  <button
                    onClick={generateAndPlayAudio}
                    className="px-8 py-4 bg-neon hover:bg-white text-bg-dark font-mono text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all cursor-pointer shadow-[0_0_25px_rgba(207,255,4,0.4)]"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>{isPaused ? '낭독 이어듣기 (Resume)' : '음성 생성 및 낭독 시작 (Play)'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="px-6 py-4 bg-amber-400 hover:bg-white text-bg-dark font-mono text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Pause size={16} fill="currentColor" />
                    <span>일시정지 (Pause)</span>
                  </button>
                )}

                <button
                  onClick={handleStop}
                  disabled={!isPlaying && !isPaused}
                  className="px-5 py-4 border border-border-dark bg-white/5 hover:border-red-400 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none text-text-light/60 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Square size={14} fill="currentColor" />
                  <span>정지 (Stop)</span>
                </button>

                <button
                  onClick={handleDownloadAudio}
                  disabled={isLoadingAudio || !text.trim()}
                  className="px-6 py-4 border border-neon/50 bg-neon/10 hover:bg-neon hover:text-bg-dark text-neon font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(207,255,4,0.15)] disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Download size={15} />
                  <span>음성 파일 다운로드 (MP3)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Section: Library of Saved Clips */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Bookmark size={15} className="text-neon" />
                생성 및 보관된 고음질 오디오 클립 목록
              </h3>
              <p className="text-[11px] text-text-light/40 mt-0.5">
                스튜디오에서 합성된 음성 클립 내역입니다. 언제든 다시 듣거나 다운로드할 수 있습니다.
              </p>
            </div>
            {savedClips.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('저장된 오디오 클립 목록을 모두 삭제하시겠습니까?')) {
                    setSavedClips([]);
                    localStorage.removeItem('any1_tts_saved_clips');
                    showToast('보관함이 비워졌습니다.', 'info');
                  }
                }}
                className="text-[10px] font-mono text-red-400/80 hover:text-red-400 transition-all cursor-pointer"
              >
                전체 삭제
              </button>
            )}
          </div>

          {savedClips.length === 0 ? (
            <div className="p-12 border border-dashed border-white/10 text-center space-y-3">
              <Headphones size={32} className="mx-auto text-text-light/20" />
              <p className="text-xs text-text-light/40 font-mono">
                아직 보관된 오디오 클립이 없습니다.
              </p>
              <button
                onClick={() => setActiveTab('studio')}
                className="px-4 py-2 border border-neon/30 bg-neon/5 text-neon font-mono text-[10px] font-bold uppercase hover:bg-neon hover:text-bg-dark transition-all cursor-pointer"
              >
                새로운 음성 만들러 가기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedClips.map((clip) => (
                <div
                  key={clip.id}
                  className="p-5 border border-white/5 bg-white/[0.01] hover:border-white/20 transition-all space-y-3 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 border font-mono text-[9px] font-bold uppercase ${
                          clip.gender === '남성'
                            ? 'bg-blue-500/10 border-blue-400 text-blue-300'
                            : 'bg-rose-500/10 border-rose-400 text-rose-300'
                        }`}
                      >
                        {clip.presetName} ({clip.gender})
                      </span>
                      <span className="text-[9px] font-mono text-text-light/30">{clip.createdAt}</span>
                    </div>
                    <p className="text-xs text-text-light/90 leading-relaxed font-sans line-clamp-3">
                      &ldquo;{clip.text}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-text-light/40">
                      길이 약 {clip.durationSeconds}초
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlaySavedClip(clip)}
                        className="px-2.5 py-1 bg-neon/10 hover:bg-neon hover:text-bg-dark border border-neon/30 text-[9px] font-mono font-bold text-neon transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Play size={10} fill="currentColor" />
                        재생
                      </button>
                      <button
                        onClick={() => downloadBase64Audio(clip.audioBase64, clip.mimeType, clip.presetName)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white hover:text-bg-dark border border-white/10 text-[9px] font-mono font-bold text-text-light transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Download size={10} />
                        다운로드
                      </button>
                      <button
                        onClick={() => handleDeleteClip(clip.id)}
                        className="p-1 text-text-light/30 hover:text-red-400 transition-all cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
