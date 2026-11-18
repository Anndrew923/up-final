/**
 * Carbon dual-hero official verdict catalog (7 families × 13 decades × zh/en).
 * WHY: Keeps offline SSOT + family/decade lookup + critique wrap out of painters
 * so DualHero/Painter stay under line caps and Selfie HUD never gains coach copy.
 */
import type { ScoreMeaningBandMetric } from '../core/scoreMeaningCatalog';
import { COOPER_SCORE_MEANING_METRIC } from '../core/scoreMeaningCatalog';
import {
  resolveDecadeKeyFromScore,
  type HumanScaleDecadeKey,
} from '../core/humanScaleBandResolver';
import type { AestheticAxisSummaryAxis } from './axisSummaryReport';
import type { SingleLeafId } from './singleLeafReport';
import { scoreMeaningMetricForSingleLeaf } from './singleLeafScoreMeaning';

export type VerdictFamily =
  | 'strength'
  | 'explosivePower'
  | 'cardio'
  | 'muscleMass'
  | 'bodyFat'
  | 'gripStrength'
  | 'armSize';

export type VerdictDecadeKey =
  | 0
  | 40
  | 50
  | 60
  | 70
  | 80
  | 90
  | 100
  | 110
  | 120
  | 130
  | 140
  | 150;

export interface BilingualVerdictEntry {
  zh: readonly [epithet: string, critique: string];
  en: readonly [epithet: string, critique: string];
}

export interface TelemetryVerdictCopy {
  epithet: string;
  critique: string;
  /**
   * Pre-wrapped critique (≤2 lines) shared by Canvas + DOM.
   * WHY: One wrap SSOT keeps PNG export and modal preview bit-locked without ellipsis.
   */
  critiqueLines: readonly string[];
}

export type TelemetryVerdictLocale = 'zh' | 'en';

export type TelemetryVerdictTarget =
  | { reportType: 'single-leaf'; leaf: SingleLeafId }
  | { reportType: 'axis-summary'; axis: AestheticAxisSummaryAxis };

export const VERDICT_FAMILIES: readonly VerdictFamily[] = [
  'strength',
  'explosivePower',
  'cardio',
  'muscleMass',
  'bodyFat',
  'gripStrength',
  'armSize',
] as const;

export const VERDICT_DECADE_KEYS: readonly VerdictDecadeKey[] = [
  0, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150,
] as const;

/** Canvas Carbon verdict stage — logical plate px relative to verdictTop. */
export const CARBON_VERDICT_EPITHET_OFFSET_Y = 28;
export const CARBON_VERDICT_CRITIQUE_LINE1_OFFSET_Y = 62;
export const CARBON_VERDICT_CRITIQUE_LINE2_OFFSET_Y = 90;
export const CARBON_VERDICT_CRITIQUE_MAX_WIDTH = 820;
export const CARBON_VERDICT_CRITIQUE_MAX_LINES = 2;
export const CARBON_VERDICT_EPITHET_FONT_PX = 24;
export const CARBON_VERDICT_CRITIQUE_FONT_PX = 20;
export const CARBON_VERDICT_EPITHET_FILL = '#FDE68A';
export const CARBON_VERDICT_CRITIQUE_FILL = 'rgba(255, 255, 255, 0.86)';

export const TELEMETRY_VERDICT_CATALOG: Record<
  VerdictFamily,
  Record<VerdictDecadeKey, BilingualVerdictEntry>
