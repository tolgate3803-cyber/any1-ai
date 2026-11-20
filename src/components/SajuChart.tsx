import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, BookOpen, Activity, Award, Flame, Droplets, Trees, ArrowRight, Layers, HelpCircle } from 'lucide-react';

interface HiddenStemDetail {
  stem: string;
  days: number;
  role: string;
}

interface Pillar {
  label: string; // 시주, 일주, 월주, 년주
  heavenlyStem: string;
  heavenlyStemTenGod: string;
  earthlyBranch: string;
  earthlyBranchTenGod: string;
  hiddenStems?: string[];
  hiddenStemsDetailed?: HiddenStemDetail[];
  twelveUnseong?: string;
  yearShinsal?: string;
  dayShinsal?: string;
  napeum?: string;
}

interface SeunItem {
  year: number;
  age: number;
  heavenlyStem: string;
  heavenlyStemTenGod?: string;
  earthlyBranch: string;
  earthlyBranchTenGod?: string;
  twelveUnseong?: string;
  yearShinsal?: string;
  isCurrentYear?: boolean;
}

interface DaeunCycle {
  age: number;
  startYear?: number;
  heavenlyStem: string;
  heavenlyStemTenGod?: string;
  earthlyBranch: string;
  earthlyBranchTenGod?: string;
  twelveUnseong?: string;
  yearShinsal?: string;
  dayShinsal?: string;
  isActive?: boolean;
  seunList?: SeunItem[];
}

interface ShinsalMapping {
  pillar: string;
  shinsal: string[];
}

interface SajuData {
  profile?: {
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    birthHour?: number;
    birthMinute?: number;
    isSolar?: boolean;
    isMale?: boolean;
    koreanAge?: number;
    westernAge?: number;
    solarDate?: string;
    lunarDate?: string;
    standardTimeCorrection?: string;
    summerTimeApplied?: boolean;
  };
  gongmang?: {
    yearGongmang?: { hanja: string; korean: string };
    dayGongmang?: { hanja: string; korean: string };
  };
  pillars: Pillar[];
  elements?: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  daeunStartAge?: number;
  daeunList?: DaeunCycle[];
  sajuShinsalList?: ShinsalMapping[];
}

