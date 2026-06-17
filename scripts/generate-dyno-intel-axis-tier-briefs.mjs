#!/usr/bin/env node
/**
 * Generates functions/dynoIntel/dynoIntelAxisTierBriefs.data.js from core.json band summaries.
 * Run: node scripts/generate-dyno-intel-axis-tier-briefs.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadCore(locale) {
  const path = join(root, "src/i18n/locales", locale, "common/core.json");
  return JSON.parse(readFileSync(path, "utf8")).scoreMeaning.bands;
}

/** Strip bracket tier tag and vehicle lexicon; preserve physiological semantics. */
function humanizeSummary(summary, metric) {
  let text = String(summary ?? "")
    .replace(/^【[^】]+】[。.!]?\s*/, "")
    .trim();

  const stripPatterns = [
    /馬力[^，。；!]*/g,
    /\d+\s*hp[^，。；!]*/gi,
    /\d+\s*Nm[^，。；!]*/gi,
    /\d+\.?\d*\s*Bar[^，。；!]*/gi,
    /排量[^，。；!]*/g,
    /渦輪[^，。；!]*/g,
    /跑車[^，。；!]*/g,
    /載具[^，。；!]*/g,
    /輪胎[^，。；!]*/g,
    /引擎[^，。；!]*/g,
    /底盤/g,
    /車架/g,
    /車體/g,
    /外裝/g,
    /葉子板[^，。；!]*/g,
    /輪框[^，。；!]*/g,
    /輪轂[^，。；!]*/g,
    /輪拱[^，。；!]*/g,
    /冷卻[^，。；!]*/g,
    /通電[^，。；!]*/g,
    /散熱[^，。；!]*/g,
    /進氣[^，。；!]*/g,
    /排氣[^，。；!]*/g,
    /氣缸[^，。；!]*/g,
    /油溫[^，。；!]*/g,
    /爆缸[^，。；!]*/g,
    /油箱[^，。；!]*/g,
    /水箱[^，。；!]*/g,
    /原廠[^，。；!]*/g,
    /改裝[^，。；!]*/g,
    /布加迪[^，。；!]*/g,
    /利曼[^，。；!]*/g,
    /FIA[^，。；!]*/g,
    /LMP[^，。；!]*/g,
    /350匹[^，。；!]*/g,
    /680匹[^，。；!]*/g,
    /1500匹[^，。；!]*/g,
    /千匹[^，。；!]*/g,
    /橡膠[^，。；!]*/g,
    /抓地[^，。；!]*/g,
    /海拉風[^，。；!]*/g,
    /Hellaflush[^，。；!]*/gi,
  ];

  for (const pattern of stripPatterns) {
    text = text.replace(pattern, "");
  }

  text = text
    .replace(/\s{2,}/g, "")
    .replace(/[，,、；;]{2,}/g, "，")
    .replace(/^[，,、；;]\s*/g, "")
    .replace(/[，,、；;]\s*$/g, "")
    .replace(/[。.]\s*[。.]+/g, "。")
    .trim();

  text = polishBriefArtifacts(text);

  if (!text || isBrokenBrief(text)) return fallbackForMetric(metric);
  if (!/[。.!]$/.test(text)) text += "。";
  return text;
}

function polishBriefArtifacts(text) {
  return String(text ?? "")
    .replace(/燃油與氧氣在，/g, "氧合與能量代謝利用率接近競技水準，")
    .replace(/核心增壓值[^，。]*/g, "核心輸出韌性")
    .replace(/完美匹配[^，。]*/g, "")
    .replace(/完美對齊[^，。]*/g, "")
    .replace(/比照[^，。]*/g, "")
    .replace(/甩尾過彎[^，。]*/g, "重載抓握")
    .replace(/高G力過彎[^，。]*/g, "高張力抓握")
    .replace(/配備賽道彈射系統/g, "具備競技級起步爆發")
    .replace(/全轉速域扭矩爆發/g, "全關節爆發輸出")
    .replace(/8汽缸[^，。]*/g, "")
    .replace(/經典美式大，/g, "結構密度接近自然訓練上限，")
    .replace(/極致的自然，/g, "去脂肌肉效率極高，")
    .replace(/排溫與，/g, "心肺循環穩定，")
    .replace(/鈦合金中央單孔鎖定結構，。/g, "臂圍結構達到絕對的視覺平衡與震撼。")
    .replace(/[，,、；;]{2,}/g, "，")
    .replace(/^[，,、；;]+/g, "")
    .replace(/[，,、；;]+$/g, "")
    .trim();
}

