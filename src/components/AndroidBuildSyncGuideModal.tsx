import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  FileCode2,
  Layers,
  ShieldAlert,
  ArrowUpCircle,
  KeyRound,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface AndroidBuildSyncGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  step: string;
  category: 'package' | 'applicationId' | 'versionCode' | 'release';
  title: string;
  desc: string;
  targetFile: string;
  criticalRule: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'chk_package_kt',
    step: 'STEP 1',
    category: 'package',
    title: 'MainActivity.kt 최상단 package 이름 및 폴더 경로 확인',
    desc: '코드 맨 1번째 줄의 package 선언이 현재 빌드하려는 앱과 맞는지, 그리고 loadUrl(...) 주소가 예전 건축도면 주소가 아닌 Any1 AI 공식 주소인지 확인합니다.',
    targetFile: 'app > src > main > java > ... > MainActivity.kt',
    criticalRule: 'loadUrl("https://ais-pre-euuwt3omoxka4yawduuy2q-307819514387.asia-northeast1.run.app")'
  },
  {
    id: 'chk_namespace',
    step: 'STEP 2',
    category: 'package',
    title: 'build.gradle.kts의 namespace와 코드 package 일치 확인',
    desc: 'Android Studio의 namespace 설정과 R 리소스 패키지명이 충돌하지 않는지 점검합니다. 다른 앱 프로젝트를 복사해서 재사용할 때 가장 많이 꼬이는 부분입니다.',
    targetFile: 'app > build.gradle.kts (Module :app)',
    criticalRule: 'namespace = "com.any1.ai"'
  },
  {
    id: 'chk_application_id',
    step: 'STEP 3',
    category: 'applicationId',
    title: 'applicationId와 구글 플레이 콘솔 앱 ID 100% 동기화',
    desc: '구글 플레이 콘솔 앱 이름 바로 아래 적힌 영문 ID(예: com.any1.ai)와 Gradle의 applicationId가 한 글자도 틀리지 않고 같아야 해당 앱으로 정확히 업데이트됩니다.',
    targetFile: 'build.gradle.kts ➜ defaultConfig.applicationId',
    criticalRule: 'any1.ai = "com.any1.ai" / 건축앱 = "com.blueprint.autosketch"'
  },
  {
    id: 'chk_app_name',
    step: 'STEP 4',
    category: 'applicationId',
    title: 'strings.xml 앱 이름(app_name) 및 런처 아이콘 동기화',
    desc: '설치 후 스마트폰 홈 화면에 표시되는 앱 이름과 아이콘이 건축프로그램 것으로 남아있지 않도록 res/values/strings.xml과 mipmap 아이콘을 갱신합니다.',
    targetFile: 'app > src > main > res > values > strings.xml',
    criticalRule: '<string name="app_name">Any1 AI</string>'
  },
  {
    id: 'chk_version_code',
    step: 'STEP 5',
    category: 'versionCode',
    title: 'versionCode를 콘솔 기존 버전보다 +1 이상 높여 저장',
    desc: '구글 플레이는 기존에 올라간 versionCode(예: 1)와 같거나 낮은 파일은 업로드를 거부하거나 이전 버전을 유지합니다. 새 빌드는 반드시 versionCode = 2 이상이어야 합니다.',
    targetFile: 'build.gradle.kts ➜ versionCode & versionName',
    criticalRule: 'versionCode = 2, versionName = "1.0.1"'
  },
  {
    id: 'chk_console_release',
    step: 'STEP 6',
    category: 'release',
    title: '서명 키(.jks) 확인 및 비공개 테스트 [최종 출시] 완료',
    desc: '새 AAB 업로드 후 임시저장 상태에 머물면 스토어에는 계속 옛날 버전(11월 7일 자)이 나옵니다. 반드시 [비공개 테스트로 출시] 버튼을 누르고 콘솔의 "최종 업데이트 날짜"가 오늘로 바뀌었는지 확인하세요.',
    targetFile: 'Google Play Console ➜ 비공개 테스트 ➜ 버전 관리',
    criticalRule: '최종 업데이트 날짜가 오늘 날짜 & 버전 2 (1.0.1) 표시 확인'
  }
];

