import KoreanLunarCalendar from "korean-lunar-calendar";
import { Solar, Lunar } from "lunar-typescript";

export const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export const STEM_KOREAN: Record<string, string> = {
  "甲": "갑", "乙": "을", "丙": "병", "丁": "정", "戊": "무",
  "己": "기", "庚": "경", "辛": "신", "壬": "임", "癸": "계"
};

export const BRANCH_KOREAN: Record<string, string> = {
  "子": "자", "丑": "축", "寅": "인", "卯": "묘", "辰": "진", "巳": "사",
  "午": "오", "未": "미", "申": "신", "酉": "유", "戌": "술", "亥": "해"
};

const KOREAN_TO_STEM: Record<string, string> = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸"
};

const KOREAN_TO_BRANCH: Record<string, string> = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
  "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥"
};

export const STEM_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth",
  "己": "earth", "庚": "metal", "辛": "metal", "壬": "water", "癸": "water"
};

export const BRANCH_ELEMENT: Record<string, "wood" | "fire" | "earth" | "metal" | "water"> = {
  "寅": "wood", "卯": "wood", "巳": "fire", "午": "fire",
  "辰": "earth", "戌": "earth", "丑": "earth", "未": "earth",
  "申": "metal", "酉": "metal", "亥": "water", "子": "water"
};

export const HIDDEN_STEMS: Record<string, string[]> = {
  "子": ["壬", "癸"],
  "丑": ["癸", "辛", "己"],
  "寅": ["戊", "丙", "甲"],
  "卯": ["甲", "乙"],
  "辰": ["乙", "癸", "戊"],
  "巳": ["戊", "庚", "丙"],
  "午": ["丙", "己", "丁"],
  "未": ["丁", "乙", "己"],
  "申": ["戊", "壬", "庚"],
  "酉": ["庚", "辛"],
  "戌": ["辛", "丁", "戊"],
  "亥": ["戊", "甲", "壬"]
};

export const HIDDEN_STEMS_DETAILED: Record<string, Array<{ stem: string; days: number; role: string }>> = {
  "子": [{ stem: "壬", days: 10, role: "초기" }, { stem: "癸", days: 20, role: "정기" }],
  "丑": [{ stem: "癸", days: 9, role: "초기" }, { stem: "辛", days: 3, role: "중기" }, { stem: "己", days: 18, role: "정기" }],
  "寅": [{ stem: "戊", days: 7, role: "초기" }, { stem: "丙", days: 7, role: "중기" }, { stem: "甲", days: 16, role: "정기" }],
  "卯": [{ stem: "甲", days: 10, role: "초기" }, { stem: "乙", days: 20, role: "정기" }],
  "辰": [{ stem: "乙", days: 9, role: "초기" }, { stem: "癸", days: 3, role: "중기" }, { stem: "戊", days: 18, role: "정기" }],
  "巳": [{ stem: "戊", days: 7, role: "초기" }, { stem: "庚", days: 7, role: "중기" }, { stem: "丙", days: 16, role: "정기" }],
  "午": [{ stem: "丙", days: 10, role: "초기" }, { stem: "己", days: 9, role: "중기" }, { stem: "丁", days: 11, role: "정기" }],
  "未": [{ stem: "丁", days: 9, role: "초기" }, { stem: "乙", days: 3, role: "중기" }, { stem: "己", days: 18, role: "정기" }],
  "申": [{ stem: "戊", days: 7, role: "초기" }, { stem: "壬", days: 7, role: "중기" }, { stem: "庚", days: 16, role: "정기" }],
  "酉": [{ stem: "庚", days: 10, role: "초기" }, { stem: "辛", days: 20, role: "정기" }],
  "戌": [{ stem: "辛", days: 9, role: "초기" }, { stem: "丁", days: 3, role: "중기" }, { stem: "戊", days: 18, role: "정기" }],
  "亥": [{ stem: "戊", days: 7, role: "초기" }, { stem: "甲", days: 7, role: "중기" }, { stem: "壬", days: 16, role: "정기" }]
};