function isBrokenBrief(text) {
  return /在，|比照。|匹配，|彈射系統|賽道版|過彎|排溫與，|極致的自然，|8汽缸/.test(String(text ?? ""));
}

function fallbackForMetric(metric) {
  const fallbacks = {
    strength: "各項多關節力量仍有明顯提升空間。",
    explosivePower: "起步爆發與神經募集仍有優化空間。",
    cardio: "心肺續航與節奏管理仍有提升空間。",
    muscleMass: "骨骼肌量與視覺輪廓仍有提升空間。",
    bodyFat: "FFMI 去脂效率仍有優化空間。",
    gripStrength: "握力與前臂募集仍有提升空間。",
    armSize: "臂圍維度仍有提升空間。",
    cooper: "十二分鐘跑距離表現仍有提升空間。",
    "5km": "五公里跑節奏與續航仍有提升空間。",
    overall: "六軸綜合輸出仍有協同優化空間。",
  };
  return fallbacks[metric] ?? "運動表現仍有提升空間。";
}

const MANUAL_OVERRIDES_ZH = {
  strength: {
    TIER_80:
      "已達業餘運動員頂尖強度，多關節大重量動作中荷重控制逼近競技層級，在各專項運動中足以應付多數挑戰。",
    TIER_90:
      "全面突破業餘上限，大重量輸出穩定且具備極高力量天賦，核心募集開始向專業級出力靠攏。",
    TIER_120:
      "力量達全國精英水準，在國內已極少遇到對手，對極限重量展現出常人難以企及的絕對統治力。",
  },
  muscleMass: {
    TIER_90:
      "接近自然訓練的視覺天花板，肩背與四肢輪廓量體飽滿，水平視覺張力強烈擴張，全面跨越業餘界限。",
    TIER_120:
      "量體飽滿度達業餘天花板，肌纖維層厚度對標高強度訓練者與健體選手，展現絕對的量體密度。",
  },
  explosivePower: {
    TIER_80:
      "業餘運動員中高階水平，神經募集瞬間咬合爆發，起步加速已具競技感，跳箱與短跑衝刺反應靈敏。",
    TIER_90:
      "業餘運動員中的頂尖爆發力，即將跨越業餘天花板，啟動瞬間幾乎無視器械阻力，下肢功率釋放完整。",
    TIER_120:
      "爆發起跳達 NBA 頂尖後衛等級，起步能在極短時間內完成全下肢功率釋放，跳箱與短跑衝刺中展現支配級瞬爆。",
  },
  cardio: {
    TIER_80: "耐力表現已顯著超越大眾水平，長時間跑步或高頻訓練中節奏穩定，即將突破業餘行列。",
    TIER_90:
      "在同齡運動愛好者中屬高階表現，需長期苦心訓練才能達成，最大攝氧與節奏控制正向專業領域進發。",
    TIER_110:
      "進入精銳競技序列，地區賽事中具備拿牌實力，心肺耐力與抗氧化能力極強，長程輸出韌性突出。",
    TIER_120:
      "業餘跑者天花板，長程節奏跨越業餘界限，耐力賽中罕逢敵手，高強度輸出下仍能維持穩定配速。",
  },
  bodyFat: {
    TIER_40: "瘦體重與骨骼肌耐受低於大眾平均，去脂效率擁有極大優化空間，基礎架構正在建立。",
    TIER_50: "FFMI 尚偏低，具備精緻的基礎結構密度，發力模組已初具敏捷與輕量化體態基礎。",
    TIER_60: "初級運動愛好者階段，去脂肌肉量穩步爬升，核心結構具備更強的高壓耐受力。",
    TIER_70: "已踏入規律運動愛好者階段，肌肉剛性與運動表現優於多數同齡常模。",
    TIER_80: "強健的業餘運動愛好者，去脂肌肉效率跨入高位，線條與機能優於大眾平均。",
    TIER_90: "已靠近自然訓練的結構天花板，去脂肌肉密度極高，肉體蘊含的爆發潛能巨大。",
    TIER_100:
      "FFMI 去脂肌肉指數達自然健身訓練者極少數能及的水準，瘦體重密度高，全面跨越業餘天花板。",
    TIER_110: "突破自然訓練天花板，去脂肌肉量深度提升，高強度週期中維持穩定輸出。",
    TIER_120: "肌肉密度與去脂結構達精英水準，高壓極限狀態下展現絕對的機能統治力。",
  },
  gripStrength: {
    TIER_80:
      "握力表現達職業拳擊與柔術精英水準，重載抓握時前臂形變極低，力量傳遞效率大幅提升。",
    TIER_90:
      "突破業餘握力天花板，重載抓握時前臂屈肌群維持強大咬合，在大多數重載動作中提供極限操控力。",
    TIER_120:
      "達職業腕力運動員入門水準，對重力與極限阻力具備高度支配力，重載抓握穩定吸附。",
    TIER_130:
      "達菁英腕力運動員與大力士水準，常規握力器械已難以完整反映真實上限，重載抓握展現終極咬合。",
  },
  armSize: {
    TIER_80:
      "臂圍撐滿袖口，一看就是悉心鍛鍊的結果，輪廓線條分明，具備強烈的視覺壓迫感。",
    TIER_90:
      "接近自然健身臂圍評分極限，在常人中已屬大神等級，靜止狀態下亦展現強大的上臂量體。",
    TIER_120:
      "沒有頂尖基因與長期苦心鍛鍊難以達到此程度，臂圍結構達到絕對的視覺平衡與震撼。",
  },
  cooper: {
    TIER_80:
      "十二分鐘跑最大攝氧量輸出已超越大多數同齡運動愛好者，限時高壓測驗中抗疲勞反饋良好。",
    TIER_90:
      "在同齡運動愛好者中屬高階表現，十二分鐘限時輸出中無懼高心率缺氧帶來的劇烈壓力。",
    TIER_120:
      "十二分鐘限時場測天花板，面對極限時間倒數的高載荷輸出毫無懼色，距離輸出跨越業餘界限。",
  },
};

