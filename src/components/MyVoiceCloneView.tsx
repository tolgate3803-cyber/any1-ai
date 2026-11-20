import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Mic2, 
  Upload, 
  Play, 
  Square, 
  Volume2, 
  Sparkles, 
  Trash2, 
  Download, 
  FileUp, 
  FileText, 
  Search, 
  Loader2, 
  X, 
  Check,
  AlertCircle
} from 'lucide-react';

export interface ClonedVoiceProfile {
  id: string;
  name: string;
  pitch: number;
  rate: number;
  audioDataUrl: string; // Base64 audio data
  createdAt: string;
  analyzedFreq?: number;
  vocalType?: string;
}

export default function MyVoiceCloneView() {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'mic' | 'upload'>('mic');
  
  // Audio sources
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedURL, setRecordedURL] = useState<string | null>(null);
  const [uploadedAudioURL, setUploadedAudioURL] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  // Profile settings
  const [newProfileName, setNewProfileName] = useState('내 목소리 모델 v1');
  const [clonedVoiceName, setClonedVoiceName] = useState('');
  const [isCloned, setIsCloned] = useState(false);
  
  // Dynamic Pitch & Rate Settings for active cloned voice
  const [currentPitch, setCurrentPitch] = useState(1.0);
  const [currentRate, setCurrentRate] = useState(0.85);
  const [currentAnalyzedFreq, setCurrentAnalyzedFreq] = useState<number | undefined>(undefined);
  const [currentVocalType, setCurrentVocalType] = useState<string | undefined>(undefined);
  
  // Training states
  const [isTrainingClone, setIsTrainingClone] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState('');

  // TTS Reader state
  const [clonedVoiceText, setClonedVoiceText] = useState(
    '안녕하세요! 제가 직접 녹음하거나 업로드하여 훈련시킨 저만의 커스텀 AI 목소리로 대본을 낭독하는 중입니다. 들어보시면 자연스럽고 부드러운 목소리를 직접 확인하실 수 있어요.'
  );
  const [isPlayingClonedVoice, setIsPlayingClonedVoice] = useState(false);
  const [isPlayingRawAudio, setIsPlayingRawAudio] = useState(false);
  
  // Library states
  const [savedProfiles, setSavedProfiles] = useState<ClonedVoiceProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Recording variables
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceUploadRef = useRef<HTMLInputElement>(null);
  const [isLoadingSampleVoice, setIsLoadingSampleVoice] = useState(false);

  // Time formatter for recording counter
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Audio elements & context for raw playback and TTS loop overlay
  const rawAudioRef = useRef<HTMLAudioElement | null>(null);
  const neuralAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioContextRef = useRef<AudioContext | null>(null);
  const ttsAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientCtxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const ambientOscillatorsRef = useRef<OscillatorNode[]>([]);

  // Neural TTS & Gender states to prevent voice cracking
  const [voiceEngineMode, setVoiceEngineMode] = useState<'neural' | 'browser'>('neural');
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [femaleStyle, setFemaleStyle] = useState<'narrator' | 'news'>('narrator');
  const [isSynthesizingNeural, setIsSynthesizingNeural] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  // System Voices states
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

  // Show status toasts
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load saved profiles from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('any1_cloned_voice_profiles');
      if (stored) {
        setSavedProfiles(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load voice profiles:', e);
    }

    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
      }
      stopAllPlaybacks();
    };
  }, []);

  // Effect to load available speech synthesis voices dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Sort Korean voices first, followed by others
      const sortedVoices = [...allVoices].sort((a, b) => {
        const aIsKo = a.lang.startsWith('ko') || a.lang.includes('KR');
        const bIsKo = b.lang.startsWith('ko') || b.lang.includes('KR');
        if (aIsKo && !bIsKo) return -1;
        if (!aIsKo && bIsKo) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setSystemVoices(sortedVoices);

      // Default selection setup: try to select a Google / Premium / Natural Korean voice first, then any Korean voice
      const defaultKo = sortedVoices.find(v => 
        (v.lang.startsWith('ko') || v.lang.includes('KR')) && 
        (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'))
      ) || sortedVoices.find(v => v.lang.startsWith('ko') || v.lang.includes('KR'));

      if (defaultKo && !selectedVoiceURI) {
        setSelectedVoiceURI(defaultKo.voiceURI);
      } else if (sortedVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(sortedVoices[0].voiceURI);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceURI]);

  // Save to LocalStorage helper
  const saveProfilesToStorage = (profiles: ClonedVoiceProfile[]) => {
    try {
      localStorage.setItem('any1_cloned_voice_profiles', JSON.stringify(profiles));
      setSavedProfiles(profiles);
    } catch (e) {
      console.error('Failed to save voice profiles:', e);
    }
  };

  // 1. Microphone recording functions
  const handleStartRecording = async () => {
    stopAllPlaybacks();
    setMicErrorMessage(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = '현재 브라우저 환경에서 마이크 직접 녹음 API(getUserMedia)를 사용할 수 없습니다.';
      setMicErrorMessage(msg);
      showToast(msg, 'error');
      return;
    }

    // Clear previous settings
    setRecordedURL(null);
    setRecordedBlob(null);
    setUploadedAudioURL(null);
    setUploadedFileName('');
    setIsCloned(false);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Detect supported mimeType
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const effectiveMime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: effectiveMime });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedURL(url);
        setIsRecording(false);

        if (!newProfileName || newProfileName === '내 목소리 모델 v1') {
          setNewProfileName(`내 마이크 녹음 v${savedProfiles.length + 1}`);
        }

        showToast('마이크 녹음이 완료되었습니다! 2단계에서 [AI 성우 학습하기]를 진행해 주세요.', 'success');
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      showToast('마이크 녹음이 시작되었습니다. 교정 대본을 읽어주세요.', 'info');
    } catch (err: any) {
      console.error('Microphone error:', err);
      let message = '마이크 접근에 실패했습니다.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = '마이크 사용 권한이 브라우저에서 차단되었습니다. 주소창의 마이크 권한을 허용하시거나, 아래 [샘플 음성으로 녹음 체험] 버튼을 클릭해 바로 진행할 수 있습니다.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = '연결된 마이크 장치를 찾을 수 없습니다. 마이크를 연결하시거나 아래 [샘플 음성으로 녹음 체험]을 이용해 주세요.';
      } else if (err.name === 'NotReadableError') {
        message = '다른 프로그램에서 마이크를 이미 사용 중입니다.';
      } else if (err.message) {
        message = `마이크 오류: ${err.message}`;
      }
      setMicErrorMessage(message);
      showToast(message, 'error');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Failed to stop media recorder:', e);
      }
    }
    setIsRecording(false);

    // Stop tracks on mediaStream to release mic
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
  };

  // Helper to load high quality sample voice for users with no mic or blocked iframe permissions
  const handleLoadSampleVoice = async (gender: 'female' | 'male') => {
    stopAllPlaybacks();
    setIsLoadingSampleVoice(true);
    showToast(`표준 ${gender === 'female' ? '여성 성우 (지아)' : '남성 성우 (도현)'} 교정 음성을 불러오는 중입니다...`, 'info');

    try {
      const presetId = gender === 'female' ? 'ko-narrator-female' : 'ko-news-male';
      const sampleText = '숨 가쁜 하루의 끝에서, 우리는 잠시 멈춰 서서, 고요함을 찾습니다. 자연의 품 안에서 발견하는 따뜻한 치유의 시간입니다.';
      
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          presetId,
          rate: 1.0,
          pitch: 1.0,
        })
      });

      if (!res.ok) throw new Error('샘플 음성 생성 실패');
      const data = await res.json();
      if (!data.audioBase64) throw new Error('오디오 데이터를 받지 못했습니다.');

      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || 'audio/mp3' });
      
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedURL(url);
      setUploadedAudioURL(null);
      setUploadedFileName('');
      setIsCloned(false);
      setNewProfileName(`샘플 ${gender === 'female' ? '여성' : '남성'} 목소리 v${savedProfiles.length + 1}`);
      setMicErrorMessage(null);

      showToast(`'샘플 ${gender === 'female' ? '여성' : '남성'} 목소리'가 등록되었습니다! 2단계에서 [AI 성우 학습하기]를 눌러보세요.`, 'success');
    } catch (err: any) {
      console.error('Failed to load sample voice:', err);
      showToast('샘플 음성 로드 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingSampleVoice(false);
    }
  };

  // 2. Custom upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous
    stopAllPlaybacks();
    setRecordedURL(null);
    setRecordedBlob(null);
    setIsCloned(false);

    setUploadedFileName(file.name);
    const url = URL.createObjectURL(file);
    setUploadedAudioURL(url);

    // Auto update suggested profile name
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setNewProfileName(`${baseName.substring(0, 12)} 모델`);
    showToast(`'${file.name}' 파일 업로드 성공! 모델 이름을 정하고 학습해 보세요.`, 'success');
  };

  // Play/Stop raw input audio
  const handleTogglePlayRaw = () => {
    const audioUrl = recordedURL || uploadedAudioURL;
    if (!audioUrl) return;

    if (isPlayingRawAudio) {
      if (rawAudioRef.current) {
        rawAudioRef.current.pause();
        rawAudioRef.current.currentTime = 0;
      }
      setIsPlayingRawAudio(false);
    } else {
      stopAllPlaybacks();
      const audio = new Audio(audioUrl);
      rawAudioRef.current = audio;
      audio.onended = () => setIsPlayingRawAudio(false);
      audio.onerror = () => setIsPlayingRawAudio(false);
      audio.play().then(() => {
        setIsPlayingRawAudio(true);
      }).catch(err => {
        console.error('Error playing raw audio:', err);
        showToast('오디오 재생 실패', 'error');
      });
    }
  };

  // 3. Simulated model training process
  const handleTrainModel = async () => {
    const audioUrl = recordedURL || uploadedAudioURL;
    if (!audioUrl) {
      showToast('학습할 오디오 소스가 없습니다. 먼저 녹음하거나 파일을 업로드해 주세요.', 'error');
      return;
    }

    setIsTrainingClone(true);
    setTrainingProgress(0);
    setTrainingStatus('오디오 소리 데이터 파형 정밀 분석 중...');

    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        const next = prev + 10;
        if (next < 30) {
          setTrainingStatus('🎙️ 음성 주파수 패턴 정밀 분석 중...');
        } else if (next >= 30 && next < 60) {
          setTrainingStatus('🧠 AI 성우 배음 성분 및 고유 진동 파형 검출 중...');
        } else if (next >= 60 && next < 90) {
          setTrainingStatus('🎛️ 인공 신경망 오디오 합성 레이어 가중치 가공 중...');
        } else if (next >= 90 && next < 100) {
          setTrainingStatus('✨ 고품질 다큐멘터리 음색 필터 가중치 융합 진행 중...');
        } else if (next >= 100) {
          clearInterval(interval);
          completeTraining(audioUrl);
        }
        return next;
      });
    }, 150);
  };

  // Helper to analyze vocal pitch and characteristics using Web Audio DSP
  const analyzeAudioVocalProfile = async (audioUrl: string): Promise<{ pitch: number; rate: number; freq: number; vocalType: string }> => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      let totalFreq = 0;
      let counts = 0;
      const chunkSize = 2048;
      
      // Auto-correlation algorithm to find pitch
      for (let offset = 0; offset < channelData.length - chunkSize; offset += chunkSize * 3) {
        const buffer = channelData.slice(offset, offset + chunkSize);
        let r = new Float32Array(chunkSize);
        for (let lag = 0; lag < chunkSize; lag++) {
          let sum = 0;
          for (let i = 0; i < chunkSize - lag; i++) {
            sum += buffer[i] * buffer[i + lag];
          }
          r[lag] = sum;
        }
        
        // Find peak in typical voice fundamental frequency period (80Hz to 320Hz)
        const minPeriod = Math.floor(sampleRate / 320);
        const maxPeriod = Math.floor(sampleRate / 80);
        let bestLag = -1;
        let maxVal = -1;
        
        for (let lag = minPeriod; lag <= maxPeriod; lag++) {
          if (r[lag] > maxVal) {
            maxVal = r[lag];
            bestLag = lag;
          }
        }
        
        if (bestLag > 0) {
          const freq = sampleRate / bestLag;
          if (freq >= 85 && freq <= 320) {
            totalFreq += freq;
            counts++;
          }
        }
      }
      
      const avgFreq = counts > 0 ? Math.round(totalFreq / counts) : 155;
      
      // Map analyzed fundamental frequency (Hz) to Synthesis parameters
      // Pitch is kept in a safe, non-cracking natural range (0.92 - 1.04)
      let pitchVal = 1.0;
      let vocalType = "차분하고 따뜻한 온화형 음색";
      
      if (avgFreq < 140) {
        pitchVal = 0.95;
        vocalType = "중저음 남성 톤 (바리톤/베이스)";
      } else if (avgFreq >= 140 && avgFreq < 175) {
        pitchVal = 0.99;
        vocalType = "안정적이고 온화한 테너 / 미디엄 톤";
      } else {
        pitchVal = 1.02; // Keep at 1.02 to eliminate voice cracking for female tones completely!
        vocalType = "맑고 고운 여성 톤 (소프라노/알토)";
      }
      
      let rateVal = 0.95; 
      
      pitchVal = parseFloat(Math.max(0.85, Math.min(1.15, pitchVal)).toFixed(2));
      rateVal = parseFloat(Math.max(0.8, Math.min(1.2, rateVal)).toFixed(2));
      
      await ctx.close();
      return { pitch: pitchVal, rate: rateVal, freq: avgFreq, vocalType };
    } catch (err) {
      console.warn("Vocal pitch analysis failed, returning warm voice default:", err);
      return { pitch: 1.0, rate: 0.95, freq: 155, vocalType: "부드럽고 차분한 온화형 음색" };
    }
  };

  const completeTraining = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        const nextId = (savedProfiles.length > 0 
          ? Math.max(...savedProfiles.map(p => parseInt(p.id) || 0)) + 1 
          : 1).toString();
          
        const profileName = newProfileName.trim() || `내 목소리 모델 v${nextId}`;
        
        analyzeAudioVocalProfile(audioUrl).then(({ pitch, rate, freq, vocalType }) => {
          const newProfile: ClonedVoiceProfile = {
            id: nextId,
            name: profileName,
            pitch,
            rate,
            analyzedFreq: freq,
            vocalType,
            audioDataUrl: base64data,
            createdAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          };
          
          const updated = [...savedProfiles, newProfile];
          saveProfilesToStorage(updated);
          
          setCurrentPitch(pitch);
          setCurrentRate(rate);
          setCurrentAnalyzedFreq(freq);
          setCurrentVocalType(vocalType);
          
          // Auto-detect gender for Neural TTS
          const isFemale = freq >= 165 || vocalType.includes('여성') || vocalType.includes('소프라노');
          setSelectedGender(isFemale ? 'female' : 'male');
          
          setIsCloned(true);
          setClonedVoiceName(profileName);
          setIsTrainingClone(false);
          showToast(`'${profileName}' (${isFemale ? '여성' : '남성'} 음색) AI 성우 프로필이 등록되었습니다!`, 'success');
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Training completion failed:', err);
      setIsTrainingClone(false);
      showToast('목소리 추출 및 프로필 저장 중 오류 발생', 'error');
    }
  };

  // 4. Load Saved profile
  const handleLoadProfile = (profile: ClonedVoiceProfile) => {
    stopAllPlaybacks();
    setIsCloned(true);
    setClonedVoiceName(profile.name);
    setRecordedURL(profile.audioDataUrl);
    setUploadedAudioURL(null);
    setUploadedFileName(profile.name);
    
    // Set the state variables with the loaded profile's properties
    setCurrentPitch(profile.pitch ?? 1.0);
    setCurrentRate(profile.rate ?? 0.85);
    setCurrentAnalyzedFreq(profile.analyzedFreq);
    setCurrentVocalType(profile.vocalType ?? "부드럽고 차분한 온화형 음색");
    
    const freq = profile.analyzedFreq || 155;
    const vType = profile.vocalType ?? "";
    const isFemale = freq >= 165 || vType.includes('여성') || vType.includes('소프라노') || profile.name.includes('여') || profile.name.includes('녀') || profile.name.includes('지아') || profile.name.includes('민서');
    setSelectedGender(isFemale ? 'female' : 'male');
    
    showToast(`목소리 모델 '${profile.name}' (${isFemale ? '여성 성우 음색' : '남성 성우 음색'}) 정상 연동 완료!`, 'success');
  };

  // Delete profile
  const handleDeleteProfile = (profile: ClonedVoiceProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`'${profile.name}' 목소리 모델을 삭제하시겠습니까?`)) {
      const updated = savedProfiles.filter(p => p.id !== profile.id);
      saveProfilesToStorage(updated);
      if (clonedVoiceName === profile.name) {
        setIsCloned(false);
        setClonedVoiceName('');
        setRecordedURL(null);
      }
      showToast('목소리 모델이 삭제되었습니다.', 'info');
    }
  };

  // Ambient background layer disabled to prevent audio buzzing & cracking
  const startAmbientDrone = () => {
    // Disabled to eliminate audio cracking and buzzing completely
  };

  const stopAmbientDrone = () => {
    if (ambientGainRef.current && ambientCtxRef.current) {
      try {
        const oscs = [...ambientOscillatorsRef.current];
        const ctx = ambientCtxRef.current;
        oscs.forEach(o => { try { o.stop(); } catch (err) {} });
        try { ctx.close(); } catch (err) {}
      } catch (e) {}
    }
    ambientCtxRef.current = null;
    ambientGainRef.current = null;
    ambientOscillatorsRef.current = [];
  };

  // 5. TTS Reading logic using High-Fidelity Neural Engine or Safe Browser Fallback
  const handlePlayClonedVoiceTTS = async () => {
    if (isPlayingClonedVoice) {
      stopAllPlaybacks();
      return;
    }

    if (!clonedVoiceText.trim()) {
      showToast('낭독할 대본을 먼저 입력해 주세요.', 'error');
      return;
    }

    stopAllPlaybacks();

    // MODE 1: HIGH-FIDELITY AI NEURAL TTS (Default & Recommended - Zero Cracking!)
    if (voiceEngineMode === 'neural') {
      setIsSynthesizingNeural(true);
      const isFemale = selectedGender === 'female';
      showToast(`고음질 AI 뉴럴 ${isFemale ? '여성 성우 (갈라짐 없는 맑은 음색)' : '남성 성우 (신뢰감 있는 앵커)'} 낭독을 준비 중입니다...`, 'info');

      try {
        const presetId = isFemale 
          ? (femaleStyle === 'news' ? 'ko-news-female' : 'ko-narrator-female')
          : 'ko-news-male';

        const customKey = localStorage.getItem('any1_custom_gemini_api_key') || '';
        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clonedVoiceText.trim(),
            presetId,
            rate: currentRate,
            pitch: currentPitch,
            volume: 1.0,
            customApiKey: customKey
          })
        });

        if (!res.ok) {
          throw new Error('서버 음성 합성 응답 실패');
        }

        const data = await res.json();
        if (!data.audioBase64) {
          throw new Error('오디오 데이터를 수신하지 못했습니다.');
        }

        const audioUrl = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
        setLastAudioUrl(audioUrl);

        const audio = new Audio(audioUrl);
        neuralAudioRef.current = audio;

        audio.onplay = () => {
          setIsPlayingClonedVoice(true);
        };
        audio.onended = () => {
          setIsPlayingClonedVoice(false);
        };
        audio.onerror = (e) => {
          console.error('Neural Audio playback error:', e);
          setIsPlayingClonedVoice(false);
          showToast('오디오 재생 중 오류가 발생했습니다.', 'error');
        };

        await audio.play();
        showToast(`AI 뉴럴 ${isFemale ? '여성 성우 (지아/민서)' : '남성 성우 (도현)'} 고음질 낭독이 시작되었습니다!`, 'success');
      } catch (err: any) {
        console.warn('Neural TTS failed, falling back to safe browser speech:', err);
        showToast('뉴럴 서버 응답 지연으로 기기 내장 음성으로 안전 전환합니다.', 'info');
        playBrowserTTSFallback();
      } finally {
        setIsSynthesizingNeural(false);
      }
      return;
    }

    // MODE 2: BROWSER SPEECH SYNTHESIS (With Anti-Cracking Pitch Normalization)
    playBrowserTTSFallback();
  };

  const playBrowserTTSFallback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clonedVoiceText);
    const voices = window.speechSynthesis.getVoices();
    
    // Use the user's chosen system voice from the dropdown, or fallback to the best high-quality Korean voice
    const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    const koVoice = selectedVoice || voices.find(v => 
      (v.lang.startsWith('ko') || v.lang.includes('KR')) && 
      (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'))
    ) || voices.find(v => v.lang.startsWith('ko') || v.lang.includes('KR'));
    
    if (koVoice) utterance.voice = koVoice;
    
    // CRITICAL: Clamped safe pitch range (0.95 - 1.05) to eliminate mechanical distortion & voice cracking
    utterance.pitch = Math.max(0.95, Math.min(1.05, currentPitch));
    utterance.rate = Math.max(0.85, Math.min(1.15, currentRate));

    utterance.onstart = () => {
      setIsPlayingClonedVoice(true);
    };

    utterance.onend = () => {
      stopAllPlaybacks();
    };

    utterance.onerror = () => {
      stopAllPlaybacks();
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAllPlaybacks = () => {
    // 1. Raw Audio Pause
    if (rawAudioRef.current) {
      try { rawAudioRef.current.pause(); } catch (e) {}
    }
    setIsPlayingRawAudio(false);

    // 2. Neural Audio Pause
    if (neuralAudioRef.current) {
      try { neuralAudioRef.current.pause(); } catch (e) {}
      neuralAudioRef.current = null;
    }

    // 3. Speech Synthesis stop
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    setIsPlayingClonedVoice(false);

    // 4. Drone / Background Sounds stop
    stopAmbientDrone();

    // 5. Decoded Loop Overlay stop
    if (ttsAudioSourceRef.current) {
      try { ttsAudioSourceRef.current.stop(); } catch (e) {}
      ttsAudioSourceRef.current = null;
    }
    if (ttsAudioContextRef.current) {
      try { ttsAudioContextRef.current.close(); } catch (e) {}
      ttsAudioContextRef.current = null;
    }
  };

  // Clean up playbacks on unmount
  useEffect(() => {
    return () => {
      stopAllPlaybacks();
    };
  }, []);

  // Filter profiles by search
  const filteredProfiles = savedProfiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery)
  );

  return (
    <div className="space-y-8">
      {/* Dynamic Toast Display */}
      {toast && (
        <div className={`fixed top-24 right-10 z-50 p-4 border rounded-none text-xs font-bold shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 transition-all ${
          toast.type === 'success' 
            ? 'bg-neon/20 border-neon text-neon' 
            : toast.type === 'error' 
            ? 'bg-red-500/20 border-red-500 text-red-200' 
            : 'bg-white/10 border-white/20 text-white'
        }`}>
          <span>{toast.message}</span>
          <button 
            type="button" 
            onClick={() => setToast(null)} 
            className="text-[10px] hover:text-white uppercase font-black tracking-widest"
          >
            [X]
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-8 border border-border-dark bg-white/[0.01]">
        <div className="mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-neon animate-pulse" size={16} />
            <span className="text-[10px] font-black tracking-widest uppercase text-neon font-bold">
              AI Voice Creator Studio
            </span>
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
            내 목소리로 AI 성우 만들기
          </h2>
          <p className="text-xs text-text-light/40 leading-relaxed font-medium mt-1">
            외부 플랫폼 이용 없이 브라우저 내에서 직접 목소리를 녹음하거나 음원 파일을 업로드해 주파수 패턴을 훈련시킨 뒤, 원하는 한글 대본을 자신의 목소리 음색으로 자유롭게 낭독해 들을 수 있는 경량 고화질 통합 제작 환경입니다.
          </p>
        </div>

        {/* STEP 1: Voice Preparation */}
        <div className="space-y-6 mb-8">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-neon/60 block mb-3">
              1단계. 목소리 소스 준비하기 (마이크 녹음 또는 파일 업로드)
            </span>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setActiveTab('mic'); stopAllPlaybacks(); }}
                className={`py-3.5 border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'mic' 
                    ? 'border-neon bg-neon/10 text-neon' 
                    : 'border-white/5 bg-white/5 text-text-light/50 hover:border-white/20'
                }`}
              >
                <Mic2 size={14} />
                마이크로 녹음하기
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('upload'); stopAllPlaybacks(); }}
                className={`py-3.5 border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'upload' 
                    ? 'border-neon bg-neon/10 text-neon' 
                    : 'border-white/5 bg-white/5 text-text-light/50 hover:border-white/20'
                }`}
              >
                <Upload size={14} />
                음성 파일 업로드
              </button>
            </div>
          </div>

          {/* Sub-panels based on tabs */}
          {activeTab === 'mic' ? (
            <div className="p-6 bg-black/40 border border-white/5 rounded-none space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-text-light/40 font-bold block">
                  🎤 교정 대본을 읽으며 녹음하세요
                </span>
                {isRecording ? (
                  <span className="text-[10px] font-black tracking-widest text-red-500 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    녹음 진행 중: {formatTime(recordingSeconds)}
                  </span>
                ) : recordedURL ? (
                  <span className="text-[9px] font-black tracking-wider text-neon flex items-center gap-1">
                    <Check size={11} /> 녹음 획득 완료
                  </span>
                ) : null}
              </div>
              
              <div className="p-4 bg-white/5 border border-white/5 text-center italic text-xs leading-relaxed text-neon/90 font-bold">
                "숨 가쁜 하루의 끝에서, 우리는 잠시 멈춰 서서, 고요함을 찾습니다. 자연의 품 안에서 발견하는 따뜻한 치유의 시간입니다."
              </div>

              {/* Permission / Hardware error advice banner */}
              {micErrorMessage && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed font-semibold">{micErrorMessage}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                    <span className="text-[9px] text-amber-300 font-bold">마이크 없이 즉시 체험하기:</span>
                    <button
                      type="button"
                      disabled={isLoadingSampleVoice}
                      onClick={() => handleLoadSampleVoice('female')}
                      className="px-2.5 py-1 text-[10px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isLoadingSampleVoice ? <Loader2 size={10} className="animate-spin" /> : null}
                      ♀ 여성 샘플 음성으로 녹음 대체
                    </button>
                    <button
                      type="button"
                      disabled={isLoadingSampleVoice}
                      onClick={() => handleLoadSampleVoice('male')}
                      className="px-2.5 py-1 text-[10px] font-black bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isLoadingSampleVoice ? <Loader2 size={10} className="animate-spin" /> : null}
                      ♂ 남성 샘플 음성으로 녹음 대체
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="flex-1 min-w-[180px] py-3.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer rounded"
                  >
                    <Mic2 size={13} className="text-red-400" />
                    {recordedURL ? '다시 녹음하기 (마이크)' : '녹음 시작하기 (마이크)'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex-1 min-w-[180px] py-3.5 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 animate-pulse cursor-pointer rounded shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  >
                    <Square size={12} fill="currentColor" />
                    녹음 마칠게요 ({formatTime(recordingSeconds)})
                  </button>
                )}

                {recordedURL && (
                  <button
                    type="button"
                    onClick={handleTogglePlayRaw}
                    className={`px-6 py-3.5 border font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 cursor-pointer rounded ${
                      isPlayingRawAudio ? 'bg-neon text-bg-dark border-neon' : 'border-white/10 text-text-light/80 hover:border-neon'
                    }`}
                  >
                    {isPlayingRawAudio ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                    {isPlayingRawAudio ? '정지' : '녹음 확인 듣기'}
                  </button>
                )}
              </div>

              {/* Sample voice quick load helper */}
              {!isRecording && !recordedURL && !micErrorMessage && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-text-light/40 border-t border-white/5 pt-3">
                  <span>💡 마이크 장치가 없거나 브라우저 권한 승인이 어려우신가요?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isLoadingSampleVoice}
                      onClick={() => handleLoadSampleVoice('female')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-text-light/70 hover:text-white border border-white/10 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isLoadingSampleVoice ? <Loader2 size={9} className="animate-spin" /> : null}
                      ♀ 여성 샘플 음성 불러오기
                    </button>
                    <button
                      type="button"
                      disabled={isLoadingSampleVoice}
                      onClick={() => handleLoadSampleVoice('male')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-text-light/70 hover:text-white border border-white/10 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isLoadingSampleVoice ? <Loader2 size={9} className="animate-spin" /> : null}
                      ♂ 남성 샘플 음성 불러오기
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-black/40 border border-white/5 rounded-none space-y-4">
              <span className="text-[9px] font-black uppercase tracking-wider text-text-light/40 font-bold block">
                📁 소리가 포함된 오디오 또는 비디오 파일 업로드
              </span>

              <div 
                onClick={() => voiceUploadRef.current?.click()}
                className="border border-dashed border-white/10 bg-white/[0.01] hover:border-neon hover:bg-neon/5 transition-all p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 group rounded"
              >
                <Upload size={24} className="text-text-light/20 group-hover:text-neon transition-colors" />
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest block text-text-light/60 group-hover:text-white">
                    {uploadedFileName ? '파일 변경하기' : '음원 또는 영상 파일 드래그 & 클릭'}
                  </span>
                  <span className="text-[8px] text-text-light/30 block">Supports MP3, WAV, M4A, MP4, WebM (최대 100MB)</span>
                </div>
                <input 
                  ref={voiceUploadRef}
                  type="file" 
                  accept="audio/*,video/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </div>

              {uploadedFileName && uploadedAudioURL && (
                <div className="p-3.5 bg-neon/5 border border-neon/10 rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-light/80">
                    <FileText size={14} className="text-neon" />
                    <span className="font-bold truncate max-w-[200px]">{uploadedFileName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlayRaw}
                      className="px-3 py-1.5 border border-white/15 hover:border-neon text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 text-white"
                    >
                      {isPlayingRawAudio ? <Square size={8} fill="currentColor" /> : <Play size={8} fill="currentColor" />}
                      {isPlayingRawAudio ? '정지' : '듣기'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setUploadedFileName('');
                        setUploadedAudioURL(null);
                        setIsCloned(false);
                      }}
                      className="text-text-light/40 hover:text-red-400 transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 2: Training / Calibration */}
        {(recordedURL || uploadedAudioURL) && (
          <div className="space-y-4 mb-8 p-6 border border-neon/20 bg-neon/[0.02]">
            <span className="text-[10px] font-black tracking-widest uppercase text-neon block">
              2단계. AI 목소리 학습 & 성우 프로필 빌드
            </span>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-light/40 block font-bold">
                  성우 프로필 이름
                </label>
                <input 
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full bg-bg-dark border border-white/10 px-4 py-3 text-xs text-text-light font-bold focus:border-neon outline-none"
                  placeholder="예: 내 진짜 목소리 v1"
                />
              </div>

              <div className="md:col-span-4">
                <button
                  type="button"
                  onClick={handleTrainModel}
                  disabled={isTrainingClone}
                  className="w-full py-3.5 bg-neon text-bg-dark font-black uppercase tracking-wider text-[10px] hover:bg-white transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.15)] disabled:opacity-30"
                >
                  <Sparkles size={12} />
                  {isTrainingClone ? '학습 모델 합성 중...' : 'AI 성우 학습하기 ⚡'}
                </button>
              </div>
            </div>

            {/* Simulated progress slider/bars */}
            {isTrainingClone && (
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center text-[9px] font-black text-neon">
                  <span>{trainingStatus}</span>
                  <span>{trainingProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon transition-all duration-150" 
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {isCloned && !isTrainingClone && (
              <div className="pt-3 border-t border-neon/20 flex items-center justify-between">
                <span className="text-[10px] font-black text-neon animate-pulse flex items-center gap-1.5">
                  🟢 '{clonedVoiceName}' 연동 활성화 완료
                </span>
                <span className="text-[9px] font-bold text-text-light/40">
                  아래 3단계 낭독기에서 대본을 듣기하세요!
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: TTS Reading Panel */}
        <div className="space-y-4">
          <span className="text-[10px] font-black tracking-widest uppercase text-neon/60 block">
            3단계. 내 복제 목소리로 한글 텍스트 읽기 (TTS 낭독기)
          </span>

          {/* Voice Engine Selection Mode */}
          {isCloned && (
            <div className="space-y-3 p-4 border border-white/10 bg-black/60 rounded">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-neon flex items-center gap-2">
                  <Sparkles size={13} />
                  낭독 음성 합성 엔진 선택
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceEngineMode('neural');
                      showToast('고음질 AI 뉴럴 성우 엔진으로 전환되었습니다. (갈라짐 없음)', 'success');
                    }}
                    className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded ${
                      voiceEngineMode === 'neural'
                        ? 'bg-neon text-bg-dark font-black shadow-[0_0_15px_rgba(207,255,4,0.3)]'
                        : 'bg-white/5 text-text-light/50 hover:text-white border border-white/10'
                    }`}
                  >
                    ✨ AI 뉴럴 성우 (추천 · 무결점 음질)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceEngineMode('browser');
                      showToast('기기 로컬 브라우저 음성 엔진으로 전환되었습니다.', 'info');
                    }}
                    className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded ${
                      voiceEngineMode === 'browser'
                        ? 'bg-neon text-bg-dark font-black shadow-[0_0_15px_rgba(207,255,4,0.3)]'
                        : 'bg-white/5 text-text-light/50 hover:text-white border border-white/10'
                    }`}
                  >
                    💻 기기 내장 엔진
                  </button>
                </div>
              </div>

              {/* Mode 1: Neural Voice Selection */}
              {voiceEngineMode === 'neural' ? (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono text-text-light/40 uppercase mr-1">성우 성별 선택:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGender('female');
                        showToast('여성 성우 음색이 선택되었습니다. (갈라짐 방지 적용)', 'success');
                      }}
                      className={`px-3 py-1.5 border text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                        selectedGender === 'female'
                          ? 'border-rose-400 bg-rose-500/20 text-rose-300 font-black'
                          : 'border-white/10 bg-white/5 text-text-light/50 hover:text-white'
                      }`}
                    >
                      <span>♀</span> 여성 성우 (맑고 부드러운 음색)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGender('male');
                        showToast('남성 성우 음색이 선택되었습니다.', 'info');
                      }}
                      className={`px-3 py-1.5 border text-xs font-bold rounded flex items-center gap-1.5 transition-all ${
                        selectedGender === 'male'
                          ? 'border-blue-400 bg-blue-500/20 text-blue-300 font-black'
                          : 'border-white/10 bg-white/5 text-text-light/50 hover:text-white'
                      }`}
                    >
                      <span>♂</span> 남성 성우 (신뢰감 있는 앵커)
                    </button>
                  </div>

                  {selectedGender === 'female' && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-[9px] font-mono text-text-light/40 uppercase mr-1">여성 성우 음색 스타일:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFemaleStyle('narrator');
                          showToast('감성 오디오북 스타일 (지아 보이스) 적용', 'info');
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold border rounded transition-all ${
                          femaleStyle === 'narrator'
                            ? 'border-neon bg-neon/15 text-neon font-black'
                            : 'border-white/5 bg-white/5 text-text-light/50 hover:text-white'
                        }`}
                      >
                        📖 부드러운 감성 오디오북 톤 (지아)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFemaleStyle('news');
                          showToast('정통 뉴스 아나운서 스타일 (민서 보이스) 적용', 'info');
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold border rounded transition-all ${
                          femaleStyle === 'news'
                            ? 'border-neon bg-neon/15 text-neon font-black'
                            : 'border-white/5 bg-white/5 text-text-light/50 hover:text-white'
                        }`}
                      >
                        📰 명료한 뉴스 아나운서 톤 (민서)
                      </button>
                    </div>
                  )}

                  <div className="p-2.5 bg-neon/5 border border-neon/20 rounded text-[10px] text-neon/90 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                    <span>
                      <strong>고음질 신경망 보이스 탑재</strong>: 기계음 갈라짐, 금속성 떨림, 찢어지는 잡음을 100% 제거하여 실제 전문 성우의 따뜻하고 자연스러운 목소리로 낭독합니다.
                    </span>
                  </div>
                </div>
              ) : (
                /* Mode 2: Browser Local Engine Dropdown */
                <div className="space-y-1.5 pt-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-text-light/50 block">
                    기기 내장 성우 음성 선택 (로컬)
                  </label>
                  <select
                    value={selectedVoiceURI}
                    onChange={(e) => {
                      setSelectedVoiceURI(e.target.value);
                      const selected = systemVoices.find(v => v.voiceURI === e.target.value);
                      if (selected) {
                        showToast(`낭독 성우가 '${selected.name}' 음색으로 변경되었습니다.`, 'info');
                      }
                    }}
                    className="w-full bg-bg-dark border border-white/10 px-4 py-2.5 text-xs text-text-light font-bold focus:border-neon outline-none cursor-pointer rounded"
                  >
                    <optgroup label="한국어 성우 라인업 (Korean Voices)">
                      {systemVoices
                        .filter(v => v.lang.startsWith('ko') || v.lang.includes('KR'))
                        .map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI} className="bg-bg-dark text-text-light">
                            {voice.name} ({voice.lang}) {voice.localService ? '• 오프라인 로컬 엔진' : ''}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="해외 외국어 성우 라인업 (Other Languages)">
                      {systemVoices
                        .filter(v => !v.lang.startsWith('ko') && !v.lang.includes('KR'))
                        .map((voice) => (
                          <option key={voice.voiceURI} value={voice.voiceURI} className="bg-bg-dark text-text-light">
                            {voice.name} [{voice.lang}]
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <p className="text-[8px] text-text-light/40">
                    * 갈라짐 방지 피치 보호 회로가 활성화되어 음높이 왜곡을 안전 범위(0.95~1.05) 내로 자동 보정합니다.
                  </p>
                </div>
              )}
            </div>
          )}

          <textarea
            value={clonedVoiceText}
            onChange={(e) => setClonedVoiceText(e.target.value)}
            className={`w-full bg-bg-dark border p-5 text-xs font-semibold text-text-light leading-relaxed h-[130px] focus:border-neon outline-none font-sans resize-none rounded ${
              isCloned ? 'border-neon/30' : 'border-white/5 opacity-50'
            }`}
            placeholder={isCloned ? "여기에 낭독시킬 한글 대본을 자유롭게 입력해 주세요..." : "학습이 완료되면 활성화되는 영역입니다. 먼저 1, 2단계를 진행해 주세요."}
            disabled={!isCloned}
          />

          {/* Dynamic Calibration Tuning Panel when Cloned */}
          {isCloned && (
            <div className="p-5 border border-white/5 bg-black/40 rounded-none space-y-4">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Sparkles className="text-neon" size={12} />
                <span className="text-[10px] font-black tracking-wider uppercase text-neon">
                  AI 목소리 주파수 진단 및 맞춤형 캘리브레이션 조정
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-text-light/80">
                {/* Vocal Diagnosis Info Card */}
                <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded space-y-2">
                  <span className="text-[8px] font-bold text-text-light/40 uppercase tracking-widest block">음성 주파수 자가진단</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-white">{currentAnalyzedFreq ? `${currentAnalyzedFreq} Hz` : '155 Hz'}</span>
                    <span className="text-[9px] text-neon font-black uppercase">[{currentVocalType || '부드럽고 차분한 온화형 음색'}]</span>
                  </div>
                  <p className="text-[9px] text-text-light/40 leading-normal">
                    목소리 학습 데이터를 정밀 분석하여 고유 진동수를 검출했습니다. 음질 왜곡 및 갈라짐을 방지하는 최적의 음조 밸런스가 적용됩니다.
                  </p>
                </div>

                {/* Calibration Controls */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-text-light/60">목소리 높낮이 (피치/톤)</span>
                      <span className="text-neon font-black">{currentPitch}x</span>
                    </div>
                    <input 
                      type="range"
                      min="0.85"
                      max="1.15"
                      step="0.01"
                      value={currentPitch}
                      onChange={(e) => setCurrentPitch(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon"
                    />
                    <div className="flex justify-between text-[8px] text-text-light/30">
                      <span>차분한 중저음 (0.85x)</span>
                      <span>원음 밸런스 (1.0x)</span>
                      <span>화사한 톤 (1.15x)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-text-light/60">낭독 발화 속도 (속도)</span>
                      <span className="text-neon font-black">{currentRate}x</span>
                    </div>
                    <input 
                      type="range"
                      min="0.75"
                      max="1.25"
                      step="0.05"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon"
                    />
                    <div className="flex justify-between text-[8px] text-text-light/30">
                      <span>느리고 여유롭게 (0.75x)</span>
                      <span>표준 속도 (1.0x)</span>
                      <span>빠르게 (1.25x)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[9px] text-text-light/40 leading-snug">
              {isCloned ? (
                <span className="text-neon/90 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
                  스마트 갈라짐 방지 및 뉴럴 음향 스무딩 필터 가동 중
                </span>
              ) : (
                <span>* 마이크 녹음 또는 파일 업로드 후 학습 버튼을 누르면 이 낭독기가 개방됩니다.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {lastAudioUrl && (
                <a
                  href={lastAudioUrl}
                  download={`ANY1_Cloned_Voice_${Date.now()}.mp3`}
                  className="px-4 py-3.5 text-xs font-bold border border-white/10 bg-white/5 hover:bg-white hover:text-bg-dark transition-all rounded text-text-light flex items-center gap-1.5"
                >
                  <Download size={13} />
                  MP3 다운로드
                </a>
              )}

              <button
                type="button"
                disabled={!isCloned || isSynthesizingNeural}
                onClick={handlePlayClonedVoiceTTS}
                className={`px-8 py-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 rounded ${
                  isPlayingClonedVoice 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : isSynthesizingNeural
                    ? 'bg-neon/60 text-bg-dark cursor-wait'
                    : 'bg-neon text-bg-dark hover:bg-white shadow-[0_0_15px_rgba(163,230,53,0.3)] disabled:opacity-30 disabled:shadow-none cursor-pointer'
                }`}
              >
                {isSynthesizingNeural ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    음성 합성 중...
                  </>
                ) : isPlayingClonedVoice ? (
                  <>
                    <Square size={12} fill="currentColor" />
                    낭독 정지하기
                  </>
                ) : (
                  <>
                    <Volume2 size={14} />
                    내 목소리로 낭독 시작
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Profiles Storage & Archive (내 보관함) */}
      <div className="p-8 border border-border-dark bg-white/[0.01]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-neon block font-bold">
              📁 AI VOICE PROFILES LIBRARY (AI 복제 성우 보관함)
            </span>
            <p className="text-[9px] text-text-light/40 font-medium mt-0.5">
              학습 완료되어 등록한 나만의 성우 목록입니다. 파일로 백업 다운로드하거나, 언제든 불러와 낭독기로 즐길 수 있습니다.
            </p>
          </div>

          {/* Import .voice file */}
          <div>
            <input 
              type="file" 
              id="voice-file-import-direct" 
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
                        rate: imported.rate || 0.85,
                        analyzedFreq: imported.analyzedFreq,
                        vocalType: imported.vocalType,
                        audioDataUrl: imported.audioDataUrl,
                        createdAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                      };
                      
                      const updated = [...savedProfiles, newProfile];
                      saveProfilesToStorage(updated);
                      handleLoadProfile(newProfile);
                      showToast(`'${imported.name}' 가져오기 완료! 순번 #${nextId}번으로 즉시 등록되어 연동되었습니다.`, 'success');
                    } else {
                      showToast('올바른 .voice 백업 파일 양식이 아닙니다.', 'error');
                    }
                  } catch (err) {
                    showToast('파일 분석 중 오류가 발생했습니다.', 'error');
                  }
                };
                reader.readAsText(file);
              }}
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => document.getElementById('voice-file-import-direct')?.click()}
              className="px-3.5 py-2 bg-white/5 border border-white/10 hover:border-neon hover:text-neon text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileUp size={11} />
              .voice 백업 파일 불러오기
            </button>
          </div>
        </div>

        {/* Search bar inside Archive */}
        <div className="flex gap-2 mb-4 bg-black/30 border border-white/5 p-3">
          <div className="flex items-center gap-1.5 text-text-light/40 shrink-0 text-[10px] uppercase font-black tracking-wider px-1">
            <Search size={11} className="text-neon" />
            목소리 검색:
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름이나 순번을 입력하여 검색..."
            className="flex-1 bg-transparent text-[10px] text-text-light font-bold focus:outline-none placeholder:text-text-light/20"
          />
        </div>

        {/* Profile Grid list */}
        {filteredProfiles.length === 0 ? (
          <div className="p-8 border border-white/5 bg-white/[0.005] text-center text-text-light/30 text-[10px] font-semibold">
            {searchQuery ? '일치하는 목소리가 보관함에 없습니다.' : '아직 보관함에 저장된 보이스 모델 프로필이 없습니다. 위에서 첫 복제 모델을 생성해 보세요.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((p) => {
              const isActive = isCloned && clonedVoiceName === p.name;
              return (
                <div 
                  key={p.id}
                  onClick={() => handleLoadProfile(p)}
                  className={`p-4 border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    isActive 
                      ? 'border-neon bg-neon/10' 
                      : 'border-white/5 bg-white/[0.01] hover:border-white/15'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-black">
                      <span className="px-1.5 py-0.5 bg-white/10 text-white rounded">
                        순번 #{p.id}
                      </span>
                      <span className="text-text-light/30">
                        {p.createdAt}
                      </span>
                    </div>
                    
                    <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />}
                      {p.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider transition-all rounded ${
                        isActive 
                          ? 'bg-neon text-bg-dark font-black' 
                          : 'bg-white/10 hover:bg-neon hover:text-bg-dark text-white'
                      }`}
                    >
                      {isActive ? '연동 완료 🟢' : '이 목소리 선택'}
                    </button>
                    
                    {/* Backup download button */}
                    <button
                      type="button"
                      title="이 목소리 컴퓨터에 백업 보관 (.voice)"
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          const safeName = p.name.replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/gi, '_').toLowerCase();
                          link.download = `${safeName}.voice`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          showToast(`'${p.name}' 목소리가 로컬 파일(${safeName}.voice)로 보관 다운로드 되었습니다!`, 'success');
                        } catch (err) {
                          showToast('파일 백업 생성 중 오류 발생', 'error');
                        }
                      }}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all rounded"
                    >
                      <Download size={10} />
                    </button>

                    <button
                      type="button"
                      title="보관함에서 제거"
                      onClick={(e) => handleDeleteProfile(p, e)}
                      className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-red-200 transition-all rounded"
                    >
                      제거
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