> = {
  strength: {
    0: {
      zh: ['力量初啟者', '神經徵召逐步啟動，掌握發力與動作軌跡，力量將飛速成長。'],
      en: ['FOUNDATION BUILDER', 'Neural pathways are waking up—mastering clean bar path and bracing unlocks rapid gains.'],
    },
    40: {
      zh: ['基礎構築者', '力量起步階段，提升訓練動作熟悉度，便能快速突破門檻。'],
      en: ['BASE CONSTRUCTOR', 'Early lifting stage—building movement familiarity clears the base threshold fast.'],
    },
    50: {
      zh: ['常模突破者', '站穩大眾平均力量線，超越未訓練人群，持續推進必獲紮實回報。'],
      en: ['NORM BREAKER', 'Squarely on the public baseline—stronger than untrained novices with steady upside.'],
    },
    60: {
      zh: ['健身房主力', '力量明顯超越新手，規律訓練開始兌現，自律付出正轉化為實力。'],
      en: ['FLOOR REGULAR', 'Clearly separated from casual gym-goers—consistent barbell work is paying off.'],
    },
    70: {
      zh: ['阻力征服者', '躋身健身房前段班；穩紮穩打遠離傷病，當前力量已足以稱霸一方。'],
      en: ['LOAD CONQUEROR', 'Among the strongest lifters on the gym floor—smart progression keeps gains rolling.'],
    },
    80: {
      zh: ['重載穩壓者', '紮實肌力千錘百鍊，力量輸出媲美優秀專項競技運動員。'],
      en: ['IRON STABILIZER', 'Hard-forged muscular strength—force output matching elite competitive athletes.'],
    },
    90: {
      zh: ['凡人力量巔峰', '若非基因天選之人，已觸及凡人力量頂點，極致苦練榨出肉體極限。'],
      en: ['MORTAL SUMMIT', 'Short of winning the genetic lottery, this is the mortal peak of earned strength.'],
    },
    100: {
      zh: ['重載覺醒者', '跨越百分臨界點，踏入非凡基因領域，在任何訓練場皆是公認強者。'],
      en: ['LOAD AWAKENED', 'Past the 100-point mark into rare genetic territory—a true powerhouse on any floor.'],
    },
    110: {
      zh: ['鋼鐵支配者', '單靠苦練難達此境，具備優秀健力選手水準，地區比賽奪牌種子。'],
      en: ['STEEL DOMINATOR', 'Hard work alone rarely reaches here—solid powerlifter caliber, a regional medal seed.'],
    },
    120: {
      zh: ['殿堂級重砲', '純粹力量撕裂統計曲線，每次大重量推拉都在刷新場館歷史紀錄。'],
      en: ['HALL CANNON', 'Shattering the statistical bell curve with raw barbell force—rewriting gym records.'],
    },
    130: {
      zh: ['統計學異類', '頂尖大力士與奧運舉重奪牌級別，數據令人震撼，唯剩自身紀錄為對手。'],
      en: ['STATISTICAL ANOMALY', 'Olympic medalist and elite strongman territory—only past PRs remain as competition.'],
    },
    140: {
      zh: ['怪物級噸位', '踏入不可思議的怪物領域，絕對天賦面前，同量級對手只能承受壓制。'],
      en: ['MONSTER TONNAGE', 'True monster territory—against this genetic output, rivals face a different league.'],
    },
    150: {
      zh: ['地表最強重載', '碳基力量至高穹頂，單憑肉身將重力踩在腳下，無可匹敵的星球資產。'],
      en: ['APEX FORCE', 'The supreme dome of human strength—gravity under heel, a true planetary asset.'],
    },
  },
  explosivePower: {
    0: {
      zh: ['動能喚醒期', '快縮肌纖維正在啟動，熟悉動作與發力方式後，爆發力將飛速竄升。'],
      en: ['KINETIC SPARK', 'Fast-twitch fibers waking up—mastering movement and force sparks rapid explosive gains.'],
    },
    40: {
      zh: ['彈力積蓄者', '爆發力起步階段，透過協調練習強化下肢伸展，很快便能突破基礎門檻。'],
      en: ['ELASTIC LOADER', 'Early explosive stage—building triple-extension timing and spring clears base tiers.'],
    },
    50: {
      zh: ['敏捷起跳者', '動態功率站穩大眾平均，起步反應優於常人，彈跳與速度仍有巨大進步空間。'],
      en: ['AGILE LAUNCHER', 'Dynamic power meets public norms—quicker off the mark than most with huge room to grow.'],
    },
    60: {
      zh: ['球場突擊手', '起跳高度與瞬間加速明顯超越常人，規律訓練開始兌現，對抗總能搶先。'],
      en: ['COURT STRIKER', 'Clearly ahead of everyday adults in jump and burst—securing that lethal first step.'],
    },
    70: {
      zh: ['高功率彈射者', '瞬間發力速率達運動員傑出水準，穩紮穩打防範傷病，已具業餘競技實力。'],
      en: ['HIGH-OUTPUT SPRING', 'Standout rate of force development—smart progression makes a tough amateur contender.'],
    },
    80: {
      zh: ['雷霆彈射者', '下肢功率與啟動速度躋身群眾佼佼者，爆發力媲美業餘籃球運動員與格鬥選手。'],
      en: ['THUNDER LAUNCH', 'Among the crowd elite—explosive takeoff matching amateur basketball and combat athletes.'],
    },
    90: {
      zh: ['瞬間引爆點', '神經放電頻率觸及凡人極限，毫秒間引爆全身動能，站上自然體能巔峰。'],
      en: ['INSTANT DETONATOR', 'Neural firing at the mortal limit, unleashing full-body power in milliseconds.'],
    },
    100: {
      zh: ['超頻躍遷者', '跨越百分爆發臨界點，突破常模天花板，業餘競技場的頂尖爆發力。'],
      en: ['OVERCLOCKED LEAPER', 'Past the 100-point burst mark—top-tier explosiveness on the amateur stage.'],
    },
    110: {
      zh: ['音速突襲者', '優異快縮肌比例與肌腱回彈，啟動如閃電撕裂空氣，達優秀職業選手水準。'],
      en: ['SONIC RAIDER', 'Elite fast-twitch ratio and tendon recoil—exploding off the floor at pro caliber.'],
    },
    120: {
      zh: ['競技場掠食者', '違背常理的瞬間功率撕裂統計曲線，每次起跳與衝刺都在刷新場館紀錄。'],
      en: ['ARENA PREDATOR', 'Tearing through athletic curves with unreal peak wattage—setting new gym benchmarks.'],
    },
    130: {
      zh: ['重力叛逆者', '近乎擺脫地心引力的滯空與彈射，數據令人戰慄，在天梯書寫快肌神話。'],
      en: ['GRAVITY REBEL', 'Near-gravity-defying hang time and snap that command awe on the global ladder.'],
    },
    140: {
      zh: ['核爆級動能', '踏入不可思議的怪物領域，毀滅性瞬間加速度讓對手在起跑線即遭壓制。'],
      en: ['NUCLEAR KINETICS', 'True monster territory—devastating first-step acceleration outclasses rivals at go.'],
    },
    150: {
      zh: ['地表最強爆發', '人類快縮肌與神經反射至高穹頂，純粹速度與彈跳的化身，頂級運動資產。'],
      en: ['APEX EXPLOSION', 'The supreme pinnacle of human fast-twitch power and reflex—pure kinetic dominance.'],
    },
  },
  cardio: {
    0: {
      zh: ['有氧築基期', '有巨大的進步空間。微調作息並建立規律有氧習慣，心肺將飛速成長。'],
      en: ['AEROBIC SEED', 'Vast room to grow—tuning daily routines and aerobic habits sparks rapid cardio gains.'],
    },
    40: {
      zh: ['節奏建立者', '心肺鍛鍊是一場長跑，建立穩定呼吸與配速習慣，突破基礎門檻指日可待。'],
      en: ['PACE BUILDER', 'Cardio is a marathon, not a sprint—steady breathing and pacing clear base tiers soon.'],
    },
    50: {
      zh: ['穩態巡航者', '心肺地基站穩大眾平均，保持穩定節奏累積有氧里程。'],
      en: ['STEADY CRUISER', 'Aerobic base locked at the public average—steady pacing stacks real endurance miles.'],
    },
    60: {
      zh: ['耐力跑者', '攝氧效率明顯超越常人，身體耐力與恢復力可應付日常生活所需。'],
      en: ['ENDURANCE RUNNER', 'Oxygen delivery clearly beats everyday norms—stamina handles daily life with ease.'],
    },
    70: {
      zh: ['乳酸門檻鬥士', '掌握正確有氧配速節奏，高心率下依然沉穩不崩，持續累積里程即達高階。'],
      en: ['THRESHOLD FIGHTER', 'Dialed-in pacing holds form at high heart rates—consistent volume unlocks elite tiers.'],
    },
    80: {
      zh: ['高階巡航者', '習慣孤獨自律的長程訓練，攝氧與恢復速率遠超常人，展現強悍耐力亮點。'],
      en: ['ELITE PACER', 'Forged through solo disciplined miles—superior oxygen uptake and rapid recovery.'],
    },
    90: {
      zh: ['永動巡航者', '嚴格紀律鑄就深不見底的心肺，超越眾人的不只是配速，更是強大意志力。'],
      en: ['ENDURANCE PACE', 'Forged by strict discipline—outlasting the crowd through sheer aerobic grit.'],
    },
    100: {
      zh: ['無氧閾值覺醒', '心肺容積推進至百分以上，生理節奏掌控超越單純健康範疇，耐力賽場自帶壓迫感。'],
      en: ['THRESHOLD AWAKENED', 'Aerobic capacity past 100—control beyond mere health that presses any endurance course.'],
    },
    110: {
      zh: ['鐵肺長征者', '有氧代謝與恢復效率達優秀職業選手水準，長距離高配速巡航仍游刃有餘。'],
      en: ['IRON-LUNG STAMINA', 'Aerobic metabolism and recovery at pro-athlete caliber—holding fast splits with ease.'],
    },
    120: {
      zh: ['耐力賽場標竿', '最大攝氧功率達頂尖職業足球與格鬥選手層次，孤獨訓練刻進骨血的循環。'],
      en: ['ENDURANCE BENCHMARK', 'VO2 output matching elite soccer and combat pros—relentless endurance in the blood.'],
    },
    130: {
      zh: ['攝氧量神話', '有氧極限功率具歷史級份量，苦行僧紀律融合天選基因，刻下耐力統計神話。'],
      en: ['VO2 MYTH', 'Historic aerobic output—monk-tier discipline fused with rare endurance genetics.'],
    },
    140: {
      zh: ['永動機領域', '常人早已力竭崩潰的配速下仍能從容加速，被推向極限的非人心肺怪物領域。'],
      en: ['PERPETUAL DOMAIN', 'Accelerating at paces where others collapse—superhuman cardio inside monster domain.'],
    },
    150: {
      zh: ['地表最強心肺', '造物主最完美傑作，耐力超越數十億人；人類不斷追求極限，此即極限本身。'],
      en: ['APEX CARDIO', "Nature's finest cardiovascular work—outlasting billions as the definition of stamina."],
    },
  },
  muscleMass: {
    0: {
      zh: ['肌纖維喚醒期', '永有巨大的進步空間，開始重訓並補足熱量與蛋白質，肌肉量將飛速成長。'],
      en: ['FIBER AWAKENING', 'Vast room to grow—lifting with adequate calories and protein sparks rapid muscle gains.'],
    },
    40: {
      zh: ['輪廓初現者', '肌肥大需要時間沉澱，這是一場馬拉松而非短跑，注重營養與堅持必現輪廓。'],
      en: ['CONTOUR STARTER', 'Hypertrophy is a marathon—consistent nutrition and progressive load reveal real shape.'],
    },
    50: {
      zh: ['標準體格者', '已站穩大眾平均狀態，保持穩定訓練節奏，突破在即。'],
      en: ['BALANCED FRAME', 'Public average locked in—keep a steady training rhythm and a breakthrough is near.'],
    },
    60: {
      zh: ['紮實訓練者', '身形與穿衣輪廓優於一般大眾，展現紮實的體格底蘊，正朝高階領域邁進。'],
      en: ['SOLID LIFTER', 'Physique and silhouette clearly beat everyday norms—building toward elite ranks.'],
    },
    70: {
      zh: ['高密度肌群', '訓練痕跡清晰可見，旁人一眼看出長期重訓成果，漸漸有人行注目禮。'],
      en: ['DENSE MUSCULATURE', 'Unmistakable gym gains that turn heads—passersby are starting to take a second look.'],
    },
    80: {
      zh: ['重裝肌甲者', '人群中無法忽視的視覺亮點，純粹堅持與汗水堆出厚實肌甲，逼近凡人頂點。'],
      en: ['HEAVY MUSCLE ARMOR', 'An unmistakable visual standout—pure grit forged dense armor near the mortal peak.'],
    },
    90: {
      zh: ['凡人肌量頂點', '放棄平庸娛樂將時間投入雕琢軀體，這份厚實存在感在人群中已達頂尖水準。'],
      en: ['MORTAL MASS PEAK', 'Trading comfort for iron forged commanding natural volume—an imposing physique.'],
    },
    100: {
      zh: ['自然健體巔峰', '跨越百分肌量門檻，骨骼肌比肩自然健體世界冠軍，厚實輪廓氣場無可忽視。'],
      en: ['NATURAL PHYSIQUE PEAK', 'Skeletal muscle past 100—natural physique champion caliber with commanding presence.'],
    },
    110: {
      zh: ['健美級飽滿肌量', '孤獨訓練刻進骨血，厚實飽滿肌群比肩專業健美選手，展露身形令人驚嘆連連。'],
      en: ['STAGE-GRADE MASS', 'Solitude carved into bone—stage-caliber fullness matching professional bodybuilders.'],
    },
    120: {
      zh: ['黃金時代巨擘', '肌肉圍度與厚度達健美黃金時代巔峰，具備載入史冊的龐大體量，全場焦點。'],
      en: ['GOLDEN ERA TITAN', 'Muscle volume and thickness matching Golden Era icons—historic mass in any room.'],
    },
    130: {
      zh: ['奧賽王者級肌量', '骨骼肌總量達現代奧賽冠軍水準，極致紀律與天選基因交織出立體飽滿厚度。'],
      en: ['OLYMPIA-CALIBER MASS', 'Skeletal muscle at modern Mr. Olympia caliber—extreme discipline and 3D fullness.'],
    },
    140: {
      zh: ['傳奇王者級巨獸', '骨骼肌總量觸及健美史絕對天花板，龐大圍度與立體厚度橫掃無差別級殿堂。'],
      en: ['KING-TIER MASS MONSTER', 'Skeletal muscle at the ceiling of bodybuilding history—colossal open-class density.'],
    },
    150: {
      zh: ['地表最強肌量', '超越無差別級健美邊界，具備超級大力士般龐大肌群，碳基生物的終極體量。'],
      en: ['APEX MUSCLE MASS', 'Surpassing open-class bodybuilding limits—colossal strongman scale at the summit.'],
    },
  },
  bodyFat: {
    0: {
      zh: ['低於常模基準', 'FFMI 處於分布底端，阻力訓練與均衡營養將快速拉升指數。'],
      en: ['BELOW BASELINE', 'FFMI sits at the lower bound—resistance training and nutrition raise it fast.'],
    },
    40: {
      zh: ['肌肉量偏低區間', '整體體重低於健康常模，具備極為充裕的指數成長空間。'],
      en: ['LOW MASS TIER', 'Overall body weight sits below healthy norms with vast index growth still ahead.'],
    },
    50: {
      zh: ['運動員入門區間', '站穩健康常模基準線，正式踏入運動員入門門檻。'],
      en: ['ENTRY ATHLETE TIER', 'Meeting healthy population norms at the entry-athlete threshold.'],
    },
    60: {
      zh: ['訓練者區間', '去脂密度脫離未訓練人群，展現紮實訓練痕跡。'],
      en: ['TRAINED INTERVAL', 'Lean density separates clearly from untrained norms with solid work.'],
    },
    70: {
      zh: ['強健業餘高段', '躋身健身族群前段班，具備出色的骨架填滿度。'],
      en: ['STRONG AMATEUR TIER', 'Upper-amateur caliber with impressive frame fullness and mass.'],
    },
    80: {
      zh: ['進階自然帶', '踏入進階自然區間，高純度去脂密度極具說服力。'],
      en: ['ADVANCED NATURAL BAND', 'Inside the advanced natural band with compelling lean density.'],
    },
    90: {
      zh: ['理論自然極限', '觸及自然生理統計天花板，人群中極為罕見的體格。'],
      en: ['NATURAL LIMIT', 'Touching the theoretical natural ceiling—a rare build in any crowd.'],
    },
    100: {
      zh: ['破限表現門檻', 'FFMI 跨越百分臨界點，超越常規自然統計範疇。'],
      en: ['THRESHOLD BREACHED', 'FFMI past the 100-point mark, exceeding conventional natural charts.'],
    },
    110: {
      zh: ['極高表現區間', '頂尖競技級別的去脂載量，視覺上極具壓迫感。'],
      en: ['EXTREME PERFORMANCE', 'Elite competitive lean payload with commanding visual pressure.'],
    },
    120: {
      zh: ['極端離群區間', '遠離常態分布曲線，屬於運動科學統計中的稀有樣本。'],
      en: ['EXTREME OUTLIER', 'Far beyond normal distribution curves—a rare statistical specimen.'],
    },
    130: {
      zh: ['超常模離群帶', '突破競技統計圖表上限，近乎神話級的體組成數據。'],
      en: ['STATISTICAL ANOMALY', 'Breaking past athletic chart limits into near-mythic composition.'],
    },
    140: {
      zh: ['怪物級離群指標', '逼近系統生理上限，近乎非人的恐怖去脂結構密度。'],
      en: ['MONSTER INDEX', 'Near-ceiling physiological anomaly with near-superhuman lean density.'],
    },
    150: {
      zh: ['地表最強 FFMI', '觸及滿分穹頂，人類去脂體組成承載力的絕對天花板。'],
      en: ['APEX FFMI', 'Reaching the supreme ceiling of human lean mass relative to height.'],
    },
  },
  gripStrength: {
    0: {
      zh: ['抓握喚醒期', '前臂力量尚未喚醒，開始訓練旅程，握力將飛速提升。'],
      en: ['GRIP AWAKENING', 'Forearm strength is waking up—once training begins, grip power climbs fast.'],
    },
    40: {
      zh: ['前臂築基者', '訓練者握力起點，系統強化後，很快便能往上進階。'],
      en: ['FOREARM BUILDER', 'Early grip stage—systematic strengthening clears the path to the next tiers fast.'],
    },
    50: {
      zh: ['穩固抓握者', '握力站穩同齡大眾平均，足夠日常平順使用，拉類訓練表現水漲船高。'],
      en: ['STEADY GRIPPER', 'Hand grip meets the age-group average—ample for daily tasks and heavy pulling.'],
    },
    60: {
      zh: ['強力扣鎖者', '抓握強度明顯超越常人，大重量拉類不再因手滑中斷，付出正持續兌現。'],
      en: ['FIRM LOCK', 'Clearly ahead of everyday adults—heavy pulls stay locked in without slipping.'],
    },
    70: {
      zh: ['徒手握持者', '健身房裡的傑出握力，前臂結實有力，無需助力帶亦能穩穩駕馭大重量。'],
      en: ['BARE-HAND HOLDER', 'Standout gym grip with strong forearms—commanding heavy weights without straps.'],
    },
    80: {
      zh: ['重裝鎖死者', '前臂發展至優秀水準，抓握力道躋身群眾佼佼者，媲美格鬥與摔角選手。'],
      en: ['LOAD LOCKER', 'Excellent forearm development—grip strength matching combat and grappling athletes.'],
    },
    90: {
      zh: ['凡人握力巔峰', '前臂發力開發至常態基因頂點，每次握拳皆蘊含驚人爆發力，常人難敵。'],
      en: ['MORTAL GRIP PEAK', 'Forearm power at the mortal summit—immense clamping force rarely matched in life.'],
    },
    100: {
      zh: ['極限握力覺醒', '跨越百分握力臨界點，踏入非凡基因領域，前臂與指力具備專項選手強度。'],
      en: ['GRIP LIMIT AWAKENED', 'Past the 100-point barrier into rare genetic territory—specialist-caliber grip.'],
    },
    110: {
      zh: ['健力級鎖死握', '抓握強度達優秀健力運動員水準，極限硬舉與大重量拉類足以穩鎖槓鈴。'],
      en: ['POWERLIFTER LOCK', 'Grip strength at excellent powerlifter caliber—locking max deadlifts without slip.'],
    },
    120: {
      zh: ['大力士級握力', '恐怖指力與前臂強度撕裂統計曲線，已具備挑戰頂級握力器認證的實力。'],
      en: ['STRONGMAN CLAMP', 'Tearing the bell curve with crushing finger power—worthy of elite gripper certs.'],
    },
    130: {
      zh: ['握力傳奇級別', '頂尖大力士與握力傳奇水準，數據令人戰慄，雙手一旦扣緊便絕無鬆脫。'],
      en: ['GRIP LEGEND', 'Elite strongman and grip-legend territory—anything clamped in hand never slips.'],
    },
    140: {
      zh: ['怪物級粉碎握', '踏入不可思議的怪物領域，令人戰慄的粉碎級握力，抓握對抗全面壓制。'],
      en: ['MONSTER CRUSHER', 'True monster territory—bone-crushing grip power that dominates any head-to-head.'],
    },
    150: {
      zh: ['地表最強握力', '人類前臂與指力發展至高穹頂，單憑雙手將極限踩在腳下，星球級之握。'],
      en: ['APEX GRIP', 'The supreme dome of human forearm and finger strength—unrivaled bare-hand power.'],
    },
  },
  armSize: {
    0: {
      zh: ['上肢喚醒期', '臂圍處於起步基準，規律訓練與營養將快速拉升維度。'],
      en: ['ARM AWAKENING', 'Arm girth sits at the starting line—consistent training and nutrition raise it fast.'],
    },
    40: {
      zh: ['維度構築者', '上肢基礎正在打底，累積二三頭肌量將穩步推升臂圍。'],
      en: ['GIRTH BUILDER', 'Building early upper-arm foundation—stacking bicep and tricep mass raises girth.'],
    },
    50: {
      zh: ['勻稱臂圍者', '大眾平均基準達成，上肢份量逐步成形。'],
      en: ['BALANCED ARMS', 'Public average baseline reached as upper-arm presence takes shape.'],
    },
    60: {
      zh: ['訓練感上肢', '臂圍站穩大眾平均水準之上，短袖下的上肢輪廓明顯更立體。'],
      en: ['TRAINED UPPER LIMB', 'Arm girth sits above the public average—upper-arm contours pop in a fitted tee.'],
    },
    70: {
      zh: ['飽滿上肢輪廓', '手臂圍度已屬前段班，在人群中展現紮實上肢存在感。'],
      en: ['FULL ARM PROFILE', 'Arm girth ranks among the upper tier, delivering solid presence in any crowd.'],
    },
    80: {
      zh: ['袖口撐爆者', '飽滿臂圍把短袖撐出緊繃張力，已是無法忽視的亮點。'],
      en: ['SLEEVE BUSTER', 'Dense arm girth stretches every sleeve with unmistakable visual tension.'],
    },
    90: {
      zh: ['凡人巨臂巔峰', '嚴格紀律鑄就的頂尖臂圍，自然狀態下難逢敵手的份量。'],
      en: ['MORTAL CANNON PEAK', 'Top-tier arm girth forged by discipline—rarely matched in everyday life.'],
    },
    100: {
      zh: ['重砲臂圍覺醒', '跨越百分圍度臨界點，厚實上肢維度極具視覺震撼。'],
      en: ['CANNON AWAKENED', 'Past the 100-point mark—thick upper-arm caliber commands instant visual awe.'],
    },
    110: {
      zh: ['職業級重裝臂', '臂圍份量比肩一線力量與健美選手，巨臂宛如護甲。'],
      en: ['PRO-GRADE ARMS', 'Arm caliber matching top strength and physique athletes—massive arms like living armor.'],
    },
    120: {
      zh: ['殿堂級巨臂', '歷史級別的臂圍與飽滿度，走到哪裡皆是全場焦點。'],
      en: ['HALL-GRADE CANNONS', 'Historic arm girth and fullness that command any room on sight.'],
    },
    130: {
      zh: ['統計學巨臂神話', '違背常理的超大臂圍，成就運動統計中難以複製的奇蹟。'],
      en: ['STATISTICAL CANNONS', 'Unreal arm girth—an irreplicable marvel in athletic statistics.'],
    },
    140: {
      zh: ['怪物級上肢維度', '超越常人比例認知的震撼巨臂，進化成純粹力量圖騰。'],
      en: ['MONSTER GIRTH', 'Proportion-shattering arm girth standing as a living totem of upper-body mass.'],
    },
    150: {
      zh: ['地表最強臂圍', '人類手臂圍度的終極天花板，無可匹敵的星球級傳奇。'],
      en: ['APEX ARM GIRTH', 'The supreme ceiling of human arm girth—an unrivaled planetary visual legend.'],
    },
  },
};

