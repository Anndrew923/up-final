import { type FC, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SHELL_SCROLL_ID = 'layer-shell-scroll';

/**
 * Scrolls the document (and shell scroll layer if present) to top on route change.
 */
export const ScrollToTop: FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const shell = document.getElementById(SHELL_SCROLL_ID);
    if (shell) {
      shell.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