const OVERALL_TIER_ZH = {
  BASE: "六軸綜合輸出尚處起步階段，專項長板與短板落差尚未拉開，各軸均有巨大協同提升空間。",
  TIER_40: "六軸綜合讀數偏低，主要肌群募集與基礎機能具備清晰優化空間，需透過評測引導建立訓練週期。",
  TIER_50: "六軸綜合落在健康大眾基準線，各項機能指標符合標準體態，規律訓練可穩步拉高短板。",
  TIER_60: "六軸協同略優於大眾平均，規律運動痕跡可辨，多關節動作流暢度穩步上升。",
  TIER_70: "六軸綜合站上商業健身房傑出族群，專項長板開始浮現，整體輸出穩定超越業餘大眾。",
  TIER_80: "六軸協同呈現專項長板與系統短板的可量化落差，整體輸出處於業餘運動員顯著高位。",
  TIER_90: "六軸整體突破業餘上限，專項峰值與最弱環節的梯隊差距清晰可見，協同輸出逼近競技常模。",
  TIER_100: "六軸綜合具備國家級賽事常勝軍底蘊，專項長板具備降維優勢，週期承載展現專業競技型態。",
  TIER_110: "六軸協同錨定國家級頂尖運動員序列，長板具備賽事統治力，短板仍可透過週期化補齊。",
  TIER_120: "六軸綜合達國際大師級運動員底盤，專項能量系統與主要肌群募集大幅甩開常規競技常模。",
  TIER_130: "六軸讀數對標世界頂尖運動員層級，國際級高強度對抗中展現毫無死角的專項輸出。",
  TIER_140: "六軸綜合站上極限天賦神殿層級，生理機能指標具備極致非凡的專項統治力。",
  LEGEND: "六軸綜合突破生理常模極限，神經募集與骨骼肌承載展現殿堂級統治主權。",
  PANTHEON: "六軸數據溢出常規敘事，達歷史神話級終極體能規格。",
};

function buildMetricBriefs(bands, metric, locale) {
  const source = bands[metric];
  if (!source) return {};
  const overrides = locale === "zh-Hant" ? MANUAL_OVERRIDES_ZH[metric] ?? {} : {};
  const out = {};
  for (const [tierId, entry] of Object.entries(source)) {
    out[tierId] = overrides[tierId] ?? humanizeSummary(entry.summary, metric);
  }
  return out;
}

