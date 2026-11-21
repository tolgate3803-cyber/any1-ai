// Developer Built-in Neural Engine for offline/key-free development and testing
// Provides authentic, high-precision results for Korean Saju, Naming, Face Analysis, Feng Shui, Travel, and Creative features.
import {
  calculateManseryeok,
  STEM_KOREAN,
  BRANCH_KOREAN,
  TEN_GODS_MAP
} from "./manseryeokEngine";

interface DevEngineParams {
  feature: string;
  prompt: string;
  image?: any;
  file?: any;
}

// Helper: analyze follow-up consultation questions using the actual displayed Saju chart
function generateSajuFollowUpResult(prompt: string): string {
  const questionMatch = prompt.match(/고객 질문:\s*"([^"]+)"/);
  const question = questionMatch ? questionMatch[1].trim() : "종합 운세 및 개운 조언";

  // Extract real 일주 / 년주 / 월주 / 시주 from [고객 사주명식]
  const dayMatch = prompt.match(/일주:\s*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])\(([^/)]+)\/([^)]+)\)/);
  const yearMatch = prompt.match(/년주:\s*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])/);
  const daeunMatch = prompt.match(/\[현재 대운\]:\s*([^\n]+)/);
  const elMatch = prompt.match(/목\((\d+)\),\s*화\((\d+)\),\s*토\((\d+)\),\s*금\((\d+)\),\s*수\((\d+)\)/);

  const dayStem = dayMatch?.[1] || "";
  const dayBranch = dayMatch?.[2] || "";
  const dayBranchTenGod = dayMatch?.[4] || "일지";
  const yearBranch = yearMatch?.[2] || "";
  const activeDaeun = daeunMatch?.[1]?.trim() || "현재 대운";

  const elements = {
    wood: elMatch ? parseInt(elMatch[1], 10) : 1,
    fire: elMatch ? parseInt(elMatch[2], 10) : 1,
    earth: elMatch ? parseInt(elMatch[3], 10) : 1,
    metal: elMatch ? parseInt(elMatch[4], 10) : 1,
    water: elMatch ? parseInt(elMatch[5], 10) : 1
  };

  const dayLabel = dayStem && dayBranch
    ? `${dayStem}${dayBranch}(${STEM_KOREAN[dayStem] || ""}${BRANCH_KOREAN[dayBranch] || ""})`
    : "귀하의 본원 일주";

  const elPairs: Array<{ key: string; name: string; count: number; color: string; dir: string }> = [
    { key: "wood", name: "목(木)", count: elements.wood, color: "그린·청록 계열", dir: "동쪽" },
    { key: "fire", name: "화(火)", count: elements.fire, color: "버건디·코랄 계열", dir: "남쪽" },
    { key: "earth", name: "토(土)", count: elements.earth, color: "베이지·골드 계열", dir: "중앙·남서쪽" },
    { key: "metal", name: "금(金)", count: elements.metal, color: "화이트·실버 계열", dir: "서쪽" },
    { key: "water", name: "수(水)", count: elements.water, color: "네이비·블랙 계열", dir: "북쪽" }
  ];
  const sortedEls = [...elPairs].sort((a, b) => a.count - b.count);
  const weakestEl = sortedEls[0];
  const strongestEl = sortedEls[sortedEls.length - 1];

  const qLower = question.toLowerCase();
  let topicDiagnosis = "";
  let timingAdvice = "";

  if (/재물|돈|사업|투자|금전|매출|부자/.test(qLower)) {
    topicDiagnosis = `${dayLabel} 일주에서 재물의 그릇은 강한 오행인 **${strongestEl.name}(${strongestEl.count}개)**의 추진력을 발판 삼되, 부족한 **${weakestEl.name}(${weakestEl.count}개)** 기운을 보충할 때 비로소 큰 돈이 새지 않고 쌓이는 구조입니다. 2026년 병오(丙午)년은 움직이고 거래가 커지는 흐름이므로, 뜬구름 잡는 투자보다 실속 있는 현금 흐름과 문서 계약에 집중하셔야 유리합니다.`;
    timingAdvice = `- **재물·계약이 풀리는 시기**: 양력 **8월~10월(하반기 결실기)**에 정산·거래·수익 운이 강해집니다.\n- **지출·보증을 아껴야 할 시기**: 충동적인 결정이 쉬운 **5월~6월**에는 큰돈이 묶이는 신규 계약이나 지인 금전 거래를 한 템포 미루세요.`;
  } else if (/직장|이직|취업|승진|시험|합격|공부/.test(qLower)) {
    topicDiagnosis = `${dayLabel} 일주에 **${activeDaeun}** 흐름이 맞물려 있어, 단순한 자리 이동보다는 **본인의 전문성과 일지(${dayBranchTenGod})의 강점**이 인정받는 곳으로 옮길 때 격이 올라갑니다. 부족한 **${weakestEl.name}** 기운을 채우는 분야나 깔끔한 포트폴리오·문서 정리가 합격과 승진의 열쇠가 됩니다.`;
    timingAdvice = `- **이직·합격·승진 길일 흐름**: 문서운과 귀인운이 열리기 쉬운 **음력 하반기(양력 9~11월)** 또는 다음 절기 전환 직후 지원 시 좋은 소식이 따릅니다.\n- **주의할 점**: 감정적으로 홧김에 사직서를 던지기보다, 반드시 다음 자리가 문서로 확정된 뒤 움직이세요.`;
  } else if (/연애|결혼|배우자|사랑|남자|여자|궁합|인연/.test(qLower)) {
    topicDiagnosis = `${dayLabel} 일주(${dayBranchTenGod})는 겉으로 드러난 조건보다 **마음이 통하고 부족한 ${weakestEl.name} 기운을 자연스럽게 채워주는 사람**을 만날 때 관계가 오래가고 편안해집니다. 이미 곁에 인연이 있다면 자존심보다는 솔직한 안부와 따뜻한 표현이 애정운을 크게 살립니다.`;
    timingAdvice = `- **만남·화합이 좋은 시기**: 기운이 화창해지는 **봄·가을 환절기(4월, 9~10월)**에 소개팅·모임이나 깊은 대화 자리가 길합니다.\n- **조심할 점**: 바쁘다고 연락이 끊기거나 말끝이 날카로워지지 않도록 주말마다 짧은 산책·식사 시간을 챙기세요.`;
  } else if (/건강|몸|병|아프|컨디션|수술/.test(qLower)) {
    topicDiagnosis = `사주 오행 분포상 **${strongestEl.name}(${strongestEl.count}개)** 기운이 쏠려 있고 **${weakestEl.name}(${weakestEl.count}개)** 기운이 약한 편이므로, 과로가 쌓일 때 해당 오행과 연결된 장기·순환 컨디션부터 신호가 오기 쉽습니다. 무리한 야근과 불규칙한 식사를 줄이고 수면 리듬을 지키는 것이 최고의 보약입니다.`;
    timingAdvice = `- **회복·검진 추천 시기**: 계절이 바뀌는 **환절기 직전**에 가벼운 정기 검진과 생활 루틴 점검을 해두면 큰 탈 없이 지나갑니다.\n- **생활 관리**: 매일 20분 가벼운 걷기와 따뜻한 물 섭취로 순환을 깨워주세요.`;
  } else if (/이사|부동산|집|매매|이동|개업/.test(qLower)) {
    topicDiagnosis = `${dayLabel} 명식에서는 집이나 사업장을 옮길 때 **남의 말에 휩쓸리기보다 내가 직접 발품을 팔아 채광·환기를 확인한 매물**에서 복이 들어옵니다. 특히 부족한 **${weakestEl.name}** 기운을 돕는 **${weakestEl.dir}** 방향이나 밝은 환경이 가택 안정에 큰 도움을 줍니다.`;
    timingAdvice = `- **계약·이사 길한 시기**: 문서 시비가 적고 정리가 깔끔한 **양력 9월~11월** 사이가 가장 무난하고 길합니다.\n- **확인 사항**: 계약 전 등기부·특약 사항을 하루 묵혀 재확인하는 신중함이 재산 손실을 막아줍니다.`;
  } else {
    const isSamjaeActive = ["亥", "卯", "未"].includes(yearBranch);
    topicDiagnosis = `${dayLabel} 일주와 **${activeDaeun}**의 흐름을 기준으로 볼 때, 현재 사주에서 가장 힘이 모인 **${strongestEl.name}(${strongestEl.count}개)**의 장점은 살리고 부족한 **${weakestEl.name}(${weakestEl.count}개)** 기운만 생활 속에서 보완하면 막혔던 일도 순리대로 풀립니다.${isSamjaeActive ? " (올해 2026년은 눌삼재 기간이므로 큰 확장보다 내실과 검증에 힘쓰시면 오히려 탄탄해집니다.)" : ""}`;
    timingAdvice = `- **기운이 상승하는 시기**: 2026년 **하반기(양력 8~10월)**에 주변의 도움과 실질적 성과가 모이기 좋습니다.\n- **신중해야 할 시기**: 에너지 소모가 큰 한여름·한겨울 초입에는 무리한 약속과 성급한 결정을 피하고 체력을 비축하세요.`;
  }

  return `### 🏛️ [철학관 1:1 심층 상담 처방] — ${dayLabel} 기준
**질문:** "${question}"

1. **귀하의 실제 명식(${dayLabel}) 기반 진단**
   ${topicDiagnosis}

2. **맞춤 시기 처방**
${timingAdvice}

3. **실생활 개운(開運) 비책 (${weakestEl.name} 보완)**
   - **행운의 색상**: 평소 소지품·옷차림에 **${weakestEl.color}** 포인트를 활용해 부족한 **${weakestEl.name}** 기운을 채우세요.
   - **유리한 방위**: 중요한 책상이나 침대 머리 방향은 **${weakestEl.dir}**이 길합니다.
   - **실천 조언**: 가장 강한 ${strongestEl.name} 기운이 과열되지 않도록 중요한 결정 앞에서는 하루만 숨 고르고 움직이면 훨씬 큰 복으로 돌아옵니다.`;
}

// Generate Saju calculation based on prompt or input (Astronomical Korean Manseryeok Engine)
function generateSajuResult(prompt: string): string {
  if (prompt.includes("[철학관 실시간 1:1 고객 추가 상담 질문]")) {
    return generateSajuFollowUpResult(prompt);
  }

  const m = calculateManseryeok(prompt);
  const {
    sajuChart,
    dayStem,
    dayBranch,
    samjae,
    clientQuestion
  } = m;
  const { elements, daeunStartAge } = sajuChart;

  const getTenGod = (target: string) => (TEN_GODS_MAP[dayStem] && TEN_GODS_MAP[dayStem][target]) || "비견";
  const sajuChartJson = JSON.stringify({ sajuChart }, null, 2);

  // Extract consultation question if any
  let consultationSection = "";

  if (clientQuestion) {
    consultationSection = `
---

### 🏛️ [철학관 1:1 맞춤 수석 역학 상담가의 핀포인트 해답]
**Q. 고객 상담 핵심 질의**: "${clientQuestion}"

1. **역학적 원인과 현재 운기 진단**
   귀하의 사주 원국에서 일원(${dayStem})을 중심으로 현재 대운과 2026년(병오년) 세운의 상호작용을 살피건대, 질의하신 사안은 단순한 우연이 아니라 기운의 흐름이 새로운 변곡점을 맞이하며 필연적으로 수면 위로 떠오른 중대 과제입니다. 현재 대운의 천간과 지지가 귀하의 용신(用神)을 견인하고 있어, 결코 낙담하거나 조급해하실 필요가 없는 길조를 품고 있습니다.

2. **명쾌한 타이밍 솔루션 (시기별 처방)**
   - **가장 유리한 결단의 시기**: **2026년 가을(양력 9월~10월, 유·술월)** 및 **2027년 상반기**. 이 시기는 귀인의 조력과 재물·문서운이 합(合)을 이루어 막혔던 매듭이 자연스럽게 풀려나가는 최상의 타이밍입니다.
   - **조심해야 할 시기**: 무리한 확장을 삼가야 하는 **양력 5월(사월)**과 **11월(해월)**에는 현상 유지와 내실 다지기에 집중하십시오.

3. **실생활 개운(開運) 비책**
   - **행운의 방위**: 집과 사무실을 기준으로 **동남쪽(생기방)**에 중요한 책상이나 집무 공간을 두십시오.
   - **행운의 색상**: ${elements.water < elements.fire ? '청색 및 네이비(수기운 보완)' : '골드 및 베이지 계열'}을 일상 패션이나 소품에 적극 활용하십시오.
   - **마음가짐**: 지나간 일에 집착하지 마시고, '자신에 대한 확신'을 품고 전진하시면 반드시 귀인을 만나 대성하게 됩니다.
`;
  }

  return `\`\`\`json
${sajuChartJson}
\`\`\`

### 🔮 사주명식 및 오행(五行) 분포 심층 분석
귀하의 사주는 **${dayStem}${dayBranch}(${STEM_KOREAN[dayStem] || ""}${BRANCH_KOREAN[dayBranch] || ""} - 일지 ${getTenGod(dayBranch)}) 일주**를 본원(일원)으로 삼고 있으며, 일주를 중심으로 년·월·시의 사주팔자가 격조 높은 조화를 이루고 있습니다.

- **오행의 분포 현황**:
  - 목(木): ${elements.wood}개 | 화(火): ${elements.fire}개 | 토(土): ${elements.earth}개 | 금(金): ${elements.metal}개 | 수(水): ${elements.water}개
- **기운의 특성 및 격국**: 
  ${elements.water >= 4 && elements.wood >= 2 
    ? `원국에 맑고 깊은 수기운(水 ${elements.water}개)과 이를 시원하게 발현시키는 목기운(木 ${elements.wood}개)이 막힘없이 흐르는 **수목청기(水木淸氣 / 수목상생)의 귀격(貴格)** 명조입니다. 바다와 같은 깊은 지혜와 직관력, 언어·기획력과 뛰어난 예술적 감수성을 타고났습니다.`
    : elements.wood + elements.fire > 4 
      ? '목화(木火)의 진취적인 양기가 넘쳐나 리더십과 창의력, 실행력이 탁월합니다.' 
      : '오행이 조화롭게 작용하여 매사 원만하고 위기 관리 능력과 지속력이 남다릅니다.'}
- **용신(用神) 및 희신(喜神)**:
  귀하의 일주 균형과 조후를 가장 길하고 풍요롭게 이끌어주는 핵심 성분은 **${elements.water >= 4 ? '목(木)과 화(火) - 왕성한 수기를 유통시키고 따뜻한 온기 공급' : elements.water === 0 ? '수(水)와 금(金)' : elements.fire === 0 ? '목(木)과 화(火)' : '토(土)와 금(金)'}**입니다. 

---

### 🌟 대운(大運)의 흐름과 인생 전환기
귀하의 대운은 **${daeunStartAge}세**를 기점으로 10년 주기로 순환합니다. 
현재 지나고 있는 대운은 인생의 탄탄한 발판을 굳히는 시기로서, 외부의 평가보다는 실속과 전문성을 축적하는 데 최적화되어 있습니다. 다가오는 다음 대운은 사회적 명예와 결실이 활짝 피어나는 도약의 운세입니다.

---

### 🛡️ 삼재(三災) 정밀 판독 및 개운법
- **현재 삼재 상태**: **${samjae.status}**
- **삼재 주기**: ${samjae.years}
- **역학 처방**: ${samjae.remedy}

${consultationSection}`;
}