export const TEN_GODS_MAP: Record<string, Record<string, string>> = {
  "甲": { "甲": "비견", "乙": "겁재", "丙": "식신", "丁": "상관", "戊": "편재", "己": "정재", "庚": "편관", "辛": "정관", "壬": "편인", "癸": "정인", "寅": "비견", "卯": "겁재", "巳": "식신", "午": "상관", "辰": "편재", "戌": "편재", "丑": "정재", "未": "정재", "申": "편관", "酉": "정관", "亥": "편인", "子": "정인" },
  "乙": { "甲": "겁재", "乙": "비견", "丙": "상관", "丁": "식신", "戊": "정재", "己": "편재", "庚": "정관", "辛": "편관", "壬": "정인", "癸": "편인", "寅": "겁재", "卯": "비견", "巳": "상관", "午": "식신", "辰": "정재", "戌": "정재", "丑": "편재", "未": "편재", "申": "정관", "酉": "편관", "亥": "정인", "子": "편인" },
  "丙": { "甲": "편인", "乙": "정인", "丙": "비견", "丁": "겁재", "戊": "식신", "己": "상관", "庚": "편재", "辛": "정재", "壬": "편관", "癸": "정관", "寅": "편인", "卯": "정인", "巳": "비견", "午": "겁재", "辰": "식신", "戌": "식신", "丑": "상관", "未": "상관", "申": "편재", "酉": "정재", "亥": "편관", "子": "정관" },
  "丁": { "甲": "정인", "乙": "편인", "丙": "겁재", "丁": "비견", "戊": "상관", "己": "식신", "庚": "정재", "辛": "편재", "壬": "정관", "癸": "편관", "寅": "정인", "卯": "편인", "巳": "겁재", "午": "비견", "辰": "상관", "戌": "상관", "丑": "식신", "未": "식신", "申": "정재", "酉": "편재", "亥": "정관", "子": "편관" },
  "戊": { "甲": "편관", "乙": "정관", "丙": "편인", "丁": "정인", "戊": "비견", "己": "겁재", "庚": "식신", "辛": "상관", "壬": "편재", "癸": "정재", "寅": "편관", "卯": "정관", "巳": "편인", "午": "정인", "辰": "비견", "戌": "비견", "丑": "겁재", "未": "겁재", "申": "식신", "酉": "상관", "亥": "편재", "子": "정재" },
  "己": { "甲": "정관", "乙": "편관", "丙": "정인", "丁": "편인", "戊": "겁재", "己": "비견", "庚": "상관", "辛": "식신", "壬": "정재", "癸": "편재", "寅": "정관", "卯": "편관", "巳": "정인", "午": "편인", "辰": "겁재", "戌": "겁재", "丑": "비견", "未": "비견", "申": "상관", "酉": "식신", "亥": "정재", "子": "편재" },
  "庚": { "甲": "편재", "乙": "정재", "丙": "편관", "丁": "정관", "戊": "편인", "己": "정인", "庚": "비견", "辛": "겁재", "壬": "식신", "癸": "상관", "寅": "편재", "卯": "정재", "巳": "편관", "午": "정관", "辰": "편인", "戌": "편인", "丑": "정인", "未": "정인", "申": "비견", "酉": "겁재", "亥": "식신", "子": "상관" },
  "辛": { "甲": "정재", "乙": "편재", "丙": "정관", "丁": "편관", "戊": "정인", "己": "편인", "庚": "겁재", "辛": "비견", "壬": "상관", "癸": "식신", "寅": "정재", "卯": "편재", "巳": "정관", "午": "편관", "辰": "정인", "戌": "정인", "丑": "편인", "未": "편인", "申": "겁재", "酉": "비견", "亥": "상관", "子": "식신" },
  "壬": { "甲": "식신", "乙": "상관", "丙": "편재", "丁": "정재", "戊": "편관", "己": "정관", "庚": "편인", "辛": "정인", "壬": "비견", "癸": "겁재", "寅": "식신", "卯": "상관", "巳": "편재", "午": "정재", "辰": "편관", "戌": "편관", "丑": "정관", "未": "정관", "申": "편인", "酉": "정인", "亥": "비견", "子": "겁재" },
  "癸": { "甲": "상관", "乙": "식신", "丙": "정재", "丁": "편재", "戊": "정관", "己": "편관", "庚": "정인", "辛": "편인", "壬": "겁재", "癸": "비견", "寅": "상관", "卯": "식신", "巳": "정재", "午": "편재", "辰": "정관", "戌": "정관", "丑": "편관", "未": "편관", "申": "정인", "酉": "편인", "亥": "겁재", "子": "비견" }
};

export const TWELVE_UNSEONG: Record<string, Record<string, string>> = {
  "甲": { "亥": "장생(長生)", "子": "목욕(沐浴)", "丑": "관대(冠帶)", "寅": "건록(建祿)", "卯": "제왕(帝旺)", "辰": "쇠(衰)", "巳": "병(病)", "午": "사(死)", "未": "묘(墓)", "申": "절(絶)", "酉": "태(胎)", "戌": "양(養)" },
  "乙": { "午": "장생(長生)", "巳": "목욕(沐浴)", "辰": "관대(冠帶)", "卯": "건록(建祿)", "寅": "제왕(帝旺)", "丑": "쇠(衰)", "子": "병(病)", "亥": "사(死)", "戌": "묘(墓)", "酉": "절(絶)", "申": "태(胎)", "未": "양(養)" },
  "丙": { "寅": "장생(長生)", "卯": "목욕(沐浴)", "辰": "관대(冠帶)", "巳": "건록(建祿)", "午": "제왕(帝旺)", "未": "쇠(衰)", "申": "병(病)", "酉": "사(死)", "戌": "묘(墓)", "亥": "절(絶)", "子": "태(胎)", "丑": "양(養)" },
  "丁": { "酉": "장생(長生)", "申": "목욕(沐浴)", "未": "관대(冠帶)", "午": "건록(建祿)", "巳": "제왕(帝旺)", "辰": "쇠(衰)", "卯": "병(病)", "寅": "사(死)", "丑": "묘(墓)", "子": "절(絶)", "亥": "태(胎)", "戌": "양(養)" },
  "戊": { "寅": "장생(長生)", "卯": "목욕(沐浴)", "辰": "관대(冠帶)", "巳": "건록(建祿)", "午": "제왕(帝旺)", "未": "쇠(衰)", "申": "병(病)", "酉": "사(死)", "戌": "묘(墓)", "亥": "절(絶)", "子": "태(胎)", "丑": "양(養)" },
  "己": { "酉": "장생(長生)", "申": "목욕(沐浴)", "未": "관대(冠帶)", "午": "건록(建祿)", "巳": "제왕(帝旺)", "辰": "쇠(衰)", "卯": "병(病)", "寅": "사(死)", "丑": "묘(墓)", "子": "절(絶)", "亥": "태(胎)", "戌": "양(養)" },
  "庚": { "巳": "장생(長生)", "午": "목욕(沐浴)", "未": "관대(冠帶)", "申": "건록(建祿)", "酉": "제왕(帝旺)", "戌": "쇠(衰)", "亥": "병(病)", "子": "사(死)", "丑": "묘(墓)", "寅": "절(絶)", "卯": "태(胎)", "辰": "양(養)" },
  "辛": { "子": "장생(長生)", "亥": "목욕(沐浴)", "戌": "관대(冠帶)", "酉": "건록(建祿)", "申": "제왕(帝旺)", "未": "쇠(衰)", "午": "병(病)", "巳": "사(死)", "辰": "묘(墓)", "卯": "절(絶)", "寅": "태(胎)", "丑": "양(養)" },
  "壬": { "申": "장생(長生)", "酉": "목욕(沐浴)", "戌": "관대(冠帶)", "亥": "건록(建祿)", "子": "제왕(帝旺)", "丑": "쇠(衰)", "寅": "병(病)", "卯": "사(死)", "辰": "묘(墓)", "巳": "절(絶)", "午": "태(胎)", "未": "양(養)" },
  "癸": { "卯": "장생(長生)", "寅": "목욕(沐浴)", "丑": "관대(冠帶)", "子": "건록(建祿)", "亥": "제왕(帝旺)", "戌": "쇠(衰)", "酉": "병(病)", "申": "사(死)", "未": "묘(墓)", "午": "절(絶)", "巳": "태(胎)", "辰": "양(養)" }
};

