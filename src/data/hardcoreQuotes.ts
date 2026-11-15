import { safeGetItem, safeSetItem } from '../lib/safeLocalStorage';

/**
 * Local anonymous hardcore quote vault — $0 cloud, zero attribution.
 * WHY: Launch splash needs a silent “old-school gym cipher” line without celebrity name-drops.
 */

export interface HardcoreQuote {
  id: string;
  zh: string;
  en: string;
}

/** Persist last shown id so consecutive cold starts never repeat the same cipher. */
export const HARDCORE_QUOTE_LAST_ID_KEY = 'up:hardcore-quote-last-id';

export const HARDCORE_QUOTES: readonly HardcoreQuote[] = [
  {
    id: 'hq-01',
    zh: '人人都想變巨無霸，卻沒人想扛這該死的重量。',
    en: 'Everyone wants to be huge, nobody wants to lift heavy weights.',
  },
  {
    id: 'hq-02',
    zh: '沒什麼，這不過就是個小重量！',
    en: "Ain't nothing to it but to do it. Light weight, baby!",
  },
  {
    id: 'hq-03',
    zh: '痛到想放棄後的那幾下，才是肌肉真正開始生長的時刻。',
    en: 'The reps after you want to quit are the only ones that make you grow.',
  },
  {
    id: 'hq-04',
    zh: '重量不會說謊，兩百公斤永遠就是兩百公斤。',
    en: 'Iron never lies; two hundred kilos is always two hundred kilos.',
  },
  {
    id: 'hq-05',
    zh: '別數你做了幾下，要讓每一下都算數。',
    en: "Don't count the reps; make every single rep count.",
  },
  {
    id: 'hq-06',
    zh: '刺激，不要一味蠻幹；控制每一公分的張力。',
    en: "Stimulate, don't annihilate; own every millimeter of tension.",
  },
  {
    id: 'hq-07',
    zh: '當槓鈴壓在背上的那一刻，全世界的雜音都會安靜。',
    en: 'The moment the bar hits your back, the rest of the world goes silent.',
  },
  {
    id: 'hq-08',
    zh: '肌肉不會聽懂你的藉口，它只向絕對的機械張力低頭。',
    en: "Muscles don't understand excuses; they only bow to mechanical tension.",
  },
  {
    id: 'hq-09',
    zh: '自律，就是做你痛恨的事，卻做得像你深愛它一樣。',
    en: 'Discipline is doing what you hate, yet doing it like you love it.',
  },
  {
    id: 'hq-10',
    zh: '沒有所謂的過度訓練，只有吃不夠跟睡不夠。',
    en: 'There is no such thing as overtraining, only under-eating and under-sleeping.',
  },
  {
    id: 'hq-11',
    zh: '真正的訓練，是從你想回家的那一秒才正式開始。',
    en: 'The real workout begins the exact second you want to go home.',
  },
  {
    id: 'hq-12',
    zh: '當大腦告訴你已經極限時，你其實才發揮了四成潛能。',
    en: "When your mind says you're done, you're only forty percent tapped out.",
  },
  {
    id: 'hq-13',
    zh: '別讓今天的懶惰，毀掉三個月後鏡子裡的自己。',
    en: "Don't let today's laziness ruin the reflection you want in ninety days.",
  },
  {
    id: 'hq-14',
    zh: '痛苦是暫時的，但放棄後的平庸會跟著你一輩子。',
    en: 'Pain is temporary, but quitting lasts forever.',
  },
  {
    id: 'hq-15',
    zh: '飢餓感是最好的燃料，痠痛是最誠實的教練。',
    en: 'Hunger is the best fuel, and soreness is the most honest coach.',
  },
  {
    id: 'hq-16',
    zh: '休假日不是用來頹廢的，是為了下一次把槓鈴掰彎做準備。',
    en: "Rest days aren't for slacking; they are for reloading to bend the bar again.",
  },
  {
    id: 'hq-17',
    zh: '每個人在上場前都有完美計畫，直到下巴挨了一記重拳。',
    en: 'Everyone has a plan until they get punched in the mouth.',
  },
  {
    id: 'hq-18',
    zh: '在訓練場多流一滴汗，實戰時就能少流一滴血。',
    en: 'Sweat more in training so you bleed less in battle.',
  },
  {
    id: 'hq-19',
    zh: '把身體打造成一件武器，而不是一件易碎的裝飾品。',
    en: 'Forge your body into a weapon, not a fragile ornament.',
  },
  {
    id: 'hq-20',
    zh: '速度殺死對手，精準摧毀防線，力量終結比賽。',
    en: 'Speed kills, precision breaks, and raw power ends the fight.',
  },
  {
    id: 'hq-21',
    zh: '弱者祈禱對手手下留情，強者只祈禱自己夠硬。',
    en: 'The weak pray for mercy; the strong only pray for heavier iron.',
  },
  {
    id: 'hq-22',
    zh: '你現在偷懶少做的那一組，對手正在另一頭加倍練回來。',
    en: 'Every set you skip, your rival is doubling down somewhere else.',
  },
  {
    id: 'hq-23',
    zh: '恐懼跟火焰一樣，控制得住就能替你取暖，失控就會把你燒成灰。',
    en: 'Fear is like fire; control it and it fuels you, let it loose and it burns you.',
  },
  {
    id: 'hq-24',
    zh: '別只追求看起來很強，要讓自己真正強到無可撼動。',
    en: 'Stop trying to look strong; become undeniably strong.',
  },
  {
    id: 'hq-25',
    zh: '鋼鐵是最冷酷的藝術家，而你既是雕刻刀，也是大理石。',
    en: 'Iron is a cold sculptor, and you are both the chisel and the marble.',
  },
  {
    id: 'hq-26',
    zh: '不需要向任何人解釋你的瘋狂，你的體態會替你開口。',
    en: 'Never explain your obsession; let your physique do all the talking.',
  },
  {
    id: 'hq-27',
    zh: '黑暗中的孤獨苦練，終將在聚光燈下兌現。',
    en: 'What you build in the dark will eventually speak in the light.',
  },
  {
    id: 'hq-28',
    zh: '只有偏執狂才能突破基因天花板，平庸的人永遠在找藉口。',
    en: 'Only the obsessed break genetic ceilings; the average make excuses.',
  },
  {
    id: 'hq-29',
    zh: '把每一次力竭，當成舊肉體的葬禮與新肉體的誕生。',
    en: 'Treat every set to failure as the funeral of your weak self.',
  },
  {
    id: 'hq-30',
    zh: '頂級肉體從來不是靠運氣抽到的，而是一克一克扛出來的。',
    en: 'An elite physique is never won by luck; it is earned gram by gram under the bar.',
  },
  {
    id: 'hq-31',
    zh: '每天比昨天的自己強 1%，一年後你就是別人眼中的怪物。',
    en: 'Get one percent stronger every day, and in a year you become a monster.',
  },
  {
    id: 'hq-32',
    zh: '這裡沒有奇蹟，只有日復一日把不可能變成熱身重量。',
    en: 'There are no miracles here, only turning impossibilities into warm-up sets.',
  },
  {
    id: 'hq-33',
    zh: '征服自己，是所有勝利之中最偉大的一場。',
    en: 'Conquering yourself is the greatest of all victories.',
  },
  {
    id: 'hq-34',
    zh: '把不可能變成日常，把別人的極限當成你的起點。',
    en: "Make the impossible your routine, and others' limits your starting line.",
  },
  {
    id: 'hq-35',
    zh: '不要祈禱生活輕鬆一點，要祈禱自己變得更強悍。',
    en: 'Do not pray for an easy life; pray for the strength to endure a difficult one.',
  },
  {
    id: 'hq-36',
    zh: '平靜的海面練不出水手，安逸的重量造不出怪物。',
    en: 'A smooth sea never made a skilled sailor; comfortable weights never built a monster.',
  },
  {
    id: 'hq-37',
    zh: '你流過的每一滴汗，都在為未來的統治力投票。',
    en: 'Every drop of sweat you spill is a vote for your future dominance.',
  },
  {
    id: 'hq-38',
    zh: '強者從不抱怨環境，他們直接把環境改造成訓練場。',
    en: 'The strong never complain about conditions; they turn any ground into a proving ground.',
  },
  {
    id: 'hq-39',
    zh: '深蹲架底下沒有階級，只有扛得起與扛不起。',
    en: 'Beneath the squat rack there is no status—only what you can lift and what crushes you.',
  },
  {
    id: 'hq-40',
    zh: '當你覺得已經竭盡全力時，再多榨出最後一下。',
    en: 'When you think you have given everything, squeeze out one final rep.',
  },
  {
    id: 'hq-41',
    zh: '身體會忠實記錄你每一次的偷懶，也會加倍獎賞每一次的死磕。',
    en: 'Your body keeps an honest ledger of every shortcut and rewards every ounce of grit.',
  },
  {
    id: 'hq-42',
    zh: '不要等到準備好才開始，開始了才會變強。',
    en: 'Stop waiting until you feel ready; you get strong by starting.',
  },
  {
    id: 'hq-43',
    zh: '真正的力量，是在筋疲力盡後依然能保持動作標準。',
    en: 'True strength is maintaining razor-sharp form when your lungs are burning.',
  },
  {
    id: 'hq-44',
    zh: '鏡子不會騙人，你的每一寸線條都是汗水雕刻出來的。',
    en: 'The mirror never lies; every line on your frame was chiseled by sweat.',
  },
  {
    id: 'hq-45',
    zh: '把痛苦當成早餐吃掉，剩下的整天就沒有任何事能擊倒你。',
    en: 'Eat pain for breakfast, and nothing else can touch you for the rest of the day.',
  },
  {
    id: 'hq-46',
    zh: '既然已經走到這一步，就絕不允許自己空手而回。',
    en: 'Since you have come this far, refuse to walk away empty-handed.',
  },
  {
    id: 'hq-47',
    zh: '平凡與傳奇之間，只差了別人放棄時你多撐的那十秒。',
    en: 'The only gap between average and legendary is the ten seconds you hold on after others quit.',
  },
  {
    id: 'hq-48',
    zh: '喚醒沉睡的野獸，今天也是打破紀錄的一天。',
    en: 'Wake the beast inside; today is another day to shatter records.',
  },
] as const;

