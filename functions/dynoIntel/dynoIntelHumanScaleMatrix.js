/**
 * v5.2 — Shared population-class pyramid + overall/neuro/volume praise slots (zh-Hant).
 * DESIGN INTENT: zh macro uses dedicated overall copy while micro keeps neuro/volume routing.
 * v5.3 — en overlay: all decades 0–150 weld synced EN epic praise from i18n (parity with zh-Hant).
 */

import {
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE,
  DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN,
} from "./dynoIntelHumanPraise.data.js";

function resolvePraiseByDecade(locale, decadeKey) {
  if (locale === "en") {
    return (
      DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN[decadeKey] ??
      DYNO_INTEL_HUMAN_PRAISE_BY_DECADE_EN["0"] ??
      null
    );
  }
  return DYNO_INTEL_HUMAN_PRAISE_BY_DECADE[decadeKey] ?? DYNO_INTEL_HUMAN_PRAISE_BY_DECADE["0"];
}

/**
 * zh-Hant + en: merge synced praise slots (overall / neuro / volume) when i18n corpus exists.
 */
function scaleBucket({ decadeKey, tierId, scoreRange, populationClass, summaryHuman, locale = "zh-Hant" }) {
  const praise = resolvePraiseByDecade(locale, decadeKey);

  if (locale === "en" && !praise) {
    return {
      tierId,
      scoreRange,
      populationClass,
      summaryHuman,
      overall: summaryHuman,
      neuro_male: summaryHuman,
      neuro_female: summaryHuman,
      volume_male: summaryHuman,
      volume_female: summaryHuman,
    };
  }

  const overall = praise?.overall ?? summaryHuman;
  const neuro = praise?.neuro ?? summaryHuman;
  const volume = praise?.volume ?? summaryHuman;
  return {
    tierId,
    scoreRange,
    populationClass: praise?.populationClass ?? populationClass,
    summaryHuman: overall,
    overall,
    neuro_male: neuro,
    neuro_female: neuro,
    volume_male: volume,
    volume_female: volume,
  };
}

const scaleBucketEn = (row) => scaleBucket({ ...row, locale: "en" });

export const DYNO_INTEL_HUMAN_SCALE_MATRIX_ZH = {
  "150": scaleBucket({
    decadeKey: "150",
    tierId: "LEGEND",
    scoreRange: "150+",
    populationClass: "地表最強",
    summaryHuman:
      "已站上地表最強級距，絕對力量表現與生理讀數展現殿堂級主權。",
  }),
  "140": scaleBucket({
    decadeKey: "140",
    tierId: "TIER_140",
    scoreRange: "140–149",
    populationClass: "怪物領域",
    summaryHuman:
      "已踏入怪物領域，生理機能指標具備極致非凡的專項統治力。",
  }),
  "130": scaleBucket({
    decadeKey: "130",
    tierId: "TIER_130",
    scoreRange: "130–139",
    populationClass: "統計神話",
    summaryHuman:
      "已踏入統計神話級距，在超高強度對抗中展現毫無死角的專項輸出。",
  }),
  "120": scaleBucket({
    decadeKey: "120",
    tierId: "TIER_120",
    scoreRange: "120–129",
    populationClass: "歷史級別",
    summaryHuman:
      "已站上歷史級別，專項能量系統與主要肌群募集大幅甩開常規競技常模。",
  }),
  "110": scaleBucket({
    decadeKey: "110",
    tierId: "TIER_110",
    scoreRange: "110–119",
    populationClass: "超凡入聖",
    summaryHuman:
      "已錨定超凡入聖級距，絕對力量表現與爆發輸出逼近該項目金字塔頂端。",
  }),
  "100": scaleBucket({
    decadeKey: "100",
    tierId: "TIER_100",
    scoreRange: "100–109",
    populationClass: "凡體覺醒",
    summaryHuman:
      "已進入凡體覺醒，在高難度阻力或心肺週期中展現穩固的專業競技型態。",
  }),
  "90": scaleBucket({
    decadeKey: "90",
    tierId: "TIER_90",
    scoreRange: "90–99",
    populationClass: "凡人頂尖",
    summaryHuman:
      "已站上凡人頂尖，絕對力量表現中肌群協同極佳，展現清晰降維長板。",
  }),
  "80": scaleBucket({
    decadeKey: "80",
    tierId: "TIER_80",
    scoreRange: "80–89",
    populationClass: "高階玩家",
    summaryHuman:
      "已成為高階玩家，主要肌群儲備厚實，生理機能處於同齡顯著高位。",
  }),
  "70": scaleBucket({
    decadeKey: "70",
    tierId: "TIER_70",
    scoreRange: "70–79",
    populationClass: "進階健身者",
    summaryHuman:
      "已站上進階健身者級距，具備深刻且規律的科學訓練痕跡。",
  }),
  "60": scaleBucket({
    decadeKey: "60",
    tierId: "TIER_60",
    scoreRange: "60–69",
    populationClass: "大眾健康常模",
    summaryHuman:
      "已站上大眾健康常模，絕對力量表現動作流暢，讀數穩定高於群體平均。",
  }),
  "50": scaleBucket({
    decadeKey: "50",
    tierId: "TIER_50",
    scoreRange: "50–59",
    populationClass: "新手期",
    summaryHuman:
      "正處於新手期，生理功能指標皆符合標準體態健康常模入門線。",
  }),
  "40": scaleBucket({
    decadeKey: "40",
    tierId: "TIER_40",
    scoreRange: "40–49",
    populationClass: "探索期",
    summaryHuman:
      "正處於探索期，主要肌群募集與基礎機能具備清晰的優化提升空間。",
  }),
  "0": scaleBucket({
    decadeKey: "0",
    tierId: "BASE",
    scoreRange: "0–39",
    populationClass: "嬰兒期",
    summaryHuman:
      "正處於嬰兒期，生理機能處於低谷，亟需透過評測引導啟動身體機能調校。",
  }),
};

