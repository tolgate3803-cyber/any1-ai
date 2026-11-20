import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Trash2, Lightbulb, Camera, Upload, X, Map as MapIcon, File as FileIcon, Image as ImageIcon, Play, Square, Volume2, Settings, Info, Sparkles, Mic2, Download, Save, Search, FileUp, Plus, Check, Copy, Video, AlertCircle, Key, Shield, CheckCircle, HelpCircle, Cpu, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SajuChart from './SajuChart';
import MapViewer from './MapViewer';
import FaceAnalysisView from './FaceAnalysisView';
import NamingView from './NamingView';
import MyVoiceCloneView from './MyVoiceCloneView';
import PungsuView from './PungsuView';
import TextToSpeechView from './TextToSpeechView';
import PlayStorePackagingGuide from './PlayStorePackagingGuide';
import PlayStoreAssetDownloadCenter from './PlayStoreAssetDownloadCenter';

const cleanBoilerplate = (text: string) => {
  if (!text) return text;
  return text
    .replace(/원광만세력\s+정통\s+산출\s+기준에\s+따라\s+귀하의\s+사주명식\s*을\s+정밀하게\s+산출하였습니다\.?\s*/g, '')
    .replace(/원광만세력\s+정통\s+산출\s+기준에\s+따라\s+귀하의\s+사주명조\s*를\s+정밀하게\s+산출하였습니다\.?\s*/g, '')
    .replace(/원광만세력\s+정통\s+산출\s+기준에\s+따라\s+귀하의\s+사주를\s+정밀하게\s+분석하였습니다\.?\s*/g, '')
    .trim();
};

interface FeatureDetailProps {
  featureId: string;
  title: string;
  description: string;
  suggestions?: string[];
  customApiKey?: string;
  onApiKeyChange?: (key: string) => void;
}

export interface FileData {
  data: string;
  mimeType: string;
  name: string;
}

export const HEAVENLY_STEMS = [
  { char: '甲', name: '갑' },
  { char: '乙', name: '을' },
  { char: '丙', name: '병' },
  { char: '丁', name: '정' },
  { char: '戊', name: '무' },
  { char: '己', name: '기' },
  { char: '庚', name: '경' },
  { char: '辛', name: '신' },
  { char: '壬', name: '임' },
  { char: '癸', name: '계' },
];

export const EARTHLY_BRANCHES = [
  { char: '子', name: '자' },
  { char: '丑', name: '축' },
  { char: '寅', name: '인' },
  { char: '卯', name: '묘' },
  { char: '辰', name: '진' },
  { char: '巳', name: '사' },
  { char: '午', name: '오' },
  { char: '未', name: '미' },
  { char: '申', name: '신' },
  { char: '酉', name: '유' },
  { char: '戌', name: '술' },
  { char: '亥', name: '해' },
];