function isVerdictFamily(value: string): value is VerdictFamily {
  return (VERDICT_FAMILIES as readonly string[]).includes(value);
}

const HUMAN_TO_VERDICT_DECADE: Record<HumanScaleDecadeKey, VerdictDecadeKey> = {
  '0': 0,
  '40': 40,
  '50': 50,
  '60': 60,
  '70': 70,
  '80': 80,
  '90': 90,
  '100': 100,
  '110': 110,
  '120': 120,
  '130': 130,
  '140': 140,
  '150': 150,
};

/** Maps score-meaning metric → catalog family (cooper shares cardio ladder). */
export function verdictFamilyFromScoreMetric(metric: ScoreMeaningBandMetric): VerdictFamily {
  if (metric === COOPER_SCORE_MEANING_METRIC) return 'cardio';
  if (isVerdictFamily(metric)) return metric;
  // Exhaustiveness: ScoreMeaningBandMetric is cooper | VerdictFamily only.
  const _never: never = metric;
  return _never;
}

export function scoreMetricForVerdictFamily(family: VerdictFamily): ScoreMeaningBandMetric {
  return family;
}

export function resolveVerdictFamilyFromTarget(target: TelemetryVerdictTarget): VerdictFamily {
  if (target.reportType === 'axis-summary') return target.axis;
  return verdictFamilyFromScoreMetric(scoreMeaningMetricForSingleLeaf(target.leaf));
}

