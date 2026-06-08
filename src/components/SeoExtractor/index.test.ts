import { describe, it, expect } from 'vitest';
import { resolveUrl, getDomainName, getTimestamp, parseHtml } from './index';

describe('SeoExtractor Utils', () => {
  describe('resolveUrl', () => {
    it('相対パスが絶対URLに正しく解決されること', () => {
      expect(resolveUrl('/about', 'https://example.com')).toBe('https://example.com/about');
      expect(resolveUrl('contact.html', 'https://example.com/sub/')).toBe('https://example.com/sub/contact.html');
    });

    it('絶対URLはそのまま返すこと', () => {
      expect(resolveUrl('https://sawara.me/test', 'https://example.com')).toBe('https://sawara.me/test');
    });

    it('Base64データ(data:)はそのまま返すこと', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANS';
      expect(resolveUrl(dataUri, 'https://example.com')).toBe(dataUri);
    });

    it('無効な引数は空文字列を返すこと', () => {
      expect(resolveUrl(null, 'https://example.com')).toBe('');
      expect(resolveUrl('', 'https://example.com')).toBe('');
    });
  });

  describe('getDomainName', () => {
    it('URLからホスト名（ドメイン）が抽出されること', () => {
      expect(getDomainName('https://sawara.me/page/1')).toBe('sawara.me');
      expect(getDomainName('http://sub.example.co.jp/test')).toBe('sub.example.co.jp');
    });

    it('無効なURLの場合は入力文字列がそのまま返ること', () => {
      expect(getDomainName('invalid-url-string')).toBe('invalid-url-string');
    });
  });

  describe('getTimestamp', () => {
    it('タイムスタンプ文字列が YYYYMMDDHHMMSS 形式（14文字）で返ること', () => {
      const ts = getTimestamp();
      expect(ts).toMatch(/^\d{14}$/);
    });
  });

  describe('parseHtml', () => {
    it('HTMLソースから主要なSEOメタデータ（title, description, canonical, OGP）が正しくパースされること', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page Title</title>
          <meta name="description" content="This is a description text.">
          <link rel="canonical" href="https://example.com/canonical-url">
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="/images/og.png">
          <link rel="icon" href="/favicon.png">
        </head>
        <body></body>
        </html>
      `;

      const data = parseHtml(html, 'https://example.com');
      
      expect(data.title).toBe('Test Page Title');
      expect(data.description).toBe('This is a description text.');
      expect(data.canonical).toBe('https://example.com/canonical-url');
      expect(data.ogTitle).toBe('OG Title');
      expect(data.ogDescription).toBe('OG Description');
      expect(data.ogImage).toBe('https://example.com/images/og.png');
      expect(data.favicon).toBe('https://example.com/favicon.png');
    });
  });
});
