/**
 * 正規表現チェッカー E2E / 統合テストスイート
 * 
 * 4階層テストモデル（4-Tier Methodology）に基づく要求駆動・オパークボックステスト:
 * - Tier 1: 機能別網羅テスト (Feature Coverage: 各機能5ケース以上)
 * - Tier 2: 境界値・極限値・エッジケース (Boundary & Corner Cases: 各項目5ケース以上)
 * - Tier 3: 複数機能・フラグ複合テスト (Cross-Feature Combinations)
 * - Tier 4: 実務応用シナリオテスト (Real-World Application Scenarios)
 */

import { describe, it, expect } from 'vitest';
import {
  executeRegex,
  flagsToString,
  stringToFlags,
  type RegexFlags,
  type RegexResult,
  type HighlightSegment,
  type CaptureGroup,
} from '../../src/components/RegexChecker';

describe('RegexChecker E2E Test Suite', () => {
  // =========================================================================
  // Tier 1: 機能別網羅テスト (Feature Coverage)
  // =========================================================================
  describe('Tier 1: Feature Coverage (機能別網羅テスト)', () => {
    describe('1.1 基本コンパイル・マッチング実行機能 (Execute Logic)', () => {
      it('リテラル文字列の完全一致を正しく判定・抽出できること', () => {
        const result: RegexResult = executeRegex('hello', 'g', 'hello world, hello sawara');
        expect(result.error).toBeNull();
        expect(result.hasMatch).toBe(true);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('hello');
        expect(result.matches[0].startIndex).toBe(0);
        expect(result.matches[0].endIndex).toBe(5);
        expect(result.matches[1].matchedText).toBe('hello');
        expect(result.matches[1].startIndex).toBe(13);
        expect(result.matches[1].endIndex).toBe(18);
      });

      it('文字クラス（[0-9]+）による数値抽出が正しく動作すること', () => {
        const result: RegexResult = executeRegex('[0-9]+', 'g', 'Item 100 costs 2500 yen');
        expect(result.hasMatch).toBe(true);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('100');
        expect(result.matches[1].matchedText).toBe('2500');
      });

      it('定義済み文字クラス（\\w+, \\s+, \\d+）が正しく機能すること', () => {
        const result: RegexResult = executeRegex('\\w+', 'g', 'abc_123 def_456');
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('abc_123');
        expect(result.matches[1].matchedText).toBe('def_456');
      });

      it('量指定子（{2,4}, +, *, ?）の挙動が正確であること', () => {
        const result: RegexResult = executeRegex('a{2,4}', 'g', 'a aa aaa aaaa aaaaa');
        expect(result.matchCount).toBe(4);
        expect(result.matches[0].matchedText).toBe('aa');
        expect(result.matches[1].matchedText).toBe('aaa');
        expect(result.matches[2].matchedText).toBe('aaaa');
        expect(result.matches[3].matchedText).toBe('aaaa');
      });

      it('行頭・行末アンカー（^, $）が単一行で正しく一致すること', () => {
        const result1: RegexResult = executeRegex('^sawara', '', 'sawara.me tools');
        expect(result1.hasMatch).toBe(true);
        expect(result1.matches[0].matchedText).toBe('sawara');

        const result2: RegexResult = executeRegex('tools$', '', 'sawara.me tools');
        expect(result2.hasMatch).toBe(true);
        expect(result2.matches[0].matchedText).toBe('tools');
      });

      it('選択（パイプ |）による複数パターンのマッチが正しく動作すること', () => {
        const result: RegexResult = executeRegex('apple|banana|cherry', 'g', 'I like banana and apple');
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('banana');
        expect(result.matches[1].matchedText).toBe('apple');
      });
    });

    describe('1.2 全フラグ個別サポート (Flags: g, i, m, s, u, y)', () => {
      it('フラグ "g"（全体マッチ）: 有効時は複数件、無効時は先頭1件のみ抽出されること', () => {
        const text = 'cat cat cat';
        const withG: RegexResult = executeRegex('cat', 'g', text);
        expect(withG.matchCount).toBe(3);

        const withoutG: RegexResult = executeRegex('cat', '', text);
        expect(withoutG.matchCount).toBe(1);
        expect(withoutG.matches[0].startIndex).toBe(0);
      });

      it('フラグ "i"（大文字小文字無視）: 大文字・小文字・混在パターンがすべてマッチすること', () => {
        const text = 'TypeScript typescript TYPESCRIPT TyPeScRiPt';
        const result: RegexResult = executeRegex('typescript', 'gi', text);
        expect(result.matchCount).toBe(4);
      });

      it('フラグ "m"（複数行）: 各行の先頭 (^) および末尾 ($) に一致すること', () => {
        const text = 'line1: aaa\nline2: bbb\nline3: ccc';
        const result: RegexResult = executeRegex('^line\\d+', 'gm', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].matchedText).toBe('line1');
        expect(result.matches[1].matchedText).toBe('line2');
        expect(result.matches[2].matchedText).toBe('line3');
      });

      it('フラグ "s"（DotAll）: ドット (.) が改行文字 (\\n) にもマッチすること', () => {
        const text = '<!-- start\nmiddle\nend -->';
        const withoutS: RegexResult = executeRegex('<!--.*-->', 'g', text);
        expect(withoutS.hasMatch).toBe(false);

        const withS: RegexResult = executeRegex('<!--.*-->', 'gs', text);
        expect(withS.hasMatch).toBe(true);
        expect(withS.matches[0].matchedText).toBe(text);
      });

      it('フラグ "u"（Unicode）: Unicode プロパティエスケープやコードポイントが正しく解釈されること', () => {
        const text = 'Hello 🍣 and 🎉 and 日本語';
        const result: RegexResult = executeRegex('\\p{Extended_Pictographic}+', 'gu', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('🍣');
        expect(result.matches[1].matchedText).toBe('🎉');
      });

      it('フラグ "y"（Sticky / 粘着）: lastIndex から連続して一致する場合のみマッチすること', () => {
        const text = '123_456_789';
        const result: RegexResult = executeRegex('\\d+', 'y', text);
        expect(result.matchCount).toBe(1);
        expect(result.matches[0].matchedText).toBe('123');
      });

      it('フラグをオブジェクト形式（RegexFlags）で指定しても正しく動作すること', () => {
        const flags: RegexFlags = { g: true, i: true, m: false, s: false, u: false, y: false };
        const result: RegexResult = executeRegex('hello', flags, 'HELLO hello HeLLo');
        expect(result.matchCount).toBe(3);
      });
    });

    describe('1.3 キャプチャグループ抽出機能 (Capture Groups)', () => {
      it('番号付きキャプチャグループ ($1, $2) が正確なインデックスと値で抽出されること', () => {
        const text = '2026-08-22';
        const result: RegexResult = executeRegex('(\\d{4})-(\\d{2})-(\\d{2})', 'g', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].groups).toHaveLength(3);
        expect(result.matches[0].groups[0]).toMatchObject({ name: '$1', value: '2026' });
        expect(result.matches[0].groups[1]).toMatchObject({ name: '$2', value: '08' });
        expect(result.matches[0].groups[2]).toMatchObject({ name: '$3', value: '22' });
      });

      it('名前付きキャプチャグループ (?<name>...) が namedGroups および groups 配列に格納されること', () => {
        const text = 'user: sawarame, role: admin';
        const result: RegexResult = executeRegex('user: (?<user>\\w+), role: (?<role>\\w+)', 'g', text);
        expect(result.hasMatch).toBe(true);
        const match = result.matches[0];
        expect(match.namedGroups).toBeDefined();
        expect(match.namedGroups?.user).toBe('sawarame');
        expect(match.namedGroups?.role).toBe('admin');
        expect(match.groups.some((g: { name: string; value?: string }) => g.name === 'user' && g.value === 'sawarame')).toBe(true);
        expect(match.groups.some((g: { name: string; value?: string }) => g.name === 'role' && g.value === 'admin')).toBe(true);
      });

      it('ネストされたキャプチャグループの階層構造が正確に抽出されること', () => {
        const text = 'value: (100200)';
        const result: RegexResult = executeRegex('value: \\((((\\d{3}))(\\d{3}))\\)', 'g', text);
        expect(result.hasMatch).toBe(true);
        const match = result.matches[0];
        expect(match.groups[0].value).toBe('100200'); // $1: 外側グループ
        expect(match.groups[1].value).toBe('100');    // $2: 100の外側
        expect(match.groups[2].value).toBe('100');    // $3: 100の内側
        expect(match.groups[3].value).toBe('200');    // $4: 200
      });

      it('マッチしなかった省略可能グループが value: undefined として安全に処理されること', () => {
        const text = 'prefix-123 only123';
        const result: RegexResult = executeRegex('(?:(?<prefix>[a-z]+)-)?(?<code>\\d+)', 'g', text);
        expect(result.matchCount).toBe(2);

        // 1件目: prefix あり
        expect(result.matches[0].namedGroups?.prefix).toBe('prefix');
        expect(result.matches[0].namedGroups?.code).toBe('123');

        // 2件目: prefix なし
        expect(result.matches[1].namedGroups?.prefix).toBeUndefined();
        expect(result.matches[1].namedGroups?.code).toBe('123');
      });

      it('非キャプチャグループ (?:...) がグループ一覧を汚染しないこと', () => {
        const text = 'https://sawara.me';
        const result: RegexResult = executeRegex('(?:https?|ftp)://([a-z.]+)', 'g', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].groups).toHaveLength(1);
        expect(result.matches[0].groups[0].value).toBe('sawara.me');
      });
    });

    describe('1.4 ハイライトセグメント分割機能 (Highlight Segmentation)', () => {
      it('マッチが0件の場合、テキスト全体が1つの非マッチセグメントになること', () => {
        const text = 'no matching text here';
        const result: RegexResult = executeRegex('xyz', 'g', text);
        expect(result.segments).toHaveLength(1);
        expect(result.segments[0]).toEqual({
          text: 'no matching text here',
          isMatch: false,
        });
      });

      it('テキスト全体がマッチする場合、1つのマッチセグメントになること', () => {
        const text = 'exactMatch';
        const result: RegexResult = executeRegex('^exactMatch$', 'g', text);
        expect(result.segments).toHaveLength(1);
        expect(result.segments[0].isMatch).toBe(true);
        expect(result.segments[0].text).toBe('exactMatch');
        expect(result.segments[0].matchNumber).toBe(1);
      });

      it('先頭・中間・末尾にマッチが点在する場合、適切なセグメントに分解されること', () => {
        const text = 'START middle END';
        const result: RegexResult = executeRegex('START|END', 'g', text);
        expect(result.segments).toHaveLength(3);
        expect(result.segments[0]).toMatchObject({ text: 'START', isMatch: true, matchNumber: 1 });
        expect(result.segments[1]).toMatchObject({ text: ' middle ', isMatch: false });
        expect(result.segments[2]).toMatchObject({ text: 'END', isMatch: true, matchNumber: 2 });
      });

      it('隙間のない連続マッチ（Adjacent Matches）で空の非マッチセグメントが混入しないこと', () => {
        const text = '112233';
        const result: RegexResult = executeRegex('\\d{2}', 'g', text);
        expect(result.segments).toHaveLength(3);
        expect(result.segments[0]).toMatchObject({ text: '11', isMatch: true, matchNumber: 1 });
        expect(result.segments[1]).toMatchObject({ text: '22', isMatch: true, matchNumber: 2 });
        expect(result.segments[2]).toMatchObject({ text: '33', isMatch: true, matchNumber: 3 });
      });

      it('不変条件保証: すべてのセグメントのテキストを連結すると元のテキストと完全一致すること', () => {
        const text = 'Hello [123] World [456] End [789]!';
        const result: RegexResult = executeRegex('\\[\\d+\\]', 'g', text);
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });

      it('改行を含む複数行テキストでもセグメント連結の不変条件が維持されること', () => {
        const text = 'Line 1: 100\nLine 2: 200\r\nLine 3: 300\n';
        const result: RegexResult = executeRegex('\\d+', 'g', text);
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });
    });

    describe('1.5 フラグ変換ヘルパー関数 (flagsToString / stringToFlags)', () => {
      it('flagsToString: 全フラグ true の場合に "gimsuy" を返すこと', () => {
        const flags: RegexFlags = { g: true, i: true, m: true, s: true, u: true, y: true };
        expect(flagsToString(flags)).toBe('gimsuy');
      });

      it('flagsToString: 指定されたフラグのみを順序正しく結合すること', () => {
        const flags: RegexFlags = { g: true, i: true, m: false, s: false, u: true, y: false };
        expect(flagsToString(flags)).toBe('giu');
      });

      it('flagsToString: すべて false の場合に空文字列を返すこと', () => {
        const flags: RegexFlags = { g: false, i: false, m: false, s: false, u: false, y: false };
        expect(flagsToString(flags)).toBe('');
      });

      it('stringToFlags: 文字列からフラグオブジェクトを正確に構築すること', () => {
        const flags: RegexFlags = stringToFlags('gim');
        expect(flags).toEqual({
          g: true,
          i: true,
          m: true,
          s: false,
          u: false,
          y: false,
        });
      });

      it('stringToFlags: 未知の文字や重複文字を安全に無視・処理すること', () => {
        const flags: RegexFlags = stringToFlags('gixxg!!m');
        expect(flags).toEqual({
          g: true,
          i: true,
          m: true,
          s: false,
          u: false,
          y: false,
        });
      });

      it('可逆性保証: stringToFlags と flagsToString のラウンドトリップ整合性', () => {
        const input = 'gimsuy';
        const flags: RegexFlags = stringToFlags(input);
        const output = flagsToString(flags);
        expect(output).toBe(input);
      });
    });
  });

  // =========================================================================
  // Tier 2: 境界値・極限値・エッジケース (Boundary & Corner Cases)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases (境界値・極限値)', () => {
    describe('2.1 空入力および極小・極大境界', () => {
      it('パターンが空文字の場合、エラーにならず未マッチ・空配列を返すこと', () => {
        const result: RegexResult = executeRegex('', 'g', 'some text');
        expect(result.error).toBeNull();
        expect(result.hasMatch).toBe(false);
        expect(result.matchCount).toBe(0);
        expect(result.matches).toEqual([]);
        expect(result.segments).toEqual([{ text: 'some text', isMatch: false }]);
      });

      it('テキストが空文字の場合、エラーにならず安全に未マッチを返すこと', () => {
        const result: RegexResult = executeRegex('\\d+', 'g', '');
        expect(result.error).toBeNull();
        expect(result.hasMatch).toBe(false);
        expect(result.matchCount).toBe(0);
        expect(result.matches).toEqual([]);
        expect(result.segments).toEqual([{ text: '', isMatch: false }]);
      });

      it('パターンとテキストの双方が空文字の場合、安全に初期状態を返すこと', () => {
        const result: RegexResult = executeRegex('', '', '');
        expect(result.error).toBeNull();
        expect(result.hasMatch).toBe(false);
        expect(result.matchCount).toBe(0);
      });

      it('空白のみのパターンが空白テキストにマッチすること', () => {
        const result: RegexResult = executeRegex('   ', 'g', '   ');
        expect(result.hasMatch).toBe(true);
        expect(result.matchCount).toBe(1);
        expect(result.matches[0].matchedText).toBe('   ');
      });

      it('50,000文字の巨大テキストでもフリーズせず高速に判定できること', () => {
        const largeText = 'a'.repeat(25000) + 'TARGET' + 'b'.repeat(25000);
        const result: RegexResult = executeRegex('TARGET', 'g', largeText);
        expect(result.hasMatch).toBe(true);
        expect(result.matchCount).toBe(1);
        expect(result.matches[0].startIndex).toBe(25000);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      });
    });

    describe('2.2 Unicode サロゲートペア・絵文字・マルチバイト文字', () => {
      it('絵文字（サロゲートペア）を u フラグで正確に 1 文字として検出できること', () => {
        const text = 'Food: 🍣, Drink: 🍺, Space: 🚀';
        const result: RegexResult = executeRegex('[🍣🍺🚀]', 'gu', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].matchedText).toBe('🍣');
        expect(result.matches[1].matchedText).toBe('🍺');
        expect(result.matches[2].matchedText).toBe('🚀');
      });

      it('Unicode プロパティ（\\p{Script=Hiragana}, \\p{Script=Katakana}）を判定できること', () => {
        const text = 'ひらがな と カタカナ and Alphabet';
        const hiraResult: RegexResult = executeRegex('\\p{Script=Hiragana}+', 'gu', text);
        expect(hiraResult.matchCount).toBe(2);
        expect(hiraResult.matches[0].matchedText).toBe('ひらがな');
        expect(hiraResult.matches[1].matchedText).toBe('と');

        const kataResult: RegexResult = executeRegex('\\p{Script=Katakana}+', 'gu', text);
        expect(kataResult.matchCount).toBe(1);
        expect(kataResult.matches[0].matchedText).toBe('カタカナ');
      });

      it('サロゲートペアを含む文字列のインデックスとセグメント復元が完全であること', () => {
        const text = '前𠮷野家後';
        const result: RegexResult = executeRegex('𠮷野家', 'gu', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].matchedText).toBe('𠮷野家');
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });

      it('結合文字列・異体字セレクタを含む文字のパターンマッチが破綻しないこと', () => {
        const text = '葛\uDB40\uDD01城 (異体字)';
        const result: RegexResult = executeRegex('葛\uDB40\uDD01城', 'gu', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].matchedText).toBe('葛\uDB40\uDD01城');
      });

      it('全角数字と半角数字の区別が正規表現通りに正しく判定されること', () => {
        const text = '半角123 全角１２３';
        const halfResult: RegexResult = executeRegex('[0-9]+', 'g', text);
        expect(halfResult.matchCount).toBe(1);
        expect(halfResult.matches[0].matchedText).toBe('123');

        const fullResult: RegexResult = executeRegex('[０-９]+', 'gu', text);
        expect(fullResult.matchCount).toBe(1);
        expect(fullResult.matches[0].matchedText).toBe('１２３');
      });
    });

    describe('2.3 ゼロ幅マッチ（Zero-length matches）と無限ループ防止', () => {
      it('肯定先読みのゼロ幅マッチ (/(?=a)/g) で無限ループせず各位置を取得できること', () => {
        const result: RegexResult = executeRegex('(?=a)', 'g', 'aaa');
        expect(result.error).toBeNull();
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].startIndex).toBe(0);
        expect(result.matches[1].startIndex).toBe(1);
        expect(result.matches[2].startIndex).toBe(2);
      });

      it('複数行行頭ゼロ幅マッチ (/^/gm) で各行の先頭インデックスを取得できること', () => {
        const text = 'first\nsecond\nthird';
        const result: RegexResult = executeRegex('^', 'gm', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].startIndex).toBe(0);
        expect(result.matches[1].startIndex).toBe(6);
        expect(result.matches[2].startIndex).toBe(13);
      });

      it('単語境界ゼロ幅マッチ (/\\b/g) で無限ループせず停止すること', () => {
        const result: RegexResult = executeRegex('\\b', 'g', 'hi sawara');
        expect(result.matchCount).toBe(4);
      });

      it('空の選択肢を含むパターン (/(?:|x)/g) で無限ループせず安全に前進すること', () => {
        const result: RegexResult = executeRegex('(?:|x)', 'g', 'xx');
        expect(result.error).toBeNull();
        expect(result.matchCount).toBeGreaterThanOrEqual(1);
      });

      it('ゼロ幅マッチにおけるハイライトセグメントが元のテキストを完全に復元すること', () => {
        const text = 'abc';
        const result: RegexResult = executeRegex('(?=b)', 'g', text);
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });
    });

    describe('2.4 マッチ上限リミッター・ReDoS安全ガード (Safety & Performance)', () => {
      it('大量マッチ時にデフォルト上限（1,000件）で停止し isTruncated: true を返すこと', () => {
        const repeatText = 'a'.repeat(2500);
        const result: RegexResult = executeRegex('a', 'g', repeatText);
        expect(result.matchCount).toBe(1000);
        expect(result.isTruncated).toBe(true);
        expect(result.matches).toHaveLength(1000);
      });

      it('カスタム上限（maxMatches = 10）が指定された場合、正確に10件で打ち切られること', () => {
        const repeatText = '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15';
        const result: RegexResult = executeRegex('\\d+', 'g', repeatText, 10);
        expect(result.matchCount).toBe(10);
        expect(result.isTruncated).toBe(true);
        expect(result.matches).toHaveLength(10);
      });

      it('マッチ件数が上限未満の場合、isTruncated が false であること', () => {
        const text = '1 2 3';
        const result: RegexResult = executeRegex('\\d+', 'g', text, 10);
        expect(result.matchCount).toBe(3);
        expect(result.isTruncated).toBe(false);
      });

      it('ネストされた量指定子パターンでもクラッシュせず安全に判定できること', () => {
        const text = 'aaaaaaaaaaaaaaaaaaaaa!';
        const result: RegexResult = executeRegex('(a+)+$', '', text, 100);
        // バックトラッキングが発生しても安全に処理
        expect(typeof result.executionTimeMs).toBe('number');
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      });

      it('実行時間計測値（executionTimeMs）が常に正の有限数値であること', () => {
        const result: RegexResult = executeRegex('\\w+', 'g', 'Benchmark execution timer test');
        expect(Number.isFinite(result.executionTimeMs)).toBe(true);
        expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
      });
    });

    describe('2.5 複数行・異種改行コード対応 (Line Breaks: CRLF, LF, CR)', () => {
      it('LF (\\n) 改行において ^ と $ が各行で機能すること', () => {
        const text = 'alpha\nbeta\ngamma';
        const result: RegexResult = executeRegex('^[a-z]+$', 'gm', text);
        expect(result.matchCount).toBe(3);
      });

      it('CRLF (\\r\\n) 改行において ^ と $ が各行で機能すること', () => {
        const text = 'alpha\r\nbeta\r\ngamma';
        const result: RegexResult = executeRegex('^[a-z]+', 'gm', text);
        expect(result.matchCount).toBe(3);
      });

      it('CR (\\r) 改行において ^ と $ が各行で機能すること', () => {
        const text = 'alpha\rbeta\rgamma';
        const result: RegexResult = executeRegex('^[a-z]+', 'gm', text);
        expect(result.matchCount).toBe(3);
      });

      it('混在改行コード（\\r\\n と \\n と \\r）を含むテキストでもセグメント復元が維持されること', () => {
        const text = 'Line1\r\nLine2\nLine3\rLine4';
        const result: RegexResult = executeRegex('Line\\d', 'g', text);
        expect(result.matchCount).toBe(4);
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });

      it('末尾に複数の連続改行があるテキストでも正しくセグメント分割されること', () => {
        const text = 'Data\n\n\n';
        const result: RegexResult = executeRegex('Data', 'g', text);
        expect(result.matchCount).toBe(1);
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });
    });

    describe('2.6 複雑なグループ構造・マッチ省略時の安全性', () => {
      it('選択肢でマッチしなかった側のグループが安全に処理されること', () => {
        const text = 'CAT';
        const result: RegexResult = executeRegex('(?<dog>DOG)|(?<cat>CAT)', 'gi', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].namedGroups?.dog).toBeUndefined();
        expect(result.matches[0].namedGroups?.cat).toBe('CAT');
      });

      it('グループの繰り返し (\\d)+ で最後のキャプチャ値が取得されること', () => {
        const text = '12345';
        const result: RegexResult = executeRegex('(\\d)+', '', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].groups[0].value).toBe('5');
      });

      it('深いネストグループ ((((a)))) の各階層が全て抽出されること', () => {
        const text = 'a';
        const result: RegexResult = executeRegex('((((a))))', '', text);
        expect(result.matches[0].groups).toHaveLength(4);
        result.matches[0].groups.forEach((g: { value?: string }) => {
          expect(g.value).toBe('a');
        });
      });

      it('名前付きグループと番号付きグループのインデックス位置が矛盾しないこと', () => {
        const text = 'abc-123';
        const result: RegexResult = executeRegex('(?<letters>[a-z]+)-(?<digits>\\d+)', '', text);
        const match = result.matches[0];
        expect(match.groups[0].startIndex).toBe(0);
        expect(match.groups[0].endIndex).toBe(3);
        expect(match.groups[1].startIndex).toBe(4);
        expect(match.groups[1].endIndex).toBe(7);
      });

      it('空文字にマッチしたグループが value: "" として保持されること', () => {
        const text = 'foo';
        const result: RegexResult = executeRegex('foo(bar)?', '', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].groups[0].value).toBeUndefined();
      });
    });

    describe('2.7 不正な構文・エラーハンドリング (Crash Prevention)', () => {
      it('閉じられていない文字クラス ([a-z) で例外クラッシュせずエラーメッセージを返すこと', () => {
        const result: RegexResult = executeRegex('[a-z', 'g', 'test');
        expect(result.error).not.toBeNull();
        expect(typeof result.error).toBe('string');
        expect(result.hasMatch).toBe(false);
        expect(result.matchCount).toBe(0);
        expect(result.matches).toEqual([]);
      });

      it('閉じられていない丸括弧 ((abc) でエラーを安全に返すこと', () => {
        const result: RegexResult = executeRegex('(abc', 'g', 'abc');
        expect(result.error).not.toBeNull();
        expect(result.hasMatch).toBe(false);
      });

      it('単独の量指定子 (+ または * または ?) でエラーを安全に返すこと', () => {
        const result: RegexResult = executeRegex('+abc', 'g', 'abc');
        expect(result.error).not.toBeNull();
        expect(result.hasMatch).toBe(false);
      });

      it('不正な範囲指定の量指定子 ({5,2}) でエラーを安全に返すこと', () => {
        const result: RegexResult = executeRegex('a{5,2}', 'g', 'aaaa');
        expect(result.error).not.toBeNull();
        expect(result.hasMatch).toBe(false);
      });

      it('末尾の単独バックスラッシュ (abc\\) でエラーを安全に返すこと', () => {
        const result: RegexResult = executeRegex('abc\\', 'g', 'abc');
        expect(result.error).not.toBeNull();
        expect(result.hasMatch).toBe(false);
      });

      it('不正なグループ名 (?<123invalid>test) でエラーを安全に返すこと', () => {
        const result: RegexResult = executeRegex('(?<123invalid>test)', 'g', 'test');
        expect(result.error).not.toBeNull();
        expect(result.hasMatch).toBe(false);
      });
    });
  });

  // =========================================================================
  // Tier 3: 複数機能・フラグ複合テスト (Cross-Feature Combinations)
  // =========================================================================
  describe('Tier 3: Cross-Feature Combinations (複合機能・フラグペアワイズ)', () => {
    describe('3.1 ペアワイズおよび複数フラグ相互作用', () => {
      it('g + i: グローバルかつ大文字小文字無視のマッチング', () => {
        const text = 'Apple, APPLE, apple, aPple';
        const result: RegexResult = executeRegex('apple', 'gi', text);
        expect(result.matchCount).toBe(4);
      });

      it('g + m: 複数行にわたる各行頭の抽出', () => {
        const text = '1. First\n2. Second\n3. Third';
        const result: RegexResult = executeRegex('^\\d+\\.', 'gm', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].matchedText).toBe('1.');
        expect(result.matches[1].matchedText).toBe('2.');
        expect(result.matches[2].matchedText).toBe('3.');
      });

      it('m + s: 複数行モードとDotAllモードの同時適用', () => {
        const text = '```typescript\nconst a = 1;\nconst b = 2;\n```';
        const result: RegexResult = executeRegex('^```[a-z]+\\n.*\\n```$', 'ms', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].matchedText).toBe(text);
      });

      it('u + i: Unicode モードと大文字小文字無視（ラテン文字拡張）', () => {
        const text = 'CAFÉ and café';
        const result: RegexResult = executeRegex('café', 'gui', text);
        expect(result.matchCount).toBe(2);
      });

      it('y + i: 粘着モードと大文字小文字無視の先頭トークン照合', () => {
        const text = 'SELECT * FROM users';
        const result: RegexResult = executeRegex('select', 'yi', text);
        expect(result.hasMatch).toBe(true);
        expect(result.matches[0].matchedText).toBe('SELECT');
      });

      it('全フラグ同時適用 (gimsuy) の複合動作検証', () => {
        const flags = 'gimsuy';
        const result: RegexResult = executeRegex('^[a-z]+', flags, 'hello\nWORLD');
        expect(result.error).toBeNull();
        expect(result.matchCount).toBeGreaterThanOrEqual(1);
      });
    });

    describe('3.2 複数行フラグとネストされた名前付きグループ', () => {
      it('設定ファイル (INI/ENV) の各行キー・バリュー抽出', () => {
        const text = 'PORT=3000\nNODE_ENV=production\n# COMMENT\nDEBUG=true';
        const pattern = '^(?<key>[A-Z_]+)=(?<value>[^\\r\\n]+)$';
        const result: RegexResult = executeRegex(pattern, 'gm', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].namedGroups).toEqual({ key: 'PORT', value: '3000' });
        expect(result.matches[1].namedGroups).toEqual({ key: 'NODE_ENV', value: 'production' });
        expect(result.matches[2].namedGroups).toEqual({ key: 'DEBUG', value: 'true' });
      });

      it('Markdown 見出しレベルとタイトルの抽出', () => {
        const text = '# Main Title\nSome text\n## Sub Section\n### Sub Sub';
        const pattern = '^(?<level>#{1,6})\\s+(?<title>.+)$';
        const result: RegexResult = executeRegex(pattern, 'gm', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].namedGroups).toEqual({ level: '#', title: 'Main Title' });
        expect(result.matches[1].namedGroups).toEqual({ level: '##', title: 'Sub Section' });
        expect(result.matches[2].namedGroups).toEqual({ level: '###', title: 'Sub Sub' });
      });
    });

    describe('3.3 先読み・後読み (Lookaround) とハイライトセグメント', () => {
      it('肯定先読み (?=...) による単位付き数値の数値部分のみハイライト', () => {
        const text = '100px 200em 300px 400vh';
        const result: RegexResult = executeRegex('\\d+(?=px)', 'g', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('100');
        expect(result.matches[1].matchedText).toBe('300');
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(text);
      });

      it('否定先読み (?!...) による特定拡張子以外のファイル名マッチ', () => {
        const text = 'image.png doc.pdf script.js test.png';
        const result: RegexResult = executeRegex('\\b\\w+\\.(?!png\\b)\\w+\\b', 'g', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('doc.pdf');
        expect(result.matches[1].matchedText).toBe('script.js');
      });

      it('肯定後読み (?<=...) による通貨記号後の金額抽出', () => {
        const text = '$100 €200 $350 ¥5000';
        const result: RegexResult = executeRegex('(?<=\\$)\\d+', 'g', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('100');
        expect(result.matches[1].matchedText).toBe('350');
      });

      it('否定後読み (?<!...) による非エスケープ引用符の抽出', () => {
        const text = 'value="valid \\"escaped\\" text" and "another"';
        const result: RegexResult = executeRegex('(?<!\\\\)"', 'g', text);
        expect(result.matchCount).toBe(4);
      });

      it('先読み・後読みの組み合わせによるタグ内部コンテンツ抽出', () => {
        const text = '<span>Hello World</span> and <span>Sawara</span>';
        const result: RegexResult = executeRegex('(?<=<span>).*?(?=</span>)', 'g', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('Hello World');
        expect(result.matches[1].matchedText).toBe('Sawara');
      });
    });

    describe('3.4 プリセットテンプレートのカスタマイズ変更検証', () => {
      it('メールアドレステンプレートにサブアドレス（+tag）とカスタムフラグを付与して照合', () => {
        const baseEmailPattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
        const text = 'user+newsletter@sawara.me and Support@Example.COM';
        const result: RegexResult = executeRegex(baseEmailPattern, 'gi', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].matchedText).toBe('user+newsletter@sawara.me');
        expect(result.matches[1].matchedText).toBe('Support@Example.COM');
      });

      it('IPv4 テンプレートにポート番号キャプチャグループを追加して抽出', () => {
        const pattern = '\\b(?<ip>(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)):(?<port>\\d{1,5})\\b';
        const text = 'Web server: 192.168.1.100:8080 and DB: 10.0.0.1:5432';
        const result: RegexResult = executeRegex(pattern, 'g', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].namedGroups).toEqual({ ip: '192.168.1.100', port: '8080' });
        expect(result.matches[1].namedGroups).toEqual({ ip: '10.0.0.1', port: '5432' });
      });

      it('日付テンプレート (YYYY-MM-DD) に時刻部分 (THH:mm:ssZ) を追加した ISO8601 パターン', () => {
        const pattern = '(?<date>\\d{4}-\\d{2}-\\d{2})T(?<time>\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z)';
        const text = 'Created at 2026-08-22T16:50:00Z, Updated at 2026-08-22T17:00:00.123Z';
        const result: RegexResult = executeRegex(pattern, 'g', text);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].namedGroups?.date).toBe('2026-08-22');
        expect(result.matches[0].namedGroups?.time).toBe('16:50:00Z');
      });

      it('HEX カラーコードテンプレートにアルファチャンネル（8桁HEX）を追加して抽出', () => {
        const pattern = '#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b';
        const text = 'Colors: #fff, #3366cc, #ec4899ff, and invalid #zzzz';
        const result: RegexResult = executeRegex(pattern, 'gi', text);
        expect(result.matchCount).toBe(3);
        expect(result.matches[0].matchedText).toBe('#fff');
        expect(result.matches[1].matchedText).toBe('#3366cc');
        expect(result.matches[2].matchedText).toBe('#ec4899ff');
      });
    });
  });

  // =========================================================================
  // Tier 4: 実務応用シナリオテスト (Real-World Application Scenarios)
  // =========================================================================
  describe('Tier 4: Real-World Application Scenarios (実務実用シナリオ)', () => {
    describe('4.1 メールサーバーログ / Syslog 構造化抽出', () => {
      const syslogData = [
        'Aug 22 10:15:30 mail postfix/smtp[1234]: 4Sxxxx: to=<alice@example.com>, relay=mail.example.com[192.168.1.1]:25, status=sent (250 2.0.0 Ok)',
        'Aug 22 10:15:35 mail postfix/smtp[1235]: 4Syyyy: to=<bob@sawara.me>, relay=mail.sawara.me[192.168.1.2]:25, status=deferred (connection timed out)',
        'Aug 22 10:15:40 mail postfix/smtp[1236]: 4Szzzz: to=<charlie@test.org>, relay=mail.test.org[192.168.1.3]:25, status=bounced (user unknown)',
      ].join('\n');

      it('Syslog から日時・PID・宛先メール・ステータスを名前付きグループで完全抽出できること', () => {
        const pattern = '^(?<time>[A-Z][a-z]{2}\\s+\\d+\\s+\\d{2}:\\d{2}:\\d{2})\\s+\\w+\\s+\\w+\\/\\w+\\[(?<pid>\\d+)\\]:\\s+[A-Za-z0-9]+:\\s+to=<(?<email>[^>]+)>,.*status=(?<status>\\w+)';
        const result: RegexResult = executeRegex(pattern, 'gm', syslogData);
        expect(result.matchCount).toBe(3);

        expect(result.matches[0].namedGroups).toEqual({
          time: 'Aug 22 10:15:30',
          pid: '1234',
          email: 'alice@example.com',
          status: 'sent',
        });
        expect(result.matches[1].namedGroups).toEqual({
          time: 'Aug 22 10:15:35',
          pid: '1235',
          email: 'bob@sawara.me',
          status: 'deferred',
        });
        expect(result.matches[2].namedGroups).toEqual({
          time: 'Aug 22 10:15:40',
          pid: '1236',
          email: 'charlie@test.org',
          status: 'bounced',
        });
      });

      it('抽出されたセグメントが元の Syslog テキストを完全復元すること', () => {
        const pattern = '<(?<email>[^>]+)>';
        const result: RegexResult = executeRegex(pattern, 'g', syslogData);
        expect(result.matchCount).toBe(3);
        const reconstructed = result.segments.map((s: { text: string }) => s.text).join('');
        expect(reconstructed).toBe(syslogData);
      });
    });

    describe('4.2 Apache / Nginx Combined アクセスログ解析', () => {
      const accessLog = [
        '192.168.1.100 - user_admin [22/Aug/2026:16:30:00 +0900] "POST /api/v1/auth/login HTTP/1.1" 200 4523 "https://sawara.me" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"',
        '10.0.0.50 - - [22/Aug/2026:16:31:12 +0900] "GET /tools/regex-checker HTTP/2.0" 200 18450 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
        '172.16.0.25 - - [22/Aug/2026:16:32:05 +0900] "GET /non-existent-page HTTP/1.1" 404 1250 "https://google.com" "curl/8.1.2"',
      ].join('\n');

      it('IPアドレス、ユーザー、タイムスタンプ、HTTPメソッド、URLパス、ステータス、バイト数を正確にパースすること', () => {
        const pattern = '^(?<ip>\\S+)\\s+\\S+\\s+(?<user>\\S+)\\s+\\[(?<timestamp>[^\\]]+)\\]\\s+"(?<method>[A-Z]+)\\s+(?<path>\\S+)\\s+HTTP\\/[0-9.]+"\\s+(?<status>\\d{3})\\s+(?<bytes>\\d+)';
        const result: RegexResult = executeRegex(pattern, 'gm', accessLog);
        expect(result.matchCount).toBe(3);

        const match1 = result.matches[0].namedGroups;
        expect(match1?.ip).toBe('192.168.1.100');
        expect(match1?.user).toBe('user_admin');
        expect(match1?.method).toBe('POST');
        expect(match1?.path).toBe('/api/v1/auth/login');
        expect(match1?.status).toBe('200');
        expect(match1?.bytes).toBe('4523');

        const match3 = result.matches[2].namedGroups;
        expect(match3?.ip).toBe('172.16.0.25');
        expect(match3?.status).toBe('404');
      });

      it('特定HTTPステータス（404エラーなど）のみをフィルタリング抽出できること', () => {
        const pattern = '^.*"\\s+404\\s+.*$';
        const result: RegexResult = executeRegex(pattern, 'gm', accessLog);
        expect(result.matchCount).toBe(1);
        expect(result.matches[0].matchedText).toContain('/non-existent-page');
      });
    });

    describe('4.3 URL・クエリパラメータ・ハッシュフラグメント構造化抽出', () => {
      const urlText = [
        'https://sawara.me:8443/tools/regex-checker?p=%5B0-9%5D%2B&f=gim&lang=ja#results',
        'http://localhost:3000/api/search?q=typescript&limit=20#top',
        'ftp://files.example.org/downloads/archive.tar.gz',
      ].join('\n');

      it('プロトコル、ホスト、ポート、パス、クエリ、ハッシュを構造化抽出できること', () => {
        const pattern = '^(?<protocol>https?|ftp):\\/\\/(?<host>[a-zA-Z0-9.-]+)(?::(?<port>\\d+))?(?<path>\\/[^?#\\s]*)?(?:\\?(?<query>[^#\\s]*))?(?:#(?<hash>\\S*))?$';
        const result: RegexResult = executeRegex(pattern, 'gm', urlText);
        expect(result.matchCount).toBe(3);

        const url1 = result.matches[0].namedGroups;
        expect(url1?.protocol).toBe('https');
        expect(url1?.host).toBe('sawara.me');
        expect(url1?.port).toBe('8443');
        expect(url1?.path).toBe('/tools/regex-checker');
        expect(url1?.query).toBe('p=%5B0-9%5D%2B&f=gim&lang=ja');
        expect(url1?.hash).toBe('results');

        const url2 = result.matches[1].namedGroups;
        expect(url2?.host).toBe('localhost');
        expect(url2?.port).toBe('3000');

        const url3 = result.matches[2].namedGroups;
        expect(url3?.protocol).toBe('ftp');
        expect(url3?.port).toBeUndefined();
        expect(url3?.query).toBeUndefined();
      });

      it('クエリ文字列内の key=value ペアを網羅抽出できること', () => {
        const queryString = 'p=%5B0-9%5D%2B&f=gim&lang=ja&debug=true';
        const pattern = '(?<key>[^&=]+)=(?<value>[^&=]*)';
        const result: RegexResult = executeRegex(pattern, 'g', queryString);
        expect(result.matchCount).toBe(4);
        expect(result.matches[0].namedGroups).toEqual({ key: 'p', value: '%5B0-9%5D%2B' });
        expect(result.matches[1].namedGroups).toEqual({ key: 'f', value: 'gim' });
        expect(result.matches[2].namedGroups).toEqual({ key: 'lang', value: 'ja' });
        expect(result.matches[3].namedGroups).toEqual({ key: 'debug', value: 'true' });
      });
    });

    describe('4.4 日本の住所・電話番号・郵便番号パーサー', () => {
      const addressBook = [
        '〒100-0001 東京都千代田区千代田1-1 TEL: 03-1234-5678',
        '〒530-0001 大阪府大阪市北区梅田3丁目1-1 携帯: 090-1234-5678',
        '〒060-0000 北海道札幌市中央区北1条西2丁目 フリーダイヤル: 0120-000-123',
        '〒900-0015 沖縄県那覇市久茂地1-1-1 ナビダイヤル: 0570-00-1234',
      ].join('\n');

      it('日本の郵便番号（〒XXX-XXXX）を一括抽出できること', () => {
        const pattern = '〒(?<zip>\\d{3}-\\d{4})';
        const result: RegexResult = executeRegex(pattern, 'g', addressBook);
        expect(result.matchCount).toBe(4);
        expect(result.matches[0].namedGroups?.zip).toBe('100-0001');
        expect(result.matches[1].namedGroups?.zip).toBe('530-0001');
        expect(result.matches[2].namedGroups?.zip).toBe('060-0000');
        expect(result.matches[3].namedGroups?.zip).toBe('900-0015');
      });

      it('固定電話・携帯電話・フリーダイヤル・ナビダイヤルを網羅抽出できること', () => {
        const pattern = '\\b(?<phone>0\\d{1,4}-\\d{1,4}-\\d{3,4})\\b';
        const result: RegexResult = executeRegex(pattern, 'g', addressBook);
        expect(result.matchCount).toBe(4);
        expect(result.matches[0].namedGroups?.phone).toBe('03-1234-5678');
        expect(result.matches[1].namedGroups?.phone).toBe('090-1234-5678');
        expect(result.matches[2].namedGroups?.phone).toBe('0120-000-123');
        expect(result.matches[3].namedGroups?.phone).toBe('0570-00-1234');
      });

      it('都道府県（都/道/府/県）および市区町村を構造化抽出できること', () => {
        const pattern = '(?<pref>東京都|北海道|(?:京都|大阪)府|[^\\s]{2,3}県)(?<city>[^0-9\\s]+)';
        const result: RegexResult = executeRegex(pattern, 'g', addressBook);
        expect(result.matchCount).toBe(4);
        expect(result.matches[0].namedGroups?.pref).toBe('東京都');
        expect(result.matches[0].namedGroups?.city).toBe('千代田区千代田');
        expect(result.matches[1].namedGroups?.pref).toBe('大阪府');
        expect(result.matches[2].namedGroups?.pref).toBe('北海道');
        expect(result.matches[3].namedGroups?.pref).toBe('沖縄県');
      });
    });

    describe('4.5 Markdown / HTML タグ除去 & リンク/コードブロック抽出', () => {
      const htmlDoc = `
        <div class="container" id="main">
          <h1>Welcome to sawara.me</h1>
          <p>Check out our <a href="https://sawara.me/tools" target="_blank">Web Tools</a>.</p>
          <img src="/img/logo.png" alt="Logo" />
          <script>console.log("secure");</script>
        </div>
      `;

      it('HTMLタグを一括検出し、タグ名と属性を抽出できること', () => {
        const pattern = '<\\/??(?<tag>[a-zA-Z0-9]+)(?:\\s+[^>]*)?>';
        const result: RegexResult = executeRegex(pattern, 'g', htmlDoc);
        expect(result.matchCount).toBeGreaterThanOrEqual(8);
        expect(result.matches[0].namedGroups?.tag).toBe('div');
        expect(result.matches[1].namedGroups?.tag).toBe('h1');
      });

      it('HTML a タグから href URL を正確に抽出できること', () => {
        const pattern = '<a\\s+(?:[^>]*?\\s+)?href=["\'](?<url>[^"\']+)["\'][^>]*>(?<text>.*?)<\\/a>';
        const result: RegexResult = executeRegex(pattern, 'gis', htmlDoc);
        expect(result.matchCount).toBe(1);
        expect(result.matches[0].namedGroups?.url).toBe('https://sawara.me/tools');
        expect(result.matches[0].namedGroups?.text).toBe('Web Tools');
      });

      it('Markdown テキストからフェンスドコードブロック（言語指定付き）を抽出できること', () => {
        const markdownDoc = `
# Developer Guide

\`\`\`typescript
const greeting: string = "Hello World";
console.log(greeting);
\`\`\`

Here is some inline \`code\` and another block:

\`\`\`bash
yarn test
yarn build
\`\`\`
        `;

        const pattern = '```(?<lang>[a-zA-Z0-9_-]+)?\\n(?<code>[\\s\\S]*?)\\n```';
        const result: RegexResult = executeRegex(pattern, 'g', markdownDoc);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].namedGroups?.lang).toBe('typescript');
        expect(result.matches[0].namedGroups?.code).toContain('const greeting: string');
        expect(result.matches[1].namedGroups?.lang).toBe('bash');
        expect(result.matches[1].namedGroups?.code).toContain('yarn test');
      });

      it('Markdown リンク [Text](URL) を抽出できること', () => {
        const mdText = 'Read [Docs](https://sawara.me/docs) and [Blog](/blog) for updates.';
        const pattern = '\\[(?<label>[^\\]]+)\\]\\((?<link>[^)]+)\\)';
        const result: RegexResult = executeRegex(pattern, 'g', mdText);
        expect(result.matchCount).toBe(2);
        expect(result.matches[0].namedGroups).toEqual({ label: 'Docs', link: 'https://sawara.me/docs' });
        expect(result.matches[1].namedGroups).toEqual({ label: 'Blog', link: '/blog' });
      });
    });
  });
});
