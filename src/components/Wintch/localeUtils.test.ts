import { describe, it, expect } from 'vitest';
import {
  buildAlternateLocaleHref,
  buildAlternateLocaleLinkTarget,
  type AlternateLocaleUrlParams,
} from './localeUtils';

describe('Wintch ロケール切替 URL ユーティリティ', () => {
  const baseParams: Omit<
    AlternateLocaleUrlParams,
    'pathname' | 'currentBaseUrl' | 'targetBaseUrl'
  > = {
    search: '',
    hash: '',
    currentSiteUrl: 'https://sawara.me',
    targetSiteUrl: 'https://sawara.me',
    trailingSlash: false,
  };

  describe('buildAlternateLocaleHref', () => {
    it('日本語ページ（/wintch）から英語ページ（/en/wintch）へのパスを生成すること', () => {
      expect(
        buildAlternateLocaleHref({
          ...baseParams,
          pathname: '/wintch',
          currentBaseUrl: '/',
          targetBaseUrl: '/en/',
        }),
      ).toBe('/en/wintch');
    });

    it('英語ページ（/en/wintch）から日本語ページ（/wintch）へのパスを生成すること', () => {
      expect(
        buildAlternateLocaleHref({
          ...baseParams,
          pathname: '/en/wintch',
          currentBaseUrl: '/en/',
          targetBaseUrl: '/',
        }),
      ).toBe('/wintch');
    });

    it('末尾スラッシュ付きのパスでも trailingSlash: false に合わせて正規化すること', () => {
      expect(
        buildAlternateLocaleHref({
          ...baseParams,
          pathname: '/wintch/',
          currentBaseUrl: '/',
          targetBaseUrl: '/en/',
          trailingSlash: false,
        }),
      ).toBe('/en/wintch');
    });

    it('クエリパラメータとハッシュを保持したまま遷移先 URL を生成すること', () => {
      expect(
        buildAlternateLocaleHref({
          ...baseParams,
          pathname: '/wintch',
          search: '?tab=launcher',
          hash: '#install',
          currentBaseUrl: '/',
          targetBaseUrl: '/en/',
        }),
      ).toBe('/en/wintch?tab=launcher#install');
    });

    it('別ドメイン構成のロケールでは完全 URL を返すこと', () => {
      expect(
        buildAlternateLocaleHref({
          ...baseParams,
          pathname: '/wintch',
          currentBaseUrl: '/',
          targetBaseUrl: '/',
          targetSiteUrl: 'https://en.sawara.me',
        }),
      ).toBe('https://en.sawara.me/wintch');
    });
  });

  describe('buildAlternateLocaleLinkTarget', () => {
    it('同一ドメイン時は SPA ルーターをバイパスするため pathname:// プレフィックスを付与すること', () => {
      expect(
        buildAlternateLocaleLinkTarget({
          ...baseParams,
          pathname: '/wintch',
          search: '?mode=capture',
          hash: '#shortcuts',
          currentBaseUrl: '/',
          targetBaseUrl: '/en/',
        }),
      ).toBe('pathname:///en/wintch?mode=capture#shortcuts');
    });

    it('別ドメイン時は pathname:// を付与せず完全 URL を返すこと', () => {
      expect(
        buildAlternateLocaleLinkTarget({
          ...baseParams,
          pathname: '/wintch',
          currentBaseUrl: '/',
          targetBaseUrl: '/',
          targetSiteUrl: 'https://en.sawara.me',
        }),
      ).toBe('https://en.sawara.me/wintch');
    });
  });
});