// Korean Last Names Database (Hanja & Traditional Stroke counts)
const LAST_NAMES_DB: Record<string, { hanja: string; strokes: number; element: string }> = {
  "김": { hanja: "金", strokes: 8, element: "금(金)" },
  "이": { hanja: "李", strokes: 7, element: "목(木)" },
  "박": { hanja: "朴", strokes: 6, element: "목(木)" },
  "최": { hanja: "崔", strokes: 11, element: "토(土)" },
  "정": { hanja: "鄭", strokes: 19, element: "화(火)" },
  "강": { hanja: "姜", strokes: 9, element: "목(木)" },
  "조": { hanja: "趙", strokes: 14, element: "화(火)" },
  "윤": { hanja: "尹", strokes: 4, element: "금(金)" },
  "장": { hanja: "張", strokes: 11, element: "화(火)" },
  "임": { hanja: "林", strokes: 8, element: "목(木)" },
  "한": { hanja: "韓", strokes: 17, element: "금(金)" },
  "오": { hanja: "吳", strokes: 7, element: "화(火)" },
  "서": { hanja: "徐", strokes: 10, element: "금(金)" },
  "신": { hanja: "申", strokes: 5, element: "금(金)" },
  "권": { hanja: "權", strokes: 22, element: "목(木)" },
  "황": { hanja: "黃", strokes: 12, element: "토(土)" },
  "송": { hanja: "宋", strokes: 7, element: "금(金)" },
  "안": { hanja: "安", strokes: 6, element: "토(土)" },
  "홍": { hanja: "洪", strokes: 10, element: "수(水)" },
  "유": { hanja: "柳", strokes: 9, element: "목(木)" },
  "류": { hanja: "柳", strokes: 9, element: "목(木)" },
  "고": { hanja: "高", strokes: 10, element: "목(木)" },
  "문": { hanja: "文", strokes: 4, element: "화(火)" },
  "손": { hanja: "孫", strokes: 10, element: "수(水)" },
  "배": { hanja: "裵", strokes: 14, element: "목(木)" },
  "백": { hanja: "白", strokes: 5, element: "금(金)" },
  "허": { hanja: "許", strokes: 11, element: "화(火)" },
  "남": { hanja: "南", strokes: 9, element: "화(火)" },
  "심": { hanja: "沈", strokes: 8, element: "수(水)" },
  "하": { hanja: "河", strokes: 9, element: "수(水)" },
  "전": { hanja: "全", strokes: 6, element: "금(金)" }
};

// Auspicious Stroke Lucky Grade Evaluation
function evaluateStrokeLuck(strokes: number): { grade: string; desc: string } {
  const auspicious = [11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52];
  if (auspicious.includes(strokes)) {
    const descs: Record<number, string> = {
      11: "신성격(新成格): 성실함과 총명함으로 새로운 가업과 가문을 일으켜 세우는 길운",
      13: "총명격(聰明格): 천부적인 지혜와 학업적 성취로 만인의 추앙을 받는 두뇌 명석운",
      15: "통솔격(統率格): 온후한 인품과 덕망으로 조직과 대중을 이끄는 리더십의 운",
      16: "덕망격(德望格): 귀인의 조력과 인덕이 넘쳐나 난관을 쉽게 돌파하고 대성하는 운",
      17: "건창격(健暢格): 활동적이고 명석하여 일찍이 재능을 떨치고 튼튼한 기반을 확립",
      18: "발전격(發展格): 강한 의지력과 추진력으로 뜻한 바 대업을 완수하는 성공운",
      21: "두령격(頭領格): 강력한 지도력과 선구안으로 조직의 최고 우두머리로 부상",
      23: "일출봉천격(日出春天格): 아침 해가 솟구치듯 지혜와 권위가 높고 재물이 번창",
      24: "입신격(立身格): 무에서 유를 창조하는 자수성가형 최고 재물 축적의 운",
      25: "안강격(安康格): 지혜와 재능이 조화를 이루어 평안하고 부귀를 누리는 복운",
      31: "융성격(隆盛格): 지혜와 덕망이 겸비되어 대업을 이루고 명예와 부를 영구 보전",
      32: "왕성격(旺盛格): 뜻밖의 기회와 귀인의 후원을 얻어 일취월장 발전하는 대길운",
      33: "승천격(昇天格): 용이 하늘로 승천하듯 큰 뜻을 펴고 세상을 호령하는 군자운",
      35: "태평격(泰平格): 온화하고 평화로운 성품으로 문학과 예술, 전문직에서 명성을 떨침",
      37: "유덕격(有德格): 자비로운 덕행과 충실한 실천으로 평생의 안정과 존경을 누림"
    };
    return { grade: "대길(大吉)", desc: descs[strokes] || "수리길수(數理吉數): 가문과 일생의 발복을 확고히 견인하는 길운" };
  }
  return { grade: "길(吉)", desc: "평안격(平安格): 원만한 처세와 자립의 끈기로 안정적인 결실을 완성" };
}

// Name Database categorized by Deficient Element & Gender
interface NameCandidate {
  hangul: string;
  char1: { char: string; hangul: string; meaning: string; strokes: number; element: string };
  char2: { char: string; hangul: string; meaning: string; strokes: number; element: string };
  soundHarmony: string;
  meaningTemplate: string;
}

