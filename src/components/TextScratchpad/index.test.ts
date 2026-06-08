import { describe, it, expect } from 'vitest';
import { formatDate, createSavedText, sortTexts, SavedText } from './index';

describe('TextScratchpad Utils', () => {
  describe('formatDate', () => {
    it('Dateオブジェクトが YYYY/MM/DD HH:mm:ss 形式にフォーマットされること', () => {
      const date = new Date(2026, 5, 8, 12, 30, 45);
      expect(formatDate(date)).toBe('2026/06/08 12:30:45');
    });
  });

  describe('createSavedText', () => {
    it('保存済みテキストのリストから結合テキストが生成されること', () => {
      const texts: SavedText[] = [
        { date: new Date(2026, 5, 8, 12, 0, 0), text: 'Hello', pinned: true },
        { date: new Date(2026, 5, 8, 12, 5, 0), text: 'World', pinned: false }
      ];
      const result = createSavedText(texts);
      expect(result).toContain('[2026/06/08 12:00:00] [PIN]\nHello');
      expect(result).toContain('[2026/06/08 12:05:00]\nWorld');
    });
  });

  describe('sortTexts', () => {
    it('ピン留めされたテキストが最優先され、その他は日付の降順（新しい順）で並び替えられること', () => {
      const texts: SavedText[] = [
        { date: new Date(2026, 5, 8, 10, 0, 0), text: 'Oldest Unpinned', pinned: false },
        { date: new Date(2026, 5, 8, 12, 0, 0), text: 'Newest Unpinned', pinned: false },
        { date: new Date(2026, 5, 8, 11, 0, 0), text: 'Pinned 1', pinned: true },
        { date: new Date(2026, 5, 8, 11, 30, 0), text: 'Pinned 2', pinned: true }
      ];

      const sorted = sortTexts(texts);
      
      expect(sorted[0].text).toBe('Pinned 2');
      expect(sorted[1].text).toBe('Pinned 1');
      expect(sorted[2].text).toBe('Newest Unpinned');
      expect(sorted[3].text).toBe('Oldest Unpinned');
    });
  });
});