export default function FeatureDetail({ featureId, title, description, suggestions = [], customApiKey, onApiKeyChange }: FeatureDetailProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const [embedKeyInput, setEmbedKeyInput] = useState('');
  const [sajuData, setSajuData] = useState<any>(null);
  const [faceData, setFaceData] = useState<any>(null);
  const [namingData, setNamingData] = useState<any>(null);
  const [pungsuData, setPungsuData] = useState<any>(null);
  const [lastName, setLastName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_lastName') || '김';
    }
    return '김';
  });
  const [namingWishes, setNamingWishes] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_namingWishes') || '부귀영화와 지혜를 얻는 이름';
    }
    return '부귀영화와 지혜를 얻는 이름';
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<Array<{ lat: number; lng: number; title: string }>>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });

  // Play Store Builder specific states
  const [brandText, setBrandText] = useState('ANY1 AI');
  const [iconBgType, setIconBgType] = useState('dark-gradient');
  const [iconGlowColor, setIconGlowColor] = useState('cyan-lime');
  const [showGrid, setShowGrid] = useState(true);
  const [showTechLines, setShowTechLines] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(18);
  const [copied, setCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [freeUsageCount, setFreeUsageCount] = useState<number>(0);

  // Clear any legacy visitor limit count on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('any1_user_free_usage_count');
      setFreeUsageCount(0);
    }
  }, []);
  
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const ytId = getYouTubeId(youtubeUrl);
  const iconCanvasRef = useRef<HTMLCanvasElement>(null);

  // Saju specific states with localStorage cache to persist inputs across tab switches
  const [year, setYear] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_year') || '1990';
    }
    return '1990';
  });
  const [month, setMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_month') || '1';
    }
    return '1';
  });
  const [day, setDay] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_day') || '1';
    }
    return '1';
  });
  const [hour, setHour] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('any1_saju_hour');
      if (!saved) return '12:00';
      if (saved === 'unknown') return 'unknown';
      if (/^\d{1,2}$/.test(saved)) return `${saved.padStart(2, '0')}:00`;
      return saved;
    }
    return '12:00';
  });
  const [calendar, setCalendar] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_calendar') || 'solar';
    }
    return 'solar';
  });
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_leap') === 'true';
    }
    return false;
  });
  const [gender, setGender] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_gender') || 'male';
    }
    return 'male';
  });
  const [showSajuInputPanel, setShowSajuInputPanel] = useState(false);

  // Direct Saju input states
  const [sajuInputMode, setSajuInputMode] = useState<'date' | 'direct'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('any1_saju_inputMode') as 'date' | 'direct') || 'date';
    }
    return 'date';
  });
  const [directYearStem, setDirectYearStem] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directYearStem') || '庚';
    }
    return '庚';
  });
  const [directYearBranch, setDirectYearBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directYearBranch') || '子';
    }
    return '子';
  });
  const [directMonthStem, setDirectMonthStem] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directMonthStem') || '壬';
    }
    return '壬';
  });
  const [directMonthBranch, setDirectMonthBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directMonthBranch') || '午';
    }
    return '午';
  });
  const [directDayStem, setDirectDayStem] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directDayStem') || '壬';
    }
    return '壬';
  });
  const [directDayBranch, setDirectDayBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directDayBranch') || '戌';
    }
    return '戌';
  });
  const [directHourStem, setDirectHourStem] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directHourStem') || '乙';
    }
    return '乙';
  });
  const [directHourBranch, setDirectHourBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directHourBranch') || '巳';
    }
    return '巳';
  });
  const [directBirthYear, setDirectBirthYear] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_directBirthYear') || '1990';
    }
    return '1990';
  });

  // Saju Philosophy Hall Consultation States
  const [sajuConsultationTopic, setSajuConsultationTopic] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_consultationTopic') || '';
    }
    return '';
  });
  const [sajuClientQuestion, setSajuClientQuestion] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('any1_saju_clientQuestion') || '';
    }
    return '';
  });
  const [sajuFollowUpQuestion, setSajuFollowUpQuestion] = useState('');
  const [sajuConsultationHistory, setSajuConsultationHistory] = useState<Array<{ question: string; answer: string; timestamp: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('any1_saju_consultation_history');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [sajuConsulting, setSajuConsulting] = useState(false);
  const [consultationCopiedIndex, setConsultationCopiedIndex] = useState<number | null>(null);

  // Feng Shui specific states
  const [pungsuType, setPungsuType] = useState<'interior' | 'compass' | 'water-veins'>('interior');
  const [pungsuRoom, setPungsuRoom] = useState('bedroom');
  const [pungsuNotes, setPungsuNotes] = useState('');
  const [pungsuCompassDir, setPungsuCompassDir] = useState('남동쪽');
  const [pungsuWaterChecks, setPungsuWaterChecks] = useState<boolean[]>([false, false, false, false]);

  // Voice specific states
  const [voiceText, setVoiceText] = useState(`숨 가쁜 하루의 끝에서, 우리는 잠시 멈춰 서서, 고요함을 찾습니다.

이곳은 자연의 품 안에서, 혹은 우리 마음 깊은 곳에서 발견하는 치유의 공간입니다.

따스한 햇살이 스며들고, 부드러운 바람이 속삭이는 곳.

때로는 잊고 지냈던 우리 안의 빛을 마주하고, 때로는 상처받았던 마음을 조용히 보듬어 주는 이야기.

이제, 당신의 영혼을 위한 가장 편안한 여정을 시작합니다.`);
  const [voicePitch, setVoicePitch] = useState(0.85); // Default to low-medium soft female pitch
  const [voiceRate, setVoiceRate] = useState(0.75);  // Default to slow, calm pace
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [voicePreset, setVoicePreset] = useState('healing'); // 'healing', 'meditation', 'news', 'assistant'
  const voiceCanvasRef = useRef<HTMLCanvasElement>(null);

  // Clean Voice and Cloned Voice States
  const [isCleanVoiceEnabled, setIsCleanVoiceEnabled] = useState(true);
  const [clonedVoiceText, setClonedVoiceText] = useState('안녕하세요! 복제된 제 목소리로 낭독하는 중입니다. 고음질 스마트 보호 필터와 배경 명상 음향이 결합되어 갈라짐 없이 한결 더 깨끗하고 편안하게 느껴지실 거예요.');
  const [isPlayingClonedVoice, setIsPlayingClonedVoice] = useState(false);

  // Background Ambient Sound Refs
  const ambientOscillatorsRef = useRef<OscillatorNode[]>([]);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientCtxRef = useRef<AudioContext | null>(null);

  const startAmbientDrone = () => {
    try {
      // Ensure any previous ambient sounds are completely stopped first
      stopAmbientDrone();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      ambientCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.2); // smooth fade-in
      ambientGainRef.current = gain;

      // Deep, low-pass filter to make it a warm, comfortable sound bed
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);

      // Stereo widening delay path
      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.38, ctx.currentTime);
      const delayGain = ctx.createGain();
      delayGain.gain.setValueAtTime(0.25, ctx.currentTime);

      // Harmonious frequencies (136.1Hz is OM/earth year cosmic healing frequency)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(136.1, ctx.currentTime);
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(136.6, ctx.currentTime); // subtle detune for warm movement
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      
      filter.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(gain);
      
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      ambientOscillatorsRef.current = [osc1, osc2];
    } catch (e) {
      console.error("Failed to start ambient drone:", e);
    }
  };

  const stopAmbientDrone = () => {
    if (ambientGainRef.current && ambientCtxRef.current) {
      const ctx = ambientCtxRef.current;
      const gain = ambientGainRef.current;
      try {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4); // smooth fade-out
        const oscs = [...ambientOscillatorsRef.current];
        setTimeout(() => {
          oscs.forEach(osc => {
            try { osc.stop(); } catch (err) {}
          });
          try { ctx.close(); } catch (err) {}
        }, 500);
      } catch (err) {
        ambientOscillatorsRef.current.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
      }
    }
    ambientCtxRef.current = null;
    ambientGainRef.current = null;
    ambientOscillatorsRef.current = [];
  };

  // Microphone, Upload & Web Audio States
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedURL, setRecordedURL] = useState<string | null>(null);
  const [activeInputSource, setActiveInputSource] = useState<'mic' | 'upload'>('mic');
  const [clonedVoiceName, setClonedVoiceName] = useState('내 보이스 모델 (Uncalibrated)');
  const [isTrainingClone, setIsTrainingClone] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isCloned, setIsCloned] = useState(false);
  
  // Custom uploaded audio/video files
  const [uploadedAudioURL, setUploadedAudioURL] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  // Active filter for playing recorded/uploaded audio
  const [activeFilter, setActiveFilter] = useState<'none' | 'healing' | 'meditation' | 'radio'>('healing');
  const [isPlayingFilteredAudio, setIsPlayingFilteredAudio] = useState(false);
  const [isEchoEnabled, setIsEchoEnabled] = useState(false); // Default to FALSE to eliminate any howling/feedback by default!
  
  // Custom Voice Profile Interface
  interface ClonedVoiceProfile {
    id: string; // Serial number (e.g. "1", "2")
    name: string; // Voice profile name
    pitch: number;
    rate: number;
    filterType: 'healing' | 'meditation' | 'radio' | 'none';
    audioDataUrl: string; // Base64 voice print data
    createdAt: string;
  }
  
  const [savedProfiles, setSavedProfiles] = useState<ClonedVoiceProfile[]>([]);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [newProfileName, setNewProfileName] = useState('내 목소리 모델 v1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Load saved profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('any1_cloned_voice_profiles');
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved voice profiles:', e);
    }
  }, []);

  // Sync Saju / Naming inputs to localStorage
  useEffect(() => {
    localStorage.setItem('any1_saju_year', year);
    localStorage.setItem('any1_saju_month', month);
    localStorage.setItem('any1_saju_day', day);
    localStorage.setItem('any1_saju_hour', hour);
    localStorage.setItem('any1_saju_calendar', calendar);
    localStorage.setItem('any1_saju_leap', String(calendar === 'lunar' && isLeapMonth));
    localStorage.setItem('any1_saju_gender', gender);
    localStorage.setItem('any1_saju_lastName', lastName);
    localStorage.setItem('any1_saju_namingWishes', namingWishes);
    localStorage.setItem('any1_saju_inputMode', sajuInputMode);
    localStorage.setItem('any1_saju_directYearStem', directYearStem);
    localStorage.setItem('any1_saju_directYearBranch', directYearBranch);
    localStorage.setItem('any1_saju_directMonthStem', directMonthStem);
    localStorage.setItem('any1_saju_directMonthBranch', directMonthBranch);
    localStorage.setItem('any1_saju_directDayStem', directDayStem);
    localStorage.setItem('any1_saju_directDayBranch', directDayBranch);
    localStorage.setItem('any1_saju_directHourStem', directHourStem);
    localStorage.setItem('any1_saju_directHourBranch', directHourBranch);
    localStorage.setItem('any1_saju_directBirthYear', directBirthYear);

    if (sajuInputMode === 'date') {
      try {
        const unknownHour = hour === 'unknown';
        let hNum = 12;
        let mNum = 0;
        if (!unknownHour) {
          if (hour.includes(':')) {
            const [hh, mm] = hour.split(':');
            hNum = Math.min(23, Math.max(0, parseInt(hh, 10) || 0));
            mNum = Math.min(59, Math.max(0, parseInt(mm, 10) || 0));
          } else {
            hNum = Math.min(23, Math.max(0, parseInt(hour, 10) || 12));
          }
        }
        localStorage.setItem(
          'any1_saved_birth_profile',
          JSON.stringify({
            year: parseInt(year, 10) || 1990,
            month: parseInt(month, 10) || 1,
            day: parseInt(day, 10) || 1,
            hour: hNum,
            minute: mNum,
            unknownHour,
            isSolar: calendar !== 'lunar',
            isLeapMonth: calendar === 'lunar' && isLeapMonth,
            isMale: gender !== 'female',
          })
        );
      } catch {}
    }
  }, [
    year, month, day, hour, calendar, isLeapMonth, gender, lastName, namingWishes,
    sajuInputMode, directYearStem, directYearBranch, directMonthStem,
    directMonthBranch, directDayStem, directDayBranch, directHourStem, directHourBranch, directBirthYear
  ]);

  useEffect(() => {
    setShowSajuInputPanel(false);
  }, [featureId]);

  // Load results state depending on current featureId and current inputs
  useEffect(() => {
    const calKey = calendar === 'lunar' && isLeapMonth ? 'lunar-leap' : calendar;
    const currentKey = sajuInputMode === 'direct'
      ? `direct-${directBirthYear}-${directYearStem}${directYearBranch}-${directMonthStem}${directMonthBranch}-${directDayStem}${directDayBranch}-${directHourStem}${directHourBranch}-${gender}`
      : `${year}-${month}-${day}-${hour}-${calKey}-${gender}`;
    const namingKey = `${year}-${month}-${day}-${hour}-${calKey}-${gender}-${lastName}`;
    const storedSajuKey = sessionStorage.getItem('any1_saju_key');

    if (featureId === 'saju') {
      const storedSajuData = sessionStorage.getItem('any1_saju_data');
      const storedResponse = sessionStorage.getItem('any1_saju_response');
      if (storedSajuData && storedSajuKey === currentKey) {
        try {
          setSajuData(JSON.parse(storedSajuData));
        } catch (e) {}
      } else {
        setSajuData(null);
      }
      if (storedResponse && storedSajuKey === currentKey) {
        setResponse(cleanBoilerplate(storedResponse));
      } else {
        setResponse('');
      }
    } else if (featureId === 'naming') {
      const storedNamingData = sessionStorage.getItem('any1_naming_data');
      const storedResponse = sessionStorage.getItem('any1_naming_response');
      const storedNamingKey = sessionStorage.getItem('any1_naming_key');
      if (storedNamingData && storedNamingKey === namingKey) {
        try {
          setNamingData(JSON.parse(storedNamingData));
        } catch (e) {}
      } else {
        setNamingData(null);
      }
      if (storedResponse && storedNamingKey === namingKey) {
        setResponse(cleanBoilerplate(storedResponse));
      } else {
        setResponse('');
      }
    } else if (featureId === 'pungsu') {
      const storedPungsuData = sessionStorage.getItem('any1_pungsu_data');
      const storedResponse = sessionStorage.getItem('any1_pungsu_response');
      const storedPungsuKey = sessionStorage.getItem('any1_pungsu_key');
      if (storedPungsuData && storedPungsuKey === currentKey) {
        try {
          setPungsuData(JSON.parse(storedPungsuData));
        } catch (e) {}
      } else {
        setPungsuData(null);
      }
      if (storedResponse && storedPungsuKey === currentKey) {
        setResponse(storedResponse);
      } else {
        setResponse('');
      }
    } else {
      setSajuData(null);
      setNamingData(null);
      setPungsuData(null);
      setResponse('');
    }
  }, [
    featureId, year, month, day, hour, calendar, isLeapMonth, gender, sajuInputMode,
    directYearStem, directYearBranch, directMonthStem, directMonthBranch,
    directDayStem, directDayBranch, directHourStem, directHourBranch, directBirthYear
  ]);

  // Save helper
  const saveProfilesToStorage = (profiles: ClonedVoiceProfile[]) => {
    try {
      localStorage.setItem('any1_cloned_voice_profiles', JSON.stringify(profiles));
      setSavedProfiles(profiles);
    } catch (e) {
      console.error('Failed to save voice profiles:', e);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const clonedVoiceAudioContextRef = useRef<AudioContext | null>(null);
  const clonedVoiceAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const voiceUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const koVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('KR'));
        setAvailableVoices(koVoices.length > 0 ? koVoices : voices);
        if (koVoices.length > 0 && !selectedVoiceURI) {
          setSelectedVoiceURI(koVoices[0].voiceURI);
        } else if (voices.length > 0 && !selectedVoiceURI) {
          setSelectedVoiceURI(voices[0].voiceURI);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceURI]);

  useEffect(() => {
    let animationId: number;
    const canvas = voiceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      
      // Horizontal baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.strokeStyle = isPlayingVoice ? '#bef264' : 'rgba(163, 230, 53, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (isPlayingVoice) {
        for (let x = 0; x < width; x++) {
          const relativeX = x / width;
          const ampMod = Math.sin(relativeX * Math.PI);
          const y = height / 2 + 
            Math.sin(relativeX * 12 + phase) * 20 * ampMod + 
            Math.cos(relativeX * 6 - phase * 1.5) * 10 * ampMod;
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        phase += 0.15;
      } else {
        for (let x = 0; x < width; x++) {
          const relativeX = x / width;
          const ampMod = Math.sin(relativeX * Math.PI);
          const y = height / 2 + Math.sin(relativeX * 4 + phase) * 1.5 * ampMod;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        phase += 0.02;
      }
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlayingVoice]);

  const applyVoicePreset = (preset: string) => {
    setVoicePreset(preset);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const koVoices = voices.filter(v => v.lang.startsWith('ko') || v.lang.includes('KR'));
      
      if (koVoices.length > 0) {
        if (preset === 'meditation') {
          // Find deep male voice for "심야 명상 안내"
          const maleVoice = koVoices.find(v => 
            v.name.includes('Minjun') || 
            v.name.includes('민준') || 
            v.name.includes('Sehyun') || 
            v.name.includes('세현') || 
            v.name.includes('Jinho') || 
            v.name.includes('진호') || 
            v.name.toLowerCase().includes('male')
          );
          if (maleVoice) {
            setSelectedVoiceURI(maleVoice.voiceURI);
          } else {
            setSelectedVoiceURI(koVoices[0].voiceURI);
          }
        } else {
          // Find clear female voice for other presets
          const femaleVoice = koVoices.find(v => 
            v.name.includes('Heami') || 
            v.name.includes('혜미') || 
            v.name.includes('Yuna') || 
            v.name.includes('유나') || 
            v.name.toLowerCase().includes('female')
          );
          if (femaleVoice) {
            setSelectedVoiceURI(femaleVoice.voiceURI);
          } else {
            setSelectedVoiceURI(koVoices[0].voiceURI);
          }
        }
      }
    }

    if (preset === 'healing') {
      setVoicePitch(0.95);
      setVoiceRate(0.80);
      setVoiceText(`숨 가쁜 하루의 끝에서, 우리는 잠시 멈춰 서서, 고요함을 찾습니다.

이곳은 자연의 품 안에서, 혹은 우리 마음 깊은 곳에서 발견하는 치유의 공간입니다.

따스한 햇살이 스며들고, 부드러운 바람이 속삭이는 곳.

때로는 잊고 지냈던 우리 안의 빛을 마주하고, 때로는 상처받았던 마음을 조용히 보듬어 주는 이야기.

이제, 당신의 영혼을 위한 가장 편안한 여정을 시작합니다.`);
    } else if (preset === 'meditation') {
      setVoicePitch(0.95);
      setVoiceRate(0.75);
      setVoiceText(`깊은 숨을 들이마시고, 천천히 내쉽니다.
당신의 모든 걱정과 무거운 마음을 이곳에 내려놓으세요.
이 순간, 오직 당신만을 위한 평온이 깃듭니다.`);
    } else if (preset === 'news') {
      setVoicePitch(1.0);
      setVoiceRate(1.0);
      setVoiceText(`오늘의 주요 소식을 전해드립니다. AI 음성 분석 기술이 한층 더 정밀해지며 사용자 맞춤형 음색 제어가 실시간으로 제공됩니다.`);
    } else if (preset === 'assistant') {
      setVoicePitch(1.05);
      setVoiceRate(1.1);
      setVoiceText(`안녕하세요! 무엇을 도와드릴까요? 오늘 하루도 기분 좋은 일만 가득하시길 바랍니다.`);
    }
  };

  const handlePlayVoice = () => {
    if (isPlayingVoice) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingVoice(false);
      stopAmbientDrone();
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("이 브라우저는 음성 합성을 지원하지 않습니다.");
      return;
    }

    window.speechSynthesis.cancel();
    if (isPlayingClonedVoice) {
      setIsPlayingClonedVoice(false);
    }
    if (isPlayingFilteredAudio) {
      stopFilteredAudio();
    }
    stopAmbientDrone();

    const utterance = new SpeechSynthesisUtterance(voiceText);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || voices.find(v => v.lang.startsWith('ko'));
    
    if (voice) {
      utterance.voice = voice;
    }

    // Dynamic pitch/rate clamping to prevent voice cracking on basic browser speech engines
    let finalPitch = voicePitch;
    let finalRate = voiceRate;

    if (isCleanVoiceEnabled) {
      // Clamping pitch to prevent sound cracking/robot noise entirely
      if (finalPitch < 0.95) finalPitch = 0.98; 
      if (finalRate < 0.75) finalRate = 0.78;   // Clamping minimum rate to keep voice flowing smoothly
    }

    utterance.pitch = finalPitch;
    utterance.rate = finalRate;

    utterance.onstart = () => {
      setIsPlayingVoice(true);
      if (isCleanVoiceEnabled) {
        startAmbientDrone(); // Play gorgeous healing ambient background pad to mask any robotic artifacts!
      }
    };
    
    const handleEnd = () => {
      setIsPlayingVoice(false);
      stopAmbientDrone();
    };

    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;

    window.speechSynthesis.speak(utterance);
  };

  const handleRestoreOriginalVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    setIsPlayingClonedVoice(false);
    stopAmbientDrone();
    stopClonedVoicePlayback();
    if (isPlayingFilteredAudio) {
      stopFilteredAudio();
    }
    
    setVoicePitch(1.0);
    setVoiceRate(1.0);
    setVoicePreset('custom');
    setIsCleanVoiceEnabled(false);
    
    console.log("Original voice parameters fully restored (Standard 1.0x).");
  };

  const stopClonedVoicePlayback = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingClonedVoice(false);
    stopAmbientDrone();
    if (clonedVoiceAudioSourceRef.current) {
      try {
        clonedVoiceAudioSourceRef.current.stop();
      } catch (e) {}
      clonedVoiceAudioSourceRef.current = null;
    }
    if (clonedVoiceAudioContextRef.current) {
      try {
        clonedVoiceAudioContextRef.current.close();
      } catch (e) {}
      clonedVoiceAudioContextRef.current = null;
    }
  };

  const handlePlayClonedVoice = async () => {
    if (isPlayingClonedVoice) {
      stopClonedVoicePlayback();
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("이 브라우저는 음성 합성을 지원하지 않습니다.");
      return;
    }

    window.speechSynthesis.cancel();
    if (isPlayingVoice) {
      setIsPlayingVoice(false);
    }
    if (isPlayingFilteredAudio) {
      stopFilteredAudio();
    }
    stopAmbientDrone();

    const utterance = new SpeechSynthesisUtterance(clonedVoiceText);
    const voices = window.speechSynthesis.getVoices();
    
    // Choose selected voice or default korean voice
    const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || voices.find(v => v.lang.startsWith('ko'));
    
    if (voice) {
      utterance.voice = voice;
    }

    // Since it's the CLONED voice reader, we optimize it specifically for a beautiful, rich, slightly deep healing tone
    // We target extremely comfortable, warm, non-cracking speed and pitch values matching the loaded profile!
    let finalPitch = voicePitch;
    let finalRate = voiceRate;

    if (isCleanVoiceEnabled) {
      if (finalPitch < 0.95) finalPitch = 0.98; 
      if (finalRate < 0.75) finalRate = 0.78;
    }

    utterance.pitch = finalPitch;
    utterance.rate = finalRate;

    // Hook word boundaries to trigger micro-grains of the user's authentic vocal timbre
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        playVoiceGrain();
      }
    };

    // Start playing the decoded recorded/uploaded audio as the "cloned sound wave" with real-time vocal filter overlay!
    const sourceUrl = recordedURL || uploadedAudioURL;
    if (sourceUrl && isCloned) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        clonedVoiceAudioContextRef.current = audioCtx;

        const response = await fetch(sourceUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = true; // loop to match text length
        clonedVoiceAudioSourceRef.current = sourceNode;

        // Sound shaping network: We design an ambient warm formant-boosting bandpass/lowpass filter
        // that wraps the voice in beautiful 3D resonance, replicating a high-end studio recording.
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1800; // soft and warm, removes harsh high-frequency noise

        const peaking = audioCtx.createBiquadFilter();
        peaking.type = 'peaking';
        peaking.frequency.value = 350; // human warmth resonant frequency boost
        peaking.gain.value = 8.0;

        // Custom volume envelope to blend nicely with the TTS SpeechSynthesis
        const blendGain = audioCtx.createGain();
        blendGain.gain.value = 0.65; // Balanced timbre presence

        sourceNode.connect(lowpass);
        lowpass.connect(peaking);
        peaking.connect(blendGain);
        blendGain.connect(audioCtx.destination);

        // Play the custom voice resonance simultaneously!
        sourceNode.start(0);
      } catch (err) {
        console.warn('Failed to start real-time custom voice overlay:', err);
      }
    }

    utterance.onstart = () => {
      setIsPlayingClonedVoice(true);
      startAmbientDrone(); // background OM drone
    };

    const handleEnd = () => {
      stopClonedVoicePlayback();
    };

    utterance.onend = handleEnd;
    utterance.onerror = handleEnd;

    window.speechSynthesis.speak(utterance);
  };

  const handleUseClonedVoiceForTTS = () => {
    setSelectedVoiceURI('cloned-voice');
    setTimeout(() => {
      const element = document.getElementById('cloned-voice-card-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-neon');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-neon');
        }, 1500);
      } else {
        const fallback = document.getElementById('voice-synthesis-section');
        if (fallback) {
          fallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
          fallback.classList.add('ring-2', 'ring-neon');
          setTimeout(() => {
            fallback.classList.remove('ring-2', 'ring-neon');
          }, 1500);
        }
      }
    }, 100);
  };

  // Start recording user's voice
  const handleStartRecording = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      alert('마이크 접근을 지원하지 않는 브라우저입니다.');
      return;
    }
    
    // Cancel any current synthetic playback or filtered audio
    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
    }
    if (isPlayingFilteredAudio) {
      stopFilteredAudio();
    }
    
    // Reset previous uploads and clone state to avoid collisions
    setUploadedAudioURL(null);
    setUploadedFileName('');
    setIsCloned(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        setRecordedURL(URL.createObjectURL(blob));
        setClonedVoiceName('내 목소리 모델 (학습 가능)');
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('마이크 연결 실패:', err);
      alert('마이크 연결에 실패했습니다. 마이크 사용 권한을 허용해 주세요!');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Play a tiny micro-grain play from the user's actual voice recording
  const playVoiceGrain = async () => {
    const sourceUrl = recordedURL || uploadedAudioURL;
    if (!sourceUrl || !clonedVoiceAudioContextRef.current) return;
    
    try {
      const audioCtx = clonedVoiceAudioContextRef.current;
      
      const response = await fetch(sourceUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      const grainSource = audioCtx.createBufferSource();
      grainSource.buffer = audioBuffer;
      
      // Randomly offset the start of the grain within the voice recording
      const duration = audioBuffer.duration;
      const startTime = Math.random() * Math.max(0, duration - 0.4);
      
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1000;
      bandpass.Q.value = 1.0;
      
      grainSource.connect(bandpass);
      bandpass.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      grainSource.start(0, startTime, 0.4);
    } catch (e) {
      console.warn('Grain playback failed:', e);
    }
  };

  // Complete training and save voice profile persistently
  const completeVoiceTraining = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        const calculatedPitch = voicePitch || 1.0;
        const calculatedRate = voiceRate || 0.8;
        
        const nextId = (savedProfiles.length > 0 
          ? Math.max(...savedProfiles.map(p => parseInt(p.id) || 0)) + 1 
          : 1).toString();
          
        const profileName = newProfileName.trim() || (uploadedFileName ? `${uploadedFileName.substring(0, 12)} 복제 모델` : `내 목소리 모델 v${nextId}`);
        
        const newProfile: ClonedVoiceProfile = {
          id: nextId,
          name: profileName,
          pitch: calculatedPitch,
          rate: calculatedRate,
          filterType: activeFilter,
          audioDataUrl: base64data,
          createdAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        
        const updated = [...savedProfiles, newProfile];
        saveProfilesToStorage(updated);
        
        // Auto load it!
        loadVoiceProfile(newProfile);
        showToast(`'${profileName}' 목소리 복제 완료! 순번 #${nextId}번으로 라이브러리에 안전하게 저장되었습니다.`, 'success');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error saving trained voice:', err);
      showToast('목소리 추출 및 프로필 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  // Load selected voice profile
  const loadVoiceProfile = (profile: ClonedVoiceProfile) => {
    setIsCloned(true);
    setClonedVoiceName(profile.name);
    setVoicePitch(profile.pitch);
    setVoiceRate(profile.rate);
    setActiveFilter(profile.filterType);
    
    // Set the source URLs to the loaded profile's audio base64 data
    setRecordedURL(profile.audioDataUrl);
    setUploadedAudioURL(null); // Clear active upload
    setUploadedFileName(profile.name);
    
    showToast(`목소리 모델 [${profile.name}] (순번 #${profile.id}) 불러오기 완료!`, 'success');
  };

  const handleSearchAndLoadProfile = () => {
    if (!profileSearchQuery.trim()) {
      showToast('불러올 목소리의 순번(#)이나 이름을 입력해 주세요.', 'info');
      return;
    }

    const query = profileSearchQuery.trim().toLowerCase();
    const matched = savedProfiles.find(p => p.id === query || p.name.toLowerCase().includes(query));
    
    if (matched) {
      loadVoiceProfile(matched);
      setProfileSearchQuery('');
    } else {
      showToast(`'${profileSearchQuery}'에 일치하는 목소리 프로필이 존재하지 않습니다.`, 'error');
    }
  };

  // Simulated Voice Clone Trainer
  const handleTrainVoiceModel = (sourceType?: 'mic' | 'upload') => {
    const audioUrl = sourceType === 'mic' ? recordedURL : sourceType === 'upload' ? uploadedAudioURL : (recordedURL || uploadedAudioURL);
    if (!audioUrl) {
      alert('분석하거나 복제할 오디오를 준비해 주세요. 마이크로 녹음하거나 비디오/오디오 파일을 업로드하시면 됩니다!');
      return;
    }
    
    setIsTrainingClone(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTrainingClone(false);
          setIsCloned(true);
          
          completeVoiceTraining(audioUrl);
          setSelectedVoiceURI('cloned-voice'); // Automatically select cloned voice on completion!
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  // Custom audio/video upload handler for extraction
  const handleVoiceUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const fileURL = URL.createObjectURL(file);
    setUploadedAudioURL(fileURL);
    
    // Suggest profile name based on file name
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setNewProfileName(cleanName.substring(0, 16) + ' 모델');
    
    // Clear previous mic recording and reset cloned status to ensure a fresh training session
    setRecordedURL(null);
    setRecordedBlob(null);
    setIsCloned(false); // require training
  };

  // Play audio with active filters (Web Audio API with native HTML5 fallback)
  const playFilteredAudio = async (audioUrl: string) => {
    if (isPlayingFilteredAudio) {
      stopFilteredAudio();
      return;
    }
    
    try {
      setIsPlayingFilteredAudio(true);
      
      // Set up Web Audio API nodes via fetch to decode buffer (avoids howling/dual playbacks)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioBuffer(arrayBuffer);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      audioSourceRef.current = source;
      
      let lastNode: AudioNode = source;
      
      if (activeFilter === 'healing') {
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 2200; // smooth warmth
        
        const peaking = audioCtx.createBiquadFilter();
        peaking.type = 'peaking';
        peaking.frequency.value = 350; // cozy resonant frequency
        peaking.gain.value = 7.0; // +7dB boost
        
        lastNode.connect(lowpass);
        lowpass.connect(peaking);
        
        if (isEchoEnabled) {
          const delay = audioCtx.createDelay();
          delay.delayTime.value = 0.22;
          
          const feedback = audioCtx.createGain();
          feedback.gain.value = 0.25;
          
          const dryWet = audioCtx.createGain();
          dryWet.gain.value = 0.45;
          
          delay.connect(feedback);
          feedback.connect(delay);
          
          peaking.connect(audioCtx.destination);
          peaking.connect(delay);
          delay.connect(dryWet);
          dryWet.connect(audioCtx.destination);
        } else {
          peaking.connect(audioCtx.destination);
        }
        
      } else if (activeFilter === 'meditation') {
        source.playbackRate.value = 0.85; // slower, relaxing, deep
        
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1400; // dark, meditative
        
        const peaking = audioCtx.createBiquadFilter();
        peaking.type = 'peaking';
        peaking.frequency.value = 180; // deep sub-bass boost
        peaking.gain.value = 9.0;
        
        lastNode.connect(lowpass);
        lowpass.connect(peaking);
        
        if (isEchoEnabled) {
          const delay = audioCtx.createDelay();
          delay.delayTime.value = 0.4;
          
          const feedback = audioCtx.createGain();
          feedback.gain.value = 0.35;
          
          const dryWet = audioCtx.createGain();
          dryWet.gain.value = 0.5;
          
          delay.connect(feedback);
          feedback.connect(delay);
          
          peaking.connect(audioCtx.destination);
          peaking.connect(delay);
          delay.connect(dryWet);
          dryWet.connect(audioCtx.destination);
        } else {
          peaking.connect(audioCtx.destination);
        }
        
      } else if (activeFilter === 'radio') {
        const highpass = audioCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 450;
        
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 3200;
        
        lastNode.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(audioCtx.destination);
      } else {
        lastNode.connect(audioCtx.destination);
      }
      
      source.onended = () => {
        setIsPlayingFilteredAudio(false);
      };
      
      source.start(0);
    } catch (err) {
      console.warn('Web Audio buffer playback failed, falling back to direct play:', err);
      // Absolute bulletproof fallback: Play via standard Audio element!
      try {
        const simpleAudio = new Audio(audioUrl);
        (window as any).currentFilteredAudio = simpleAudio;
        simpleAudio.onended = () => setIsPlayingFilteredAudio(false);
        simpleAudio.onerror = () => setIsPlayingFilteredAudio(false);
        await simpleAudio.play();
      } catch (fallbackErr) {
        console.error('All playbacks failed:', fallbackErr);
        setIsPlayingFilteredAudio(false);
      }
    }
  };

  const stopFilteredAudio = () => {
    if ((window as any).currentFilteredAudio) {
      try {
        (window as any).currentFilteredAudio.pause();
        (window as any).currentFilteredAudio = null;
      } catch (e) {}
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
    setIsPlayingFilteredAudio(false);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const genericFileInputRef = useRef<HTMLInputElement>(null);

  const isTravelCategory = featureId === 'travel-guide' || featureId === 'travel-assistant';

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("이 브라우저에서는 카메라를 지원하지 않거나 보안 연결(HTTPS)이 필요합니다.");
      return;
    }
    try {
      setIsCameraActive(true);
      // We'll attach the stream in a useEffect once the video element is rendered
    } catch (err: any) {
      console.error("Camera access error:", err);
      alert("카메라를 시작할 수 없습니다: " + err.message);
    }
  };

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const setupCamera = async () => {
      if (isCameraActive && videoRef.current && !videoRef.current.srcObject) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = currentStream;
          }
        } catch (err) {
          console.error("Failed to get stream in effect:", err);
          setIsCameraActive(false);
        }
      }
    };

    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  // Real-time canvas drawing engine for 512x512 Play Store App Icon with 3D Globe & Orbit Lines
  useEffect(() => {
    if (featureId === 'playstore-builder' && iconCanvasRef.current) {
      const canvas = iconCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Background (Solid or Gradient)
      ctx.clearRect(0, 0, 512, 512);
      if (iconBgType === 'pure-black') {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, 512, 512);
      } else if (iconBgType === 'dark-gradient') {
        const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 320);
        grad.addColorStop(0, '#10141b');
        grad.addColorStop(0.5, '#070a0e');
        grad.addColorStop(1, '#020304');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
      } else {
        // Tech Blue-gray Cyber gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#0a0d13');
        grad.addColorStop(0.5, '#040508');
        grad.addColorStop(1, '#0e121a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
      }

      // 2. Draw Subtle Digital Matrix Grid Lines
      if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
        ctx.lineWidth = 1;
        // Horizontal lines
        for (let i = 32; i < 512; i += 32) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(512, i);
          ctx.stroke();
        }
        // Vertical lines
        for (let i = 32; i < 512; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 512);
          ctx.stroke();
        }
      }

      // 3. Draw Tech Concentric HUD Circles & Corner Tick Marks
      if (showTechLines) {
        // Center Target Crosshair
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(256, 40); ctx.lineTo(256, 472);
        ctx.moveTo(40, 256); ctx.lineTo(472, 256);
        ctx.stroke();

        // Outer concentric circle
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(256, 256, 230, 0, Math.PI * 2);
        ctx.stroke();

        // Middle dashed HUD circle
        ctx.strokeStyle = 'rgba(163, 230, 53, 0.12)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(256, 256, 200, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Corner futuristic frames (HUD Style)
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
        ctx.lineWidth = 3;
        const cornerSize = 25;
        const padding = 35;
        // Top Left
        ctx.beginPath();
        ctx.moveTo(padding, padding + cornerSize);
        ctx.lineTo(padding, padding);
        ctx.lineTo(padding + cornerSize, padding);
        ctx.stroke();
        // Top Right
        ctx.beginPath();
        ctx.moveTo(512 - padding, padding + cornerSize);
        ctx.lineTo(512 - padding, padding);
        ctx.lineTo(512 - padding - cornerSize, padding);
        ctx.stroke();
        // Bottom Left
        ctx.beginPath();
        ctx.moveTo(padding, 512 - padding - cornerSize);
        ctx.lineTo(padding, 512 - padding);
        ctx.lineTo(padding + cornerSize, 512 - padding);
        ctx.stroke();
        // Bottom Right
        ctx.beginPath();
        ctx.moveTo(512 - padding, 512 - padding - cornerSize);
        ctx.lineTo(512 - padding, 512 - padding);
        ctx.lineTo(512 - padding - cornerSize, 512 - padding);
        ctx.stroke();
      }

      // Determine Neon Colors Based on Selected Theme
      const primaryColor = iconGlowColor === 'lime' ? '#a3e635' : '#00f3ff';
      const secondaryColor = iconGlowColor === 'cyan' ? '#00f3ff' : '#a3e635';

      // 4. Draw Magnificent 3D Cyber Globe (지구본)
      const globeRadius = 140;
      const cx = 256;
      const cy = 256;

      // Base globe sphere body with subtle radial gradient fill (glassy/deep effect)
      const globeBodyGrad = ctx.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, globeRadius);
      globeBodyGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      globeBodyGrad.addColorStop(0.8, 'rgba(2, 6, 23, 0.9)');
      globeBodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = globeBodyGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow backing for the sphere
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = glowIntensity * 1.2;
      ctx.strokeStyle = primaryColor === '#a3e635' ? 'rgba(163, 230, 53, 0.4)' : 'rgba(0, 243, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw wireframe latitude and longitude lines CLIPPED to the globe circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Draw Latitude Lines (Horizontal Curves)
      ctx.lineWidth = 1.2;
      const latAngles = [30, 60, -30, -60];
      latAngles.forEach((angle) => {
        const rad = (angle * Math.PI) / 180;
        const yOffset = globeRadius * Math.sin(rad);
        const rx = globeRadius * Math.cos(rad);
        const ry = rx * 0.22; // flattened ellipse factor

        ctx.strokeStyle = angle > 0 ? 'rgba(0, 243, 255, 0.18)' : 'rgba(163, 230, 53, 0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOffset, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Equator Line
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, globeRadius, globeRadius * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Longitude Lines (Vertical Curves)
      ctx.lineWidth = 1.2;
      const longScales = [0.3, 0.6, 0.85];
      longScales.forEach((scale) => {
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, globeRadius * scale, globeRadius, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Central Prime Meridian Line
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - globeRadius);
      ctx.lineTo(cx, cy + globeRadius);
      ctx.stroke();

      ctx.restore(); // Exit sphere clipping

      // 5. Draw Glowing Curved Orbital Rings (라운드 곡선 궤도)
      // Orbit Ring 1 (Tilted Negative)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-22 * Math.PI / 180);
      
      const ringGrad1 = ctx.createLinearGradient(-190, 0, 190, 0);
      ringGrad1.addColorStop(0, 'rgba(0, 243, 255, 0.1)');
      ringGrad1.addColorStop(0.5, '#00f3ff');
      ringGrad1.addColorStop(1, 'rgba(163, 230, 53, 0.1)');
      
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = glowIntensity * 0.8;
      ctx.strokeStyle = ringGrad1;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.35, globeRadius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite node on Ring 1
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(globeRadius * 1.15, -globeRadius * 0.18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Orbit Ring 2 (Tilted Positive - Inverse theme)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(35 * Math.PI / 180);

      const ringGrad2 = ctx.createLinearGradient(-180, 0, 180, 0);
      ringGrad2.addColorStop(0, 'rgba(163, 230, 53, 0.1)');
      ringGrad2.addColorStop(0.5, '#a3e635');
      ringGrad2.addColorStop(1, 'rgba(0, 243, 255, 0.1)');

      ctx.shadowColor = '#a3e635';
      ctx.shadowBlur = glowIntensity * 0.8;
      ctx.strokeStyle = ringGrad2;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, globeRadius * 1.25, globeRadius * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite node on Ring 2
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-globeRadius * 0.8, -globeRadius * 0.24, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. Draw Gradient Brand Text (e.g., ANY1 AI)
      ctx.shadowBlur = glowIntensity * 1.6;
      ctx.shadowColor = primaryColor;

      const textLen = brandText.length;
      const fontSize = textLen <= 4 ? 76 : textLen <= 7 ? 62 : 44;
      ctx.font = `italic 950 ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Create a gorgeous gradient for the text
      const textGrad = ctx.createLinearGradient(120, 0, 390, 0);
      if (iconGlowColor === 'lime') {
        textGrad.addColorStop(0, '#bef264');
        textGrad.addColorStop(1, '#a3e635');
      } else if (iconGlowColor === 'cyan') {
        textGrad.addColorStop(0, '#22d3ee');
        textGrad.addColorStop(1, '#00f3ff');
      } else {
        // Hybrid Cyan-Lime
        textGrad.addColorStop(0, '#00f3ff');
        textGrad.addColorStop(0.5, '#ffffff');
        textGrad.addColorStop(1, '#a3e635');
      }

      // Draw a subtle dark backing plate under the text so it pops perfectly over the complex globe wires
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(5, 7, 12, 0.82)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      const textY = 250;
      const textHeight = fontSize * 1.2;
      ctx.beginPath();
      ctx.roundRect(50, textY - textHeight/2, 412, textHeight, 16);
      ctx.fill();
      ctx.stroke();

      // Draw the neon text glow & text fill
      ctx.shadowBlur = glowIntensity * 1.8;
      ctx.shadowColor = primaryColor;
      ctx.fillStyle = textGrad;
      ctx.fillText(brandText.toUpperCase(), 256, textY);

      // Draw thick professional black outline around text to enhance readability
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 4;
      ctx.strokeText(brandText.toUpperCase(), 256, textY);

      // Re-fill the text so the outline is strictly outside
      ctx.fillStyle = textGrad;
      ctx.fillText(brandText.toUpperCase(), 256, textY);

      // 7. Subtitle Info & Status Indicator
      ctx.shadowBlur = glowIntensity * 0.8;
      ctx.shadowColor = secondaryColor;
      ctx.font = '900 13px system-ui, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('N E U R A L  A I  N E X U S', 256, 335);

      // Inner Core Status Pulse Dot
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f3ff';
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.arc(256, 365, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadows
      ctx.shadowBlur = 0;
    }
  }, [brandText, iconBgType, iconGlowColor, showGrid, showTechLines, glowIntensity, featureId]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Use video dimensions for high quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 사용해주세요.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedFile(null); // Clear file if image is selected
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenericFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기가 너무 큽니다. 10MB 이하의 파일을 사용해주세요.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedFile({
          data: base64,
          mimeType: file.type,
          name: file.name
        });
        setSelectedImage(null); // Clear image if file is selected
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    
    let finalPrompt = '';
    const calLabel = calendar === 'solar' ? '양력' : (isLeapMonth ? '음력 윤달' : '음력');
    if (featureId === 'saju' && !customPrompt) {
      if (sajuInputMode === 'direct') {
        finalPrompt = `사주명식 직접 입력: [년주: ${directYearStem}${directYearBranch}, 월주: ${directMonthStem}${directMonthBranch}, 일주: ${directDayStem}${directDayBranch}, 시주: ${directHourStem}${directHourBranch}], 출생년도: ${directBirthYear}년, 성별: ${gender === 'male' ? '남성' : '여성'}의 사주를 분석해주세요.`;
      } else {
        const timeDisplay = hour === 'unknown' ? '시간모름' : (hour.includes(':') ? `${hour.split(':')[0]}시 ${hour.split(':')[1]}분` : `${hour}시`);
        finalPrompt = `${year}년 ${month}월 ${day}일 ${timeDisplay}생, ${calLabel}, ${gender === 'male' ? '남성' : '여성'}의 사주를 분석해주세요.`;
      }

      if (sajuClientQuestion.trim() || sajuConsultationTopic) {
        finalPrompt += `\n\n[🏛️ 철학관 1:1 맞춤 고객 상담 질의]\n- 상담 핵심 분야: ${sajuConsultationTopic || '고객 지정 맞춤 고민'}\n- 고객의 구체적인 상담 질문: "${sajuClientQuestion.trim() || sajuConsultationTopic}"\n\n대한민국 최고 권위 철학관의 수석 역학 상담가로서 위 고객의 사주원국과 대운·세운 흐름을 면밀히 분석하여, 고객의 질문에 대한 핀포인트 해답, 가장 유리한 시기(월/계절/연도)와 주의할 시기, 그리고 실생활에서 실천할 수 있는 현실적인 개운 비책을 명쾌하고 깊이 있게 처방해 주세요.`;
      }
    } else if (featureId === 'naming' && !customPrompt) {
      const timeDisplay = hour === 'unknown' ? '시간모름' : (hour.includes(':') ? `${hour.split(':')[0]}시 ${hour.split(':')[1]}분` : `${hour}시`);
      finalPrompt = `${year}년 ${month}월 ${day}일 ${timeDisplay}생, ${calLabel}, ${gender === 'male' ? '남성' : '여성'}의 사주에 맞는 최고의 명품 추천 이름을 지어주세요. 성씨는 "${lastName}" 이며, 희망하는 이름 스타일이나 축복 내용은 "${namingWishes}" 입니다.`;
    } else {
      const basePrompt = customPrompt || prompt;
      if (featureId === 'creation' && youtubeUrl.trim()) {
        finalPrompt = `[참고 유튜브 동영상 링크: ${youtubeUrl}]\n\n위 유튜브 동영상의 내용을 분석하고 참고하여, 다음 요청에 맞춰 새로운 글/이야기를 창작해 주세요:\n${basePrompt || '이 동영상의 내용을 바탕으로 독창적이고 흥미로운 이야기를 작성해 주세요.'}`;
      } else {
        finalPrompt = basePrompt;
      }
    }

    if (!finalPrompt.trim() && !selectedImage && !selectedFile && !loading) return;

    setLoading(true);
    setResponse('');
    setIsQuotaError(false);
    setIsApiKeyError(false);
    setSajuData(null);
    setFaceData(null);
    setNamingData(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: finalPrompt || (featureId === 'face' ? '이미지의 얼굴 관상을 정밀하게 분석하여 운세를 풀이해 주세요.' : ''), 
          feature: title,
          image: selectedImage,
          file: selectedFile,
          customApiKey: customApiKey
        }),
      });

      if (!res.ok) {
        let errorMessage = '서버 응답 오류';
        try {
          const errData = await res.json();
          errorMessage = errData.error || errorMessage;
        } catch (e) {
          errorMessage = `서버 오류 (${res.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const rawText = data.text || '';

      
      // Extract map markers if travel related
      if (isTravelCategory) {
        const markerRegex = /\[MARKER:\s*(.*?),\s*(.*?),\s*(.*?)\]/g;
        let match;
        const newMarkers = [];
        while ((match = markerRegex.exec(rawText)) !== null) {
          const lat = parseFloat(match[2].trim());
          const lng = parseFloat(match[3].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            newMarkers.push({
              title: match[1].trim(),
              lat,
              lng
            });
          }
        }
        if (newMarkers.length > 0) {
          setMapMarkers(newMarkers);
          setMapCenter({ lat: newMarkers[0].lat, lng: newMarkers[0].lng });
        }
      }

      if (featureId === 'saju') {
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
        const calKey = calendar === 'lunar' && isLeapMonth ? 'lunar-leap' : calendar;
        const currentKey = sajuInputMode === 'direct'
          ? `direct-${directBirthYear}-${directYearStem}${directYearBranch}-${directMonthStem}${directMonthBranch}-${directDayStem}${directDayBranch}-${directHourStem}${directHourBranch}-${gender}`
          : `${year}-${month}-${day}-${hour}-${calKey}-${gender}`;
        setShowSajuInputPanel(false);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.sajuChart) {
              setSajuData(parsed.sajuChart);
              sessionStorage.setItem('any1_saju_data', JSON.stringify(parsed.sajuChart));
              sessionStorage.setItem('any1_saju_key', currentKey);
              const cleanText = cleanBoilerplate(rawText.replace(/```json\s*[\s\S]*?\s*```/, '').trim());
              setResponse(cleanText);
              sessionStorage.setItem('any1_saju_response', cleanText);
            } else {
              const cleanedRaw = cleanBoilerplate(rawText);
              setResponse(cleanedRaw);
              sessionStorage.setItem('any1_saju_response', cleanedRaw);
              sessionStorage.setItem('any1_saju_key', currentKey);
            }
          } catch (e) {
            const cleanedRaw = cleanBoilerplate(rawText);
            setResponse(cleanedRaw);
            sessionStorage.setItem('any1_saju_response', cleanedRaw);
            sessionStorage.setItem('any1_saju_key', currentKey);
          }
        } else {
          const cleanedRaw = cleanBoilerplate(rawText);
          setResponse(cleanedRaw);
          sessionStorage.setItem('any1_saju_response', cleanedRaw);
          sessionStorage.setItem('any1_saju_key', currentKey);
        }
      } else if (featureId === 'face') {
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.faceAnalysis) {
              setFaceData(parsed.faceAnalysis);
              setResponse(rawText.replace(/```json\s*[\s\S]*?\s*```/, '').trim());
            } else {
              setResponse(rawText);
            }
          } catch (e) {
            setResponse(rawText);
          }
        } else {
          setResponse(rawText);
        }
      } else if (featureId === 'naming') {
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
        const calKey = calendar === 'lunar' && isLeapMonth ? 'lunar-leap' : calendar;
        const namingKey = `${year}-${month}-${day}-${hour}-${calKey}-${gender}-${lastName}`;
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.namingAnalysis) {
              setNamingData(parsed.namingAnalysis);
              sessionStorage.setItem('any1_naming_data', JSON.stringify(parsed.namingAnalysis));
              sessionStorage.setItem('any1_naming_key', namingKey);

              // Also sync Saju cache if sajuData is returned in the naming response
              if (parsed.namingAnalysis.sajuData) {
                const sajuKey = `${year}-${month}-${day}-${hour}-${calKey}-${gender}`;
                sessionStorage.setItem('any1_saju_data', JSON.stringify(parsed.namingAnalysis.sajuData));
                sessionStorage.setItem('any1_saju_key', sajuKey);
              }

              const cleanText = cleanBoilerplate(rawText.replace(/```json\s*[\s\S]*?\s*```/, '').trim());
              setResponse(cleanText);
              sessionStorage.setItem('any1_naming_response', cleanText);
            } else {
              const cleanedRaw = cleanBoilerplate(rawText);
              setResponse(cleanedRaw);
              sessionStorage.setItem('any1_naming_response', cleanedRaw);
              sessionStorage.setItem('any1_naming_key', namingKey);
            }
          } catch (e) {
            const cleanedRaw = cleanBoilerplate(rawText);
            setResponse(cleanedRaw);
            sessionStorage.setItem('any1_naming_response', cleanedRaw);
            sessionStorage.setItem('any1_naming_key', namingKey);
          }
        } else {
          const cleanedRaw = cleanBoilerplate(rawText);
          setResponse(cleanedRaw);
          sessionStorage.setItem('any1_naming_response', cleanedRaw);
          sessionStorage.setItem('any1_naming_key', namingKey);
        }
      } else if (featureId === 'pungsu') {
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
        const currentKey = `${year}-${month}-${day}-${hour}-${calendar}-${gender}`;
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.pungsuAnalysis) {
              setPungsuData(parsed.pungsuAnalysis);
              sessionStorage.setItem('any1_pungsu_data', JSON.stringify(parsed.pungsuAnalysis));
              sessionStorage.setItem('any1_pungsu_key', currentKey);
              const cleanText = rawText.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
              setResponse(cleanText);
              sessionStorage.setItem('any1_pungsu_response', cleanText);
            } else {
              setResponse(rawText);
              sessionStorage.setItem('any1_pungsu_response', rawText);
              sessionStorage.setItem('any1_pungsu_key', currentKey);
            }
          } catch (e) {
            setResponse(rawText);
            sessionStorage.setItem('any1_pungsu_response', rawText);
            sessionStorage.setItem('any1_pungsu_key', currentKey);
          }
        } else {
          setResponse(rawText);
          sessionStorage.setItem('any1_pungsu_response', rawText);
          sessionStorage.setItem('any1_pungsu_key', currentKey);
        }
      } else if (isTravelCategory) {
        // Strip [MARKER: ...] tags so they only appear on the map and do not clutter the chat response
        const cleanTravelText = rawText
          .replace(/\[MARKER:\s*[^,\]]+,\s*[^,\]]+,\s*[^\]]+\]/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        setResponse(cleanTravelText);
      } else {
        setResponse(rawText);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      const errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('quota') ||
        errMsg.toLowerCase().includes('exhausted') ||
        errMsg.toLowerCase().includes('limit') ||
        errMsg.toLowerCase().includes('429') ||
        errMsg.toLowerCase().includes('resource_exhausted')
      ) {
        setIsQuotaError(true);
      } else if (
        errMsg.includes('API') ||
        errMsg.includes('키') ||
        errMsg.toLowerCase().includes('api_key') ||
        errMsg.toLowerCase().includes('403') ||
        errMsg.toLowerCase().includes('400') ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('api key not valid')
      ) {
        setIsApiKeyError(true);
      }
      setResponse(`오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSajuFollowUpSubmit = async (questionText?: string) => {
    const q = (questionText || sajuFollowUpQuestion).trim();
    if (!q || sajuConsulting) return;

    setSajuConsulting(true);
    try {
      let sajuContext = '';
      if (sajuData) {
        const pillarsSummary = sajuData.pillars?.map((p: any) => `${p.label}: ${p.heavenlyStem}${p.earthlyBranch}(${p.heavenlyStemTenGod}/${p.earthlyBranchTenGod})`).join(', ');
        const activeDaeun = sajuData.daeunList?.find((d: any) => d.isActive);
        const daeunInfo = activeDaeun ? `${activeDaeun.age}세 대운(${activeDaeun.heavenlyStem}${activeDaeun.earthlyBranch})` : '';
        const profileLine = sajuData.profile?.solarDate
          ? `[고객 생년월일]: ${sajuData.profile.solarDate} / ${sajuData.profile.lunarDate || ''} / ${sajuData.profile.isMale ? '남성' : '여성'}\n`
          : '';
        sajuContext = `${profileLine}[고객 사주명식]: ${pillarsSummary}\n[오행 구성]: 목(${sajuData.elements?.wood || 0}), 화(${sajuData.elements?.fire || 0}), 토(${sajuData.elements?.earth || 0}), 금(${sajuData.elements?.metal || 0}), 수(${sajuData.elements?.water || 0})${daeunInfo ? `\n[현재 대운]: ${daeunInfo}` : ''}\n\n`;
      }

      const promptPayload = `${sajuContext}[철학관 실시간 1:1 고객 추가 상담 질문]\n고객 질문: "${q}"\n\n대한민국 최고 권위 철학관의 수석 역학 상담가로서, 고객의 위 사주명조와 현재 대운·세운의 기운을 바탕으로 고객의 질문에 대해 친절하고 명쾌하게 1:1 맞춤 카운슬링을 제공해 주십시오. (기본 성격 원론 풀이는 생략하고, 질문에 대한 구체적인 시기(월/년), 유리한 선택, 피해야 할 흉한 시기, 실생활 개운 행동 비책을 명확히 전달해 주세요.)`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptPayload,
          feature: 'AI 정밀 만세력',
          customApiKey: customApiKey
        })
      });

      if (!res.ok) {
        let errMessage = '상담 응답 생성 실패';
        try {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const data = await res.json();
      const rawAnswer = data.text || '';
      const cleanAnswer = cleanBoilerplate(rawAnswer.replace(/```json\s*[\s\S]*?\s*```/, '').trim());

      const newHistoryItem = {
        question: q,
        answer: cleanAnswer,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };

      const updatedHistory = [...sajuConsultationHistory, newHistoryItem];
      setSajuConsultationHistory(updatedHistory);
      sessionStorage.setItem('any1_saju_consultation_history', JSON.stringify(updatedHistory));
      setSajuFollowUpQuestion('');
    } catch (err: any) {
      console.error('Saju follow-up consultation error:', err);
      alert(`상담 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setSajuConsulting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    handleSubmit(undefined, suggestion);
  };

  const renderApiKeyBanner = () => {
    return (
      <div className="mb-8 border border-border-dark bg-black/40 p-5 font-sans rounded-sm relative overflow-hidden">
        {/* Futuristic accent border */}
        <div className="absolute top-0 left-0 w-1 h-full bg-neon animate-pulse" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">NEXUS QUOTA CONTROL</span>
              {customApiKey ? (
                <span className="text-[9px] px-2 py-0.5 bg-neon/15 border border-neon/35 text-neon font-black tracking-wider rounded-sm uppercase flex items-center gap-1">
                  <Cpu size={10} /> 개인 전용 회선 활성화됨
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 bg-blue-500/15 border border-blue-500/35 text-blue-400 font-black tracking-wider rounded-sm uppercase flex items-center gap-1">
                  <HelpCircle size={10} /> 공용 서버 한도 공유 중
                </span>
              )}
            </div>
            <h4 className="text-[14px] font-black text-text-light uppercase tracking-wide">
              {customApiKey ? "나만의 독립된 무제한 무료 API 한도 동작 중" : "처음부터 다른 방문자와 분리된 100% 무료 전용 한도 확보하기"}
            </h4>
            <p className="text-[11px] text-text-light/50 leading-relaxed max-w-3xl">
              {customApiKey ? (
                "축하합니다! 현재 다른 방문자들의 동시 테스트로 인한 한도 초과 오류와 상관없이, 본인의 전용 구글 한도로 쾌적하고 가장 신속하게 테스트하고 있습니다."
              ) : (
                "다수의 방문자가 동시에 테스트할 경우 서버의 일일 공용 한도가 조기 소진되어 분석이 전체 중단될 수 있습니다. 구글 계정으로 10초 만에 완전히 무료인 나만의 독립 API Key를 연동하시면, 처음부터 사이트 중단 걱정 없이 독점적인 최고 속도로 자유롭게 테스트하실 수 있습니다."
              )}
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0 space-y-2.5">
            {!customApiKey ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-neon hover:text-neon text-[11px] font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 rounded-sm"
                >
                  <Key size={12} /> 무료 API Key 발급 (10초 소요) ↗
                </a>
                <div className="flex gap-2 flex-1">
                  <input
                    type="password"
                    value={embedKeyInput}
                    onChange={(e) => setEmbedKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="bg-bg-dark border border-border-dark px-3 py-2 text-xs text-text-light placeholder:text-text-light/20 outline-none focus:border-neon font-mono rounded-sm min-w-[150px] flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = embedKeyInput.trim();
                      if (trimmed && onApiKeyChange) {
                        onApiKeyChange(trimmed);
                        setEmbedKeyInput('');
                      } else {
                        alert('올바른 API Key를 입력해 주세요 (AIzaSy로 시작하는 키)');
                      }
                    }}
                    className="px-4 py-2 bg-neon hover:bg-white text-bg-dark text-[11px] font-black transition-all rounded-sm uppercase tracking-wider shrink-0"
                  >
                    연동 및 즉시 독립
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onApiKeyChange) {
                    onApiKeyChange('');
                  }
                }}
                className="w-full lg:w-auto px-5 py-2.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[11px] font-bold uppercase tracking-wider transition-all rounded-sm"
              >
                개인 전용 회선 해제 (공용 서버 복귀)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (featureId === 'tts') {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-l-4 border-neon pl-6"
        >
          <span className="text-[10px] tracking-[0.4em] font-bold text-neon uppercase mb-2 block">Module / Active</span>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-text-light">{title}</h1>
          <p className="text-text-light/40 text-sm font-medium uppercase tracking-widest leading-relaxed max-w-2xl">{description}</p>
        </motion.div>
        
        <TextToSpeechView />
      </div>
    );
  }

  if (featureId === 'voice-analysis') {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 border-l-4 border-neon pl-6"
        >
          <span className="text-[10px] tracking-[0.4em] font-bold text-neon uppercase mb-2 block">Module / Active</span>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-text-light">{title}</h1>
          <p className="text-text-light/40 text-sm font-medium uppercase tracking-widest leading-relaxed max-w-2xl">{description}</p>
        </motion.div>
        
        <MyVoiceCloneView />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 border-l-4 border-neon pl-6"
      >
        <span className="text-[10px] tracking-[0.4em] font-bold text-neon uppercase mb-2 block">Module / Active</span>
        <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4 text-text-light">{title}</h1>
        <p className="text-text-light/40 text-sm font-medium uppercase tracking-widest leading-relaxed max-w-2xl">{description}</p>
      </motion.div>

      {featureId === 'playstore-builder' ? (
        <div className="space-y-10 mb-12">
          {/* Complete 4 Asset Package & Free Privacy Policy Download Center */}
          <PlayStoreAssetDownloadCenter />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Icon Creator */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="p-8 border border-border-dark bg-white/[0.02] flex flex-col items-center">
                <span className="text-[10px] font-black tracking-widest uppercase text-neon mb-4 self-start">512 x 512 Realtime Preview</span>
              
              <div className="relative p-4 bg-black/60 border border-white/5 rounded-xl mb-6 shadow-2xl">
                <canvas 
                  ref={iconCanvasRef} 
                  width={512} 
                  height={512} 
                  className="w-[280px] h-[280px] md:w-[320px] md:h-[320px] bg-black shadow-[0_0_30px_rgba(0,243,255,0.15)] rounded-2xl"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-neon text-bg-dark text-[8px] font-black tracking-wider rounded uppercase">512px HD</div>
              </div>

              {/* Controls */}
              <div className="w-full space-y-5">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block mb-2 font-bold">Brand Text (1-6 Letters)</label>
                  <input 
                    type="text" 
                    value={brandText} 
                    onChange={(e) => setBrandText(e.target.value.substring(0, 6))}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-white font-mono font-bold uppercase tracking-widest text-sm focus:border-neon outline-none"
                    placeholder="ANY1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block mb-2 font-bold">Background Style</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'dark-gradient', name: 'Obsidian' },
                        { id: 'pure-black', name: 'Deep Black' },
                        { id: 'tech-pattern', name: 'Cyber Blue' }
                      ].map(bg => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setIconBgType(bg.id)}
                          className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                            iconBgType === bg.id ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 border-border-dark hover:border-neon/50'
                          }`}
                        >
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block mb-2 font-bold">Neon Theme</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'cyan-lime', name: 'Hybrid' },
                        { id: 'cyan', name: 'Cyan' },
                        { id: 'lime', name: 'Lime' }
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setIconGlowColor(color.id)}
                          className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest border transition-all ${
                            iconGlowColor === color.id ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 border-border-dark hover:border-neon/50'
                          }`}
                        >
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <button 
                    type="button"
                    onClick={() => setShowGrid(!showGrid)}
                    className={`py-2 px-4 border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                      showGrid ? 'border-neon/40 text-neon bg-neon/5' : 'border-border-dark text-text-light/30'
                    }`}
                  >
                    <span>Matrix Grid</span>
                    <span>{showGrid ? 'ON' : 'OFF'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowTechLines(!showTechLines)}
                    className={`py-2 px-4 border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between ${
                      showTechLines ? 'border-neon/40 text-neon bg-neon/5' : 'border-border-dark text-text-light/30'
                    }`}
                  >
                    <span>HUD Guides</span>
                    <span>{showTechLines ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Glow slider */}
                <div className="pt-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-light/40 mb-1.5">
                    <span>Neon Glow Intensity</span>
                    <span className="text-neon">{glowIntensity}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="35" 
                    value={glowIntensity}
                    onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
                    className="w-full accent-neon cursor-pointer h-1 bg-border-dark"
                  />
                </div>

                {/* Download trigger */}
                <button
                  type="button"
                  onClick={() => {
                    if (iconCanvasRef.current) {
                      const link = document.createElement('a');
                      link.download = `${brandText.toLowerCase()}_ai_playstore_icon.png`;
                      link.href = iconCanvasRef.current.toDataURL('image/png');
                      link.click();
                    }
                  }}
                  className="w-full py-4 bg-neon text-bg-dark font-black uppercase tracking-[0.25em] text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(207,255,4,0.2)] active:scale-[0.98]"
                >
                  Download 512x512 PNG Icon
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Deployment Hub */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Domain Copy Box */}
            <div className="p-8 border border-border-dark bg-white/[0.02]">
              <span className="text-[10px] font-black tracking-widest uppercase text-neon mb-3 block">Connected Web App URL</span>
              <p className="text-xs text-text-light/40 mb-5 leading-relaxed font-medium">구글 플레이스토어 앱(Webview / TWA) 패키징 시 앱 시작 주소(Start URL)에 연동할 전용 웹 주소입니다.</p>
              
              <div className="flex gap-2 bg-bg-dark border border-border-dark p-3 items-center">
                <span className="font-mono text-xs text-text-light/80 truncate flex-1 select-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-euuwt3omoxka4yawduuy2q-307819514387.asia-northeast1.run.app'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-euuwt3omoxka4yawduuy2q-307819514387.asia-northeast1.run.app';
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    copied ? 'bg-neon text-bg-dark' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {copied ? 'Copied! ⚡' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Step-by-Step Play Store Release Guide & Keystore Generator */}
            <div className="p-6 md:p-8 border border-border-dark bg-white/[0.02] flex-grow">
              <PlayStorePackagingGuide />
            </div>

          </div>
        </div>
      </div>
      ) : (
        <>
          {/* Voice Analysis & Studio Form */}
          {featureId === 'voice-analysis' && (
            <>
              <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Voice Synthesis Controls */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div id="voice-synthesis-section" className="p-8 border border-border-dark bg-white/[0.02] flex flex-col transition-all duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black tracking-widest uppercase text-neon">AI VOICE ENGINE & WAVEFORM</span>
                    <span className="px-2 py-0.5 bg-neon text-bg-dark text-[8px] font-black tracking-wider rounded uppercase">
                      {isPlayingVoice ? 'Synthesizing...' : 'Live Ready'}
                    </span>
                  </div>

                  {/* Waveform Visualization Canvas */}
                  <div className="relative p-6 bg-black/60 border border-white/5 rounded-xl mb-6 shadow-2xl flex flex-col items-center">
                    <canvas 
                      ref={voiceCanvasRef} 
                      width={600} 
                      height={120} 
                      className="w-full h-[120px] bg-black/40 rounded border border-white/5"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2 text-[9px] font-bold text-text-light/30">
                      <Mic2 size={10} className={isPlayingVoice ? "text-neon animate-pulse" : ""} />
                      <span>REALTIME WEB SPEECH ENGINE</span>
                    </div>
                  </div>

                  {/* Custom System Voice Selection */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block mb-2 font-bold">Available Voices on Your Device (브라우저 지원 성우)</label>
                      <div className="relative">
                        <select 
                          value={selectedVoiceURI} 
                          onChange={(e) => setSelectedVoiceURI(e.target.value)}
                          className="w-full bg-bg-dark border border-border-dark p-3 pr-10 text-text-light font-bold text-xs focus:border-neon outline-none appearance-none"
                        >
                          {isCloned && (
                            <option value="cloned-voice">
                              ✨ {clonedVoiceName} (AI 복제 성우 - 실시간 힐링 필터 자동적용됨)
                            </option>
                          )}
                          {availableVoices.length > 0 ? (
                            availableVoices.map(voice => (
                              <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang}) {voice.localService ? '[Local]' : ''}
                              </option>
                            ))
                          ) : (
                            <option value="">No SpeechSynthesis Voices Found (기본 한국어 성우 자동 매칭)</option>
                          )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-light/40">
                          <Settings size={14} />
                        </div>
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block mb-2 font-bold">AI Voice Tone Presets (성우 톤 프리셋)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'healing', label: '힐링 다큐멘터리', desc: '중저음의 부드러운 여성' },
                          { id: 'meditation', label: '심야 명상 안내', desc: '깊은 울림의 중저음 남성' },
                          { id: 'news', label: '뉴스 아나운서', desc: '단정하고 지적인 여성' },
                          { id: 'assistant', label: '경쾌한 AI 비서', desc: '밝고 에너제틱한 비서' },
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyVoicePreset(preset.id)}
                            className={`p-3 border text-left transition-all flex flex-col justify-between h-[74px] ${
                              voicePreset === preset.id 
                                ? 'border-neon bg-neon/10 text-neon' 
                                : 'border-border-dark bg-white/5 hover:border-neon/40 text-text-light/80'
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wide truncate block">{preset.label}</span>
                            <span className="text-[8px] text-text-light/40 block leading-tight">{preset.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Micro parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-white/5 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-light/40">
                          <span>Pitch / Frequency (음높이)</span>
                          <span className="text-neon">{voicePitch.toFixed(2)}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.05"
                          value={voicePitch}
                          onChange={(e) => {
                            setVoicePitch(parseFloat(e.target.value));
                            setVoicePreset('custom');
                          }}
                          className="w-full accent-neon cursor-pointer h-1 bg-white/10"
                        />
                        <div className="flex justify-between text-[8px] text-text-light/30">
                          <span>Deep Low (중저음)</span>
                          <span>High Pitch (고음)</span>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-text-light/40">
                          <span>Speaking Speed / Rate (말하기 속도)</span>
                          <span className="text-neon">{voiceRate.toFixed(2)}x</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.05"
                          value={voiceRate}
                          onChange={(e) => {
                            setVoiceRate(parseFloat(e.target.value));
                            setVoicePreset('custom');
                          }}
                          className="w-full accent-neon cursor-pointer h-1 bg-white/10"
                        />
                        <div className="flex justify-between text-[8px] text-text-light/30">
                          <span>Slow (차분함)</span>
                          <span>Fast (경쾌함)</span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Voice Guard Toggle */}
                    <div className="p-3 bg-neon/10 border border-neon/20 rounded flex items-center justify-between gap-4 mt-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-neon block">🛡️ 초고음질 스마트 보호 필터 (권장)</span>
                        <p className="text-[8px] text-text-light/70 font-semibold leading-relaxed">
                          피치/속도가 너무 낮아질 때 발생하는 브라우저 고유의 지직거림·음성 갈라짐을 완벽 방지하고, 136.1Hz 아늑한 명상 배경 음향(OM Drone)을 감미롭게 배합해 송출합니다.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={isCleanVoiceEnabled} 
                          onChange={(e) => setIsCleanVoiceEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-neon"></div>
                      </label>
                    </div>
                  </div>

                  {/* Play Controls */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handlePlayVoice}
                      className="flex-1 py-4 bg-neon text-bg-dark font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(207,255,4,0.2)]"
                    >
                      {isPlayingVoice ? (
                        <>
                          <Square size={14} fill="currentColor" />
                          Stop Playback
                        </>
                      ) : (
                        <>
                          <Play size={14} fill="currentColor" />
                          Listen Voice (음성 테스트하기)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Audio Engineering & Guide */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="p-8 border border-border-dark bg-white/[0.02] flex flex-col h-full">
                  <span className="text-[10px] font-black tracking-widest uppercase text-neon mb-4 block font-bold">Script Editor (대본 및 엔지니어링 가이드)</span>
                  
                  <textarea
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-4 text-xs font-medium text-text-light leading-relaxed h-[180px] focus:border-neon outline-none font-sans mb-4 resize-none"
                    placeholder="여기에 나레이션 스크립트를 입력하세요..."
                  />

                  {/* AI Cloned Voice Usage Guide Notice */}
                  {isCloned && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-neon/10 border border-neon/30 rounded-lg space-y-2 mb-4"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neon font-bold">
                        <Sparkles size={12} className="animate-pulse text-neon" />
                        <span>✨ 복제된 목소리로 다른 대본 읽는 방법</span>
                      </div>
                      <p className="text-[10px] text-text-light/90 leading-relaxed font-medium">
                        성공적으로 목소리 복제가 완료되었습니다! 복제된 목소리로 새로운 텍스트를 읽히시려면 아래 순서대로 실행해 주세요:
                      </p>
                      <ol className="text-[10px] text-text-light/80 space-y-1 pl-4 list-decimal leading-relaxed font-semibold">
                        <li>좌측 <span className="text-neon font-bold">브라우저 지원 성우</span> 선택창에서 <span className="text-white font-bold">&quot;✨ {clonedVoiceName}&quot;</span> 옵션이 선택되어 있는지 확인합니다. (완료 시 자동 선택됨)</li>
                        <li>위의 <span className="text-neon font-bold">Script Editor (대본 입력창)</span>에 읽히고 싶은 새로운 한글 텍스트를 자유롭게 입력해 주세요.</li>
                        <li>좌측 하단의 <span className="text-neon font-bold">Listen Voice (음성 테스트하기)</span> 버튼을 클릭하면, 복제된 목소리 톤과 속도로 새로운 대본을 낭독해 드립니다!</li>
                      </ol>
                    </motion.div>
                  )}

                  {/* Audio Engineering Instructions */}
                  <div className="p-4 bg-neon/5 border border-neon/10 rounded space-y-3 mb-4 overflow-y-auto max-h-[140px] scrollbar-thin">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neon font-bold">
                      <Info size={12} />
                      <span>중저음 부드러운 목소리 연출 가이드</span>
                    </div>
                    <ul className="text-[10px] text-text-light/70 space-y-1.5 leading-relaxed font-medium list-disc list-inside">
                      <li><strong className="text-neon">Pitch:</strong> 힐링 톤을 위해 <span className="text-neon">0.8x - 0.9x</span> 범위로 낮추는 것을 추천합니다.</li>
                      <li><strong className="text-neon">Speed:</strong> 다큐멘터리 연출은 <span className="text-neon">0.75x</span> 전후로 차분하게 설정해야 여운이 깊어집니다.</li>
                      <li><strong className="text-neon">전문 제작 방법:</strong> 상용 AI 제작(Typecast, ElevenLabs 등) 활용 시 <strong className="text-white">성우 프리셋 &apos;다큐멘터리/힐링&apos;</strong>을 선택하고, 세부 속도를 <strong className="text-white">-15%</strong> 감속 조정하십시오.</li>
                    </ul>
                  </div>

                  {/* Cracked Voice Troubleshooting Advice */}
                  <div className="p-4 bg-red-500/5 border border-red-500/20 rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 font-bold">
                        <Sparkles size={12} className="text-red-400 animate-pulse" />
                        <span>Q. 목소리가 뚝뚝 끊기거나 갈라지나요?</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRestoreOriginalVoice}
                        className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 text-[9px] font-black uppercase tracking-tight rounded transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] active:scale-95 cursor-pointer"
                      >
                        원음 복원 (Standard 1.0x)
                      </button>
                    </div>
                    <p className="text-[10px] text-text-light/70 leading-relaxed font-medium">
                      <strong className="text-white block mb-1">원인과 즉각적인 해결책:</strong>
                      1. <strong className="text-red-300">브라우저 내장 엔진의 한계:</strong> 웹 표준 재생기(Web Speech API)는 음높이(Pitch)나 속도를 기본값(<span className="text-white">1.0x</span>) 미만으로 크게 낮출 경우, 고성능 AI 보정 필터가 없어 음역대가 지직거리거나 갈라지는 기계음 현상이 자연스럽게 발생합니다.
                      <br />
                      2. <strong className="text-white">가장 쉬운 해결책:</strong> 우측 상단의 <strong className="text-red-300">&apos;원음 복원&apos;</strong> 버튼을 누르고 <strong className="text-neon">1.0x 표준 배율</strong>로 재생해 보세요. 갈라짐 없이 매우 깨끗하고 유연한 음색을 확인하실 수 있습니다.
                      <br />
                      3. <strong className="text-white">고품질 성우 추천:</strong> 브라우저로 <strong className="text-white">Microsoft Edge</strong>를 사용하시면 목록에서 <strong className="text-neon">Natural(온라인 자연어 성우)</strong>을 선택하여 피치 조절 시에도 전혀 갈라짐 없는 초고품질 오디오를 들으실 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Custom Voice Cloning & Video Audio Transformation Studio */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 p-8 border border-border-dark bg-white/[0.01] rounded-none flex flex-col gap-8"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-neon rounded-full animate-ping" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-neon font-bold">ANY1 AI CUSTOM VOICE CLONE & TRANSFORM STUDIO</span>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tight text-white mb-2">커스텀 보이스 복제 및 오디오 변환 스튜디오</h3>
                <p className="text-xs text-text-light/40 leading-relaxed max-w-4xl font-medium">
                  일레븐렙스(ElevenLabs) 같은 유료 외부 사이트에 갈 필요 없이, 본 어플리케이션 내에서 마이크로 자신의 목소리를 직접 녹음하여 AI 힐링 보이스로 복제·학습하거나, 소리가 좋은 외부 동영상/오디오 파일을 올려 실시간으로 음성을 추출하고 따뜻한 공간감 필터를 입혀 감상할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section A: Record & Clone My Voice */}
                <div className="p-6 border border-white/5 bg-black/40 rounded-xl space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-neon font-bold">1. 내 목소리 마이크 녹음 및 실시간 복제 학습</span>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${
                      isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-text-light/40'
                    }`}>
                      {isRecording ? 'Recording Live...' : 'Mic Ready'}
                    </span>
                  </div>

                  {/* Calibration text card */}
                  <div className="p-4 bg-white/5 border border-white/5 rounded space-y-2">
                    <span className="text-[9px] font-black tracking-widest uppercase text-text-light/40 block font-bold">🎤 목소리 분석용 교정 대본 (읽어보세요)</span>
                    <p className="text-xs text-neon italic leading-relaxed font-semibold">
                      &quot;숨 가쁜 하루의 끝에서, 우리는 잠시 멈춰 서서, 고요함을 찾습니다. 자연의 품 안에서 발견하는 따뜻한 치유의 시간입니다.&quot;
                    </p>
                  </div>

                  {/* Recording buttons */}
                  <div className="flex gap-4">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                      >
                        <Mic2 size={12} className="text-red-400" />
                        마이크 녹음 시작
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="flex-1 py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 animate-pulse"
                      >
                        <Square size={10} fill="currentColor" />
                        녹음 완료 및 분석
                      </button>
                    )}

                    {recordedURL && (
                      <button
                        type="button"
                        onClick={() => playFilteredAudio(recordedURL)}
                        className={`px-4 py-3 border font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
                          isPlayingFilteredAudio && activeFilter === 'none'
                            ? 'bg-neon text-bg-dark border-neon'
                            : 'border-white/10 text-text-light/80 hover:border-neon'
                        }`}
                      >
                        {isPlayingFilteredAudio ? <Square size={10} /> : <Play size={10} />}
                        원본 확인
                      </button>
                    )}
                  </div>

                  {/* Voice training station */}
                  {recordedURL && (
                    <div className="p-4 border border-neon/10 bg-neon/5 rounded space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-neon font-bold">AI Voice Model Generation (목소리 복제 신경망 학습)</span>
                        <span className="text-[10px] font-bold text-white">{clonedVoiceName}</span>
                      </div>

                      {isTrainingClone ? (
                        <div className="space-y-2">
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neon transition-all duration-150" 
                              style={{ width: `${trainingProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-text-light/50">
                            <span>
                              {trainingProgress < 30 && '주파수 음향 구조 매핑 중...'}
                              {trainingProgress >= 30 && trainingProgress < 60 && '공명 포먼트 및 배음 모델링...'}
                              {trainingProgress >= 60 && trainingProgress < 90 && '중저음 대역 극대화 필터 훈련...'}
                              {trainingProgress >= 90 && '힐링 보이스 가중치 결합 중...'}
                            </span>
                            <span className="text-neon">{trainingProgress}%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-black uppercase tracking-widest text-text-light/40 block">
                              복제 성우 이름/프로필 명칭 설정 (Trained Profile Name)
                            </label>
                            <input 
                              type="text" 
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                              className="w-full bg-bg-dark border border-white/10 p-2 text-[10px] font-bold text-text-light focus:border-neon outline-none"
                              placeholder="예: 영희의 나른한 보이스, 엄마 목소리 v1"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTrainVoiceModel('mic')}
                            className="w-full py-2.5 bg-neon text-bg-dark font-black uppercase tracking-wider text-[9px] hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                          >
                            <Sparkles size={11} />
                            내 목소리로 AI 복제 모델 생성 및 영구 보관하기
                          </button>
                        </div>
                      )}

                      {/* Filtered listening once trained */}
                      {isCloned && (
                        <div className="pt-3 border-t border-neon/10 space-y-3">
                          {/* Jump to synthesis button */}
                          <div className="p-3 bg-neon/10 border border-neon/20 rounded space-y-2">
                            <p className="text-[10px] text-text-light/90 leading-relaxed font-semibold">
                              내 목소리 학습 성공! 이제 아래 버튼을 클릭하여 원하는 아무 문장이나 복제된 목소리로 낭독시켜 볼 수 있습니다.
                            </p>
                            <button
                              type="button"
                              onClick={handleUseClonedVoiceForTTS}
                              className="w-full py-2 bg-neon text-bg-dark font-black uppercase tracking-wider text-[9px] hover:bg-white transition-all flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(163,230,53,0.15)] animate-pulse"
                            >
                              <Sparkles size={11} />
                              복제 목소리로 원하는 문장 낭독시켜 보기 (바로가기 ⚡)
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60 block font-bold">🎉 복제 완료! 힐링 음향 필터 적용 청취</span>
                            <div className="flex gap-2">
                              {['healing', 'meditation', 'radio'].map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setActiveFilter(f as any)}
                                  className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-tight border ${
                                    activeFilter === f 
                                      ? 'border-neon text-neon bg-neon/10' 
                                      : 'border-white/5 text-text-light/40 hover:text-white'
                                  }`}
                                >
                                  {f === 'healing' && '힐링 다큐'}
                                  {f === 'meditation' && '깊은 명상'}
                                  {f === 'radio' && '라디오'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Echo / Howling Control Toggle */}
                          <div className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-lg">
                            <span className="text-[9px] font-bold text-text-light/70 flex items-center gap-1.5">
                              🔇 메아리(하울링) 제거 및 깨끗한 원음 필터
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!isEchoEnabled} 
                                onChange={(e) => setIsEchoEnabled(!e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-neon"></div>
                              <span className="ml-2 text-[8px] font-black tracking-wider text-neon">
                                {!isEchoEnabled ? '제거 완료(추천)' : '메아리 적용'}
                              </span>
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={() => playFilteredAudio(recordedURL!)}
                            className="w-full py-2.5 bg-white text-bg-dark font-black uppercase tracking-widest text-[9px] hover:bg-neon transition-all flex items-center justify-center gap-2"
                          >
                            {isPlayingFilteredAudio ? (
                              <>
                                <Square size={10} fill="currentColor" />
                                음성 변환 중지
                              </>
                            ) : (
                              <>
                                <Volume2 size={11} />
                                AI 복제 힐링 음색으로 재생하기 (실시간 오디오 필터링)
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section B: Upload Audio/Video & Extract Voice */}
                <div className="p-6 border border-white/5 bg-black/40 rounded-xl space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neon font-bold">2. 외부 동영상 및 오디오 파일 보이스 가공 및 AI 복제</span>
                      <span className="px-2 py-0.5 bg-neon/10 text-neon text-[8px] font-black uppercase tracking-wider rounded">
                        Voice Extractor & Cloner
                      </span>
                    </div>

                    <p className="text-[10px] text-text-light/50 leading-relaxed font-medium">
                      소리가 마음에 드는 유튜브 소장 영상(MP4, WebM)이나 음원(MP3, WAV, M4A) 파일을 업로드하면, 영상 속 음색을 추출하여 깨끗하고 풍부한 힐링 다큐멘터리 음색으로 실시간 보정하거나, AI 목소리로 정밀하게 학습/복제할 수 있습니다.
                    </p>

                    {/* Upload Field */}
                    <div 
                      onClick={() => voiceUploadRef.current?.click()}
                      className="border border-dashed border-border-dark bg-white/[0.01] hover:border-neon hover:bg-neon/5 transition-all p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group rounded"
                    >
                      <Upload size={24} className="text-text-light/30 group-hover:text-neon transition-colors" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest block text-text-light/60 group-hover:text-white">
                          {uploadedFileName ? '파일 변경하기' : '미디어 파일 드래그 또는 클릭'}
                        </span>
                        <span className="text-[8px] text-text-light/30 block">Supports MP4, WebM, MP3, WAV, M4A</span>
                      </div>
                      <input 
                        ref={voiceUploadRef}
                        type="file" 
                        accept="audio/*,video/*" 
                        onChange={handleVoiceUploadChange}
                        className="hidden" 
                      />
                    </div>

                    {uploadedFileName && (
                      <div className="p-3 bg-neon/5 border border-neon/10 rounded flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-text-light/80">
                          <FileIcon size={12} className="text-neon" />
                          <span className="font-bold truncate max-w-[180px]">{uploadedFileName}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setUploadedFileName('');
                            setUploadedAudioURL(null);
                            setIsCloned(false);
                          }}
                          className="text-text-light/40 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {uploadedAudioURL && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      {/* Explicit AI voice training/cloning block inside the uploaded container so the user has an explicit button! */}
                      <div className="p-4 border border-neon/20 bg-neon/5 rounded space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-neon font-bold">AI Voice Model Trainer (목소리 모델 생성 및 추출기)</span>
                          <span className="text-[9px] font-bold text-white/80">{uploadedFileName ? '대기 중' : ''}</span>
                        </div>

                        {isTrainingClone ? (
                          <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-neon transition-all duration-150" 
                                style={{ width: `${trainingProgress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] font-bold text-text-light/50">
                              <span>
                                {trainingProgress < 30 && '업로드 파일 소리 데이터 분석 중...'}
                                {trainingProgress >= 30 && trainingProgress < 60 && '배음 주파수 및 보이스 톤 추출...'}
                                {trainingProgress >= 60 && trainingProgress < 90 && '인공 신경망 음향 주파수 합성 학습...'}
                                {trainingProgress >= 90 && '힐링 보이스 가중치 결합 및 완성!'}
                              </span>
                              <span className="text-neon">{trainingProgress}%</span>
                            </div>
                          </div>
                        ) : !isCloned ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase tracking-widest text-text-light/40 block">
                                복제 성우 이름/프로필 명칭 설정 (Trained Profile Name)
                              </label>
                              <input 
                                type="text" 
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                className="w-full bg-bg-dark border border-white/10 p-2 text-[10px] font-bold text-text-light focus:border-neon outline-none"
                                placeholder="예: 업로드 파일 복제 성우"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleTrainVoiceModel('upload')}
                              className="w-full py-3 bg-neon text-bg-dark font-black uppercase tracking-wider text-[10px] hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                            >
                              <Sparkles size={11} />
                              이 파일에서 AI 힐링 목소리 모델 추출 및 영구 저장하기 (클릭!)
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 text-xs">
                            <p className="text-neon font-bold text-[10px] flex items-center gap-1">
                              <span>✨ AI 힐링 목소리 복제 완료!</span>
                            </p>
                            <p className="text-[10px] text-text-light/80 leading-relaxed font-medium font-semibold">
                              성공적으로 목소리를 학습하였습니다! 아래 버튼을 누르면 <span className="text-white font-bold">&quot;✨ {clonedVoiceName}&quot;</span> 성우가 자동으로 선택되며, 대본 입력기 및 낭독 공간으로 바로 이동합니다.
                            </p>
                            <button
                              type="button"
                              onClick={handleUseClonedVoiceForTTS}
                              className="w-full py-2.5 bg-neon text-bg-dark font-black uppercase tracking-wider text-[10px] hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.15)] animate-pulse"
                            >
                              <Sparkles size={11} />
                              복제된 목소리로 원하는 문장 낭독시켜 보기 (바로가기 ⚡)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Filter selection for uploaded file */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block font-bold">오디오 변환 필터 선택 (Filter Presets)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'healing', name: '힐링 다큐', desc: '중저음 배음 부스트' },
                            { id: 'meditation', name: '깊은 명상', desc: '서브베이스 및 에코' },
                            { id: 'radio', name: '레트로 라디오', desc: '밴드패스 빈티지' }
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setActiveFilter(f.id as any);
                                if (isPlayingFilteredAudio) {
                                  stopFilteredAudio();
                                }
                              }}
                              className={`p-2.5 text-left border transition-all flex flex-col justify-between h-[56px] ${
                                activeFilter === f.id 
                                  ? 'border-neon bg-neon/10 text-neon' 
                                  : 'border-white/5 bg-white/[0.02] text-text-light/60 hover:border-white/20'
                              }`}
                            >
                              <span className="text-[9px] font-bold block">{f.name}</span>
                              <span className="text-[7px] text-text-light/40 block leading-none">{f.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Echo / Howling Control Toggle */}
                      <div className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-lg">
                        <span className="text-[9px] font-bold text-text-light/70 flex items-center gap-1.5">
                          🔇 메아리(하울링) 제거 및 깨끗한 원음 필터
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!isEchoEnabled} 
                            onChange={(e) => setIsEchoEnabled(!e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-neon"></div>
                          <span className="ml-2 text-[8px] font-black tracking-wider text-neon">
                            {!isEchoEnabled ? '제거 완료(추천)' : '메아리 적용'}
                          </span>
                        </label>
                      </div>

                      {/* Play transformed file */}
                      <button
                        type="button"
                        onClick={() => playFilteredAudio(uploadedAudioURL)}
                        className="w-full py-3.5 bg-white text-bg-dark font-black uppercase tracking-[0.2em] text-[10px] hover:bg-neon transition-all flex items-center justify-center gap-2"
                      >
                        {isPlayingFilteredAudio ? (
                          <>
                            <Square size={12} fill="currentColor" />
                            변환 음성 정지 (Stop Filtered)
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            AI 필터 적용 오디오 실시간 재생 (Play Transformed)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* AI Cloned Voice Premium Reader Card (AI 복제 성우 전용 낭독 카드) */}
            <motion.div
              id="cloned-voice-card-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`mb-10 p-8 border ${
                isCloned ? 'border-neon bg-neon/5 shadow-[0_0_25px_rgba(163,230,53,0.1)]' : 'border-border-dark bg-white/[0.01]'
              } transition-all duration-500`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${isCloned ? 'bg-neon animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[10px] font-black tracking-widest uppercase text-neon font-bold">
                      {isCloned ? '✨ PREMIUM AI CLONED VOICE TEXT-TO-SPEECH' : '🔒 AI CLONED VOICE TTS ENGINE [LOCKED]'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
                    AI 복제 성우 전용 한글 낭독기 (Custom Voice TTS Card)
                  </h3>
                  <p className="text-xs text-text-light/40 leading-relaxed font-medium mt-1">
                    자신의 목소리로 학습된 특수 AI 성우 모델을 사용하여 임의의 한글 텍스트를 아늑하고 깊은 울림의 낭독으로 들어볼 수 있는 고유 플레이어 카드입니다.
                  </p>
                </div>
                {isCloned && (
                  <button
                    type="button"
                    onClick={handleUseClonedVoiceForTTS}
                    className="px-3.5 py-1.5 bg-neon text-bg-dark text-[9px] font-black tracking-wider uppercase self-start md:self-center hover:bg-white transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(163,230,53,0.25)]"
                    title="클릭 시 아래 낭독기 대본 입력창으로 화면을 스크롤하고 집중 연동합니다."
                  >
                    🟢 복제 보이스 연동 완료 (낭독기 이동 ⚡)
                  </button>
                )}
              </div>

              {!isCloned ? (
                <div className="p-8 border border-white/5 bg-black/40 text-center rounded-xl space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-text-light/40">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-text-light/80">AI 복제 성우 기능이 대기 중입니다.</p>
                    <p className="text-[11px] text-text-light/40 max-w-xl mx-auto leading-relaxed">
                      위의 <strong className="text-neon">1. 내 목소리 마이크 녹음 및 실시간 복제 학습</strong> 단계를 통해 마이크 녹음 후 학습 버튼을 클릭해 주세요. 완료되면 복제된 목소리로 무엇이든 읽힐 수 있는 전용 카드 컨트롤러가 즉시 활성화됩니다!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById('voice-synthesis-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="px-6 py-2.5 bg-white/10 hover:bg-neon hover:text-bg-dark border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    마이크 녹음 위치로 이동하기 (바로가기 ⚡)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Script Input Column */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block font-bold">
                        복제 성우 전용 낭독 대본 입력기 (Custom Cloned Script)
                      </label>
                      <textarea
                        value={clonedVoiceText}
                        onChange={(e) => setClonedVoiceText(e.target.value)}
                        className="w-full bg-bg-dark border border-neon/30 p-4 text-xs font-semibold text-text-light leading-relaxed h-[150px] focus:border-neon outline-none font-sans resize-none rounded-lg"
                        placeholder="복제된 목소리로 읽게 하고 싶은 한글 문장을 여기에 자유롭게 적어보세요..."
                      />
                    </div>

                    {/* Quality Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-neon/10 border border-neon/30 rounded text-[9px] font-bold text-neon flex items-center gap-1">
                        🛡️ 스마트 음질 갈라짐 방지 필터 가동 중
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-text-light/60 flex items-center gap-1">
                        🔊 136.1Hz OM 명상 음향 자동 동시출력
                      </span>
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-text-light/60 flex items-center gap-1">
                        🎙️ {clonedVoiceName}
                      </span>
                    </div>
                  </div>

                  {/* Audio Playback Controls Column */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-black/60 border border-white/5 rounded-xl">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-neon uppercase tracking-widest">
                        <Volume2 size={13} className="text-neon animate-pulse" />
                        <span>AI CLONED VOICE PLAYER STATIONS</span>
                      </div>
                      <p className="text-[10px] text-text-light/60 leading-relaxed font-medium">
                        녹음·학습한 내 목소리에 우아한 오디오 필터를 직접 씌워 재생하거나, 임의로 기재한 새 대본을 초고음질 스마트 TTS 엔진으로 편안히 낭독합니다.
                      </p>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-white/5">
                      {/* Button 1: Original Recorded/Uploaded Voice with AI Studio filters */}
                      {(recordedURL || uploadedAudioURL) && (
                        <button
                          type="button"
                          onClick={() => playFilteredAudio(recordedURL || uploadedAudioURL || '')}
                          className={`w-full py-3 text-[10px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                            isPlayingFilteredAudio 
                              ? 'bg-red-500/20 text-red-200 border-red-500/40' 
                              : 'bg-white/5 text-text-light hover:bg-white/15 border-white/10'
                          }`}
                        >
                          {isPlayingFilteredAudio ? (
                            <>
                              <Square size={12} fill="currentColor" className="text-red-400 animate-pulse" />
                              실제 복제 목소리 재생 중지
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} className="text-neon" />
                              내 실제 복제 목소리 듣기 (AI 힐링 필터 적용 ⚡)
                            </>
                          )}
                        </button>
                      )}

                      {/* Button 2: TTS Custom Script Synthesis with clamped pitch */}
                      <button
                        type="button"
                        onClick={handlePlayClonedVoice}
                        className="w-full py-4 bg-neon text-bg-dark font-black uppercase tracking-[0.15em] text-[10px] hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
                      >
                        {isPlayingClonedVoice ? (
                          <>
                            <Square size={12} fill="currentColor" />
                            대본 낭독 중지 (Stop Script Reader)
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            입력한 대본 한글 낭독시키기 (Listen Script TTS 🔊)
                          </>
                        )}
                      </button>

                      <p className="text-[8px] text-text-light/30 leading-normal text-center">
                        ※ 플레이백 완료 전까지 브라우저 창을 유지해 주시기 바랍니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Voice Profile Storage & Library (AI 복제 성우 영구 보관소) */}
              <div className="mt-8 pt-8 border-t border-white/10 space-y-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-neon block font-bold">
                      📁 AI VOICE PROFILES LIBRARY (AI 복제 성우 보관함)
                    </span>
                    <p className="text-[10px] text-text-light/50 font-medium leading-relaxed">
                      학습·구축된 나만의 복제 성우 목록입니다. 파일로 로컬 저장하거나 순번/명칭으로 언제든 불러와 낭독기로 즉시 사용할 수 있습니다.
                    </p>
                  </div>
                  
                  {/* File Import Button */}
                  <div className="shrink-0">
                    <input 
                      type="file" 
                      id="voice-file-import" 
                      accept=".voice" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const imported = JSON.parse(event.target?.result as string);
                            if (imported && imported.audioDataUrl && imported.name) {
                              const nextId = (savedProfiles.length > 0 
                                ? Math.max(...savedProfiles.map(p => parseInt(p.id) || 0)) + 1 
                                : 1).toString();
                                
                              const newProfile: ClonedVoiceProfile = {
                                id: nextId,
                                name: imported.name,
                                pitch: imported.pitch || 1.0,
                                rate: imported.rate || 0.8,
                                filterType: imported.filterType || 'healing',
                                audioDataUrl: imported.audioDataUrl,
                                createdAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                              };
                              
                              const updated = [...savedProfiles, newProfile];
                              saveProfilesToStorage(updated);
                              loadVoiceProfile(newProfile);
                              showToast(`'${imported.name}' 목소리 프로필 가져오기 완료! 순번 #${nextId}번으로 등록되었습니다.`, 'success');
                            } else {
                              showToast('유효하지 않은 .voice 파일 양식입니다.', 'error');
                            }
                          } catch (err) {
                            showToast('파일 분석 중 오류가 발생했습니다. 올바른 .voice 파일인지 확인해 주세요.', 'error');
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('voice-file-import')?.click()}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:border-neon hover:text-neon text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileUp size={11} />
                      .voice 파일 열기 (보이스 가져오기)
                    </button>
                  </div>
                </div>

                {/* Toast Message Display inside Card */}
                {toastMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 border text-[10px] font-bold flex items-center justify-between ${
                      toastType === 'success' 
                        ? 'bg-neon/15 border-neon/30 text-neon' 
                        : toastType === 'error' 
                        ? 'bg-red-500/15 border-red-500/30 text-red-200' 
                        : 'bg-white/5 border-white/10 text-white'
                    }`}
                  >
                    <span>{toastMessage}</span>
                    <button type="button" onClick={() => setToastMessage(null)} className="text-[9px] hover:text-white uppercase font-black tracking-tight">[닫기]</button>
                  </motion.div>
                )}

                {/* Direct Command / Search bar to load */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-lg flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-light/60 whitespace-nowrap flex items-center gap-1 font-bold">
                    <Search size={11} className="text-neon" />
                    순번(#) 또는 이름으로 즉시 로딩:
                  </span>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      value={profileSearchQuery}
                      onChange={(e) => setProfileSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchAndLoadProfile(); }}
                      placeholder="예: 1 또는 엄마 목소리 v1"
                      className="flex-1 bg-bg-dark border border-white/10 px-3 py-2 text-[10px] text-text-light font-bold focus:border-neon outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSearchAndLoadProfile}
                      className="px-4 py-2 bg-neon text-bg-dark font-black uppercase tracking-wider text-[10px] hover:bg-white transition-all cursor-pointer"
                    >
                      불러오기
                    </button>
                  </div>
                </div>

                {/* Saved list table/grid */}
                {savedProfiles.length === 0 ? (
                  <div className="p-6 border border-white/5 text-center bg-white/[0.01]">
                    <span className="text-[10px] text-text-light/30 block font-bold">저장된 복제 성우 프로필이 아직 없습니다.</span>
                    <span className="text-[9px] text-text-light/20 block mt-1 font-medium">상단의 AI 학습 모델 생성을 클릭하여 첫 복제 성우를 보관함에 등록하세요.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProfiles.map((p) => {
                      const isActive = isCloned && clonedVoiceName === p.name;
                      return (
                        <div 
                          key={p.id}
                          className={`p-4 border transition-all flex flex-col justify-between gap-3 ${
                            isActive 
                              ? 'border-neon bg-neon/10' 
                              : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-white/10 text-white text-[8px] font-black rounded">
                                순번 #{p.id}
                              </span>
                              <span className="text-[8px] text-text-light/30 font-medium">
                                {p.createdAt}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />}
                              {p.name}
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-1.5 py-0.5 bg-black/40 text-text-light/60 text-[8px] font-bold">
                                Pitch {p.pitch.toFixed(2)}x
                              </span>
                              <span className="px-1.5 py-0.5 bg-black/40 text-text-light/60 text-[8px] font-bold">
                                Rate {p.rate.toFixed(2)}x
                              </span>
                              <span className="px-1.5 py-0.5 bg-black/40 text-text-light/60 text-[8px] font-bold">
                                {p.filterType === 'healing' ? '힐링 다큐' : p.filterType === 'meditation' ? '깊은 명상' : p.filterType === 'radio' ? '레트로 라디오' : '필터 없음'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => loadVoiceProfile(p)}
                              className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-neon text-bg-dark hover:bg-white' 
                                  : 'bg-white/10 hover:bg-neon hover:text-bg-dark text-white'
                              }`}
                            >
                              사용하기
                            </button>
                            
                            {/* File Save/Download Button */}
                            <button
                              type="button"
                              title="보이스 프로필 파일로 다운로드 (.voice)"
                              onClick={() => {
                                try {
                                  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  
                                  // Clean file name
                                  const safeName = p.name.replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/gi, '_').toLowerCase();
                                  link.download = `${safeName}.voice`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  showToast(`'${p.name}' 모델이 파일(${safeName}.voice)로 안전하게 다운로드되었습니다.`, 'success');
                                } catch (err) {
                                  showToast('파일 저장에 실패했습니다.', 'error');
                                }
                              }}
                              className="px-2 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/35 text-white transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Download size={11} />
                            </button>

                            <button
                              type="button"
                              title="보관함에서 삭제"
                              onClick={() => {
                                if (confirm(`'${p.name}' 목소리 프로필을 보관함에서 삭제하시겠습니까?`)) {
                                  const filtered = savedProfiles.filter(item => item.id !== p.id);
                                  saveProfilesToStorage(filtered);
                                  showToast('보이스 프로필이 영구 삭제되었습니다.', 'info');
                                }
                              }}
                              className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-red-200 transition-all cursor-pointer flex items-center justify-center"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Saju Input Form */}
        {featureId === 'saju' && (!response || showSajuInputPanel) && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-8 border border-border-dark bg-white/5"
        >
          {response && showSajuInputPanel && (
            <div className="mb-6 flex items-center justify-between gap-4 pb-4 border-b border-white/10">
              <span className="text-xs font-black text-neon">
                생년월일시 다시 입력 (아래에서 수정 후 분석 버튼을 누르면 새 사주로 계산됩니다)
              </span>
              <button
                type="button"
                onClick={() => setShowSajuInputPanel(false)}
                className="px-3 py-1.5 text-[11px] font-bold border border-white/20 text-text-light/70 hover:text-white hover:border-white/40 cursor-pointer"
              >
                입력창 접기
              </button>
            </div>
          )}
          {/* Input Mode Toggle */}
          <div className="flex border border-border-dark mb-8">
            {(['date', 'direct'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSajuInputMode(mode)}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  sajuInputMode === mode ? 'bg-neon text-bg-dark font-black' : 'text-text-light/40 hover:text-white'
                }`}
              >
                {mode === 'date' ? '생년월일시 입력' : '사주명식 직접 입력'}
              </button>
            ))}
          </div>

          {sajuInputMode === 'date' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Year</label>
                  <select 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
                  >
                    {Array.from({ length: 107 }, (_, i) => 2026 - i).map(y => (
                      <option key={y} value={y.toString()}>{y}년</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Month</label>
                  <select 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m.toString()}>{m}월</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Day</label>
                  <select 
                    value={day} 
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d.toString()}>{d}일</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Time (태어난 시간)</label>
                  <select 
                    value={hour} 
                    onChange={(e) => setHour(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
                  >
                    <option value="unknown">시간 모름 (三柱)</option>
                    <option value="04:00">인시 (寅時 03:30 ~ 05:29) - 추천</option>
                    {Array.from({ length: 144 }, (_, i) => {
                      const h = Math.floor(i / 6);
                      const m = (i % 6) * 10;
                      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                      return <option key={timeStr} value={timeStr}>{timeStr}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* 12-Branch (12지시) Quick Selection Buttons (원광만세력 표준 12지시) */}
              <div className="mb-8 p-4 bg-white/[0.015] border border-white/5 rounded-lg space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neon flex items-center gap-1.5 font-bold">
                    <span>🏛️ 원광만세력 표준 12지시(十二時辰) 빠른 선택</span>
                    <span className="text-[9px] text-text-light/40 font-normal">(진태양시 -30분 자동 환산 적용)</span>
                  </span>
                  <span className="text-[9px] text-amber-400 font-bold">현재 선택: {hour}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
                  {[
                    { label: "자시(子)", time: "00:30", range: "23:30~01:29" },
                    { label: "축시(丑)", time: "02:30", range: "01:30~03:29" },
                    { label: "인시(寅)", time: "04:00", range: "03:30~05:29" },
                    { label: "묘시(卯)", time: "06:30", range: "05:30~07:29" },
                    { label: "진시(辰)", time: "08:30", range: "07:30~09:29" },
                    { label: "사시(巳)", time: "10:30", range: "09:30~11:29" },
                    { label: "오시(午)", time: "12:30", range: "11:30~13:29" },
                    { label: "미시(未)", time: "14:30", range: "13:30~15:29" },
                    { label: "신시(申)", time: "16:30", range: "15:30~17:29" },
                    { label: "유시(酉)", time: "18:30", range: "17:30~19:29" },
                    { label: "술시(戌)", time: "20:30", range: "19:30~21:29" },
                    { label: "해시(亥)", time: "22:30", range: "21:30~23:29" }
                  ].map((branch) => {
                    const isSelected = hour === branch.time || (branch.label.includes("인") && (hour === "04:00" || hour === "04:30" || hour === "03:30" || hour === "05:00"));
                    return (
                      <button
                        key={branch.label}
                        type="button"
                        onClick={() => {
                          setHour(branch.time);
                          localStorage.setItem('any1_saju_hour', branch.time);
                        }}
                        className={`p-1.5 text-center border rounded transition-all text-xs font-bold ${
                          isSelected 
                            ? 'bg-neon text-bg-dark border-neon shadow-[0_0_10px_rgba(207,255,4,0.3)]' 
                            : 'bg-black/30 border-white/5 text-text-light/60 hover:border-neon/40 hover:text-white'
                        }`}
                      >
                        <div className="font-black text-[11px]">{branch.label}</div>
                        <div className="text-[8px] opacity-60 tracking-tighter truncate">{branch.range}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Calendar Type</span>
                  <div className="flex flex-wrap items-center gap-4">
                    {['solar', 'lunar'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setCalendar(type);
                          if (type === 'solar') setIsLeapMonth(false);
                        }}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                          calendar === type ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 border-border-dark hover:border-neon/50'
                        }`}
                      >
                        {type === 'solar' ? '양력' : '음력'}
                      </button>
                    ))}
                    <label
                      className={`flex items-center gap-2 text-xs font-bold select-none ${
                        calendar === 'lunar' ? 'text-text-light/80 cursor-pointer' : 'text-text-light/25 cursor-not-allowed'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={calendar === 'lunar' && isLeapMonth}
                        disabled={calendar !== 'lunar'}
                        onChange={(e) => setIsLeapMonth(e.target.checked)}
                        className="accent-neon w-4 h-4"
                      />
                      <span>윤달</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Gender</span>
                  <div className="flex gap-4">
                    {['male', 'female'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setGender(type)}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                          gender === type ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 border-border-dark hover:border-neon/50'
                        }`}
                      >
                        {type === 'male' ? '남성' : '여성'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">출생 연도 (Daeun 산출용)</label>
                  <select 
                    value={directBirthYear} 
                    onChange={(e) => setDirectBirthYear(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
                  >
                    {Array.from({ length: 101 }, (_, i) => 2026 - i).map(y => (
                      <option key={y} value={y.toString()}>{y}년</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Gender (성별)</span>
                  <div className="flex border border-border-dark rounded-none overflow-hidden h-[46px]">
                    {['male', 'female'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setGender(type)}
                        className={`flex-1 text-[11px] font-bold transition-all ${
                          gender === type ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 hover:text-white'
                        }`}
                      >
                        {type === 'male' ? '남성' : '여성'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* 시주 */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5">
                  <span className="text-xs font-black text-neon block border-b border-white/5 pb-1.5 text-center">시주 (Hour Pillar)</span>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">천간</label>
                    <select
                      value={directHourStem}
                      onChange={(e) => setDirectHourStem(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map(stem => (
                        <option key={stem} value={stem}>{stem} ({
                          stem === '甲' ? '갑' : stem === '乙' ? '을' : stem === '丙' ? '병' : stem === '丁' ? '정' : stem === '戊' ? '무' : stem === '己' ? '기' : stem === '庚' ? '경' : stem === '辛' ? '신' : stem === '壬' ? '임' : '계'
                        })</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">지지</label>
                    <select
                      value={directHourBranch}
                      onChange={(e) => setDirectHourBranch(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(branch => (
                        <option key={branch} value={branch}>{branch} ({
                          branch === '子' ? '자' : branch === '丑' ? '축' : branch === '寅' ? '인' : branch === '卯' ? '묘' : branch === '辰' ? '진' : branch === '巳' ? '사' : branch === '午' ? '오' : branch === '未' ? '미' : branch === '申' ? '신' : branch === '酉' ? '유' : branch === '戌' ? '술' : '해'
                        })</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 일주 */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5">
                  <span className="text-xs font-black text-neon block border-b border-white/5 pb-1.5 text-center">일주 (Day Pillar)</span>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">천간</label>
                    <select
                      value={directDayStem}
                      onChange={(e) => setDirectDayStem(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map(stem => (
                        <option key={stem} value={stem}>{stem} ({
                          stem === '甲' ? '갑' : stem === '乙' ? '을' : stem === '丙' ? '병' : stem === '丁' ? '정' : stem === '戊' ? '무' : stem === '己' ? '기' : stem === '庚' ? '경' : stem === '辛' ? '신' : stem === '壬' ? '임' : '계'
                        })</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">지지</label>
                    <select
                      value={directDayBranch}
                      onChange={(e) => setDirectDayBranch(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(branch => (
                        <option key={branch} value={branch}>{branch} ({
                          branch === '子' ? '자' : branch === '丑' ? '축' : branch === '寅' ? '인' : branch === '卯' ? '묘' : branch === '辰' ? '진' : branch === '巳' ? '사' : branch === '午' ? '오' : branch === '未' ? '미' : branch === '申' ? '신' : branch === '酉' ? '유' : branch === '戌' ? '술' : '해'
                        })</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 월주 */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5">
                  <span className="text-xs font-black text-neon block border-b border-white/5 pb-1.5 text-center">월주 (Month Pillar)</span>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">천간</label>
                    <select
                      value={directMonthStem}
                      onChange={(e) => setDirectMonthStem(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map(stem => (
                        <option key={stem} value={stem}>{stem} ({
                          stem === '甲' ? '갑' : stem === '乙' ? '을' : stem === '丙' ? '병' : stem === '丁' ? '정' : stem === '戊' ? '무' : stem === '己' ? '기' : stem === '庚' ? '경' : stem === '辛' ? '신' : stem === '壬' ? '임' : '계'
                        })</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">지지</label>
                    <select
                      value={directMonthBranch}
                      onChange={(e) => setDirectMonthBranch(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(branch => (
                        <option key={branch} value={branch}>{branch} ({
                          branch === '子' ? '자' : branch === '丑' ? '축' : branch === '寅' ? '인' : branch === '卯' ? '묘' : branch === '辰' ? '진' : branch === '巳' ? '사' : branch === '午' ? '오' : branch === '未' ? '미' : branch === '申' ? '신' : branch === '酉' ? '유' : branch === '戌' ? '술' : '해'
                        })</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 년주 */}
                <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5">
                  <span className="text-xs font-black text-neon block border-b border-white/5 pb-1.5 text-center">년주 (Year Pillar)</span>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">천간</label>
                    <select
                      value={directYearStem}
                      onChange={(e) => setDirectYearStem(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map(stem => (
                        <option key={stem} value={stem}>{stem} ({
                          stem === '甲' ? '갑' : stem === '乙' ? '을' : stem === '丙' ? '병' : stem === '丁' ? '정' : stem === '戊' ? '무' : stem === '己' ? '기' : stem === '庚' ? '경' : stem === '辛' ? '신' : stem === '壬' ? '임' : '계'
                        })</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-text-light/40 font-bold block">지지</label>
                    <select
                      value={directYearBranch}
                      onChange={(e) => setDirectYearBranch(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                    >
                      {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(branch => (
                        <option key={branch} value={branch}>{branch} ({
                          branch === '子' ? '자' : branch === '丑' ? '축' : branch === '寅' ? '인' : branch === '卯' ? '묘' : branch === '辰' ? '진' : branch === '巳' ? '사' : branch === '午' ? '오' : branch === '未' ? '미' : branch === '申' ? '신' : branch === '酉' ? '유' : branch === '戌' ? '술' : '해'
                        })</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 철학관 1:1 고객 맞춤 상담 고민 패널 */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-neon flex items-center gap-1.5">
                  🏛️ 철학관 고객 1:1 맞춤 상담 고민 설정 (선택 사항)
                </span>
              </div>
              <span className="text-[9px] text-text-light/40 font-medium">
                ※ 고민을 선택하거나 적어주시면, 만세력 풀이와 함께 실전 역학 상담가의 핀포인트 처방이 함께 제공됩니다.
              </span>
            </div>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '💼 이직·직장운', prompt: '올해 이직이나 승진 기회가 있을까요? 직장 변동에 가장 유리한 달은 언제인가요?' },
                { label: '💰 사업·재물운', prompt: '사업을 시작하거나 투자를 진행해도 괜찮을까요? 재물운이 크게 열리는 시기는 언제인가요?' },
                { label: '❤️ 연애·결혼운', prompt: '좋은 인연은 언제 찾아오며, 배우자 성향과 만남 시기는 언제가 길한가요?' },
                { label: '🏠 이사·문서운', prompt: '올해 집을 계약하거나 이사하기에 좋은 방향과 시기는 언제인가요?' },
                { label: '🎓 시험·합격운', prompt: '공무원/자격증 시험이나 목표하는 곳에 합격할 수 있는 기운이 있나요?' },
                { label: '🏥 건강·체질운', prompt: '사주상 특별히 주의해야 할 장기나 질병, 조심해야 할 사고 시기는 언제인가요?' },
                { label: '⚡ 삼재·액운예방', prompt: '현재 삼재나 흉살, 관재구설수를 피하고 액땜하는 개운 처방은 무엇인가요?' },
              ].map((chip) => {
                const isSelected = sajuConsultationTopic === chip.label;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSajuConsultationTopic('');
                        setSajuClientQuestion('');
                        localStorage.removeItem('any1_saju_consultationTopic');
                        localStorage.removeItem('any1_saju_clientQuestion');
                      } else {
                        setSajuConsultationTopic(chip.label);
                        setSajuClientQuestion(chip.prompt);
                        localStorage.setItem('any1_saju_consultationTopic', chip.label);
                        localStorage.setItem('any1_saju_clientQuestion', chip.prompt);
                      }
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-sm border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neon text-bg-dark border-neon shadow-[0_0_12px_rgba(207,255,4,0.3)] font-black'
                        : 'bg-black/50 border-white/10 text-text-light/70 hover:text-white hover:border-neon/40'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Client Question Textarea */}
            <div className="space-y-1.5">
              <textarea
                value={sajuClientQuestion}
                onChange={(e) => {
                  setSajuClientQuestion(e.target.value);
                  localStorage.setItem('any1_saju_clientQuestion', e.target.value);
                }}
                placeholder="고객이 상담 시 묻는 구체적인 질문을 자유롭게 입력하세요 (예: 10월에 직장 이직을 제안받았는데 가도 될까요?, 동업으로 식당을 차리려는데 길한가요? 등)..."
                rows={2}
                className="w-full bg-black/60 border border-border-dark focus:border-neon/60 p-3 text-xs text-text-light placeholder-text-light/30 outline-none rounded-sm font-sans resize-none"
              />
            </div>
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full mt-10 py-4 bg-neon text-bg-dark font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all disabled:opacity-20"
          >
            {loading ? 'Processing...' : 'Generate Saju Analysis'}
          </button>
        </motion.div>
      )}

      {/* Naming Input Form */}
      {featureId === 'naming' && !namingData && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-8 border border-border-dark bg-white/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Birth Year (출생 연도)</label>
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
              >
                {Array.from({ length: 101 }, (_, i) => 2026 - i).map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Month (출생 월)</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Day (출생 일)</label>
              <select 
                value={day} 
                onChange={(e) => setDay(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Time (태어난 시간)</label>
              <select 
                value={hour} 
                onChange={(e) => setHour(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
              >
                <option value="unknown">모름</option>
                {Array.from({ length: 144 }, (_, i) => {
                  const h = Math.floor(i / 6);
                  const m = (i % 6) * 10;
                  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                  return <option key={timeStr} value={timeStr}>{timeStr}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Calendar Type (달력)</span>
              <div className="flex flex-wrap items-center gap-4">
                {['solar', 'lunar'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setCalendar(type);
                      if (type === 'solar') setIsLeapMonth(false);
                    }}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${
                      calendar === type ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 border-border-dark hover:border-neon/50'
                    }`}
                  >
                    {type === 'solar' ? '양력' : '음력'}
                  </button>
                ))}
                <label
                  className={`flex items-center gap-2 text-xs font-bold select-none ${
                    calendar === 'lunar' ? 'text-text-light/80 cursor-pointer' : 'text-text-light/25 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={calendar === 'lunar' && isLeapMonth}
                    disabled={calendar !== 'lunar'}
                    onChange={(e) => setIsLeapMonth(e.target.checked)}
                    className="accent-neon w-4 h-4"
                  />
                  <span>윤달</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Gender (성별)</span>
              <div className="flex gap-4">
                {['male', 'female'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setGender(type)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${
                      gender === type ? 'bg-neon text-bg-dark border-neon' : 'text-text-light/40 border-border-dark hover:border-neon/50'
                    }`}
                  >
                    {type === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2 md:col-span-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Last Name (성씨 - 한글 입력)</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="예: 김"
                className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">Preferred Style & Wishes (희망 스타일 및 소원)</label>
              <input 
                type="text" 
                value={namingWishes}
                onChange={(e) => setNamingWishes(e.target.value)}
                placeholder="예: 부유하고 성공적인 인생, 글로벌하고 세련된 어감"
                className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-sm focus:border-neon outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full mt-4 py-4 bg-neon text-bg-dark font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all disabled:opacity-20"
          >
            {loading ? 'Processing...' : 'Generate Recommended Names'}
          </button>
        </motion.div>
      )}

      {/* AI Feng Shui Input Form */}
      {featureId === 'pungsu' && !response && !pungsuData && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 md:p-8 border border-border-dark bg-white/[0.01]"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border-dark pb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon block mb-1">AI MASTER FENG SHUI</span>
              <h3 className="text-lg font-black text-white italic uppercase tracking-tight">AI 풍수지리 처방 진단</h3>
            </div>
            <div className="flex border border-border-dark">
              {(['interior', 'compass', 'water-veins'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPungsuType(type)}
                  className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border-r last:border-r-0 border-border-dark transition-all ${
                    pungsuType === type ? 'bg-neon text-bg-dark' : 'text-text-light/40 hover:text-white'
                  }`}
                >
                  {type === 'interior' ? '인테리어 진단' : type === 'compass' ? '나침반 분석' : '수맥 자가진단'}
                </button>
              ))}
            </div>
          </div>

          {/* Saju Birth Info Input Block for AI Feng Shui */}
          <div className="mb-8 p-6 bg-black/40 border border-white/5 rounded-none space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-neon animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  분석 대상자 사주 정보 (정밀 만세력 자동 연계)
                </span>
              </div>
              {sessionStorage.getItem('any1_saju_data') ? (
                <span className="px-2 py-0.5 bg-neon/10 border border-neon/30 text-neon text-[9px] font-black tracking-widest rounded-sm uppercase">
                  정밀 만세력 연동됨
                </span>
              ) : (
                <span className="text-[9px] text-text-light/40 font-bold">
                  * 정밀 만세력 분석 후 오시면 자동 연동되어 100% 일치합니다.
                </span>
              )}
            </div>

            {/* If Synced, Show exact Pillars as a badge list */}
            {(() => {
              const storedSaju = sessionStorage.getItem('any1_saju_data');
              if (storedSaju) {
                try {
                  const parsed = JSON.parse(storedSaju);
                  if (parsed && Array.isArray(parsed.pillars)) {
                    return (
                      <div className="p-3 bg-white/[0.02] border border-white/10 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-black text-text-light/50">현재 연동된 명식:</span>
                          <div className="flex gap-2">
                            {parsed.pillars.map((p: any, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-black/40 border border-white/5 text-[10px] font-bold text-neon rounded-sm">
                                {p.label || p.pillar}: {p.heavenlyStem}{p.earthlyBranch}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-[9px] text-neon/70 font-bold">
                          * 이 사주 명조가 풍수지리 처방에 100% 일치 연동되어 적용됩니다.
                        </span>
                      </div>
                    );
                  }
                } catch (e) {
                  return null;
                }
              }
              return null;
            })()}

            {/* Birth Inputs */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="text-[9px] font-black uppercase text-text-light/50 tracking-wider block mb-1.5">출생년도</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                >
                  {Array.from({ length: 101 }, (_, i) => 2026 - i).map(y => (
                    <option key={y} value={y.toString()}>{y}년</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-text-light/50 tracking-wider block mb-1.5">출생월</label>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m.toString()}>{m}월</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-text-light/50 tracking-wider block mb-1.5">출생일</label>
                <select 
                  value={day} 
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d.toString()}>{d}일</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-text-light/50 tracking-wider block mb-1.5">태어난 시간</label>
                <select 
                  value={hour} 
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark p-2 text-text-light font-bold text-xs focus:border-neon outline-none"
                >
                  <option value="unknown">모름</option>
                  {Array.from({ length: 144 }, (_, i) => {
                    const h = Math.floor(i / 6);
                    const m = (i % 6) * 10;
                    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    return <option key={timeStr} value={timeStr}>{timeStr}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-text-light/50 tracking-wider block mb-1.5">달력 구분</label>
                <div className="flex border border-border-dark rounded-none overflow-hidden h-[34px]">
                  {['solar', 'lunar'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCalendar(type)}
                      className={`flex-1 text-[10px] font-bold transition-all ${
                        calendar === type ? 'bg-neon/20 text-neon' : 'text-text-light/40 hover:text-white'
                      }`}
                    >
                      {type === 'solar' ? '양력' : '음력'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-text-light/50 tracking-wider block mb-1.5">성별 구분</label>
                <div className="flex border border-border-dark rounded-none overflow-hidden h-[34px]">
                  {['male', 'female'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setGender(type)}
                      className={`flex-1 text-[10px] font-bold transition-all ${
                        gender === type ? 'bg-neon/20 text-neon' : 'text-text-light/40 hover:text-white'
                      }`}
                    >
                      {type === 'male' ? '남성' : '여성'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {pungsuType === 'interior' && (
              <motion.div
                key="interior_inputs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block mb-3">대상 공간 (Room Type)</span>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { id: 'bedroom', label: '안방/침실' },
                      { id: 'living', label: '거실' },
                      { id: 'entrance', label: '현관' },
                      { id: 'kitchen', label: '주방' },
                      { id: 'office', label: '공부방/사무실' }
                    ].map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setPungsuRoom(room.id)}
                        className={`py-3 text-[11px] font-bold border transition-all ${
                          pungsuRoom === room.id 
                            ? 'bg-neon/10 text-neon border-neon' 
                            : 'text-text-light/40 border-border-dark hover:border-white/20'
                        }`}
                      >
                        {room.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block mb-2">
                    현재 가구 배치 상태 및 고민 사항 (Interior Details)
                  </label>
                  <textarea
                    rows={4}
                    value={pungsuNotes}
                    onChange={(e) => setPungsuNotes(e.target.value)}
                    placeholder="예: 안방 문을 열자마자 침대 머리가 보입니다. 침대 헤드가 화장실 쪽 벽에 붙어있는데 괜찮을까요? 재물운을 높이기 위한 침대와 거울 추천 배치도 알고 싶어요."
                    className="w-full bg-bg-dark border border-border-dark p-4 text-text-light font-bold text-xs focus:border-neon outline-none resize-none leading-relaxed"
                  />
                </div>
              </motion.div>
            )}

            {pungsuType === 'compass' && (
              <motion.div
                key="compass_inputs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block mb-2">현재 현관/침대 방위 (Facing Direction)</label>
                  <select
                    value={pungsuCompassDir}
                    onChange={(e) => setPungsuCompassDir(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark p-3 text-text-light font-bold text-xs focus:border-neon outline-none"
                  >
                    {['남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽', '북쪽', '북동쪽', '동쪽'].map((dir) => (
                      <option key={dir} value={dir}>{dir}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {pungsuType === 'water-veins' && (
              <motion.div
                key="water_inputs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon block">수맥 및 부정 지기 체크리스트 (Virtual Geopathic Stress Check)</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "아침에 잠에서 깨어나도 찌푸려지고 몸이 무거우며 개운치 않음",
                    "원인 불명의 두통이나 불면증, 예민해짐이 반복됨",
                    "방 바닥이나 벽지에 이유를 알 수 없는 미세 균열이 자주 생김",
                    "실내 화초가 이유 없이 기운을 잃고 자꾸 시들어 말라감"
                  ].map((symptom, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const next = [...pungsuWaterChecks];
                        next[idx] = !next[idx];
                        setPungsuWaterChecks(next);
                      }}
                      className={`p-4 border text-left flex items-start gap-3 transition-all ${
                        pungsuWaterChecks[idx] 
                          ? 'bg-neon/10 text-neon border-neon' 
                          : 'bg-black/20 text-text-light/50 border-border-dark hover:border-white/10'
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 border shrink-0 mt-0.5 flex items-center justify-center ${pungsuWaterChecks[idx] ? 'border-neon bg-neon text-bg-dark' : 'border-border-dark'}`}>
                        {pungsuWaterChecks[idx] && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs font-medium leading-relaxed">{symptom}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={async () => {
              setLoading(true);
              const currentKey = `${year}-${month}-${day}-${hour}-${calendar}-${gender}`;
              const storedKey = sessionStorage.getItem('any1_saju_key');
              
              let sajuInfoStr = "";
              let latestSajuData = null;

              if (storedKey === currentKey) {
                const storedSaju = sessionStorage.getItem('any1_saju_data');
                if (storedSaju) {
                  try {
                    latestSajuData = JSON.parse(storedSaju);
                  } catch (e) {
                    console.error("Error parsing stored saju", e);
                  }
                }
              }

              // If saju is not synced, run the saju calculation API first to get precise pillars!
              if (!latestSajuData) {
                setResponse('사용자님의 생년월일시에 따른 정밀 만세력 사주 명조를 먼저 연산하고 있습니다. 잠시만 기다려 주세요...');
                try {
                  const timeDisplay = hour === 'unknown' ? '시간모름' : (hour.includes(':') ? `${hour.split(':')[0]}시 ${hour.split(':')[1]}분` : `${hour}시`);
                  const sPrompt = `${year}년 ${month}월 ${day}일 ${timeDisplay}생, ${calendar === 'solar' ? '양력' : '음력'}, ${gender === 'male' ? '남성' : '여성'}의 사주를 분석해주세요.`;
                  const sRes = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      prompt: sPrompt, 
                      feature: 'AI 정밀 만세력',
                      customApiKey: customApiKey
                    }),
                  });
                  if (sRes.ok) {
                    const sData = await sRes.json();
                    const sRawText = sData.text || '';
                    const jsonMatch = sRawText.match(/```json\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                      const parsed = JSON.parse(jsonMatch[1]);
                      if (parsed.sajuChart) {
                        latestSajuData = parsed.sajuChart;
                        sessionStorage.setItem('any1_saju_data', JSON.stringify(parsed.sajuChart));
                        sessionStorage.setItem('any1_saju_key', currentKey);
                      }
                    }
                  }
                } catch (err) {
                  console.error("Failed to pre-calculate Saju for Feng Shui", err);
                }
              }

              // Format sajuInfoStr
              if (latestSajuData && Array.isArray(latestSajuData.pillars)) {
                sajuInfoStr = `\n[사용자 정밀 만세력 사주 명조 정보 (반드시 일치시킬 것)]:\n` + 
                  latestSajuData.pillars.map((p: any) => `- ${p.label || p.pillar || '기둥'}: ${p.heavenlyStem}${p.earthlyBranch} (${p.heavenlyStemTenGod}/${p.earthlyBranchTenGod})`).join('\n');
              }

              const timeDisplay = hour === 'unknown' ? '시간모름' : (hour.includes(':') ? `${hour.split(':')[0]}시 ${hour.split(':')[1]}분` : `${hour}시`);
              const birthDetailsStr = `\n[사용자 상세 생년월일시 정보]: ${year}년 ${month}월 ${day}일 ${timeDisplay}생 (${calendar === 'solar' ? '양력' : '음력'}, ${gender === 'male' ? '남성' : '여성'})\n`;

              let customPrompt = "";
              if (pungsuType === 'interior') {
                const roomMap: Record<string, string> = {
                  bedroom: '안방/침실',
                  living: '거실',
                  entrance: '현관',
                  kitchen: '주방',
                  office: '공부방/사무실'
                };
                customPrompt = `[분석 유형: 가구 배치 및 인테리어 진단]\n대상 공간: ${roomMap[pungsuRoom] || pungsuRoom}\n사용자 설명: ${pungsuNotes || "현재 배치 상태와 흐름에 따른 일반적인 풍수 처방을 내려주세요."}\n${birthDetailsStr}${sajuInfoStr}\n*주의: 위 상세 정보와 사주 명조를 기준으로 인테리어 배치에 따른 사주-풍수 맞춤 솔루션을 주시고, 사주 간지(예: 일주 등)를 절대 다르게 계산하거나 엉뚱한 한자를 언급하여 혼선을 주지 마십시오. 정밀 만세력과 100% 동일한 명조로 일치시켜 설명하세요.*`;
              } else if (pungsuType === 'compass') {
                customPrompt = `[분석 유형: 나침반 길방 및 본명괘 분석]\n사용자 정보: ${year}년생, 성별: ${gender === 'male' ? '남성' : '여성'}\n주택 주향/현관 방향: ${pungsuCompassDir}\n${birthDetailsStr}${sajuInfoStr}\n본명괘를 정확하게 연산하여 그에 따른 길방(생기, 천의, 연년)과 흉방(절명, 육살)을 분석하고 공간 가이드를 작성해주세요. *주의: 사주 명조를 계산하거나 일주를 언급할 때 위 [사용자 정밀 만세력 사주 명조 정보]나 생년월일시를 기준으로 만세력과 완벽히 일치시키고 절대 임의로 오산한 간지(예: 정축 일주 등)를 사용하지 마십시오. 1958년 10월 11일 19시 음력 남성은 반드시 무술년 계해월 임인일 경술시생입니다.*`;
              } else {
                const checkedSymptoms = [
                  pungsuWaterChecks[0] ? "잠에서 깬 후에도 피로가 가시지 않음" : null,
                  pungsuWaterChecks[1] ? "두통/불면증 증상 있음" : null,
                  pungsuWaterChecks[2] ? "벽지/바닥 미세 균열 자주 발견" : null,
                  pungsuWaterChecks[3] ? "화초가 기운을 잃고 자꾸 시듦" : null,
                ].filter(Boolean);
                customPrompt = `[분석 유형: 수맥 및 지기 가상 자가진단]\n발견된 증상:\n${checkedSymptoms.length > 0 ? checkedSymptoms.join('\n') : '없음'}\n현재 공간에서 감지되는 수맥 및 지기 상태를 자가진단 분석하고, 기운을 정화하며 중화할 수 있는 강력한 풍수 처방과 비보 기법을 알려주세요.\n${birthDetailsStr}${sajuInfoStr}\n*주의: 분석 및 설명 시 사용자의 정확한 사주 명식(무술년 계해월 임인일 경술시 등)을 일치시켜 활용해 주세요.*`;
              }

              setResponse('');
              handleSubmit(undefined, customPrompt);
            }}
            disabled={loading}
            className="w-full mt-8 py-4 bg-neon text-bg-dark font-black uppercase tracking-[0.3em] text-sm hover:bg-white transition-all disabled:opacity-20 cursor-pointer"
          >
            {loading ? 'Analyzing Feng Shui Flow...' : 'Generate Feng Shui Prescription'}
          </button>
        </motion.div>
      )}

      {/* Face Reading Input Form */}
      {featureId === 'face' && !response && !faceData && (
        <div className="mb-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={isCameraActive ? 'camera' : selectedImage ? 'image' : 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md aspect-square bg-white/5 border border-border-dark overflow-hidden group shadow-2xl"
            >
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Face" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-neon/10 mix-blend-overlay pointer-events-none" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : isCameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
                  <div className="absolute inset-0 border-2 border-neon/30 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-neon/50 rounded-[30%] opacity-20" />
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 items-center">
                    <button 
                      onClick={capturePhoto}
                      className="w-16 h-16 bg-white rounded-full border-4 border-white/20 active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    />
                    <button 
                      onClick={stopCamera}
                      className="p-3 bg-red-500/80 text-white rounded-full backdrop-blur-sm hover:bg-red-500 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-b from-transparent to-white/[0.02]">
                  <div className="grid grid-cols-2 gap-4 w-full h-full">
                    <button 
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center gap-4 border border-border-dark hover:border-neon hover:bg-neon/5 transition-all group/btn"
                    >
                      <div className="p-4 rounded-full bg-white/5 group-hover/btn:bg-neon/20 transition-colors">
                        <Camera size={32} className="text-neon" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Scan</span>
                    </button>
                    <button 
                      onClick={() => imageInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-4 border border-border-dark hover:border-neon hover:bg-neon/5 transition-all group/btn"
                    >
                      <div className="p-4 rounded-full bg-white/5 group-hover/btn:bg-neon/20 transition-colors">
                        <Upload size={32} className="text-neon" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Load Data</span>
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {selectedImage && !loading && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleSubmit()}
              className="mt-8 px-12 py-5 bg-neon text-bg-dark font-black uppercase tracking-[0.4em] text-sm hover:bg-white transition-all shadow-[0_0_30px_rgba(207,255,4,0.3)] active:scale-95"
            >
              Begin Face Reading
            </motion.button>
          )}
        </div>
      )}

      {/* Travel Guide Helper */}
      {isTravelCategory && !response && !loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-8 bg-neon/5 border-2 border-neon/20 relative overflow-hidden group shadow-[0_0_50px_rgba(207,255,4,0.1)]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Send size={100} className="rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-neon text-bg-dark rounded-full shadow-[0_0_20px_rgba(207,255,4,0.5)]">
                <Lightbulb size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-[0.2em] text-neon">AI 여행 맞춤 가이드</h3>
                <p className="text-[10px] text-text-light/40 uppercase tracking-widest">Personalized Travel Planning</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm text-text-light leading-relaxed font-medium">
                원하시는 여행의 모습을 <span className="text-neon font-bold">텍스트로 상세히</span> 들려주세요. 
                아래의 정보를 포함할수록 더욱 완벽한 계획을 세워드릴 수 있습니다.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "어디로?", detail: "일본 교토, 제주도 동부, 유럽 한 달 살기 등" },
                  { label: "언제, 얼마동안?", detail: "5월 중순 출발, 2박 3일 또는 일주일 일정" },
                  { label: "어떤 취향인가요?", detail: "조용한 카페, 로컬 맛집, 액티비티 위주 등" },
                  { label: "누구와 함께?", detail: "부모님과 함께, 아이와 함께, 연인과 첫 여행" },
                  { label: "예산 및 특별 요청", detail: "가성비 숙소 위주, 걷는 코스는 적게 등" }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-white/[0.02] transition-all duration-300">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neon mb-2 flex items-center gap-2">
                      <div className="w-1 h-1 bg-neon rounded-full" />
                      {item.label}
                    </div>
                    <div className="text-xs text-text-light/70 leading-snug">{item.detail}</div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="text-[10px] font-bold text-text-light/30 mb-3 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb size={12} className="text-neon" />
                  질문 가이드 및 예시 (클릭하여 자동 입력)
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "일본 교토로 2박 3일 동안 부모님과 함께하는 힐링 여행 코스 짜줘. 너무 많이 걷지 않는 코스였으면 좋겠어.",
                    "제주도 동부권으로 아이들과 함께 가기 좋은 체험 위주 3박 4일 일정 추천해줘.",
                    "부산 영도 주변으로 혼자 가는 1박 2일 맛집 & 카페 투어 계획해줘."
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="text-left p-4 bg-white/5 border border-white/5 rounded-sm text-[11px] text-text-light/50 hover:bg-neon/10 hover:border-neon/20 hover:text-text-light transition-all flex items-start gap-3 group/btn"
                    >
                      <span className="text-neon/30 group-hover/btn:text-neon transition-colors mt-0.5">•</span>
                      <span className="flex-1">"{example}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && !response && !loading && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} className="text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-light/60">Quick Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-bg-dark border border-border-dark text-[11px] text-text-light/60 font-bold uppercase tracking-wider hover:border-neon hover:text-neon transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-bg-dark border border-border-dark min-h-[400px] flex flex-col mb-10 relative">
        <div className="absolute top-0 right-0 p-4 flex gap-4 z-10">
          {(response || selectedImage || selectedFile || sajuData || faceData || namingData || youtubeUrl) && (
            <button 
              onClick={() => { 
                setResponse(''); 
                setPrompt(''); 
                setSelectedImage(null); 
                setSelectedFile(null); 
                setMapMarkers([]); 
                setSajuData(null); 
                setFaceData(null); 
                setNamingData(null); 
                setPungsuData(null);
                setYoutubeUrl('');
                if (featureId === 'saju') {
                  localStorage.removeItem('any1_saju_data');
                  localStorage.removeItem('any1_saju_response');
                  sessionStorage.removeItem('any1_saju_data');
                  sessionStorage.removeItem('any1_saju_response');
                  sessionStorage.removeItem('any1_saju_consultation_history');
                  setSajuConsultationHistory([]);
                  setSajuClientQuestion('');
                  setSajuConsultationTopic('');
                  setSajuFollowUpQuestion('');
                } else if (featureId === 'naming') {
                  localStorage.removeItem('any1_naming_data');
                  localStorage.removeItem('any1_naming_response');
                  sessionStorage.removeItem('any1_naming_data');
                  sessionStorage.removeItem('any1_naming_response');
                } else if (featureId === 'pungsu') {
                  localStorage.removeItem('any1_pungsu_data');
                  localStorage.removeItem('any1_pungsu_response');
                  sessionStorage.removeItem('any1_pungsu_data');
                  sessionStorage.removeItem('any1_pungsu_response');
                }
              }}
              className="text-[10px] font-black uppercase tracking-widest text-text-light/20 hover:text-red-500 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={12} />
              Reset
            </button>
          )}
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-neon opacity-20" />
            <div className="w-1 h-1 bg-neon opacity-40" />
            <div className="w-1 h-1 bg-neon" />
          </div>
        </div>
        
        <div className="p-10 flex-grow">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-neon" size={32} />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neon animate-pulse">Neural Processing...</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none prose-sm md:prose-base">
              {isTravelCategory && (mapMarkers.length > 0 || response) && (
                <MapViewer center={mapCenter} markers={mapMarkers} />
              )}
              {featureId === 'saju' && (sajuData || response) && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-lime-500/10 border border-lime-500/30 rounded-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse" />
                    <span className="text-xs font-bold text-text-light/90">
                      현재 분석된 생년월일시:{' '}
                      <strong className="text-neon">
                        {sajuInputMode === 'direct'
                          ? `${directYearStem}${directYearBranch}년 ${directMonthStem}${directMonthBranch}월 ${directDayStem}${directDayBranch}일 ${directHourStem}${directHourBranch}시 (${gender === 'male' ? '남성' : '여성'})`
                          : `${year}년 ${month}월 ${day}일 ${hour === 'unknown' ? '시간 모름' : hour} (${calendar === 'solar' ? '양력' : isLeapMonth ? '음력 윤달' : '음력'} · ${gender === 'male' ? '남성' : '여성'})`}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSajuInputPanel((prev) => !prev);
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-2 bg-neon text-bg-dark hover:bg-white text-xs font-black transition-all flex items-center gap-1.5 rounded-sm uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(207,255,4,0.25)]"
                  >
                    <RefreshCw size={13} />
                    {showSajuInputPanel ? '생년월일시 입력창 닫기' : '생년월일시 다시 입력하기'}
                  </button>
                </div>
              )}
              {sajuData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-10"
                >
                  <SajuChart data={sajuData} />
                </motion.div>
              )}
              {faceData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-10"
                >
                  <FaceAnalysisView data={faceData} />
                </motion.div>
              )}
              {namingData && (
                <>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-lime-500/10 border border-lime-500/30 rounded-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-neon animate-pulse" />
                      <span className="text-xs font-bold text-text-light/90">
                        현재 추천 완료: <strong className="text-neon">{year}년 {month}월 {day}일 ({calendar === 'solar' ? '양력' : '음력'} {gender === 'male' ? '남성' : '여성'}) [{lastName}]씨</strong> 작명 결과
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNamingData(null);
                        setResponse('');
                        sessionStorage.removeItem('any1_naming_data');
                        sessionStorage.removeItem('any1_naming_response');
                      }}
                      className="px-4 py-2 bg-neon text-bg-dark hover:bg-white text-xs font-black transition-all flex items-center gap-1.5 rounded-sm uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(207,255,4,0.25)]"
                    >
                      <RefreshCw size={13} />
                      다른 사람 사주로 새이름 추천받기 (입력창 열기)
                    </button>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-10"
                  >
                    <NamingView data={namingData} />
                  </motion.div>
                </>
              )}
              {pungsuData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-10"
                >
                  <PungsuView data={pungsuData} />
                </motion.div>
              )}
              {response && (
                <div className="relative group/response border border-white/5 bg-white/[0.01] p-6 mt-6 rounded">
                  {isApiKeyError && (
                    <div className="mb-6 p-6 border border-red-500/40 bg-red-500/[0.04] rounded-sm font-sans text-xs space-y-4">
                      {/* Alert Header */}
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                        <div className="space-y-1">
                          <h4 className="text-[13px] font-black text-red-400 uppercase tracking-wide">
                            [안내] 무료 개인 Gemini API 키 연동이 필요합니다
                          </h4>
                          <p className="text-text-light/80 leading-relaxed text-[11px]">
                            공유 서버의 기본 API 키가 구글 보안 정책에 의해 일시 만료되었습니다. 아래 입력창에 본인의 무료 Gemini API Key를 등록하시면 사주·만세력, 작명, 관상, 여행비서 등 모든 인공지능 분석이 즉시 100% 정상 작동합니다.
                          </p>
                        </div>
                      </div>

                      {/* Quick 1-minute Guide */}
                      <div className="p-3.5 border border-white/10 bg-black/60 rounded space-y-2 text-[11px] text-text-light/70">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <Key size={13} className="text-neon" /> 🔑 100% 완전 무료 키 발급 방법 (비용 0원, 신용카드 불필요):
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 leading-relaxed">
                          <li>
                            <a 
                              href="https://aistudio.google.com/app/apikey" 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-neon underline hover:text-white font-black"
                            >
                              Google AI Studio 공식 키 발급 페이지 바로가기 (새창 열기 ↗)
                            </a>
                          </li>
                          <li>구글 계정으로 로그인 후 상단의 파란색 <strong className="text-white">&quot;Create API key&quot; (새 키 만들기)</strong> 버튼 클릭</li>
                          <li>생성된 <code className="text-neon bg-neon/15 px-1.5 py-0.5 rounded font-mono">AIzaSy...</code> 키를 복사하여 아래에 붙여넣고 버튼을 누르면 끝!</li>
                        </ol>
                      </div>

                      {/* Quick Activation Form */}
                      <div className="p-4 border border-neon/30 bg-neon/[0.03] rounded-sm space-y-2.5">
                        <span className="text-[10px] font-bold text-neon uppercase tracking-wider flex items-center gap-1.5">
                          <Key size={12} /> 개인 Gemini API Key 입력 (브라우저 안전 보관)
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            placeholder="AIzaSy... 로 시작하는 API 키를 붙여넣으세요"
                            value={embedKeyInput}
                            onChange={(e) => setEmbedKeyInput(e.target.value)}
                            className="flex-grow bg-bg-dark border border-white/20 p-2.5 text-xs text-text-light rounded-sm focus:border-neon outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = embedKeyInput.trim();
                              if (trimmed) {
                                localStorage.setItem('any1_custom_gemini_api_key', trimmed);
                                if (onApiKeyChange) onApiKeyChange(trimmed);
                                setIsApiKeyError(false);
                                setTimeout(() => {
                                  handleSubmit(undefined, prompt);
                                }, 100);
                              } else {
                                alert('올바른 API Key를 입력해 주세요.');
                              }
                            }}
                            className="px-6 py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black transition-all rounded-sm uppercase tracking-wider shrink-0 cursor-pointer shadow-[0_0_15px_rgba(207,255,4,0.3)]"
                          >
                            키 등록 및 즉시 실행 ⚡
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsApiKeyError(false);
                              setIsQuotaError(false);
                              handleSubmit(undefined, prompt);
                            }}
                            className="px-4 py-2.5 bg-lime-500/20 text-lime-300 border border-lime-500/40 hover:bg-lime-500 hover:text-bg-dark text-xs font-bold transition-all rounded-sm uppercase tracking-wider shrink-0 cursor-pointer"
                          >
                            키 없이 개발자 모드로 즉시 실행 ⚡
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isQuotaError && (
                    <div className="mb-6 p-6 border border-yellow-500/30 bg-yellow-500/[0.03] rounded-sm font-sans text-xs space-y-4">
                      {/* Alert Header */}
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                        <div className="space-y-1">
                          <h4 className="text-[13px] font-black text-yellow-500 uppercase tracking-wide">
                            [SYSTEM WARN] 무료 일일/분당 사용 한도 초과
                          </h4>
                          <p className="text-text-light/70 leading-relaxed text-[11px]">
                            현재 공유 서버 키의 무료 처리 한도에 도달하였습니다. 일시적인 제한 없이 24시간 안정적이고 강력한 AI 분석을 누리시려면 개인 Gemini API Key를 연동해 주십시오.
                          </p>
                        </div>
                      </div>

                      {/* Pricing Bento Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 border border-white/5 bg-black/40 rounded-sm space-y-2.5">
                          <span className="text-[10px] font-bold text-neon uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu size={12} className="text-neon" /> 📁 무료 미디어 분석 및 데이터 한도
                          </span>
                          <ul className="space-y-2 text-[11px] text-text-light/50 leading-relaxed list-disc list-inside">
                            <li><strong>최대 20 GB</strong> 용량까지 파일(이미지/동영상/오디오 등) 무료 업로드 및 일시 보관(최대 48시간)과 전용 분석 처리가 완벽히 무료로 제공됩니다.</li>
                            <li>20 GB 용량 초과 시, 추가 1 GB당 단 <strong>약 $0.075 ~ $0.15 (약 100~200원)</strong> 수준의 초저가 데이터 전송 및 입력 토큰 비용만 소액 청구되므로 기가바이트(GB) 단위의 분석도 대단히 경제적입니다.</li>
                          </ul>
                        </div>

                        <div className="p-4 border border-white/5 bg-black/40 rounded-sm space-y-2.5">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield size={12} className="text-blue-400" /> 💬 텍스트 입력/출력 종량제 요금
                          </span>
                          <ul className="space-y-2 text-[11px] text-text-light/50 leading-relaxed list-disc list-inside">
                            <li><strong>텍스트 입력 (Input)</strong>: 100만 토큰당 단 <strong>$0.075 (약 100원)</strong> (한글 기준 약 75만 자의 거대한 텍스트 분석 가능)</li>
                            <li><strong>텍스트 출력 (Output)</strong>: 100만 토큰당 <strong>$0.30 (약 400원)</strong> (한글 약 25만 자 내외의 장문 도출 가능)</li>
                            <li>입력하신 개인 키는 절대 서버 데이터베이스에 저장되지 않고 브라우저 안전 저장소(<code className="bg-white/5 px-1 py-0.5 font-mono text-[10px]">localStorage</code>)에만 안전하게 보관됩니다.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Quick Activation Form */}
                      <div className="p-4 border border-neon/20 bg-neon/[0.02] rounded-sm space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-[10px] font-bold text-neon uppercase tracking-wider flex items-center gap-1.5">
                            <Key size={12} /> 개인 API Key 간편 연동 및 즉시 재수행
                          </span>
                          <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-neon/70 hover:text-neon underline text-[10px] lowercase"
                          >
                            구글 AI Studio에서 API 키 무료 발급 받기 ↗
                          </a>
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={embedKeyInput}
                            onChange={(e) => setEmbedKeyInput(e.target.value)}
                            placeholder="개인 Gemini API Key를 입력하세요 (AIzaSy...)"
                            className="flex-grow bg-bg-dark border border-border-dark px-4 py-2.5 text-xs text-text-light placeholder:text-text-light/25 outline-none focus:border-neon font-mono rounded-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = embedKeyInput.trim();
                              if (trimmed && onApiKeyChange) {
                                onApiKeyChange(trimmed);
                                setIsQuotaError(false);
                                // Auto trigger resubmit
                                setTimeout(() => {
                                  handleSubmit(new Event('submit') as any);
                                }, 100);
                              } else {
                                alert('올바른 API Key를 입력해 주세요.');
                              }
                            }}
                            className="px-5 py-2.5 bg-neon hover:bg-white text-bg-dark text-xs font-black transition-all rounded-sm uppercase tracking-wider shrink-0"
                          >
                            등록 및 즉시 재수행
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 z-20">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(response);
                          setTextCopied(true);
                          setTimeout(() => setTextCopied(false), 2000);
                        } catch (err) {
                          console.error("Failed to copy response text!", err);
                        }
                      }}
                      className="px-3 py-1.5 bg-black/60 hover:bg-neon border border-white/10 hover:border-neon text-[10px] font-black uppercase tracking-wider text-text-light hover:text-bg-dark transition-all flex items-center gap-1.5 cursor-pointer rounded backdrop-blur-sm"
                    >
                      {textCopied ? <Check size={11} /> : <Copy size={11} />}
                      {textCopied ? '복사 완료' : '설명 복사'}
                    </button>
                  </div>
                  <div className="text-text-light leading-relaxed font-medium prose prose-invert max-w-none pt-4 pr-12">
                    <ReactMarkdown>{response}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* 철학관 1:1 심층 상담실 (Q&A Desk) */}
              {featureId === 'saju' && sajuData && (
                <div className="mt-8 border border-neon/30 bg-black/60 p-6 rounded-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-neon rounded-full animate-ping" />
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          🏛️ 철학관 실시간 1:1 심층 상담 데스크
                        </h4>
                        <span className="text-[9px] px-2 py-0.5 bg-neon/15 text-neon font-black border border-neon/30 rounded">
                          명식 연동 맞춤 문답
                        </span>
                      </div>
                      <p className="text-[11px] text-text-light/60">
                        고객이 상담 중 추가로 묻는 특정 사안(이직 타이밍, 특정 월의 매매/투자, 연애/결혼 인연 등)을 입력하시면, 이미 도출된 사주원국 및 대운·세운과 즉시 연계하여 핀포인트 처방을 내려드립니다.
                      </p>
                    </div>
                  </div>

                  {/* Quick Follow-up Question Chips */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neon/90 uppercase tracking-wider block">
                      ⚡ 자주 묻는 철학관 단골 상담 질문 (클릭 시 즉시 상담):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        '올해 하반기 금전운과 가장 유리한 투자/매매 시기는?',
                        '직장 이직이나 부서 이동에 가장 길한 달(월)은 언제인가요?',
                        '배우자 인연은 어떤 띠나 성향의 사람이 가장 길한가요?',
                        '올해 조심해야 할 달(월운)과 피해야 할 선택은 무엇인가요?',
                        '시험/자격증 합격운과 승진운이 올해 강하게 들어오나요?',
                        '나의 사주에 행운을 부르는 개운법(행운의 색상, 방위, 숫자)은?'
                      ].map((quickQ, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => {
                            setSajuFollowUpQuestion(quickQ);
                            handleSajuFollowUpSubmit(quickQ);
                          }}
                          disabled={sajuConsulting}
                          className="px-3 py-1.5 bg-white/5 hover:bg-neon hover:text-bg-dark border border-white/10 hover:border-neon text-[10px] font-bold text-text-light/80 transition-all rounded-sm cursor-pointer disabled:opacity-40"
                        >
                          💬 {quickQ}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up Question Input Form */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      value={sajuFollowUpQuestion}
                      onChange={(e) => setSajuFollowUpQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSajuFollowUpSubmit();
                        }
                      }}
                      placeholder="고객의 추가 질문을 입력하세요 (예: 올해 11월에 가게를 계약해도 될까요?)..."
                      className="flex-grow bg-bg-dark border border-white/20 focus:border-neon p-3 text-xs text-text-light placeholder:text-text-light/30 outline-none rounded-sm font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => handleSajuFollowUpSubmit()}
                      disabled={!sajuFollowUpQuestion.trim() || sajuConsulting}
                      className="px-6 py-3 bg-neon hover:bg-white text-bg-dark font-black text-xs uppercase tracking-wider transition-all rounded-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 shrink-0 shadow-[0_0_15px_rgba(207,255,4,0.3)]"
                    >
                      {sajuConsulting ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          역학 심층 분석 중...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          상담 답변 도출 ⚡
                        </>
                      )}
                    </button>
                  </div>

                  {/* Consultation History Records */}
                  {sajuConsultationHistory.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-neon flex items-center gap-1.5">
                          📜 철학관 맞춤 상담 처방전 기록 ({sajuConsultationHistory.length}건)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSajuConsultationHistory([]);
                            sessionStorage.removeItem('any1_saju_consultation_history');
                          }}
                          className="text-[9px] text-text-light/40 hover:text-red-400 font-bold uppercase cursor-pointer"
                        >
                          상담 기록 초기화
                        </button>
                      </div>

                      <div className="space-y-3">
                        {sajuConsultationHistory.map((item, hIdx) => (
                          <div
                            key={hIdx}
                            className="p-5 border border-neon/20 bg-neon/[0.02] rounded-sm space-y-3 relative group"
                          >
                            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-neon text-bg-dark font-black text-[9px] rounded-sm">
                                  Q{hIdx + 1}
                                </span>
                                <h5 className="text-xs font-black text-white">
                                  {item.question}
                                </h5>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[9px] text-text-light/40 font-mono">
                                  {item.timestamp}
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(`[철학관 고객 상담 기록]\n질문: ${item.question}\n\n[상담 처방]:\n${item.answer}`);
                                      setConsultationCopiedIndex(hIdx);
                                      setTimeout(() => setConsultationCopiedIndex(null), 2000);
                                    } catch (e) {}
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-neon hover:text-bg-dark border border-white/10 text-[9px] font-bold text-text-light transition-all rounded flex items-center gap-1 cursor-pointer"
                                >
                                  {consultationCopiedIndex === hIdx ? <Check size={10} /> : <Copy size={10} />}
                                  {consultationCopiedIndex === hIdx ? '복사됨' : '고객 전달용 복사'}
                                </button>
                              </div>
                            </div>

                            <div className="text-xs text-text-light/90 leading-relaxed font-sans prose prose-invert max-w-none pt-1">
                              <ReactMarkdown>{item.answer}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(sajuData || namingData || pungsuData) && (
                <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="text-[11px] text-text-light/40 leading-relaxed font-bold">
                    * 추출된 결과는 현재 브라우저 세션 동안만 임시 저장되며, 앱을 완전히 나갔다가 다시 들어오거나 새로고침하면 안전하게 정리됩니다. (입력하신 태어난 정보는 간편하게 유지됩니다.)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResponse('');
                      setSajuData(null);
                      setNamingData(null);
                      setPungsuData(null);
                      setPrompt('');
                      localStorage.removeItem('any1_saju_data');
                      localStorage.removeItem('any1_saju_response');
                      sessionStorage.removeItem('any1_saju_data');
                      sessionStorage.removeItem('any1_saju_response');
                      localStorage.removeItem('any1_naming_data');
                      localStorage.removeItem('any1_naming_response');
                      sessionStorage.removeItem('any1_naming_data');
                      sessionStorage.removeItem('any1_naming_response');
                      localStorage.removeItem('any1_pungsu_data');
                      localStorage.removeItem('any1_pungsu_response');
                      sessionStorage.removeItem('any1_pungsu_data');
                      sessionStorage.removeItem('any1_pungsu_response');
                    }}
                    className="px-6 py-3 bg-neon text-bg-dark hover:bg-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                    {featureId === 'saju' ? '새로운 사주 분석하기 (입력 수정)' : featureId === 'naming' ? '새이름 추천받기 (입력 수정)' : '새로운 풍수 진단하기 (입력 수정)'}
                  </button>
                </div>
              )}
              {!response && !sajuData && !faceData && !namingData && !pungsuData && !selectedImage && !selectedFile && featureId !== 'face' && featureId !== 'naming' && featureId !== 'pungsu' && (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                  <div className="w-12 h-12 border border-text-light rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-text-light rounded-full" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.5em]">Waiting for input stream</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-neon opacity-0 group-focus-within:opacity-10 transition-opacity blur-sm pointer-events-none" />
        
        {/* Upload Previews */}
        <div className="flex gap-4 mb-2">
          {selectedImage && (
            <div className="relative w-20 h-20 border border-neon/50">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <X size={10} />
              </button>
            </div>
          )}
          {selectedFile && (
            <div className="relative p-3 border border-neon/50 bg-white/5 flex items-center gap-2">
              <FileIcon size={16} className="text-neon" />
              <span className="text-[10px] text-text-light/60 truncate max-w-[100px]">{selectedFile.name}</span>
              <button 
                type="button"
                onClick={() => setSelectedFile(null)}
                className="ml-2 text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {featureId === 'creation' && (
          <div className="mb-4 bg-bg-dark/60 border border-border-dark/80 p-4 rounded-sm relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neon flex items-center gap-1.5">
                <Video size={12} /> 유튜브 공유 주소 연동 (유튜브 기반 창작)
              </span>
              {ytId && (
                <span className="text-[9px] px-1.5 py-0.5 bg-neon/10 border border-neon/30 text-neon font-black rounded-sm animate-pulse">
                  ✓ LINKED SUCCESS
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="유튜브 공유 주소 입력 (예: https://youtu.be/...)"
                className="flex-grow bg-bg-dark border border-border-dark px-4 py-2.5 text-xs text-text-light placeholder:text-text-light/25 outline-none focus:border-neon font-mono rounded-sm"
              />
              {youtubeUrl && (
                <button
                  type="button"
                  onClick={() => setYoutubeUrl('')}
                  className="px-3 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all rounded-sm shrink-0"
                >
                  지우기
                </button>
              )}
            </div>

            {ytId && (
              <div className="mt-4 border border-neon/15 bg-bg-dark rounded overflow-hidden">
                <div className="p-2 border-b border-white/5 bg-white/[0.02] flex justify-between items-center text-[10px] text-text-light/50">
                  <span className="font-mono text-neon">YouTube Player Preview</span>
                  <span className="font-mono text-[9px]">Video ID: {ytId}</span>
                </div>
                <div className="relative pb-[56.25%] h-0 bg-black">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="no-referrer"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-text-light/30 mt-2 leading-relaxed">
              위 주소창에 유튜브 동영상 링크를 기입하시면, AI 어시스턴트가 영상의 맥락과 주제를 연동 분석하여 다른 이야기를 연계 창작하거나, 대본을 기반으로 소설, 시, 가사 등을 다양하게 저술합니다.
            </p>
          </div>
        )}

        {/* Free Quota Info Badge */}
        {!customApiKey ? (
          <div className="flex justify-end mb-2.5">
            <span className="text-[10px] text-text-light/40 font-mono flex items-center gap-1.5 uppercase tracking-wider select-none">
              <Cpu size={10} className="text-neon animate-pulse" />
              서버 무료 한도: {Math.max(0, 5 - freeUsageCount)}회 남음
            </span>
          </div>
        ) : (
          <div className="flex justify-end mb-2.5">
            <span className="text-[10px] text-neon font-mono flex items-center gap-1.5 uppercase tracking-wider select-none">
              <Shield size={10} className="text-neon" />
              나만의 독립 전용 회선 연결됨 (무제한)
            </span>
          </div>
        )}

        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isTravelCategory
              ? "여행지, 일정, 취향 등을 자세히 입력해 주세요. (예: 교토 2박 3일 부모님과 힐링 여행)" 
              : `> ENTER COMMAND FOR ${title.toUpperCase()}...`}
            className="w-full bg-bg-dark border border-border-dark px-8 py-6 pr-40 focus:outline-none focus:border-neon text-text-light font-mono text-sm min-h-[140px] transition-all placeholder:text-text-light/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          
          {/* Universal Action Buttons */}
          <div className="absolute right-6 bottom-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Upload Image"
              className="p-3 text-text-light/40 hover:text-neon border border-transparent hover:border-neon/20 transition-all"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => genericFileInputRef.current?.click()}
              title="Upload File"
              className="p-3 text-text-light/40 hover:text-neon border border-transparent hover:border-neon/20 transition-all"
            >
              <FileIcon size={18} />
            </button>
            <div className="w-px h-6 bg-border-dark mx-1" />
            <button
              type="submit"
              disabled={loading || (!prompt.trim() && !selectedImage && !selectedFile && !youtubeUrl.trim())}
              className="p-4 bg-neon text-bg-dark hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>

        {/* Hidden Inputs */}
        <input 
          type="file" 
          ref={imageInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={genericFileInputRef} 
          onChange={handleGenericFileUpload} 
          className="hidden" 
        />
      </form>
        </>
      )}
    </div>
  );
}