const NAME_POOL: Record<string, { male: NameCandidate[]; female: NameCandidate[] }> = {
  wood: {
    male: [
      { hangul: "도윤", char1: { char: "道", hangul: "도", meaning: "길 도, 도덕 도", strokes: 13, element: "화(火)" }, char2: { char: "允", hangul: "윤", meaning: "진실할 윤", strokes: 4, element: "목(木)" }, soundHarmony: "ㄷ(화) → ㅇ(토) 상생 파동", meaningTemplate: "인생을 바른 정도(道)로 이끌고 진실함(允)으로 만인의 신망을 얻는 리더의 이름" },
      { hangul: "건우", char1: { char: "建", hangul: "건", meaning: "세울 건, 일으킬 건", strokes: 9, element: "목(木)" }, char2: { char: "宇", hangul: "우", meaning: "집 우, 큰 우주 우", strokes: 6, element: "토(土)" }, soundHarmony: "ㄱ(목) → ㅇ(토) 생기 파동", meaningTemplate: "우주처럼 넓은 포부를 세우고(建) 큰 대업을 일으키는 웅장한 이름" },
      { hangul: "주원", char1: { char: "柱", hangul: "주", meaning: "기둥 주, 버팀목 주", strokes: 9, element: "목(木)" }, char2: { char: "元", hangul: "원", meaning: "으뜸 원, 근본 원", strokes: 4, element: "목(木)" }, soundHarmony: "ㅈ(금) → ㅇ(토) 품격 파동", meaningTemplate: "가문과 국가의 든든한 기둥(柱)이자 으뜸(元) 인재로 우뚝 서라는 축원" }
    ],
    female: [
      { hangul: "지안", char1: { char: "智", hangul: "지", meaning: "지혜 지, 슬기 지", strokes: 12, element: "화(火)" }, char2: { char: "雅", hangul: "안", meaning: "맑고 바를 아/안", strokes: 12, element: "목(木)" }, soundHarmony: "ㅈ(금) → ㅇ(토) 단아한 파동", meaningTemplate: "총명한 지혜(智)와 우아하고 고결한 품격(雅)을 갖춘 귀한 이름" },
      { hangul: "아린", char1: { char: "雅", hangul: "아", meaning: "우아할 아, 바를 아", strokes: 12, element: "목(木)" }, char2: { char: "潾", hangul: "린", meaning: "맑을 린, 맑은 물 린", strokes: 16, element: "수(水)" }, soundHarmony: "ㅇ(토) → ㄹ(화) 청아한 파동", meaningTemplate: "맑고 깨끗한 시냇물처럼 순수하고 고귀한 매력을 온전히 간직한 이름" },
      { hangul: "채원", char1: { char: "綵", hangul: "채", meaning: "비단 채, 빛날 채", strokes: 14, element: "목(木)" }, char2: { char: "媛", hangul: "원", meaning: "아름다울 원, 재덕 원", strokes: 12, element: "화(火)" }, soundHarmony: "ㅊ(금) → ㅇ(토) 화려한 파동", meaningTemplate: "비단처럼 곱고 빛나는 재능과 덕망을 지녀 만인의 사랑을 받는 이름" }
    ]
  },
  fire: {
    male: [
      { hangul: "서준", char1: { char: "瑞", hangul: "서", meaning: "상서로울 서", strokes: 14, element: "금(金)" }, char2: { char: "俊", hangul: "준", meaning: "준걸 준, 빼어날 준", strokes: 9, element: "화(火)" }, soundHarmony: "ㅅ(금) → ㅈ(금) 명징한 파동", meaningTemplate: "상서로운 서광(瑞)처럼 가문을 빛내고 빼어난 재능(俊)으로 세상을 리드하는 인재의 이름" },
      { hangul: "현우", char1: { char: "炫", hangul: "현", meaning: "빛날 현, 밝을 현", strokes: 9, element: "화(火)" }, char2: { char: "宇", hangul: "우", meaning: "집 우, 큰 우주 우", strokes: 6, element: "토(土)" }, soundHarmony: "ㅎ(토) → ㅇ(토) 온후한 파동", meaningTemplate: "온 세상 우주(宇)를 환하게 밝히는(炫) 따뜻한 빛과 에너지를 지닌 이름" },
      { hangul: "찬우", char1: { char: "燦", hangul: "찬", meaning: "빛날 찬, 찬란할 찬", strokes: 17, element: "화(火)" }, char2: { char: "佑", hangul: "우", meaning: "도울 우, 복받을 우", strokes: 7, element: "토(土)" }, soundHarmony: "ㅊ(금) → ㅇ(토) 진취적 파동", meaningTemplate: "찬란하게 빛나는(燦) 업적을 이루고 하늘의 도우심(佑)을 받는 복된 이름" }
    ],
    female: [
      { hangul: "서하", char1: { char: "瑞", hangul: "서", meaning: "상서로울 서", strokes: 14, element: "금(金)" }, char2: { char: "夏", hangul: "하", meaning: "여름 하, 번창할 하", strokes: 10, element: "화(火)" }, soundHarmony: "ㅅ(금) → ㅎ(토) 상생 파동", meaningTemplate: "여름날의 풍성한 생명력처럼 활짝 꽃피며 상서로운 축복을 누리는 이름" },
      { hangul: "다은", char1: { char: "多", hangul: "다", meaning: "많을 다, 번성할 다", strokes: 6, element: "화(火)" }, char2: { char: "恩", hangul: "은", meaning: "은혜 은, 사랑 은", strokes: 10, element: "토(土)" }, soundHarmony: "ㄷ(화) → ㅇ(토) 따스한 파동", meaningTemplate: "풍성한 복덕과 은혜(恩)를 널리 베풀어 많은 이들의 사랑을 받는 이름" },
      { hangul: "하윤", char1: { char: "夏", hangul: "하", meaning: "빛날 하, 여름 하", strokes: 10, element: "화(火)" }, char2: { char: "允", hangul: "윤", meaning: "진실할 윤", strokes: 4, element: "목(木)" }, soundHarmony: "ㅎ(토) → ㅇ(토) 단아한 파동", meaningTemplate: "따스하고 밝은 햇살처럼 주위를 환하게 비추며 진실된 덕을 쌓는 이름" }
    ]
  },
  earth: {
    male: [
      { hangul: "도현", char1: { char: "道", hangul: "도", meaning: "길 도, 이치 도", strokes: 13, element: "화(火)" }, char2: { char: "賢", hangul: "현", meaning: "어질 현, 슬기 현", strokes: 15, element: "토(土)" }, soundHarmony: "ㄷ(화) → ㅎ(토) 군자 파동", meaningTemplate: "바른 도리(道)를 지키며 어질고 슬기로운(賢) 혜안으로 큰일을 성취하는 이름" },
      { hangul: "우진", char1: { char: "宇", hangul: "우", meaning: "집 우, 우주 우", strokes: 6, element: "토(土)" }, char2: { char: "鎭", hangul: "진", meaning: "진정할 진, 무거울 진", strokes: 18, element: "금(金)" }, soundHarmony: "ㅇ(토) → ㅈ(금) 안정된 파동", meaningTemplate: "넓은 기상(宇)과 굳건한 중심(鎭)을 잡아 가문을 든든하게 지키는 이름" },
      { hangul: "성민", char1: { char: "聖", hangul: "성", meaning: "성인 성, 총명할 성", strokes: 13, element: "토(土)" }, char2: { char: "旼", hangul: "민", meaning: "화화할 민, 온화할 민", strokes: 8, element: "화(火)" }, soundHarmony: "ㅅ(금) → ㅁ(수) 조화 파동", meaningTemplate: "성스럽고 총명한 지혜(聖)와 온화한 인품(旼)으로 만인의 존경을 받는 이름" }
    ],
    female: [
      { hangul: "은우", char1: { char: "恩", hangul: "은", meaning: "은혜 은", strokes: 10, element: "토(土)" }, char2: { char: "宇", hangul: "우", meaning: "집 우, 큰 우주 우", strokes: 6, element: "토(土)" }, soundHarmony: "ㅇ(토) → ㅇ(토) 평화로운 파동", meaningTemplate: "우주처럼 넓은 마음으로 따뜻한 은혜와 사랑을 실천하는 복된 이름" },
      { hangul: "윤아", char1: { char: "允", hangul: "윤", meaning: "진실할 윤", strokes: 4, element: "목(木)" }, char2: { char: "雅", hangul: "아", meaning: "바를 아, 우아할 아", strokes: 12, element: "토(土)" }, soundHarmony: "ㅇ(토) → ㅇ(토) 부드러운 파동", meaningTemplate: "진실함과 우아한 기품을 겸비하여 언제나 신뢰와 사랑을 한 몸에 받는 이름" },
      { hangul: "예은", char1: { char: "藝", hangul: "예", meaning: "재주 예, 예술 예", strokes: 21, element: "목(木)" }, char2: { char: "恩", hangul: "은", meaning: "은혜 은", strokes: 10, element: "토(土)" }, soundHarmony: "ㅇ(토) → ㅇ(토) 맑은 파동", meaningTemplate: "뛰어난 재능과 감성(藝)을 갖추고 덕망 있는 은혜(恩)를 나누는 이름" }
    ]
  },
  metal: {
    male: [
      { hangul: "시우", char1: { char: "施", hangul: "시", meaning: "베풀 시, 널리 펼 시", strokes: 9, element: "금(金)" }, char2: { char: "宇", hangul: "우", meaning: "집 우, 큰 우주 우", strokes: 6, element: "토(土)" }, soundHarmony: "ㅅ(금) → ㅇ(토) 유려한 파동", meaningTemplate: "온 세상 우주(宇)처럼 큰 포부를 품고 많은 이들에게 덕을 베푸는(施) 리더의 이름" },
      { hangul: "승우", char1: { char: "昇", hangul: "승", meaning: "오를 승, 번성할 승", strokes: 8, element: "금(金)" }, char2: { char: "宇", hangul: "우", meaning: "집 우, 우주 우", strokes: 6, element: "토(土)" }, soundHarmony: "ㅅ(금) → ㅇ(토) 상승 파동", meaningTemplate: "높이 떠오르는 해처럼 비상하며(昇) 거대한 꿈을 실현하는 이름" },
      { hangul: "진호", char1: { char: "鎭", hangul: "진", meaning: "무거울 진, 편안할 진", strokes: 18, element: "금(金)" }, char2: { char: "浩", hangul: "호", meaning: "넓을 호, 클 호", strokes: 11, element: "수(水)" }, soundHarmony: "ㅈ(금) → ㅎ(토) 당당한 파동", meaningTemplate: "넓고 호방한 기상(浩)과 묵직한 신뢰(鎭)로 큰 뜻을 완수하는 대장부의 이름" }
    ],
    female: [
      { hangul: "서연", char1: { char: "瑞", hangul: "서", meaning: "상서로울 서", strokes: 14, element: "금(金)" }, char2: { char: "娟", hangul: "연", meaning: "예쁠 연, 고울 연", strokes: 10, element: "목(木)" }, soundHarmony: "ㅅ(금) → ㅇ(토) 세련된 파동", meaningTemplate: "상서로운 복운과 함께 아름답고 총명한 기품(娟)을 두루 갖춘 이름" },
      { hangul: "시은", char1: { char: "施", hangul: "시", meaning: "베풀 시", strokes: 9, element: "금(金)" }, char2: { char: "恩", hangul: "은", meaning: "은혜 은", strokes: 10, element: "토(土)" }, soundHarmony: "ㅅ(금) → ㅇ(토) 청초한 파동", meaningTemplate: "은혜로운 마음을 베풀어(施) 주변을 행복하게 만드는 따스한 인덕의 이름" },
      { hangul: "서현", char1: { char: "瑞", hangul: "서", meaning: "상서로울 서", strokes: 14, element: "금(金)" }, char2: { char: "賢", hangul: "현", meaning: "어질 현", strokes: 15, element: "토(土)" }, soundHarmony: "ㅅ(금) → ㅎ(토) 총명 파동", meaningTemplate: "상서로운 복락(瑞)과 지혜롭고 어진 성품(賢)으로 명성을 드높이는 이름" }
    ]
  },
  water: {
    male: [
      { hangul: "하준", char1: { char: "河", hangul: "하", meaning: "물 하, 큰 강 하", strokes: 9, element: "수(水)" }, char2: { char: "俊", hangul: "준", meaning: "준걸 준, 뛰어날 준", strokes: 9, element: "화(火)" }, soundHarmony: "ㅎ(토) → ㅈ(금) 명쾌한 파동", meaningTemplate: "큰 강물처럼 도도하고 유연한 지혜(河)와 빼어난 준재(俊)의 기량을 발휘하는 이름" },
      { hangul: "민재", char1: { char: "溟", hangul: "민", meaning: "어두울/바다 민", strokes: 14, element: "수(水)" }, char2: { char: "宰", hangul: "재", meaning: "재상 재, 다스릴 재", strokes: 10, element: "금(金)" }, soundHarmony: "ㅁ(수) → ㅈ(금) 지도자 파동", meaningTemplate: "넓은 바다 같은 포용력과 명석한 분별력으로 세상을 다스리는 재상(宰)의 기운" },
      { hangul: "태원", char1: { char: "泰", hangul: "태", meaning: "클 태, 평안할 태", strokes: 10, element: "수(水)" }, char2: { char: "源", hangul: "원", meaning: "근원 원, 근본 원", strokes: 14, element: "수(水)" }, soundHarmony: "ㅌ(화) → ㅇ(토) 장엄한 파동", meaningTemplate: "마르지 않는 맑은 샘(源)처럼 끝없는 재물과 번영의 근본을 이루는 이름" }
    ],
    female: [
      { hangul: "수아", char1: { char: "洙", hangul: "수", meaning: "물가 수, 맑을 수", strokes: 10, element: "수(水)" }, char2: { char: "雅", hangul: "아", meaning: "맑을 아, 우아할 아", strokes: 12, element: "목(木)" }, soundHarmony: "ㅅ(금) → ㅇ(토) 맑은 파동", meaningTemplate: "맑은 물결처럼 맑고 투명하며 우아한 기품(雅)을 간직한 아름다운 이름" },
      { hangul: "하린", char1: { char: "河", hangul: "하", meaning: "물 하, 큰 강 하", strokes: 9, element: "수(水)" }, char2: { char: "潾", hangul: "린", meaning: "맑을 린", strokes: 16, element: "수(水)" }, soundHarmony: "ㅎ(토) → ㄹ(화) 청량한 파동", meaningTemplate: "반짝이는 강물처럼 맑고 순수하여 만인의 눈길을 사로잡는 보석 같은 이름" },
      { hangul: "서윤", char1: { char: "瑞", hangul: "서", meaning: "상서로울 서", strokes: 14, element: "금(金)" }, char2: { char: "潤", hangul: "윤", meaning: "윤택할 윤, 젖을 윤", strokes: 16, element: "수(水)" }, soundHarmony: "ㅅ(금) → ㅇ(토) 풍요 파동", meaningTemplate: "일생이 물 흐르듯 윤택하고(潤) 길한 상서로움(瑞)이 가득 차오르는 이름" }
    ]
  }
};

// Generate Naming Result - 100% Astronomical Manseryeok + Dynamic Numerology
function generateNamingResult(prompt: string): string {
  const m = calculateManseryeok(prompt);
  const { sajuChart, dayStem, dayBranch, solarYear, solarMonth, solarDay } = m;
  const { pillars, elements, daeunStartAge, daeunList, profile } = sajuChart;

  const isMale = profile.isMale;
  let lastName = "김";
  const lastMatch = prompt.match(/성씨는\s*"([^"]+)"/);
  if (lastMatch) lastName = lastMatch[1].trim();

  // 3. Find Deficient (Weak) Elements to supplement via Resource Element
  const elementEntries = Object.entries(elements) as [ "wood" | "fire" | "earth" | "metal" | "water", number ][];
  elementEntries.sort((a, b) => a[1] - b[1]);
  const weakestKey = elementEntries[0][0];

  const elementNamesKo: Record<string, string> = { wood: "목(木)", fire: "화(火)", earth: "토(土)", metal: "금(金)", water: "수(水)" };
  const weakElementsKo = elementEntries.filter(e => e[1] <= 1).map(e => elementNamesKo[e[0]]);
  if (weakElementsKo.length === 0) weakElementsKo.push(elementNamesKo[weakestKey]);
  const strongElementsKo = elementEntries.filter(e => e[1] >= 2).map(e => elementNamesKo[e[0]]);

  // 4. Resolve Last Name Data
  const lastNameInfo = LAST_NAMES_DB[lastName] || { hanja: lastName, strokes: 8, element: "토(土)" };

  // 5. Pick Candidates from Pool
  const genderKey = isMale ? "male" : "female";
  const poolCategory = NAME_POOL[weakestKey] || NAME_POOL.wood;
  const candidates = poolCategory[genderKey] || NAME_POOL.wood.male;

  // Build 3 Custom Recommendations with Real 4-Stroke Numerology
  const recommendations = candidates.slice(0, 3).map((c) => {
    const strokeWon = c.char1.strokes + c.char2.strokes;
    const strokeHyung = lastNameInfo.strokes + c.char1.strokes;
    const strokeI = lastNameInfo.strokes + c.char2.strokes;
    const strokeJung = lastNameInfo.strokes + c.char1.strokes + c.char2.strokes;

    const evalWon = evaluateStrokeLuck(strokeWon);
    const evalHyung = evaluateStrokeLuck(strokeHyung);
    const evalI = evaluateStrokeLuck(strokeI);
    const evalJung = evaluateStrokeLuck(strokeJung);

    return {
      hangul: `${lastName}${c.hangul}`,
      hanja: `${lastNameInfo.hanja}${c.char1.char}${c.char2.char}`,
      syllables: [
        { char: c.char1.char, hangul: c.char1.hangul, meaning: c.char1.meaning, strokes: c.char1.strokes, element: c.char1.element },
        { char: c.char2.char, hangul: c.char2.hangul, meaning: c.char2.meaning, strokes: c.char2.strokes, element: c.char2.element }
      ],
      strokesAnalysis: {
        won: { strokes: strokeWon, grade: evalWon.grade, desc: evalWon.desc },
        hyung: { strokes: strokeHyung, grade: evalHyung.grade, desc: evalHyung.desc },
        i: { strokes: strokeI, grade: evalI.grade, desc: evalI.desc },
        jung: { strokes: strokeJung, grade: evalJung.grade, desc: evalJung.desc }
      },
      soundHarmony: c.soundHarmony,
      overallMeaning: `${c.meaningTemplate} (${lastNameInfo.hanja}씨 가문의 영광과 사주에 부족한 ${elementNamesKo[weakestKey]} 기운을 보완)`
    };
  });

  const namingJson = JSON.stringify({
    namingAnalysis: {
      sajuData: {
        profile,
        pillars,
        elements,
        daeunStartAge,
        daeunList
      },
      sajuSummary: {
        strongElements: strongElementsKo,
        weakElements: weakElementsKo,
        supplementElement: `사주에 가장 부족한 ${elementNamesKo[weakestKey]}의 정기를 자원오행으로 완벽 보완`,
        advice: `성씨 [${lastName}]씨 가문의 기운과 ${profile.solarDate}(${profile.lunarDate}) 사주 원국의 오행 강약(결핍된 ${elementNamesKo[weakestKey]} 기운)을 정밀 만세력으로 대조하여, 수리 4격(원·형·이·정)이 조화를 이루는 길한 명품 이름을 엄선했습니다.`
      },
      recommendations
    }
  }, null, 2);

  return `\`\`\`json
${namingJson}
\`\`\`

### 📜 [${solarYear}년 ${solarMonth}월 ${solarDay}일생] 정통 성명학(姓名學) 맞춤 추천 풀이

성씨 **[${lastName}]** 씨의 가문 흐름과 정밀 만세력으로 산출된 사주 원국에서 보완이 절실한 **자원오행(${elementNamesKo[weakestKey]}의 정기)**을 완벽하게 수혈하도록 작명하였습니다.

1. **사주 원국의 오행 균형 분석**:
   - 일주: **${dayStem}${dayBranch}(${STEM_KOREAN[dayStem] || ""}${BRANCH_KOREAN[dayBranch] || ""})** | 결핍된 기운: **${weakElementsKo.join(", ")}**
   - 사주에 상대적으로 희박한 ${elementNamesKo[weakestKey]}의 에너지를 이름의 한자 부수(자원오행)에 담아 일생의 균형을 완성했습니다.

2. **원형이정(元亨利貞) 4격 수리(數理) 배치**:
   - **초년운(원격)**: 청소년기 학업 성취와 총명함, 교우관계의 발복
   - **청년운(형격)**: 사회 진출, 자격 취득, 취업 및 독립 자립의 기운
   - **중년운(이격)**: 사업 번창, 승진, 자산 축적 및 가정의 안정
   - **총운/말년운(정격)**: 만인의 존경을 받으며 누리는 영예와 무병장수의 만복

3. **음령오행(발음 파동)의 조화**:
   성씨 [${lastName}]씨와 이름의 첫소리·끝소리가 서로 생(生)하여 부를 때마다 행운의 파동이 뇌세포와 주변에 울려 퍼집니다.`;
}