function buildZhBriefs(bands) {
  const metrics = [
    "strength",
    "explosivePower",
    "cardio",
    "muscleMass",
    "bodyFat",
    "gripStrength",
    "armSize",
    "cooper",
  ];
  const briefs = {};
  for (const metric of metrics) {
    briefs[metric] = buildMetricBriefs(bands, metric, "zh-Hant");
  }
  briefs["5km"] = {};
  for (const [tierId, text] of Object.entries(briefs.cardio)) {
    briefs["5km"][tierId] = text
      .replace(/耐力跑/g, "五公里跑")
      .replace(/長時間跑步/g, "五公里配速")
      .replace(/長程/g, "五公里")
      .replace(/巡航/g, "節奏");
  }
  briefs.overall = { ...OVERALL_TIER_ZH };
  return briefs;
}

function buildEnBriefs(bands) {
  const metrics = [
    "strength",
    "explosivePower",
    "cardio",
    "muscleMass",
    "bodyFat",
    "gripStrength",
    "armSize",
    "cooper",
  ];
  const briefs = {};
  for (const metric of metrics) {
    briefs[metric] = buildMetricBriefs(bands, metric, "en");
  }
  briefs["5km"] = { ...briefs.cardio };
  briefs.overall = {
    BASE: "Six-axis output is still forming; specialty peaks and weak links have large room to climb.",
    TIER_40:
      "Combined six-axis reads are low with clear room to rebuild recruitment and base capacity through assessment-guided training.",
    TIER_50:
      "Six-axis output sits on the healthy population average with standard physiology across metrics.",
    TIER_60:
      "Six-axis synergy sits slightly above population average with visible regular-training traces.",
    TIER_70:
      "Six-axis output ranks among strong commercial-gym performers with emerging specialty peaks.",
    TIER_80:
      "Six-axis synergy shows measurable spread between specialty peaks and systemic weak links in the upper amateur band.",
    TIER_90:
      "Whole-profile output breaks past the amateur ceiling with clear ladder spread between peaks and weak links.",
    TIER_100:
      "Six-axis synergy carries national-event winner physiology with professional competitive load tolerance.",
    TIER_110:
      "Combined output anchors in the national elite athlete band with event-level dominance on specialty peaks.",
    TIER_120:
      "Six-axis reads match international master-athlete baselines with energy systems far above conventional norms.",
    TIER_130:
      "Six-axis output benchmarks world-top athlete tiers with airtight specialty production under extreme load.",
    TIER_140:
      "Six-axis synergy reaches extreme talent temple tier with rare specialist dominance.",
    LEGEND: "Six-axis output breaks physiological norms with hall-of-fame recruitment and loading capacity.",
    PANTHEON: "Six-axis data overflows conventional narrative at myth-tier specifications.",
  };
  return briefs;
}

const zhBands = loadCore("zh-Hant");
const enBands = loadCore("en");

const payload = {
  DYNO_INTEL_AXIS_TIER_BRIEFS_ZH: buildZhBriefs(zhBands),
  DYNO_INTEL_AXIS_TIER_BRIEFS_EN: buildEnBriefs(enBands),
};

const outPath = join(root, "functions/dynoIntel/dynoIntelAxisTierBriefs.data.js");
const body = `/**
 * AUTO-GENERATED by scripts/generate-dyno-intel-axis-tier-briefs.mjs
 * DO NOT EDIT BY HAND — re-run the generator after core.json band changes.
 * DESIGN INTENT: Pure human-science tier tails aligned with scoreMeaning.bands semantics.
 */
export const DYNO_INTEL_AXIS_TIER_BRIEFS_ZH = ${JSON.stringify(payload.DYNO_INTEL_AXIS_TIER_BRIEFS_ZH, null, 2)};

export const DYNO_INTEL_AXIS_TIER_BRIEFS_EN = ${JSON.stringify(payload.DYNO_INTEL_AXIS_TIER_BRIEFS_EN, null, 2)};
`;

writeFileSync(outPath, body, "utf8");
console.log(`[generate-axis-tier-briefs] wrote ${outPath}`);