// Full 12 Shinsal Database with highly descriptive meanings & pillar-specific interpretations
const SHINSAL_DB: Record<string, {
  chinese: string;
  meaning: string;
  description: string;
  advice: string;
  yearInterpret: string;
  monthInterpret: string;
  dayInterpret: string;
  hourInterpret: string;
}> = {
  "지살": {
    chinese: "地煞",
    meaning: "스스로 대지를 개척하고 움직이는 주도적인 이동",
    description: "스스로 행동하여 삶의 무대를 개척하고 변화를 이끄는 능동적인 대이동을 뜻합니다. 수동적으로 끌려다니는 이동이 아닌, 유학, 이사, 창업, 신규 사업 추진 등 내 의지로 시작되는 긍정적 변화의 흐름을 상징합니다.",
    advice: "자신감을 가지고 새로운 환경에 적응하세요. 선제적인 움직임이 행운을 부릅니다.",
    yearInterpret: "조상의 터전을 떠나 새로운 곳에서 자립하고 가문의 개척자 역할을 하게 됩니다.",
    monthInterpret: "부모형제의 그늘에서 벗어나 일찍 자립하여 독창적인 직업 영역을 구축합니다.",
    dayInterpret: "일생 주거지 변동이나 사업차 해외/지방 출장이 빈번하고 분주하게 활동하며 발전합니다.",
    hourInterpret: "해외 비즈니스, 다국적 업무 등 먼 곳과의 인연을 통해 노년에 풍요롭고 독자적인 성과를 이룹니다."
  },
  "도화살": {
    chinese: "桃花煞 / 年煞",
    meaning: "사람을 끌어당기는 자석 같은 인기와 치명적인 매력",
    description: "대중의 마음을 홀리고 시선과 관심을 한 몸에 받는 매혹의 기운입니다. 현대 사주학에서는 방송, 연예, 영업, 마케팅, 문화 예술 분야에서 큰 주목을 받고 성공하는 강력한 스타성과 대인관계 능력을 의미합니다.",
    advice: "나의 개성과 장점을 숨기지 말고 드러내어 브랜딩하세요. 단, 구설수를 조심해야 합니다.",
    yearInterpret: "조상 대에 명망 높은 예술가나 주위 사람들에게 인기가 출중했던 어른이 계셨음을 뜻합니다.",
    monthInterpret: "사교성이 대단히 뛰어나며, 직장이나 사회 모임에서 늘 중심적인 역할을 맡아 빠르게 출세합니다.",
    dayInterpret: "본인 혹은 배우자의 매력이 치명적이고 감각이 세련되었으며 이성에게 많은 인기를 얻습니다.",
    hourInterpret: "나이가 들수록 중후하고 우아한 멋이 더해져, 노년기에도 대중적 활동이나 존경을 유지합니다."
  },
  "월살": {
    chinese: "月煞",
    meaning: "어두운 밤하늘에 길을 비추는 등불 같은 보상과 지혜",
    description: "고난과 어둠의 상황 속에서 보름달처럼 등불이 비치는 기운입니다. 타인의 상속, 위자료, 증여 또는 어려운 상황 극복 후의 대반전과 같은 의외의 소득을 상징하는 길살로 보기도 합니다.",
    advice: "어려운 시기라도 좌절하지 마세요. 반드시 생각지도 못한 조력자와 보상이 찾아옵니다.",
    yearInterpret: "가문의 굴곡 속에서 홀로 우뚝 서 조상의 유산이나 은덕을 이어받게 됩니다.",
    monthInterpret: "부모형제 덕은 다소 부족할 수 있으나, 위기 극복 과정에서 스스로 단단해져 기적적인 성공을 거둡니다.",
    dayInterpret: "배우자의 남모를 조력이나 비밀스러운 자금 회전을 통해 삶의 위기를 슬기롭게 극복합니다.",
    hourInterpret: "자녀 대에 뛰어난 기략으로 가문을 일으키고, 본인은 종교나 철학적 깊이를 더해 평안히 삽니다."
  },
  "망신살": {
    chinese: "亡身煞",
    meaning: "속살을 드러내어 세상에 가치를 과감히 외치는 도약",
    description: "글자 자체는 망신(亡身)이라 하여 나쁜 뜻으로 오해하기 쉬우나, 실제로는 자신의 실력과 본모습을 숨김없이 노출하여 한 단계 도약함을 뜻합니다. 연애운의 폭발적인 상승, 대중 앞에 나서는 강연, 쇼케이스 등을 상징합니다.",
    advice: "부끄러워하지 말고 나의 날것 그대로의 실력을 당당하게 고백하고 보여주세요. 큰 기회가 열립니다.",
    yearInterpret: "젊은 시절 일찍이 대담하게 재능을 뽐내 세상의 조명을 받고 이름을 알립니다.",
    monthInterpret: "소탈하고 대범한 호걸 성격으로 위선이 없고 솔직하여 주위에 늘 사람이 붐빕니다.",
    dayInterpret: "부부 사이에 솔직담백한 대화가 무기이며, 결혼을 기점으로 사회적 발언권과 인지도가 커집니다.",
    hourInterpret: "거침없는 성품으로 말년에도 활발히 대외 활동을 하며 사회에 굵직한 인상을 남깁니다."
  },
  "장성살": {
    chinese: "將星煞",
    meaning: "장수처럼 깃발을 꽂고 조직을 지배하는 강력한 권위",
    description: "장수가 군대를 호령하듯 강력한 주도권, 카리스마, 불굴의 자존심을 상징합니다. 어느 직장에 가든 최정상의 자리나 리더 역할을 부여받게 되며, 주관이 뚜렷하여 어떠한 역경도 굴하지 않고 뚫고 나가는 기운입니다.",
    advice: "강한 카리스마에 걸맞은 포용력을 기르세요. 남을 안아줄 때 진정한 장수가 됩니다.",
    yearInterpret: "가문에서 중심 인물이 되어 가계를 지탱하고 명예를 크게 드높이는 기둥 역할을 합니다.",
    monthInterpret: "사회적 지위가 높고 권력 기관이나 대기업 등에서 독보적인 실력자로 활약하며 승진이 빠릅니다.",
    dayInterpret: "고집과 자존심이 매우 강해 자수성가 타입이며, 뚝심 있는 기획력으로 명예를 쟁취합니다.",
    hourInterpret: "확고한 위치를 선점하여 자식들의 존경을 받으며, 말년에도 막강한 사회적 리더십을 행사합니다."
  },
  "반안살": {
    chinese: "攀鞍煞",
    meaning: "말의 황금 안장에 올라앉은 편안한 출세와 복록",
    description: "말 등에 얹은 편안한 안장에 올라탔다는 뜻으로, 인생에서 대단히 안정되고 윤택한 고지를 점함을 뜻합니다. 국가 공인 시험 자격 합격, 고위직 승진, 안락한 저택 마련 등 품위 있고 윤택한 삶의 흐름을 상징합니다.",
    advice: "안정적인 흐름을 유지하되 방심하지 말고 내실을 다지세요. 인생 황금기를 만끽하기 좋습니다.",
    yearInterpret: "품위 있고 유복한 조상 혹은 훌륭한 학문적 집안에서 태어나 좋은 배경을 지닙니다.",
    monthInterpret: "직장에서 고속 승진하고 상사의 신임을 독차지하며, 실리와 명예를 모두 챙기는 영리함을 발휘합니다.",
    dayInterpret: "귀인 같은 배우자와 인연이 깊고 부부 생활이 지극히 안락하며 평탄하게 재물을 축적합니다.",
    hourInterpret: "효심 깊은 훌륭한 자식을 두게 되며, 의식주가 풍부하고 걱정이 전혀 없는 고귀한 노후를 보냅니다."
  },
  "역마살": {
    chinese: "驛馬煞",
    meaning: "세계를 종횡무진 누비며 가치를 전달하는 정보와 교통",
    description: "대표적인 대중의 살로, 넓은 활동 범위를 통해 재물을 얻고 성장하는 에너지를 의미합니다. 현대 사주학에서는 무역, 외교, 항공, 인터넷 정보망 구축, 전국적인 출장 및 해외 이민 등 글로벌 네트워크를 상징하는 강력한 성공 인자입니다.",
    advice: "한 곳에 머무르려 하지 말고 적극적으로 활동 범위를 넓히세요. 움직이는 만큼 엄청난 재물이 들어옵니다.",
    yearInterpret: "조상 대에 타향이나 해외로 이주했거나, 본인이 어려서부터 역동적인 삶을 살았음을 보여줍니다.",
    monthInterpret: "고향을 일찍 떠나 해외 유학이나 무역, 글로벌 업무 등 다채로운 변화가 많은 직업을 갖습니다.",
    dayInterpret: "부부 동반 출장이나 주말 부부 등으로 바쁘게 활동하며, 서로 독립적인 영역을 주어 존중할 때 더욱 번창합니다.",
    hourInterpret: "노년에도 쉼 없이 세계 곳곳을 여행하며 활력 넘치는 비즈니스를 전개하는 열정적인 말년입니다."
  },
  "육해살": {
    chinese: "六害煞",
    meaning: "보이지 않는 여섯 가지 수호천사의 영감과 예리한 직관",
    description: "글자의 액면가와 달리, 직관력과 영감, 제6감이 기가 막히게 발달한 상태를 뜻합니다. 위기 상황을 사전에 감지하는 신비로운 통찰력, 종교, 명상, 철학, 심리학적 자질이 매우 뛰어나 정신적 지도자로 거듭나게 합니다.",
    advice: "자신의 직감을 믿으세요. 남을 돕는 정신적 멘토링 활동을 하면 액운이 사라지고 큰 복이 들어옵니다.",
    yearInterpret: "조상의 보살핌이나 영적인 복덕이 있어, 위기 상황마다 극적인 도움을 받아 살아납니다.",
    monthInterpret: "총명함이 뛰어나며 사물의 본질을 단박에 꿰뚫어 보는 안목이 있어 지략가로 통합니다.",
    dayInterpret: "배우자와 깊은 정신적 유대감을 교류하며, 예술과 학술, 마음 공부에 탁월한 소질이 있습니다.",
    hourInterpret: "노년에 영적으로 극도로 성숙하며, 종교, 철학, 힐링 분야에서 수많은 이들의 고민을 풀어줍니다."
  },
  "화개살": {
    chinese: "華蓋煞",
    meaning: "빛나는 재능을 잠시 덮고 고독 속에서 꽃피우는 진리",
    description: "화려함을 덮는다는 뜻으로, 예술, 문학, 사색, 종교적 깊이를 극대화하는 성취의 기운입니다. 고독 속에서 엄청난 창의력과 예술성, 깊은 학문을 완성함을 의미하며 종교인, 학자, 고위 예술가들에게 필수적인 매력적인 살입니다.",
    advice: "고독을 외로움으로 여기지 말고, 나만의 독보적인 재능을 연마하는 창조의 시간으로 승화하세요.",
    yearInterpret: "가문에 깊은 학식이나 종교적 가치를 지닌 어른이 계셔, 학문적 DNA를 물려받았음을 보여줍니다.",
    monthInterpret: "머리가 비상하고 총명하며 문장력이 뛰어나고, 교육자, 연구원 또는 심오한 예술 분야에서 대성합니다.",
    dayInterpret: "자기 성찰 능력이 대단히 깊고 고고한 품격을 유지하며, 명예와 깊은 영혼의 자유를 갈구합니다.",
    hourInterpret: "학술 연구나 예술 창작의 정점을 찍고 자식들에게 크나큰 지혜의 유산을 물려주는 기품 있는 말년을 맞습니다."
  },
  "겁살": {
    chinese: "劫煞",
    meaning: "위기를 기회로 바꾸는 폭발적인 승부욕과 터닝포인트",
    description: "경쟁이 극도로 치열한 무대에서 무언가를 강하게 쟁취하려는 승부 근성을 의미합니다. 스포츠맨, 펀드매니저, 고난도 기술 엔지니어에게 자주 나타나며, 빼앗길 위험 속에서 남들보다 한 발 앞서 성공을 선점하는 원동력입니다.",
    advice: "과도한 욕심을 버리고 철저한 법률적 조율과 준비를 하세요. 승부사 기질을 발휘할 좋은 찬스입니다.",
    yearInterpret: "불우했던 조상의 유산을 나의 대에서 악착같은 승부욕과 노력으로 극복하여 다시 일어섭니다.",
    monthInterpret: "극도의 자립심으로 주위 동료들의 한계를 부수고 조직 내에서 혁명적인 개혁을 달성합니다.",
    dayInterpret: "자신의 주장이 지극히 강하니 배우자와 적극적인 조율이 필요하나, 사업 파트너로서의 투지가 좋습니다.",
    hourInterpret: "과감한 투자와 과단성 있는 자산 구조 변경을 통해 노년에 엄청난 재정적 반전을 맞이합니다."
  },
  "재살": {
    chinese: "災煞 / 囚獄煞",
    meaning: "감옥 속에서도 출구를 찾아내는 비상한 두뇌와 기략",
    description: "일명 수옥살이라고도 불리며, 불리한 구속 상태에서도 끝끝내 뛰어난 정보력과 꾀를 발휘하여 승리를 이끄는 명참모의 기운입니다. 위기 탈출 능력, 법률적 분쟁 차단 능력, 치밀한 브레인 전략 기획에서 탁월합니다.",
    advice: "무모한 정면 돌파 대신 지혜와 인맥, 기획을 이용한 우회 전략을 구사하세요. 지략이 최고의 무기입니다.",
    yearInterpret: "가문이 일시적인 난관을 겪었더라도, 본인이 뛰어난 영민함으로 가문의 재건을 모색합니다.",
    monthInterpret: "인생에서 한 번쯤 극적인 패배를 겪더라도, 그것을 발판 삼아 상상 이상의 고위층 참모로 영전합니다.",
    dayInterpret: "순간적인 임기응변과 대처 능력이 기막히게 뛰어나 위기를 모면하며, 남을 속이지 않고 성실히 행하면 승리합니다.",
    hourInterpret: "외부의 간섭이 전혀 없는 완벽하게 독립적인 나만의 사색 공간과 안전 자산을 확보하여 노후가 편안합니다."
  },
  "천살": {
    chinese: "天煞",
    meaning: "하늘의 섭리를 깨닫고 위대한 인물로 환골탈태하는 행운",
    description: "인간의 힘으로 저항할 수 없는 큰 하늘의 거대한 운명을 상징합니다. 하늘의 큰 복을 받기 전 거치는 성찰과 세례 같은 기간을 뜻하며, 이 살을 가진 사람은 종교, 철학, 우주학 등에 깊이 매료되어 우주의 진리를 대중에게 가르칩니다.",
    advice: "하늘의 뜻에 순응하고 겸손한 마음을 가지세요. 이타적인 마음을 쓸 때 기적 같은 축복이 쏟아집니다.",
    yearInterpret: "가문의 특별한 신념이나 가업을 그대로 수호하고 계승하는 운명적 사명을 띠고 있습니다.",
    monthInterpret: "일찍이 삶의 무상함이나 우주의 섭리를 고민하여, 젊은 나이임에도 성숙한 리더십으로 인덕을 받습니다.",
    dayInterpret: "남들이 겪지 못하는 특별한 마음 공부나 영적 각성을 경험하며, 일생 하늘의 보이지 않는 구원을 얻습니다.",
    hourInterpret: "하늘로부터 지혜와 복록을 크게 축복받아, 말년에 수많은 제자와 주위 사람들에게 가르침을 전수합니다."
  }
};

