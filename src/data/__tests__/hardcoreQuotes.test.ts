import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HARDCORE_QUOTE_LAST_ID_KEY,
  HARDCORE_QUOTES,
  pickNextHardcoreQuote,
  type HardcoreQuote,
} from '../hardcoreQuotes';

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
  };
}

describe('hardcoreQuotes vault', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ships exactly 48 bilingual anonymous quotes', () => {
    expect(HARDCORE_QUOTES).toHaveLength(48);

    const ids = new Set<string>();
    for (const quote of HARDCORE_QUOTES) {
      expect(quote.id.length).toBeGreaterThan(0);
      expect(ids.has(quote.id)).toBe(false);
      ids.add(quote.id);

      expect(quote.zh.trim().length).toBeGreaterThan(0);
      expect(quote.en.trim().length).toBeGreaterThan(0);

      // Strict no-attribution contract — keep the old-school cipher vibe.
      expect(Object.keys(quote).sort()).toEqual(['en', 'id', 'zh']);
      expect(quote.zh).not.toMatch(/(?:^|\s)[—–]\s*[^\s—–]+$/);
      expect(quote.en).not.toMatch(/(?:^|\s)[—–]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*$/);
    }
  });

  it('avoids repeating the previous id across consecutive picks', () => {
    const storage = memoryStorage();
    const first = pickNextHardcoreQuote(storage);
    expect(storage.getItem(HARDCORE_QUOTE_LAST_ID_KEY)).toBe(first.id);

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const second = pickNextHardcoreQuote(storage);
    expect(second.id).not.toBe(first.id);
    expect(storage.getItem(HARDCORE_QUOTE_LAST_ID_KEY)).toBe(second.id);
  });

  it('survives missing / throwing storage (test + private mode)', () => {
    const a = pickNextHardcoreQuote(null);
    expect(a.id).toBeTruthy();

    const throwing: Pick<Storage, 'getItem' | 'setItem'> = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    const b = pickNextHardcoreQuote(throwing);
    expect(HARDCORE_QUOTES.some((q: HardcoreQuote) => q.id === b.id)).toBe(true);
  });

  it('includes the updated light-weight cipher line', () => {
    const light = HARDCORE_QUOTES.find((q) => q.id === 'hq-02');
    expect(light?.zh).toBe('沒什麼，這不過就是個小重量！');
    expect(light?.en).toContain('Light weight, baby!');
  });
});