export const DYNO_INTEL_HUMAN_SCALE_MATRIX_EN = {
  "150": scaleBucketEn({
    decadeKey: "150",
    tierId: "LEGEND",
    scoreRange: "150+",
    populationClass: "Apex of the Earth Tier",
    summaryHuman:
      "You stand in Apex of the Earth Tier — absolute strength performance and physiological reads show hall-of-fame dominance.",
  }),
  "140": scaleBucketEn({
    decadeKey: "140",
    tierId: "TIER_140",
    scoreRange: "140–149",
    populationClass: "Monster Domain Tier",
    summaryHuman:
      "You sit in Monster Domain Tier with rare specialist dominance across every physiological read.",
  }),
  "130": scaleBucketEn({
    decadeKey: "130",
    tierId: "TIER_130",
    scoreRange: "130–139",
    populationClass: "Statistical Myth Tier",
    summaryHuman:
      "Your reads sit in Statistical Myth Tier with airtight specialty output under extreme stress.",
  }),
  "120": scaleBucketEn({
    decadeKey: "120",
    tierId: "TIER_120",
    scoreRange: "120–129",
    populationClass: "Historical Elite Tier",
    summaryHuman:
      "You carry Historical Elite Tier baselines — energy systems and major-muscle recruitment sit far above conventional norms.",
  }),
  "110": scaleBucketEn({
    decadeKey: "110",
    tierId: "TIER_110",
    scoreRange: "110–119",
    populationClass: "Ascended Demigod Tier",
    summaryHuman:
      "You anchor in Ascended Demigod Tier with stable absolute strength performance and peak explosive output.",
  }),
  "100": scaleBucketEn({
    decadeKey: "100",
    tierId: "TIER_100",
    scoreRange: "100–109",
    populationClass: "Mortal Awakening Tier",
    summaryHuman:
      "You hold Mortal Awakening Tier physiology with stable professional competitive patterns across hard training blocks.",
  }),
  "90": scaleBucketEn({
    decadeKey: "90",
    tierId: "TIER_90",
    scoreRange: "90–99",
    populationClass: "Peak Mortal Tier",
    summaryHuman:
      "You are Peak Mortal Tier with excellent absolute strength loading synergy and a clear specialty edge.",
  }),
  "80": scaleBucketEn({
    decadeKey: "80",
    tierId: "TIER_80",
    scoreRange: "80–89",
    populationClass: "Advanced Operator Tier",
    summaryHuman:
      "Among Advanced Operator Tier athletes you show standout norms with thick major-muscle reserves.",
  }),
  "70": scaleBucketEn({
    decadeKey: "70",
    tierId: "TIER_70",
    scoreRange: "70–79",
    populationClass: "Advanced Trainee Tier",
    summaryHuman:
      "You rank in Advanced Trainee Tier with deep, consistent training traces above the amateur majority.",
  }),
  "60": scaleBucketEn({
    decadeKey: "60",
    tierId: "TIER_60",
    scoreRange: "60–69",
    populationClass: "General Health Baseline Tier",
    summaryHuman:
      "You maintain General Health Baseline Tier habits with fluent absolute strength patterns and reads above population average.",
  }),
  "50": scaleBucketEn({
    decadeKey: "50",
    tierId: "TIER_50",
    scoreRange: "50–59",
    populationClass: "Novice Phase Tier",
    summaryHuman:
      "You lock onto Novice Phase Tier — the healthy same-age on-ramp with standard physiological markers.",
  }),
  "40": scaleBucketEn({
    decadeKey: "40",
    tierId: "TIER_40",
    scoreRange: "40–49",
    populationClass: "Exploration Phase Tier",
    summaryHuman:
      "You are in Exploration Phase Tier with clear room to improve recruitment and base capacity.",
  }),
  "0": scaleBucketEn({
    decadeKey: "0",
    tierId: "BASE",
    scoreRange: "0–39",
    populationClass: "Infant Phase Tier",
    summaryHuman:
      "You are in Infant Phase Tier — long-term under-stimulation has dragged recruitment efficiency down; assessment-guided rebuilding is the priority.",
  }),
};
