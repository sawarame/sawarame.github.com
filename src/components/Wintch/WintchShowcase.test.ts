import { describe, it, expect } from 'vitest';
import { computeHighlightedSegments, matchesFuzzyAndQuery } from './searchUtils';

describe('WintchShowcase 検索デモユーティリティ', () => {
  describe('matchesFuzzyAndQuery', () => {
    it('スペース区切り AND 条件で連続一致・ファジー一致を判定すること', () => {
      expect(matchesFuzzyAndQuery('Safari GitHub Releases', 'saf rel')).toBe(true);
      expect(matchesFuzzyAndQuery('Safari GitHub Releases', 'sfr ghr')).toBe(true);
      expect(matchesFuzzyAndQuery('Safari GitHub Releases', 'saf xcode')).toBe(false);
    });

    it('空欄または空白のみのクエリでは常に true を返すこと', () => {
      expect(matchesFuzzyAndQuery('Ghostty', '')).toBe(true);
      expect(matchesFuzzyAndQuery('Ghostty', '   ')).toBe(true);
    });
  });

  describe('computeHighlightedSegments', () => {
    it('一致箇所のみ matched: true としてチャンク分割されること', () => {
      const segments = computeHighlightedSegments('Release Notes', 'note');
      expect(segments).toEqual([
        { text: 'Release ', matched: false },
        { text: 'Note', matched: true },
        { text: 's', matched: false },
      ]);
    });

    it('クエリが空欄の場合は分割せず matched: false を返すこと', () => {
      expect(computeHighlightedSegments('Safari', '')).toEqual([
        { text: 'Safari', matched: false },
      ]);
    });
  });
});