// Sexagenary cycle references for dynamic calculation
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const STEM_INFO: Record<string, { element: string; polarity: 'yang' | 'yin' }> = {
  '甲': { element: 'wood', polarity: 'yang' },
  '乙': { element: 'wood', polarity: 'yin' },
  '丙': { element: 'fire', polarity: 'yang' },
  '丁': { element: 'fire', polarity: 'yin' },
  '戊': { element: 'earth', polarity: 'yang' },
  '己': { element: 'earth', polarity: 'yin' },
  '庚': { element: 'metal', polarity: 'yang' },
  '辛': { element: 'metal', polarity: 'yin' },
  '壬': { element: 'water', polarity: 'yang' },
  '癸': { element: 'water', polarity: 'yin' }
};

const BRANCH_INFO: Record<string, { element: string; polarity: 'yang' | 'yin' }> = {
  '子': { element: 'water', polarity: 'yang' },
  '丑': { element: 'earth', polarity: 'yin' },
  '寅': { element: 'wood', polarity: 'yang' },
  '卯': { element: 'wood', polarity: 'yin' },
  '辰': { element: 'earth', polarity: 'yang' },
  '巳': { element: 'fire', polarity: 'yin' },
  '午': { element: 'fire', polarity: 'yang' },
  '未': { element: 'earth', polarity: 'yin' },
  '申': { element: 'metal', polarity: 'yang' },
  '酉': { element: 'metal', polarity: 'yin' },
  '戌': { element: 'earth', polarity: 'yang' },
  '亥': { element: 'water', polarity: 'yin' }
};

// Saju Element Info Mapping
const getCharElementInfo = (char: string) => {
  const wood = ['甲', '乙', '寅', '卯'];
  const fire = ['丙', '丁', '巳', '午'];
  const earth = ['戊', '己', '辰', '戌', '丑', '未'];
  const metal = ['庚', '辛', '申', '酉'];
  const water = ['壬', '癸', '亥', '子'];

  if (wood.includes(char)) {
    return {
      element: 'wood',
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      label: '목 (木)',
      colorHex: '#34d399',
      meaning: '성장, 창조, 자비심'
    };
  }
  if (fire.includes(char)) {
    return {
      element: 'fire',
      colorClass: 'text-rose-500',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/30',
      label: '화 (火)',
      colorHex: '#f43f5e',
      meaning: '열정, 직관, 적극성'
    };
  }
  if (earth.includes(char)) {
    return {
      element: 'earth',
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
      label: '토 (土)',
      colorHex: '#f59e0b',
      meaning: '중용, 안정, 신뢰성'
    };
  }
  if (metal.includes(char)) {
    return {
      element: 'metal',
      colorClass: 'text-slate-300',
      bgClass: 'bg-slate-500/10',
      borderClass: 'border-slate-500/20',
      label: '금 (金)',
      colorHex: '#cbd5e1',
      meaning: '결단력, 의리, 강인함'
    };
  }
  if (water.includes(char)) {
    return {
      element: 'water',
      colorClass: 'text-sky-400',
      bgClass: 'bg-sky-500/10',
      borderClass: 'border-sky-500/30',
      label: '수 (水)',
      colorHex: '#38bdf8',
      meaning: '지혜, 통찰력, 유연성'
    };
  }
  return {
    element: 'none',
    colorClass: 'text-text-light',
    bgClass: 'bg-white/5',
    borderClass: 'border-white/10',
    label: '기타',
    colorHex: '#ffffff',
    meaning: '조화'
  };
};

// Saju Ten Gods Calculator relative to Day Stem
const calculateTenGod = (dayStem: string, targetChar: string, isStem: boolean) => {
  const ds = STEM_INFO[dayStem];
  const tc = isStem ? STEM_INFO[targetChar] : BRANCH_INFO[targetChar];
  if (!ds || !tc) return '';

  const sameElement = ds.element === tc.element;
  const samePolarity = ds.polarity === tc.polarity;

  let relationship = 0;
  if (sameElement) {
    relationship = 1; // 비겁
  } else if (
    (ds.element === 'wood' && tc.element === 'fire') ||
    (ds.element === 'fire' && tc.element === 'earth') ||
    (ds.element === 'earth' && tc.element === 'metal') ||
    (ds.element === 'metal' && tc.element === 'water') ||
    (ds.element === 'water' && tc.element === 'wood')
  ) {
    relationship = 2; // 식상 (내가 생함)
  } else if (
    (ds.element === 'wood' && tc.element === 'earth') ||
    (ds.element === 'fire' && tc.element === 'metal') ||
    (ds.element === 'earth' && tc.element === 'water') ||
    (ds.element === 'metal' && tc.element === 'wood') ||
    (ds.element === 'water' && tc.element === 'fire')
  ) {
    relationship = 3; // 재성 (내가 극함)
  } else if (
    (tc.element === 'wood' && ds.element === 'earth') ||
    (tc.element === 'fire' && ds.element === 'metal') ||
    (tc.element === 'earth' && ds.element === 'water') ||
    (tc.element === 'metal' && ds.element === 'wood') ||
    (tc.element === 'water' && ds.element === 'fire')
  ) {
    relationship = 4; // 관성 (나를 극함)
  } else {
    relationship = 5; // 인성 (나를 생함)
  }

  if (relationship === 1) {
    return samePolarity ? '비견' : '겁재';
  } else if (relationship === 2) {
    return samePolarity ? '식신' : '상관';
  } else if (relationship === 3) {
    return samePolarity ? '편재' : '정재';
  } else if (relationship === 4) {
    return samePolarity ? '편관' : '정관';
  } else if (relationship === 5) {
    return samePolarity ? '편인' : '정인';
  }
  return '';
};

// Shinsal Calculator from Day Branch to Target Branch
const calculateShinsal = (dayBranch: string, targetBranch: string) => {
  const groups = [
    { members: ['申', '子', '辰'], startBranch: '申' },
    { members: ['亥', '卯', '未'], startBranch: '亥' },
    { members: ['寅', '午', '戌'], startBranch: '寅' },
    { members: ['巳', '酉', '丑'], startBranch: '巳' }
  ];

  const group = groups.find(g => g.members.includes(dayBranch)) || groups[2];
  
  const startIdx = BRANCHES.indexOf(group.startBranch);
  const targetIdx = BRANCHES.indexOf(targetBranch);
  if (startIdx === -1 || targetIdx === -1) return '화개살';

  const distance = (targetIdx - startIdx + 12) % 12;

  const shinsalList = [
    '지살',
    '도화살',
    '월살',
    '망신살',
    '장성살',
    '반안살',
    '역마살',
    '육해살',
    '화개살',
    '겁살',
    '재살',
    '천살'
  ];

  return shinsalList[distance];
};

