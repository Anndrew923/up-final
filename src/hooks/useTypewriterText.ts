import { useCallback, useEffect, useRef, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface UseTypewriterTextOptions {
  charIntervalMs?: number;
}

export function useTypewriterText(options: UseTypewriterTextOptions = {}) {
  const charIntervalMs = options.charIntervalMs ?? 22;
  const [visibleText, setVisibleText] = useState('');
  const timerRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const play = useCallback(
    (fullText: string): Promise<void> => {
      cancel();
      if (!fullText) {
        setVisibleText('');
        return Promise.resolve();
      }
      if (prefersReducedMotion()) {
        setVisibleText(fullText);
        return Promise.resolve();
      }

      setVisibleText('');
      return new Promise((resolve) => {
        let index = 0;
        timerRef.current = window.setInterval(() => {
          index += 1;
          setVisibleText(fullText.slice(0, index));
          if (index >= fullText.length) {
            cancel();
            resolve();
          }
        }, charIntervalMs);
      });
    },
    [cancel, charIntervalMs]
  );

  const reset = useCallback(() => {
    cancel();
    setVisibleText('');
  }, [cancel]);

  return { visibleText, play, reset, cancel };
}