export const NAPEUM_OHANG: Record<string, string> = {
  "甲子": "해중금(海中金)", "乙丑": "해중금(海中金)", "丙寅": "노중화(爐中火)", "丁卯": "노중화(爐中火)",
  "戊辰": "대림목(大林木)", "己巳": "대림목(大林木)", "庚午": "노방토(路傍土)", "辛未": "노방토(路傍土)",
  "壬申": "검봉금(劍鋒金)", "癸酉": "검봉금(劍鋒金)", "甲戌": "산두화(山頭火)", "乙亥": "산두화(山頭火)",
  "丙子": "간하수(澗下水)", "丁丑": "간하수(澗下水)", "戊寅": "성두토(城頭土)", "己卯": "성두토(城頭土)",
  "庚辰": "백랍금(白蠟金)", "辛巳": "백랍금(白蠟金)", "壬午": "양류목(楊柳木)", "癸未": "양류목(楊柳木)",
  "甲申": "천중수(泉中水)", "乙酉": "천중수(泉中水)", "丙戌": "옥상토(屋上土)", "丁亥": "옥상토(屋上土)",
  "戊子": "벽력화(霹靂火)", "己丑": "벽력화(霹靂火)", "庚寅": "송백목(松柏木)", "辛卯": "송백목(松柏木)",
  "壬辰": "장류수(長流水)", "癸巳": "장류수(長流水)", "甲午": "사중금(砂中金)", "乙未": "사중금(砂中金)",
  "丙申": "산하화(山下火)", "丁酉": "산하화(山下火)", "戊戌": "평지목(平地木)", "己亥": "평지목(平地木)",
  "庚子": "벽상토(壁上土)", "辛丑": "벽상토(壁上土)", "壬寅": "금박금(金箔金)", "癸卯": "금박금(金箔金)",
  "甲辰": "복등화(覆燈火)", "乙巳": "복등화(覆燈火)", "丙午": "천하수(天河水)", "丁未": "천하수(天河水)",
  "戊申": "대역토(大驛土)", "己酉": "대역토(大驛土)", "庚戌": "차천금(釵釧金)", "辛亥": "차천금(釵釧金)",
  "壬子": "상자목(桑柘木)", "癸丑": "상자목(桑柘木)", "甲寅": "대계수(大溪水)", "乙卯": "대계수(大溪水)",
  "丙辰": "사중토(砂中土)", "丁巳": "사중토(砂中土)", "戊午": "천상화(天上火)", "己未": "천상화(天上火)",
  "庚申": "석류목(石榴木)", "辛酉": "석류목(石榴木)", "壬戌": "대해수(大海水)", "癸亥": "대해수(大海水)"
};

export function getSamhapShinsal(baseBranch: string, targetBranch: string): string {
  let startBranch = "申";
  if (["申", "子", "辰"].includes(baseBranch)) startBranch = "申";
  else if (["寅", "午", "戌"].includes(baseBranch)) startBranch = "寅";
  else if (["巳", "酉", "丑"].includes(baseBranch)) startBranch = "巳";
  else if (["亥", "卯", "未"].includes(baseBranch)) startBranch = "亥";

  const branchOrder = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const startIdx = branchOrder.indexOf(startBranch);
  const targetIdx = branchOrder.indexOf(targetBranch);
  if (startIdx === -1 || targetIdx === -1) return "장성살(將星)";
  const diff = (targetIdx - startIdx + 12) % 12;

  const names = [
    "지살(地煞)",
    "년살(도화/年煞)",
    "월살(月煞)",
    "망신살(亡身)",
    "장성살(將星)",
    "반안살(攀鞍)",
    "역마살(驛馬)",
    "육해살(六害)",
    "화개살(華蓋)",
    "겁살(劫煞)",
    "재살(수옥/災煞)",
    "천살(天煞)"
  ];
  return names[diff] || "길신";
}

export function getGongmang(stem: string, branch: string): { hanja: string; korean: string } {
  const stems = [...HEAVENLY_STEMS];
  const branches = [...EARTHLY_BRANCHES];
  const sIdx = stems.indexOf(stem as any);
  const bIdx = branches.indexOf(branch as any);
  if (sIdx === -1 || bIdx === -1) return { hanja: "子丑", korean: "자축" };
  const startBranchIdx = (bIdx - sIdx + 12) % 12;
  const gm1 = branches[(startBranchIdx + 10) % 12];
  const gm2 = branches[(startBranchIdx + 11) % 12];
  return {
    hanja: `${gm1}${gm2}`,
    korean: `${BRANCH_KOREAN[gm1] || ""}${BRANCH_KOREAN[gm2] || ""}`
  };
}