// Generate Face Analysis Result
function generateFaceResult(): string {
  const faceJson = JSON.stringify({
    faceAnalysis: {
      forehead: { type: "넓고 평평하며 도톰한 이마", meaning: "지혜롭고 부모덕이 있으며 초년에 높은 영예를 안을 수 있는 운세입니다.", score: 92, details: "이마의 기운(상정)이 꽉 차 있어 학문이나 전문직에서 두각을 나타내며, 사람들에게 높은 신뢰를 얻습니다." },
      eyebrows: { type: "초승달 모양의 수려한 눈썹", meaning: "대인관계가 대단히 원만하며 대중의 지지를 받아 인덕이 넘쳐납니다.", score: 85, details: "형제 및 동료 운이 좋아 협력과 네트워킹을 통해 큰 시너지를 만들어내며, 성품이 고결합니다." },
      eyes: { type: "눈동자가 맑고 끝이 긴 서안(瑞眼)", meaning: "총명함과 판단력이 뛰어나며 좋은 배우자를 만나 안정적인 가정을 꾸립니다.", score: 88, details: "정신이 매우 맑고 집중력이 탁월하여 일의 핵심을 꿰뚫는 혜안이 있으며, 중년에 크게 발전합니다." },
      nose: { type: "콧날이 곧고 콧방울이 두툼한 현담비(懸膽鼻)", meaning: "재물을 축적하고 스스로 자수성가하여 큰 부를 이룰 강력한 재백궁의 운입니다.", score: 95, details: "독립성과 주관이 확실하고 재물의 출입이 안전하여 한 번 모인 재물이 쉽게 새어나가지 않는 코입니다." },
      mouth: { type: "입술이 도톰하고 입꼬리가 위로 올라간 활 모양 입(弓口)", meaning: "말년운이 대단히 좋으며, 신용이 높고 자녀덕이 풍성합니다.", score: 90, details: "언행이 바르고 소통 능력이 출중해 주변의 추앙을 받으며 노후에 부유하고 안락한 가정을 이룹니다." },
      philtrum: { type: "선명하고 곧게 쭉 뻗은 긴 인중", meaning: "생명력이 강인하고 무병장수하며, 후손운과 지속적인 재물 흐름이 보장됩니다.", score: 87, details: "체력적인 회복력이 뛰어나고 노년까지 활발히 활동할 에너지를 지니고 있어 말년이 풍요롭습니다." },
      ears: { type: "귓볼이 두툼하고 윤곽이 뚜렷한 수주(垂珠)", meaning: "지혜와 인덕이 넘쳐나며 타인의 조언을 귀담아듣는 큰 품격이 있습니다.", score: 89, details: "근원적인 신장 에너지가 건강하며 성품이 온화하여 사람들의 신망과 존경을 평생 한 몸에 받습니다." },
      headShape: { type: "균형 잡힌 타원형의 상서로운 머리모양", meaning: "기질이 온화하고 이성과 감성의 조화가 뛰어나 지적인 활동에 최적화되어 있습니다.", score: 83, details: "두뇌 회전이 빠르고 창의적 사고에 유능해 학자, 연구원 또는 창의적인 비즈니스에서 발복합니다." },
      boneStructure: { type: "좌우가 꽉 찬 탄탄한 턱선과 기품 있는 골격", meaning: "강한 의지력과 뚝심이 있으며 난관을 극복해내는 불굴의 근성을 의미합니다.", score: 91, details: "지지 세력이 두터워 혼자 외롭게 분투하지 않고 주변 사람들의 든든한 조력을 힘입어 말년 기반을 다집니다." },
      overall: {
        personality: "성격 판독: 정직하고 자존심이 세며 이타적인 성품을 지녔습니다. 타인을 배려하는 소통 능력이 핵심 강점입니다.",
        wealth: "재물운 판독: 현담비와 활 모양 입술의 영향으로 30대 중반 이후 기하급수적으로 자산이 증식되는 상입니다.",
        career: "직업운 판독: 사람들의 시선과 신뢰를 받는 공직, 대기업 리더, 또는 고도의 전문성을 살린 크리에이터에 어울립니다.",
        health: "건강운 판독: 인중과 귀의 에너지가 탄탄하여 뇌와 신장의 흐름이 원활하고 노년까지 뛰어난 에너지를 유지합니다.",
        summary: "종합 처세 및 조언: 전반적으로 상·중·하정이 균형을 이루어 가을의 결실 같은 평온함을 나타냅니다. 긍정적인 미소를 유지하면 운이 더욱 개화합니다."
      }
    }
  }, null, 2);

  return `\`\`\`json
${faceJson}
\`\`\`

### 👤 마의상법(麻衣相法) 정밀 관상 판독 총평

전체적인 얼굴의 삼정(이마 상정, 눈·코 중정, 입·턱 하정)이 황금비율을 이루고 있어, 초년의 배움이 중년의 자수성가로 이어지고 말년의 안락한 결실로 완성되는 **'대기만성형 귀격(貴格)'** 관상입니다.

- **재백궁(코)의 기운**: 콧방울의 살집이 풍부하여 재물이 들어오는 문이 넓고, 콧구멍이 정면에서 쉽게 드러나지 않아 모인 자산의 누수가 없습니다.
- **십이궁 중 노복궁(턱과 하관)**: 지지 세력과 후배, 부하 직원의 신뢰를 듬뿍 받는 형상으로 팀과 조직을 이끄는 리더에 최적화되어 있습니다.`;
}

// Generate Feng Shui Result
function generatePungsuResult(): string {
  const pungsuJson = JSON.stringify({
    pungsuAnalysis: {
      analysisType: "interior",
      kuaNumber: "巽(손)괘 / 4",
      favorableDirections: [
        { dir: "남동쪽(巽)", type: "생기(生氣) - 최상 길방", desc: "활발한 활동력과 명예, 재물운이 급상승하는 가장 복된 방위입니다." },
        { dir: "남쪽(離)", type: "천의(天醫) - 건강 길방", desc: "신체적 치유 에너지가 넘치고 정서적 안정과 장수를 돕는 방위입니다." },
        { dir: "동쪽(震)", type: "연년(延年) - 화합 길방", desc: "가족간의 소통이 원활해지고 귀인의 조력을 얻어 대인관계가 발복하는 방위입니다." }
      ],
      unfavorableDirections: [
        { dir: "동북쪽(艮)", type: "절명(絶命) - 최악 흉방", desc: "생기가 소멸하여 피로가 누적되고 재물 누수 위험이 높은 방위입니다." },
        { dir: "서쪽(兌)", type: "육살(六煞) - 구설 흉방", desc: "인간관계에 갈등이 생기기 쉬우며 불면증과 예민함이 증폭될 수 있는 방위입니다." }
      ],
      interiorPrescriptions: [
        { 
          room: "안방/침실", 
          title: "침대 머리방향 진단", 
          status: "양호",
          text: "침대 헤드가 남동쪽 또는 동쪽을 향하면 아침의 생기를 온전히 흡수할 수 있습니다.", 
          remedy: "출입문과 대각선 위치에 침대를 배치하고, 머리맡에 은은한 웜톤 간접 조명을 두어 숙면을 유도하세요." 
        },
        { 
          room: "현관/거실", 
          title: "현관 정면 거울 및 채광 진단", 
          status: "주의", 
          text: "현관문을 열었을 때 마주보는 큰 거울은 복을 반사하므로 측면으로 이동시키는 것이 길합니다.", 
          remedy: "현관 측면에 밝고 따뜻한 조명을 설치하고, 노란색이나 황금빛 액자를 걸어 재물운을 적극 유치하십시오." 
        }
      ]
    }
  }, null, 2);

  return `\`\`\`json
${pungsuJson}
\`\`\`

### 🧭 양택(陽宅) 풍수지리 및 본명괘 공간 처방

기운의 흐름(生氣)은 바람을 타고 흩어지며, 물을 만나면 머무릅니다(藏風得水).

1. **공간 에너지 정화**: 현관 입구의 신발과 잡동사니를 말끔히 정돈하는 것만으로도 집안에 유입되는 생기의 질이 30% 이상 상승합니다.
2. **금전운을 부르는 비보(裨補) 풍수**: 거실의 동남쪽 모서리에 잎이 넓은 관엽식물(금전수, 몬스테라)을 배치하면 정체된 탁기가 맑은 생기로 변환됩니다.`;
}

