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

  it('残り時間プログレスバーが入力ボックスの真下かつヘルパー文の上に1つだけ配置され、残り10秒以下で警告色になり、エラー時に進捗バーは揺れないこと', () => {
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

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    // プログレスバーがプレイ画面に 1 つだけ存在すること
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars).toHaveLength(1);
    const progressBar = progressBars[0] as HTMLElement;

    const input = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) return;

    const richInputContainer = input.parentElement as HTMLElement;
    const progressWrap = progressBar.parentElement as HTMLElement;
    const inputWrap = richInputContainer.parentElement as HTMLElement;
    const helperText = Array.from(container.querySelectorAll('p')).find((p) =>
      p.textContent?.includes('IME変換確定の Enter では判定されません')
    );

    expect(helperText).toBeDefined();
    // 同じ inputWrap 内で「入力ボックス → プログレスバー → ヘルパー文」の順に並んでいること
    expect(progressWrap.parentElement).toBe(inputWrap);
    expect(helperText?.parentElement).toBe(inputWrap);
    expect(richInputContainer.nextElementSibling).toBe(progressWrap);
    expect(progressWrap.nextElementSibling).toBe(helperText);

    // 初期状態は primary カラー、値 100 付近であること
    expect(progressBar.className).toContain('MuiLinearProgress-colorPrimary');
    expect(Number(progressBar.getAttribute('aria-valuenow'))).toBe(100);

    // 不一致 Enter 送信時、シェイク用クラスは入力ボックスコンテナのみに付きプログレスバーや親には付かないこと
    act(() => {
      input.focus();
      setInputValue(input, '@@@誤入力テスト');
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });
    expect(richInputContainer.className).toMatch(/inputShake[AB]/);
    expect(inputWrap.className).not.toMatch(/inputShake[AB]/);
    expect(progressWrap.className).not.toMatch(/inputShake[AB]/);
    expect(document.activeElement).toBe(input);

    // 52 秒経過（残り 8 秒）で進捗バーが減少し、警告色（error）へ切り替わること
    act(() => {
      vi.advanceTimersByTime(52_000);
    });
    const remainingValue = Number(progressBar.getAttribute('aria-valuenow'));
    expect(remainingValue).toBeLessThan(20);
    expect(remainingValue).toBeGreaterThan(0);
    expect(progressBar.className).toContain('MuiLinearProgress-colorError');
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

