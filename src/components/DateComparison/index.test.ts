import { describe, it, expect } from 'vitest';
import { parseCustomDate, formatDate } from './index';

describe('DateComparison Utils', () => {
  describe('parseCustomDate', () => {
    it('YYYY/MM/DD フォーマットが正しくパースされること', () => {
      const date = parseCustomDate('2026/06/08');
      expect(date).not.toBeNull();
      expect(date!.getFullYear()).toBe(2026);
      expect(date!.getMonth()).toBe(5); // 0-indexed
      expect(date!.getDate()).toBe(8);
    });

    it('日本語日付フォーマット (YYYY年MM月DD日) が正しくパースされること', () => {
      const date = parseCustomDate('2026年06月08日 12時30分15秒');
      expect(date).not.toBeNull();
      expect(date!.getFullYear()).toBe(2026);
      expect(date!.getMonth()).toBe(5);
      expect(date!.getDate()).toBe(8);
      expect(date!.getHours()).toBe(12);
      expect(date!.getMinutes()).toBe(30);
      expect(date!.getSeconds()).toBe(15);
    });

    it('UNIXTIME (ミリ秒) が正しくパースされること', () => {
      const timestampMs = 1773010800000;
      const date = parseCustomDate(timestampMs.toString());
      expect(date).not.toBeNull();
      expect(date!.getTime()).toBe(timestampMs);
    });

    it('UNIXTIME (秒) が正しくパースされること', () => {
      const timestampSec = 1773010800;
      const date = parseCustomDate(timestampSec.toString());
      expect(date).not.toBeNull();
      expect(date!.getTime()).toBe(timestampSec * 1000);
    });

    it('無効な日付文字列は null を返すこと', () => {
      expect(parseCustomDate('invalid-date')).toBeNull();
      expect(parseCustomDate('')).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('Dateオブジェクトが YYYY/MM/DD HH:mm:ss 形式の文字列にフォーマットされること', () => {
      const date = new Date(2026, 5, 8, 15, 45, 30);
      const formatted = formatDate(date);
      expect(formatted).toBe('2026/06/08 15:45:30');
    });
  });
});
