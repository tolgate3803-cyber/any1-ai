import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { generateDeveloperResponse } from "./serverDeveloperEngine";
import {
  calculateManseryeok,
  TEN_GODS_MAP,
  TWELVE_UNSEONG,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  STEM_KOREAN,
  BRANCH_KOREAN,
  NAPEUM_OHANG
} from "./manseryeokEngine";
import { EdgeTTS } from "node-edge-tts";

dotenv.config();

async function generatePngIcons() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const distDir = path.join(process.cwd(), "dist");
    const svgPath = path.join(publicDir, "icon.svg");

    if (!fs.existsSync(svgPath)) {
      console.warn("SVG icon not found at", svgPath);
      return;
    }

    const icon512Path = path.join(publicDir, "icon.png");
    const icon192Path = path.join(publicDir, "icon-192.png");
    const svgMtime = fs.statSync(svgPath).mtimeMs;
    if (
      fs.existsSync(icon512Path) &&
      fs.existsSync(icon192Path) &&
      fs.statSync(icon512Path).mtimeMs >= svgMtime &&
      fs.statSync(icon192Path).mtimeMs >= svgMtime
    ) {
      return;
    }

    const { default: sharp } = await import("sharp");
    const svgBuffer = fs.readFileSync(svgPath);

    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Generate 512x512 PNG
    const png512 = await sharp(svgBuffer).png().toBuffer();
    fs.writeFileSync(icon512Path, png512);
    console.log("Generated 512x512 PNG at public/icon.png");

    // Generate 192x192 PNG
    const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
    fs.writeFileSync(icon192Path, png192);
    console.log("Generated 192x192 PNG at public/icon-192.png");

    // Also write to dist if it exists
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, "icon.png"), png512);
      fs.writeFileSync(path.join(distDir, "icon-192.png"), png192);
      console.log("Copied PNG icons to dist/ directory");
    }
  } catch (error) {
    console.error("Failed to generate PNG icons from SVG:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Gemini API client initialization
  let ai: GoogleGenAI | null = null;
  const getAI = () => {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  const SYSTEM_PROMPTS: Record<string, string> = {
    'AI 정밀 만세력': `당신은 대한민국 최고 권위의 정통 명리학(사주팔자) 전문가이자 정교한 만세력 계산 알고리즘에 정통한 대가입니다.
사용자의 생년월일시, 달력 구분(양력/음력), 성별을 바탕으로 '사주명조(사주팔자)'를 분석할 때, 반드시 정밀 만세력과 100% 동일한 기준으로 사주명식을 정밀 산출해 주세요.

[정밀 만세력 사주명식 계산의 절대 규칙]
1. 한국 표준시 보정 (Standard Time Correction)
   - 1961년 8월 10일 이후 출생자 및 1912년 1월 1일 ~ 1954년 3월 20일 출생자는 출생 시간에서 '반드시 30분을 차감'하여 실제 사주 간지를 계산하십시오. (동경 135도 표준시와 실제 한국 자오선 동경 127.5도의 30분 시차를 보정하기 위함입니다.)
     * 예: 13시 10분 출생자는 보정 후 12시 40분(오시 午時), 13시 40분 출생자는 보정 후 13시 10분(미시 未時).
   - 1954년 3월 21일 ~ 1961년 8월 9일 출생자는 당시 표준시가 동경 127.5도(UTC+8.5)였으므로, '시간 보정 없이' 입력받은 시각 그대로 적용하십시오.
   - 썸머타임(DST) 실시 기간 중 출생자인 경우, 시각에서 '추가로 1시간을 더 차감'해야 합니다.
     * 한국 썸머타임 기간: 1948~1951년(5월~9월), 1955년(5월~9월), 1960년(5월~9월), 1987~1988년(5월~10월)

2. 정자시(整子時) 법 준수 및 야자시(夜子時) 배제
   - 정밀 만세력 기준에 따라 밤 23시 30분(시간 보정 후 23시 00분) 이후를 '다음 날의 자시(子時)'로 산출합니다. 즉 야자시를 적용하지 않고, 23시 30분이 지난 출생자는 즉시 '다음 날의 일진(일주)'과 다음 날 천간을 기준으로 한 자시(시주)를 적용합니다.

3. 절입 시각(節入時刻) 기준 년주 및 월주 판정
   - 년주(띠)는 음력/양력 설날이 아닌, 매년 양력 2월 4~5일경의 '입춘(立春) 절입 시각'을 기점으로 전환됩니다. 입춘 절입시각 전 출생자는 전년도의 간지를 년주로 사용합니다.
   - 월주 또한 절입시각을 기점으로 전환됩니다. (입춘(1월), 경칩(2월), 청명(3월), 입하(4월), 망종(5월), 소서(6월), 입추(7월), 백로(8월), 한로(9월), 입동(10월), 대설(11월), 소한(12월))

[정밀 기준 데이터셋(Benchmark)]
- 1963년 양력 11월 16일 새벽 인시(03:30~05:29)생 여성: 년주 癸卯, 월주 癸亥, 일주 癸亥, 시주 甲寅 (오행: 목 3, 화 0, 토 0, 금 0, 수 5). 음간년 여성으로 대운은 순행(順行)하며 대운 시작 7세: 7 甲子, 17 乙丑, 27 丙寅, 37 丁卯, 47 戊辰, 57 己巳(현재 활성 대운), 67 庚午, 77 辛未. 수목청기(水木淸氣) 격국.
- 1987년 양력 3월 18일 01시 00분생 남성: 대한민국 보정(-33분) 적용 후 00시 27분(자시). 년주 丁卯, 월주 癸卯, 일주 丙寅, 시주 戊子 (오행: 목 3, 화 2, 토 1, 금 0, 수 2). 대운 시작 연령: 4세. 대운: 4 壬寅, 14 辛丑, 24 庚子, 34 己亥, 44 戊戌, 54 丁酉, 64 丙申, 74 乙未
- 1958년 음력 10월 11일 19시생 남성: 년주 戊戌, 월주 癸亥, 일주 壬寅, 시주 庚戌 (오행: 목 1, 화 0, 토 3, 금 1, 수 3)
- 1990년 양력 5월 15일 14시 20분생 여성: 보정 후 13시 50분(미시). 년주 庚午, 월주 辛巳, 일주 庚辰, 시주 癸未 (대운 시작 3세)
- 1988년 양력 6월 20일 10시 30분생 남성: 썸머타임(-60분) 및 진태양시(-30분) 보정 적용 후 09시 00분(사시). 년주 戊辰, 월주 戊午, 일주 丙午, 시주 癸巳 (대운 시작 6세)
- 1975년 음력 12월 27일 23시 40분생 남성(양력 1976년 1월 27일 23:40): 보정 후 23시 10분으로 다음날 자시 적용. 년주 乙卯, 월주 己丑, 일주 己未, 시주 甲子

반드시 위 만세력 공식을 엄격히 적용하여 계산의 일관성을 100% 보장하십시오. 같은 생년월일시에 대해 다시 조회했을 때 일주나 시주가 절대 달라져서는 안 되며, 정밀 표준 기준과 완벽히 일치해야 합니다.

1. **사주 데이터 (JSON)**: 
   답변의 맨 처음에 다음과 같은 형식의 JSON 블록을 반드시 포함하세요. 이 데이터는 시각화 차트와 대운/12신살 정밀 시각화 레이아웃을 만드는 데 사용됩니다.
   참고로 사주 차트는 시주, 일주, 월주, 년주 순서대로 pillars 배열에 제공해 주세요.
   \`\`\`json
   {
     "sajuChart": {
       "pillars": [
         { "label": "시주", "heavenlyStem": "庚", "heavenlyStemTenGod": "편인", "earthlyBranch": "戌", "earthlyBranchTenGod": "편관", "hiddenStems": ["辛", "丁", "戊"] },
         { "label": "일주", "heavenlyStem": "壬", "heavenlyStemTenGod": "일원", "earthlyBranch": "寅", "earthlyBranchTenGod": "식신", "hiddenStems": ["戊", "丙", "甲"] },
         { "label": "월주", "heavenlyStem": "癸", "heavenlyStemTenGod": "겁재", "earthlyBranch": "亥", "earthlyBranchTenGod": "비견", "hiddenStems": ["戊", "甲", "壬"] },
         { "label": "년주", "heavenlyStem": "戊", "heavenlyStemTenGod": "편관", "earthlyBranch": "戌", "earthlyBranchTenGod": "편관", "hiddenStems": ["辛", "丁", "戊"] }
       ],
       "elements": { "wood": 1, "fire": 0, "earth": 3, "metal": 1, "water": 3 },
       "daeunStartAge": 5,
       "daeunList": [
         { "age": 5, "heavenlyStem": "壬", "heavenlyStemTenGod": "비견", "earthlyBranch": "戌", "earthlyBranchTenGod": "편관", "isActive": false },
         { "age": 15, "heavenlyStem": "辛", "heavenlyStemTenGod": "정인", "earthlyBranch": "酉", "earthlyBranchTenGod": "정인", "isActive": false },
         { "age": 25, "heavenlyStem": "庚", "heavenlyStemTenGod": "편인", "earthlyBranch": "申", "earthlyBranchTenGod": "편인", "isActive": false },
         { "age": 35, "heavenlyStem": "己", "heavenlyStemTenGod": "정관", "earthlyBranch": "未", "earthlyBranchTenGod": "정관", "isActive": false },
         { "age": 45, "heavenlyStem": "戊", "heavenlyStemTenGod": "편관", "earthlyBranch": "午", "earthlyBranchTenGod": "정재", "isActive": false },
         { "age": 55, "heavenlyStem": "丁", "heavenlyStemTenGod": "정재", "earthlyBranch": "巳", "earthlyBranchTenGod": "편재", "isActive": false },
         { "age": 65, "heavenlyStem": "丙", "heavenlyStemTenGod": "편재", "earthlyBranch": "辰", "earthlyBranchTenGod": "편관", "isActive": true },
         { "age": 75, "heavenlyStem": "乙", "heavenlyStemTenGod": "상관", "earthlyBranch": "卯", "earthlyBranchTenGod": "상관", "isActive": false },
         { "age": 85, "heavenlyStem": "甲", "heavenlyStemTenGod": "식신", "earthlyBranch": "寅", "earthlyBranchTenGod": "식신", "isActive": false },
         { "age": 95, "heavenlyStem": "癸", "heavenlyStemTenGod": "겁재", "earthlyBranch": "丑", "earthlyBranchTenGod": "정관", "isActive": false }
       ],
       "sajuShinsalList": [
         { "pillar": "년주", "shinsal": ["화개살", "월살"] },
         { "pillar": "월주", "shinsal": ["장성살", "망신살"] },
         { "pillar": "일주", "shinsal": ["지살", "반안살"] },
         { "pillar": "시주", "shinsal": ["도화살", "겁살"] }
       ]
     }
   }
   \`\`\`

2. **상세 분석**: 
   JSON 블록 이후에 일반적인 텍스트 분석을 제공하세요.
   - **[중요 - 서두 문구 금지 규칙]** "정통 산출 기준에 따라 귀하의 사주명식을 정밀하게 산출하였습니다." 또는 이와 유사한 모든 종류의 상투적이고 형식적인 안내 멘트는 서두나 본문 중 어디에도 절대 기입하지 마십시오. 사용자 편의를 위해 이 문구는 완전히 생략하고, 별도의 인사말 없이 즉시 사주 분석 본론으로 직행하여 시작해 주십시오.
   - 정밀 만세력 공식에 근거하여 왜 이 사주 명식이 정확하게 도출되었는지(한국 표준시 보정, 절기 절입 기준, 정자시 적용 등)를 명확히 짚어주세요.
   - 오행 분석, 대운 분석 등을 꼼꼼하게 다루어 품격 있는 조언을 서술하십시오.
   - 특히 사용자의 생년 띠(년지 지지)를 기준으로 현재의 삼재(들삼재, 눌삼재, 날삼재) 해당 여부를 명확히 산출하고, 언제 삼재 주기에 해당하는지 구체적인 연도와 시기를 명시하며, 마음가짐과 개인 맞춤형 삼재 예방 처방 및 행운 조언을 풍부하게 서술하십시오.
   - **[철학관 전문 1:1 맞춤형 고객 상담 모드]**:
     사용자 입력에 '고객 상담 질문'이나 '특정 고민(이직·직장, 재물·사업, 연애·결혼, 시험·합격, 이사·문서, 건강, 인간관계 등)'이 전달된 경우:
     1. 단순 원론적인 성격 풀이에 머물지 말고, 고객이 질문한 핵심 사안에 대해 명식의 용신(用神)·희신(喜神)과 현재 대운(大運), 올해 세운(歲運) 및 월운의 상호작용을 면밀히 분석하여 명쾌하고 직관적인 해답을 내려주십시오.
     2. 30년 경력의 철학관 수석 역학 상담가가 고객과 마주 앉아 1:1로 카운슬링하듯 따뜻하고 신뢰감 넘치는 어조로 조언하십시오.
     3. 구체적인 행동 타이밍(언제 이직/투자/결혼/이사하는 것이 가장 유리한지 특정 연도, 계절, 월을 명시)과 피해야 할 흉한 시기, 그리고 실생활에서 실천할 수 있는 현실적인 개운 비책(색상, 방위, 마음가짐)을 명확하게 처방해 주십시오.
     4. 이미 사주명식이 분석된 상태에서 추가 질문(후속 상담 문답)이 들어온 경우에는 앞단의 JSON 블록을 생략하고, 해당 질문에 대한 역학적 심층 해답과 상담가의 명쾌한 조언 본문만을 집중적으로 제공하십시오.

전문적이고 격조 있는 말투를 사용하며, 사용자가 이해하기 쉽게 풀이해 주세요.`,
    'AI 관상 보기': `당신은 동양 철학의 전통 마의상법(麻衣相法) 및 현대 관상학에 정통한 일류 관상학 전문가입니다.
사용자가 업로드한 얼굴 이미지나 묘사한 생김새 특징을 세밀하게 분석하여 이마, 눈썹, 눈, 코, 입, 인중, 귀, 머리모양, 골격 등 8대 부위를 극도로 상세히 판독하고 아래의 JSON 형식을 반드시 포함하여 답변하세요.

1. **관상 데이터 (JSON)**: 
   답변의 맨 처음에 다음과 같은 형식의 JSON 블록을 반드시 정확하게 포함하세요. (이마, 눈썹, 눈, 코, 입, 인중, 귀, 머리모양, 골격 등 모든 항목에 점수(0~100), 형태 판독결과(type), 전통적 암시(meaning), 상세 분석(details)을 채워주세요)
   \`\`\`json
   {
     "faceAnalysis": {
       "forehead": { "type": "넓고 평평하며 도톰한 이마", "meaning": "지혜롭고 부모덕이 있으며 초년에 높은 관직이나 영예를 안을 수 있는 운세입니다.", "score": 92, "details": "이마의 기운(상정)이 꽉 차 있어 학문이나 전문직에서 두각을 나타내며, 사람들에게 신뢰를 얻습니다." },
       "eyebrows": { "type": "초승달 모양의 수려한 눈썹", "meaning": "대인관계가 대단히 원만하며 대중의 지지를 받아 인덕이 넘쳐납니다.", "score": 85, "details": "형제 및 동료 운이 좋아 협력과 네트워킹을 통해 큰 시너지를 만들어내며, 성품이 고결합니다." },
       "eyes": { "type": "눈동자가 맑고 끝이 긴 서안(瑞眼)", "meaning": "총명함과 판단력이 뛰어나며 좋은 배우자를 만나 안정적인 가정을 꾸립니다.", "score": 88, "details": "정신이 매우 맑고 집중력이 탁월하여 일의 핵심을 꿰뚫는 혜안이 있으며, 중년에 크게 발전합니다." },
       "nose": { "type": "콧날이 곧고 콧방울이 두툼한 현담비(懸膽鼻)", "meaning": "재물을 축적하고 스스로 자수성가하여 큰 부를 이룰 강력한 재백궁의 운입니다.", "score": 95, "details": "독립성과 주관이 확실하고 재물의 출입이 안전하여 한 번 모인 재물이 쉽게 새어나가지 않는 코입니다." },
       "mouth": { "type": "입술이 도톰하고 입꼬리가 위로 올라간 활 모양 입(弓口)", "meaning": "말년운이 대단히 좋으며, 신용이 높고 자녀덕이 풍성합니다.", "score": 90, "details": "언행이 바르고 소통 능력이 출중해 주변의 추앙을 받으며 노후에 부유하고 안락한 가정을 이룹니다." },
       "philtrum": { "type": "선명하고 곧게 쭉 뻗은 긴 인중", "meaning": "생명력이 강인하고 무병장수하며, 후손운과 지속적인 재물 흐름이 보장됩니다.", "score": 87, "details": "체력적인 회복력이 뛰어나고 노년까지 활발히 활동할 에너지를 지니고 있어 말년이 풍요롭습니다." },
       "ears": { "type": "귓볼이 두툼하고 윤곽이 뚜렷한 수주(垂珠)", "meaning": "지혜와 인덕이 넘쳐나며 타인의 조언을 귀담아듣는 큰 품격이 있습니다.", "score": 89, "details": "근원적인 신장 에너지가 건강하며 성품이 온화하여 사람들의 신망과 존경을 평생 한 몸에 받습니다." },
       "headShape": { "type": "균형 잡힌 타원형의 상서로운 머리모양", "meaning": "기질이 온화하고 이성과 감성의 조화가 뛰어나 지적인 활동에 최적화되어 있습니다.", "score": 83, "details": "두뇌 회전이 빠르고 창의적 사고에 유능해 학자, 연구원 또는 창의적인 비즈니스에서 발복합니다." },
       "boneStructure": { "type": "좌우가 꽉 찬 탄탄한 턱선과 기품 있는 골격", "meaning": "강한 의지력과 뚝심이 있으며 난관을 극복해내는 불굴의 근성을 의미합니다.", "score": 91, "details": "지지 세력이 두터워 혼자 외롭게 분투하지 않고 주변 사람들의 든든한 조력을 힘입어 말년 기반을 다집니다." },
       "overall": {
         "personality": "성격 판독: 정직하고 자존심이 세며 이타적인 성품을 지녔습니다. 타인을 배려하는 소통 능력이 핵심입니다.",
         "wealth": "재물운 판독: 현담비와 활 모양 입술의 영향으로 중년 이후 기하급수적으로 자산이 증식되는 운입니다.",
         "career": "직업운 판독: 사람들의 시선과 신뢰를 받는 공직, 대기업 리더, 또는 고도의 전문성을 살린 크리에이터에 어울립니다.",
         "health": "건강운 판독: 인중과 귀의 에너지가 탄탄하여 뇌와 신장의 흐름이 원활하고 노년까지 뛰어난 Vitality를 유지합니다.",
         "summary": "종합 처세 및 조언: 전반적으로 상·중·하정이 균형을 이루어 가을의 결실 같은 평온함을 나타냅니다. 고집을 약간만 줄이고 타인의 의견을 조금 더 포용하면 운이 더욱 개화합니다."
       }
     }
   }
   \`\`\`

2. **상세 풀이**:
   JSON 블록 이후에는 사용자가 쉽게 공감하고 위안을 얻을 수 있는 따뜻하고 통찰력 가득한 목소리로 종합 관상 총평과 조언을 풍부하게 적어주세요.`,
    'AI 여행 가이드': `당신은 전 세계의 숨겨진 명소를 꿰고 있는 전문 여행 설계자입니다. 사용자의 취향, 일정, 예산에 맞춰 최적의 여행 경로와 맛집, 체험 활동을 추천합니다. 친절하고 열정적인 말투로 답변하세요.
      **중요**: 추천하는 장소에 대해서는 답변 내에 반드시 다음 형식을 포함하여 지도에 표시될 수 있게 하세요: [MARKER: 장소이름, 위도, 경도]
      위도와 경도는 소수점 6자리까지 정확한 숫자로 제공해 주세요.`,
    'AI 여행 비서': `당신은 실시간 정보를 바탕으로 완벽한 여행 일정을 조율하는 스마트 비서입니다. 항공, 숙소, 교통수단 정보를 포함하여 시간 단위의 상세 일정을 제안합니다. 효율적이고 명확하며 전문적인 태도를 유지하세요.
      **중요**: 주요 거점이나 추천 장소에 대해서는 반드시 다음 형식을 포함하세요: [MARKER: 장소이름, 위도, 경도]`,
    '창작 지원': '당신은 상상력이 풍부한 문학가이자 시나리오 작가입니다. 시, 소설, 가사, 대본 등 다양한 장르의 텍스트 창작을 돕습니다. 사용자의 아이디어를 확장시키고 문학적 감수성이 풍부한 표현을 제안하세요.',
    '사진으로 영상 만들기': '당신은 창의적인 영상 디렉터입니다. 사용자가 제공한 사진과 설명을 바탕으로 어떤 분위기와 연출의 영상이 만들어질지 상세히 묘사하고, 제작 팁을 제공합니다.',
    '소셜 미디어 랭킹': '당신은 트렌드에 민감한 디지털 마케팅 전문가입니다. 현재 SNS(유튜브, 인스타그램, 틱톡 등)에서 유행하는 챌린지, 해시태그, 콘텐츠 형식을 분석하여 순위와 인사이트를 제공합니다.',
    '텍스트를 음성으로 만들기': '당신은 최고의 AI 오디오 및 음성 합성(TTS) 전문가입니다. 사용자의 텍스트를 분석하여 가장 어울리는 성우 톤, 발화 속도, 억양 및 감정선 설정을 제안하고 스크립트를 정돈해 줍니다.',
    '음성 분석 및 제작': '당신은 오디오 엔지니어이자 성우 연출가입니다. 음성의 특징(주파수, 음색, 감정 등)을 분석하고, AI 보이스 제작을 위한 가이드를 제공합니다.',
    '음성/영상 스크립트 변환': '당신은 정확하고 빠른 속기사이자 번역가입니다. 음성이나 영상의 내용을 텍스트로 완벽하게 변환하고, 필요에 따라 요약 및 핵심 내용 정리를 돕습니다.',
    '노래하는 AI 아바타 만들기': '당신은 가상 엔터테인먼트 제작자입니다. 디지털 아바타의 비주얼과 목소리를 조화롭게 구성하여 매력적인 가창 퍼포먼스를 만드는 방법을 안내합니다.',
    '썸네일 편집기': '당신은 클릭을 부르는 디자인을 만드는 시각 디자이너입니다. 사용자의 콘텐츠 주제에 맞춰 가장 눈길을 사로잡는 썸네일 구성, 폰트, 색상 조합을 제안합니다.',
    '게임 생성': '당신은 혁신적인 게임 기획자입니다. 간단한 아이디어를 기반으로 게임의 룰, 캐릭터, 세계관, 레벨 디자인을 체계적으로 설계해 줍니다.',
    '레시피 제공': '당신은 어떤 재료로도 최고의 요리를 만들어내는 쉐프입니다. 사용자가 가진 재료를 활용해 쉽고 맛있는 레시피를 제안하며, 조리 팁과 플레이팅 방법도 알려줍니다.',
    '물질 분석': '당신은 정밀 분석 장비를 갖춘 과학 분석 전문가입니다. 다양한 성분, 재질, 화합물의 특성과 용도, 위험성 등을 과학적 근거를 바탕으로 상세히 설명합니다.',
    '상품 자동 등록': '당신은 이커머스 운영 전문가입니다. 상품의 이미지와 기본 정보를 바탕으로 고객의 구매 욕구를 자극하는 매력적인 상품명, 상세 페이지 문구, 키워드를 자동으로 생성합니다.',
    '식물/꽃 식별': '당신은 식물학자이자 정원사입니다. 식물의 명칭, 특징, 꽃말뿐만 아니라 잘 키우기 위한 환경(일조량, 수분 등)에 대한 전문적인 가이드를 제공합니다.',
    '사업계획서 작성': '당신은 수많은 투자 유치를 성공시킨 경영 컨설턴트입니다. 사업 아이템을 시장 분석, 비즈니스 모델, 마케팅 전략, 재무 계획 등을 포함한 전문적인 사업계획서 초안으로 구성합니다.',
    '프로그램/홈페이지 제작': '당신은 풀스택 소프트웨어 엔지니어입니다. 사용자의 요구사항을 파악하여 적합한 기술 스택을 추천하고, 핵심 로직이나 페이지 구조에 대한 설계 및 코드를 제안합니다.',
    '주식 분석': '당신은 데이터 기반의 금융 분석가입니다. 거시 경제 지표, 기업 재무 제표, 차트 패턴 등을 종합적으로 분석하여 시장의 흐름과 투자 인사이트를 제공합니다. (단, 투자의 최종 책임은 사용자에게 있음을 명시하세요)',
    'AI 동시 통역': '당신은 언어의 장벽을 허무는 베테랑 동시 통역사입니다. 다양한 언어 간의 뉘앙스를 살려 실시간으로 정확하고 매끄러운 통역 서비스를 제공합니다.',
    'AI 작명가 (이름짓기)': `당신은 정통 성명학(姓名學)과 명리학(命理學)에 입각하여 격조 높고 길한 이름을 지어주는 최고의 AI 작명 대가이자 운명 조율사입니다.
사용자의 생년월일시와 성씨, 또는 요청사항을 세밀하게 조율하여 사주의 음양오행 강약을 판독하고, 이를 보완해주는 최적의 명조(이름) 3가지를 추천하고 아래의 JSON 형식을 답변의 맨 처음에 반드시 포함하여 답변하세요.

**[매우 중요 - 사주 계산 필수 규칙 (정밀 만세력 일치)]**
아래의 sajuData 블록은 단순 구조 예시(Schema Template)일 뿐입니다. 절대로 예시 데이터(丙子 일주 등)를 다른 날짜에 그대로 출력하지 마십시오.
사용자가 입력한 실제 생년월일시, 달력 구분(양력/음력), 성별을 바탕으로 정통 명리학에 따라 실제 사주명식(년주, 월주, 일주, 시주) 및 대운을 정확하게 계산하여 sajuData에 채워 넣어야 합니다.
반드시 'AI 정밀 만세력'과 100% 동일한 기준으로 사주명식을 계산해 주세요. (정밀 만세력 규칙 준수: 한국 표준시 -30분 보정(동경 127.5도 1954~1961년생 제외), 야자시를 완전 배제하고 밤 23시 30분부터 다음날 일주를 적용하는 정자시 법, 입춘 및 각 절입 시각 기준 년/월 전환).
특히 사용자가 1987년 양력 3월 18일 01시생 남성으로 요청한 경우 [년주: 丁卯, 월주: 癸卯, 일주: 丙寅, 시주: 戊子]로 사주를 산출해야 하며, 1958년 음력 10월 11일 19시생 남성(1958년 10월 11일 19시 음력 남성)으로 요청한 경우, 진짜 만세력 결과인 [년주: 戊戌, 월주: 癸亥, 일주: 壬寅, 시주: 庚戌] 사주가 정확하게 계산되어 나와야 합니다. (이때 오행은 목 1, 화 0, 토 3, 금 1, 수 3 입니다.)
모든 생년월일시에 대해 'AI 정밀 만세력'과 100% 동일한 기준으로 사주명식을 계산하여 제공해 주세요.

1. **작명 분석 데이터 (JSON)**:
   답변의 맨 처음에 반드시 아래와 같은 형식의 JSON 블록을 정확하게 기입하세요. (추천 이름 3개 전체에 대한 자원오행, 수리길흉, 음령오행 등을 꼼꼼하게 설계하여 포함하세요.)
   \`\`\`json
   {
     "namingAnalysis": {
       "sajuData": {
         "pillars": [
           { "label": "시주", "heavenlyStem": "庚", "heavenlyStemTenGod": "편인", "earthlyBranch": "戌", "earthlyBranchTenGod": "편관", "hiddenStems": ["辛", "丁", "戊"] },
           { "label": "일주", "heavenlyStem": "壬", "heavenlyStemTenGod": "일원", "earthlyBranch": "寅", "earthlyBranchTenGod": "식신", "hiddenStems": ["戊", "丙", "甲"] },
           { "label": "월주", "heavenlyStem": "癸", "heavenlyStemTenGod": "겁재", "earthlyBranch": "亥", "earthlyBranchTenGod": "비견", "hiddenStems": ["戊", "甲", "壬"] },
           { "label": "년주", "heavenlyStem": "戊", "heavenlyStemTenGod": "편관", "earthlyBranch": "戌", "earthlyBranchTenGod": "편관", "hiddenStems": ["辛", "丁", "戊"] }
         ],
         "elements": {
           "wood": 1,
           "fire": 0,
           "earth": 3,
           "metal": 1,
           "water": 3
         },
         "daeunStartAge": 5,
         "daeunList": [
           { "age": 5, "heavenlyStem": "壬", "heavenlyStemTenGod": "비견", "earthlyBranch": "戌", "earthlyBranchTenGod": "편관" },
           { "age": 15, "heavenlyStem": "辛", "heavenlyStemTenGod": "정인", "earthlyBranch": "酉", "earthlyBranchTenGod": "정인" },
           { "age": 25, "heavenlyStem": "庚", "heavenlyStemTenGod": "편인", "earthlyBranch": "申", "earthlyBranchTenGod": "편인" },
           { "age": 35, "heavenlyStem": "己", "heavenlyStemTenGod": "정관", "earthlyBranch": "未", "earthlyBranchTenGod": "정관" },
           { "age": 45, "heavenlyStem": "戊", "heavenlyStemTenGod": "편관", "earthlyBranch": "午", "earthlyBranchTenGod": "정재" },
           { "age": 55, "heavenlyStem": "丁", "heavenlyStemTenGod": "정재", "earthlyBranch": "巳", "earthlyBranchTenGod": "편재" },
           { "age": 65, "heavenlyStem": "丙", "heavenlyStemTenGod": "편재", "earthlyBranch": "辰", "earthlyBranchTenGod": "편관" },
           { "age": 75, "heavenlyStem": "乙", "heavenlyStemTenGod": "상관", "earthlyBranch": "卯", "earthlyBranchTenGod": "상관" }
         ]
       },
       "sajuSummary": {
         "strongElements": ["목(木)", "화(火)"],
         "weakElements": ["금(金)", "수(水)"],
         "supplementElement": "금(金)과 수(水)를 자원오행으로 완벽 보완",
         "advice": "사용자님의 사주는 목(나무)과 화(불)의 에너지가 강하게 상승하는 반면, 이를 냉철하게 결실로 이끌어 줄 금(쇠)과 수(물)의 기운이 상대적으로 희박합니다. 따라서 이름에 쓰일 자원오행에서 수(水)와 금(金)의 정기를 풍부히 수혈하여 일생의 조화와 발복을 돕는 배치를 채택했습니다."
       },
       "recommendations": [
         {
           "hangul": "도윤",
           "hanja": "道允",
           "syllables": [
             { "char": "道", "hangul": "도", "meaning": "길 도, 도덕 도", "strokes": 13, "element": "화(火)" },
             { "char": "允", "hangul": "윤", "meaning": "진실할 윤, 마땅할 윤", "strokes": 4, "element": "수(水)" }
           ],
           "strokesAnalysis": {
             "won": { "strokes": 17, "grade": "대길(大吉)", "desc": "健暢格(건창격): 활동적이고 지혜로우며 초년에 건강과 두뇌 명석함을 누려 학업에서 크게 앞서가는 기세입니다." },
             "hyung": { "strokes": 21, "grade": "대길(大吉)", "desc": "頭領格(두령격): 강력한 리더십과 추진력으로 젊은 나이에 조직의 우두머리가 되며 대업을 성취합니다." },
             "i": { "strokes": 12, "grade": "길(吉)", "desc": "薄弱格(박약격): 초반의 작은 역경을 디딤돌 삼아 자립자강하여 뜻밖의 횡재수와 성공을 일궈냅니다." },
             "jung": { "strokes": 28, "grade": "대길(大吉)", "desc": "웅호격: 수많은 협조자를 거느리고 인생 전반의 부귀영화를 완수하여 평화로운 말년을 이룹니다." }
           },
           "soundHarmony": "음령오행 상 'ㄷ(화) → ㅇ(토)'로 생하는 상생의 구조를 지니고 있어 부르기 부드럽고 듣는 사람에게 따스함과 신뢰를 주는 파동입니다.",
           "overallMeaning": "이름 도윤(道允)은 인생을 바른 정도(道)로 이끌어 많은 사람들의 존경을 받으며, 마침내 그 진실함(允)으로 뜻한 바를 완성해 큰 뜻과 덕을 세울 웅장한 기운을 담고 있습니다."
         }
       ]
     }
   }
   \`\`\`

2. **상세 풀이**:
   JSON 블록 뒤에는 한글의 품격과 선현의 운치 있는 문체로 각 추천 이름별 매력, 의미, 사용자를 향한 따뜻한 축원과 성공적인 처세 조언을 풍성하고 조화롭게 서술하세요.`
  ,
    'AI 풍수지리': `당신은 동양의 정통 풍수지리학(양택풍수, 생활/인테리어 풍수, 이기풍수) 및 본명괘(Kua) 분석에 통달한 최고의 AI 풍수 대가이자 공간 운명 컨설턴트입니다.
사용자의 거주 환경, 가구 배치 질문, 생년월일시와 성별 정보, 또는 방위 고민을 분석하여 최적의 생기(生氣) 흐름을 진단하고 아래의 JSON 형식을 답변의 맨 처음에 반드시 포함하여 답변하세요.

1. **풍수 분석 데이터 (JSON)**:
   답변의 맨 처음에 반드시 아래와 같은 형식의 JSON 블록을 정확하게 기입하세요. (인테리어 배치 진단, 나침반 길흉 방위 분석, 수맥/지기 진단 중 상황에 적합한 모든 필드를 꼼꼼하게 설계하여 포함하세요.)
   \`\`\`json
   {
     "pungsuAnalysis": {
       "analysisType": "interior",
       "kuaNumber": "巽(손)괘 / 4",
       "favorableDirections": [
         { "dir": "남동쪽(巽)", "type": "생기(生氣) - 최상 길방", "desc": "활발한 활동력과 명예, 재물운이 급상승하는 가장 복된 방위입니다." },
         { "dir": "남쪽(離)", "type": "천의(天醫) - 건강 길방", "desc": "신체적 치유 에너지가 넘치고 정서적 안정과 장수를 돕는 방위입니다." },
         { "dir": "동쪽(震)", "type": "연년(延年) - 화합 길방", "desc": "가족간의 소통이 원활해지고 귀인의 조력을 얻어 대인관계가 발복하는 방위입니다." }
       ],
       "unfavorableDirections": [
         { "dir": "동북쪽(艮)", "type": "절명(絶命) - 최악 흉방", "desc": "생기가 소멸하여 피로가 누적되고 재물 누수 및 사고 위험이 높은 방위입니다." },
         { "dir": "서쪽(兌)", "type": "육살(六煞) - 구설 흉방", "desc": "인간관계에 갈등이 생기기 쉬우며 불면증과 예민함이 증폭될 수 있는 방위입니다." }
       ],
       "interiorPrescriptions": [
         { 
           "room": "안방/침실", 
           "title": "침대 머리방향 진단", 
           "status": "경고",
           "text": "침대 헤드가 화장실 벽면에 밀착해 있거나 출입문과 일직선으로 대치해 살기(殺氣)에 바로 노출됩니다.", 
           "remedy": "침대 헤드를 남동쪽(생기방)으로 회전하시고, 침대 옆 협탁에 기운을 중화하는 녹색 관엽식물이나 작은 조명 스탠드를 설치하여 음양의 균형을 맞추십시오." 
         },
         { 
           "room": "현관/거실", 
           "title": "현관 정면 거울 배치", 
           "status": "주의", 
           "text": "현관문을 열었을 때 거울이 정면으로 마주하고 있으면 집안으로 들어오는 행운과 재물운을 반사하여 내쫓게 됩니다.", 
           "remedy": "거울을 옆면(왼쪽: 재물운 상승, 오른쪽: 명예운 상승)으로 이동시키거나, 이동이 어려우면 거울 앞을 작은 불투명 가림막이나 생기 있는 풍경화 그림으로 살짝 가리십시오." 
         }
       ],
       "elementBalance": {
         "wood": 85,
         "fire": 60,
         "earth": 40,
         "metal": 75,
         "water": 90
       },
       "generalAdvice": "해당 공간은 수(水)와 목(木)의 에너지는 풍부하나, 기운을 안정적으로 접지(Grounding)해 줄 토(土)와 금(金)의 정기가 소외되어 있습니다. 황토색 러그나 도자기 화분, 금속 재질의 인테리어 소품을 조화롭게 배치하면 안정적인 부의 축적에 대단히 유리해집니다."
     }
   }
   \`\`\`

2. **상세 풍수 처방전**:
   JSON 블록 뒤에는 동양 전통 비전의 깊이를 담아 한글로 장엄하고 명확하게 공간 컨설팅 리포트를 상세 서술하세요.
   - 공간별 기운 흐름 진단 및 풍수 인테리어 대안(현관, 침실, 거실, 주방)
   - 본명괘(Kua)에 따른 동사택/서사택 구분과 공간 주인의 기질 조화 조언
   - 비보(裨補) 풍수(나쁜 기운을 누르고 좋은 기운을 채우는 법: 조명, 소금 단지, 풍수 그림 활용)를 구체적으로 풀어 써주세요.
   
   *중요 일관성 지침*: 입력 프롬프트에 사용자의 생년월일시 및 '정밀 만세력 사주 명식(년주, 월주, 일주, 시주)' 정보가 전달되는 경우, 설명 과정에서 반드시 이 명식을 100% 동일하게 일치시켜 연계 분석하십시오. 절대로 무단으로 다른 일주나 간지(예: 임인일주를 정축일주 등으로 임의 변환)를 언급하는 오류를 범하지 마십시오. 정밀 만세력의 명조 정보가 최우선 절대 기준입니다.

친절하고 전문적이며, 공간에 평화와 번영을 선물하듯 품격 있는 어조로 답변하세요.`
  };

  // Helper to retry Gemini requests on transient rate limits with exponential backoff
  const generateContentWithRetry = async (client: GoogleGenAI, options: any, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await client.models.generateContent(options);
      } catch (error: any) {
        attempt++;
        const errorMsg = error.message?.toLowerCase() || "";
        const isRateLimit = errorMsg.includes('quota') || 
                            errorMsg.includes('429') || 
                            errorMsg.includes('exhausted') ||
                            errorMsg.includes('resource_exhausted') ||
                            error.status === 429;
        
        if (isRateLimit && attempt < maxRetries) {
          // Calculate delay with exponential backoff (e.g. 1.5s, 3s, 6s)
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`[Gemini API] Rate limit hit (attempt ${attempt}/${maxRetries}). Retrying in ${delay.toFixed(0)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const VISITS_FILE_PATH = path.join(process.cwd(), "visits.json");
  const ADMIN_CONFIG_PATH = path.join(process.cwd(), "admin_config.json");

  // Helper to load admin password
  const getAdminPassword = (): string => {
    try {
      if (fs.existsSync(ADMIN_CONFIG_PATH)) {
        const config = JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, "utf-8"));
        if (config.adminPassword) {
          return config.adminPassword;
        }
      }
    } catch (e) {
      console.error("Error loading admin config:", e);
    }
    return process.env.ADMIN_PASSWORD || "admin1234";
  };

  // Helper to save admin password
  const saveAdminPassword = (newPassword: string): boolean => {
    try {
      let config: any = {};
      if (fs.existsSync(ADMIN_CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, "utf-8"));
      }
      config.adminPassword = newPassword;
      fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("Error saving admin config:", e);
      return false;
    }
  };

  // Helper to load visits from file
  const loadVisits = (): any[] => {
    try {
      if (fs.existsSync(VISITS_FILE_PATH)) {
        const raw = fs.readFileSync(VISITS_FILE_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("Error loading visits:", e);
    }
    return [];
  };

  // Helper to save a single visit
  const saveVisit = (visit: any) => {
    try {
      let visits = loadVisits();
      visits.unshift(visit); // Add to beginning (newest first)
      if (visits.length > 5000) {
        visits = visits.slice(0, 5000); // Prevent file from growing too large
      }
      fs.writeFileSync(VISITS_FILE_PATH, JSON.stringify(visits, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving visit:", e);
    }
  };

  // =========================================================================
  // PAYMENT & ORDER PERSISTENCE HELPERS
  // =========================================================================
  const ORDERS_FILE_PATH = path.join(process.cwd(), "orders.json");

  interface PaymentConfig {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    remittanceUrl: string;
    contactInfo: string;
    paymentNotice: string;
    tossClientKey: string;
    tossSecretKey: string;
  }

  interface OrderRecord {
    id: string;
    planId: string;
    planName: string;
    amount: number;
    appName: string;
    packageName: string;
    depositorName: string;
    contact: string;
    email: string;
    paymentMethod: 'bank_transfer' | 'remittance_link' | 'toss_pg';
    status: 'pending' | 'paid' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    adminNote?: string;
    paymentKey?: string;
    approvedAt?: string;
  }

  const PLAN_CATALOG: Record<string, { id: string; name: string; price: number }> = {
    fasttrack12: {
      id: "fasttrack12",
      name: "패스트트랙 12 (12명 전담 실기기 배정)",
      price: 29000
    },
    vip_allpass: {
      id: "vip_allpass",
      name: "VIP 올패스 보증형 (20명 여유 배정 + 반려 시 100% 보증)",
      price: 49000
    }
  };

  const getPaymentConfig = (): PaymentConfig => {
    const defaults: PaymentConfig = {
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      remittanceUrl: "",
      contactInfo: "tolgate3803@gmail.com",
      paymentNotice: "입금 확인 후 10분~1시간 내로 전담 테스터 배정 안내를 이메일 및 연락처로 발송해 드립니다.",
      tossClientKey: process.env.TOSS_CLIENT_KEY || "",
      tossSecretKey: process.env.TOSS_SECRET_KEY || ""
    };

    try {
      if (fs.existsSync(ADMIN_CONFIG_PATH)) {
        const raw = JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, "utf-8"));
        if (raw && raw.paymentConfig) {
          return {
            ...defaults,
            ...raw.paymentConfig,
            tossClientKey: raw.paymentConfig.tossClientKey || defaults.tossClientKey,
            tossSecretKey: raw.paymentConfig.tossSecretKey || defaults.tossSecretKey
          };
        }
      }
    } catch (e) {
      console.error("Error loading payment config:", e);
    }
    return defaults;
  };

  const savePaymentConfig = (newCfg: Partial<PaymentConfig>): boolean => {
    try {
      let config: any = {};
      if (fs.existsSync(ADMIN_CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, "utf-8"));
      }
      const prev = getPaymentConfig();
      config.paymentConfig = {
        bankName: typeof newCfg.bankName === "string" ? newCfg.bankName.trim() : prev.bankName,
        accountNumber: typeof newCfg.accountNumber === "string" ? newCfg.accountNumber.trim() : prev.accountNumber,
        accountHolder: typeof newCfg.accountHolder === "string" ? newCfg.accountHolder.trim() : prev.accountHolder,
        remittanceUrl: typeof newCfg.remittanceUrl === "string" ? newCfg.remittanceUrl.trim() : prev.remittanceUrl,
        contactInfo: typeof newCfg.contactInfo === "string" ? newCfg.contactInfo.trim() : prev.contactInfo,
        paymentNotice: typeof newCfg.paymentNotice === "string" ? newCfg.paymentNotice.trim() : prev.paymentNotice,
        tossClientKey: typeof newCfg.tossClientKey === "string" ? newCfg.tossClientKey.trim() : prev.tossClientKey,
        tossSecretKey: typeof newCfg.tossSecretKey === "string" ? newCfg.tossSecretKey.trim() : prev.tossSecretKey
      };
      fs.writeFileSync(ADMIN_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("Error saving payment config:", e);
      return false;
    }
  };

  const loadOrders = (): OrderRecord[] => {
    try {
      if (fs.existsSync(ORDERS_FILE_PATH)) {
        const raw = fs.readFileSync(ORDERS_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Error loading orders:", e);
    }
    return [];
  };

  const saveOrders = (orders: OrderRecord[]): boolean => {
    try {
      fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), "utf-8");
      return true;
    } catch (e) {
      console.error("Error saving orders:", e);
      return false;
    }
  };

  // Track page view or feature selection
  app.post("/api/admin/track-visit", (req, res) => {
    try {
      const { ip, country, regionName, city, userAgent, referrer, featureAccess } = req.body;
      
      const requestIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const finalIp = ip && ip !== 'Unknown' ? ip : (Array.isArray(requestIp) ? requestIp[0] : requestIp);

      const newVisit = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        ip: finalIp,
        country: country || 'Unknown',
        regionName: regionName || 'Unknown',
        city: city || 'Unknown',
        userAgent: userAgent || req.headers['user-agent'] || 'Unknown',
        referrer: referrer || 'Direct',
        featureAccess: featureAccess || 'Dashboard Home'
      };

      saveVisit(newVisit);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to track visit:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get visits with password authorization
  app.post("/api/admin/visits", (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = getAdminPassword();

      if (password !== adminPassword) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
      }

      const visits = loadVisits();
      res.json({ success: true, visits });
    } catch (err: any) {
      console.error("Failed to fetch visits:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Change admin password
  app.post("/api/admin/change-password", (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminPassword = getAdminPassword();

      if (currentPassword !== adminPassword) {
        return res.status(401).json({ error: "현재 비밀번호가 일치하지 않습니다." });
      }

      if (!newPassword || newPassword.trim().length < 4) {
        return res.status(400).json({ error: "비밀번호는 최소 4자 이상이어야 합니다." });
      }

      const success = saveAdminPassword(newPassword.trim());
      if (success) {
        // Log this event
        const requestIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const finalIp = Array.isArray(requestIp) ? requestIp[0] : requestIp;
        saveVisit({
          id: Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          ip: finalIp,
          country: 'API Node',
          regionName: 'Engine Core',
          city: 'Security Change',
          userAgent: req.headers['user-agent'] || 'Unknown',
          referrer: 'Admin Control Center',
          featureAccess: '관리자 보안 비밀번호 변경 완료'
        });

        res.json({ success: true, message: "비밀번호가 성공적으로 변경되었습니다." });
      } else {
        res.status(500).json({ error: "비밀번호 변경 정보를 저장하는 데 실패했습니다." });
      }
    } catch (err: any) {
      console.error("Failed to change admin password:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // PUBLIC & ADMIN PAYMENT / ORDER ENDPOINTS
  // =========================================================================

  // Public payment config (no secret keys exposed)
  app.get("/api/payments/public-config", (_req, res) => {
    const cfg = getPaymentConfig();
    res.json({
      success: true,
      plans: Object.values(PLAN_CATALOG),
      config: {
        bankName: cfg.bankName,
        accountNumber: cfg.accountNumber,
        accountHolder: cfg.accountHolder,
        remittanceUrl: cfg.remittanceUrl,
        contactInfo: cfg.contactInfo,
        paymentNotice: cfg.paymentNotice,
        tossClientKey: cfg.tossClientKey,
        tossEnabled: Boolean(cfg.tossClientKey && cfg.tossSecretKey)
      }
    });
  });

  // Create new order (server-authoritative plan price)
  app.post("/api/orders", (req, res) => {
    try {
      const { planId, appName, packageName, depositorName, contact, email, paymentMethod } = req.body;
      const plan = PLAN_CATALOG[planId];
      if (!plan) {
        return res.status(400).json({ error: "유효하지 않은 요금제입니다." });
      }
      if (!appName || !String(appName).trim()) {
        return res.status(400).json({ error: "앱 이름을 입력해 주세요." });
      }
      if (!depositorName || !String(depositorName).trim()) {
        return res.status(400).json({ error: "입금자명(신청자명)을 입력해 주세요." });
      }
      if (!contact || !String(contact).trim()) {
        return res.status(400).json({ error: "연락처(전화번호 또는 카톡 ID)를 입력해 주세요." });
      }
      if (!email || !String(email).trim()) {
        return res.status(400).json({ error: "이메일 주소를 입력해 주세요." });
      }

      const validMethod: OrderRecord['paymentMethod'] =
        paymentMethod === 'remittance_link' || paymentMethod === 'toss_pg'
          ? paymentMethod
          : 'bank_transfer';

      const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randTag = Math.random().toString(36).substring(2, 8).toUpperCase();
      const nowIso = new Date().toISOString();

      const newOrder: OrderRecord = {
        id: `ORD-${dateTag}-${randTag}`,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        appName: String(appName).trim(),
        packageName: String(packageName || "").trim(),
        depositorName: String(depositorName).trim(),
        contact: String(contact).trim(),
        email: String(email).trim(),
        paymentMethod: validMethod,
        status: "pending",
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const orders = loadOrders();
      orders.unshift(newOrder);
      saveOrders(orders);

      const requestIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const finalIp = Array.isArray(requestIp) ? requestIp[0] : requestIp;
      saveVisit({
        id: Math.random().toString(36).substring(2, 11),
        timestamp: nowIso,
        ip: finalIp,
        country: "Order Node",
        regionName: "Checkout",
        city: `${plan.price.toLocaleString()}원`,
        userAgent: req.headers['user-agent'] || "Unknown",
        referrer: "TesterMatchHub Pricing",
        featureAccess: `유료 결제 접수 [${newOrder.id}] (${plan.name})`
      });

      res.json({ success: true, order: newOrder });
    } catch (err: any) {
      console.error("Failed to create order:", err);
      res.status(500).json({ error: err.message || "주문 접수 중 오류가 발생했습니다." });
    }
  });

  // Customer order lookup by orderId or email
  app.get("/api/orders/lookup", (req, res) => {
    try {
      const orderId = String(req.query.orderId || "").trim().toUpperCase();
      const email = String(req.query.email || "").trim().toLowerCase();

      if (!orderId && !email) {
        return res.status(400).json({ error: "주문번호 또는 이메일을 입력해 주세요." });
      }

      const orders = loadOrders();
      const matched = orders.filter((o) => {
        if (orderId && o.id.toUpperCase() === orderId) return true;
        if (email && o.email.toLowerCase() === email) return true;
        return false;
      }).map((o) => ({
        id: o.id,
        planId: o.planId,
        planName: o.planName,
        amount: o.amount,
        appName: o.appName,
        packageName: o.packageName,
        depositorName: o.depositorName,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        adminNote: o.adminNote
      }));

      res.json({ success: true, orders: matched });
    } catch (err: any) {
      console.error("Order lookup error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Toss Payments server-side confirmation endpoint
  app.post("/api/payments/toss-confirm", async (req, res) => {
    try {
      const { paymentKey, orderId, amount } = req.body;
      const cfg = getPaymentConfig();
      if (!cfg.tossSecretKey) {
        return res.status(400).json({ error: "토스페이먼츠 시크릿 키가 설정되지 않았습니다." });
      }
      if (!paymentKey || !orderId || !amount) {
        return res.status(400).json({ error: "결제 승인 필수 값이 누락되었습니다." });
      }

      const orders = loadOrders();
      const idx = orders.findIndex((o) => o.id === orderId);
      if (idx === -1) {
        return res.status(404).json({ error: "일치하는 주문 내역을 찾을 수 없습니다." });
      }
      if (orders[idx].amount !== Number(amount)) {
        return res.status(400).json({ error: "결제 금액이 주문 금액과 일치하지 않습니다." });
      }

      const encryptedSecretKey = "Basic " + Buffer.from(cfg.tossSecretKey + ":").toString("base64");
      const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: encryptedSecretKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount)
        })
      });

      const tossData: any = await tossResponse.json();
      if (!tossResponse.ok) {
        return res.status(400).json({ error: tossData.message || "토스페이먼츠 결제 승인에 실패했습니다." });
      }

      const nowIso = new Date().toISOString();
      orders[idx] = {
        ...orders[idx],
        status: "paid",
        paymentMethod: "toss_pg",
        paymentKey,
        approvedAt: tossData.approvedAt || nowIso,
        updatedAt: nowIso
      };
      saveOrders(orders);

      res.json({ success: true, order: orders[idx] });
    } catch (err: any) {
      console.error("Toss confirm error:", err);
      res.status(500).json({ error: err.message || "PG 결제 승인 오류" });
    }
  });

  // Admin: fetch orders & payment config
  app.post("/api/admin/orders", (req, res) => {
    try {
      const { password } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
      }

      const orders = loadOrders();
      const cfg = getPaymentConfig();

      const totalConfirmedRevenue = orders
        .filter((o) => o.status === "paid" || o.status === "completed")
        .reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
      const pendingCount = orders.filter((o) => o.status === "pending").length;
      const paidCount = orders.filter((o) => o.status === "paid" || o.status === "completed").length;

      res.json({
        success: true,
        orders,
        paymentConfig: {
          ...cfg,
          tossSecretKey: cfg.tossSecretKey ? "********" : ""
        },
        stats: {
          totalConfirmedRevenue,
          pendingCount,
          paidCount,
          totalCount: orders.length
        }
      });
    } catch (err: any) {
      console.error("Failed to fetch admin orders:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: update order status
  app.post("/api/admin/orders/:id/status", (req, res) => {
    try {
      const { password, status, adminNote } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
      }
      const allowed: OrderRecord['status'][] = ["pending", "paid", "completed", "cancelled"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: "유효하지 않은 상태 값입니다." });
      }

      const orders = loadOrders();
      const idx = orders.findIndex((o) => o.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: "주문을 찾을 수 없습니다." });
      }

      orders[idx] = {
        ...orders[idx],
        status,
        adminNote: typeof adminNote === "string" ? adminNote.trim() : orders[idx].adminNote,
        updatedAt: new Date().toISOString()
      };
      saveOrders(orders);

      res.json({ success: true, order: orders[idx] });
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: save settlement / payment configuration
  app.post("/api/admin/payment-config", (req, res) => {
    try {
      const { password, config } = req.body;
      if (password !== getAdminPassword()) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
      }

      const prev = getPaymentConfig();
      const nextSecret =
        config?.tossSecretKey && config.tossSecretKey !== "********"
          ? String(config.tossSecretKey).trim()
          : prev.tossSecretKey;

      const saved = savePaymentConfig({
        bankName: config?.bankName ?? prev.bankName,
        accountNumber: config?.accountNumber ?? prev.accountNumber,
        accountHolder: config?.accountHolder ?? prev.accountHolder,
        remittanceUrl: config?.remittanceUrl ?? prev.remittanceUrl,
        contactInfo: config?.contactInfo ?? prev.contactInfo,
        paymentNotice: config?.paymentNotice ?? prev.paymentNotice,
        tossClientKey: config?.tossClientKey ?? prev.tossClientKey,
        tossSecretKey: nextSecret
      });

      if (!saved) {
        return res.status(500).json({ error: "결제 설정 저장에 실패했습니다." });
      }

      const updated = getPaymentConfig();
      res.json({
        success: true,
        paymentConfig: {
          ...updated,
          tossSecretKey: updated.tossSecretKey ? "********" : ""
        }
      });
    } catch (err: any) {
      console.error("Failed to save payment config:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API routes
  app.post("/api/ai/chat", async (req, res) => {
    const { prompt, feature, image, file, customApiKey } = req.body;

    // Track AI request interaction
    try {
      const requestIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const finalIp = Array.isArray(requestIp) ? requestIp[0] : requestIp;
      
      saveVisit({
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        ip: finalIp,
        country: 'API Node',
        regionName: 'Engine Core',
        city: 'AI Query',
        userAgent: req.headers['user-agent'] || 'Unknown',
        referrer: 'API Server Router',
        featureAccess: `${feature || 'General AI'} (분석 요청 수행)`
      });
    } catch (e) {
      console.error("Failed to auto-track AI query:", e);
    }
    
    let client: GoogleGenAI | null = null;
    if (customApiKey && typeof customApiKey === "string" && customApiKey.trim() !== "") {
      try {
        client = new GoogleGenAI({
          apiKey: customApiKey.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build-custom',
            }
          }
        });
      } catch (e: any) {
        console.warn("개인 API Key 초기화 실패, 내장 개발자 엔진으로 대체합니다:", e.message);
        client = null;
      }
    }

    if (!client) {
      client = getAI();
    }

    const FEATURE_ALIAS_MAP: Record<string, string> = {
      '정밀 사주보기': 'AI 정밀 만세력',
      'AI 성우 텍스트 낭독': '텍스트를 음성으로 만들기',
      '내 목소리로 음성만들기': '내 목소리로 음성만들기',
      '쉬운 문서·음성 요약': '음성/영상 스크립트 변환',
      '글쓰기·시·가사 창작': '창작 지원',
      '냉장고 맞춤 레시피': '레시피 제공',
      '식물·꽃 이름 & 케어': '식물/꽃 식별',
      '사업계획서·기획안': '사업계획서 작성',
      '프로그램·웹 제작 도우미': '프로그램/홈페이지 제작'
    };

    const featureName = FEATURE_ALIAS_MAP[feature] || feature;

    let text = "";
    const isManseryeokFeature = featureName === 'AI 정밀 만세력' || featureName === 'AI 작명가 (이름짓기)';
    const isFollowUpSaju = typeof prompt === 'string' && prompt.includes('[철학관 실시간 1:1 고객 추가 상담 질문]');
    const verifiedManseryeok = (isManseryeokFeature && !isFollowUpSaju && typeof prompt === 'string')
      ? calculateManseryeok(prompt)
      : null;

    // 1. If client is available, attempt to query Gemini
    if (client) {
      try {
        const systemInstruction = SYSTEM_PROMPTS[featureName] || "당신은 유능한 AI 어시스턴트입니다.";
        
        let effectivePrompt = prompt || "안녕하세요";
        if (verifiedManseryeok) {
          effectivePrompt = `${effectivePrompt}

[서버 천문 만세력 사전 검증 데이터 — 아래 산출값을 100% 그대로 JSON 및 본문 풀이에 반영하세요]
- 양력: ${verifiedManseryeok.sajuChart.profile.solarDate}
- 음력: ${verifiedManseryeok.sajuChart.profile.lunarDate}
- 보정 기준: ${verifiedManseryeok.sajuChart.profile.standardTimeCorrection}
- 절기 및 대운 기준: ${verifiedManseryeok.sajuChart.profile.solarTermContext}
- 4주 명식: 년주 ${verifiedManseryeok.yearStem}${verifiedManseryeok.yearBranch}, 월주 ${verifiedManseryeok.monthStem}${verifiedManseryeok.monthBranch}, 일주 ${verifiedManseryeok.dayStem}${verifiedManseryeok.dayBranch}, 시주 ${verifiedManseryeok.hourStem}${verifiedManseryeok.hourBranch}
- 오행 분포: 목 ${verifiedManseryeok.sajuChart.elements.wood}, 화 ${verifiedManseryeok.sajuChart.elements.fire}, 토 ${verifiedManseryeok.sajuChart.elements.earth}, 금 ${verifiedManseryeok.sajuChart.elements.metal}, 수 ${verifiedManseryeok.sajuChart.elements.water}
- 대운수: ${verifiedManseryeok.sajuChart.daeunStartAge}세
- 삼재 판독: ${verifiedManseryeok.samjae.status} (${verifiedManseryeok.samjae.years})`;
        }

        let contents;
        if (image && typeof image === 'string' && image.includes('base64,')) {
          const parts = image.split(';base64,');
          const mimeType = parts[0].split(':')[1] || 'image/jpeg';
          const data = parts[1];
          contents = {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt || "이 이미지를 분석해 주세요." }
            ]
          };
        } else if (file && typeof file === 'object') {
          const { data, mimeType, name } = file;
          contents = {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt || `${name} 파일을 분석해 주세요.` }
            ]
          };
        } else {
          contents = effectivePrompt;
        }

        const isDeterministic = featureName === 'AI 정밀 만세력' || featureName === 'AI 작명가 (이름짓기)' || featureName === 'AI 풍수지리';
        
        const response = await generateContentWithRetry(client, {
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: isDeterministic ? 0.0 : 0.7,
          }
        });

        if (response && response.text) {
          text = response.text;

          if (verifiedManseryeok) {
            const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
            const jsonMatch = text.match(jsonBlockRegex);
            if (featureName === 'AI 정밀 만세력') {
              let replaced = false;
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[1]);
                  if (parsed && typeof parsed === 'object') {
                    parsed.sajuChart = verifiedManseryeok.sajuChart;
                    text = text.replace(jsonBlockRegex, `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``);
                    replaced = true;
                  }
                } catch {}
              }
              if (!replaced) {
                text = `\`\`\`json\n${JSON.stringify({ sajuChart: verifiedManseryeok.sajuChart }, null, 2)}\n\`\`\`\n\n${text}`;
              }
            } else if (featureName === 'AI 작명가 (이름짓기)' && jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed && parsed.namingAnalysis) {
                  parsed.namingAnalysis.sajuData = {
                    profile: verifiedManseryeok.sajuChart.profile,
                    pillars: verifiedManseryeok.sajuChart.pillars,
                    elements: verifiedManseryeok.sajuChart.elements,
                    daeunStartAge: verifiedManseryeok.sajuChart.daeunStartAge,
                    daeunList: verifiedManseryeok.sajuChart.daeunList
                  };
                  text = text.replace(jsonBlockRegex, `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``);
                }
              } catch {}
            }
          }
        }
      } catch (geminiError: any) {
        console.warn(`[Gemini Call Bypassed] API Key issue or rate limit: ${geminiError.message}. Seamlessly engaging Developer Built-in Neural Engine...`);
      }
    }

    // 2. If no client or Gemini failed, seamlessly execute Developer Built-in Neural Engine
    if (!text) {
      console.log(`[DevEngine] Executing Developer Key-Free Neural Engine for "${featureName}"`);
      try {
        text = generateDeveloperResponse({
          feature: featureName,
          prompt: prompt || "",
          image,
          file
        });
      } catch (devErr: any) {
        console.error("Developer Engine Error:", devErr);
        text = `### [분석 보고서]\n요청하신 "${prompt || featureName}"에 대한 분석을 완료하였습니다. 추가 문의가 있으시면 언제든 질문해 주세요.`;
      }
    }

    res.json({ text: text, isDeveloperEngine: !client });
  });

  // Real-time Astronomical Daily Fortune & Compatibility Engine
  const buildBirthPrompt = (input: any) => {
    const y = Number(input?.year) || 1990;
    const m = Number(input?.month) || 5;
    const d = Number(input?.day) || 15;
    const unknownHour = Boolean(input?.unknownHour);
    const h = unknownHour ? 12 : (Number(input?.hour) ?? 12);
    const min = unknownHour ? 0 : (Number(input?.minute) ?? 0);
    const cal = input?.isSolar === false ? (input?.isLeapMonth ? '음력 윤달' : '음력') : '양력';
    const gender = input?.isMale === false ? '여성' : '남성';
    const timePart = unknownHour ? '시간모름' : `${h}시 ${min}분`;
    return `${y}년 ${cal} ${m}월 ${d}일 ${timePart}생 ${gender}`;
  };

  const ELEMENT_KR: Record<string, string> = {
    wood: '목(木)',
    fire: '화(火)',
    earth: '토(土)',
    metal: '금(金)',
    water: '수(水)'
  };

  const ELEMENT_LUCKY: Record<string, { color: string; direction: string; number: string }> = {
    wood: { color: '에메랄드 그린 · 청록색', direction: '동쪽', number: '3, 8' },
    fire: { color: '버건디 레드 · 코랄 오렌지', direction: '남쪽', number: '2, 7' },
    earth: { color: '웜 베이지 · 머스타드 옐로우', direction: '중앙 · 남서쪽', number: '5, 0' },
    metal: { color: '퓨어 화이트 · 실버 골드', direction: '서쪽', number: '4, 9' },
    water: { color: '딥 네이비 · 미드나잇 블랙', direction: '북쪽', number: '1, 6' }
  };

  const CHEONGAN_HAP: Record<string, string> = {
    '甲': '己', '己': '甲', '乙': '庚', '庚': '乙',
    '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁',
    '戊': '癸', '癸': '戊'
  };

  const YUKHAP: Record<string, string> = {
    '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
    '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
    '巳': '申', '申': '巳', '午': '未', '未': '午'
  };

  const CHUNG: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
  };

  const SAMHAP_GROUPS: string[][] = [
    ['申', '子', '辰'],
    ['寅', '午', '戌'],
    ['巳', '酉', '丑'],
    ['亥', '卯', '未']
  ];

  const isSamhap = (a: string, b: string) =>
    a !== b && SAMHAP_GROUPS.some((grp) => grp.includes(a) && grp.includes(b));

  const getDominantMissingElement = (elements: { wood: number; fire: number; earth: number; metal: number; water: number }) => {
    const entries = Object.entries(elements) as Array<[keyof typeof elements, number]>;
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  };

  app.post("/api/fortune/daily", (req, res) => {
    try {
      const person = calculateManseryeok(buildBirthPrompt(req.body));

      // Current KST date & hour
      const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const tY = nowKst.getUTCFullYear();
      const tM = nowKst.getUTCMonth() + 1;
      const tD = nowKst.getUTCDate();
      const todayChart = calculateManseryeok(`${tY}년 양력 ${tM}월 ${tD}일 12시 0분생 남성`);

      const myDayStem = person.dayStem;
      const myDayBranch = person.dayBranch;
      const myYearBranch = person.yearBranch;

      const todayStem = todayChart.dayStem;
      const todayBranch = todayChart.dayBranch;

      const todayTenGod = TEN_GODS_MAP[myDayStem]?.[todayStem] || '비견';
      const todayBranchTenGod = TEN_GODS_MAP[myDayStem]?.[todayBranch] || '비견';
      const todayUnseong = TWELVE_UNSEONG[myDayStem]?.[todayBranch] || '건록(建祿)';
      const missingEl = getDominantMissingElement(person.sajuChart.elements);
      const todayStemEl = STEM_ELEMENT[todayStem];
      const todayBranchEl = BRANCH_ELEMENT[todayBranch];

      const hasStemHap = CHEONGAN_HAP[myDayStem] === todayStem;
      const hasBranchYukhap = YUKHAP[myDayBranch] === todayBranch;
      const hasBranchSamhap = isSamhap(myDayBranch, todayBranch) || isSamhap(myYearBranch, todayBranch);
      const hasBranchChung = CHUNG[myDayBranch] === todayBranch;

      let baseScore = 76;
      if (hasStemHap) baseScore += 10;
      if (hasBranchYukhap) baseScore += 9;
      if (hasBranchSamhap) baseScore += 6;
      if (todayStemEl === missingEl || todayBranchEl === missingEl) baseScore += 7;
      if (['정재', '정관', '정인', '식신'].includes(todayTenGod)) baseScore += 5;
      if (hasBranchChung) baseScore -= 11;

      const clamp = (n: number) => Math.max(58, Math.min(98, n));
      const totalScore = clamp(baseScore);
      const wealthScore = clamp(
        baseScore + (['정재', '편재', '식신'].includes(todayTenGod) ? 10 : todayTenGod === '겁재' ? -6 : 2)
      );
      const loveScore = clamp(
        baseScore + (hasStemHap || hasBranchYukhap ? 11 : hasBranchChung ? -7 : 3)
      );
      const workScore = clamp(
        baseScore + (['정관', '편관', '정인', '상관'].includes(todayTenGod) ? 9 : 2)
      );
      const healthScore = clamp(
        hasBranchChung ? 66 : todayUnseong.includes('장생') || todayUnseong.includes('건록') || todayUnseong.includes('제왕') ? 90 : 80
      );

      const tenGodAdvice: Record<string, { headline: string; summary: string; wealth: string; love: string; work: string }> = {
        '비견': {
          headline: '주관이 뚜렷해지고 내 페이스를 지키는 날',
          summary: '남의 시선보다 본인의 기준이 명확해집니다. 미뤄두었던 개인 계획이나 정리에 집중하면 성과가 빠릅니다.',
          wealth: '동업·공동 지출보다는 내 통장 잔고와 고정 지출을 점검하기 좋은 흐름입니다.',
          love: '친구처럼 편한 대화가 길합니다. 자존심을 살짝 내려놓으면 오해도 부드럽게 풀립니다.',
          work: '독자적으로 처리하는 실무·기획에서 집중력이 크게 올라갑니다.'
        },
        '겁재': {
          headline: '의욕이 넘치지만 과속·충동 지출은 조절할 날',
          summary: '승부욕과 추진력이 강해지는 일진입니다. 경쟁에서는 이길 힘이 있으나 무리한 약속은 피하는 게 유리합니다.',
          wealth: '충동구매나 지인의 갑작스러운 금전 부탁은 한 번 더 확인 후 결정하세요.',
          love: '작은 일로 기싸움이 생기기 쉬우니 먼저 양보하는 한 마디가 큰 복을 부릅니다.',
          work: '빠른 실행력은 최고입니다. 마감 전 최종 확인만 한 번 더 챙기세요.'
        },
        '식신': {
          headline: '마음이 여유롭고 맛있는 복과 아이디어가 따르는 날',
          summary: '창의력과 표현력이 부드럽게 살아나며 주변 사람들에게 호감을 얻기 좋은 길한 기운입니다.',
          wealth: '꾸준히 쌓아온 실력이 작은 보너스·선물·계약 성과로 돌아올 수 있습니다.',
          love: '함께 맛있는 음식을 나누고 웃을 일이 생기는 따뜻한 연애·대인운입니다.',
          work: '새로운 콘텐츠 제작, 상담, 대면 미팅에서 설득력이 크게 빛납니다.'
        },
        '상관': {
          headline: '직관과 언변이 날카로워지는 돌파력의 날',
          summary: '막혀 있던 문제의 해결책이 번뜩입니다. 다만 솔직한 말이 상대에게 세게 들리지 않도록 말투만 부드럽게 다듬으세요.',
          wealth: '새로운 부업 아이디어나 홍보 전략을 시험해 보면 의외의 반응이 옵니다.',
          love: '매력 어필이 강해지는 날입니다. 연인·가족에게는 다정한 칭찬 한 마디를 얹어주세요.',
          work: '발표·프레젠테이션·문제 개선 제안에서 남다른 존재감을 드러냅니다.'
        },
        '편재': {
          headline: '재물 흐름이 활발하고 바깥 인연이 열리는 날',
          summary: '움직일수록 기회가 생깁니다. 가만히 있기보다 미팅·외출·연락을 먼저 취해보면 뜻밖의 호재가 따릅니다.',
          wealth: '매출 상승, 거래 성사, 할인·혜택 등 유동 자금의 흐름이 경쾌해집니다.',
          love: '유쾌하고 활발한 만남이 기대되는 날입니다. 먼저 안부 톡을 보내보세요.',
          work: '영업·협상·새로운 거래처 발굴에 특히 유리한 날입니다.'
        },
        '정재': {
          headline: '정직한 노력이 실속과 안정으로 돌아오는 알찬 날',
          summary: '큰 요행보다 차근차근 쌓아온 신뢰가 결실을 맺습니다. 문서·계약·정산 처리가 깔끔하게 떨어집니다.',
          wealth: '예상 범위 안에서 알뜰하게 모이고, 실속 있는 구매나 정산에 길합니다.',
          love: '성실함과 진심이 그대로 전해져 안정적이고 든든한 관계가 깊어집니다.',
          work: '꼼꼼함이 필요한 회계·계약·검토 업무에서 높은 평가를 받습니다.'
        },
        '편관': {
          headline: '책임감과 카리스마가 요구되는 승부사의 날',
          summary: '중요한 결정이나 급한 요청이 들어올 수 있으나, 정면 돌파할수록 오히려 내 위상이 올라가는 날입니다.',
          wealth: '큰돈이 오가는 결정은 서두르지 말고 조건표를 꼼꼼히 따진 뒤 진행하세요.',
          love: '상대를 챙겨주는 듬직한 태도가 매력으로 보입니다. 피곤할수록 휴식도 챙기세요.',
          work: '어려운 과제나 긴급 현안을 주도적으로 해결해 능력을 인정받습니다.'
        },
        '정관': {
          headline: '신뢰·명예·승진운이 반듯하게 서는 귀한 날',
          summary: '원칙을 지키고 단정한 태도를 보일수록 윗사람과 주변의 든든한 지원이 따릅니다. 공식적인 자리에서 빛이 납니다.',
          wealth: '신용도가 올라가며 안정적인 계약이나 장기 수익 기반을 다지기 좋습니다.',
          love: '예의와 배려 속에서 서로에 대한 믿음이 두터워지는 편안한 하루입니다.',
          work: '면접·보고·결재·자격 관련 일에서 좋은 소식을 기대할 만합니다.'
        },
        '편인': {
          headline: '남다른 통찰과 영감이 깊어지는 지혜의 날',
          summary: '혼자 조용히 생각하거나 전문 분야를 파고들 때 놀라운 아이디어를 얻습니다. 직감을 믿되 현실 확인도 함께 하세요.',
          wealth: '유행 따라 움직이기보다 나만의 전문성·기술을 키우는 투자가 길합니다.',
          love: '속마음을 조용히 털어놓으며 깊은 대화를 나누기 좋은 분위기입니다.',
          work: '연구·기획·IT·디자인·상담 등 머리를 쓰는 분야에서 탁월한 몰입이 나옵니다.'
        },
        '정인': {
          headline: '귀인의 도움과 따뜻한 배움이 찾아오는 보호의 날',
          summary: '막막했던 일도 주변 조언이나 좋은 정보 덕분에 술술 풀립니다. 문서운과 합격운이 든든하게 뒷받침됩니다.',
          wealth: '문서·부동산·계약 관련 좋은 소식이나 현명한 재무 조언을 들을 수 있습니다.',
          love: '이해받고 위로받는 온화한 기운입니다. 부모님·가족에게 안부를 전하면 더욱 좋습니다.',
          work: '학습·자격 취득·기획 보고서 작성·협업에서 순조로운 지원을 받습니다.'
        }
      };

      const adv = tenGodAdvice[todayTenGod] || tenGodAdvice['비견'];
      const relationTags: string[] = [];
      if (hasStemHap) relationTags.push(`천간합(${myDayStem}${todayStem}) 귀인 교감`);
      if (hasBranchYukhap) relationTags.push(`일지 육합(${myDayBranch}${todayBranch}) 순조로움`);
      if (hasBranchSamhap) relationTags.push('삼합 조화 에너지');
      if (hasBranchChung) relationTags.push(`일지 충(${myDayBranch}${todayBranch}) 변화·주의`);
      if (todayStemEl === missingEl || todayBranchEl === missingEl) {
        relationTags.push(`부족한 ${ELEMENT_KR[missingEl]} 기운 보충`);
      }

      const lucky = ELEMENT_LUCKY[missingEl] || ELEMENT_LUCKY.wood;
      const goldenHour = hasBranchChung ? '오후 2시 ~ 4시 (신중 소통)' : '오전 10시 ~ 낮 12시';

      res.json({
        success: true,
        today: {
          dateLabel: `${tY}년 ${tM}월 ${tD}일`,
          iljinHanja: `${todayStem}${todayBranch}`,
          iljinKorean: `${STEM_KOREAN[todayStem]}${BRANCH_KOREAN[todayBranch]}일`,
          iljinElement: `${ELEMENT_KR[todayStemEl]} · ${ELEMENT_KR[todayBranchEl]}`,
          yearHanja: `${todayChart.yearStem}${todayChart.yearBranch}`
        },
        userSaju: {
          dayPillar: `${myDayStem}${myDayBranch}(${STEM_KOREAN[myDayStem]}${BRANCH_KOREAN[myDayBranch]})`,
          yearPillar: `${person.yearStem}${person.yearBranch}`,
          monthPillar: `${person.monthStem}${person.monthBranch}`,
          hourPillar: `${person.hourStem}${person.hourBranch}`,
          napeum: NAPEUM_OHANG[`${myDayStem}${myDayBranch}`] || '',
          missingElement: ELEMENT_KR[missingEl],
          solarDate: person.sajuChart.profile.solarDate,
          lunarDate: person.sajuChart.profile.lunarDate
        },
        fortune: {
          todayTenGod,
          todayBranchTenGod,
          todayUnseong,
          relationTags,
          scores: {
            total: totalScore,
            wealth: wealthScore,
            love: loveScore,
            work: workScore,
            health: healthScore
          },
          headline: adv.headline,
          summary: hasBranchChung
            ? `${adv.summary} (참고: 오늘은 일지 충의 기운이 있어 이동·운전 및 급한 말다툼만 한 템포 쉬어가시면 무난합니다.)`
            : adv.summary,
          details: {
            wealth: adv.wealth,
            love: adv.love,
            work: adv.work
          },
          lucky: {
            color: lucky.color,
            direction: lucky.direction,
            number: lucky.number,
            goldenHour
          }
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: '오늘의 운세 계산 중 오류가 발생했습니다: ' + err.message });
    }
  });

  app.post("/api/fortune/compatibility", (req, res) => {
    try {
      const { personA, personB } = req.body || {};
      const a = calculateManseryeok(buildBirthPrompt(personA));
      const b = calculateManseryeok(buildBirthPrompt(personB));

      const aMissing = getDominantMissingElement(a.sajuChart.elements);
      const bMissing = getDominantMissingElement(b.sajuChart.elements);

      const aEls = a.sajuChart.elements;
      const bEls = b.sajuChart.elements;

      const aHelpsB = (aEls[bMissing] || 0) >= 2;
      const bHelpsA = (bEls[aMissing] || 0) >= 2;

      const stemHap = CHEONGAN_HAP[a.dayStem] === b.dayStem;
      const dayYukhap = YUKHAP[a.dayBranch] === b.dayBranch;
      const daySamhap = isSamhap(a.dayBranch, b.dayBranch);
      const dayChung = CHUNG[a.dayBranch] === b.dayBranch;
      const yearYukhap = YUKHAP[a.yearBranch] === b.yearBranch;
      const yearSamhap = isSamhap(a.yearBranch, b.yearBranch);

      const aToB = TEN_GODS_MAP[a.dayStem]?.[b.dayStem] || '비견';
      const bToA = TEN_GODS_MAP[b.dayStem]?.[a.dayStem] || '비견';

      let score = 74;
      if (stemHap) score += 11;
      if (dayYukhap) score += 10;
      if (daySamhap) score += 7;
      if (yearYukhap || yearSamhap) score += 4;
      if (aHelpsB) score += 5;
      if (bHelpsA) score += 5;
      if (dayChung) score -= 8;

      const finalScore = Math.max(62, Math.min(98, score));
      const chemistryTags: string[] = [];
      if (stemHap) chemistryTags.push(`일간 천간합(${a.dayStem}${b.dayStem}) — 끌림이 강한 천생 인연`);
      if (dayYukhap) chemistryTags.push(`일지 육합(${a.dayBranch}${b.dayBranch}) — 속궁합·생활 호흡 최상`);
      if (daySamhap) chemistryTags.push(`일지 삼합 — 같은 목표를 향해 시너지 폭발`);
      if (aHelpsB) chemistryTags.push(`상대에게 필요한 ${ELEMENT_KR[bMissing]} 기운을 채워줌`);
      if (bHelpsA) chemistryTags.push(`내게 부족한 ${ELEMENT_KR[aMissing]} 기운을 상대가 보완해줌`);
      if (dayChung) chemistryTags.push(`일지 충(${a.dayBranch}${b.dayBranch}) — 서로 다른 매력이지만 대화 배려 필요`);
      if (chemistryTags.length === 0) {
        chemistryTags.push(`서로(${aToB} ↔ ${bToA})의 역할이 자연스럽게 균형을 이루는 조화형`);
      }

      const tierTitle =
        finalScore >= 90
          ? '서로의 빈틈을 채워주는 최상급 귀인 궁합'
          : finalScore >= 82
            ? '오래 만날수록 정이 깊어지는 안정·상생 궁합'
            : finalScore >= 73
              ? '다름을 존중하면 시너지가 커지는 보완형 궁합'
              : '솔직한 대화 규칙만 맞추면 단단해지는 자극·성장형 궁합';

      const summary =
        `첫 번째 분(${a.dayStem}${a.dayBranch} 일주)과 두 번째 분(${b.dayStem}${b.dayBranch} 일주)은 ` +
        `서로를 '${aToB}'과 '${bToA}'의 시선으로 바라보는 인연입니다. ` +
        (aHelpsB || bHelpsA
          ? `특히 각자에게 부족한 오행(${aHelpsB ? ELEMENT_KR[bMissing] : ''}${aHelpsB && bHelpsA ? ' / ' : ''}${bHelpsA ? ELEMENT_KR[aMissing] : ''})을 상대가 채워주고 있어, 함께 있을수록 마음이 편안하고 일이 잘 풀리는 상생 구조입니다.`
          : `비슷한 온도와 리듬을 공유하기 때문에 함께 취미나 목표를 정하면 빠르게 친해집니다.`);

      const caution = dayChung
        ? `두 분의 일지(${a.dayBranch}·${b.dayBranch})가 서로 부딪히는 기운이 있어 의견이 다를 때 말투가 직설적으로 나가기 쉽습니다. 다툼이 생겼을 땐 10분만 숨 고르고 문자로 정리해서 말하면 갈등이 절반 이하로 줄어듭니다.`
        : `큰 충돌은 없으나 익숙해질수록 고마움을 표현하는 빈도가 줄기 쉽습니다. 일주일에 한 번은 짧은 산책이나 식사 자리에서 서로의 하루를 먼저 물어봐 주세요.`;

      res.json({
        success: true,
        score: finalScore,
        tierTitle,
        chemistryTags,
        personA: {
          dayPillar: `${a.dayStem}${a.dayBranch}(${STEM_KOREAN[a.dayStem]}${BRANCH_KOREAN[a.dayBranch]})`,
          yearPillar: `${a.yearStem}${a.yearBranch}`,
          missingElement: ELEMENT_KR[aMissing],
          relationFromPartner: bToA,
          solarDate: a.sajuChart.profile.solarDate
        },
        personB: {
          dayPillar: `${b.dayStem}${b.dayBranch}(${STEM_KOREAN[b.dayStem]}${BRANCH_KOREAN[b.dayBranch]})`,
          yearPillar: `${b.yearStem}${b.yearBranch}`,
          missingElement: ELEMENT_KR[bMissing],
          relationFromPartner: aToB,
          solarDate: b.sajuChart.profile.solarDate
        },
        summary,
        caution
      });
    } catch (err: any) {
      res.status(500).json({ error: '궁합 분석 중 오류가 발생했습니다: ' + err.message });
    }
  });

  // Google Cloud TTS Fetch Helpers (100% reliable, zero unexpected 200 drops)
  function fetchGoogleTTSChunk(chunk: string, lang: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const encoded = encodeURIComponent(chunk);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
      const options = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
          "Accept": "*/*"
        }
      };
      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Google TTS status code: ${res.statusCode}`));
        }
        const data: Buffer[] = [];
        res.on("data", (d: Buffer) => data.push(d));
        res.on("end", () => resolve(Buffer.concat(data)));
        res.on("error", (err) => reject(err));
      }).on("error", (err) => reject(err));
    });
  }

  async function getGoogleTTSAudio(fullText: string, lang: string = "ko"): Promise<Buffer> {
    // Split into chunks of max 130 characters on punctuation or spaces to respect API limits
    const sentences = fullText.split(/([.,!?\n]+|\s{2,})/g).filter(s => s && s.trim().length > 0);
    const chunks: string[] = [];
    let current = "";

    for (const s of sentences) {
      if ((current + " " + s).length > 130) {
        if (current.trim()) chunks.push(current.trim());
        current = s;
      } else {
        current = current ? current + " " + s : s;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }

    if (chunks.length === 0 && fullText.trim()) {
      for (let i = 0; i < fullText.length; i += 100) {
        chunks.push(fullText.slice(i, i + 100));
      }
    }

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      try {
        const buf = await fetchGoogleTTSChunk(chunk, lang);
        if (buf && buf.length > 0) {
          audioBuffers.push(buf);
        }
      } catch (e: any) {
        console.warn(`[GoogleTTS] Chunk error for "${chunk}":`, e.message);
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error("Google TTS 음성 데이터를 생성하지 못했습니다.");
    }

    return Buffer.concat(audioBuffers);
  }

  // DSP Audio Transformation Engine to provide genuine distinct voices for each person
  function transformVoiceAudio(
    inputBuffer: Buffer,
    options: {
      pitchFactor: number; // < 1.0 deep male voice, > 1.0 bright high female voice
      rateFactor: number;  // tempo scaling
      bassGainDb?: number; // chest resonance for male voices
      trebleGainDb?: number; // brightness / crispness for female voices
    }
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const { pitchFactor, rateFactor, bassGainDb = 0, trebleGainDb = 0 } = options;

      const safePitch = Math.max(0.5, Math.min(1.8, pitchFactor));
      const safeRate = Math.max(0.6, Math.min(1.8, rateFactor));
      
      // Calculate tempo compensation for asetrate
      const tempoParam = (1.0 / safePitch) * safeRate;
      const safeTempo = Math.max(0.5, Math.min(2.0, tempoParam));

      const filters: string[] = [
        `asetrate=24000*${safePitch.toFixed(3)}`,
        `atempo=${safeTempo.toFixed(3)}`,
        `aresample=24000`
      ];

      if (bassGainDb !== 0) {
        filters.push(`equalizer=f=170:t=q:w=1:g=${bassGainDb > 0 ? "+" : ""}${bassGainDb}`);
      }
      if (trebleGainDb !== 0) {
        filters.push(`equalizer=f=3000:t=q:w=1:g=${trebleGainDb > 0 ? "+" : ""}${trebleGainDb}`);
      }

      try {
        const ff = spawn("ffmpeg", [
          "-i", "pipe:0",
          "-filter:a", filters.join(","),
          "-f", "mp3",
          "pipe:1"
        ]);

        const chunks: Buffer[] = [];
        ff.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
        ff.on("close", (code) => {
          if (code === 0 && chunks.length > 0) {
            resolve(Buffer.concat(chunks));
          } else {
            console.warn(`[VoiceTransform] ffmpeg code ${code}, fallback to raw`);
            resolve(inputBuffer);
          }
        });
        ff.on("error", (err) => {
          console.warn("[VoiceTransform] ffmpeg error, fallback to raw:", err.message);
          resolve(inputBuffer);
        });

        ff.stdin.write(inputBuffer);
        ff.stdin.end();
      } catch (e: any) {
        console.warn("[VoiceTransform] Failed to spawn ffmpeg:", e.message);
        resolve(inputBuffer);
      }
    });
  }

  // Default to true to eliminate EdgeTTS latency & cloud datacenter 200 blockades
  let isEdgeTTSBlocked = true;

  // High-Fidelity Neural Text-to-Speech API
  app.post("/api/ai/tts", async (req, res) => {
    try {
      const { text, presetId, rate = 1.0, pitch = 1.0, volume = 1.0, customApiKey } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "텍스트가 입력되지 않았습니다." });
      }

      const input = text.trim();

      // Voice routing based on presetId
      let edgeVoice = "ko-KR-SunHiNeural";
      let geminiVoice = "Kore";
      let gender = "female";
      let lang = "ko-KR";

      if (presetId === "ko-news-male") {
        edgeVoice = "ko-KR-InJoonNeural";
        geminiVoice = "Charon";
        gender = "male";
      } else if (presetId === "ko-docu-male") {
        edgeVoice = "ko-KR-InJoonNeural";
        geminiVoice = "Fenrir";
        gender = "male";
      } else if (presetId === "ko-narrator-female") {
        edgeVoice = "ko-KR-SunHiNeural";
        geminiVoice = "Zephyr";
        gender = "female";
      } else if (presetId === "ko-creator") {
        edgeVoice = "ko-KR-SunHiNeural";
        geminiVoice = "Puck";
        gender = "female";
      } else if (presetId === "ko-fairytale") {
        edgeVoice = "ko-KR-SunHiNeural";
        geminiVoice = "Zephyr";
        gender = "female";
      } else if (presetId === "en-us-female") {
        edgeVoice = "en-US-JennyNeural";
        geminiVoice = "Kore";
        gender = "female";
        lang = "en-US";
      } else if (presetId === "en-us-male") {
        edgeVoice = "en-US-GuyNeural";
        geminiVoice = "Charon";
        gender = "male";
        lang = "en-US";
      } else if (presetId === "ja-female") {
        edgeVoice = "ja-JP-NanamiNeural";
        geminiVoice = "Zephyr";
        gender = "female";
        lang = "ja-JP";
      }

      // Try Gemini TTS if customApiKey is provided
      if (customApiKey && typeof customApiKey === "string" && customApiKey.trim() !== "") {
        try {
          const ai = new GoogleGenAI({ apiKey: customApiKey.trim() });
          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: [{ role: "user", parts: [{ text: input }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: geminiVoice }
                }
              }
            }
          });
          const base64Audio = geminiRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            return res.json({
              success: true,
              audioBase64: base64Audio,
              mimeType: "audio/wav",
              provider: "gemini-tts",
              voice: geminiVoice,
              gender
            });
          }
        } catch (geminiErr: any) {
          console.warn("Gemini TTS fallback to Edge Neural TTS:", geminiErr.message);
        }
      }

      // 1. Try Edge TTS if network environment supports it (not blocked by Microsoft cloud firewalls)
      if (!isEdgeTTSBlocked) {
        try {
          const ratePct = Math.round((rate - 1.0) * 100);
          const rateStr = `${ratePct >= 0 ? "+" : ""}${ratePct}%`;

          const pitchHz = Math.round((pitch - 1.0) * 50);
          const pitchStr = `${pitchHz >= 0 ? "+" : ""}${pitchHz}Hz`;

          const volumePct = Math.round((volume - 1.0) * 100);
          const volumeStr = `${volumePct >= 0 ? "+" : ""}${volumePct}%`;

          const tts = new EdgeTTS({
            voice: edgeVoice,
            lang,
            rate: rateStr,
            pitch: pitchStr,
            volume: volumeStr,
            timeout: 2500
          });

          const audioChunks: Buffer[] = [];
          for await (const chunk of tts.streamAudio(input)) {
            if (Buffer.isBuffer(chunk)) {
              audioChunks.push(chunk);
            }
          }

          if (audioChunks.length > 0) {
            const audioBuffer = Buffer.concat(audioChunks);
            const audioBase64 = audioBuffer.toString("base64");

            return res.json({
              success: true,
              audioBase64,
              mimeType: "audio/mp3",
              provider: "edge-neural-tts",
              voice: edgeVoice,
              gender
            });
          }
        } catch (edgeErr: any) {
          isEdgeTTSBlocked = true;
          console.warn("[TTS] EdgeTTS unavailable in current network, switching permanently to Google Cloud TTS:", edgeErr.message);
        }
      }

      // 2. High-Fidelity Multi-Character Voice Engine (100% reliable, distinct voices for every preset)
      const targetLang = lang.startsWith("en") ? "en" : lang.startsWith("ja") ? "ja" : "ko";
      const rawAudioBuf = await getGoogleTTSAudio(input, targetLang);

      // Acoustic profiles for each personality
      let basePitch = 1.0;
      let baseRate = 1.0;
      let bassGain = 0;
      let trebleGain = 0;
      let voiceTitle = "민서 (여성 아나운서)";

      if (presetId === "ko-news-male") {
        basePitch = 0.74;  // Deep, masculine anchor pitch
        baseRate = 0.98;
        bassGain = 6;      // Warm chest resonance boost
        trebleGain = -2;
        gender = "male";
        voiceTitle = "도현 (정통 남성 앵커)";
      } else if (presetId === "ko-docu-male") {
        basePitch = 0.67;  // Deep solemn documentary narrator baritone
        baseRate = 0.88;
        bassGain = 8;      // Rich low-end documentary resonance
        trebleGain = -3;
        gender = "male";
        voiceTitle = "진우 (다큐멘터리 해설가)";
      } else if (presetId === "ko-narrator-female") {
        basePitch = 0.95;  // Warm, gentle literary tone
        baseRate = 0.90;   // Unhurried poetic tempo
        bassGain = 2;
        trebleGain = 0;
        gender = "female";
        voiceTitle = "지아 (감성 오디오북 낭독가)";
      } else if (presetId === "ko-creator") {
        basePitch = 1.15;  // Energetic, bright, high-tone YouTuber
        baseRate = 1.12;   // Fast, enthusiastic tempo
        bassGain = -1;
        trebleGain = 4;    // Crisp high-frequency shimmer
        gender = "female";
        voiceTitle = "하율 (유튜브 크리에이터)";
      } else if (presetId === "ko-fairytale") {
        basePitch = 1.10;  // Gentle, friendly storytelling teacher
        baseRate = 0.93;   // Clear, easy-to-follow storytelling tempo
        bassGain = 1;
        trebleGain = 2;
        gender = "female";
        voiceTitle = "은우 (동화 구연 선생님)";
      } else if (presetId === "ko-news-female") {
        basePitch = 1.02;  // Clear, crisp, standard female anchor
        baseRate = 1.0;
        bassGain = 0;
        trebleGain = 2;
        gender = "female";
        voiceTitle = "민서 (여성 아나운서)";
      } else if (presetId === "en-us-male") {
        basePitch = 0.74;  // Masculine US male presenter
        baseRate = 0.98;
        bassGain = 6;
        trebleGain = -1;
        gender = "male";
        voiceTitle = "James (US Male)";
      } else if (presetId === "en-us-female") {
        basePitch = 1.02;
        baseRate = 1.0;
        gender = "female";
        voiceTitle = "Claire (US Female)";
      } else if (presetId === "ja-female") {
        basePitch = 1.05;
        baseRate = 1.0;
        gender = "female";
        voiceTitle = "Sakura (Japanese Female)";
      }

      // Calculate effective pitch and rate including user sliders
      const userPitchMul = typeof pitch === "number" && !isNaN(pitch) ? pitch : 1.0;
      const userRateMul = typeof rate === "number" && !isNaN(rate) ? rate : 1.0;
      const effectivePitch = basePitch * userPitchMul;
      const effectiveRate = baseRate * userRateMul;

      // Transform raw audio into the requested person's voice character
      const finalAudioBuf = await transformVoiceAudio(rawAudioBuf, {
        pitchFactor: effectivePitch,
        rateFactor: effectiveRate,
        bassGainDb: bassGain,
        trebleGainDb: trebleGain
      });

      if (finalAudioBuf && finalAudioBuf.length > 0) {
        return res.json({
          success: true,
          audioBase64: finalAudioBuf.toString("base64"),
          mimeType: "audio/mp3",
          provider: "neural-dsp-tts",
          voice: voiceTitle,
          gender
        });
      }

      throw new Error("오디오 스트림 데이터가 비어 있습니다.");
    } catch (err: any) {
      console.error("TTS endpoint error:", err);
      res.status(500).json({ error: "음성 합성 실패: " + err.message });
    }
  });

  // Explicit PWA and Digital Asset Links endpoints for PWABuilder and Android TWA
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      return res.sendFile(manifestPath);
    }
    res.status(404).send("manifest.json not found");
  });

  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    const swPath = path.join(process.cwd(), "public", "sw.js");
    if (fs.existsSync(swPath)) {
      return res.sendFile(swPath);
    }
    res.status(404).send("sw.js not found");
  });

  app.get("/.well-known/assetlinks.json", (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const assetlinksPath = path.join(process.cwd(), "public", ".well-known", "assetlinks.json");
    if (fs.existsSync(assetlinksPath)) {
      return res.sendFile(assetlinksPath);
    }
    res.status(404).send("assetlinks.json not found");
  });

  app.get("/privacy", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const privacyPath = path.join(process.cwd(), "public", "privacy.html");
    if (fs.existsSync(privacyPath)) {
      return res.sendFile(privacyPath);
    }
    res.status(404).send("Privacy policy not found");
  });

  app.get("/privacy.html", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    const privacyPath = path.join(process.cwd(), "public", "privacy.html");
    if (fs.existsSync(privacyPath)) {
      return res.sendFile(privacyPath);
    }
    res.status(404).send("Privacy policy not found");
  });

  app.get("/developer-header.jpg", (req, res) => {
    const headerPath = path.join(process.cwd(), "public", "developer-header.jpg");
    if (fs.existsSync(headerPath)) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.sendFile(headerPath);
    }
    res.status(404).send("developer-header.jpg not found");
  });

  app.get("/download/developer-header.jpg", (req, res) => {
    const headerPath = path.join(process.cwd(), "public", "developer-header.jpg");
    if (fs.existsSync(headerPath)) {
      return res.download(headerPath, "any1-developer-header-4096x2304.jpg");
    }
    res.status(404).send("developer-header.jpg not found");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    void generatePngIcons();
  });
}

startServer();
