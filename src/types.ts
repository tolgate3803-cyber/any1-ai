import { 
  LayoutDashboard, 
  Sparkles, 
  UserCircle, 
  Map, 
  Plane, 
  PenTool, 
  Mic2, 
  FileText, 
  UtensilsCrossed, 
  Leaf, 
  Briefcase, 
  Globe, 
  Smartphone,
  Compass,
  LucideIcon,
  Volume2,
  Sun
} from 'lucide-react';

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: string;
  suggestions: string[];
}

export const FEATURES: Feature[] = [
  {
    id: 'daily-fortune',
    title: '오늘의 운세 & 궁합',
    description: '생년월일시를 한 번만 저장하면 오늘의 일진·재물·연애운과 2인 사주 궁합을 바로 확인합니다.',
    icon: Sun,
    category: 'fortune',
    suggestions: []
  },
  {
    id: 'saju',
    title: '정밀 사주보기',
    description: '한국 표준시·썸머타임·절입시각을 반영한 정통 만세력으로 평생 사주팔자와 대운을 분석합니다.',
    icon: Sparkles,
    category: 'fortune',
    suggestions: [
      '1995년 5월 15일 오후 2시생 남성의 올해 운세는?',
      '사주에 물(水)이 많으면 어떻게 보완해야 하나요?',
      '재물운을 높이는 법을 사주 기반으로 알려주세요.'
    ]
  },
  {
    id: 'naming',
    title: 'AI 작명가 (이름짓기)',
    description: '정밀 사주 오행 분석과 성명학 원리를 바탕으로 가장 조화롭고 품격 있는 한자 이름을 추천합니다.',
    icon: FileText,
    category: 'fortune',
    suggestions: [
      '2026년 7월 16일 오전 10시생 남자 아이의 사주에 맞는 귀한 이름을 지어줘.',
      '성씨가 "김(金)"씨인 신생아를 위한 성공과 재물운이 가득한 한자 이름 추천해줘.',
      '개명하고 싶은데 제 성씨와 사주 조화를 이루는 현대적이고 세련된 이름 3개 지어줘.'
    ]
  },
  {
    id: 'face',
    title: 'AI 관상 보기',
    description: '얼굴 사진을 올리거나 특징을 입력하면 이목구비별 관상과 성격·재물·직업운을 풀이해 드립니다.',
    icon: UserCircle,
    category: 'fortune',
    suggestions: [
      '이마가 넓고 둥근 사람의 특징은 무엇인가요?',
      '코 끝이 둥글고 콧볼이 넓으면 재물운이 좋은가요?',
      '입꼬리가 올라간 관상의 성격적 특징을 알려주세요.'
    ]
  },
  {
    id: 'pungsu',
    title: 'AI 풍수지리',
    description: '본명괘(Kua) 방향 나침반과 전통 양택 풍수를 기준으로 집안 가구 배치와 길한 방위를 안내합니다.',
    icon: Compass,
    category: 'fortune',
    suggestions: [
      '안방 침대 방향을 풍수지리상 길한 방향으로 배치하는 법은?',
      '재물운과 기운을 높여주는 아파트 현관 및 거실 풍수 인테리어 추천해줘.',
      '1992년 4월 8일생 남성의 본명괘(Kua) 길방 나침반과 공간 방위 분석해줘.'
    ]
  },
  {
    id: 'tts',
    title: 'AI 성우 텍스트 낭독',
    description: '입력한 문장을 아나운서·다큐·오디오북 등 자연스러운 AI 성우 목소리로 즉시 변환하고 저장합니다.',
    icon: Volume2,
    category: 'media',
    suggestions: [
      '안녕하세요! 오늘의 주요 일정과 기분 좋은 소식을 전해드립니다.',
      '오늘의 주요 뉴스와 날씨를 정갈한 아나운서 목소리로 들려드리겠습니다.',
      '피터팬이 웬디의 손을 잡고 밤하늘의 런던 위로 날아올랐습니다.'
    ]
  },
  {
    id: 'voice-analysis',
    title: '내 목소리로 음성만들기',
    description: '마이크 녹음이나 음성 파일을 올려 나만의 AI 목소리 프로필을 만들고 원하는 글을 낭독합니다.',
    icon: Mic2,
    category: 'media',
    suggestions: [
      '마이크로 내 진짜 목소리를 녹음해서 훈련시키고 싶어.',
      '준비한 오디오 파일을 직접 올려서 나만의 성우를 만드는 법.',
      '학습된 내 목소리 프로필로 원하는 원고 대본 낭독해보기.'
    ]
  },
  {
    id: 'transcription',
    title: '쉬운 문서·음성 요약',
    description: '복잡한 안내문, 계약서, 약 설명서 사진이나 녹음·긴 글의 핵심만 누구나 이해하기 쉽게 요약합니다.',
    icon: FileText,
    category: 'media',
    suggestions: [
      '어려운 병원 안내문이나 약 복용 설명서를 쉬운 말 3줄로 정리해줘.',
      '임대차 계약서에서 세입자가 꼭 확인해야 할 주의사항 요약해줘.',
      '긴 회의 녹취 내용에서 핵심 결론과 할 일만 뽑아 정리해줘.'
    ]
  },
  {
    id: 'creation',
    title: '글쓰기·시·가사 창작',
    description: '축사, 인사말, 시, 소설, 노래 가사, 영상 대본 등 마음을 전하는 글쓰기를 자연스럽게 도와드립니다.',
    icon: PenTool,
    category: 'media',
    suggestions: [
      '부모님 생신에 정중하고 따뜻하게 드릴 감사 편지 써줘.',
      '이별을 테마로 한 감성 발라드 가사 1절 써줘.',
      '봄의 따스함을 주제로 한 5행시 지어줘.'
    ]
  },
  {
    id: 'travel-guide',
    title: 'AI 여행 가이드',
    description: '취향과 일정에 맞춘 맞춤형 여행 코스와 추천 명소를 지도 위치와 함께 한눈에 제안합니다.',
    icon: Map,
    category: 'travel',
    suggestions: [
      '일본 교토 2박 3일 힐링 여행 코스 짜줘.',
      '아이와 함께 가기 좋은 제주도 맛집 5곳 추천해줘.',
      '국내 당일치기 기차 여행지 추천해줘.'
    ]
  },
  {
    id: 'travel-assistant',
    title: 'AI 여행 비서',
    description: '항공·숙소·교통 이동 시간까지 고려한 실전 시간표와 해외여행 필수 체크리스트를 설계합니다.',
    icon: Plane,
    category: 'travel',
    suggestions: [
      '서울에서 파리까지 가는 가장 가성비 좋은 시기와 팁 알려줘.',
      '방콕 5성급 호텔 중 위치와 가성비 좋은 곳 추천해줘.',
      '인천공항 스마트패스 등록과 출국 시간 절약 팁 알려줘.'
    ]
  },
  {
    id: 'recipe',
    title: '냉장고 맞춤 레시피',
    description: '냉장고에 남아 있는 재료를 알려주시면 10분 만에 뚝딱 만들 수 있는 맛있는 집밥 레시피를 알려드립니다.',
    icon: UtensilsCrossed,
    category: 'travel',
    suggestions: [
      '냉장고에 김치, 계란, 스팸뿐인데 할 수 있는 맛있는 요리 알려줘.',
      '자취생을 위한 10분 컷 원팬 파스타 레시피 알려줘.',
      '다이어트용 고단백 저탄수화물 저녁 식단 추천해줘.'
    ]
  },
  {
    id: 'plant-id',
    title: '식물·꽃 이름 & 케어',
    description: '식물 사진을 올리거나 잎 상태를 설명하면 이름과 물주기·햇빛 등 맞춤 관리법을 알려드립니다.',
    icon: Leaf,
    category: 'travel',
    suggestions: [
      '잎 끝이 노랗게 변하는 몬스테라, 어떻게 관리해야 하나요?',
      '그늘에서도 잘 자라는 실내 공기 정화 식물 추천해줘.',
      '선물용으로 좋은 꽃말을 가진 꽃 리스트 알려줘.'
    ]
  },
  {
    id: 'business-plan',
    title: '사업계획서·기획안',
    description: '창업 아이템이나 아이디어를 입력하면 시장 분석·수익 구조까지 갖춘 전문 사업계획서 초안을 작성합니다.',
    icon: Briefcase,
    category: 'business',
    suggestions: [
      '동네 카페 창업을 위한 상권 분석과 SWOT 정리해줘.',
      '지원사업 제출용 사업계획서 핵심 목차와 작성 요령 알려줘.',
      '소상공인을 위한 월 구독형 서비스 기획안 초안 작성해줘.'
    ]
  },
  {
    id: 'web-gen',
    title: '프로그램·웹 제작 도우미',
    description: '필요한 웹사이트 화면 구조나 업무 자동화 코드 초안을 빠르게 설계하고 코드로 작성해 드립니다.',
    icon: Globe,
    category: 'business',
    suggestions: [
      '모바일에 잘 보이는 깔끔한 소개 페이지 레이아웃 코드 짜줘.',
      '엑셀/CSV 데이터를 정리하는 간단한 파이썬 스크립트 짜줘.',
      'React와 Tailwind로 만드는 깔끔한 관리자 목록 화면 설계해줘.'
    ]
  }
];

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'tester-hub', label: '테스터 매칭 마이페이지', icon: Smartphone },
  ...FEATURES.map(f => ({ id: f.id, label: f.title, icon: f.icon }))
];
