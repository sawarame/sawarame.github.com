import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WintchTopControlsView, { type LocaleLinkProps } from './WintchTopControlsView';

// React 18 の act 環境フラグを有効化
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * テスト用のシンプルなアンカーリンクモックコンポーネント
 * @param props - リンクプロパティ
 * @returns HTML アンカー要素
 */
function MockLocaleLink({ to, children, autoAddBaseUrl: _autoAddBaseUrl, ...rest }: LocaleLinkProps): JSX.Element {
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}

describe('WintchTopControlsView', () => {
  let container: HTMLDivElement;
  let root: Root;

  const baseProps = {
    currentLocale: 'ja',
    locales: ['ja', 'en'],
    localeConfigs: {
      ja: { label: '日本語', htmlLang: 'ja', baseUrl: '/', url: 'https://sawara.me' },
      en: { label: 'English', htmlLang: 'en', baseUrl: '/en/', url: 'https://sawara.me' },
    },
    currentSiteUrl: 'https://sawara.me',
    currentBaseUrl: '/',
    trailingSlash: false,
    pathname: '/wintch',
    search: '?tab=launcher',
    hash: '#install',
    LinkComponent: MockLocaleLink,
    colorModeToggle: (
      <button type="button" data-testid="color-mode-toggle">
        Toggle color mode
      </button>
    ),
  };

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
  });

  it('現在の言語ラベルとカラーモード切替ボタンが表示されること', () => {
    act(() => {
      root.render(<WintchTopControlsView {...baseProps} />);
    });

    const trigger = container.querySelector('button[aria-haspopup="menu"]');
    const colorToggle = container.querySelector('[data-testid="color-mode-toggle"]');

    expect(trigger).not.toBeNull();
    expect(trigger?.textContent).toContain('日本語');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(colorToggle).not.toBeNull();
  });

  it('言語切替ボタンのクリックでメニューが開き、各ロケールへの遷移リンクが表示されること', () => {
    act(() => {
      root.render(<WintchTopControlsView {...baseProps} />);
    });

    const trigger = container.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    act(() => {
      trigger.click();
    });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const menuItems = Array.from(container.querySelectorAll('a[role="menuitem"]'));
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]?.getAttribute('href')).toBe('pathname:///wintch?tab=launcher#install');
    expect(menuItems[0]?.getAttribute('aria-current')).toBe('page');
    expect(menuItems[1]?.getAttribute('href')).toBe('pathname:///en/wintch?tab=launcher#install');
    expect(menuItems[1]?.getAttribute('aria-current')).toBeNull();
  });

  it('Escape キーまたは外側クリックで言語切替メニューが閉じること', () => {
    act(() => {
      root.render(<WintchTopControlsView {...baseProps} />);
    });

    const trigger = container.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    act(() => {
      trigger.click();
    });
    expect(container.querySelector('ul[role="menu"]')).not.toBeNull();

    // Escape キーで閉じることを確認
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(container.querySelector('ul[role="menu"]')).toBeNull();

    // 再度開いて外側クリックで閉じることを確認
    act(() => {
      trigger.click();
    });
    expect(container.querySelector('ul[role="menu"]')).not.toBeNull();

    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(container.querySelector('ul[role="menu"]')).toBeNull();
  });

  it('中国語（簡体字・繁体字）・韓国語を含む全 5 ロケール構成で遷移リンクが正しく生成されること', () => {
    const fiveLocaleProps = {
      ...baseProps,
      currentLocale: 'zh-Hans',
      currentBaseUrl: '/zh-Hans/',
      pathname: '/zh-Hans/wintch',
      locales: ['ja', 'en', 'zh-Hans', 'zh-Hant', 'ko'],
      localeConfigs: {
        ja: { label: '日本語', htmlLang: 'ja', baseUrl: '/', url: 'https://sawara.me' },
        en: { label: 'English', htmlLang: 'en', baseUrl: '/en/', url: 'https://sawara.me' },
        'zh-Hans': { label: '简体中文', htmlLang: 'zh-Hans', baseUrl: '/zh-Hans/', url: 'https://sawara.me' },
        'zh-Hant': { label: '繁體中文', htmlLang: 'zh-Hant', baseUrl: '/zh-Hant/', url: 'https://sawara.me' },
        ko: { label: '한국어', htmlLang: 'ko', baseUrl: '/ko/', url: 'https://sawara.me' },
      },
    };

    act(() => {
      root.render(<WintchTopControlsView {...fiveLocaleProps} />);
    });

    const trigger = container.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement;
    expect(trigger.textContent).toContain('简体中文');

    act(() => {
      trigger.click();
    });

    const menuItems = Array.from(container.querySelectorAll('a[role="menuitem"]'));
    expect(menuItems).toHaveLength(5);
    expect(menuItems.map((el) => el.getAttribute('href'))).toEqual([
      'pathname:///wintch?tab=launcher#install',
      'pathname:///en/wintch?tab=launcher#install',
      'pathname:///zh-Hans/wintch?tab=launcher#install',
      'pathname:///zh-Hant/wintch?tab=launcher#install',
      'pathname:///ko/wintch?tab=launcher#install',
    ]);
    expect(menuItems[2]?.getAttribute('aria-current')).toBe('page');
  });
});
