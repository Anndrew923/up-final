import { type FC, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SHELL_SCROLL_ID } from '../../lib/shellScrollLock';

/** Resets `#layer-shell-scroll` (and legacy window scroll) on route change. */
export const ScrollToTop: FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const shell = document.getElementById(SHELL_SCROLL_ID);
    if (shell) {
      shell.scrollTop = 0;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
