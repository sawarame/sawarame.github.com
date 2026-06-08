import { describe, it, expect } from 'vitest';
import { formatExposureTime, formatGps } from './index';

describe('ExifViewer Utils', () => {
  describe('formatExposureTime', () => {
    it('1秒未満の露出時間が分数表記（例: 1/125）に変換されること', () => {
      expect(formatExposureTime(0.008)).toBe('1/125');
      expect(formatExposureTime(0.04)).toBe('1/25');
    });

    it('1秒以上の露出時間はそのままの文字列を返すこと', () => {
      expect(formatExposureTime(1)).toBe('1');
      expect(formatExposureTime(2.5)).toBe('2.5');
    });

    it('引数が undefined または 0 の場合は空文字列を返すこと', () => {
      expect(formatExposureTime(undefined)).toBe('');
      expect(formatExposureTime(0)).toBe('');
    });
  });

  describe('formatGps', () => {
    it('緯度・経度が小数点第6位までの文字列としてフォーマットされること', () => {
      expect(formatGps(35.6895, 139.6917)).toBe('35.689500, 139.691700');
    });

    it('いずれかが undefined の場合は空文字列を返すこと', () => {
      expect(formatGps(undefined, 139.6917)).toBe('');
      expect(formatGps(35.6895, undefined)).toBe('');
      expect(formatGps(undefined, undefined)).toBe('');
    });
  });
});
