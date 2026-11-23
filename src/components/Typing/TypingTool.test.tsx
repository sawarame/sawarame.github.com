import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@docusaurus/theme-common', () => ({
  useColorMode: () => ({ colorMode: 'light' }),
}));

import TypingTool from './index';

// React 18 の act 環境フラグを有効化
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * React の制御された input 要素の値を安全に更新して input イベントを発火する
 * @param input - 対象の HTMLInputElement
 * @param value - 設定する文字列
 */
function setInputValue(input: HTMLInputElement, value: string): void {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  nativeSetter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('TypingTool 入力欄フォーカス維持テスト', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.useRealTimers();
  });

  it('不一致の文字列で Enter 送信しても入力欄が再マウントされずフォーカスが維持されること', () => {
    act(() => {
      root.render(<TypingTool />);
    });

    // スタートボタンをクリックして 3 秒カウントダウンを開始
    const startButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('スタート')
    );
    expect(startButton).toBeDefined();

    act(() => {
      startButton?.click();
    });

    // 3 秒カウントダウン（3 -> 2 -> 1 -> playing）を進める
    for (let i = 0; i < 3; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    const inputBefore = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(inputBefore).not.toBeNull();
    if (!inputBefore) return;

    // 入力欄へフォーカスし、明らかに先頭不一致の文字列を入力
    act(() => {
      inputBefore.focus();
      setInputValue(inputBefore, '@@@誤入力テスト');
    });
    expect(document.activeElement).toBe(inputBefore);

    // 1回目の不一致 Enter 送信
    act(() => {
      inputBefore.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });

    const inputAfterFirst = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(inputAfterFirst).toBe(inputBefore);
    expect(document.activeElement).toBe(inputBefore);
    expect(inputBefore.value).toBe('@@@誤入力テスト');
    expect(inputBefore.getAttribute('aria-invalid')).toBe('true');

    // 連続2回目の不一致 Enter 送信でもフォーカスと DOM 参照が維持されること
    act(() => {
      inputBefore.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });

    const inputAfterSecond = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(inputAfterSecond).toBe(inputBefore);
    expect(document.activeElement).toBe(inputBefore);
    expect(inputBefore.value).toBe('@@@誤入力テスト');
  });
});
