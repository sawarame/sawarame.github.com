import { describe, it, expect } from 'vitest';
import {
  executeRegex,
  flagsToString,
  stringToFlags,
  getGroupNames,
  buildHighlightSegments,
  type RegexFlags,
  type RegexResult,
} from './index';

describe('RegexChecker Pure Logic Suite', () => {
  // =========================================================================
  // 1. Helper Functions (flagsToString / stringToFlags / getGroupNames)
  // =========================================================================
  describe('Helper Functions', () => {
    describe('flagsToString', () => {
      it('すべてのフラグがfalseの場合は空文字列を返すこと', () => {
        const flags: RegexFlags = { g: false, i: false, m: false, s: false, u: false, y: false };
        expect(flagsToString(flags)).toBe('');
      });

      it('指定されたフラグのみを順序正しく結合して文字列として返すこと', () => {
        const flags: RegexFlags = { g: true, i: true, m: false, s: true, u: false, y: false };
        const result = flagsToString(flags);
        expect(result).toBe('gis');
      });

      it('すべてのフラグがtrueの場合は全てのフラグ文字（"gimsuy"）を返すこと', () => {
        const flags: RegexFlags = { g: true, i: true, m: true, s: true, u: true, y: true };
        expect(flagsToString(flags)).toBe('gimsuy');
      });
    });

    describe('stringToFlags', () => {
      it('空文字列の場合はすべてfalseのオブジェクトを返すこと', () => {
        expect(stringToFlags('')).toEqual({
          g: false,
          i: false,
          m: false,
          s: false,
          u: false,
          y: false,
        });
      });

      it('有効なフラグ文字列を正しくパースすること', () => {
        expect(stringToFlags('gim')).toEqual({
          g: true,
          i: true,
          m: true,
          s: false,
          u: false,
          y: false,
        });
      });

      it('大文字・小文字混在、重複フラグ、未知の文字が含まれていても安全に処理すること', () => {
        const parsed = stringToFlags('GGIxZ1!u');
        expect(parsed).toEqual({
          g: true,
          i: true,
          m: false,
          s: false,
          u: true,
          y: false,
        });
      });
    });

    describe('getGroupNames', () => {
      it('通常の番号付きキャプチャグループから連番の名前を抽出すること', () => {
        expect(getGroupNames('(\\w+)-(\\d+)')).toEqual(['$1', '$2']);
      });

      it('名前付きキャプチャグループの名前を正確に抽出すること', () => {
        expect(getGroupNames('(?<year>\\d{4})-(?<month>\\d{2})')).toEqual(['year', 'month']);
      });

      it('非キャプチャグループ (?:...) や先読み・後読みを除外すること', () => {
        const pattern = '(?<=start\\s+)(?:https?://)?(?<domain>[a-z.]+)(?=\\s+end)';
        expect(getGroupNames(pattern)).toEqual(['domain']);
      });
    });

    describe('相互変換（Round-trip）', () => {
      it('stringToFlags と flagsToString で相互変換の一貫性が保たれること', () => {
        const initialStr = 'gimsuy';
        const flags = stringToFlags(initialStr);
        const reconstructed = flagsToString(flags);
        expect(reconstructed).toBe(initialStr);
        expect(stringToFlags(reconstructed)).toEqual(flags);
      });
    });
  });

  // =========================================================================
  // 2. Basic Matching & Flags (g, i, m, s, u, y)
  // =========================================================================
  describe('Basic Matching & Flags', () => {
    it('マッチしない場合は hasMatch: false, matchCount: 0, matches: [] を返すこと', () => {
      const result: RegexResult = executeRegex('xyz', 'g', 'Hello World');
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(false);
      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
      expect(result.segments).toEqual([
        { text: 'Hello World', isMatch: false },
      ]);
    });

    it('空の正規表現パターンの場合、エラーにならず安全に初期状態を返すこと', () => {
      const result: RegexResult = executeRegex('', 'g', 'Hello');
      expect(result.error).toBeNull();
      expect(result.hasMatch).toBe(false);
      expect(result.matchCount).toBe(0);
      expect(result.matches).toEqual([]);
      expect(result.segments).toEqual([{ text: 'Hello', isMatch: false }]);
    });

    it('gフラグなしの場合、最初の一致のみを検出すること', () => {
      const result: RegexResult = executeRegex('foo', '', 'foo bar foo');
      expect(result.hasMatch).toBe(true);
      expect(result.matchCount).toBe(1);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].startIndex).toBe(0);
      expect(result.matches[0].endIndex).toBe(3);
      expect(result.matches[0].matchedText).toBe('foo');
    });

    it('gフラグありの場合、すべての一致を検出すること', () => {
      const result: RegexResult = executeRegex('foo', 'g', 'foo bar foo baz foo');
      expect(result.matchCount).toBe(3);
      expect(result.matches).toHaveLength(3);
      expect(result.matches[0].startIndex).toBe(0);
      expect(result.matches[1].startIndex).toBe(8);
      expect(result.matches[2].startIndex).toBe(16);
    });

    it('iフラグ（大文字小文字無視）が正しく機能すること', () => {
      const result: RegexResult = executeRegex('react', 'gi', 'React react REACT');
      expect(result.matchCount).toBe(3);
      expect(result.matches.map(m => m.matchedText)).toEqual(['React', 'react', 'REACT']);
    });

    it('mフラグ（複数行モード）で行頭^と行末$が各行でマッチすること', () => {
      const text = 'alpha\nbeta\ngamma';
      const result: RegexResult = executeRegex('^[a-z]+$', 'gm', text);
      expect(result.matchCount).toBe(3);
      expect(result.matches.map(m => m.matchedText)).toEqual(['alpha', 'beta', 'gamma']);
    });

    it('sフラグ（dotAll）でドットが改行文字にマッチすること', () => {
      const text = 'foo\nbar';
      const noS = executeRegex('foo.bar', 'g', text);
      expect(noS.hasMatch).toBe(false);

      const withS = executeRegex('foo.bar', 'gs', text);
      expect(withS.hasMatch).toBe(true);
      expect(withS.matches[0].matchedText).toBe('foo\nbar');
    });

    it('uフラグ（Unicode）で絵文字やサロゲートペアが正しくマッチすること', () => {
      const text = 'Hello 🚀 World 𠮷野家';
      const result: RegexResult = executeRegex('\\p{Emoji}', 'gu', text);
      expect(result.hasMatch).toBe(true);
      expect(result.matches[0].matchedText).toBe('🚀');
    });

    it('yフラグ（Sticky）でlastIndexの位置からのみマッチすること', () => {
      const result: RegexResult = executeRegex('\\d+', 'y', '123 abc 456');
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].matchedText).toBe('123');
      expect(result.matches[0].startIndex).toBe(0);
    });

    it('flags引数にRegexFlagsオブジェクトを渡しても正しく動作すること', () => {
      const flagsObj: RegexFlags = { g: true, i: true, m: false, s: false, u: false, y: false };
      const result: RegexResult = executeRegex('test', flagsObj, 'TEST test');
      expect(result.matchCount).toBe(2);
    });
  });

  // =========================================================================
  // 3. Capture Groups Extraction
  // =========================================================================
  describe('Capture Groups Extraction', () => {
    it('番号付きキャプチャグループ ($1, $2...) を正しく抽出すること', () => {
      const result: RegexResult = executeRegex('(\\w+)-(\\d+)', 'g', 'user-101 admin-202');
      expect(result.matchCount).toBe(2);

      // Match 1
      expect(result.matches[0].matchedText).toBe('user-101');
      expect(result.matches[0].groups).toEqual([
        { name: '$1', value: 'user', startIndex: 0, endIndex: 4 },
        { name: '$2', value: '101', startIndex: 5, endIndex: 8 },
      ]);

      // Match 2
      expect(result.matches[1].matchedText).toBe('admin-202');
      expect(result.matches[1].groups).toEqual([
        { name: '$1', value: 'admin', startIndex: 9, endIndex: 14 },
        { name: '$2', value: '202', startIndex: 15, endIndex: 18 },
      ]);
    });

    it('名前付きキャプチャグループ (?<name>...) を正しく抽出し namedGroups に格納すること', () => {
      const result: RegexResult = executeRegex(
        '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
        'g',
        'Date: 2026-08-22'
      );
      expect(result.matchCount).toBe(1);
      const match = result.matches[0];
      expect(match.namedGroups).toEqual({
        year: '2026',
        month: '08',
        day: '22',
      });
      expect(match.groups).toEqual([
        { name: 'year', value: '2026', startIndex: 6, endIndex: 10 },
        { name: 'month', value: '08', startIndex: 11, endIndex: 13 },
        { name: 'day', value: '22', startIndex: 14, endIndex: 16 },
      ]);
    });

    it('ネストされたキャプチャグループの順序と値を正しく抽出すること', () => {
      const result: RegexResult = executeRegex('((a)(b))', 'g', 'ab');
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].groups).toEqual([
        { name: '$1', value: 'ab', startIndex: 0, endIndex: 2 },
        { name: '$2', value: 'a', startIndex: 0, endIndex: 1 },
        { name: '$3', value: 'b', startIndex: 1, endIndex: 2 },
      ]);
    });

    it('マッチしなかった省略可能グループ（optional group）で undefined を安全に保持すること', () => {
      const result: RegexResult = executeRegex('(foo)?(bar)', 'g', 'bar');
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].groups).toEqual([
        { name: '$1', value: undefined, startIndex: undefined, endIndex: undefined },
        { name: '$2', value: 'bar', startIndex: 0, endIndex: 3 },
      ]);
    });

    it('非キャプチャグループ (?:...) は groups 配列に含まれないこと', () => {
      const result: RegexResult = executeRegex('(?:https?://)?([a-z0-9.-]+)', 'g', 'https://sawara.me');
      expect(result.matchCount).toBe(1);
      expect(result.matches[0].groups).toEqual([
        { name: '$1', value: 'sawara.me', startIndex: 8, endIndex: 17 },
      ]);
    });
  });

  // =========================================================================
  // 4. Highlight Segmentation
  // =========================================================================
  describe('Highlight Segmentation', () => {
    it('空テキストの場合は空セグメント配列を返すこと', () => {
      const result: RegexResult = executeRegex('abc', 'g', '');
      expect(result.segments).toEqual([{ text: '', isMatch: false }]);
      expect(buildHighlightSegments('', [])).toEqual([]);
    });

    it('マッチがない場合、テキスト全体が単一の isMatch: false セグメントになること', () => {
      const text = 'Hello World';
      const result: RegexResult = executeRegex('xyz', 'g', text);
      expect(result.segments).toEqual([
        { text: 'Hello World', isMatch: false },
      ]);
    });

    it('テキスト全体が完全にマッチする場合、単一の isMatch: true セグメントになること', () => {
      const text = 'hello';
      const result: RegexResult = executeRegex('hello', 'g', text);
      expect(result.segments).toHaveLength(1);
      expect(result.segments[0]).toMatchObject({
        text: 'hello',
        isMatch: true,
        matchNumber: 1,
      });
    });

    it('先頭・中間・末尾のマッチで隙間なく正しくセグメント分割されること', () => {
      const text = 'prefix [MATCH] suffix';
      const result: RegexResult = executeRegex('\\[MATCH\\]', 'g', text);
      expect(result.segments).toEqual([
        { text: 'prefix ', isMatch: false },
        {
          text: '[MATCH]',
          isMatch: true,
          matchNumber: 1,
          matchItem: expect.objectContaining({ matchedText: '[MATCH]' }),
        },
        { text: ' suffix', isMatch: false },
      ]);
    });

    it('複数のマッチと隙間（ギャップ）が交互に正しく分割されること', () => {
      const text = 'A 1 B 2 C';
      const result: RegexResult = executeRegex('\\d', 'g', text);
      expect(result.segments).toHaveLength(5);
      expect(result.segments.map(s => ({ text: s.text, isMatch: s.isMatch }))).toEqual([
        { text: 'A ', isMatch: false },
        { text: '1', isMatch: true },
        { text: ' B ', isMatch: false },
        { text: '2', isMatch: true },
        { text: ' C', isMatch: false },
      ]);
    });

    it('隣接する連続マッチ（隙間なし）で空の非マッチセグメントが生成されないこと', () => {
      const text = '1234';
      const result: RegexResult = executeRegex('\\d', 'g', text);
      expect(result.segments).toHaveLength(4);
      result.segments.forEach((seg, idx) => {
        expect(seg.isMatch).toBe(true);
        expect(seg.text).toBe(String(idx + 1));
        expect(seg.matchNumber).toBe(idx + 1);
      });
    });

    it('【不変条件】すべてのセグメントの text を結合すると元の text と完全に一致すること', () => {
      const testCases = [
        { text: 'abc 123 def 456 ghi', pattern: '\\d+' },
        { text: 'repeated repeated repeated', pattern: 'repeated' },
        { text: 'no matches here at all', pattern: '[0-9]+' },
        { text: '日本語テキストの中の漢字とひらがな', pattern: '[\\u4e00-\\u9faf]+' },
        { text: 'line1\nline2\nline3\n', pattern: '^line' },
        { text: 'Hello 🚀 World 𠮷野家', pattern: '\\p{Emoji}' },
      ];

      for (const { text, pattern } of testCases) {
        const result: RegexResult = executeRegex(pattern, 'gmu', text);
        const reconstructed = result.segments.map(s => s.text).join('');
        expect(reconstructed).toBe(text);
      }
    });
  });

  // =========================================================================
  // 5. Error Handling & Invalid Patterns
  // =========================================================================
  describe('Error Handling & Invalid Patterns', () => {
    it('閉じられていない文字クラス ([a-z) でクラッシュせず error を返すこと', () => {
      const result: RegexResult = executeRegex('[a-z', 'g', 'abc');
      expect(result.error).not.toBeNull();
      expect(typeof result.error).toBe('string');
      expect(result.hasMatch).toBe(false);
      expect(result.matches).toEqual([]);
      expect(result.segments).toEqual([{ text: 'abc', isMatch: false }]);
    });

    it('閉じられていない丸括弧 ((abc) で構文エラーメッセージを返すこと', () => {
      const result: RegexResult = executeRegex('(abc', 'g', 'abc');
      expect(result.error).not.toBeNull();
      expect(result.hasMatch).toBe(false);
    });

    it('不正な量指定子 (+ または {5,2}) で構文エラーを検出し安全に返却すること', () => {
      const result1: RegexResult = executeRegex('+abc', 'g', 'abc');
      expect(result1.error).not.toBeNull();

      const result2: RegexResult = executeRegex('a{5,2}', 'g', 'aaaa');
      expect(result2.error).not.toBeNull();
    });

    it('末尾の単独バックスラッシュ (\\) でエラーを安全に捕捉すること', () => {
      const result: RegexResult = executeRegex('\\', 'g', 'abc');
      expect(result.error).not.toBeNull();
      expect(result.matches).toEqual([]);
    });

    it('不正な名前付きグループ構文 (?<123>test) でエラーを安全に捕捉すること', () => {
      const result: RegexResult = executeRegex('(?<123>test)', 'g', 'test');
      expect(result.error).not.toBeNull();
    });
  });

  // =========================================================================
  // 6. Safety, Performance & ReDoS Guards
  // =========================================================================
  describe('Safety, Performance & ReDoS Guards', () => {
    it('ゼロ幅マッチ (/(?=a)/g) で無限ループにならず安全に終了すること', () => {
      const startTime = performance.now();
      const result: RegexResult = executeRegex('(?=a)', 'g', 'aaa');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(200);
      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(3);
      expect(result.matches[0].startIndex).toBe(0);
      expect(result.matches[1].startIndex).toBe(1);
      expect(result.matches[2].startIndex).toBe(2);
    });

    it('行頭ゼロ幅マッチ (/^/gm) で無限ループにならず行数分のマッチを返すこと', () => {
      const text = 'first\nsecond\nthird';
      const result: RegexResult = executeRegex('^', 'gm', text);
      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(3);
    });

    it('マッチ上限数（デフォルト1000件）を超えた場合に isTruncated: true となること', () => {
      const hugeText = 'a'.repeat(3000);
      const result: RegexResult = executeRegex('a', 'g', hugeText);
      expect(result.error).toBeNull();
      expect(result.matchCount).toBe(1000);
      expect(result.matches).toHaveLength(1000);
      expect(result.isTruncated).toBe(true);
    });

    it('カスタム maxMatches 引数を指定した場合、その上限で切り詰められること', () => {
      const result: RegexResult = executeRegex('\\d', 'g', '1234567890', 5);
      expect(result.matchCount).toBe(5);
      expect(result.matches).toHaveLength(5);
      expect(result.isTruncated).toBe(true);
    });

    it('上限未満のマッチ数の場合は isTruncated: false であること', () => {
      const result: RegexResult = executeRegex('\\d+', 'g', '10 20 30');
      expect(result.matchCount).toBe(3);
      expect(result.isTruncated).toBe(false);
    });

    it('実行時間（executionTimeMs）が0以上の数値として記録されること', () => {
      const result: RegexResult = executeRegex('test', 'g', 'test string');
      expect(typeof result.executionTimeMs).toBe('number');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