function readLastId(storage: Pick<Storage, 'getItem'> | null): string | null {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    return storage.getItem(HARDCORE_QUOTE_LAST_ID_KEY);
  } catch {
    return null;
  }
}

function writeLastId(storage: Pick<Storage, 'setItem'> | null, id: string): void {
  if (!storage || typeof storage.setItem !== 'function') return;
  try {
    storage.setItem(HARDCORE_QUOTE_LAST_ID_KEY, id);
  } catch {
    // Private mode / quota — skip persistence; next launch may repeat.
  }
}

/**
 * Pick a quote that is not the last shown id (when storage is available).
 * WHY: Gym cold-starts feel stale if the same cipher repeats back-to-back.
 *
 * `storage` omitted → production `safeLocalStorage` path.
 * `storage: null` → ephemeral pick (no read/write; Vitest / private mode).
 * `storage: {...}` → injectable store for deterministic unit tests.
 */
export function pickNextHardcoreQuote(
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
): HardcoreQuote {
  const lastId =
    storage === undefined
      ? safeGetItem(HARDCORE_QUOTE_LAST_ID_KEY)
      : readLastId(storage);

  const pool =
    lastId == null
      ? HARDCORE_QUOTES
      : HARDCORE_QUOTES.filter((quote) => quote.id !== lastId);

  const source = pool.length > 0 ? pool : HARDCORE_QUOTES;
  const index = Math.floor(Math.random() * source.length);
  const picked = source[index] ?? HARDCORE_QUOTES[0];

  if (storage === undefined) {
    safeSetItem(HARDCORE_QUOTE_LAST_ID_KEY, picked.id);
  } else {
    writeLastId(storage, picked.id);
  }
  return picked;
}
