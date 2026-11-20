import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Terminal, 
  Globe, 
  FileCode, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  HelpCircle,
  Smartphone,
  UploadCloud,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

export const PlayStorePackagingGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keystore' | 'twa' | 'assetlinks' | 'console' | 'faq'>('keystore');
  const [packageName, setPackageName] = useState('com.any1.ai');
  const [sha256Fingerprint, setSha256Fingerprint] = useState('14:6D:E9:7D:F8:78:38:EB:5F:C3:B4:4D:4E:94:07:3E:96:A8:14:4E:82:17:82:48:42:25:FB:8C:3D:28:C9:EB');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const keystoreGenCmd = `keytool -genkeypair -v -storetype PKCS12 -keystore release.jks -alias any1 -keyalg RSA -keysize 2048 -validity 10000`;
  const sha256ExtractCmd = `keytool -list -v -keystore release.jks -alias any1`;
  const bubblewrapInstallCmd = `npm i -g @bubblewrap/cli`;
  const bubblewrapInitCmd = `bubblewrap init --manifest=${typeof window !== 'undefined' ? window.location.origin : 'https://any1.ai'}/manifest.json`;
  const bubblewrapBuildCmd = `bubblewrap build`;

  const assetlinksJson = JSON.stringify([
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": packageName.trim() || "com.any1.ai",
        "sha256_cert_fingerprints": [
          (sha256Fingerprint.trim() || "14:6D:E9:7D:F8:78:38:EB:5F:C3:B4:4D:4E:94:07:3E:96:A8:14:4E:82:17:82:48:42:25:FB:8C:3D:28:C9:EB").toUpperCase()
        ]
      }
    }
  ], null, 2);

  return (
    <div className="mt-8 border border-border-dark bg-[#0a0a0f] rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neon/15 via-white/[0.03] to-transparent p-6 border-b border-border-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded bg-neon/20 border border-neon/40 text-neon text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              구글 플레이 스토어 배포 & 서명 완전 정복 가이드
            </span>
            <span className="text-white/40 text-[10px] font-mono">v2.5 Guided</span>
          </div>
          <h3 className="text-lg font-black text-white tracking-wide">
            Keystore SHA-256 발급부터 Google Play Console 등록까지
          </h3>
          <p className="text-xs text-text-light/60 mt-1 max-w-2xl leading-relaxed">
            아래 4단계 순서에 따라 진행하시면 됩니다. 각 단계 하단의 <strong>[다음 단계로 진행 ➡️]</strong> 버튼을 누르면 다음 작업으로 바로 이어집니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a 
            href="https://www.pwabuilder.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>PWABuilder (3분 AAB 생성)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a 
            href="https://play.google.com/console" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-neon text-bg-dark font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-neon/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] shrink-0"
          >
            <span>Play Console 바로가기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Step Roadmap Bar */}
      <div className="bg-black/60 px-6 py-3 border-b border-border-dark flex items-center justify-between text-xs overflow-x-auto gap-4">
        {[
          { id: 'keystore', num: '1', title: '키스토어 생성' },
          { id: 'twa', num: '2', title: 'AAB 번들 패키징' },
          { id: 'assetlinks', num: '3', title: 'assetlinks 검증' },
          { id: 'console', num: '4', title: 'Play 콘솔 최종 등록' },
          { id: 'faq', num: '?', title: '질문 & 해결' }
        ].map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id as any)}
            className={`flex items-center gap-2 font-bold shrink-0 transition-all ${
              activeTab === s.id ? 'text-neon' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              activeTab === s.id ? 'bg-neon text-bg-dark font-black' : 'bg-white/10 text-white/60'
            }`}>
              {s.num}
            </span>
            <span>{s.title}</span>
            {idx < 4 && <ChevronRight className="w-3.5 h-3.5 text-white/20 ml-2" />}
          </button>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-dark bg-black/40 overflow-x-auto scrollbar-none">
        {[
          { id: 'keystore', label: '1. 키스토어 & SHA-256 생성', icon: Key },
          { id: 'twa', label: '2. TWA (AAB) 초고속 패키징', icon: Terminal },
          { id: 'assetlinks', label: '3. assetlinks.json 생성기', icon: FileCode },
          { id: 'console', label: '4. 플레이 콘솔 7단계 등록', icon: UploadCloud },
          { id: 'faq', label: '자주 묻는 질문 & 문제 해결', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                isActive 
                  ? 'border-neon text-neon bg-neon/5' 
                  : 'border-transparent text-text-light/50 hover:text-text-light hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 md:p-8">
        {/* TAB 1: Keystore & SHA-256 */}
        {activeTab === 'keystore' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-neon/5 border border-neon/20 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-neon shrink-0 mt-0.5" />
              <div className="text-xs text-text-light/80 leading-relaxed">
                <strong className="text-neon block mb-1">키스토어(Keystore)와 SHA-256 지문이란?</strong>
                안드로이드 앱이 위조나 변조되지 않은 본인의 정품 앱임을 구글 플레이와 안드로이드 OS에 증명하는 <strong>디지털 서명 열쇠</strong>입니다.
                구글 플레이는 모든 AAB/APK에 대해 유효한 Keystore 서명과 SHA-256 인증서 지문을 필수로 요구합니다.
              </div>
            </div>

            {/* Step 1: Gen Key */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neon/20 text-neon text-xs font-mono font-bold flex items-center justify-center">1</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    터미널(CMD/PowerShell/Mac Terminal)에서 Keystore 생성하기
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(keystoreGenCmd, 'cmd1')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === 'cmd1' ? <CheckCircle2 className="w-3.5 h-3.5 text-neon" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cmd1' ? '복사됨!' : '명령어 복사'}</span>
                </button>
              </div>

              <div className="bg-black/80 rounded-lg p-3.5 font-mono text-xs text-neon/90 overflow-x-auto border border-white/5">
                {keystoreGenCmd}
              </div>

              <div className="text-[11px] text-text-light/50 space-y-1 pl-8">
                <p>• <strong>release.jks</strong>: 생성될 키스토어 파일 이름 (절대 분실하지 마시고 안전한 곳에 백업하세요!)</p>
                <p>• <strong>any1</strong>: 키 별칭(Alias 이름)</p>
                <p>• 실행 후 비밀번호 입력(최소 6자), 이름, 소속(예: ANY1 AI), 국가 코드(KR)를 묻는 프롬프트에 답변하면 바로 파일이 생성됩니다.</p>
              </div>
            </div>

            {/* Step 2: Extract SHA-256 */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-neon/20 text-neon text-xs font-mono font-bold flex items-center justify-center">2</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    생성된 Keystore에서 SHA-256 지문(Fingerprint) 추출하기
                  </h4>
                </div>
                <button
                  onClick={() => copyToClipboard(sha256ExtractCmd, 'cmd2')}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded flex items-center gap-1.5 transition-all"
                >
                  {copiedKey === 'cmd2' ? <CheckCircle2 className="w-3.5 h-3.5 text-neon" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cmd2' ? '복사됨!' : '명령어 복사'}</span>
                </button>
              </div>

              <div className="bg-black/80 rounded-lg p-3.5 font-mono text-xs text-neon/90 overflow-x-auto border border-white/5">
                {sha256ExtractCmd}
              </div>

              <div className="text-[11px] text-text-light/50 space-y-1 pl-8">
                <p>• 터미널에 키스토어 비밀번호를 입력하면 아래와 같은 출력 항목이 나타납니다:</p>
                <div className="bg-black/60 p-2.5 rounded font-mono text-[10px] text-text-light/70 my-1 border border-white/5">
                  인증서 지문(Certificate fingerprints):<br/>
                  &nbsp;&nbsp;SHA1: 4B:12:88:AC:...<br/>
                  &nbsp;&nbsp;<span className="text-neon font-bold">SHA256: 14:6D:E9:7D:F8:78:38:EB:5F:C3:B4:4D:4E:94:07:3E:96:A8:14:4E:82:17:82:48:42:25:FB:8C:3D:28:C9:EB</span>
                </div>
                <p>• <strong>SHA256: 뒤에 나오는 32자리 16진수 문자열</strong>을 복사하여 아래 3단계 <span className="text-neon font-semibold">assetlinks.json 생성기</span>에 넣으시면 됩니다!</p>
              </div>
            </div>

            {/* Next Step Button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setActiveTab('twa')}
                className="px-5 py-2.5 bg-neon text-bg-dark font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-neon/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)]"
              >
                <span>다음 단계: 2. TWA (AAB) 패키징하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TWA (AAB) Packaging */}
        {activeTab === 'twa' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
              <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-text-light/80 leading-relaxed">
                <strong className="text-blue-400 block mb-1">TWA (Trusted Web Activity) 기술이란?</strong>
                구글 크롬팀이 공식 권장하는 웹앱 패키징 표준입니다. 일반 웹뷰(WebView)와 달리 최신 크롬 엔진을 그대로 사용하며, 
                <strong>주소창이 완전히 사라진 100% 네이티브 앱 풀스크린 경험</strong>과 빠른 성능을 제공합니다.
              </div>
            </div>

            {/* Quick 3-min Shortcut Option */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-black/40 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider mb-1 inline-block">
                  ⚡ 초보자 3분 추천 방식 (노코드)
                </span>
                <h4 className="text-sm font-bold text-white">PWABuilder (pwabuilder.com)로 즉시 AAB 다운받기</h4>
                <p className="text-[11px] text-text-light/60 mt-1">
                  터미널 명령어 없이 브라우저에서 사이트 주소만 입력하면 바로 구글 플레이스토어용 서명 AAB 파일을 생성해 줍니다.
                </p>
              </div>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-lg flex items-center gap-2 shrink-0 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <span>PWABuilder 바로가기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-neon font-mono text-xs font-bold mb-1">STEP 01</div>
                  <h4 className="text-xs font-bold text-white mb-2">Bubblewrap CLI 설치</h4>
                  <p className="text-[11px] text-text-light/50 mb-3">Google 공식 CLI 도구로 Node.js 환경에서 1초 만에 설치됩니다.</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-black/60 p-2 rounded text-[10px] font-mono text-neon truncate">
                    {bubblewrapInstallCmd}
                  </div>
                  <button
                    onClick={() => copyToClipboard(bubblewrapInstallCmd, 'twa1')}
                    className="w-full py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                  >
                    {copiedKey === 'twa1' ? '복사 완료!' : '명령어 복사'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-neon font-mono text-xs font-bold mb-1">STEP 02</div>
                  <h4 className="text-xs font-bold text-white mb-2">웹앱 매니페스트 초기화</h4>
                  <p className="text-[11px] text-text-light/50 mb-3">현재 앱의 웹 주소를 기반으로 안드로이드 프로젝트를 자동 설정합니다.</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-black/60 p-2 rounded text-[10px] font-mono text-neon truncate">
                    bubblewrap init --manifest=...
                  </div>
                  <button
                    onClick={() => copyToClipboard(bubblewrapInitCmd, 'twa2')}
                    className="w-full py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                  >
                    {copiedKey === 'twa2' ? '복사 완료!' : '명령어 복사'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-neon font-mono text-xs font-bold mb-1">STEP 03</div>
                  <h4 className="text-xs font-bold text-white mb-2">AAB 번들 빌드 컴파일</h4>
                  <p className="text-[11px] text-text-light/50 mb-3">1단계에서 만든 Keystore로 서명된 AAB 파일을 최종 생성합니다.</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-black/60 p-2 rounded text-[10px] font-mono text-neon truncate">
                    {bubblewrapBuildCmd}
                  </div>
                  <button
                    onClick={() => copyToClipboard(bubblewrapBuildCmd, 'twa3')}
                    className="w-full py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"
                  >
                    {copiedKey === 'twa3' ? '복사 완료!' : '명령어 복사'}
                  </button>
                </div>
              </div>
            </div>

            {/* Next Step Button */}
            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setActiveTab('keystore')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-lg"
              >
                ⬅️ 이전: 1. 키스토어
              </button>
              <button
                onClick={() => setActiveTab('assetlinks')}
                className="px-5 py-2.5 bg-neon text-bg-dark font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-neon/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)]"
              >
                <span>다음 단계: 3. assetlinks.json 설정하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Digital Asset Links (assetlinks.json) */}
        {activeTab === 'assetlinks' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-neon/5 border border-neon/20 flex gap-3">
              <Globe className="w-5 h-5 text-neon shrink-0 mt-0.5" />
              <div className="text-xs text-text-light/80 leading-relaxed">
                <strong className="text-neon block mb-1">assetlinks.json이 왜 필수인가요?</strong>
                TWA 앱이 실행될 때 브라우저 상단 주소창(URL bar)을 숨기고 <strong>완벽한 100% 전체화면 네이티브 앱</strong>으로 작동하려면,
                웹사이트의 <code className="text-neon bg-black/60 px-1 py-0.5 rounded">/.well-known/assetlinks.json</code> 파일에 앱의 SHA-256 지문이 등록되어 있어야 합니다.
              </div>
            </div>

            {/* Input Config Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-5 rounded-xl border border-white/5">
              <div>
                <label className="text-[10px] font-mono text-neon uppercase font-bold block mb-1.5">
                  Android Package Name (앱 패키지명)
                </label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="com.any1.ai"
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                />
                <span className="text-[10px] text-text-light/40 mt-1 block">예: com.any1.ai</span>
              </div>

              <div>
                <label className="text-[10px] font-mono text-neon uppercase font-bold block mb-1.5">
                  SHA-256 Certificate Fingerprint (인증서 지문)
                </label>
                <input
                  type="text"
                  value={sha256Fingerprint}
                  onChange={(e) => setSha256Fingerprint(e.target.value)}
                  placeholder="14:6D:E9:7D:..."
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs font-mono text-white focus:border-neon focus:outline-none"
                />
                <span className="text-[10px] text-text-light/40 mt-1 block">1단계에서 추출한 SHA-256 지문을 붙여넣으세요.</span>
              </div>
            </div>

            {/* Generated JSON Output */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-neon" />
                  생성된 /.well-known/assetlinks.json 내용
                </span>
                <button
                  onClick={() => copyToClipboard(assetlinksJson, 'json')}
                  className="px-3.5 py-1.5 bg-neon text-bg-dark text-xs font-bold rounded flex items-center gap-1.5 hover:bg-neon/90 transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                >
                  {copiedKey === 'json' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'json' ? '복사 완료!' : 'JSON 파일 내용 복사'}</span>
                </button>
              </div>

              <pre className="bg-black/90 p-4 rounded-xl border border-white/10 text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">
                {assetlinksJson}
              </pre>

              <p className="text-[11px] text-text-light/50">
                ✨ <strong>자동 적용 안내</strong>: Any1 AI 서버의 <code className="text-white">public/.well-known/assetlinks.json</code> 경로에 이미 호스팅되어 즉시 테스트할 수 있습니다.
              </p>
            </div>

            {/* Next Step Button */}
            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setActiveTab('twa')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-lg"
              >
                ⬅️ 이전: 2. TWA 패키징
              </button>
              <button
                onClick={() => setActiveTab('console')}
                className="px-5 py-2.5 bg-neon text-bg-dark font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-neon/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)]"
              >
                <span>다음 단계: 4. 플레이 콘솔 등록하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Google Play Console Submission */}
        {activeTab === 'console' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-text-light/80 leading-relaxed">
                <strong className="text-purple-400 block mb-1">Google Play Console 7단계 출시 로드맵</strong>
                구글 개발자 등록부터 최종 검수 승인까지 순서대로 따라 하시면 막힘없이 통과할 수 있습니다.
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: 'Step 1',
                  title: '구글 개발자 계정 생성 (Google Play Developer Account)',
                  desc: 'play.google.com/console 접속 후 1회성 등록비 $25 결제 및 본인/사업자 인증을 완료합니다.'
                },
                {
                  step: 'Step 2',
                  title: '콘솔 대시보드에서 [앱 만들기] 클릭',
                  desc: '앱 이름(예: Any1 AI), 기본 언어(한국어), 앱 또는 게임(앱), 무료 또는 유료(무료)를 선택합니다.'
                },
                {
                  step: 'Step 3',
                  title: 'Google Play 앱 서명 (Play App Signing) 활성화',
                  desc: '앱 무결성 메뉴에서 구글 플레이 앱 서명을 켭니다. 구글이 클라우드 상에서 키를 안전하게 보관해 주므로 키 분실 위험이 없습니다.'
                },
                {
                  step: 'Step 4',
                  title: 'AAB 번들 파일 업로드 (내부 테스트 트랙 추천)',
                  desc: '패키징 도구에서 생성한 `.aab` 파일을 [테스트] > [내부 테스트(Internal Testing)]에 먼저 업로드하여 본인 폰에서 정상 동작하는지 확인합니다.'
                },
                {
                  step: 'Step 5',
                  title: '스토어 등록정보 에셋 등록 (512x512 아이콘 & 1024x500 그래픽)',
                  desc: '왼쪽의 아이콘 빌더에서 다운로드한 512x512 고화질 아이콘과 가로형 그래픽 이미지(1024x500), 휴대폰 스크린샷 최소 2장을 등록합니다.'
                },
                {
                  step: 'Step 6',
                  title: '정책 양식 작성 (개인정보처리방침, 데이터 보안, 연령 등급)',
                  desc: '앱 콘텐츠 메뉴에서 개인정보처리방침 URL을 입력하고, 간단한 연령 질문지에 답하여 등급(전체이용가)을 부여받습니다.'
                },
                {
                  step: 'Step 7',
                  title: '프로덕션 트랙 출시 및 심사 제출',
                  desc: '모든 체크리스트가 완료되면 [검토를 위해 전송] 버튼을 누릅니다. 신규 앱의 경우 보통 영업일 기준 1~3일 내에 플레이스토어에 정식 출시됩니다!'
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-16 shrink-0">
                    <span className="font-mono text-neon text-xs font-bold uppercase">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-[11px] text-text-light/50 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setActiveTab('assetlinks')}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold rounded-lg"
              >
                ⬅️ 이전: 3. assetlinks.json
              </button>
              <a
                href="https://play.google.com/console"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-neon text-bg-dark font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-neon/90 transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)]"
              >
                <span>구글 플레이 콘솔로 이동하여 등록 시작하기</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 5: FAQ & Troubleshooting */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {[
              {
                q: 'Q. 키스토어(Keystore) 파일을 잃어버리면 어떻게 되나요?',
                a: '과거에는 키를 잃어버리면 앱 업데이트가 불가능했으나, 현재는 구글이 권장하는 "Google Play 앱 서명(Play App Signing)"을 사용하면 구글 고객센터에 요청하여 업로드 키를 언제든 안전하게 재설정할 수 있습니다. 단, 백업 드라이브에 release.jks를 잘 보관해 두시는 것이 가장 안전합니다.'
              },
              {
                q: 'Q. 앱을 켰을 때 상단에 크롬 브라우저 주소창(URL bar)이 왜 뜨나요?',
                a: '디지털 자산 링크(assetlinks.json) 검증이 실패했을 때 발생합니다. 웹 서버의 /.well-known/assetlinks.json 안에 등록된 SHA-256 지문과 실제 설치된 앱의 인증서 지문이 100% 일치해야 주소창이 사라지고 완벽한 전체화면 앱으로 열립니다.'
              },
              {
                q: 'Q. AI Studio나 앱에서 "Permission denied" 오류가 발생하면 어떻게 하나요?',
                a: '사용자 지정 Gemini API Key의 권한이 만료되었거나 프로젝트 설정에 제한이 있는 경우입니다. Any1 AI는 외부 키 없이도 자동으로 최적화된 내장 AI 합성 및 스마트 어시스턴트 모드로 안전하게 폴백 작동하므로 앱 기능 이용에는 전혀 지장이 없습니다.'
              },
              {
                q: 'Q. 개인정보처리방침(Privacy Policy) URL은 어디에 있나요?',
                a: '구글 플레이는 모든 앱에 개인정보처리방침 웹 URL을 필수로 요구합니다. Any1 AI 서비스는 하단 푸터 및 설정 메뉴에서 제공하는 개인정보처리방침 웹 링크(https://any1.ai/privacy)를 콘솔의 [앱 콘텐츠] > [개인정보처리방침] 란에 그대로 붙여넣으시면 됩니다.'
              }
            ].map((faq, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-neon flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-[11px] text-text-light/60 pl-6 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default PlayStorePackagingGuide;