// Authentic Wonkwang Manseoryeok 12 Unseong Table (일간 봉법)
const WONKWANG_UNSEONG: Record<string, Record<string, string>> = {
  "甲": { "亥": "장생", "子": "목욕", "丑": "관대", "寅": "건록", "卯": "제왕", "辰": "쇠", "巳": "병", "午": "사", "未": "묘", "申": "절", "酉": "태", "戌": "양" },
  "乙": { "午": "장생", "巳": "목욕", "辰": "관대", "卯": "건록", "寅": "제왕", "丑": "쇠", "子": "병", "亥": "사", "戌": "묘", "酉": "절", "申": "태", "未": "양" },
  "丙": { "寅": "장생", "卯": "목욕", "辰": "관대", "巳": "건록", "午": "제왕", "未": "쇠", "申": "병", "酉": "사", "戌": "묘", "亥": "절", "子": "태", "丑": "양" },
  "丁": { "酉": "장생", "申": "목욕", "未": "관대", "午": "건록", "巳": "제왕", "辰": "쇠", "卯": "병", "寅": "사", "丑": "묘", "子": "절", "亥": "태", "戌": "양" },
  "戊": { "寅": "장생", "卯": "목욕", "辰": "관대", "巳": "건록", "午": "제왕", "未": "쇠", "申": "병", "酉": "사", "戌": "묘", "亥": "절", "子": "태", "丑": "양" },
  "己": { "酉": "장생", "申": "목욕", "未": "관대", "午": "건록", "巳": "제왕", "辰": "쇠", "卯": "병", "寅": "사", "丑": "묘", "子": "절", "亥": "태", "戌": "양" },
  "庚": { "巳": "장생", "午": "목욕", "未": "관대", "申": "건록", "酉": "제왕", "戌": "쇠", "亥": "병", "子": "사", "丑": "묘", "寅": "절", "卯": "태", "辰": "양" },
  "辛": { "子": "장생", "亥": "목욕", "戌": "관대", "酉": "건록", "申": "제왕", "未": "쇠", "午": "병", "巳": "사", "辰": "묘", "卯": "절", "寅": "태", "丑": "양" },
  "壬": { "申": "장생", "酉": "목욕", "戌": "관대", "亥": "건록", "子": "제왕", "丑": "쇠", "寅": "병", "卯": "사", "辰": "묘", "巳": "절", "午": "태", "未": "양" },
  "癸": { "卯": "장생", "寅": "목욕", "丑": "관대", "子": "건록", "亥": "제왕", "戌": "쇠", "酉": "병", "申": "사", "未": "묘", "午": "절", "巳": "태", "辰": "양" }
};

// Authentic Wonkwang Manseoryeok Samhap 12 Shinsal
const getSamhapShinsalWonkwang = (baseBranch: string, targetBranch: string) => {
  let startBranch = "申";
  if (["申", "子", "辰"].includes(baseBranch)) startBranch = "申";
  else if (["寅", "午", "戌"].includes(baseBranch)) startBranch = "寅";
  else if (["巳", "酉", "丑"].includes(baseBranch)) startBranch = "巳";
  else if (["亥", "卯", "未"].includes(baseBranch)) startBranch = "亥";

  const branchOrder = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const startIdx = branchOrder.indexOf(startBranch);
  const targetIdx = branchOrder.indexOf(targetBranch);
  if (startIdx === -1 || targetIdx === -1) return "장성살";
  const diff = (targetIdx - startIdx + 12) % 12;

  const names = [
    "지살", "도화살", "월살", "망신살", "장성살", "반안살", 
    "역마살", "육해살", "화개살", "겁살", "재살", "천살"
  ];
  return names[diff] || "길신";
};

// Gongmang Calculation
const calculateGongmang = (stem: string, branch: string) => {
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const sIdx = stems.indexOf(stem);
  const bIdx = branches.indexOf(branch);
  if (sIdx === -1 || bIdx === -1) return { hanja: "子丑", korean: "자축" };
  const startBranchIdx = (bIdx - sIdx + 12) % 12;
  const gm1 = branches[(startBranchIdx + 10) % 12];
  const gm2 = branches[(startBranchIdx + 11) % 12];
  const BRANCH_KOR: Record<string, string> = { "子": "자", "丑": "축", "寅": "인", "卯": "묘", "辰": "진", "巳": "사", "午": "오", "未": "미", "申": "신", "酉": "유", "戌": "술", "亥": "해" };
  return {
    hanja: `${gm1}${gm2}`,
    korean: `${BRANCH_KOR[gm1] || ""}${BRANCH_KOR[gm2] || ""}`
  };
};