export function resolveVerdictDecadeKey(
  family: VerdictFamily,
  score: number
): VerdictDecadeKey {
  const human = resolveDecadeKeyFromScore(scoreMetricForVerdictFamily(family), score);
  return HUMAN_TO_VERDICT_DECADE[human];
}

/**
 * Deterministic glyph-width estimate at Carbon critique size.
 * WHY: Builders / DOM cannot call Canvas measureText; estimate keeps wrap lockstep.
 */
export function estimateCritiqueGlyphWidth(
  text: string,
  fontPx: number = CARBON_VERDICT_CRITIQUE_FONT_PX
): number {
  let width = 0;
  for (const ch of Array.from(text)) {
    // CJK / fullwidth ≈ em; Latin / punctuation ≈ 0.55em (Medium 20px plate).
    width += /[\u1100-\uD7AF\u3000-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch)
      ? fontPx
      : fontPx * 0.55;
  }
  return width;
}

export function wrapVerdictCritiqueLines(critique: string): string[] {
  return wrapCritiqueLines(
    (text) => estimateCritiqueGlyphWidth(text),
    critique,
    CARBON_VERDICT_CRITIQUE_MAX_WIDTH,
    CARBON_VERDICT_CRITIQUE_MAX_LINES
  );
}

export function resolveTelemetryVerdict(
  family: VerdictFamily,
  score: number,
  locale: TelemetryVerdictLocale
): TelemetryVerdictCopy {
  const decade = resolveVerdictDecadeKey(family, score);
  const entry = TELEMETRY_VERDICT_CATALOG[family][decade];
  const pair = locale === 'en' ? entry.en : entry.zh;
  const epithet = pair[0];
  const critique = pair[1];
  return {
    epithet,
    critique,
    critiqueLines: wrapVerdictCritiqueLines(critique),
  };
}