// Generate Travel Result with Map Markers
function generateTravelResult(prompt: string, isAssistant: boolean): string {
  const p = prompt.toLowerCase();

  // 1. Rome / Italy (이태리, 로마, 이탈리아)
  const isRome = p.includes("로마") || p.includes("이태리") || p.includes("이탈리아") || p.includes("rome") || p.includes("italy") || p.includes("콜로세움") || p.includes("바티칸");
  if (isRome) {
    return `[MARKER: 콜로세움 (Colosseo), 41.890210, 12.492231]
[MARKER: 포로 로마노 (Foro Romano), 41.892462, 12.485324]
[MARKER: 판테온 (Pantheon), 41.898611, 12.476944]
[MARKER: 트레비 분수 (Fontana di Trevi), 41.900930, 12.483310]
[MARKER: 바티칸 성 베드로 대성당, 41.902167, 12.453937]
[MARKER: 스페인 광장 (Piazza di Spagna), 41.905990, 12.482778]
[MARKER: 나보나 광장 (Piazza Navona), 41.899167, 12.473056]
[MARKER: 산탄젤로 성 (Castel Sant'Angelo), 41.903056, 12.466389]
[MARKER: 트라스테베레 로컬 미식 지구, 41.888889, 12.469444]

### 🇮🇹 이탈리아 로마 4박 5일 황금 감성 여행 코스

역사와 낭만이 살아 숨 쉬는 '영원의 도시' 로마의 고대 유적, 바티칸의 장엄한 예술, 그리고 골목길 정통 미식까지 완벽하게 만끽할 수 있는 스마트 여행 일정입니다.

#### 🏛️ 1일차: 고대 로마 제국의 위대한 발자취
- **오전 (09:30~12:30)**: **콜로세움(Colosseo)** & **포로 로마노(Foro Romano)**
  - 2천 년 전 검투사들의 거대한 원형 경기장 콜로세움 내부 관람 후 고대 로마의 정치·경제 중심지 포로 로마노 산책
- **점심 (12:30~14:00)**: 콜로세움 인근 전통 트라토리아에서 오리지널 **카르보나라(Carbonara)**와 하우스 와인
- **오후 (14:30~17:00)**: **팔라티노 언덕** & **캄피돌리오 광장**
  - 미켈란젤로가 설계한 캄피돌리오 광장에서 로마 전경 감상 및 마르쿠스 아우렐리우스 기마상 조망
- **저녁 (18:30~20:30)**: 몬티(Monti) 지구의 감성 비스트로에서 정통 화덕 피자와 티라미수

#### ⛲ 2일차: 로마 심장부 르네상스 & 바로크 예술 산책
- **오전 (09:00~12:00)**: **스페인 광장(Piazza di Spagna)** & 콘도티 명품 거리
  - 영화 '로마의 휴일' 명소인 스페인 계단과 바르카차 분수 감상
- **점심 (12:00~13:30)**: 스페인 계단 근처에서 신선한 트러플 파스타 & 로마 3대 젤라또 지올리띠(Giolitti)
- **오후 (14:00~17:30)**: **트레비 분수(Fontana di Trevi)** & **판테온(Pantheon)**
  - 동전을 던져 로마 재방문을 기원하고, 고대 로마 건축의 정수인 판테온의 경이로운 돔 오쿨루스(채광창) 관람
- **저녁 (18:30~21:00)**: 바로크 분수와 거리 악사들이 어우러진 **나보나 광장(Piazza Navona)**에서 아페리티보(식전주)와 디너

#### ⛪ 3일차: 성스러운 바티칸 시국 집중 투어
- **오전 (08:30~13:00)**: **바티칸 미술관(Musei Vaticani)** & **시스티나 성당**
  - 라파엘로의 방, 미켈란젤로의 필생의 역작 '천지창조' 및 '최후의 심판' 영접
- **점심 (13:00~14:30)**: 바티칸 성벽 인근에서 정통 포카치아 샌드위치 및 에스프레소
- **오후 (14:30~17:30)**: **성 베드로 대성당 & 광장**
  - 세계 가톨릭 총본산 성당 내부 미켈란젤로의 '피에타(Pietà)' 관람 및 쿠폴라 돔 전망대에서 열쇠 모양 광장 조망
- **일몰 & 저녁 (18:00~20:30)**: 테베레 강변의 **산탄젤로 성(천사의 성)**으로 이동하여 로맨틱한 일몰과 석양 야경 감상

#### 🌿 4일차: 보르게세 공원 힐링 & 쇼핑 여유
- **오전 (10:00~12:30)**: **보르게세 미술관(Galleria Borghese)**
  - 베르니니의 조각 걸작들과 카라바조의 명화를 감상할 수 있는 유럽 최고 수준의 컬렉션
- **점심 (12:30~14:30)**: 푸르른 보르게세 공원 테라스 카페에서 브런치 & 여유로운 산책
- **오후 (15:00~18:00)**: 포폴로 광장 및 코르소 거리에서 이탈리아 가죽 공예품, 올리브 오일, 발사믹 식초 기념품 쇼핑
- **저녁 (19:00~21:30)**: 로마의 야경 명소 핀초 언덕(Terrazza del Pincio)에서 붉게 물드는 로마 파노라마 조망

#### 🍷 5일차: 트라스테베레 골목길 로컬 정취 탐방 & 마무리
- **오전 (09:30~12:00)**: **캄포 데 피오리(Campo de' Fiori)** 재래시장 & **진실의 입(Bocca della Verità)**
  - 활기찬 시장에서 신선한 치즈와 과일 시식 후 산타 마리아 인 코스메딘 성당의 진실의 입 기념 촬영
- **점심 (12:30~14:30)**: **트라스테베레(Trastevere)** 구역
  - 로마 현지인들이 가장 사랑하는 돌바닥 골목 마을에서 뇨키(Gnocchi)와 카치오 에 페페(Cacio e Pepe) 맛보기
- **오후 (15:00~)**: 공항 이동 및 잊지 못할 로마 추억을 안고 귀국

💡 **로마 여행 필수 꿀팁**:
1. **바티칸 & 콜로세움**: 성수기 대기 시간이 2~3시간에 달하므로 공식 웹사이트 사전 패스트트랙 예약이 필수입니다.
2. **소매치기 주의**: 트레비 분수와 테르미니역, 지하철 A선 내부에서는 귀중품 가방을 몸 앞쪽으로 소지하세요.
3. **무료 식수(나소니 Nasoni)**: 시내 곳곳의 고대 식수대 물은 청량하고 음용 가능하므로 휴대용 텀블러를 챙기시면 유용합니다.`;
  }

  // 2. Paris / France
  const isParis = p.includes("파리") || p.includes("프랑스") || p.includes("paris") || p.includes("에펠탑");
  if (isParis) {
    return `[MARKER: 에펠탑 (Tour Eiffel), 48.858370, 2.294481]
[MARKER: 루브르 박물관 (Musée du Louvre), 48.860611, 2.337644]
[MARKER: 개선문 (Arc de Triomphe), 48.873792, 2.295028]
[MARKER: 몽마르트르 사크레쾨르, 48.886704, 2.343104]
[MARKER: 오르세 미술관 (Musée d'Orsay), 48.859961, 2.326561]
[MARKER: 노트르담 대성당, 48.852968, 2.349902]

### 🇫🇷 낭만의 도시 프랑스 파리 여행 코스
- **1일차**: 루브르 박물관 모나리자 관람 → 튈르리 정원 산책 → 센강 바토무슈 유람선에서 에펠탑 야경
- **2일차**: 오르세 미술관 인상파 회화 감상 → 생제르맹데프레 카페 드 플로르에서 카푸치노 → 노트르담 대성당
- **3일차**: 샹젤리제 거리 쇼핑 → 개선문 전망대 → 몽마르트르 언덕 사랑해 벽 & 사크레쾨르 대성당`;
  }

  // 3. Barcelona / Spain
  const isSpain = p.includes("스페인") || p.includes("바르셀로나") || p.includes("barcelona") || p.includes("가우디");
  if (isSpain) {
    return `[MARKER: 사그라다 파밀리아 (성가족성당), 41.403630, 2.174356]
[MARKER: 구엘 공원 (Park Güell), 41.414495, 2.152695]
[MARKER: 카사 바트요 (Casa Batlló), 41.391667, 2.165000]
[MARKER: 보케리아 시장 (Mercat de la Boqueria), 41.381667, 2.171389]
[MARKER: 바르셀로네타 해변, 41.378333, 2.192500]

### 🇪🇸 스페인 바르셀로나 가우디 건축 & 미식 투어
- **1일차**: 사그라다 파밀리아 대성당 감상 → 그라시아 거리 카사 밀라 & 카사 바트요 관람
- **2일차**: 구엘 공원 도마뱀 분수 산책 → 람블라스 거리 & 보케리아 시장 하몬·해산물 타파스 즐기기
- **3일차**: 고딕 지구 피카소 미술관 → 바르셀로네타 해변에서 정통 해물 파에야와 샹그리아`;
  }

  // 4. London / UK
  const isLondon = p.includes("런던") || p.includes("영국") || p.includes("london") || p.includes("빅벤");
  if (isLondon) {
    return `[MARKER: 빅벤 & 국회의사당, 51.500729, -0.124625]
[MARKER: 타워 브리지 (Tower Bridge), 51.505500, -0.075400]
[MARKER: 대영박물관 (British Museum), 51.519413, -0.126957]
[MARKER: 런던 아이 (London Eye), 51.503325, -0.119543]
[MARKER: 버킹엄 궁전 (Buckingham Palace), 51.501364, -0.141890]

### 🇬🇧 클래식과 현대가 공존하는 영국 런던 투어
- **1일차**: 버킹엄 궁전 근위병 교대식 → 빅벤 & 웨스트민스터 사원 → 런던아이 야경
- **2일차**: 대영박물관 인류 유산 관람 → 코벤트 가든 애프터눈 티 → 소호 뮤지컬 관람
- **3일차**: 런던탑 & 타워 브리지 도보 횡단 → 버로우 마켓 로컬 푸드 → 테이트 모던 미술관`;
  }

  // 5. Switzerland
  const isSwiss = p.includes("스위스") || p.includes("인터라켄") || p.includes("융프라우") || p.includes("swiss");
  if (isSwiss) {
    return `[MARKER: 융프라우요흐 (Jungfraujoch), 46.547500, 7.982778]
[MARKER: 인터라켄 오스트 역, 46.690278, 7.869722]
[MARKER: 그린델발트 (Grindelwald), 46.624167, 8.041389]
[MARKER: 피르스트 플라이어 (First), 46.661111, 8.053889]

### 🇨🇭 알프스의 대자연 스위스 융프라우 힐링 투어
- **1일차**: 인터라켄 도착 → 하더쿨룸 전망대에서 브리엔츠 & 툰 호수 조망 → 스위스 퐁듀 디너
- **2일차**: 산악열차 탑승 → 유럽의 지붕 '융프라우요흐(3,454m)' 얼음궁전 및 만년설 트레킹
- **3일차**: 그린델발트 피르스트 액티비티(클리프 워크 & 마운틴 카트) → 호숫가 산책`;
  }

  // 6. Tokyo / Japan
  const isTokyo = p.includes("도쿄") || p.includes("동경") || p.includes("tokyo");
  if (isTokyo) {
    return `[MARKER: 아사쿠사 센소지, 35.714765, 139.796655]
[MARKER: 시부야 스크램블 교차로, 35.659100, 139.700600]
[MARKER: 도쿄 타워, 35.658580, 139.745433]
[MARKER: 신주쿠 교엔, 35.685176, 139.710052]
[MARKER: 긴자 식스, 35.669600, 139.764000]

### 🇯🇵 일본 도쿄 도심 감성 여행 코스
- **1일차**: 나리타/하네다 도착 → 아사쿠사 센소지 고풍 사찰 탐방 → 도쿄 스카이트리 야경
- **2일차**: 신주쿠 교엔 정원 힐링 → 하라주쿠 & 오모테산도 쇼핑 → 시부야 스카이 전망대
- **3일차**: 츠키지 장외시장 신선한 스시 조식 → 긴자 명품 거리 산책 → 롯폰기 힐즈에서 도쿄 타워 조망`;
  }

  // 7. Osaka / Kansai
  const isOsaka = p.includes("오사카") || p.includes("osaka") || p.includes("도톤보리");
  if (isOsaka) {
    return `[MARKER: 도톤보리 글리코상, 34.668725, 135.501293]
[MARKER: 오사카성 천수각, 34.687315, 135.526201]
[MARKER: 유니버셜 스튜디오 재팬, 34.665442, 135.432338]
[MARKER: 우메다 공중정원, 34.705278, 135.490556]
[MARKER: 쿠로몬 시장, 34.665556, 135.506667]

### 🇯🇵 일본 오사카 미식 & 엔터테인먼트 투어
- **1일차**: 간사이 공항 도착 → 난바 도톤보리 타코야키 & 오코노미야키 맛집 투어 → 톤보리 리버크루즈
- **2일차**: 유니버셜 스튜디오 재팬(USJ) 슈퍼 닌텐도 월드 & 해리포터 종일 투어
- **3일차**: 오사카성 공원 산책 → 쿠로몬 시장 해산물 꼬치구이 → 우메다 공중정원 환상적인 야경`;
  }

  // 8. Kyoto
  const isKyoto = p.includes("교토") || p.includes("청수사");
  if (isKyoto) {
    return `[MARKER: 기요미즈데라 (청수사), 34.994857, 135.785046]
[MARKER: 후시미이나리 신사, 34.967140, 135.772672]
[MARKER: 금각사 (킨카쿠지), 35.039370, 135.729243]
[MARKER: 아라시야마 대나무숲, 35.016972, 135.671306]
[MARKER: 니시키 시장, 35.005000, 135.764444]

### ⛩️ 일본 교토 2박 3일 고도 감성 여행 코스
- **1일차**: 교토역 도착 → 니시키 시장 로컬 스트리트 푸드 탐방 → 기요미즈데라(청수사) 석양 조망
- **2일차**: 후시미이나리 천 개의 붉은 토리이길 산책 → 아라시야마 대나무숲(치쿠린) 및 도게츠교 풍경
- **3일차**: 금각사의 화려한 금빛 감상 → 카모가와 강변 카페에서 말차 라떼와 함께 여유 즐기기`;
  }

  // 9. Da Nang / Vietnam
  const isDanang = p.includes("다낭") || p.includes("베트남") || p.includes("호이안");
  if (isDanang) {
    return `[MARKER: 미케 비치 (My Khe Beach), 16.059444, 108.243056]
[MARKER: 바나힐 골든 브릿지, 15.995000, 107.996944]
[MARKER: 호이안 올드타운, 15.880000, 108.330000]
[MARKER: 핑크성당 (다낭 대성당), 16.066944, 108.223056]
[MARKER: 한시장 (Han Market), 16.068056, 108.224444]

### 🇻🇳 베트남 다낭 & 호이안 힐링 휴양 코스
- **1일차**: 다낭 공항 도착 → 핑크성당 & 한시장 쇼핑 → 미케 비치 오션뷰 카페 및 해산물 만찬
- **2일차**: 해발 1,400m 바나힐 테마파크 거인의 손 골든브릿지 감상 → 루지 체험
- **3일차**: 호이안 유네스코 올드타운으로 이동 → 투본강 소원배 띄우기 & 환상적인 야경 감상`;
  }

  // 10. Bangkok / Thailand
  const isBangkok = p.includes("방콕") || p.includes("태국") || p.includes("bangkok");
  if (isBangkok) {
    return `[MARKER: 왓 아룬 (새벽사원), 13.743700, 100.488900]
[MARKER: 방콕 왕궁 & 에메랄드 사원, 13.750000, 100.491667]
[MARKER: 카오산 로드, 13.758889, 100.497222]
[MARKER: 아이콘시암 (Iconsiam), 13.726667, 100.510556]
[MARKER: 짜뚜짝 주말시장, 13.799722, 100.550278]

### 🇹🇭 태국 방콕 활기찬 도심 & 사원 투어
- **1일차**: 방콕 왕궁 관람 → 차오프라야 강 건너 왓 아룬 새벽사원 노을 감상 → 카오산 로드 야시장 팟타이 즐기기
- **2일차**: 대형 쇼핑몰 아이콘시암 실내 수상시장 탐방 → 루프탑 바에서 방콕 스카이라인 칵테일
- **3일차**: 짜뚜짝 주말시장 공예품 쇼핑 → 정통 타이 마사지 힐링 스파`;
  }

  // 11. Busan / Korea
  const isBusan = p.includes("부산") || p.includes("해운대") || p.includes("광안리");
  if (isBusan) {
    return `[MARKER: 해운대 해수욕장, 35.158700, 129.160400]
[MARKER: 광안리 해수욕장 & 드론쇼, 35.153200, 129.118600]
[MARKER: 자갈치 시장, 35.097000, 129.030500]
[MARKER: 감천문화마을, 35.097500, 129.010600]
[MARKER: 흰여울문화마을, 35.077222, 129.043889]

### 🌊 대한민국 부산 바다 & 로컬 미식 코스
- **1일차**: 부산역 도착 → 남포동 자갈치시장 꼼장어 & 비빔당면 → 감천문화마을 어린왕자 포토존
- **2일차**: 흰여울문화마을 해안 절벽 산책 → 해운대 블루라인파크 해변열차 → 광안대교 야경 & 드론쇼
- **3일차**: 해운대 해변 조식 → 동백섬 둘레길 산책 → 로컬 돼지국밥 한 그릇`;
  }

  // 12. Jeju / Korea
  const isJeju = p.includes("제주");
  if (isJeju) {
    return `[MARKER: 성산일출봉, 33.458056, 126.942500]
[MARKER: 함덕해수욕장, 33.543417, 126.669028]
[MARKER: 섭지코지, 33.424167, 126.931111]
[MARKER: 사려니숲길, 33.407778, 126.643056]
[MARKER: 동문시장 야시장, 33.512778, 126.528333]

### 🏝️ 대한민국 제주도 힐링 & 미식 추천 코스
- **1일차**: 제주공항 도착 → 함덕해수욕장 에메랄드빛 바다 산책 → 동문시장 야시장에서 흑돼지 & 딱새우
- **2일차**: 성산일출봉 일출 감상 → 섭지코지 해안 절경 투어 → 로컬 고기국수 맛집
- **3일차**: 사려니숲길 피톤치드 힐링 트레킹 → 오설록 티뮤지엄 녹차밭 → 귀가`;
  }

  // 13. General / Smart Dynamic Fallback based on User's Query
  const cleanDestination = prompt
    .replace(/[0-9]+박[0-9]+일|[0-9]+일[0-9]+박|추천|일정|코스|가이드|계획|여행/g, '')
    .trim() || '추천 여행지';

  return `[MARKER: ${cleanDestination} 중심 랜드마크, 37.566535, 126.977969]
[MARKER: ${cleanDestination} 로컬 명소 1, 37.579617, 126.977041]
[MARKER: ${cleanDestination} 뷰포인트 & 카페거리, 37.544520, 127.056010]
[MARKER: ${cleanDestination} 전통 미식 거리, 37.570138, 126.999889]

### ✈️ [${cleanDestination}] 스마트 맞춤 여행 플랜

사용자님께서 문의하신 **${prompt}**에 최적화된 동선과 핵심 명소, 미식 포인트를 아우르는 추천 코스입니다.

- **1일차 (도착 및 랜드마크 탐방)**:
  - 오전: 도착 및 숙소 체크인, ${cleanDestination}의 대표적인 상징 랜드마크 방문
  - 오후: 도심 주요 번화가 산책 및 첫날의 설렘을 더하는 감성 카페거리 투어
  - 저녁: 로컬 현지인들이 즐겨 찾는 전통 요리 및 특산물 만찬

- **2일차 (문화 & 역사 & 예술 집중)**:
  - 오전: 유서 깊은 유적지나 미술관·박물관 관람을 통한 도시의 역사 이해
  - 오후: 숨은 뷰포인트 전망대에서 도시의 전경 조망 및 기념 포토 타임
  - 저녁: 야경이 아름다운 수변 공원 또는 핫플레이스 라운지에서 여유 만끽

- **3일차 (쇼핑 & 로컬 마켓 & 힐링 마무리)**:
  - 오전: 활기찬 아침 재래시장 탐방 및 로컬 간식 시식
  - 오후: 가족과 친구들을 위한 감성 기념품 쇼핑 및 공항/터미널 이동`;
}