export function getSamjaeInfo(yearBranch: string): { status: string; years: string; remedy: string } {
  const branch = yearBranch;
  if (["申", "子", "辰"].includes(branch)) {
    return {
      status: "삼재 평온기 (삼재 무관)",
      years: "다음 삼재 도래 주기: 2034년(갑인년 들삼재) ~ 2036년(병진년 날삼재)",
      remedy: "현재 삼재의 영향권에서 완전히 벗어나 생기(生氣)가 왕성한 시기입니다. 사업 확장이나 새로운 자격 취득, 재테크 추진에 매우 길합니다."
    };
  } else if (["寅", "午", "戌"].includes(branch)) {
    return {
      status: "삼재 평온기 (운기 상승)",
      years: "지난 삼재: 2016~2018년 / 다음 삼재 주기: 2028년(무신년 들삼재) ~ 2030년(경술년 날삼재)",
      remedy: "현재는 삼재 액운이 전혀 없으며, 본인의 주도력과 인맥을 적극적으로 넓혀갈 최고의 도약기입니다."
    };
  } else if (["巳", "酉", "丑"].includes(branch)) {
    return {
      status: "삼재 평온기 (안정적 결실기)",
      years: "지난 삼재: 2019~2021년 / 다음 삼재 주기: 2031년(신해년 들삼재) ~ 2033년(계축년 날삼재)",
      remedy: "내실을 다지고 저축과 실력을 쌓기 유리한 무풍지대입니다. 마음의 여유를 갖고 장기 플랜을 세우세요."
    };
  } else {
    return {
      status: "현재 2026년 '눌삼재(머무는 삼재)' 기간",
      years: "2025년(을사년 들삼재) → 2026년(병오년 눌삼재) → 2027년(정미년 날삼재)",
      remedy: "눌삼재는 액운이 머무르며 내면을 시험하는 시기이므로 무리한 보증, 성급한 동업, 무분별한 투자는 신중히 검토하십시오. 매사 돌다리도 두드려보고 건너는 지혜와 선행·기부로 액운을 능히 복으로 바꿀 수 있습니다."
    };
  }
}

// Historical South Korea Daylight Saving Time (KST summer time) ranges (inclusive local clock dates)
const KOREA_DST_RANGES: Array<[number, number, number, number, number, number]> = [
  [1948, 6, 1, 1948, 9, 12],
  [1949, 4, 3, 1949, 9, 10],
  [1950, 4, 1, 1950, 9, 9],
  [1951, 5, 6, 1951, 9, 8],
  [1955, 5, 5, 1955, 9, 8],
  [1956, 5, 20, 1956, 9, 29],
  [1957, 5, 5, 1957, 9, 21],
  [1958, 5, 4, 1958, 9, 20],
  [1959, 5, 3, 1959, 9, 19],
  [1960, 5, 1, 1960, 9, 17],
  [1987, 5, 10, 1987, 10, 10],
  [1988, 5, 8, 1988, 10, 8]
];

function isKoreaDST(y: number, m: number, d: number): boolean {
  const val = y * 10000 + m * 100 + d;
  return KOREA_DST_RANGES.some(([sy, sm, sd, ey, em, ed]) => {
    const startVal = sy * 10000 + sm * 100 + sd;
    const endVal = ey * 10000 + em * 100 + ed;
    return val >= startVal && val <= endVal;
  });
}

// Korea used UTC+8.5 (127.5E meridian) between 1954-03-21 and 1961-08-09
function isKoreaUtc85(y: number, m: number, d: number): boolean {
  const val = y * 10000 + m * 100 + d;
  return val >= 19540321 && val <= 19610809;
}

// Map solar term names from lunar-typescript to monthOrder (0=寅, 1=卯, ..., 11=丑) and branch
const SOLAR_TERM_JIE_MAP: Array<{ keys: string[]; nameKo: string; monthOrder: number; branch: string }> = [
  { keys: ["立春", "LI_CHUN"], nameKo: "입춘", monthOrder: 0, branch: "寅" },
  { keys: ["惊蛰", "驚蟄", "JING_ZHE"], nameKo: "경칩", monthOrder: 1, branch: "卯" },
  { keys: ["清明", "QING_MING"], nameKo: "청명", monthOrder: 2, branch: "辰" },
  { keys: ["立夏", "LI_XIA"], nameKo: "입하", monthOrder: 3, branch: "巳" },
  { keys: ["芒种", "芒種", "MANG_ZHONG"], nameKo: "망종", monthOrder: 4, branch: "午" },
  { keys: ["小暑", "XIAO_SHU"], nameKo: "소서", monthOrder: 5, branch: "未" },
  { keys: ["立秋", "LI_QIU"], nameKo: "입추", monthOrder: 6, branch: "申" },
  { keys: ["白露", "BAI_LU"], nameKo: "백로", monthOrder: 7, branch: "酉" },
  { keys: ["寒露", "HAN_LU"], nameKo: "한로", monthOrder: 8, branch: "戌" },
  { keys: ["立冬", "LI_DONG"], nameKo: "입동", monthOrder: 9, branch: "亥" },
  { keys: ["大雪", "DA_XUE"], nameKo: "대설", monthOrder: 10, branch: "子" },
  { keys: ["小寒", "XIAO_HAN"], nameKo: "소한", monthOrder: 11, branch: "丑" }
];

interface JieInstant {
  nameKo: string;
  monthOrder: number;
  branch: string;
  utcMs: number;
  year: number;
}

function getJieTableAroundYear(targetYear: number): JieInstant[] {
  const entries: JieInstant[] = [];
  const seenMs = new Set<number>();

  for (const y of [targetYear - 1, targetYear, targetYear + 1]) {
    const sample = Solar.fromYmdHms(y, 6, 15, 12, 0, 0).getLunar().getJieQiTable();
    for (const [k, v] of Object.entries(sample)) {
      const def = SOLAR_TERM_JIE_MAP.find((item) => item.keys.includes(k));
      if (!def || !v) continue;

      // lunar-typescript provides Solar Term times in UTC+8 (Beijing Time)
      const utcMs = Date.UTC(v.getYear(), v.getMonth() - 1, v.getDay(), v.getHour(), v.getMinute(), v.getSecond()) - 8 * 3600 * 1000;
      if (!seenMs.has(utcMs)) {
        seenMs.add(utcMs);
        entries.push({
          nameKo: def.nameKo,
          monthOrder: def.monthOrder,
          branch: def.branch,
          utcMs,
          year: v.getYear()
        });
      }
    }
  }

  entries.sort((a, b) => a.utcMs - b.utcMs);
  return entries;
}

