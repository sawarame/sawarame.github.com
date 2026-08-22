import { describe, it, expect } from 'vitest';
import {
  executeRegex,
  flagsToString,
  stringToFlags,
  getGroupNames,
  buildHighlightSegments,
  type RegexFlags,
} from '../../src/components/RegexChecker';

describe('Deep Adversarial Fuzzing and Stress Harness', () => {
  // =========================================================================
  // 1. Extreme Quantifiers & Boundary Indices
  // =========================================================================
  describe('1. Extreme Quantifiers & Boundary Indices', () => {
    it('ゼロ回マッチの量指定子 {0} および {0,0} が正しく動作すること', () => {
      const result = executeRegex('a{0}', 'g', 'xyz');
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      // Since a{0} is empty match at every position, text "xyz" has length 3 -> 4 zero-width matches
      expect(result.matchCount).toBe(4);
    });

    it('巨大な上限量指定子 a{1,10000} が巨大テキストで正しくマッチすること', () => {
      const text = 'a'.repeat(5000);
      const result = executeRegex('a{1,10000}', 'g', text);
      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].matchedText.length).toBe(5000);
    });

    it('maxMatches が 1 の場合、1件のみ抽出され isTruncated=true になること', () => {
      const result1 = executeRegex('a', 'g', 'aaaaa', 1);
      expect(result1.error).toBeNull();
      expect(result1.matchCount).toBe(1);
      expect(result1.isTruncated).toBe(true);
    });
  });

  // =========================================================================
  // 2. Nested Groups & Capture Group Boundary Index Verification
  // =========================================================================
  describe('2. Nested Groups & Capture Indices (ES2022 d flag integration)', () => {
    it('多重ネストされたキャプチャグループの startIndex/endIndex が親子の包含関係を満たすこと', () => {
      const pattern = '(?<level1>A(?<level2>B(?<level3>C)))';
      const text = '---ABC---';
      const result = executeRegex(pattern, 'g', text);

      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      expect(result.matchCount).toBe(1);

      const match = result.matches[0];
      expect(match.matchedText).toBe('ABC');
      expect(match.startIndex).toBe(3);
      expect(match.endIndex).toBe(6);

      const l1 = match.groups.find((g) => g.name === 'level1');
      const l2 = match.groups.find((g) => g.name === 'level2');
      const l3 = match.groups.find((g) => g.name === 'level3');

      expect(l1?.value).toBe('ABC');
      expect(l1?.startIndex).toBe(3);
      expect(l1?.endIndex).toBe(6);

      expect(l2?.value).toBe('BC');
      expect(l2?.startIndex).toBe(4);
      expect(l2?.endIndex).toBe(6);

      expect(l3?.value).toBe('C');
      expect(l3?.startIndex).toBe(5);
      expect(l3?.endIndex).toBe(6);
    });

    it('未マッチの省略可能グループの startIndex / endIndex が undefined であること', () => {
      const pattern = '(a)(b)?(c)';
      const text = 'ac';
      const result = executeRegex(pattern, 'g', text);

      expect(result.hasMatch).toBe(true);
      const match = result.matches[0];
      expect(match.groups[0].value).toBe('a');
      expect(match.groups[0].startIndex).toBe(0);
      expect(match.groups[0].endIndex).toBe(1);

      expect(match.groups[1].value).toBeUndefined();
      expect(match.groups[1].startIndex).toBeUndefined();
      expect(match.groups[1].endIndex).toBeUndefined();

      expect(match.groups[2].value).toBe('c');
      expect(match.groups[2].startIndex).toBe(1);
      expect(match.groups[2].endIndex).toBe(2);
    });
  });

  // =========================================================================
  // 3. Highlight Segment Disjoint & Cover Property Tests
  // =========================================================================
  describe('3. Highlight Segment Mathematical Properties', () => {
    it('セグメント分割の数学的不変条件: 重なりがなく、空隙がなく、元のテキストを完全被覆すること', () => {
      const inputs = [
        { pat: 'x', flags: 'g', text: 'axbxcxdxe' },
        { pat: 'ab', flags: 'g', text: 'abababab' },
        { pat: '\\s+', flags: 'g', text: '   hello \t\n world   ' },
        { pat: '(?<tag><[^>]+>)', flags: 'g', text: '<div class="main"><span>text</span></div>' },
      ];

      for (const { pat, flags, text } of inputs) {
        const result = executeRegex(pat, flags, text);
        const segments = result.segments;

        // 1. Total concatenated text matches original
        expect(segments.map((s) => s.text).join('')).toBe(text);

        // 2. Adjacent segments are non-empty unless text itself is empty
        if (text.length > 0) {
          for (const seg of segments) {
            expect(seg.text.length).toBeGreaterThan(0);
          }
        }

        // 3. Matched segments have matchNumber and matchItem
        segments.forEach((seg) => {
          if (seg.isMatch) {
            expect(seg.matchNumber).toBeDefined();
            expect(seg.matchItem).toBeDefined();
            expect(seg.matchItem?.matchedText).toBe(seg.text);
          } else {
            expect(seg.matchNumber).toBeUndefined();
            expect(seg.matchItem).toBeUndefined();
          }
        });
      }
    });
  });

  // =========================================================================
  // 4. Property-Based Generative Fuzzing (1,500 tests)
  // =========================================================================
  describe('4. Property-Based Generative Fuzzing (1,500 tests)', () => {
    it('ランダム生成された正規表現ASTライクなパターンとランダムテキストで例外クラッシュしないこと', () => {
      const tokens = [
        'a', 'b', 'c', '1', '2', '3', '.', '\\d', '\\w', '\\s',
        '[a-z]', '[0-9]', '[^a-z]', '(?<k>\\w+)', '(\\d+)', '(?:abc)',
        '+', '*', '?', '{1,3}', '|', '^', '$', '\\b',
      ];

      function generatePattern(depth: number = 0): string {
        if (depth > 4) return 'a';
        const len = Math.floor(Math.random() * 5) + 1;
        let pat = '';
        for (let i = 0; i < len; i++) {
          pat += tokens[Math.floor(Math.random() * tokens.length)];
        }
        return pat;
      }

      function generateText(): string {
        const chars = 'abc 123 \n\t _-!?:;';
        const len = Math.floor(Math.random() * 40);
        let s = '';
        for (let i = 0; i < len; i++) {
          s += chars[Math.floor(Math.random() * chars.length)];
        }
        return s;
      }

      const flagsList = ['', 'g', 'i', 'm', 's', 'u', 'y', 'gi', 'gim', 'gimsuy'];

      for (let i = 0; i < 1500; i++) {
        const pattern = generatePattern();
        const flags = flagsList[Math.floor(Math.random() * flagsList.length)];
        const text = generateText();
        const maxMatches = Math.floor(Math.random() * 50) + 1;

        let result: any;
        expect(() => {
          result = executeRegex(pattern, flags, text, maxMatches);
        }).not.toThrow();

        if (result && !result.error) {
          // Reconstructed text must always match original text
          const reconstructed = result.segments.map((s: any) => s.text).join('');
          expect(reconstructed).toBe(text);

          // Matches length <= maxMatches
          expect(result.matches.length).toBeLessThanOrEqual(maxMatches);

          // Each match text must match sliced text
          for (const m of result.matches) {
            expect(text.slice(m.startIndex, m.endIndex)).toBe(m.matchedText);
          }
        }
      }
    });
  });
});