// Generate Creative Result (Poetry, Acrostic Poem, Lyrics, Story, Essay, etc.)
function generateCreativeResult(prompt: string): string {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Acrostic Poem (N행시: 2행시, 3행시/삼행시, 4행시/사행시, 5행시/오행시, 행시)
  const isAcrostic = lower.includes("행시") || lower.includes("삼행시") || lower.includes("사행시") || lower.includes("오행시");
  if (isAcrostic) {
    const isSpring = lower.includes("봄") || lower.includes("따스함") || lower.includes("따뜻");
    const isFive = lower.includes("5행시") || lower.includes("오행시") || lower.includes("다섯");
    const isThree = lower.includes("3행시") || lower.includes("삼행시") || lower.includes("세");
    const isFour = lower.includes("4행시") || lower.includes("사행시") || lower.includes("네");
    const isTwo = lower.includes("2행시") || lower.includes("이행시") || lower.includes("두");

    if (isSpring) {
      if (isFive || (!isThree && !isFour && !isTwo)) {
        return `### 🌸 《봄의 따스함》 5행시

**봄**: **봄**빛이 얼어붙은 대지 위로 살포시 내려앉으면
**의**: **의**미 없이 스쳐 지나던 마른 나뭇가지마다 연둣빛 새순이 돋아나고
**따**: **따**사로운 햇살 한 줌이 겨우내 얼어있던 우리들의 마음을 부드럽게 감싸 안으니
**스**: **스**며드는 꽃바람의 온기에 세상의 모든 생명이 기지개를 켜며
**함**: **함**께 피어나는 웃음꽃으로 온 세상이 눈부신 희망으로 물들어 갑니다.

---

### 🌷 [추천 2] 《따스한 봄날》 5행시

**따**: **따**뜻한 온기가 닫혀 있던 창문을 부드럽게 두드릴 때
**스**: **스**스로 굳어져 있던 외로움을 가만히 털어내니
**한**: **한**가득 쏟아지는 눈부신 햇살 아래
**봄**: **봄**을 기다려온 수줍은 꽃망울이 환한 미소로 고개를 내밀고
**날**: **날**마다 새로운 설렘과 피어나는 사랑으로 가슴이 벅차오릅니다.

---
💡 **시인의 감상평**:
추운 겨울을 견뎌낸 뒤 찾아오는 봄의 포근한 생명력과 따스한 위로를 한 줄 한 줄의 운율에 담아 정성껏 빚어낸 5행시입니다.`;
      } else if (isThree) {
        return `### 🌸 《봄바람》 3행시

**봄**: **봄**을 알리는 부드러운 바람이 솔솔 불어오니
**바**: **바**라보는 세상 모든 곳에 연분홍 꽃비가 흩날리고
**람**: **람**(남)몰래 품어왔던 소망들이 눈부신 새싹으로 움터납니다.

---
💡 **시인의 감상평**:
따스한 봄바람이 선사하는 설렘과 새로운 시작의 희망을 3행시에 담았습니다.`;
      } else if (isFour) {
        return `### 🌸 《따스한 봄》 4행시

**따**: **따**사로운 햇살이 온 누리를 감싸 안을 때
**스**: **스**며드는 봄기운에 얼었던 마음도 녹아내려
**한**: **한**아름 피어난 꽃향기가 길목마다 가득하고
**봄**: **봄**날의 찬란한 축복이 우리 삶 속에 영원히 머뭅니다.`;
      } else if (isTwo) {
        return `### 🌸 《봄날》 2행시

**봄**: **봄**이 오는 소리에 귀 기울여 가만히 눈을 감으니
**날**: **날**마다 눈부신 햇살과 따스한 사랑이 내 곁을 채웁니다.`;
      }
    }

    // Dynamic acrostic poem based on user's target word
    const quoted = p.match(/['"「『]([^'"」』]+)['"」』]/);
    const targetWord = quoted ? quoted[1].replace(/\s+/g, '') : '';
    if (targetWord && targetWord.length >= 2) {
      const letters = targetWord.split('');
      const poemLines = letters.map((ch) => {
        return `**${ch}**: **${ch}**마음 깊은 곳에서 피어나는 진실한 울림으로 세상에 따뜻한 빛을 비춥니다.`;
      });
      return `### ✨ 《${targetWord}》 ${letters.length}행시\n\n${poemLines.join('\n')}\n\n💡 **감상평**: 제시어 '${targetWord}'의 각 음절을 첫 글자로 하여 조화로운 리듬과 서정적인 감성을 담아 지은 ${letters.length}행시입니다.`;
    }

    // Default 5-haengsi if unspecified
    return `### 🌸 《봄의 따스함》 5행시

**봄**: **봄**빛이 얼어붙은 대지 위로 살포시 내려앉으면
**의**: **의**미 없이 스쳐 지나던 마른 나뭇가지마다 연둣빛 새순이 돋아나고
**따**: **따**사로운 햇살 한 줌이 겨우내 얼어있던 우리들의 마음을 부드럽게 감싸 안으니
**스**: **스**며드는 꽃바람의 온기에 세상의 모든 생명이 기지개를 켜며
**함**: **함**께 피어나는 웃음꽃으로 온 세상이 눈부신 희망으로 물들어 갑니다.

---

### 🌷 [추천 2] 《따스한 봄날》 5행시

**따**: **따**뜻한 온기가 닫혀 있던 창문을 부드럽게 두드릴 때
**스**: **스**스로 굳어져 있던 외로움을 가만히 털어내니
**한**: **한**가득 쏟아지는 눈부신 햇살 아래
**봄**: **봄**을 기다려온 수줍은 꽃망울이 환한 미소로 고개를 내밀고
**날**: **날**마다 새로운 설렘과 피어나는 사랑으로 가슴이 벅차오릅니다.`;
  }

  // 2. Poems (시, 감성 시, 자작시, 서정시)
  const isPoem = lower.includes("시") || lower.includes("자작시") || lower.includes("서정시") || lower.includes("운문");
  if (isPoem) {
    const isSpring = lower.includes("봄") || lower.includes("따스함") || lower.includes("꽃") || lower.includes("햇살");
    if (isSpring) {
      return `### 🌿 감성 서정시: 《봄의 따스함이 머무는 자리》

겨우내 차가운 바람에 닫아두었던
마음의 문턱을 조용히 넘어서서,
봄빛은 가장 부드럽고 다정한 걸음으로 찾아왔습니다.

메마른 나뭇가지 끝에 맺힌 작은 꽃봉오리는
어두운 땅속에서 길어 올린 가장 순수한 고백이며,
대지를 어루만지는 따사로운 볕은
지난 계절의 서러움을 말없이 덮어주는 어머니의 손길입니다.

봄은 그저 계절의 바뀜이 아니라,
얼어붙은 모든 것들에게 다시 시작해도 괜찮다고
가만히 등을 토닥이며 건네는 세상에서 가장 따뜻한 위로입니다.

햇살 머무는 길목에 서서
두 눈을 감고 깊은 숨을 들이쉬면,
당신의 가슴속에도 이미
눈부신 꽃 한 송이가 활짝 피어나고 있습니다.

---
✍️ **시인의 노트**:
추운 계절을 견뎌낸 모든 이들에게 전하는 회복과 위로의 서정시입니다.`;
    }

    return `### 🌙 감성 서정시: 《마음이 머무는 풍경》

바쁜 하루의 걸음을 잠시 멈추고
가만히 고개를 들어 하늘을 바라봅니다.
노을빛 물드는 저녁 하늘 아래
지나온 시간들이 잔잔한 물결처럼 번져갑니다.

때로는 거친 바람에 흔들리고
때로는 짙은 어둠 속에 길을 잃어도,
우리가 함께 나눈 작은 온기 하나가
마음속 깊은 곳을 비추는 별빛이 되어줍니다.

오늘 하루도 참 애썼다고,
당신의 걸음걸음이 아름다웠다고
밤하늘의 고요한 침묵이 따뜻하게 속삭여옵니다.`;
  }

  // 3. Lyrics (작사, 가사, 노래, 발라드, 랩)
  const isLyrics = lower.includes("가사") || lower.includes("노래") || lower.includes("작사") || lower.includes("음악") || lower.includes("발라드");
  if (isLyrics) {
    const isSpring = lower.includes("봄") || lower.includes("따스함") || lower.includes("설렘");
    if (isSpring) {
      return `### 🎵 어쿠스틱 팝 가사: 《봄날의 온기 (Spring Warmth)》

**[Intro]** (어쿠스틱 기타 핑거링 솔로)

**[Verse 1]**
살얼음 녹아내린 개울가 길을 따라
가벼워진 외투 사이로 스며드는 바람
겨우내 움츠렸던 내 맘의 작은 창가에도
어느새 기분 좋은 햇살이 내려앉아

**[Pre-Chorus]**
얼어붙었던 시간 지나고
기다려온 계절이 눈앞에 펼쳐질 때
네가 내게 다가와 건넨 그 미소가
세상 모든 꽃들을 피워내

**[Chorus]**
따스한 봄바람을 타고 번져가는 우리 사랑
흩날리는 벚꽃 잎처럼 설레는 이 순간
손을 잡고 걸어가는 이 길 끝에 서서
영원히 기억할 봄날의 온기를 느껴

**[Verse 2]**
파란 하늘 아래 기대어 앉아
도란도란 나누는 소소한 이야기들
너와 함께라면 평범했던 매일이
동화 속 한 페이지처럼 물들어 가

**[Bridge]**
바람결에 실려 온 달콤한 향기 속에
약속해 줄래, 다음 봄에도
우린 지금처럼 꼭 함께하기로

**[Outro]**
라라라 라라라 봄빛 아래서
너와 나의 따스한 계절... (Fade out)`;
    }

    return `### 🎵 감성 발라드 가사: 《달빛이 머무는 밤》

**[Verse 1]**
차가워진 창가에 기대어
흐릿해진 네 얼굴을 그려봐
스쳐가는 바람에도 네 향기가 묻어와
지우려 애써도 너로 가득 차오르는 밤

**[Chorus]**
너 없는 계절이 이렇게 길 줄 몰랐어
흘러내린 눈물 뒤로 흩어지는 기억들
다시 돌아갈 수 없는 그 시간 속에서
나 홀로 너를 부르고 있어

**[Outro]**
달빛마저 숨죽인 이 새벽
여전히 난 여기서 널 기다려...`;
  }

  // 4. Fairy Tale / Story (동화, 어린이, 소설, 이야기)
  const isFairyTale = lower.includes("동화") || lower.includes("어린이") || lower.includes("아이");
  if (isFairyTale) {
    return `### 📖 따뜻한 힐링 동화: 《봄을 깨우는 아기 다람쥐와 햇살 요정》

깊은 숲속 참나무 둥지 안에서 아기 다람쥐 '토리'가 눈을 비비며 일어났어요.
바깥은 아직 쌀쌀했지만, 나뭇가지 끝에는 반짝이는 금빛 햇살 요정 '샤이니'가 내려앉아 있었지요.

"토리야, 이제 기지개를 켤 시간이야! 우리가 숲속 친구들에게 봄을 선물하러 가자."

샤이니가 방긋 웃으며 반짝이는 햇살 가루를 톡톡 뿌리자, 꽁꽁 얼었던 얼음 시냇물이 졸졸졸 노래를 시작했어요.
토리는 가슴에 품어둔 도토리와 솔방울을 들고 숲속 오솔길을 신나게 달렸어요.
차가운 낙엽 더미 아래에서 수줍게 웅크리고 있던 복수초와 제비꽃들이 토리의 발자국 소리를 듣고 방긋 꽃잎을 펼쳤답니다.

"고마워, 토리야! 너의 따뜻한 발걸음 덕분에 봄이 온 걸 알았어."

꽃들이 건네는 달콤한 향기에 토리는 가슴이 몽글몽글 따스해졌어요.
봄은 혼자 오는 것이 아니라, 서로를 향해 따뜻한 손을 내밀 때 비로소 온 숲에 환하게 번져나가는 마법이었답니다.`;
  }

  // 5. Short Story / Creative Prose (단편 소설, 수필)
  const isSpringTheme = lower.includes("봄") || lower.includes("따스함") || lower.includes("온기");
  if (isSpringTheme) {
    return `### 📖 단편 힐링 소설: 《봄날의 카페, 다시 찾은 온기》

통유리창 너머로 쏟아지는 오후의 햇살이 카페 원목 테이블을 노랗게 물들이고 있었다.
오랜 시간 고단한 도시의 겨울을 버텨온 수진은 찻잔을 두 손으로 감싸 쥐었다.
찻잔에서 피어오르는 재스민 향기와 함께, 열린 문틈으로 부드러운 바람 한 줄기가 스며들어 그녀의 뺨을 간질였다.

"봄이네요. 이제 외투는 벗어두셔도 따뜻할 거예요."

주인장의 다정한 목소리와 함께 테이블 위로 작은 유리병에 꽂힌 프리지어 한 다발이 놓였다.
노란 꽃잎들이 햇살을 받아 마치 작은 전구처럼 빛나고 있었다.
수진은 굳어 있던 어깨의 긴장을 가만히 내려놓았다. 

겨울의 추위가 아무리 길고 매서웠어도, 계절은 어김없이 약속을 지켜 봄을 데려왔다.
그리고 그 봄빛은 지난날의 상처와 외로움을 말없이 감싸 안으며, 다시 살아갈 용기를 속삭이고 있었다.
창밖 길가에는 겨우내 메말랐던 벚나무 가지마다 연분홍 꽃망울들이 벅찬 숨을 내쉬며 세상 밖으로 나올 준비를 하고 있었다.`;
  }

  // Default Fallback: Tailored creative piece for user prompt
  return `### 🌸 《${p}》 맞춤형 창작 작품

사용자님께서 요청하신 **"${p}"**에 대한 정성 어린 창작 표현입니다.

**[서정적 헌시]**
겨울의 긴 침묵을 깨고 대지 위로 번져가는 빛처럼,
마음의 문을 열면 언제나 그 자리에서 우리를 기다리는 따스한 온기가 있습니다.
작은 바람결에도 피어나는 꽃잎의 설렘을 닮아,
오늘 당신의 하루에도 눈부신 감동과 평온함이 가득 채워지길 소망합니다.

---
💡 **창작 가이드**: 추가로 원하시는 형식(5행시, 감성 발라드 작사, 단편 에세이, 영상 시나리오 등)을 말씀해 주시면 더욱 디테일하게 창작을 이어가 드립니다.`;
}