function normalizeStem(ch: string): string {
  if (HEAVENLY_STEMS.includes(ch as any)) return ch;
  return KOREAN_TO_STEM[ch] || "庚";
}

function normalizeBranch(ch: string): string {
  if (EARTHLY_BRANCHES.includes(ch as any)) return ch;
  return KOREAN_TO_BRANCH[ch] || "午";
}

export interface ManseryeokChartResult {
  sajuChart: {
    profile: {
      birthYear: number;
      birthMonth: number;
      birthDay: number;
      birthHour: number;
      birthMinute: number;
      unknownHour: boolean;
      isSolar: boolean;
      isLeapMonth: boolean;
      isMale: boolean;
      koreanAge: number;
      westernAge: number;
      solarDate: string;
      lunarDate: string;
      standardTimeCorrection: string;
      summerTimeApplied: boolean;
      solarTermContext: string;
    };
    gongmang: {
      yearGongmang: { hanja: string; korean: string };
      dayGongmang: { hanja: string; korean: string };
    };
    pillars: Array<{
      label: string;
      heavenlyStem: string;
      heavenlyStemTenGod: string;
      earthlyBranch: string;
      earthlyBranchTenGod: string;
      hiddenStems: string[];
      hiddenStemsDetailed: Array<{ stem: string; days: number; role: string }>;
      twelveUnseong: string;
      yearShinsal: string;
      dayShinsal: string;
      napeum: string;
    }>;
    elements: { wood: number; fire: number; earth: number; metal: number; water: number };
    daeunStartAge: number;
    daeunList: Array<{
      age: number;
      startYear: number;
      heavenlyStem: string;
      heavenlyStemTenGod: string;
      earthlyBranch: string;
      earthlyBranchTenGod: string;
      twelveUnseong: string;
      yearShinsal: string;
      dayShinsal: string;
      isActive: boolean;
      seunList: Array<{
        year: number;
        age: number;
        heavenlyStem: string;
        heavenlyStemTenGod: string;
        earthlyBranch: string;
        earthlyBranchTenGod: string;
        twelveUnseong: string;
        yearShinsal: string;
        isCurrentYear: boolean;
      }>;
    }>;
    sajuShinsalList: Array<{ pillar: string; shinsal: string[] }>;
  };
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string;
  hourBranch: string;
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  samjae: { status: string; years: string; remedy: string };
  clientQuestion: string;
}