export function resolveTelemetryVerdictForTarget(
  target: TelemetryVerdictTarget,
  score: number,
  locale: TelemetryVerdictLocale
): TelemetryVerdictCopy {
  return resolveTelemetryVerdict(resolveVerdictFamilyFromTarget(target), score, locale);
}

/** Semantic break chars — prefer splitting after these for balanced 2-line critique. */
const CRITIQUE_BREAK_PUNCT_CLASS = '[—；：、，]';

/** Orphan floors — reject head-heavy splits that leave a stub second line. */
export const EN_CRITIQUE_ORPHAN_MIN_CHARS = 14;
export const ZH_CRITIQUE_ORPHAN_MIN_CHARS = 5;

/**
 * Wrap critique into at most 2 lines without ellipsis.
 * WHY: Balanced (not greedy) splits keep Canvas EN/ZH from orphan stubs like "with ease."
 * DOM preview uses full `critique` + CSS `text-wrap: balance` instead of these lines.
 */
export function wrapCritiqueLines(
  measureWidth: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number = CARBON_VERDICT_CRITIQUE_MAX_LINES
): string[] {
  const raw = String(text ?? '').trim();
  if (!raw || maxLines <= 0) return [];
  if (measureWidth(raw) <= maxWidth) return [raw];
  // Carbon stage is a fixed 2-line plaque — ignore callers asking for more than 2.
  if (maxLines === 1) return [raw];

  const balanced = splitBalancedTwoLines(measureWidth, raw, maxWidth);
  if (balanced) return balanced;

  // Defensive fallback — still avoid ellipsis; prefer mid word/char over greedy fill.
  return splitForcedMid(raw);
}

