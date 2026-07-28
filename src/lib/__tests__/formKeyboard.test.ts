import { describe, expect, it, vi } from 'vitest';
import type { KeyboardEvent } from 'react';
import { onInputEnterKey, scrollFocusedInputIntoView } from '../formKeyboard';

describe('scrollFocusedInputIntoView', () => {
  it('scrolls with nearest + smooth to clear the soft keyboard', () => {
    const scrollIntoView = vi.fn();
    const target = { scrollIntoView } as unknown as HTMLElement;
    scrollFocusedInputIntoView(target);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });
});

describe('onInputEnterKey', () => {
  it('ignores non-Enter keys', () => {
    const action = vi.fn();
    const preventDefault = vi.fn();
    onInputEnterKey(
      { key: 'Tab', preventDefault } as unknown as KeyboardEvent<HTMLInputElement>,
      action
    );
    expect(preventDefault).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });

  it('prevents default and runs action on Enter', () => {
    const action = vi.fn();
    const preventDefault = vi.fn();
    onInputEnterKey(
      { key: 'Enter', preventDefault } as unknown as KeyboardEvent<HTMLInputElement>,
      action
    );
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