export function calculateManseryeok(prompt: string): ManseryeokChartResult {
  let inputYear = 1990;
  let inputMonth = 5;
  let inputDay = 15;
  let hour = 12;
  let minute = 0;
  let unknownHour = false;
  let isSolar = true;
  let isLeapMonth = false;
  let isMale = true;

  const yearMatch = prompt.match(/(\d{4})년/);
  if (yearMatch) inputYear = parseInt(yearMatch[1], 10);
  const monthMatch = prompt.match(/(\d{1,2})월/);
  if (monthMatch) inputMonth = parseInt(monthMatch[1], 10);
  const dayMatch = prompt.match(/(\d{1,2})일/);
  if (dayMatch) inputDay = parseInt(dayMatch[1], 10);

  if (!yearMatch || !monthMatch || !dayMatch) {
    const dashDateMatch = prompt.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (dashDateMatch) {
      inputYear = parseInt(dashDateMatch[1], 10);
      inputMonth = parseInt(dashDateMatch[2], 10);
      inputDay = parseInt(dashDateMatch[3], 10);
    }
  }

  if (prompt.includes("시간모름") || prompt.includes("시간 모름")) {
    unknownHour = true;
    hour = 12;
    minute = 0;
  } else {
    const timeDetailMatch = prompt.match(/(\d{1,2})시(?:\s*(\d{1,2})분)?/);
    if (timeDetailMatch) {
      hour = parseInt(timeDetailMatch[1], 10);
      if (timeDetailMatch[2]) minute = parseInt(timeDetailMatch[2], 10);
    } else {
      const colonMatch = prompt.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$|생)/);
      if (colonMatch) {
        hour = parseInt(colonMatch[1], 10);
        minute = parseInt(colonMatch[2], 10);
      } else {
        // Explicit traditional hour-branch mentions only (using safe word boundaries)
        const branchTimeMatch = prompt.match(/(?:^|[\s,(])(자시|축시|인시|묘시|진시|사시|오시|미시|신시|유시|술시|해시)(?:$|[\s),생])/);
        const bt = branchTimeMatch?.[1];
        if (bt === "자시") { hour = 0; minute = 0; }
        else if (bt === "축시") { hour = 2; minute = 0; }
        else if (bt === "인시") { hour = 4; minute = 0; }
        else if (bt === "묘시") { hour = 6; minute = 0; }
        else if (bt === "진시") { hour = 8; minute = 0; }
        else if (bt === "사시") { hour = 10; minute = 0; }
        else if (bt === "오시") { hour = 12; minute = 0; }
        else if (bt === "미시") { hour = 14; minute = 0; }
        else if (bt === "신시") { hour = 16; minute = 0; }
        else if (bt === "유시") { hour = 18; minute = 0; }
        else if (bt === "술시") { hour = 20; minute = 0; }
        else if (bt === "해시") { hour = 22; minute = 0; }
      }
    }
  }

  if (prompt.includes("음력")) isSolar = false;
  if (prompt.includes("윤달")) isLeapMonth = true;
  if (prompt.includes("여성") || prompt.includes("여자") || prompt.includes("여아")) isMale = false;
  if (prompt.includes("남성") || prompt.includes("남자") || prompt.includes("남아")) isMale = true;

  const isDirectMode = prompt.includes("사주명식 직접 입력");

  let solarYear = inputYear;
  let solarMonth = inputMonth;
  let solarDay = inputDay;
  let lunarYear = inputYear;
  let lunarMonth = inputMonth;
  let lunarDay = inputDay;
  let lunarLeapDisplay = isLeapMonth;

  if (!isDirectMode) {
    const cal = new KoreanLunarCalendar();
    if (!isSolar) {
      // Convert Korean Lunar date -> Gregorian Solar date
      let ok = cal.setLunarDate(inputYear, inputMonth, inputDay, isLeapMonth);
      if (!ok && isLeapMonth) {
        // Fallback to non-leap if user checked leap on a month without leap
        ok = cal.setLunarDate(inputYear, inputMonth, inputDay, false);
      }
      if (ok) {
        const s = cal.getSolarCalendar();
        solarYear = s.year;
        solarMonth = s.month;
        solarDay = s.day;
        const l = cal.getLunarCalendar();
        lunarYear = l.year;
        lunarMonth = l.month;
        lunarDay = l.day;
        lunarLeapDisplay = Boolean(l.intercalation);
      } else {
        // Fallback outside 1391~2050 using lunar-typescript
        try {
          const lObj = Lunar.fromYmd(inputYear, isLeapMonth ? -inputMonth : inputMonth, inputDay);
          const sObj = lObj.getSolar();
          solarYear = sObj.getYear();
          solarMonth = sObj.getMonth();
          solarDay = sObj.getDay();
        } catch {
          // Keep raw input if invalid date
        }
      }
    } else {
      // Convert Gregorian Solar date -> Korean Lunar date for accurate profile display
      const ok = cal.setSolarDate(inputYear, inputMonth, inputDay);
      if (ok) {
        const l = cal.getLunarCalendar();
        lunarYear = l.year;
        lunarMonth = l.month;
        lunarDay = l.day;
        lunarLeapDisplay = Boolean(l.intercalation);
      } else {
        try {
          const lObj = Solar.fromYmd(inputYear, inputMonth, inputDay).getLunar();
          lunarYear = lObj.getYear();
          lunarMonth = Math.abs(lObj.getMonth());
          lunarDay = lObj.getDay();
          lunarLeapDisplay = lObj.getMonth() < 0;
        } catch {
          // Fallback
        }
      }
    }
  }

  // Standard Time Correction & DST determination
  const dstApplied = isKoreaDST(solarYear, solarMonth, solarDay);
  const utc85 = isKoreaUtc85(solarYear, solarMonth, solarDay);
  const meridianCorrectionMin = utc85 ? 0 : -30;
  const dstCorrectionMin = dstApplied ? -60 : 0;
  const totalSolarCorrectionMin = meridianCorrectionMin + dstCorrectionMin;

  // Exact astronomical UTC instant of birth
  const birthStandardUtcOffsetMin = (utc85 ? 8.5 : 9) * 60 + (dstApplied ? 60 : 0);
  const birthUtcMs =
    Date.UTC(solarYear, solarMonth - 1, solarDay, hour, minute, 0) -
    birthStandardUtcOffsetMin * 60000;

  let yearStem = "庚", yearBranch = "午";
  let monthStem = "辛", monthBranch = "巳";
  let dayStem = "庚", dayBranch = "午";
  let hourStem = "癸", hourBranch = "未";
  let daeunStartAge = 5;
  let solarTermContext = "절기 기준 정밀 산출";

  const currentYear = 2026;
  const sajuBaseYear = solarYear;
  const currentAge = currentYear - sajuBaseYear + 1;

  if (isDirectMode) {
    const directMatch = prompt.match(
      /\[년주:\s*([가-힣\w]{2}),\s*월주:\s*([가-힣\w]{2}),\s*일주:\s*([가-힣\w]{2}),\s*시주:\s*([가-힣\w]{2})\]/
    );
    if (directMatch) {
      yearStem = normalizeStem(directMatch[1][0]);
      yearBranch = normalizeBranch(directMatch[1][1]);
      monthStem = normalizeStem(directMatch[2][0]);
      monthBranch = normalizeBranch(directMatch[2][1]);
      dayStem = normalizeStem(directMatch[3][0]);
      dayBranch = normalizeBranch(directMatch[3][1]);
      hourStem = normalizeStem(directMatch[4][0]);
      hourBranch = normalizeBranch(directMatch[4][1]);
    }
    const directBirthMatch = prompt.match(/출생년도:\s*(\d{4})년/);
    if (directBirthMatch) {
      solarYear = parseInt(directBirthMatch[1], 10);
      lunarYear = solarYear;
    }
    daeunStartAge = 5;
    solarTermContext = "사용자 직접 입력 명식 기준";
  } else {
    // 1. Exact Astronomical Solar Terms (24절기 중 12절 입절시각 UTC)
    const jieList = getJieTableAroundYear(solarYear);

    // Find previous and next Jie around exact birth UTC instant
    let prevTerm = jieList[0];
    let nextTerm = jieList[jieList.length - 1];
    for (let i = 0; i < jieList.length; i++) {
      if (jieList[i].utcMs <= birthUtcMs) {
        prevTerm = jieList[i];
      } else {
        nextTerm = jieList[i];
        break;
      }
    }

    // Determine exact Ipchun (立春) for solarYear
    const ipchunThisYear = jieList.find((t) => t.nameKo === "입춘" && t.year === solarYear);
    const sajuYear = ipchunThisYear && birthUtcMs < ipchunThisYear.utcMs ? solarYear - 1 : solarYear;

    // Year Pillar (년주)
    const yearIdx = ((sajuYear - 4) % 60 + 60) % 60;
    yearStem = HEAVENLY_STEMS[yearIdx % 10];
    yearBranch = EARTHLY_BRANCHES[yearIdx % 12];

    // Month Pillar (월주) via Five Tigers (오호둔월법)
    monthBranch = prevTerm.branch;
    const yStemIdx = HEAVENLY_STEMS.indexOf(yearStem as any);
    const startMonthStemIdx = ((yStemIdx % 5) * 2 + 2) % 10;
    monthStem = HEAVENLY_STEMS[(startMonthStemIdx + prevTerm.monthOrder) % 10];

    // 2. Day & Hour Pillar using Adjusted Solar Local Time + 정자시 (23:00 진태양시 = 다음날 자시 시작)
    const localClockMs = Date.UTC(solarYear, solarMonth - 1, solarDay, hour, minute, 0);
    const trueSolarLocalMs = localClockMs + totalSolarCorrectionMin * 60000;
    const jeongjasiMs = trueSolarLocalMs + 60 * 60000; // shift 23:00..00:59 -> 00:00..01:59 next day
    const jjDate = new Date(jeongjasiMs);

    const dYear = jjDate.getUTCFullYear();
    const dMonth = jjDate.getUTCMonth() + 1;
    const dDay = jjDate.getUTCDate();

    const daysSinceEpoch = Math.floor(Date.UTC(dYear, dMonth - 1, dDay) / 86400000);
    const dayIdx = ((daysSinceEpoch + 17) % 60 + 60) % 60;
    dayStem = HEAVENLY_STEMS[dayIdx % 10];
    dayBranch = EARTHLY_BRANCHES[dayIdx % 12];

    // Hour Pillar via Five Rats (오서둔시법)
    const hBranchIdx = Math.floor(jjDate.getUTCHours() / 2);
    hourBranch = EARTHLY_BRANCHES[hBranchIdx];
    const dStemIdx = HEAVENLY_STEMS.indexOf(dayStem as any);
    const startHourStemIdx = ((dStemIdx % 5) * 2) % 10;
    hourStem = HEAVENLY_STEMS[(startHourStemIdx + hBranchIdx) % 10];

    // 3. Daeun Start Age (대운수): exact time distance to next/prev solar term / 3 days
    const isYangYear = ["甲", "丙", "戊", "庚", "壬"].includes(yearStem);
    const forward = isMale ? isYangYear : !isYangYear;
    const diffDays = forward
      ? (nextTerm.utcMs - birthUtcMs) / 86400000
      : (birthUtcMs - prevTerm.utcMs) / 86400000;
    daeunStartAge = Math.max(1, Math.min(10, Math.round(diffDays / 3)));

    const prevKst = new Date(prevTerm.utcMs + 9 * 3600000);
    solarTermContext = `${prevTerm.nameKo} 절입(${prevKst.getUTCFullYear()}-${String(prevKst.getUTCMonth() + 1).padStart(2, "0")}-${String(prevKst.getUTCDate()).padStart(2, "0")} ${String(prevKst.getUTCHours()).padStart(2, "0")}:${String(prevKst.getUTCMinutes()).padStart(2, "0")} KST) 이후 / ${forward ? "순행" : "역행"} 대운수 ${daeunStartAge}세`;
  }

  // Elements tally (exclude hour pillar only visually if unknownHour? No, chart expects 4 pillars; keep standard 8-char or note unknownHour in profile)
  const allStems = [hourStem, dayStem, monthStem, yearStem];
  const allBranches = [hourBranch, dayBranch, monthBranch, yearBranch];
  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  allStems.forEach((s) => {
    const el = STEM_ELEMENT[s];
    if (el) elements[el]++;
  });
  allBranches.forEach((b) => {
    const el = BRANCH_ELEMENT[b];
    if (el) elements[el]++;
  });

  const getTenGod = (target: string) => (TEN_GODS_MAP[dayStem] && TEN_GODS_MAP[dayStem][target]) || "비견";
  const get12Unseong = (branch: string) => (TWELVE_UNSEONG[dayStem] && TWELVE_UNSEONG[dayStem][branch]) || "건록(建祿)";

  const yearGongmang = getGongmang(yearStem, yearBranch);
  const dayGongmang = getGongmang(dayStem, dayBranch);

  const pillars = [
    {
      label: unknownHour ? "시주(추정)" : "시주",
      heavenlyStem: hourStem,
      heavenlyStemTenGod: getTenGod(hourStem),
      earthlyBranch: hourBranch,
      earthlyBranchTenGod: getTenGod(hourBranch),
      hiddenStems: HIDDEN_STEMS[hourBranch] || ["戊", "丙", "甲"],
      hiddenStemsDetailed: HIDDEN_STEMS_DETAILED[hourBranch] || [],
      twelveUnseong: get12Unseong(hourBranch),
      yearShinsal: getSamhapShinsal(yearBranch, hourBranch),
      dayShinsal: getSamhapShinsal(dayBranch, hourBranch),
      napeum: NAPEUM_OHANG[`${hourStem}${hourBranch}`] || "대계수(大溪水)"
    },
    {
      label: "일주",
      heavenlyStem: dayStem,
      heavenlyStemTenGod: "일원(본인)",
      earthlyBranch: dayBranch,
      earthlyBranchTenGod: getTenGod(dayBranch),
      hiddenStems: HIDDEN_STEMS[dayBranch] || ["戊", "甲", "壬"],
      hiddenStemsDetailed: HIDDEN_STEMS_DETAILED[dayBranch] || [],
      twelveUnseong: get12Unseong(dayBranch),
      yearShinsal: getSamhapShinsal(yearBranch, dayBranch),
      dayShinsal: getSamhapShinsal(dayBranch, dayBranch),
      napeum: NAPEUM_OHANG[`${dayStem}${dayBranch}`] || "대해수(大海水)"
    },
    {
      label: "월주",
      heavenlyStem: monthStem,
      heavenlyStemTenGod: getTenGod(monthStem),
      earthlyBranch: monthBranch,
      earthlyBranchTenGod: getTenGod(monthBranch),
      hiddenStems: HIDDEN_STEMS[monthBranch] || ["戊", "甲", "壬"],
      hiddenStemsDetailed: HIDDEN_STEMS_DETAILED[monthBranch] || [],
      twelveUnseong: get12Unseong(monthBranch),
      yearShinsal: getSamhapShinsal(yearBranch, monthBranch),
      dayShinsal: getSamhapShinsal(dayBranch, monthBranch),
      napeum: NAPEUM_OHANG[`${monthStem}${monthBranch}`] || "대해수(大海水)"
    },
    {
      label: "년주",
      heavenlyStem: yearStem,
      heavenlyStemTenGod: getTenGod(yearStem),
      earthlyBranch: yearBranch,
      earthlyBranchTenGod: getTenGod(yearBranch),
      hiddenStems: HIDDEN_STEMS[yearBranch] || ["甲", "乙"],
      hiddenStemsDetailed: HIDDEN_STEMS_DETAILED[yearBranch] || [],
      twelveUnseong: get12Unseong(yearBranch),
      yearShinsal: getSamhapShinsal(yearBranch, yearBranch),
      dayShinsal: getSamhapShinsal(dayBranch, yearBranch),
      napeum: NAPEUM_OHANG[`${yearStem}${yearBranch}`] || "금박금(金箔金)"
    }
  ];

  // Daeun list (10 decades) + Seun (10 years each)
  const isYangYear = ["甲", "丙", "戊", "庚", "壬"].includes(yearStem);
  const forward = isMale ? isYangYear : !isYangYear;
  const daeunList = [];
  const stemIdx = HEAVENLY_STEMS.indexOf(monthStem as any);
  const branchIdx = EARTHLY_BRANCHES.indexOf(monthBranch as any);
  const displayKoreanAge = Math.max(1, currentYear - solarYear + 1);

  for (let i = 0; i < 10; i++) {
    const age = daeunStartAge + i * 10;
    const startYear = solarYear + age - 1;
    const dStem = HEAVENLY_STEMS[(stemIdx + (forward ? i + 1 : -i - 1 + 60)) % 10];
    const dBranch = EARTHLY_BRANCHES[(branchIdx + (forward ? i + 1 : -i - 1 + 60)) % 12];

    const seunList = [];
    for (let sy = 0; sy < 10; sy++) {
      const seunYear = startYear + sy;
      const seunAge = age + sy;
      const sYearIdx = ((seunYear - 4) % 60 + 60) % 60;
      const sStem = HEAVENLY_STEMS[sYearIdx % 10];
      const sBranch = EARTHLY_BRANCHES[sYearIdx % 12];
      seunList.push({
        year: seunYear,
        age: seunAge,
        heavenlyStem: sStem,
        heavenlyStemTenGod: getTenGod(sStem),
        earthlyBranch: sBranch,
        earthlyBranchTenGod: getTenGod(sBranch),
        twelveUnseong: get12Unseong(sBranch),
        yearShinsal: getSamhapShinsal(yearBranch, sBranch),
        isCurrentYear: seunYear === currentYear
      });
    }

    daeunList.push({
      age,
      startYear,
      heavenlyStem: dStem,
      heavenlyStemTenGod: getTenGod(dStem),
      earthlyBranch: dBranch,
      earthlyBranchTenGod: getTenGod(dBranch),
      twelveUnseong: get12Unseong(dBranch),
      yearShinsal: getSamhapShinsal(yearBranch, dBranch),
      dayShinsal: getSamhapShinsal(dayBranch, dBranch),
      isActive: displayKoreanAge >= age && displayKoreanAge < age + 10,
      seunList
    });
  }

  const sajuShinsalList = [
    { pillar: "년주", shinsal: [pillars[3].yearShinsal, pillars[3].dayShinsal].filter((v, i, a) => a.indexOf(v) === i) },
    { pillar: "월주", shinsal: [pillars[2].yearShinsal, pillars[2].dayShinsal].filter((v, i, a) => a.indexOf(v) === i) },
    { pillar: "일주", shinsal: [pillars[1].yearShinsal, pillars[1].dayShinsal].filter((v, i, a) => a.indexOf(v) === i) },
    { pillar: "시주", shinsal: [pillars[0].yearShinsal, pillars[0].dayShinsal].filter((v, i, a) => a.indexOf(v) === i) }
  ];

  const correctionLabel = utc85
    ? dstApplied
      ? "동경 127.5° 표준시(0분) + 썸머타임(-60분) 보정 적용"
      : "1954~1961년 동경 127.5° 표준시 적용 (0분 보정)"
    : dstApplied
      ? "동경 127.5° 진태양시(-30분) + 썸머타임(-60분) 보정 적용"
      : "동경 127.5° 진태양시 30분 시차 보정 적용 (정자시법)";

  const timeStr = unknownHour
    ? "시간모름(오시 기준)"
    : `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  const clientQMatch = prompt.match(/\[🏛️ 철학관 1:1 맞춤 고객 상담 질의\][\s\S]*?- 고객의 구체적인 상담 질문:\s*"([^"]+)"/);
  const clientQuestion = clientQMatch ? clientQMatch[1] : prompt.includes("상담") ? "고객 맞춤형 심층 상담" : "";

  return {
    sajuChart: {
      profile: {
        birthYear: solarYear,
        birthMonth: solarMonth,
        birthDay: solarDay,
        birthHour: hour,
        birthMinute: minute,
        unknownHour,
        isSolar,
        isLeapMonth: lunarLeapDisplay,
        isMale,
        koreanAge: displayKoreanAge,
        westernAge: Math.max(0, displayKoreanAge - 1),
        solarDate: `양력 ${solarYear}년 ${solarMonth}월 ${solarDay}일 ${timeStr}`,
        lunarDate: `음력 ${lunarYear}년 ${lunarMonth}월 ${lunarDay}일 (${lunarLeapDisplay ? "윤달" : "평달"})`,
        standardTimeCorrection: correctionLabel,
        summerTimeApplied: dstApplied,
        solarTermContext
      },
      gongmang: {
        yearGongmang,
        dayGongmang
      },
      pillars,
      elements,
      daeunStartAge,
      daeunList,
      sajuShinsalList
    },
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch,
    solarYear,
    solarMonth,
    solarDay,
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth: lunarLeapDisplay,
    samjae: getSamjaeInfo(yearBranch),
    clientQuestion
  };
}