const APP_PRESETS = [
  {
    id: 'any1',
    label: 'any1.ai',
    packageId: 'com.any1.ai',
    url: 'https://ais-pre-euuwt3omoxka4yawduuy2q-307819514387.asia-northeast1.run.app',
    appName: 'Any1 AI'
  },
  {
    id: 'blueprint',
    label: 'AI 건축자동프로그램',
    packageId: 'com.blueprint.autosketch',
    url: 'https://your-blueprint-app-url.run.app',
    appName: 'AI 건축자동프로그램'
  },
  {
    id: 'whatdaehaeng',
    label: '뭐든대행',
    packageId: 'kt.ojust.whatdaehaeng',
    url: 'https://your-whatdaehaeng-url.run.app',
    appName: '뭐든대행'
  }
];

const STORAGE_KEY = 'any1_android_build_sync_checks_v1';

export default function AndroidBuildSyncGuideModal({ isOpen, onClose }: AndroidBuildSyncGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'inspector' | 'snippets'>('checklist');
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Live Sync Diagnostic States
  const [consolePackageId, setConsolePackageId] = useState('com.any1.ai');
  const [gradleApplicationId, setGradleApplicationId] = useState('com.any1.ai');
  const [kotlinPackage, setKotlinPackage] = useState('com.example.myapplication');
  const [consoleVersionCode, setConsoleVersionCode] = useState<number>(1);
  const [gradleVersionCode, setGradleVersionCode] = useState<number>(2);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch {
      // Ignore storage failure
    }
  }, [checkedIds]);

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    setCheckedIds({});
  };

  const completedCount = CHECKLIST_ITEMS.filter(item => checkedIds[item.id]).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const isAppIdMatch = consolePackageId.trim() !== '' && consolePackageId.trim() === gradleApplicationId.trim();
  const isKotlinPackageMatch = kotlinPackage.trim() !== '' && kotlinPackage.trim() === gradleApplicationId.trim();
  const isVersionValid = Number(gradleVersionCode) > Number(consoleVersionCode);

  const selectedPreset = APP_PRESETS.find(p => p.packageId === consolePackageId.trim()) || APP_PRESETS[0];

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored in restricted frames
    }
  };

  const gradleSnippet = `android {
    namespace = "${consolePackageId.trim() || 'com.any1.ai'}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${consolePackageId.trim() || 'com.any1.ai'}"
        minSdk = 24
        targetSdk = 35
        versionCode = ${Math.max(Number(consoleVersionCode) + 1, Number(gradleVersionCode) || 2)}
        versionName = "1.0.${Math.max(Number(consoleVersionCode), 1)}"
    }
}`;

  const mainActivitySnippet = `package ${consolePackageId.trim() || 'com.any1.ai'}

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            webViewClient = WebViewClient()
            loadUrl("${selectedPreset.url}")
        }
        setContentView(webView)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#070a0f] border border-cyan-500/35 p-6 sm:p-8 rounded-2xl shadow-[0_0_55px_rgba(0,243,255,0.16)] z-10 custom-scrollbar my-auto text-text-light"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon" />

        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-5 pb-4 border-b border-border-dark">
          <div>
            <span className="text-[10px] text-neon uppercase tracking-widest font-black flex items-center gap-1.5 mb-1">
              <Layers size={12} /> Android Studio ↔ Google Play Console Sync Diagnostic
            </span>
            <h3 className="text-xl font-black text-white tracking-wide flex flex-wrap items-center gap-2.5">
              <span>빌드 설정 · 콘솔 메타데이터 동기화 가이드</span>
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                다른 앱 표시 오류 완벽 해결
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-light/50 hover:text-neon transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer shrink-0"
            aria-label="모달 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* Root Cause Alert Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/35 via-bg-card to-cyan-950/25 border border-amber-500/30 mb-6 flex items-start gap-3.5">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5 leading-relaxed">
            <div className="font-black text-amber-300">
              왜 구글 콘솔에서 다른 앱(예: 건축도면)이 나오거나 업데이트가 안 될까요?
            </div>
            <p className="text-text-light/80">
              안드로이드 스튜디오의 <code className="text-neon font-mono">package</code> /{' '}
              <code className="text-neon font-mono">applicationId</code> /{' '}
              <code className="text-neon font-mono">versionCode</code> 중 하나가 어긋나거나,
              서명 키 오류로 인해 <strong className="text-white">새 AAB 파일이 [비공개 테스트 출시]까지 최종 반영되지 않으면</strong> 콘솔의
              ‘최종 업데이트 날짜’가 과거(예: 11월 7일)로 멈춘 채 예전 앱이 그대로 열립니다.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-border-dark mb-6 gap-1">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 px-4 text-xs font-black tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'checklist'
                ? 'border-neon text-neon'
                : 'border-transparent text-text-light/50 hover:text-text-light'
            }`}
          >
            <CheckSquare size={15} />
            <span>1. 6단계 동기화 체크리스트 ({completedCount}/{CHECKLIST_ITEMS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inspector')}
            className={`pb-3 px-4 text-xs font-black tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'inspector'
                ? 'border-neon text-neon'
                : 'border-transparent text-text-light/50 hover:text-text-light'
            }`}
          >
            <ShieldAlert size={15} />
            <span>2. 실시간 설정 대조 진단기</span>
          </button>
          <button
            onClick={() => setActiveTab('snippets')}
            className={`pb-3 px-4 text-xs font-black tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'snippets'
                ? 'border-neon text-neon'
                : 'border-transparent text-text-light/50 hover:text-text-light'
            }`}
          >
            <FileCode2 size={15} />
            <span>3. 복사용 표준 코드 (Gradle & Kotlin)</span>
          </button>
        </div>

        {/* TAB 1: STEP-BY-STEP CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Progress Header */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-neon" />
                    빌드 설정 정합성 점검 진행률
                  </span>
                  <span className="font-mono text-neon">
                    {completedCount} / {CHECKLIST_ITEMS.length} 완료 ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-lime-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <button
                onClick={resetChecklist}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-border-dark rounded-lg text-[11px] font-bold text-text-light/70 hover:text-white flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-center"
              >
                <RefreshCw size={12} />
                <span>체크 초기화</span>
              </button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = !!checkedIds[item.id];
                const badgeColor =
                  item.category === 'package'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : item.category === 'applicationId'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : item.category === 'versionCode'
                        ? 'bg-lime-500/15 text-lime-300 border-lime-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-lime-950/20 border-lime-500/40'
                        : 'bg-white/[0.02] border-border-dark hover:border-cyan-500/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckCircle2 size={20} className="text-lime-400" />
                        ) : (
                          <Square size={20} className="text-text-light/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${badgeColor}`}>
                            {item.step}
                          </span>
                          <span className={`text-sm font-black ${isChecked ? 'text-lime-300 line-through opacity-80' : 'text-white'}`}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-text-light/70 leading-relaxed">
                          {item.desc}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 text-[11px] font-mono">
                          <span className="text-text-light/50 bg-black/40 px-2.5 py-1 rounded border border-white/10">
                            위치: {item.targetFile}
                          </span>
                          <span className="text-neon bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-500/25 truncate">
                            기준: {item.criticalRule}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE SYNC INSPECTOR */}
        {activeTab === 'inspector' && (
          <div className="space-y-5">
            {/* Quick Preset Selector */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-border-dark">
              <div className="text-xs font-bold text-white mb-2.5">
                구글 플레이 콘솔에 등록된 내 앱 선택 (자동 대조용)
              </div>
              <div className="flex flex-wrap gap-2">
                {APP_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setConsolePackageId(preset.packageId);
                      setGradleApplicationId(preset.packageId);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      consolePackageId === preset.packageId
                        ? 'bg-neon/15 border-neon text-neon'
                        : 'bg-black/40 border-border-dark text-text-light/70 hover:text-white'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="font-mono text-[10px] opacity-75">({preset.packageId})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-border-dark space-y-3">
                <div className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  1. applicationId & package 이름 비교
                </div>
                <div>
                  <label className="block text-[11px] text-text-light/60 mb-1">
                    구글 플레이 콘솔 앱 패키지명 (앱 이름 아래 ID)
                  </label>
                  <input
                    type="text"
                    value={consolePackageId}
                    onChange={(e) => setConsolePackageId(e.target.value)}
                    placeholder="com.any1.ai"
                    className="w-full px-3 py-2 bg-[#0b1018] border border-border-dark rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-light/60 mb-1">
                    Gradle (build.gradle.kts)의 applicationId
                  </label>
                  <input
                    type="text"
                    value={gradleApplicationId}
                    onChange={(e) => setGradleApplicationId(e.target.value)}
                    placeholder="com.any1.ai"
                    className="w-full px-3 py-2 bg-[#0b1018] border border-border-dark rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-light/60 mb-1">
                    MainActivity.kt 맨 윗줄 package 선언
                  </label>
                  <input
                    type="text"
                    value={kotlinPackage}
                    onChange={(e) => setKotlinPackage(e.target.value)}
                    placeholder="com.any1.ai"
                    className="w-full px-3 py-2 bg-[#0b1018] border border-border-dark rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-border-dark space-y-3">
                <div className="text-xs font-black text-lime-300 uppercase tracking-wider">
                  2. versionCode (버전 코드) 증가 검사
                </div>
                <div>
                  <label className="block text-[11px] text-text-light/60 mb-1">
                    현재 구글 플레이 콘솔에 이미 올라간 versionCode
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={consoleVersionCode}
                    onChange={(e) => setConsoleVersionCode(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-[#0b1018] border border-border-dark rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-light/60 mb-1">
                    새로 빌드할 build.gradle.kts의 versionCode
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={gradleVersionCode}
                    onChange={(e) => setGradleVersionCode(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-[#0b1018] border border-border-dark rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                  />
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] text-text-light/70 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <ArrowUpCircle size={13} className="text-neon" />
                    권장 다음 버전 설정
                  </div>
                  <div className="font-mono text-neon">
                    versionCode = {Math.max(consoleVersionCode + 1, gradleVersionCode)} / versionName = "1.0.{Math.max(consoleVersionCode, gradleVersionCode - 1)}"
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Result Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-xl border ${isAppIdMatch ? 'bg-lime-950/25 border-lime-500/40' : 'bg-red-950/30 border-red-500/40'}`}>
                <div className="text-[11px] font-bold text-text-light/70 mb-1">applicationId 동기화</div>
                <div className={`text-xs font-black flex items-center gap-1.5 ${isAppIdMatch ? 'text-lime-400' : 'text-red-400'}`}>
                  {isAppIdMatch ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{isAppIdMatch ? '100% 일치 (정상)' : '불일치! 다른 앱으로 인식됨'}</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isKotlinPackageMatch ? 'bg-lime-950/25 border-lime-500/40' : 'bg-amber-950/25 border-amber-500/40'}`}>
                <div className="text-[11px] font-bold text-text-light/70 mb-1">Kotlin package 일치</div>
                <div className={`text-xs font-black flex items-center gap-1.5 ${isKotlinPackageMatch ? 'text-lime-400' : 'text-amber-300'}`}>
                  {isKotlinPackageMatch ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{isKotlinPackageMatch ? '완전 일치' : '참고: com.example... 등 다른 경로'}</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border ${isVersionValid ? 'bg-lime-950/25 border-lime-500/40' : 'bg-red-950/30 border-red-500/40'}`}>
                <div className="text-[11px] font-bold text-text-light/70 mb-1">versionCode 증가 여부</div>
                <div className={`text-xs font-black flex items-center gap-1.5 ${isVersionValid ? 'text-lime-400' : 'text-red-400'}`}>
                  {isVersionValid ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>
                    {isVersionValid
                      ? `통과 (${consoleVersionCode} ➜ ${gradleVersionCode})`
                      : `오류! ${consoleVersionCode}보다 커야 합니다`}
                  </span>
                </div>
              </div>
            </div>

            {!isKotlinPackageMatch && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>안내:</strong> <code className="font-mono">MainActivity.kt</code>의 <code className="font-mono">package</code>가{' '}
                <code className="font-mono">com.example.myapplication</code>으로 되어 있어도 빌드는 되지만, 여러 앱을 작업할 때 예전 프로젝트를 열었다고 착각하기 쉽습니다.
                폴더 구조와 <code className="font-mono">namespace</code>, <code className="font-mono">applicationId</code>를 모두 <strong className="text-white">{consolePackageId}</strong>로 맞추는 것을 권장합니다.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COPYABLE CODE SNIPPETS */}
        {activeTab === 'snippets' && (
          <div className="space-y-5">
            {/* Gradle Snippet */}
            <div className="rounded-xl bg-black/50 border border-border-dark overflow-hidden">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-border-dark flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode2 size={14} className="text-neon" />
                  <span>build.gradle.kts (Module :app) — {consolePackageId} 동기화 기준</span>
                </div>
                <button
                  onClick={() => handleCopy(gradleSnippet, 'gradle')}
                  className="px-3 py-1 bg-neon/15 hover:bg-neon hover:text-bg-dark text-neon text-[11px] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === 'gradle' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedId === 'gradle' ? '복사됨' : '코드 복사'}</span>
                </button>
              </div>
              <pre className="p-4 text-[11px] font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                {gradleSnippet}
              </pre>
            </div>

            {/* MainActivity Snippet */}
            <div className="rounded-xl bg-black/50 border border-border-dark overflow-hidden">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-border-dark flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode2 size={14} className="text-lime-400" />
                  <span>MainActivity.kt — 공식 URL 및 WebView 필수 설정</span>
                </div>
                <button
                  onClick={() => handleCopy(mainActivitySnippet, 'main')}
                  className="px-3 py-1 bg-lime-500/15 hover:bg-lime-400 hover:text-bg-dark text-lime-300 text-[11px] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === 'main' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedId === 'main' ? '복사됨' : '코드 복사'}</span>
                </button>
              </div>
              <pre className="p-4 text-[11px] font-mono text-lime-200 overflow-x-auto leading-relaxed">
                {mainActivitySnippet}
              </pre>
            </div>

            {/* Signing Key Tip */}
            <div className="p-4 rounded-xl bg-cyan-950/25 border border-cyan-500/30 flex items-start gap-3 text-xs">
              <KeyRound size={18} className="text-neon shrink-0 mt-0.5" />
              <div className="space-y-1 text-text-light/80 leading-relaxed">
                <div className="font-black text-white">구글 콘솔 "최종 업데이트 날짜"가 안 바뀔 때 필수 확인</div>
                <p>
                  서명 키(.jks)가 달라 업로드에 실패한 경우 <strong className="text-neon">구글 플레이 콘솔 ➜ 설정 ➜ 앱 무결성 ➜ 업로드 키 재설정 요청</strong>을 진행하신 뒤,
                  다시 생성한 <code className="font-mono text-white">app-release.aab</code>를 업로드하고 <strong>[비공개 테스트로 출시]</strong> 버튼을 눌러야만 기존 11월 7일 버전이 새 버전으로 교체됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border-dark flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-text-light/50 flex items-center gap-2">
            <ExternalLink size={12} className="text-neon" />
            <span>공식 URL: https://ais-pre-euuwt3omoxka4yawduuy2q-307819514387.asia-northeast1.run.app</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-neon hover:bg-cyan-300 text-bg-dark font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            확인 완료
          </button>
        </div>
      </motion.div>
    </div>
  );
}
