/**
 * Phase 2 (Tier 5) Adversarial Coverage Hardening Suite
 * 
 * Deep white-box adversarial stress tests, fuzzing invariants,
 * security boundary validation, and prototype-pollution immunity.
 */

import { describe, it, expect } from 'vitest';
import {
  executeRegex,
  flagsToString,
  stringToFlags,
  getGroupNames,
  buildHighlightSegments,
  PRESET_TEMPLATES,
  type RegexFlags,
  type RegexResult,
} from '../src/components/RegexChecker';

describe('Tier 5 Adversarial & White-Box Hardening Suite', () => {
  // =========================================================================
  // 1. Prototype Pollution & Reserved Keyword Group Names
  // =========================================================================
  describe('1. Prototype Pollution & Reserved Keyword Immunity', () => {
    const reservedNames = [
      'constructor',
      'toString',
      'valueOf',
      '__proto__',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'length',
    ];

    for (const name of reservedNames) {
      it(`名前付きグループ名に "${name}" が使用されてもオブジェクト汚染や例外が発生しないこと`, () => {
        const pattern = `(?<${name}>\\w+)`;
        let result: RegexResult;
        expect(() => {
          result = executeRegex(pattern, 'g', 'testValue');
        }).not.toThrow();

        result = executeRegex(pattern, 'g', 'testValue');
        expect(result.error).toBeNull();
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].namedGroups).toBeDefined();
        expect(result.matches[0].namedGroups?.[name]).toBe('testValue');
        expect(result.matches[0].groups[0].name).toBe(name);
        expect(result.matches[0].groups[0].value).toBe('testValue');

        // Check prototype integrity
        expect(Object.prototype.toString).toBeInstanceOf(Function);
        expect(Object.prototype.hasOwnProperty).toBeInstanceOf(Function);
      });
    }

    it('Unicode 識別子（日本語名）の名前付きグループ (?<日付>\\d{4}) が正常に抽出されること', () => {
      const pattern = '(?<年>\\d{4})年(?<月>\\d{1,2})月(?<日>\\d{1,2})日';
      const text = '2026年8月22日';
      const result = executeRegex(pattern, 'gu', text);
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      expect(result.matches[0].namedGroups).toEqual({
        年: '2026',
        月: '8',
        日: '22',
      });
      expect(result.matches[0].groups.map(g => g.name)).toEqual(['年', '月', '日']);
    });
  });

  // =========================================================================
  // 2. Astral Plane Unicode, Surrogate Pairs & Zero-width Stepping
  // =========================================================================
  describe('2. Astral Plane Unicode, Surrogate Pairs & Zero-width Stepping', () => {
    it('サロゲートペア文字列のみで構成されるテキストに対するゼロ幅マッチ (/(?=)/gu) で無限ループせず各文字境界で停止すること', () => {
      // 🍣 (U+1F363, length 2 in UTF-16), 🍺 (U+1F37A, length 2), 🚀 (U+1F680, length 2)
      const astralText = '🍣🍺🚀'; // length 6 in UTF-16 code units, 3 code points
      const result = executeRegex('(?=)', 'gu', astralText);

      expect(result.error).toBeNull();
      // Code points: 0 (before 🍣), 2 (before 🍺), 4 (before 🚀), 6 (after 🚀)
      expect(result.matchCount).toBeGreaterThanOrEqual(3);
      const reconstructed = result.segments.map(s => s.text).join('');
      expect(reconstructed).toBe(astralText);
    });

    it('u フラグなしでサロゲートペアを走査した場合でも無限ループやクラッシュが発生しないこと', () => {
      const astralText = '𠮷野家';
      const result = executeRegex('(?=)', 'g', astralText);
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(true);
      const reconstructed = result.segments.map(s => s.text).join('');
      expect(reconstructed).toBe(astralText);
    });

    it('サロゲートペアの途中インデックスにマッチする正規表現でもセグメント復元が維持されること', () => {
      const text = 'A🍣B';
      const result = executeRegex('[A-Z]|🍣', 'gu', text);
      expect(result.matchCount).toBe(3);
      expect(result.matches.map(m => m.matchedText)).toEqual(['A', '🍣', 'B']);
      const reconstructed = result.segments.map(s => s.text).join('');
      expect(reconstructed).toBe(text);
    });
  });

  // =========================================================================
  // 3. Sticky Flag (y) & Complex Lookaround Combinations
  // =========================================================================
  describe('3. Sticky Flag (y) & Complex Lookaround Combinations', () => {
    it('y フラグ単体で先頭以外にマッチ対象がある場合、マッチ件数 0 となること', () => {
      const text = 'prefix 123 suffix';
      const result = executeRegex('\\d+', 'y', text);
      expect(result.hasMatch).toBe(false);
      expect(result.matchCount).toBe(0);
      expect(result.segments).toEqual([{ text, isMatch: false }]);
    });

    it('y + g 複合フラグでの連続マッチ動作', () => {
      const text = '123456abc';
      const result = executeRegex('\\d{3}', 'gy', text);
      expect(result.matchCount).toBe(2);
      expect(result.matches[0].matchedText).toBe('123');
      expect(result.matches[1].matchedText).toBe('456');
    });

    it('複雑な多重後読み・先読みのネスト構文', () => {
      const text = 'foo_123_bar and baz_456_qux';
      const pattern = '(?<=[a-z]{3}_)\\d+(?=_[a-z]{3})';
      const result = executeRegex(pattern, 'g', text);
      expect(result.matchCount).toBe(2);
      expect(result.matches[0].matchedText).toBe('123');
      expect(result.matches[1].matchedText).toBe('456');
      const reconstructed = result.segments.map(s => s.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('グループ名抽出器 (getGroupNames) が複雑なエスケープ・文字クラス・後読み混在パターンを正確に解析すること', () => {
      const pattern = '(?<=foo\\[\\(bar\\])(?<named>[a-z]+)(?:ignore)(\\d+)(?=(\\w+))';
      const groupNames = getGroupNames(pattern);
      expect(groupNames).toEqual(['named', '$2', '$3']);
    });
  });

  // =========================================================================
  // 4. Truncation Boundary & Max Matches Limits
  // =========================================================================
  describe('4. Truncation Boundary & Max Matches Limits', () => {
    it('maxMatches = 1 の場合、1件のみ抽出され isTruncated: true となること', () => {
      const result = executeRegex('a', 'g', 'aaaa', 1);
      expect(result.matchCount).toBe(1);
      expect(result.isTruncated).toBe(true);
      expect(result.matches).toHaveLength(1);
    });

    it('マッチ数がちょうど maxMatches と同数の場合、isTruncated: true となること', () => {
      const result = executeRegex('a', 'g', 'aaa', 3);
      expect(result.matchCount).toBe(3);
      expect(result.isTruncated).toBe(true);
    });

    it('マッチ数が maxMatches 未満の場合、isTruncated: false となること', () => {
      const result = executeRegex('a', 'g', 'aa', 3);
      expect(result.matchCount).toBe(2);
      expect(result.isTruncated).toBe(false);
    });

    it('maxMatches = 0 の境界値において、ループ後判定により1件で打ち切られること（境界挙動の検証）', () => {
      const result = executeRegex('a', 'g', 'aaaa', 0);
      expect(result.matchCount).toBe(1);
      expect(result.isTruncated).toBe(true);
    });
  });

  // =========================================================================
  // 5. Preset Templates Comprehensive Integrity
  // =========================================================================
  describe('5. Preset Templates Comprehensive Integrity', () => {
    it('定義された全10種類のプリセットテンプレートが全て構文エラーなしでコンパイルでき、自身の sampleText にマッチすること', () => {
      expect(PRESET_TEMPLATES).toHaveLength(10);

      for (const template of PRESET_TEMPLATES) {
        expect(template.id).toBeTruthy();
        expect(template.pattern).toBeTruthy();
        expect(template.sampleText).toBeTruthy();

        const result = executeRegex(template.pattern, template.flags, template.sampleText);
        expect(result.error, `Template ${template.id} syntax error: ${result.error}`).toBeNull();
        expect(result.hasMatch, `Template ${template.id} should match its sampleText`).toBe(true);
        expect(result.matchCount, `Template ${template.id} should have matches`).toBeGreaterThan(0);

        const reconstructed = result.segments.map(s => s.text).join('');
        expect(reconstructed, `Template ${template.id} segment invariant`).toBe(template.sampleText);
      }
    });
  });

  // =========================================================================
  // 6. Property-Based Adversarial Fuzzing (2,000 Randomized Invariant Checks)
  // =========================================================================
  describe('6. Property-Based Adversarial Fuzzing (2,000 Random Runs)', () => {
    const chars = 'abcdef012345 \n\r\t!@#$%^&*()_+-=[]{}|;:\'",.<>?/🍣🍺𠮷日本語';

    function randomString(minLen: number, maxLen: number): string {
      const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
      let res = '';
      for (let i = 0; i < len; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
      }
      return res;
    }

    const randomPatterns = [
      '',
      'a',
      '\\d+',
      '[a-z]+',
      '\\s+',
      '(?=a)',
      '^',
      '$',
      '(?:)',
      '(?<foo>[a-z]+)?',
      '([0-9]+)-([a-z]+)',
      '\\p{Emoji}',
      '🍣',
      '(a|b|c)+',
      '[^\\s]+',
      '\\b\\w+\\b',
      '<!--.*?-->',
      '[\\u4e00-\\u9faf]+',
      '([a-z])\\1',
      '(?<word>\\w+)\\s+\\k<word>',
    ];

    const flagCombinations = [
      'g',
      'gi',
      'gm',
      'gs',
      'gu',
      'gy',
      'gimsuy',
      '',
      'i',
      'm',
      'u',
    ];

    it('2,000回のランダムパターン・テキスト・フラグ組合せですべての数学的不変条件（Invariants）が100%成立すること', () => {
      for (let i = 0; i < 2000; i++) {
        const pattern = randomPatterns[i % randomPatterns.length];
        const flags = flagCombinations[i % flagCombinations.length];
        const text = randomString(0, 150);

        let result: RegexResult;
        try {
          result = executeRegex(pattern, flags, text);
        } catch (err) {
          throw new Error(`executeRegex threw unexpected exception on pattern="${pattern}", flags="${flags}": ${err}`);
        }

        // Invariant 1: Result is well-formed
        expect(typeof result.hasMatch).toBe('boolean');
        expect(typeof result.matchCount).toBe('number');
        expect(Array.isArray(result.matches)).toBe(true);
        expect(Array.isArray(result.segments)).toBe(true);
        expect(typeof result.executionTimeMs).toBe('number');
        expect(Number.isFinite(result.executionTimeMs)).toBe(true);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);

        if (result.error === null && text.length > 0) {
          // Invariant 2: Highlight segments reconstruct the original text 100%
          const reconstructed = result.segments.map(s => s.text).join('');
          expect(reconstructed).toBe(text);

          // Invariant 3: Match ranges match matchedText
          for (const m of result.matches) {
            expect(text.slice(m.startIndex, m.endIndex)).toBe(m.matchedText);
            expect(m.startIndex).toBeLessThanOrEqual(m.endIndex);
            expect(m.startIndex).toBeGreaterThanOrEqual(0);
            expect(m.endIndex).toBeLessThanOrEqual(text.length);
          }

          // Invariant 4: matchCount equals matches.length
          expect(result.matchCount).toBe(result.matches.length);
        }
      }
    });
  });
});