describe('TypingTool 待機画面（コース選択・IME案内）テスト', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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
  });

  it('コースを選択しても URL クエリパラメータが変更されず、選択状態のみ切り替わること', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const initialSearch = window.location.search;

    act(() => {
      root.render(<TypingTool />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const course1MinBtn = buttons.find((btn) => btn.textContent?.includes('1分コース'));
    const course3MinBtn = buttons.find((btn) => btn.textContent?.includes('3分コース'));
    expect(course1MinBtn).toBeDefined();
    expect(course3MinBtn).toBeDefined();

    // 初期状態は 1 分コースが選択状態
    expect(course1MinBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(course3MinBtn?.getAttribute('aria-pressed')).toBe('false');

    // 3 分コースを選択しても URL は変更されないこと
    act(() => {
      course3MinBtn?.click();
    });
    expect(course1MinBtn?.getAttribute('aria-pressed')).toBe('false');
    expect(course3MinBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(window.location.search).toBe(initialSearch);
    expect(replaceStateSpy).not.toHaveBeenCalled();
    expect(pushStateSpy).not.toHaveBeenCalled();

    // 1 分コースへ戻しても URL は変更されないこと
    act(() => {
      course1MinBtn?.click();
    });
    expect(course1MinBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(course3MinBtn?.getAttribute('aria-pressed')).toBe('false');
    expect(window.location.search).toBe(initialSearch);
    expect(replaceStateSpy).not.toHaveBeenCalled();
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('待機画面でスタートボタンの前に日本語入力をONにしておく案内が表示されること', () => {
    act(() => {
      root.render(<TypingTool />);
    });

    const noticeEl = container.querySelector('[role="note"]');
    expect(noticeEl).not.toBeNull();
    expect(noticeEl?.textContent).toContain(
      'スタートボタンを押す前に、日本語入力（IME）をONにしておいてください。'
    );

    const startButton = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('スタート')
    );
    expect(startButton).toBeDefined();

    // 案内要素がスタートボタンより前の DOM 位置に配置されていること
    if (noticeEl && startButton) {
      const position = noticeEl.compareDocumentPosition(startButton);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});

/**
 * テスト用のインメモリ Storage モックを生成する
 * @returns Web Storage 互換のインメモリ実装
 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

describe('TypingTool 自動スクロール・フォーカス制御テスト', () => {
  let container: HTMLDivElement;
  let root: Root;
  let originalScrollIntoView: PropertyDescriptor | undefined;
  let originalMatchMedia: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView'
    );
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
    } else {
      delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    }
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      delete (window as { matchMedia?: unknown }).matchMedia;
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * テスト用に指定したラベルを含むボタンを取得する
   * @param rootEl - 検索対象のコンテナ要素
   * @param label - 検索するボタン文言
   * @returns 該当する HTMLButtonElement（見つからない場合は undefined）
   */
  function findButtonByText(rootEl: HTMLElement, label: string): HTMLButtonElement | undefined {
    return Array.from(rootEl.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes(label)
    );
  }

  /**
   * 3秒カウントダウンを完了させてプレイ画面へ遷移するヘルパー
   */
  function completeCountdown(): void {
    for (let i = 0; i < 3; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
  }

  it('スタート・リトライ・同じコースでもう一度でスムーズスクロールされ、中断やコース選択ではスクロールされないこと', () => {
    const scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');

    act(() => {
      root.render(<TypingTool />);
    });

    // 初回描画やコース選択変更ではスクロールしないこと
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    const course3MinBtn = findButtonByText(container, '3分コース');
    const course1MinBtn = findButtonByText(container, '1分コース');
    act(() => {
      course3MinBtn?.click();
      course1MinBtn?.click();
    });
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    // 1. 待機画面「スタート」クリックでスクロールすること
    const startButton = findButtonByText(container, 'スタート');
    expect(startButton).toBeDefined();
    act(() => {
      startButton?.click();
    });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewMock).toHaveBeenLastCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    // カウントダウン終了後の自動フォーカスが preventScroll: true で呼ばれること
    completeCountdown();
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    // 2. プレイ中「リトライ」クリックで再度スクロールすること
    const retryButton = findButtonByText(container, 'リトライ');
    expect(retryButton).toBeDefined();
    act(() => {
      retryButton?.click();
    });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    expect(scrollIntoViewMock).toHaveBeenLastCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    // プレイを進めて結果画面へ遷移
    completeCountdown();
    act(() => {
      vi.advanceTimersByTime(60_200);
    });
    expect(container.textContent).toContain('タイムアップ！結果発表');
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);

    // 3. 結果画面「同じコースでもう一度」クリックで再度スクロールすること
    const playAgainButton = findButtonByText(container, '同じコースでもう一度');
    expect(playAgainButton).toBeDefined();
    act(() => {
      playAgainButton?.click();
    });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(3);
    expect(scrollIntoViewMock).toHaveBeenLastCalledWith({
      behavior: 'smooth',
      block: 'start',
    });

    // カウントダウン中の「中断して戻る」ではスクロールしないこと
    const cancelButton = findButtonByText(container, '中断して戻る');
    expect(cancelButton).toBeDefined();
    act(() => {
      cancelButton?.click();
    });
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(3);
  });

  it('prefers-reduced-motion 有効時は behavior: auto でスクロールし、scrollIntoView 未定義でも例外が発生しないこと', () => {
    const scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoViewMock,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    act(() => {
      root.render(<TypingTool />);
    });

    const startButton = findButtonByText(container, 'スタート');
    act(() => {
      startButton?.click();
    });
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    });

    // scrollIntoView が未定義の環境でもエラーなく開始できること
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const cancelButton = findButtonByText(container, '中断して戻る');
    act(() => {
      cancelButton?.click();
    });
    const startButtonAgain = findButtonByText(container, 'スタート');
    expect(() => {
      act(() => {
        startButtonAgain?.click();
      });
    }).not.toThrow();
  });
});

describe('TypingTool タイムアップ時の未送信文字自動集計テスト', () => {
  let container: HTMLDivElement;
  let root: Root;
  let mockStorage: Storage;
  let originalLocalStorage: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    mockStorage = createMemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: mockStorage,
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    if (originalLocalStorage) {
      Object.defineProperty(window, 'localStorage', originalLocalStorage);
    } else {
      delete (window as { localStorage?: unknown }).localStorage;
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * 待機画面からプレイ開始状態まで進め、課題文テキストと入力欄要素を返すヘルパー
   * @returns 現在の課題文全文と入力欄の HTMLInputElement
   */
  function startPlayingSession(): { passageText: string; input: HTMLInputElement } {
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

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    const passageBox = container.querySelector('[role="region"]');
    const input = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(passageBox).not.toBeNull();
    expect(input).not.toBeNull();

    return {
      passageText: passageBox?.textContent ?? '',
      input: input as HTMLInputElement,
    };
  }

  /**
   * 結果画面に表示された総消化文字数・完走文章数を抽出するヘルパー
   * @param rootEl - レンダリング先コンテナ
   * @returns 総消化文字数と完走文章数
   */
  function readResultStats(rootEl: HTMLElement): { digestedChars: number; completedPassages: number } {
    const text = rootEl.textContent ?? '';
    const charsMatch = text.match(/(\d+)文字（総消化文字数）/);
    const passagesMatch = text.match(/完走文章数(\d+)本/);
    return {
      digestedChars: charsMatch ? Number(charsMatch[1]) : -1,
      completedPassages: passagesMatch ? Number(passagesMatch[1]) : -1,
    };
  }

  it('未送信の完全一致テキストが残った状態でタイムアップすると自動集計され自己ベストにも保存されること', () => {
    const { passageText, input } = startPlayingSession();
    const chars = Array.from(passageText.normalize('NFC'));
    const firstPart = chars.slice(0, 5).join('');
    const secondPart = chars.slice(5, 13).join('');

    // まず 5 文字を Enter で確定送信
    act(() => {
      setInputValue(input, firstPart);
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });

    // 続く 8 文字は入力しただけで Enter せずにタイムアップ
    act(() => {
      setInputValue(input, secondPart);
    });
    act(() => {
      vi.advanceTimersByTime(60_200);
    });

    expect(container.textContent).toContain('タイムアップ！結果発表');
    const stats = readResultStats(container);
    expect(stats.digestedChars).toBe(13);
    expect(stats.completedPassages).toBe(0);

    // 自己ベストにも加算後の 13 文字が保存されていること
    const savedRaw = window.localStorage.getItem('sawara_typing_best_records_v1');
    expect(savedRaw).not.toBeNull();
    const saved = JSON.parse(savedRaw as string) as Record<string, { chars: number; cpm: number }>;
    expect(saved['60']?.chars).toBe(13);
    expect(saved['60']?.cpm).toBe(13);
  });

  it('未送信テキストが部分一致（前半一致＋後半誤変換）の場合は先頭一致分のみ自動加算されること', () => {
    const { passageText, input } = startPlayingSession();
    const chars = Array.from(passageText.normalize('NFC'));
    const partialInput = `${chars.slice(0, 6).join('')}@@@誤変換`;

    act(() => {
      setInputValue(input, partialInput);
    });
    act(() => {
      vi.advanceTimersByTime(60_200);
    });

    const stats = readResultStats(container);
    expect(stats.digestedChars).toBe(6);
    expect(stats.completedPassages).toBe(0);
  });

  it('未送信テキストによって例文末尾まで完走した場合は消化文字数に加えて完走文章数も +1 されること', () => {
    const { passageText, input } = startPlayingSession();
    const chars = Array.from(passageText.normalize('NFC'));
    const head = chars.slice(0, 10).join('');
    const tail = chars.slice(10).join('');

    // 先頭 10 文字を Enter で消化
    act(() => {
      setInputValue(input, head);
    });
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });

    // 残りの全文を入力して Enter しないままタイムアップ
    act(() => {
      setInputValue(input, tail);
    });
    act(() => {
      vi.advanceTimersByTime(60_200);
    });

    const stats = readResultStats(container);
    expect(stats.digestedChars).toBe(chars.length);
    expect(stats.completedPassages).toBe(1);
  });

  it('IME 変換中（compositionstart 後）の未送信テキストであっても先頭一致分が自動集計されること', () => {
    const { passageText, input } = startPlayingSession();
    const chars = Array.from(passageText.normalize('NFC'));
    const composingInput = chars.slice(0, 7).join('');

    act(() => {
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      setInputValue(input, composingInput);
    });
    act(() => {
      vi.advanceTimersByTime(60_200);
    });

    const stats = readResultStats(container);
    expect(stats.digestedChars).toBe(7);
    expect(stats.completedPassages).toBe(0);
  });

  it('先頭不一致テキストが残ったままタイムアップした場合は 0 加算で結果画面へ遷移すること', () => {
    const { input } = startPlayingSession();

    act(() => {
      setInputValue(input, '@@@完全不一致');
    });
    act(() => {
      vi.advanceTimersByTime(60_200);
    });

    expect(container.textContent).toContain('タイムアップ！結果発表');
    const stats = readResultStats(container);
    expect(stats.digestedChars).toBe(0);
    expect(stats.completedPassages).toBe(0);
  });

  it('プレイ中に未送信テキストが残った状態で中断した場合は集計・結果遷移・自己ベスト保存を行わないこと', () => {
    const { passageText, input } = startPlayingSession();
    const chars = Array.from(passageText.normalize('NFC'));

    act(() => {
      setInputValue(input, chars.slice(0, 10).join(''));
    });

    const abortButton = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent?.trim() === '中断'
    );
    expect(abortButton).toBeDefined();
    act(() => {
      abortButton?.click();
    });

    // 待機画面へ戻り、その後時間が経過しても結果画面へ遷移しないこと
    expect(container.textContent).toContain('コースを選択');
    act(() => {
      vi.advanceTimersByTime(65_000);
    });
    expect(container.textContent).toContain('コースを選択');
    expect(window.localStorage.getItem('sawara_typing_best_records_v1')).toBeNull();
  });
});
