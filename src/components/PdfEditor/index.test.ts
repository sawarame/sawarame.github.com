import { describe, it, expect } from 'vitest';
import { FORMATS, WIDTH_PRESETS } from './index';

describe('PdfEditor Utils', () => {
  describe('FORMATS', () => {
    it('サポートするフォーマット（PNG, JPEG, WebP）が定義されていること', () => {
      expect(FORMATS).toHaveLength(3);
      expect(FORMATS[0].label).toBe('PNG');
      expect(FORMATS[1].label).toBe('JPEG');
      expect(FORMATS[2].label).toBe('WebP');
    });
  });

  describe('WIDTH_PRESETS', () => {
    it('幅のプリセット配列が正しく生成されること', () => {
      const presets = WIDTH_PRESETS();
      expect(presets.length).toBeGreaterThan(0);
      expect(presets[0].label).toBe('制限なし');
      expect(presets[0].value).toBeUndefined();
      expect(presets[1].value).toBe(2560);
    });
  });
});