export default function SajuChart({ data }: { data: SajuData }) {
  const [selectedShinsal, setSelectedShinsal] = useState<string | null>("도화살");
  const [pillarOrder, setPillarOrder] = useState<'traditional' | 'modern'>('modern'); // modern: 시 일 월 년, traditional: 년 월 일 시

  // Robustly extract 4 pillars
  const rawPillars = data.pillars || [];
  const hourPillar = rawPillars.find(p => p.label === '시주') || rawPillars[0] || { label: '시주', heavenlyStem: '', heavenlyStemTenGod: '', earthlyBranch: '', earthlyBranchTenGod: '' };
  const dayPillar = rawPillars.find(p => p.label === '일주') || rawPillars[1] || { label: '일주', heavenlyStem: '', heavenlyStemTenGod: '일원', earthlyBranch: '', earthlyBranchTenGod: '' };
  const monthPillar = rawPillars.find(p => p.label === '월주') || rawPillars[2] || { label: '월주', heavenlyStem: '', heavenlyStemTenGod: '', earthlyBranch: '', earthlyBranchTenGod: '' };
  const yearPillar = rawPillars.find(p => p.label === '년주') || rawPillars[3] || { label: '년주', heavenlyStem: '', heavenlyStemTenGod: '', earthlyBranch: '', earthlyBranchTenGod: '' };

  const dayStem = dayPillar.heavenlyStem || '癸';
  const dayBranch = dayPillar.earthlyBranch || '亥';
  const yearStem = yearPillar.heavenlyStem || '癸';
  const yearBranch = yearPillar.earthlyBranch || '卯';

  // Compute Gongmang
  const yearGm = data.gongmang?.yearGongmang || calculateGongmang(yearStem, yearBranch);
  const dayGm = data.gongmang?.dayGongmang || calculateGongmang(dayStem, dayBranch);

  // Pillar list based on user selected direction
  const displayPillars = pillarOrder === 'modern'
    ? [hourPillar, dayPillar, monthPillar, yearPillar]
    : [yearPillar, monthPillar, dayPillar, hourPillar];

  // Dynamically compute elements count
  const elements = data.elements || (() => {
    const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    rawPillars.forEach(p => {
      const hInfo = getCharElementInfo(p.heavenlyStem);
      const eInfo = getCharElementInfo(p.earthlyBranch);
      if (hInfo.element !== 'none') counts[hInfo.element as keyof typeof counts]++;
      if (eInfo.element !== 'none') counts[eInfo.element as keyof typeof counts]++;
    });
    return counts;
  })();

  // Dynamically compute/fallback Shinsal list if missing
  const sajuShinsalList = data.sajuShinsalList || [
    { pillar: "년주", shinsal: [getSamhapShinsalWonkwang(yearBranch, yearPillar.earthlyBranch), getSamhapShinsalWonkwang(dayBranch, yearPillar.earthlyBranch), "천덕귀인"].filter((v, i, a) => a.indexOf(v) === i) },
    { pillar: "월주", shinsal: [getSamhapShinsalWonkwang(yearBranch, monthPillar.earthlyBranch), getSamhapShinsalWonkwang(dayBranch, monthPillar.earthlyBranch), "월덕귀인"].filter((v, i, a) => a.indexOf(v) === i) },
    { pillar: "일주", shinsal: [getSamhapShinsalWonkwang(yearBranch, dayPillar.earthlyBranch), getSamhapShinsalWonkwang(dayBranch, dayPillar.earthlyBranch), "문창귀인"].filter((v, i, a) => a.indexOf(v) === i) },
    { pillar: "시주", shinsal: [getSamhapShinsalWonkwang(yearBranch, hourPillar.earthlyBranch), getSamhapShinsalWonkwang(dayBranch, hourPillar.earthlyBranch), "화개살"].filter((v, i, a) => a.indexOf(v) === i) }
  ];

  // Helper to find which Shinsal are present in user's Saju
  const getSajuActiveShinsal = () => {
    const activeSet = new Set<string>();
    sajuShinsalList.forEach(item => {
      item.shinsal.forEach(s => {
        const cleanName = s.replace(/살|\(.*?\)/g, '') + '살';
        if (SHINSAL_DB[cleanName]) {
          activeSet.add(cleanName);
        } else {
          const keys = Object.keys(SHINSAL_DB);
          const found = keys.find(k => s.includes(k.replace(/살/g, '')));
          if (found) activeSet.add(found);
        }
      });
    });
    return Array.from(activeSet);
  };

  const activeShinsalInSaju = getSajuActiveShinsal();

  // Dynamically generate authentic Daeun List matching Wonkwang Manseoryeok
  const daeunList = data.daeunList || (() => {
    const startAge = data.daeunStartAge || 7;
    const mStem = monthPillar.heavenlyStem || '癸';
    const mBranch = monthPillar.earthlyBranch || '亥';
    const yStem = yearPillar.heavenlyStem || '癸';

    const mStemIdx = STEMS.indexOf(mStem);
    const mBranchIdx = BRANCHES.indexOf(mBranch);
    if (mStemIdx === -1 || mBranchIdx === -1) return [];

    const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(yStem);
    const isMale = data.profile?.isMale !== false;
    const isForward = isMale ? isYangYear : !isYangYear;

    const list: DaeunCycle[] = [];
    const baseBirthYear = data.profile?.birthYear || 1963;
    const currentAge = 2026 - baseBirthYear + 1;

    for (let step = 1; step <= 10; step++) {
      const sIdx = isForward ? (mStemIdx + step) % 10 : (mStemIdx - step + 60) % 10;
      const bIdx = isForward ? (mBranchIdx + step) % 12 : (mBranchIdx - step + 60) % 12;

      const hStem = STEMS[sIdx];
      const eBranch = BRANCHES[bIdx];
      const age = startAge + (step - 1) * 10;
      const startYear = baseBirthYear + age - 1;

      // 10 years of Seun for this Daeun
      const seunList: SeunItem[] = [];
      for (let sy = 0; sy < 10; sy++) {
        const seunYear = startYear + sy;
        const seunAge = age + sy;
        const sYearIdx = ((seunYear - 4) % 60 + 60) % 60;
        const sStem = STEMS[sYearIdx % 10];
        const sBranch = BRANCHES[sYearIdx % 12];
        seunList.push({
          year: seunYear,
          age: seunAge,
          heavenlyStem: sStem,
          heavenlyStemTenGod: calculateTenGod(dayStem, sStem, true),
          earthlyBranch: sBranch,
          earthlyBranchTenGod: calculateTenGod(dayStem, sBranch, false),
          twelveUnseong: (WONKWANG_UNSEONG[dayStem] && WONKWANG_UNSEONG[dayStem][sBranch]) || "건록",
          yearShinsal: getSamhapShinsalWonkwang(yearBranch, sBranch),
          isCurrentYear: seunYear === 2026
        });
      }

      list.push({
        age,
        startYear,
        heavenlyStem: hStem,
        heavenlyStemTenGod: calculateTenGod(dayStem, hStem, true),
        earthlyBranch: eBranch,
        earthlyBranchTenGod: calculateTenGod(dayStem, eBranch, false),
        twelveUnseong: (WONKWANG_UNSEONG[dayStem] && WONKWANG_UNSEONG[dayStem][eBranch]) || "건록",
        yearShinsal: getSamhapShinsalWonkwang(yearBranch, eBranch),
        dayShinsal: getSamhapShinsalWonkwang(dayBranch, eBranch),
        isActive: currentAge >= age && currentAge < age + 10,
        seunList
      });
    }
    return list;
  })();

  const activeDaeun = daeunList.find(d => d.isActive) || daeunList[0];
  const [selectedDaeun, setSelectedDaeun] = useState<DaeunCycle | null>(activeDaeun);

  // Profile data
  const profile = data.profile || {
    birthYear: 1963,
    birthMonth: 11,
    birthDay: 16,
    isSolar: true,
    isMale: false,
    koreanAge: 64,
    solarDate: "양력 1963년 11월 16일",
    lunarDate: "음력 1963년 10월 1일 (평달)",
    standardTimeCorrection: "진태양시(동경 127.5도) 30분 시차 보정 적용"
  };

  return (
    <div className="w-full flex flex-col gap-10">
      
      {/* 1. WONKWANG MANSEORYEOK OFFICIAL HEADER BANNER */}
      <div className="border border-border-dark bg-bg-dark p-6 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        {/* Certification badge and Quick Info */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 relative z-10 border-b border-border-dark pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neon bg-neon/10 px-2 py-0.5 rounded border border-neon/30 flex items-center gap-1">
                <Award size={11} className="text-neon" />
                원광만세력 정통 명리학 표준
              </span>
              <span className="text-[10px] text-text-light/50 font-bold">
                {profile.standardTimeCorrection || "진태양시 동경 127.5도 -30분 시차 보정"}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
              <Compass className="text-neon animate-spin-slow" size={20} />
              AI 정밀 사주 명조 (四柱命造)
            </h2>
          </div>

          {/* Gongmang & Age Visual Card */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-border-dark bg-white/[0.02] px-3 py-1.5 rounded">
              <span className="text-[10px] font-bold text-text-light/40">년공망:</span>
              <span className="text-xs font-black text-amber-400">{yearGm.hanja} ({yearGm.korean})</span>
              <span className="text-text-light/20 mx-1">|</span>
              <span className="text-[10px] font-bold text-text-light/40">일공망:</span>
              <span className="text-xs font-black text-amber-400">{dayGm.hanja} ({dayGm.korean})</span>
            </div>

            {/* Pillar order toggle button */}
            <button
              type="button"
              onClick={() => setPillarOrder(prev => prev === 'modern' ? 'traditional' : 'modern')}
              className="px-3 py-1.5 border border-neon/30 bg-neon/5 hover:bg-neon hover:text-bg-dark text-neon text-[10px] font-black uppercase tracking-wider rounded transition-all flex items-center gap-1"
            >
              <Layers size={11} />
              {pillarOrder === 'modern' ? '시→일→월→년 (현재)' : '년→월→일→시 (현재)'}
            </button>
          </div>
        </div>

        {/* Profile Details Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/[0.015] border border-white/5 rounded-md mb-6 relative z-10 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-text-light/80">
            <span><strong>성별:</strong> <span className="text-white font-bold">{profile.isMale ? '남성' : '여성'}</span></span>
            <span><strong>생년월일:</strong> <span className="text-neon font-bold">{profile.solarDate || '양력 1963년 11월 16일'}</span></span>
            <span><strong>음력 변환:</strong> <span className="text-text-light font-bold">{profile.lunarDate || '음력 1963년 10월 1일 (평달)'}</span></span>
            <span><strong>나이:</strong> <span className="text-white font-bold">{profile.koreanAge ?? 1}세 (만 {profile.westernAge ?? 0}세)</span></span>
          </div>

          {/* Elements Quick Distribution */}
          <div className="flex items-center gap-2">
            {Object.entries(elements).map(([el, count]) => {
              const info = getCharElementInfo(el === 'wood' ? '甲' : el === 'fire' ? '丙' : el === 'earth' ? '戊' : el === 'metal' ? '庚' : '壬');
              return (
                <div key={el} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                  <span className={`text-[10px] font-bold ${info.colorClass}`}>{info.label.substring(0, 1)}</span>
                  <span className="text-[11px] font-mono font-bold text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* The 4-Pillars Matrix Table (원광만세력 사주원국 정통 구조) */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 relative z-10">
          {displayPillars.map((pillar, idx) => {
            const hStemInfo = getCharElementInfo(pillar.heavenlyStem);
            const eBranchInfo = getCharElementInfo(pillar.earthlyBranch);
            
            // 12 Unseong fallback
            const unseong = pillar.twelveUnseong || (WONKWANG_UNSEONG[dayStem] && WONKWANG_UNSEONG[dayStem][pillar.earthlyBranch]) || "건록";
            
            // 12 Shinsal fallback (년지 기준 / 일지 기준)
            const yearShin = pillar.yearShinsal || getSamhapShinsalWonkwang(yearBranch, pillar.earthlyBranch);
            const dayShin = pillar.dayShinsal || getSamhapShinsalWonkwang(dayBranch, pillar.earthlyBranch);

            return (
              <div 
                key={idx} 
                className={`flex flex-col border rounded-lg overflow-hidden transition-all duration-300 bg-white/[0.01] ${
                  pillar.label === '일주' ? 'border-neon shadow-[0_0_15px_rgba(207,255,4,0.12)] bg-neon/[0.015]' : 'border-border-dark hover:border-white/20'
                }`}
              >
                {/* 1. Pillar Header */}
                <div className={`p-2 text-center text-xs font-black tracking-wider border-b ${
                  pillar.label === '일주' ? 'bg-neon/15 border-neon/30 text-neon' : 'bg-white/5 border-border-dark text-text-light/60'
                }`}>
                  {pillar.label}
                  {pillar.label === '일주' && <span className="ml-1 text-[9px] font-bold text-neon">(일원·나)</span>}
                </div>

                {/* 2. Heavenly Stem Ten God (천간 십신) */}
                <div className="py-1.5 text-center text-xs font-bold text-text-light/70 bg-white/[0.02] border-b border-white/5">
                  {pillar.heavenlyStemTenGod || (pillar.label === '일주' ? '일원' : calculateTenGod(dayStem, pillar.heavenlyStem, true))}
                </div>

                {/* 3. Heavenly Stem (천간 대형 글자) */}
                <div className="p-4 flex flex-col items-center justify-center gap-1 border-b border-border-dark/50">
                  <span className={`text-5xl md:text-6xl font-black tracking-tighter ${hStemInfo.colorClass}`}>
                    {pillar.heavenlyStem}
                  </span>
                  <span className="text-[10px] font-bold text-text-light/40 uppercase tracking-widest">{hStemInfo.label}</span>
                </div>

                {/* 4. Earthly Branch (지지 대형 글자) */}
                <div className="p-4 flex flex-col items-center justify-center gap-1 border-b border-border-dark/50 bg-white/[0.005]">
                  <span className={`text-5xl md:text-6xl font-black tracking-tighter ${eBranchInfo.colorClass}`}>
                    {pillar.earthlyBranch}
                  </span>
                  <span className="text-[10px] font-bold text-text-light/40 uppercase tracking-widest">{eBranchInfo.label}</span>
                </div>

                {/* 5. Earthly Branch Ten God (지지 십신) */}
                <div className="py-1.5 text-center text-xs font-bold text-text-light/70 bg-white/[0.02] border-b border-white/5">
                  {pillar.earthlyBranchTenGod || calculateTenGod(dayStem, pillar.earthlyBranch, false)}
                </div>

                {/* 6. Hidden Stems (지장간 상세 일수) */}
                <div className="p-2 bg-black/40 flex flex-col items-center gap-1 border-b border-white/5">
                  <span className="text-[8px] font-bold text-text-light/30 uppercase tracking-widest">지장간(支藏干)</span>
                  <div className="flex flex-wrap justify-center gap-1">
                    {(pillar.hiddenStemsDetailed && pillar.hiddenStemsDetailed.length > 0) ? (
                      pillar.hiddenStemsDetailed.map((hd, hidx) => {
                        const hInfo = getCharElementInfo(hd.stem);
                        return (
                          <span key={hidx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hInfo.bgClass} ${hInfo.colorClass}`}>
                            {hd.stem}<span className="text-[8px] opacity-60">({hd.days}일)</span>
                          </span>
                        );
                      })
                    ) : (
                      (pillar.hiddenStems || []).map((h, hidx) => {
                        const hInfo = getCharElementInfo(h);
                        return (
                          <span key={hidx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hInfo.bgClass} ${hInfo.colorClass}`}>
                            {h}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 7. Twelve Unseong (12운성 - 일간 봉법 기준) */}
                <div className="py-2 text-center border-b border-white/5 bg-white/[0.01]">
                  <span className="text-[8px] block text-text-light/30 uppercase tracking-widest font-bold">12운성</span>
                  <span className="text-xs font-black text-amber-300">{unseong}</span>
                </div>

                {/* 8. 12 Shinsal (년지 기준 / 일지 기준 2종 정밀 표기) */}
                <div className="p-2 bg-black/20 flex flex-col gap-1 border-b border-white/5">
                  <div className="flex justify-between items-center text-[9px] px-1">
                    <span className="text-text-light/40 font-medium">년지기준:</span>
                    <span className="font-bold text-neon">{yearShin}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] px-1">
                    <span className="text-text-light/40 font-medium">일지기준:</span>
                    <span className="font-bold text-emerald-400">{dayShin}</span>
                  </div>
                </div>

                {/* 9. Napeum Ohang (납음오행) */}
                <div className="py-1.5 text-center bg-black/50 text-[9px] font-bold text-text-light/40">
                  {pillar.napeum || "납음오행"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. DAEUN (MAJOR CYCLES) & 10-YEAR SEUN MATRIX (원광만세력 대운·세운 정밀 연동) */}
      <div className="border border-border-dark bg-bg-dark p-6 rounded-lg shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-5 border-b border-border-dark pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon block mb-1">Wonkwang Manseoryeok Daeun & Seun</span>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="text-neon" size={18} />
              한눈에 보는 대운 (大運) 및 세운 (歲運 - 연운)
            </h2>
            <p className="text-xs text-text-light/40 mt-1">
              * 주황색 테두리가 <strong>현재 활성화된 대운</strong>입니다. 대운 카드를 클릭하면 해당 대운의 <strong>10년치 연운(세운) 표</strong>가 실시간으로 펼쳐집니다.
            </p>
          </div>

          <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded">
            대운수: {data.daeunStartAge || 7}대운 ({profile.isMale ? (['甲','丙','戊','庚','壬'].includes(yearStem) ? '순행' : '역행') : (['甲','丙','戊','庚','壬'].includes(yearStem) ? '역행' : '순행')})
          </div>
        </div>

        {/* Horizontal Slider container for Daeun */}
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-border-dark scrollbar-track-transparent">
          {daeunList.map((cycle, idx) => {
            const hStemInfo = getCharElementInfo(cycle.heavenlyStem);
            const eBranchInfo = getCharElementInfo(cycle.earthlyBranch);
            const isSelected = selectedDaeun?.age === cycle.age;
            
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedDaeun(cycle)}
                className={`flex-shrink-0 w-28 border rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                  cycle.isActive 
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/50' 
                    : isSelected
                      ? 'border-neon bg-neon/10'
                      : 'border-border-dark bg-white/[0.01] hover:border-white/30'
                }`}
              >
                {/* Age & Year Header */}
                <div className={`p-1.5 text-center font-mono font-black text-xs border-b ${
                  cycle.isActive ? 'bg-amber-500 text-bg-dark' : isSelected ? 'bg-neon text-bg-dark' : 'bg-white/5 border-border-dark text-text-light/60'
                }`}>
                  {cycle.age}세 <span className="text-[9px] font-normal">({cycle.startYear || (profile.birthYear + cycle.age - 1)}년)</span>
                </div>

                {/* Ten God Top */}
                <div className="p-1 text-[10px] font-bold text-center text-text-light/40 truncate">
                  {cycle.heavenlyStemTenGod || calculateTenGod(dayStem, cycle.heavenlyStem, true)}
                </div>

                {/* Stems & Branches Visual Stack */}
                <div className="py-2.5 flex flex-col items-center justify-center gap-0.5 border-b border-border-dark/50">
                  <span className={`text-2xl font-black ${hStemInfo.colorClass}`}>{cycle.heavenlyStem}</span>
                  <span className={`text-2xl font-black ${eBranchInfo.colorClass}`}>{cycle.earthlyBranch}</span>
                </div>

                {/* Ten God Bottom */}
                <div className="p-1 text-[10px] font-bold text-center text-text-light/40 truncate bg-white/[0.01] border-b border-white/5">
                  {cycle.earthlyBranchTenGod || calculateTenGod(dayStem, cycle.earthlyBranch, false)}
                </div>

                {/* 12 Unseong */}
                <div className="py-1 text-[9px] font-bold text-center text-amber-300/80 border-b border-white/5">
                  {cycle.twelveUnseong || (WONKWANG_UNSEONG[dayStem] && WONKWANG_UNSEONG[dayStem][cycle.earthlyBranch]) || "건록"}
                </div>

                {/* 12 Shinsal */}
                <div className="py-1 text-[9px] font-bold text-center text-neon truncate px-1">
                  {cycle.yearShinsal || getSamhapShinsalWonkwang(yearBranch, cycle.earthlyBranch)}
                </div>

                {/* Currently Active Badge */}
                {cycle.isActive && (
                  <div className="bg-amber-500/20 text-amber-400 text-[8px] font-black text-center py-0.5 uppercase tracking-widest animate-pulse border-t border-amber-500/20">
                    현재 대운 ⚡
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Selected Daeun & 10-Year Seun (세운 - 연운) Detailed Interactive Board */}
        <AnimatePresence mode="wait">
          {selectedDaeun && (
            <motion.div
              key={selectedDaeun.age}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-5 border border-border-dark bg-white/[0.015] rounded-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded font-black text-xs uppercase tracking-wider ${
                    selectedDaeun.isActive ? 'bg-amber-500 text-bg-dark' : 'bg-neon text-bg-dark'
                  }`}>
                    {selectedDaeun.isActive ? "현재 진행 중인 대운" : `${selectedDaeun.age}세 대운`}
                  </span>
                  <span className="text-base font-black text-white">
                    {selectedDaeun.heavenlyStem}{selectedDaeun.earthlyBranch} ({getCharElementInfo(selectedDaeun.heavenlyStem).label} / {getCharElementInfo(selectedDaeun.earthlyBranch).label}) — {selectedDaeun.startYear || (profile.birthYear + selectedDaeun.age - 1)}년 ~ {(selectedDaeun.startYear || (profile.birthYear + selectedDaeun.age - 1)) + 9}년 (10년간)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-light/60">
                  <span><strong>12운성:</strong> <span className="text-amber-400 font-bold">{selectedDaeun.twelveUnseong}</span></span>
                  <span><strong>12신살:</strong> <span className="text-neon font-bold">{selectedDaeun.yearShinsal}</span></span>
                </div>
              </div>

              {/* 10-Year Seun (세운) Grid Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-light/40 block">
                  10년 세운(歲運 - 연운) 정밀 배열표 (원광만세력 규격)
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                  {(selectedDaeun.seunList || []).map((seun, sidx) => {
                    const shInfo = getCharElementInfo(seun.heavenlyStem);
                    const seInfo = getCharElementInfo(seun.earthlyBranch);

                    return (
                      <div 
                        key={sidx}
                        className={`p-2 border rounded flex flex-col items-center justify-between transition-all ${
                          seun.isCurrentYear 
                            ? 'border-neon bg-neon/15 shadow-[0_0_15px_rgba(207,255,4,0.2)] ring-1 ring-neon'
                            : 'border-white/10 bg-black/40 hover:border-white/30'
                        }`}
                      >
                        {/* Year & Age */}
                        <div className="text-center w-full pb-1 border-b border-white/5">
                          <span className={`text-[10px] font-mono font-bold block ${seun.isCurrentYear ? 'text-neon font-black' : 'text-text-light/70'}`}>
                            {seun.year}년
                          </span>
                          <span className="text-[9px] text-text-light/40 block">({seun.age}세)</span>
                        </div>

                        {/* Stem & Branch Stack */}
                        <div className="py-2 flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-text-light/40">{seun.heavenlyStemTenGod}</span>
                          <span className={`text-lg font-black ${shInfo.colorClass}`}>{seun.heavenlyStem}</span>
                          <span className={`text-lg font-black ${seInfo.colorClass}`}>{seun.earthlyBranch}</span>
                          <span className="text-[9px] text-text-light/40">{seun.earthlyBranchTenGod}</span>
                        </div>

                        {/* Unseong & Shinsal */}
                        <div className="w-full pt-1 border-t border-white/5 text-center space-y-0.5">
                          <span className="text-[8px] font-bold text-amber-300 block truncate">{seun.twelveUnseong}</span>
                          <span className="text-[8px] font-bold text-neon block truncate">{seun.yearShinsal}</span>
                        </div>

                        {/* Current Year Badge */}
                        {seun.isCurrentYear && (
                          <div className="w-full mt-1 bg-neon text-bg-dark text-[8px] font-black text-center py-0.5 rounded-sm">
                            올해(2026) ⚡
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 12 SHINSAL DETAIL EXPLORER */}
      <div className="border border-border-dark bg-bg-dark p-6 rounded-lg shadow-xl relative overflow-hidden">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon block mb-1">Auxiliary Stars Magnifier</span>
        <h2 className="text-xl font-bold tracking-tight mb-3 flex items-center gap-2">
          <Sparkles className="text-neon" size={18} />
          12신살(十二神煞) 정밀 해독기
        </h2>
        <p className="text-xs text-text-light/40 mb-6 max-w-2xl leading-relaxed">
          12신살은 태어난 날(또는 해)의 지지를 기준으로 다른 네 기둥의 환경이 어떠한 기운과 복을 띠고 작용하는지를 가르쳐주는 정밀 신살 지표입니다. <span className="text-neon font-bold">내 사주에 해당하는 살은 에메랄드 테두리와 "내 사주 포함" 뱃지로 표시됩니다.</span>
        </p>

        {/* 12 Shinsal Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {Object.entries(SHINSAL_DB).map(([name, item]) => {
            const isActiveInUser = activeShinsalInSaju.includes(name);
            const isSelected = selectedShinsal === name;

            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedShinsal(name)}
                className={`p-3 text-left border rounded-lg transition-all duration-300 relative ${
                  isSelected 
                    ? 'border-neon bg-neon/10 text-text-light shadow-[0_0_15px_rgba(207,255,4,0.1)]' 
                    : isActiveInUser
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-text-light/80 hover:border-emerald-400'
                      : 'border-border-dark bg-white/[0.01] text-text-light/50 hover:border-white/20 hover:text-text-light'
                }`}
              >
                <div className="flex justify-between items-start gap-1 mb-1">
                  <span className="font-bold text-sm tracking-tight">{name}</span>
                  <span className="text-[9px] font-mono opacity-40">{item.chinese}</span>
                </div>
                <div className="text-[10px] opacity-60 line-clamp-1 mb-2 font-medium">{item.meaning}</div>
                
                {/* Visual indicator badge */}
                {isActiveInUser && (
                  <span className="absolute bottom-2 right-2 text-[8px] font-bold px-1 py-0.2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-sm">
                    내 사주 포함 ⚡
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Detailed Description Panel for selected Shinsal */}
        <AnimatePresence mode="wait">
          {selectedShinsal && (
            <motion.div
              key={selectedShinsal}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 border border-border-dark bg-white/[0.02] rounded-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-neon/10 rounded-full text-neon border border-neon/20">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neon flex items-center gap-1">
                      {selectedShinsal}
                      <span className="text-xs font-mono font-medium text-text-light/40 ml-1">({SHINSAL_DB[selectedShinsal].chinese})</span>
                    </h3>
                    <p className="text-xs font-bold text-text-light/70">{SHINSAL_DB[selectedShinsal].meaning}</p>
                  </div>
                </div>

                {activeShinsalInSaju.includes(selectedShinsal) && (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-black tracking-widest uppercase animate-pulse self-start sm:self-auto">
                    My Saju Active ⚡
                  </span>
                )}
              </div>

              {/* Core Description */}
              <div className="space-y-4 mb-6 text-sm text-text-light/80 leading-relaxed font-medium">
                <p>{SHINSAL_DB[selectedShinsal].description}</p>
                <div className="bg-neon/5 p-4 border-l-4 border-neon rounded-r text-xs font-bold text-neon flex items-start gap-2">
                  <span className="shrink-0">운세 가이드:</span>
                  <span>{SHINSAL_DB[selectedShinsal].advice}</span>
                </div>
              </div>

              {/* Pillars Specific Interpretations */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-light/60 flex items-center gap-2 mb-4">
                  <Layers size={14} className="text-neon" />
                  기둥별 발현 형태 (Pillar Interpretation)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "년주 (조상/초년기)", text: SHINSAL_DB[selectedShinsal].yearInterpret, isMyPillar: sajuShinsalList.find(s => s.pillar === "년주")?.shinsal.some(s => s.includes(selectedShinsal.replace(/살/g, ''))) },
                    { label: "월주 (부모형제/청년기)", text: SHINSAL_DB[selectedShinsal].monthInterpret, isMyPillar: sajuShinsalList.find(s => s.pillar === "월주")?.shinsal.some(s => s.includes(selectedShinsal.replace(/살/g, ''))) },
                    { label: "일주 (본인배우자/장년기)", text: SHINSAL_DB[selectedShinsal].dayInterpret, isMyPillar: sajuShinsalList.find(s => s.pillar === "일주")?.shinsal.some(s => s.includes(selectedShinsal.replace(/살/g, ''))) },
                    { label: "시주 (자녀/노년기)", text: SHINSAL_DB[selectedShinsal].hourInterpret, isMyPillar: sajuShinsalList.find(s => s.pillar === "시주")?.shinsal.some(s => s.includes(selectedShinsal.replace(/살/g, ''))) }
                  ].map((p, pidx) => (
                    <div 
                      key={pidx} 
                      className={`p-4 border rounded transition-all duration-300 ${
                        p.isMyPillar 
                          ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'border-white/5 bg-black/20 text-text-light/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[11px] font-black tracking-wider uppercase ${p.isMyPillar ? 'text-emerald-400' : 'text-text-light/60'}`}>
                          {p.label}
                        </span>
                        {p.isMyPillar && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 bg-emerald-500 text-bg-dark rounded-sm">
                            내 사주 위치 🎯
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{p.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. SAMJAE (3 DISASTERS) GUIDE PANEL */}
      <div className="border border-border-dark bg-bg-dark p-6 rounded-lg shadow-xl relative overflow-hidden">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon block mb-1">Three Disasters Astrological Guide</span>
        <h2 className="text-xl font-bold tracking-tight mb-3 flex items-center gap-2 relative z-10">
          <Flame className="text-red-500 animate-pulse" size={18} />
          나의 삼재 (三災) 정밀 판독기
        </h2>
        <p className="text-xs text-text-light/40 mb-6 max-w-2xl leading-relaxed relative z-10">
          삼재는 인간의 삶에 9년마다 돌아와 3년 동안 머무르는 세 가지 재해(수재, 풍재, 화재 또는 병난, 도병난, 기근난)를 뜻합니다. 태어난 해의 띠(년지 지지)를 기준으로 일정한 주기로 반복되는 우주의 계절적 기 변화를 의미합니다.
        </p>

        {/* Current status overview card */}
        <div className="p-5 border border-red-500/20 bg-red-500/[0.02] rounded-lg mb-6 relative z-10 flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-full border shrink-0 flex items-center justify-center ${(() => {
              const yearBranch = yearPillar.earthlyBranch || '子';
              const isSamjaeActive = ['亥', '卯', '未'].includes(yearBranch);
              return isSamjaeActive ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-text-light/50';
            })()}`}>
              <Flame size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-light/50 font-bold">생년 지지:</span>
                <span className="text-sm font-black text-neon">{yearPillar.earthlyBranch} ({(() => {
                  const animalMap: Record<string, string> = {
                    '子': '쥐띠 (子)', '丑': '소띠 (丑)', '寅': '호랑이띠 (寅)', '卯': '토끼띠 (卯)',
                    '辰': '용띠 (辰)', '巳': '뱀띠 (巳)', '午': '말띠 (午)', '未': '양띠 (未)',
                    '申': '원숭이띠 (申)', '酉': '닭띠 (酉)', '戌': '개띠 (戌)', '亥': '돼지띠 (亥)'
                  };
                  return animalMap[yearPillar.earthlyBranch || '子'] || '알 수 없음';
                })()})</span>
                {['亥', '卯', '未'].includes(yearPillar.earthlyBranch || '子') ? (
                  <span className="px-2 py-0.5 rounded bg-red-500 text-bg-dark font-black text-[9px] tracking-widest uppercase animate-pulse">
                    삼재 진행 중 (ALERT) ⚠️
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500 text-bg-dark font-black text-[9px] tracking-widest uppercase">
                    삼재 무풍지대 (SAFE) ✅
                  </span>
                )}
              </div>
              <p className="text-xs text-text-light/80 mt-1 font-semibold leading-relaxed">
                {(() => {
                  const yearBranch = yearPillar.earthlyBranch || '子';
                  if (['申', '子', '辰'].includes(yearBranch)) {
                    return '현재 삼재 주기에 해당하지 않습니다. 기운이 무탈하고 조화로운 안정이 따르는 시기입니다.';
                  } else if (['亥', '卯', '未'].includes(yearBranch)) {
                    return '경고! 2026년 현재 "눌삼재(누울삼재)" 한복판에 와 있습니다. 첫 해에 발생한 격동적인 기운이 몸과 마음, 혹은 현실적 환경에 깊숙이 안착하는 정체기로서 무리한 투자나 확장보다는 안전 수성을 원칙으로 하시는 것이 매우 유리합니다.';
                  } else if (['寅', '午', '戌'].includes(yearBranch)) {
                    return '현재 삼재 주기에 해당하지 않아 무해한 흐름입니다. 단, 다가오는 2028년(무신년)에 들삼재가 시작되오니 2~3년 동안 내실 있는 기초 공사와 체력을 든든히 길러 준비하시는 것이 도움됩니다.';
                  } else if (['巳', '酉', '丑'].includes(yearBranch)) {
                    return '현재 삼재 주기에 해당하지 않습니다. 대지 위에 씨앗이 단단하게 싹을 틔우듯, 삶의 다양한 시도와 안정이 순조롭게 펼쳐질 수 있는 길한 기운입니다.';
                  }
                  return '';
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* The 3 Samjae Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 mb-6">
          {[
            { 
              title: "들삼재 (입삼재 - Entering)", 
              icon: "📥", 
              desc: "삼재의 첫 번째 해로, 삼재가 집 안으로 들어오는 시기입니다. 외부적 충격이나 예상치 못한 변화, 이동수가 크게 일어날 수 있으며, 일적으로 벌이는 대형 투자나 확장보다는 기존 영역의 디펜스가 권장됩니다.",
              years: (() => {
                const yearBranch = yearPillar.earthlyBranch || '子';
                if (['申', '子', '辰'].includes(yearBranch)) return '호랑이해 (寅)';
                if (['亥', '卯', '未'].includes(yearBranch)) return '뱀해 (巳)';
                if (['寅', '午', '戌'].includes(yearBranch)) return '원숭이해 (申)';
                return '돼지해 (亥)';
              })(),
              isActive: false,
              colorClass: "border-red-500/20 hover:border-red-500/40"
            },
            { 
              title: "눌삼재 (묵삼재 - Staying)", 
              icon: "🛌", 
              desc: "삼재의 두 번째 해로, 기운이 머무르며 몸집을 불리는 시기입니다. 정체성, 긴장감, 인내심이 주로 필요하며 사업적 현상 유지와 건강 관리, 구설수 차단에 주력하고 조용히 실력을 기르는 내적 성장이 좋습니다.",
              years: (() => {
                const yearBranch = yearPillar.earthlyBranch || '子';
                if (['申', '子', '辰'].includes(yearBranch)) return '토끼해 (卯)';
                if (['亥', '卯', '未'].includes(yearBranch)) return '말해 (午)';
                if (['寅', '午', '戌'].includes(yearBranch)) return '닭해 (酉)';
                return '쥐해 (子)';
              })(),
              isActive: ['亥', '卯', '未'].includes(yearPillar.earthlyBranch || '子'),
              colorClass: "border-amber-500/20 hover:border-amber-500/40"
            },
            { 
              title: "날삼재 (출삼재 - Exiting)", 
              icon: "📤", 
              desc: "삼재의 마지막 나가는 해입니다. 기운이 밖으로 나가며 안정세로 접어드나, 나갈 때 문에 발을 찧듯 뜻밖의 장해(금전 거래 손실, 부부 갈등 혹은 장거리 이별)가 집중되는 경향이 있어 끝까지 유의해야 합니다.",
              years: (() => {
                const yearBranch = yearPillar.earthlyBranch || '子';
                if (['申', '子', '辰'].includes(yearBranch)) return '용해 (辰)';
                if (['亥', '卯', '未'].includes(yearBranch)) return '양해 (未)';
                if (['寅', '午', '戌'].includes(yearBranch)) return '개해 (戌)';
                return '소해 (丑)';
              })(),
              isActive: false,
              colorClass: "border-emerald-500/20 hover:border-emerald-500/40"
            }
          ].map((stage, sidx) => (
            <div 
              key={sidx}
              className={`p-4 border rounded-lg flex flex-col justify-between transition-all duration-300 bg-white/[0.01] ${stage.colorClass} ${
                stage.isActive ? 'ring-2 ring-amber-500 bg-amber-500/[0.04] border-amber-500' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                  <span className="text-xs font-black text-text-light flex items-center gap-1.5">
                    <span className="text-base">{stage.icon}</span>
                    {stage.title}
                  </span>
                  {stage.isActive && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-bg-dark font-black text-[8px] uppercase tracking-wider animate-pulse">
                      현재 단계 🎯
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-light/70 leading-relaxed mb-4 font-semibold">
                  {stage.desc}
                </p>
              </div>
              
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-light/40 uppercase">해당 지지 해</span>
                <span className="text-xs font-black text-neon">{stage.years}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary of Samjae Timeline Cycles */}
        <div className="p-4 border border-border-dark bg-black/40 rounded-lg relative z-10 flex flex-col sm:flex-row justify-between gap-4 text-xs leading-relaxed text-text-light/60 font-medium">
          <div>
            <span className="text-[10px] font-black uppercase text-neon block mb-1">Recent Cycle (직전 주기)</span>
            <span className="text-text-light/95 font-bold">{(() => {
              const yearBranch = yearPillar.earthlyBranch || '子';
              if (['申', '子', '辰'].includes(yearBranch)) return '2022년(들) / 2023년(눌) / 2024년(날)';
              if (['亥', '卯', '未'].includes(yearBranch)) return '2013년(들) / 2014년(눌) / 2015년(날)';
              if (['寅', '午', '戌'].includes(yearBranch)) return '2016년(들) / 2017년(눌) / 2018년(날)';
              return '2019년(들) / 2020년(눌) / 2021년(날)';
            })()}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] font-black uppercase text-neon block mb-1">Upcoming Cycle (향후 주기)</span>
            <span className="text-text-light/95 font-bold">{(() => {
              const yearBranch = yearPillar.earthlyBranch || '子';
              if (['申', '子', '辰'].includes(yearBranch)) return '2034년(들) / 2035년(눌) / 2036년(날)';
              if (['亥', '卯', '未'].includes(yearBranch)) return '2025년(들) / 2026년(눌) / 2027년(날)';
              if (['寅', '午', '戌'].includes(yearBranch)) return '2028년(들) / 2029년(눌) / 2030년(날)';
              return '2031년(들) / 2032년(눌) / 2033년(날)';
            })()}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