interface CritiqueSplitCandidate {
  left: string;
  right: string;
  /** Lower is better — width imbalance + distance from midpoint. */
  score: number;
  /** True when cut follows semantic punctuation (— ； ： 、 ，). */
  punct: boolean;
}

function splitBalancedTwoLines(
  measureWidth: (text: string) => number,
  text: string,
  maxWidth: number
): [string, string] | null {
  const totalW = measureWidth(text);
  const midW = totalW / 2;
  const isEn = /[A-Za-z]/.test(text) && text.includes(' ');
  const orphanMin = isEn ? EN_CRITIQUE_ORPHAN_MIN_CHARS : ZH_CRITIQUE_ORPHAN_MIN_CHARS;
  const candidates: CritiqueSplitCandidate[] = [];

  const consider = (leftRaw: string, rightRaw: string, punct: boolean) => {
    const left = leftRaw.trim();
    const right = rightRaw.trim();
    if (!left || !right) return;
    if (graphemeLen(right) < orphanMin || graphemeLen(left) < orphanMin) return;
    const lw = measureWidth(left);
    const rw = measureWidth(right);
    if (lw > maxWidth || rw > maxWidth) return;
    const imbalance = Math.abs(lw - rw);
    const midBias = Math.abs(lw - midW);
    candidates.push({
      left,
      right,
      score: imbalance + midBias * 0.35,
      punct,
    });
  };

  // 1) Semantic punctuation — fresh /g each call so matchAll never inherits lastIndex debt.
  for (const match of text.matchAll(new RegExp(CRITIQUE_BREAK_PUNCT_CLASS, 'g'))) {
    const idx = match.index;
    if (idx == null) continue;
    const cut = idx + match[0]!.length;
    consider(text.slice(0, cut), text.slice(cut), true);
  }

  // 2) Word boundaries (EN) or grapheme mid-band (ZH / no spaces)
  if (isEn) {
    const words = text.split(/\s+/).filter(Boolean);
    for (let i = 1; i < words.length; i += 1) {
      consider(words.slice(0, i).join(' '), words.slice(i).join(' '), false);
    }
  } else {
    const chars = Array.from(text);
    const lo = Math.max(1, Math.floor(chars.length * 0.35));
    const hi = Math.min(chars.length - 1, Math.ceil(chars.length * 0.65));
    for (let i = lo; i <= hi; i += 1) {
      consider(chars.slice(0, i).join(''), chars.slice(i).join(''), false);
    }
  }

  if (candidates.length === 0) return null;
  // WHY: Semantic punct cuts first when legal; only fall back to mid word/char when none fit.
  const punctPool = candidates.filter((c) => c.punct);
  const pool = punctPool.length > 0 ? punctPool : candidates;
  pool.sort((a, b) => a.score - b.score);
  const best = pool[0]!;
  return [best.left, best.right];
}

function splitForcedMid(text: string): string[] {
  const isEn = /[A-Za-z]/.test(text) && text.includes(' ');
  if (isEn) {
    const words = text.split(/\s+/).filter(Boolean);
    const mid = Math.max(1, Math.floor(words.length / 2));
    const left = words.slice(0, mid).join(' ');
    const right = words.slice(mid).join(' ');
    if (left && right) return [left, right];
  }
  const chars = Array.from(text);
  const mid = Math.max(1, Math.floor(chars.length / 2));
  return [chars.slice(0, mid).join(''), chars.slice(mid).join('')];
}

function graphemeLen(s: string): number {
  return Array.from(s).length;
}
