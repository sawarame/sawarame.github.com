import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@docusaurus/theme-common', () => ({
  useColorMode: () => ({ colorMode: 'light' }),
}));

import TypingTool, { generateTypingResultImage } from './index';

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

/**
 * テスト用のモック Canvas 2D コンテキストおよび描画テキスト履歴を生成する
 * @returns モック Canvas コンテキストと fillText 呼び出し文字列一覧
 */
function createMockCanvasContext(): {
  ctx: Partial<CanvasRenderingContext2D>;
  drawnTexts: string[];
} {
  const drawnTexts: string[] = [];
  const gradientStub = {
    addColorStop: vi.fn(),
  } as unknown as CanvasGradient;

  const ctx: Partial<CanvasRenderingContext2D> = {
    createLinearGradient: vi.fn(() => gradientStub),
    createRadialGradient: vi.fn(() => gradientStub),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 14 }) as TextMetrics),
    fillText: vi.fn((text: string) => {
      drawnTexts.push(text);
    }),
  };

  return { ctx, drawnTexts };
}

describe('TypingTool 結果画面・共有機能テスト', () => {
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
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * 待機画面からカウントダウン・制限時間終了まで進めて結果画面へ遷移するヘルパー
   */
  function advanceToResultScreen(): void {
    act(() => {
      root.render(<TypingTool />);
    });

    const startButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('スタート')
    );
    expect(startButton).toBeDefined();

    act(() => {
      startButton?.click();
    });

    // 3 秒カウントダウンを進める
    for (let i = 0; i < 3; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    // 1 分コースの制限時間（60 秒 + インターバル余裕）を進める
    act(() => {
      vi.advanceTimersByTime(60_200);
    });
  }

  it('結果画面に正答率が表示されず、結果をコピーの代わりに結果を共有ボタンが表示されること', () => {
    advanceToResultScreen();

    expect(container.textContent).toContain('タイムアップ！結果発表');
    expect(container.textContent).toContain('CPM（文字/分）');
    expect(container.textContent).toContain('完走文章数');
    expect(container.textContent).not.toContain('正答率');

    const buttons = Array.from(container.querySelectorAll('button'));
    const shareButton = buttons.find((btn) => btn.textContent?.includes('結果を共有'));
    const copyButton = buttons.find((btn) => btn.textContent?.includes('結果をコピー'));

    expect(shareButton).toBeDefined();
    expect(copyButton).toBeUndefined();
  });

  it('generateTypingResultImage がバージョンとデバイス情報を含み、正答率を含まない PNG Blob を生成すること', async () => {
    const { ctx, drawnTexts } = createMockCanvasContext();
    const fakeBlob = new Blob(['png-bytes'], { type: 'image/png' });

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as CanvasRenderingContext2D
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(fakeBlob);
    });

    const blob = await generateTypingResultImage({
      metrics: {
        digestedChars: 185,
        cpm: 185,
        completedPassages: 2,
        rank: 'A',
      },
      course: 60,
      isNewBest: true,
      version: '1.0.0',
      deviceInfo: 'Chrome 128 (macOS)',
    });

    expect(blob).toBe(fakeBlob);
    expect(drawnTexts).toContain('sawara.me');
    expect(drawnTexts).toContain('日本語変換タイピング結果');
    expect(drawnTexts).toContain('v1.0.0');
    expect(drawnTexts).toContain('Chrome 128 (macOS)');
    expect(drawnTexts).toContain('1分コース');
    expect(drawnTexts).toContain('NEW BEST!');
    expect(drawnTexts).toContain('185');
    expect(drawnTexts).toContain('A');
    expect(drawnTexts).toContain('2本');
    expect(drawnTexts.join(' ')).not.toContain('正答率');
  });

  it('Web Share API 対応環境で結果を共有ボタン押下時に画像ファイル付きで navigator.share が呼ばれること', async () => {
    const { ctx } = createMockCanvasContext();
    const fakeBlob = new Blob(['png-bytes'], { type: 'image/png' });

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as CanvasRenderingContext2D
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(fakeBlob);
    });

    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: canShareMock,
    });

    advanceToResultScreen();

    const shareButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('結果を共有')
    );
    expect(shareButton).toBeDefined();

    await act(async () => {
      shareButton?.click();
    });

    expect(canShareMock).toHaveBeenCalledTimes(1);
    expect(shareMock).toHaveBeenCalledTimes(1);
    const shareArg = shareMock.mock.calls[0][0] as { files: File[]; text: string };
    expect(shareArg.files).toHaveLength(1);
    expect(shareArg.files[0].name).toBe('typing_result.png');
    expect(shareArg.text).toContain('日本語変換タイピング結果');
    expect(shareArg.text).toContain('https://sawara.me/typing');
    expect(shareArg.text).not.toContain('正答率');
  });

  it('Web Share API 非対応環境でクリップボードへ画像コピーし X 投稿画面を開くフォールバックが動作すること', async () => {
    const { ctx } = createMockCanvasContext();
    const fakeBlob = new Blob(['png-bytes'], { type: 'image/png' });

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as CanvasRenderingContext2D
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(fakeBlob);
    });

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: undefined,
    });

    const clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
    if (navigator.clipboard) {
      Object.defineProperty(navigator.clipboard, 'write', {
        configurable: true,
        writable: true,
        value: clipboardWriteMock,
      });
    } else {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { write: clipboardWriteMock },
      });
    }

    class MockClipboardItem {
      public readonly items: Record<string, Blob>;
      /**
       * テスト用 ClipboardItem モックを生成する
       * @param items - MIME タイプと Blob のマップ
       */
      constructor(items: Record<string, Blob>) {
        this.items = items;
      }
    }
    vi.stubGlobal('ClipboardItem', MockClipboardItem);

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null);

    advanceToResultScreen();

    const shareButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('結果を共有')
    );
    expect(shareButton).toBeDefined();

    await act(async () => {
      shareButton?.click();
    });

    expect(clipboardWriteMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(openMock).toHaveBeenCalledTimes(1);
    const openedUrl = String(openMock.mock.calls[0][0]);
    expect(openedUrl).toContain('https://twitter.com/intent/tweet?');
    expect(decodeURIComponent(openedUrl)).toContain('https://sawara.me/typing');
    expect(decodeURIComponent(openedUrl)).not.toContain('正答率');

    vi.unstubAllGlobals();
  });
});
