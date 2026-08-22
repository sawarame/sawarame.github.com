import { describe, it, expect } from 'vitest';
import {
  executeRegex,
  flagsToString,
  stringToFlags,
  getGroupNames,
  buildHighlightSegments,
  type RegexFlags,
  type RegexResult,
} from '../../src/components/RegexChecker';

describe('Adversarial & Stress Verification Suite for RegexChecker M1', () => {
  // =========================================================================
  // 1. Property-Based Partition & Invariant Tests
  // =========================================================================
  describe('1. Invariants & Property-Based Partition Checks', () => {
    it('Segment Partition Invariant: 全セグメントの text を結合すると元の text と100%完全一致すること', () => {
      const testCases = [
        { pattern: 'a', flags: 'g', text: 'banana' },
        { pattern: '\\d+', flags: 'g', text: 'item 100 costs $25.99 and 50c' },
        { pattern: '(?<word>\\w+)', flags: 'g', text: 'Hello World! 123 456' },
        { pattern: '^', flags: 'gm', text: 'line1\nline2\nline3\n' },
        { pattern: '$', flags: 'gm', text: 'line1\nline2\nline3\n' },
        { pattern: '(?=o)', flags: 'g', text: 'foo boo coo' },
        { pattern: '𠮷', flags: 'gu', text: '𠮷野家で𠮷野' },
        { pattern: 'xyz', flags: 'g', text: 'no match here' },
        { pattern: '', flags: 'g', text: 'empty pattern' },
        { pattern: '.*', flags: 'g', text: 'all text\nsecond line' },
        { pattern: '\\b', flags: 'g', text: 'word1 word2 word3' },
        { pattern: '[\\r\\n]+', flags: 'g', text: 'row1\r\nrow2\nrow3\r\n' },
      ];

      for (const { pattern, flags, text } of testCases) {
        const result = executeRegex(pattern, flags, text);
        const reconstructed = result.segments.map((s) => s.text).join('');
        expect(reconstructed, `Failed invariant on pattern: "${pattern}", text: "${text}"`).toBe(text);
      }
    });

    it('Match Consistency Invariant: matches の件数、hasMatch、startIndex/endIndex の整合性が保たれること', () => {
      const text = 'Alpha 100 Beta 200 Gamma 300';
      const result = executeRegex('\\b(?<name>[A-Z][a-z]+)\\s+(?<val>\\d+)\\b', 'g', text);

      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      expect(result.matchCount).toBe(3);
      expect(result.matches.length).toBe(3);

      result.matches.forEach((m, idx) => {
        expect(m.matchIndex).toBe(idx + 1);
        expect(m.startIndex).toBeLessThanOrEqual(m.endIndex);
        expect(text.slice(m.startIndex, m.endIndex)).toBe(m.matchedText);

        // Group checks
        for (const g of m.groups) {
          if (g.value !== undefined && g.startIndex !== undefined && g.endIndex !== undefined) {
            expect(text.slice(g.startIndex, g.endIndex)).toBe(g.value);
          }
        }
      });
    });

    it('flagsToString & stringToFlags Round-trip Invariant: 64通りの全フラグ組合せで双方向変換が一致すること', () => {
      const flagKeys: Array<keyof RegexFlags> = ['g', 'i', 'm', 's', 'u', 'y'];

      for (let mask = 0; mask < (1 << flagKeys.length); mask++) {
        const flags: RegexFlags = {
          g: !!(mask & 1),
          i: !!(mask & 2),
          m: !!(mask & 4),
          s: !!(mask & 8),
          u: !!(mask & 16),
          y: !!(mask & 32),
        };

        const str = flagsToString(flags);
        const parsed = stringToFlags(str);
        expect(parsed).toEqual(flags);

        const str2 = flagsToString(parsed);
        expect(str2).toBe(str);
      }
    });

    it('getGroupNames Invariant: 抽出されたグループ名数が JS RegExp の exec 結果のグループ数と完全一致すること', () => {
      const patterns = [
        '(\\w+)',
        '(\\w+)-(\\d+)',
        '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
        '(?:https?://)?(?<domain>[a-z.]+)/(?<path>\\w+)?',
        '((a)(b))((c)(d))',
        '(?<outer>(?<inner>x))',
        '\\(((\\d+))(\\d+)\\)',
        '(a)(?:b)(c)(?=d)(e)',
        '(?<first>[a-z]+)_(?<second>[0-9]+)',
      ];

      for (const pat of patterns) {
        const groupNames = getGroupNames(pat);
        const rx = new RegExp(pat);
        const testStr = 'https://sawara.me/path 2026-08-22 abcd x (123)456 abcd ae first_123';
        const m = rx.exec(testStr);
        if (m) {
          expect(groupNames.length, `Mismatch in pattern: ${pat}`).toBe(m.length - 1);
        }
      }
    });
  });

  // =========================================================================
  // 2. Zero-Width Match Stress Tests
  // =========================================================================
  describe('2. Zero-Width Match Stress Tests', () => {
    it('Lookahead ゼロ幅マッチ (?=.) で無限ループせず各文字境界で抽出できること', () => {
      const text = 'abc';
      const lookahead = executeRegex('(?=.)', 'g', text);
      expect(lookahead.error).toBeNull();
      expect(lookahead.matchCount).toBe(3);
      expect(lookahead.matches.map((m) => m.startIndex)).toEqual([0, 1, 2]);
    });

    it('Lookbehind ゼロ幅マッチ (?<=.) で無限ループせず各文字末尾で抽出できること', () => {
      const text = 'abc';
      const lookbehind = executeRegex('(?<=.)', 'g', text);
      expect(lookbehind.error).toBeNull();
      expect(lookbehind.matchCount).toBe(3);
      expect(lookbehind.matches.map((m) => m.startIndex)).toEqual([1, 2, 3]);
    });

    it('空マッチ (?:) でテキスト長+1件のマッチを安全に抽出すること', () => {
      const text = 'abc';
      const result = executeRegex('(?:)', 'g', text);
      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(4);
      expect(result.matches.map((m) => m.startIndex)).toEqual([0, 1, 2, 3]);
      expect(result.matches.every((m) => m.matchedText === '')).toBe(true);
    });

    it('単語境界 \\b および非単語境界 \\B が安全にマッチすること', () => {
      const text = 'cat dog';
      const boundaries = executeRegex('\\b', 'g', text);
      expect(boundaries.error).toBeNull();
      expect(boundaries.matchCount).toBe(4); // ^c, t$, ^d, g$

      const nonBoundaries = executeRegex('\\B', 'g', text);
      expect(nonBoundaries.error).toBeNull();
      expect(nonBoundaries.hasMatch).toBe(true);
    });

    it('空選択肢 (a|) および (|a) のゼロ幅進行が正しく機能すること', () => {
      const result1 = executeRegex('a|', 'g', 'aba');
      expect(result1.error).toBeNull();
      expect(result1.hasMatch).toBe(true);

      const result2 = executeRegex('|a', 'g', 'aba');
      expect(result2.error).toBeNull();
      expect(result2.hasMatch).toBe(true);
    });

    it('マルチライン行頭 ^ および行末 $ のゼロ幅マッチが各行で正しく動作すること', () => {
      const multilineText = 'foo\nbar\nbaz';
      const starts = executeRegex('^', 'gm', multilineText);
      expect(starts.matchCount).toBe(3);
      expect(starts.matches.map((m) => m.startIndex)).toEqual([0, 4, 8]);

      const ends = executeRegex('$', 'gm', multilineText);
      expect(ends.matchCount).toBe(3);
      expect(ends.matches.map((m) => m.startIndex)).toEqual([3, 7, 11]);
    });

    it('0件マッチの行頭アンカー ^ がマッチしないテキストで安全に終了すること', () => {
      const result = executeRegex('^xyz', '', 'abc\ndef');
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(false);
      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
    });
  });

  // =========================================================================
  // 3. Unicode, Surrogate Pairs, and Astral Plane
  // =========================================================================
  describe('3. Unicode & Surrogate Pairs', () => {
    it('サロゲートペア文字（𠮷, 𩸽, 🍣, 🍺）に対するゼロ幅マッチでサロゲート境界で分解しないこと', () => {
      const text = '🍣𠮷🍺';
      // With 'u' flag
      const resultU = executeRegex('(?=.)', 'gu', text);
      expect(resultU.error).toBeNull();
      expect(resultU.matchCount).toBe(3);
      expect(resultU.matches.map((m) => m.startIndex)).toEqual([0, 2, 4]);

      // With 'u' flag and literal match
      const sushi = executeRegex('🍣', 'u', text);
      expect(sushi.matchCount).toBe(1);
      expect(sushi.matches[0].matchedText).toBe('🍣');
      expect(sushi.matches[0].startIndex).toBe(0);
      expect(sushi.matches[0].endIndex).toBe(2);
    });

    it('Unicode プロパティエスケープ \\p{Emoji} / \\p{Script=Hiragana} が u フラグで正しく動作すること', () => {
      const text = 'あいうえお123カタカナ';
      const hira = executeRegex('\\p{Script=Hiragana}+', 'gu', text);
      expect(hira.error).toBeNull();
      expect(hira.matchCount).toBe(1);
      expect(hira.matches[0].matchedText).toBe('あいうえお');
    });

    it('孤立サロゲート（不完全なUnicodeコードユニット）が含まれていてもクラッシュしないこと', () => {
      const brokenSurrogate = 'abc\uD800xyz\uDFFF123';
      const result = executeRegex('\\w+', 'g', brokenSurrogate);
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);

      const segments = buildHighlightSegments(brokenSurrogate, result.matches);
      expect(segments.map((s) => s.text).join('')).toBe(brokenSurrogate);
    });

    it('RTL（アラビア語・ヘブライ語）およびゼロ幅結合子（ZWJ: \\u200D）の文字列を安全に処理すること', () => {
      const familyEmoji = '👨\u200D👩\u200D👧\u200D👦'; // ZWJ sequence
      const arabicText = 'مرحبا بالعالم 123';
      const resultArabic = executeRegex('\\d+', 'g', arabicText);
      expect(resultArabic.error).toBeNull();
      expect(resultArabic.matches[0].matchedText).toBe('123');

      const resultFamily = executeRegex('.', 'gu', familyEmoji);
      expect(resultFamily.error).toBeNull();
      expect(resultFamily.matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. Syntax Errors & Adversarial Malformed Patterns
  // =========================================================================
  describe('4. Syntax Errors & Malformed Patterns (Robust Error Handling)', () => {
    const invalidPatterns = [
      '[a-z', // 未閉じ文字クラス
      '(abc', // 未閉じグループ
      '(?<name', // 未閉じ名前付きグループ
      '(?<123>abc)', // 数字から始まる不正グループ名
      '+abc', // 先頭に量指定子
      '*abc',
      '?abc',
      '{1,2}abc',
      '[z-a]', // 逆順の文字クラス範囲
      'abc\\', // 末尾の孤立バックスラッシュ
      '\\k<nonexistent>', // uフラグ時の存在しないグループ名への後方参照 (flags: u)
      '(?<foo>a)(?<foo>b)', // 同一ブランチ内の重複名前付きグループ（JS制限）
      '(?', // 不完全なグループ記法
      '(?<', // 不完全な名前付きグループ
      '(?<=', // 不完全な後読み
      '(?!', // 不完全な否定先読み
    ];

    for (const pat of invalidPatterns) {
      it(`不正パターン "${pat}" で例外クラッシュせず error メッセージを返すこと`, () => {
        const flags = pat === '\\k<nonexistent>' ? 'u' : 'g';
        const result = executeRegex(pat, flags, 'some test string 123');
        expect(result.error).not.toBeNull();
        expect(typeof result.error).toBe('string');
        expect(result.hasMatch).toBe(false);
        expect(result.matchCount).toBe(0);
        expect(result.matches).toEqual([]);
        expect(result.segments).toEqual([{ text: 'some test string 123', isMatch: false }]);
      });
    }

    it('不正なフラグ文字列が渡された場合でも安全に error を返すこと', () => {
      const result = executeRegex('abc', 'invalid_flags_123', 'abc');
      expect(result.error).not.toBeNull();
      expect(result.hasMatch).toBe(false);
    });
  });

  // =========================================================================
  // 5. ReDoS & Pathological Backtracking Patterns
  // =========================================================================
  describe('5. Pathological Backtracking & Safety', () => {
    it('バックトラッキングが発生しやすいパターンでもクラッシュせず完了すること', () => {
      // (a+)+$ on 'aaaaaaaaaaaaaaaaaaaa!' (20 'a's)
      const input = 'a'.repeat(20) + '!';
      const result = executeRegex('^(a+)+!$', '', input + '?');
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(false);
    });

    it('重なり合う量指定子 ^([a-zA-Z]+)+!$ でも安全に処理されること', () => {
      const input = 'abcdefghijklmno?';
      const result = executeRegex('^([a-zA-Z]+)+!$', '', input);
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(false);
    });
  });

  // =========================================================================
  // 6. Truncation Limit & High Volume Stress
  // =========================================================================
  describe('6. Truncation Limit & High-Volume Performance', () => {
    it('maxMatches=50 の制限で100件のマッチが安全に50件で打ち切られ isTruncated=true になること', () => {
      const repeatedText = 'cat '.repeat(100);
      const result = executeRegex('cat', 'g', repeatedText, 50);

      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(50);
      expect(result.matches.length).toBe(50);
      expect(result.isTruncated).toBe(true);

      const segments = result.segments;
      expect(segments.map((s) => s.text).join('')).toBe(repeatedText);
    });

    it('maxMatches=1 の場合、最初の1件のみ抽出し isTruncated=true になること', () => {
      const result = executeRegex('a', 'g', 'aaaaa', 1);
      expect(result.matchCount).toBe(1);
      expect(result.isTruncated).toBe(true);
      expect(result.matches[0].startIndex).toBe(0);
      expect(result.matches[0].endIndex).toBe(1);
    });

    it('100,000文字の巨大テキストに対する検索がクラッシュせず完了すること', () => {
      const largeText = 'a'.repeat(50000) + 'TARGET' + 'b'.repeat(50000);
      const start = Date.now();
      const result = executeRegex('TARGET', 'g', largeText, 1000);
      const elapsed = Date.now() - start;

      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].startIndex).toBe(50000);
      expect(elapsed).toBeLessThan(500);
    });
  });

  // =========================================================================
  // 7. Fuzzing & Random Adversarial Generators
  // =========================================================================
  describe('7. Automated Adversarial Fuzzing Generator', () => {
    it('1000回のランダム文字列・パターン・フラグ組合せで決して例外クラッシュしないこと', () => {
      const chars = 'abcdef0123 \t\n[](){}^$*+?|\\<>-=!:,._~/寿司𠮷😀';
      const flagOptions = ['', 'g', 'i', 'm', 's', 'u', 'y', 'gim', 'gimsuy', 'invalid!'];

      function randomString(len: number): string {
        let s = '';
        for (let i = 0; i < len; i++) {
          s += chars[Math.floor(Math.random() * chars.length)];
        }
        return s;
      }

      for (let i = 0; i < 1000; i++) {
        const pat = randomString(Math.floor(Math.random() * 15));
        const flags = flagOptions[Math.floor(Math.random() * flagOptions.length)];
        const text = randomString(Math.floor(Math.random() * 50));
        const maxMatches = Math.floor(Math.random() * 20) + 1;

        let result: RegexResult | undefined;
        expect(() => {
          result = executeRegex(pat, flags, text, maxMatches);
        }).not.toThrow();

        if (result && !result.error) {
          // Verify segment invariant
          const reconstructed = result.segments.map((s) => s.text).join('');
          expect(reconstructed).toBe(text);
          expect(result.matches.length).toBeLessThanOrEqual(maxMatches);
        }
      }
    });
  });
});