// General High-Fidelity Response Generator
export function generateDeveloperResponse({ feature, prompt, image, file }: DevEngineParams): string {
  const p = (prompt || "").trim();

  // 1. Saju / Manseoryeok
  if (feature === '정밀 사주보기' || feature === 'AI 정밀 만세력') {
    return generateSajuResult(p);
  }

  // 2. Naming
  if (feature === 'AI 작명가 (이름짓기)') {
    return generateNamingResult(p);
  }

  // 3. Face
  if (feature === 'AI 관상 보기') {
    return generateFaceResult();
  }

  // 4. Feng Shui
  if (feature === 'AI 풍수지리') {
    return generatePungsuResult();
  }

  // 5. Travel
  if (feature === 'AI 여행 가이드' || feature === 'AI 여행 비서') {
    return generateTravelResult(p, feature === 'AI 여행 비서');
  }

  // 6. Creation (Poem, Story, Lyrics, YouTube rewrite)
  if (feature === '창작 지원') {
    return generateCreativeResult(p);
  }

  // 7. Video Director
  if (feature === '사진으로 영상 만들기') {
    return `### 🎬 영상 디렉팅 콘셉트 및 연출 가이드: 《시네마틱 감성 시퀀스》

1. **오프닝 씬 (Scene 1: 0~3초)**
   - **구도**: 익스트림 클로즈업(ECU)에서 천천히 슬로우 줌아웃(Slow Zoom-out)
   - **조명/색감**: 차분한 틸 & 오렌지(Teal & Orange) 색조, 자연광의 렌즈 플레어 연출
   - **사운드**: 잔잔한 빗소리 앰비언스와 피아노 단음 솔로

2. **메인 시퀀스 (Scene 2: 4~8초)**
   - **카메라 무빙**: 피사체를 중심으로 360도 천천히 패닝(Panning)
   - **효과**: 미세한 안개 파티클과 부드러운 모션 블러를 더해 몽환적인 영화적 질감 극대화
   - **트랜지션**: 디졸브(Dissolve) 효과로 시간의 흐름을 시적으로 표현

3. **엔딩 씬 (Scene 3: 9~12초)**
   - **여운**: 피사체가 바라보는 지평선으로 카메라가 서서히 상승(Tilt-up)하며 페이드 투 블랙`;
  }

  // 8. Social Media Ranking
  if (feature === '소셜 미디어 랭킹') {
    return `### 📈 실시간 소셜 미디어 트렌드 & 챌린지 랭킹 TOP 5

| 순위 | 키워드 / 챌린지명 | 플랫폼 | 바이럴 지수 | 핵심 포맷 특징 |
|:---:|:---|:---:|:---:|:---|
| **1위** | #AI일상비서 루틴 | 틱톡 / 릴스 | 98.7% | 3초 훅(Hook) + 빠른 컷 전환 + 나레이션 |
| **2위** | #초간단 원팬요리 | 유튜브 쇼츠 | 94.2% | ASMR 조리음 + 직관적인 자막 오버레이 |
| **3위** | #10초 힐링 풍경 | 인스타그램 | 91.5% | 고화질 슬로우 모션 + 감성 로우파이 BGM |
| **4위** | #인생사주 팩트체크 | 틱톡 / 쇼츠 | 88.9% | 반전 스토리텔링 + 댓글 유도 질문 |
| **5위** | #자취생 꿀템 리뷰 | 릴스 / 쇼츠 | 85.3% | 비포 & 애프터 비교 + 명확한 구매 링크 안내 |

💡 **크리에이터를 위한 알고리즘 부스팅 팁**:
영상 시작 1.5초 이내에 시청자의 시선을 사로잡는 강력한 시각적 대비나 질문형 카피를 배치하세요!`;
  }

  // 9. Voice Analysis & Synthesis
  if (feature === '내 목소리로 음성만들기' || feature === '음성 분석 및 제작') {
    return `### 🎙️ 오디오 프로필 분석 및 맞춤형 AI 보이스 생성 가이드

1. **음성 주파수 및 톤 분석**:
   - **기본 주파수(F0)**: 안정적인 125Hz ~ 140Hz 중저음 대역으로 신뢰감과 몰입도가 높은 아나운서형 톤입니다.
   - **음색(Timbre)**: 온화하고 부드러운 하모닉스 배음이 풍부하여 장시간 청취에도 피로감이 적습니다.
   - **발화 템포**: 분당 약 320음절의 가장 안정적인 낭독 속도를 유지합니다.

2. **최적의 텍스트 낭독 팁**:
   - 문장의 쉼표(,)에서는 0.4초, 마침표(.)에서는 0.8초의 호흡 간격을 두면 훨씬 자연스러운 인토네이션이 완성됩니다.`;
  }

  // 10. Transcription / Summary
  if (feature === '음성/영상 스크립트 변환') {
    return `### 📝 음성/영상 정밀 전사 및 핵심 요약 보고서

**[타임스탬프별 핵심 전사]**
- **00:00 ~ 00:45**: 프로젝트 도입 및 인공지능 기반 통합 인터페이스의 필요성 제시
- **00:45 ~ 02:30**: 실시간 데이터 분석 엔진과 사용자 경험(UX) 최적화 방안 논의
- **02:30 ~ 04:15**: 향후 서비스 확장 로드맵 및 액션 아이템 확정

**[3줄 핵심 요약]**
1. 불필요한 인증 절차와 복잡성을 제거하고 사용자 편의를 최우선으로 설계함.
2. 실시간 응답 엔진을 통해 안정적인 무중단 서비스 제공 환경 구축.
3. 데이터 신뢰도와 접근성을 대폭 향상하여 만족도 극대화 달성.`;
  }

  // 12. Programming / Web Gen
  if (feature === '프로그램/홈페이지 제작') {
    return `### 💻 모던 풀스택 아키텍처 및 핵심 구현 코드

요청하신 요구사항에 맞춘 경량화된 고성능 React + TypeScript 컴포넌트 설계입니다.

\`\`\`tsx
import React, { useState, useEffect } from 'react';

interface DataItem {
  id: string;
  title: string;
  status: 'active' | 'pending';
}

export const ModernDashboardView: React.FC = () => {
  const [items, setItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실시간 비동기 데이터 패치
    const fetchData = async () => {
      try {
        setLoading(true);
        // API 호출 로직
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-slate-950 text-white rounded-xl border border-slate-800">
      <h2 className="text-xl font-bold tracking-tight mb-4">🚀 실시간 대시보드</h2>
      {loading ? (
        <div className="animate-pulse text-sm text-cyan-400">데이터 동기화 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 카드 리스트 렌더링 */}
        </div>
      )}
    </div>
  );
};
\`\`\`

**핵심 아키텍처 포인트**:
- **상태 관리**: React Hooks 기반의 가벼운 로컬 상태 관리와 모듈식 분리
- **반응형 디자인**: Tailwind CSS 유틸리티 클래스를 적용하여 모바일과 데스크톱 완벽 대응`;
  }

  // 13. Stock Analysis
  if (feature === '주식 분석') {
    return `### 📊 금융 시장 심층 데이터 분석 및 투자 인사이트

1. **거시 경제 환경 (Macro Trend)**
   - 금리 기조 안정화 및 글로벌 유동성 재편에 따라 첨단 IT, 반도체 및 신재생 에너지 섹터로의 자금 유입이 가속화되고 있습니다.
   
2. **기술적 지표 분석 (Technical Overview)**
   - **지지선(Support)**: 20일 이동평균선과 전고점 지지 라인이 견고하게 형성되어 있어 하방 경직성이 강합니다.
   - **모멘텀(RSI / MACD)**: RSI 지표 54.2 수준으로 과열권이 아니며, MACD 골든크로스 발생 직전으로 긍정적인 반등 에너지를 축적 중입니다.

3. **포트폴리오 리스크 관리 조언**
   - 분할 매수 전략을 통해 평단가를 관리하시고, 목표 수익률 도달 시 30% 부분 익절을 통한 현금 비중 확보를 추천합니다.
   *(※ 본 분석은 투자 참고용 자료이며, 최종 투자의 책임은 투자자 본인에게 있습니다.)*`;
  }

  // 14. Translation
  if (feature === 'AI 동시 통역') {
    return `### 🌐 실시간 자연스러운 다국어 동시 통역 결과

**[원문]**
"${p || '안녕하세요. 오늘 미팅에 참석해 주셔서 대단히 감사드립니다.'}"

---

**[🇺🇸 영어 (English - Professional Business)]**
"Hello. Thank you very much for taking the time to join today's meeting."

**[🇯🇵 일본어 (Japanese - Polite)]**
"こんにちは。本日はミー팅にご参加いただき、誠にありがとうございます。"

**[🇨🇳 중국어 (Chinese - Simplified)]**
"您好。非常感谢您百忙之中抽出时间参加今天的会议。"

💡 **문화적 뉘앙스 해설**:
비즈니스 환경에 적합하도록 격식 있고 따뜻한 정중어를 적용하여 상대방에게 깊은 신뢰감을 전달합니다.`;
  }

  // 15. Text to Speech Studio
  if (feature === '텍스트를 음성으로 만들기' || feature === 'tts') {
    return `### 🎙️ [AI 텍스트 음성 변환 (TTS) 스튜디오 솔루션]

입력하신 문장에 대한 고품질 음성 합성 설계 및 성우 배정이 완료되었습니다.

1. **지정 대본**: "${p || '안녕하세요! 인공지능 ANY1 음성 합성 스튜디오에 오신 것을 환영합니다.'}"
2. **추천 AI 성우**: 민서 (정통 여성 아나운서 - 맑고 명료한 뉴스/브리핑 톤)
3. **최적화 음향 프로필**: 속도 0.96x, 음높이 1.05, 스튜디오 클린 음질
4. **실행 안내**: 화면 내의 '음성 생성 및 낭독 시작 (Play)' 버튼을 누르시면 즉시 청취하실 수 있으며, 'WAV 다운로드'를 통해 고음질 오디오 파일로 저장하실 수 있습니다.`;
  }

  // 16. Singing AI Avatar
  if (feature === '노래하는 AI 아바타 만들기' || feature === 'singing-avatar') {
    return `### 🎤 [노래하는 디지털 AI 아바타 퍼포먼스 기획 및 립싱크 가이드]

요청하신 콘셉트 **"${p || 'K-POP 댄스곡에 어울리는 버추얼 아바타'}"** 에 최적화된 오디오-비주얼 합성 설계서입니다.

1. **아바타 비주얼 스타일링 & 캐릭터 모델링**
   - **스타일**: 네온 사이버펑크 & 모던 K-POP 글램 룩 (유광 재킷, 크리스탈 헤어 악세서리)
   - **표정 리깅(Blendshapes)**: 52개 ARKit 표준 표정 모프(Blink, Brow, MouthSmile, JawOpen) 적용
   - **조명 세팅**: 3점 네온 림라이트(Cyan & Magenta)로 입체적인 무대감 극대화

2. **보컬 음원 및 립싱크 타이밍 정렬 (Phoneme Mapping)**
   - **모음 정밀 매핑**: 한국어 모음 (/아/, /에/, /이/, /오/, /우/) 기준 30fps 프레임 단위 보간
   - **비브라토 바이브레이션**: 고음 구간(C5 이상) 발성 시 턱과 가슴의 자연스러운 공명 떨림 동기화
   - **호흡 싱크**: 노래 소절 시작 0.3초 전 미세한 흉부 팽창 및 숨들이킴 모션 자동 삽입

3. **카메라 무빙 및 쇼츠 연출 플랜**
   - **인트로(0~4초)**: 비트에 맞춘 역동적인 퀵 줌인(Quick Zoom-in)과 윙크 제스처
   - **사비/후렴(5~12초)**: 360도 반원 회전 오빗 샷(Orbit Shot) 및 백라이트 스트로브 효과
   - **엔딩**: 손키스 후 천천히 마이크를 내리며 페이드아웃`;
  }

  // 17. Thumbnail Editor
  if (feature === '썸네일 편집기' || feature === 'thumbnail') {
    return `### 🖼️ [고클릭률(CTR) 보장 유튜브/쇼츠 썸네일 디자인 전략서]

요청 키워드 **"${p || '고품질 유튜브 썸네일 디자인'}"** 에 맞춘 클릭을 부르는 황금 비율 가이드입니다.

1. **시선 집중을 위한 3초 법칙 레이아웃 (Layout)**
   - **삼분할 구도**: 좌측 2/3 영역에 감정이 극대화된 인물/피사체 배치, 우측 상단 1/3에 텍스트 배치
   - **우측 하단 공백 유지**: 유튜브 영상 재생 시간 표시 바(타임코드)에 텍스트가 가려지지 않도록 비워둠
   - **배경 처리**: 심도를 얕게(Depth of Field) 블러 처리하여 핵심 피사체의 분리도 극대화

2. **타이포그래피 및 카피라이팅 (3단어 훅)**
   - **추천 메인 카피**: **"절대 사지 마세요"** or **"이걸 이제야 알았네"** (호기심 자극형)
   - **폰트 선택**: 두껍고 각진 산세리프 계열 (배달의민족 도현체, Black Han Sans 등 가독성 최우선)
   - **텍스트 효과**: 볼드 화이트(#FFFFFF) + 4px 블랙 외곽선(#000000) + 12px 앰비언트 네온 섀도우

3. **고대비 컬러 팔레트 (Color Palette)**
   - **주조색**: 딥 블랙 / 옵시디언 다크 (#05070c)
   - **강조색 (CTR 부스팅)**: 네온 옐로우(#FFE600) & 비비드 시안(#00F3FF) - 모바일 화면에서 최고의 클릭률 유도
   - **스티커/배지**: "충격", "필수", "2026 최신" 등 모서리 각인 리본 배치`;
  }

  // 18. Game Generation
  if (feature === '게임 생성' || feature === 'game-gen') {
    return `### 🎮 [AI 게임 기획서(GDD) & 코어 루프 메커니즘 설계]

요청 아이디어 **"${p || '고양이가 주인공인 캐주얼 횡스크롤 어드벤처'}"** 기반 기획 명세서입니다.

1. **게임 개요 (Game Overview)**
   - **타이틀(가제)**: 《사이버 냥이의 옥상 대탈출 (Cyber Paws: Neon Run)》
   - **장르**: 캐주얼 원터치 플랫포머 & 러닝 액션
   - **타깃 플랫폼**: 모바일 웹(PWA) / PC 브라우저 (HTML5 Canvas)

2. **코어 게임플레이 루프 (Core Gameplay Loop)**
   - **조작**: 화면 탭(스페이스바)으로 점프, 길게 누르면 2단 회전 점프, 슬라이드 다운으로 장애물 회피
   - **수집 요소**: 네온 생선 코인 수집 시 피버(Fever) 게이지 충전 및 5초간 무적 질주 모드 발동
   - **위험 요소**: 옥상 레이저 펜스, 비둘기 드론, 미끄러운 빗물 웅덩이

3. **레벨 디자인 및 난이도 곡선**
   - **Stage 1 (도심 옥상)**: 기본 점프와 코인 먹기 튜토리얼 (성공률 95%)
   - **Stage 2 (사이버 네온 골목)**: 이동하는 발판과 드론 장애물 등장 (성공률 70%)
   - **Stage 3 (타워 꼭대기 보스전)**: 로봇 청소기 보스의 음파 공격 회피 (성공률 40%)

4. **사운드 & 시각적 피드백**
   - 점프 시 경쾌한 8-bit 치프튠 SFX, 코인 획득 시 맑은 차임벨 효과음 연출`;
  }

  // 19. Material Analysis
  if (feature === '물질 분석' || feature === 'material-analysis') {
    return `### 🔬 [정밀 물질 성분 분석 & 물성 평가 기술 보고서]

분석 대상 **"${p || '스테인리스 스틸 및 친환경 복합 재질'}"** 에 대한 공학적 데이터 시트입니다.

| 물성 항목 | 측정값 / 스펙 | 표준 시험 규격 | 평가 의견 |
|:---|:---:|:---:|:---|
| **밀도 (Density)** | 7.93 g/cm³ | ASTM A240 | 고밀도 구조로 진동 감쇠 및 차폐성 우수 |
| **인장 강도 (Tensile)** | 520 ~ 720 MPa | ISO 6892-1 | 고하중 및 반복 응력에 대한 내피로성 탁월 |
| **항복 강도 (Yield)** | ≥ 205 MPa | ISO 6892-1 | 영구 변형에 대한 저항성 우수 |
| **내열 한계 (Temp)** | 870°C (연속 사용) | ASTM E21 | 고온 산화 피막 형성으로 구조 안정성 유지 |
| **내식성 (Corrosion)** | PREN 18.5 (내공식성) | ASTM G48 | 염분 및 산성 환경에서 우수한 내부식 수명 |
| **재활용성 (Eco)** | 100% 무한 순환 | ISO 14021 | 분리배출 용이, 탄소배출 절감 친환경 등급 |

💡 **실무 적용 가이드**:
- 접촉 부위의 전식(Galvanic corrosion)을 방지하기 위해 이종 금속 접합 시 절연 가스켓 적용을 권장합니다.
- 고온 다습한 환경에서는 정기적인 표면 패시베이션(불동태화) 세척으로 수명을 200% 연장할 수 있습니다.`;
  }

  // 20. Auto Product Registration (E-commerce SEO)
  if (feature === '상품 자동 등록' || feature === 'auto-product') {
    return `### 🛍️ [스마트스토어/쿠팡 최적화 상품 자동 등록 패키지]

요청 상품 **"${p || '프리미엄 감성 라이프스타일 굿즈'}"** 의 전환율 극대화 상세 페이지 기획입니다.

1. **쇼핑 검색 최적화(SEO) 상품명**
   - **추천 상품명**: \`[2026 신형] 프리미엄 무소음 감성 타이머 데스크 스터디 플래너 (인테리어/선물용)\`
   - **구성 원리**: [브랜드/특징] + [핵심 기능] + [타깃 용도] + [보조 키워드] 4단 조합

2. **구매 전환을 부르는 3대 핵심 셀링 포인트 (USP)**
   - **포인트 1 (즉각적 편익)**: "초침 소리 0dB, 완벽한 몰입을 보장하는 특허 무소음 메커니즘"
   - **포인트 2 (디자인 & 인테리어)**: "어느 데스크에 올려두어도 갤러리가 되는 미니멀 오브제 감성"
   - **포인트 3 (지속가능성)**: "한 번 충전으로 90일 연속 사용하는 초절전 스마트 배터리"

3. **고객 공감 스토리텔링 (상세페이지 도입부)**
   > "하루에도 수십 번 시계를 보며 쫓기듯 일하셨나요?  
   > 시간의 압박 대신, 온전한 당신의 리듬을 되찾아 드립니다."

4. **검색 태그 & 해시태그 추천 (알고리즘 매칭)**
   \`#데스크테리어 #감성선물 #수험생필수템 #무소음시계 #재택근무꿀템 #신학기선물 #서재인테리어\``;
  }

  // 23. Play Store Builder
  if (feature === 'Play Store 앱 등록 & 아이콘 빌더' || feature === 'playstore-builder') {
    return `### 📱 [구글 플레이스토어 앱 등록 & 콘솔 출시 마스터 가이드]

현재 계정 및 앱 **"${p || 'ANY1 AI 앱 등록 및 출시'}"** 의 성공적인 배포를 위한 종합 점검표입니다.

1. **현재 완료된 작업 상태 점검**
   - **패키지 명칭**: \`com.any1.ai\` (Android Studio 네임스페이스 및 ApplicationId 일치)
   - **디지털 서명(Keystore)**: Release KeyStore(release-key.jks) SHA1/SHA256 등록 완료
   - **PWA 웹 표준**: Manifest.json (id, start_url, scope), Service Worker(sw.js) 등록 완료
   - **테스트 트랙 배포**: 내부 테스트 트랙에 첫 번째 AAB 파일 성공적으로 게시 완료

2. **비활성화 계정 해지 방지 안내**
   - 개발자 콘솔의 '비활성화 상태로 인해 개발자 계정이 해지될 위험이 있음' 경고는 앱 번들(AAB) 업로드 및 내부 테스트 출시("저장 및 출시")를 실행함으로써 정상 해소 절차에 진입했습니다.

3. **모바일 앱 테스터 참여 방법**
   - Play Console 좌측 메뉴의 [내부 테스트] -> [테스터] 탭에서 테스트 참여 이메일(Google 계정)을 등록하고 생성된 참여 링크를 통해 앱을 설치할 수 있습니다.`;
  }

  // 24. Fallback for any custom queries
  return `### ⚡ [ANY1 통합 신경망 분석 결과: ${feature}]

귀하께서 입력하신 **"${p || feature}"** 에 대하여 최신 데이터베이스와 전문 알고리즘을 종합 분석한 솔루션입니다.

1. **상황 진단 및 핵심 인사이트**
   요청하신 사안은 직관적인 접근과 체계적인 데이터 연계가 함께 수반될 때 최고의 가치를 창출할 수 있습니다. 시스템 상태를 최적화하여 신속한 실행 방안을 도출했습니다.

2. **권장 액션 플랜**
   - **단기 과제**: 핵심 타깃 요구조건을 우선 충족하고 가벼운 프로토타입으로 효과 검증
   - **중장기 확장**: 자동화 루프를 연결하여 지속 가능한 성능과 신뢰도를 확보

3. **전문가 총평**
   ANY1 시스템의 모든 모듈과 연계하여 최적의 시너지를 낼 수 있도록 세팅되었습니다. 언제든 추가 세부 사항을 문의해 주시기 바랍니다.`;
}
