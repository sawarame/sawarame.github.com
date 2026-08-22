import { describe, it, expect } from 'vitest';
import {
  executeRegex,
  buildHighlightSegments,
  flagsToString,
  stringToFlags,
  type RegexFlags,
  type RegexResult,
} from '../src/components/RegexChecker';

function createPrng(seed: number = 1337) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('Empirical Stress & Adversarial Verification Suite', () => {
  const prng = createPrng(42);

  const sampleChars = [
    'a', 'b', 'c', 'd', 'e', 'x', 'y', 'z',
    'A', 'B', 'C', '0', '1', '2', '3', '8', '9',
    ' ', '\t', '\n', '\r\n', '-', '_', '.', '@', ':', '/', '\\',
    'あ', 'い', 'う', '漢', '字', '日', '本', '語',
    '🚀', '𠮷', '🎉', '🔥', '💻', '🌟', '\u200D', '\u0301'
  ];

  const samplePatterns = [
    '',
    'a',
    '[0-9]+',
    '\\d+',
    '\\w+',
    '\\s+',
    '^[a-z]+',
    '[a-z]+$',
    '\\b\\w+\\b',
    '(?=a)',
    '(?!b)',
    '(?<=x)',
    '(?<!y)',
    '^',
    '$',
    'a*',
    'a+',
    'a?',
    '(a|b)+',
    '(\\w+)-(\\d+)',
    '(?<named>\\w+)',
    '(?:https?://)?([a-z0-9.-]+)',
    '\\p{Emoji}',
    '\\p{Script=Hiragana}+',
    '.*',
    '.+?',
    '[\u4e00-\u9faf]+',
    '(?:)',
    '(?!)',
    // Invalid patterns
    '[a-z',
    '(abc',
    '+invalid',
    '(?<123>bad)',
    '\\',
    'a{5,2}',
  ];

  const flagOptions = ['', 'g', 'i', 'm', 's', 'u', 'y', 'gi', 'gm', 'gimsuy', 'gu', 'gsu', 'gy', 'gmy'];

  // =========================================================================
  // 1. 10,000 Randomized Invariant Verification
  // =========================================================================
  describe('1. 10,000 Randomized Invariant Fuzzing', () => {
    it('全10,000パターンのランダムテキスト・正規表現で ∑(segment.text) === text が厳密に成立すること', () => {
      const iterations = 10000;
      let invariantFailures = 0;
      let matchStructureFailures = 0;
      let totalExecutionTime = 0;

      for (let i = 0; i < iterations; i++) {
        const textLen = Math.floor(prng() * 150);
        let text = '';
        for (let j = 0; j < textLen; j++) {
          const charIdx = Math.floor(prng() * sampleChars.length);
          text += sampleChars[charIdx];
        }

        let pattern: string;
        if (prng() < 0.7) {
          pattern = samplePatterns[Math.floor(prng() * samplePatterns.length)];
        } else {
          const pLen = Math.floor(prng() * 6) + 1;
          pattern = '';
          for (let j = 0; j < pLen; j++) {
            pattern += sampleChars[Math.floor(prng() * sampleChars.length)];
          }
        }

        const flags = flagOptions[Math.floor(prng() * flagOptions.length)];
        const maxMatches = prng() < 0.3 ? Math.floor(prng() * 50) + 1 : 1000;

        const start = performance.now();
        const result = executeRegex(pattern, flags, text, maxMatches);
        totalExecutionTime += performance.now() - start;

        // Invariant check: sum(segment.text) === text
        const reconstructed = result.segments.map(s => s.text).join('');
        if (reconstructed !== text) {
          invariantFailures++;
          console.error(`Invariant failure at #${i}: pattern="${pattern}", flags="${flags}", text="${text}", reconstructed="${reconstructed}"`);
        }

        // Structure check if valid
        if (!result.error) {
          if (result.matchCount !== result.matches.length) {
            matchStructureFailures++;
          }

          for (const m of result.matches) {
            const actualSlice = text.slice(m.startIndex, m.endIndex);
            if (actualSlice !== m.matchedText) {
              matchStructureFailures++;
            }
          }
        }
      }

      expect(invariantFailures).toBe(0);
      expect(matchStructureFailures).toBe(0);
      expect(totalExecutionTime).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 2. maxMatches Cutoff & Memory/Loop Safety
  // =========================================================================
  describe('2. maxMatches Cutoff & Memory / Loop Safety', () => {
    it('maxMatches = 1, 5, 50, 100 で正確に切り詰められ、isTruncated が適切に設定されること', () => {
      const text = 'abcdefghijklmnopqrstuvwxyz'.repeat(50); // 1300 chars
      const cutoffs = [1, 5, 50, 100, 500, 1000];

      for (const cutoff of cutoffs) {
        const result = executeRegex('[a-z]', 'g', text, cutoff);
        expect(result.error).toBeNull();
        expect(result.matches.length).toBe(cutoff);
        expect(result.matchCount).toBe(cutoff);
        expect(result.isTruncated).toBe(text.length > cutoff);

        // Invariant must hold even when truncated
        const reconstructed = result.segments.map(s => s.text).join('');
        expect(reconstructed).toBe(text);
      }
    });

    it('maxMatches を超える大量マッチ（100,000文字 / 50,000マッチ）でも高速かつ安全に切り詰められること', () => {
      const hugeText = 'a1'.repeat(50000); // 100,000 chars, 50,000 numbers
      const start = performance.now();
      const result = executeRegex('\\d', 'g', hugeText, 500);
      const elapsed = performance.now() - start;

      expect(result.error).toBeNull();
      expect(result.matches.length).toBe(500);
      expect(result.isTruncated).toBe(true);
      expect(elapsed).toBeLessThan(100); // Must be under 100ms

      const reconstructed = result.segments.map(s => s.text).join('');
      expect(reconstructed).toBe(hugeText);
    });

    it('maxMatches = 0 または負数の場合の安全なフォールバック挙動', () => {
      const resultZero = executeRegex('a', 'g', 'aaaaa', 0);
      expect(resultZero.error).toBeNull();
      const reconstructed = resultZero.segments.map(s => s.text).join('');
      expect(reconstructed).toBe('aaaaa');
    });

    it('ゼロ幅マッチにおけるループ防止と maxMatches の協調', () => {
      const text = 'aaaaa';
      const result = executeRegex('(?=a)', 'g', text, 3);
      expect(result.error).toBeNull();
      expect(result.matches.length).toBe(3);
      expect(result.isTruncated).toBe(true);
      expect(result.segments.map(s => s.text).join('')).toBe(text);
    });

    it('空文字列マッチ（/(?:)/g）で全文字位置のゼロ幅マッチを無限ループせず正しく検出すること', () => {
      const text = 'abc';
      const result = executeRegex('(?:)', 'g', text);
      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(4); // positions 0, 1, 2, 3
      expect(result.segments.map(s => s.text).join('')).toBe(text);
    });

    it('メモリリーク耐性: 1,000 回の大量マッチ実行でメモリ肥大化やクラッシュが発生しないこと', () => {
      const initialMem = process.memoryUsage().heapUsed;
      const targetText = 'item_0123456789_abcdef_'.repeat(100); // 2400 chars

      for (let i = 0; i < 1000; i++) {
        executeRegex('\\w+', 'g', targetText, 50);
      }

      const finalMem = process.memoryUsage().heapUsed;
      const diffMB = (finalMem - initialMem) / (1024 * 1024);
      expect(diffMB).toBeLessThan(150);
    });
  });

  // =========================================================================
  // 3. Unicode, Surrogate Pairs & Boundary Invariants
  // =========================================================================
  describe('3. Unicode, Surrogate Pairs & Boundary Invariants', () => {
    it('サロゲートペア（𠮷, 🚀, 🍣）を含むテキストでゼロ幅マッチが文字境界を壊さないこと', () => {
      const text = '𠮷野家で🍣を食べる🚀';
      const result = executeRegex('(?=野|🚀|🍣)', 'gu', text);
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      const reconstructed = result.segments.map(s => s.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('Unicodeプロパティエスケープ \\p{Emoji} とサロゲートペアの一致', () => {
      const text = 'Alpha 🚀 Beta 🌟 Gamma 🔥 Delta';
      const result = executeRegex('\\p{Emoji}', 'gu', text);
      expect(result.matchCount).toBe(3);
      expect(result.matches.map(m => m.matchedText)).toEqual(['🚀', '🌟', '🔥']);
      expect(result.segments.map(s => s.text).join('')).toBe(text);
    });

    it('複雑な絵文字シーケンス（ZWJ家族絵文字）のハイライト不変条件', () => {
      const familyEmoji = '👨‍👩‍👧‍👦';
      const text = `Family: ${familyEmoji} is here`;
      const result = executeRegex('\\p{Emoji}', 'gu', text);
      expect(result.error).toBeNull();
      expect(result.segments.map(s => s.text).join('')).toBe(text);
    });

    it('改行コード（CRLF / LF / CR）混在テキストでの不変条件', () => {
      const text = 'line1\r\nline2\nline3\rline4\n\n';
      const result = executeRegex('^line\\d', 'gm', text);
      expect(result.segments.map(s => s.text).join('')).toBe(text);
    });

    it('末尾のみマッチ、先頭のみマッチ、隣接マッチでのセグメント完全性', () => {
      const r1 = executeRegex('^start', '', 'start_middle_end');
      expect(r1.segments.map(s => s.text).join('')).toBe('start_middle_end');

      const r2 = executeRegex('end$', '', 'start_middle_end');
      expect(r2.segments.map(s => s.text).join('')).toBe('start_middle_end');

      const r3 = executeRegex('[a-z]', 'g', 'abc');
      expect(r3.segments).toHaveLength(3);
      expect(r3.segments.map(s => s.text).join('')).toBe('abc');
    });

    it('空テキストおよび空パターン時の挙動一貫性', () => {
      const r1 = executeRegex('', 'g', '');
      expect(r1.segments).toEqual([]);
      expect(r1.segments.map(s => s.text).join('')).toBe('');

      const r2 = executeRegex('abc', 'g', '');
      expect(r2.segments).toEqual([{ text: '', isMatch: false }]);
      expect(r2.segments.map(s => s.text).join('')).toBe('');

      const r3 = executeRegex('', 'g', 'abc');
      expect(r3.segments).toEqual([{ text: 'abc', isMatch: false }]);
      expect(r3.segments.map(s => s.text).join('')).toBe('abc');
    });
  });
});
