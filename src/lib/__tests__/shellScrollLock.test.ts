import { afterEach, describe, expect, it } from 'vitest';
import {
  SHELL_SCROLL_ID,
  __resetShellScrollLockForTests,
  acquireShellScrollLock,
  releaseShellScrollLock,
} from '../shellScrollLock';

describe('shellScrollLock', () => {
  afterEach(() => {
    __resetShellScrollLockForTests();
    document.body.innerHTML = '';
  });

  it('locks shell scroll with ref-count — restores only when all locks release', () => {
    const shell = document.createElement('div');
    shell.id = SHELL_SCROLL_ID;
    shell.style.overflow = 'auto';
    document.body.appendChild(shell);

    acquireShellScrollLock();
    expect(shell.style.overflow).toBe('hidden');

    acquireShellScrollLock();
    expect(shell.style.overflow).toBe('hidden');

    releaseShellScrollLock();
    expect(shell.style.overflow).toBe('hidden');

    releaseShellScrollLock();
    expect(shell.style.overflow).toBe('auto');
  });

  it('no-ops when shell element is missing', () => {
    acquireShellScrollLock();
    releaseShellScrollLock();
    expect(document.getElementById(SHELL_SCROLL_ID)).toBeNull();
  });

  it('ignores redundant release without underflowing', () => {
    const shell = document.createElement('div');
    shell.id = SHELL_SCROLL_ID;
    document.body.appendChild(shell);

    acquireShellScrollLock();
    releaseShellScrollLock();
    releaseShellScrollLock();
    expect(shell.style.overflow).toBe('');
  });
});
