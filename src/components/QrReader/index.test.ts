import { describe, it, expect } from 'vitest';
import { isUrl } from './index';

describe('QrReader Utils', () => {
  describe('isUrl', () => {
    it('有効な HTTP/HTTPS URL を判定して true を返すこと', () => {
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('https://sawara.me/test?param=1')).toBe(true);
    });

    it('URL ではない文字列に対しては false を返すこと', () => {
      expect(isUrl('just some text')).toBe(false);
      expect(isUrl('ftp://example.com')).toBe(false);
      expect(isUrl('')).toBe(false);
    });
  });
});
