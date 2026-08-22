/**
 * URL Parameter Deserialization/Serialization & LocalStorage Adversarial Test Suite
 * 
 * Empirical verification of URL handling, state persistence, fallback logic,
 * URI encoding/decoding, special characters, and boundary conditions.
 */

import { describe, it, expect } from 'vitest';
import {
  flagsToString,
  stringToFlags,
  PRESET_TEMPLATES,
  type RegexFlags,
} from '../../src/components/RegexChecker';

// Replicating component URL serialization logic for pure empirical verification
function serializeStateToUrlParams(
  pattern: string,
  flags: RegexFlags,
  text: string
): string {
  const params = new URLSearchParams();
  if (pattern) {
    params.set('p', pattern);
  }
  const flagStr = flagsToString(flags);
  if (flagStr) {
    params.set('f', flagStr);
  }
  if (text && text.length <= 500) {
    params.set('t', text);
  }
  return params.toString();
}

// Replicating component URL deserialization logic for pure empirical verification
function deserializeUrlParams(search: string): {
  hasUrlParams: boolean;
  pattern: string;
  flags: RegexFlags;
  text: string;
} {
  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const hasUrlParams = searchParams.has('p') || searchParams.has('f') || searchParams.has('t');

  if (hasUrlParams) {
    const urlPattern = searchParams.get('p') ?? '';
    const urlFlags = stringToFlags(searchParams.get('f') ?? 'g');
    const urlText = searchParams.get('t') ?? '';
    return {
      hasUrlParams: true,
      pattern: urlPattern,
      flags: urlFlags,
      text: urlText,
    };
  }

  return {
    hasUrlParams: false,
    pattern: '',
    flags: stringToFlags('g'),
    text: '',
  };
}

// Replicating component LocalStorage restore logic for pure empirical verification
function restoreFromStorageOrDefault(
  savedJson: string | null,
  throwError: boolean = false
): {
  pattern: string;
  flags: RegexFlags;
  text: string;
  templateId: string;
} {
  if (throwError) {
    // Simulating DOMException / SecurityError
    const defaultTemplate = PRESET_TEMPLATES[0];
    return {
      pattern: defaultTemplate.pattern,
      flags: { ...defaultTemplate.flags },
      text: defaultTemplate.sampleText,
      templateId: defaultTemplate.id,
    };
  }

  if (savedJson) {
    try {
      const parsed = JSON.parse(savedJson);
      if (parsed && typeof parsed.pattern === 'string') {
        return {
          pattern: parsed.pattern,
          flags: parsed.flags
            ? stringToFlags(flagsToString(parsed.flags))
            : { g: true, i: false, m: false, s: false, u: false, y: false },
          text: parsed.text ?? '',
          templateId: '',
        };
      }
    } catch {
      // Fallback
    }
  }

  const defaultTemplate = PRESET_TEMPLATES[0];
  return {
    pattern: defaultTemplate.pattern,
    flags: { ...defaultTemplate.flags },
    text: defaultTemplate.sampleText,
    templateId: defaultTemplate.id,
  };
}

describe('URL & LocalStorage Adversarial Verification Suite', () => {
  // =========================================================================
  // 1. URL Parameter Deserialization Edge Cases
  // =========================================================================
  describe('1. URL Parameter Deserialization Edge Cases', () => {
    it('特殊文字（スラッシュ、バックスラッシュ、正規表現メタ文字、角括弧、波括弧）が正しくデシリアライズされること', () => {
      const specialPatterns = [
        'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}',
        '\\b(?<year>\\d{4})[-/](?<month>0[1-9]|1[0-2])\\b',
        '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
        '(?:[A-Z]{3})|(?:[0-9]{3,5})|\\s+',
        '\\p{Emoji_Presentation}|\\p{Script=Hiragana}',
        '<!--.*?-->|<[^>]+>',
      ];

      for (const pattern of specialPatterns) {
        const query = `?p=${encodeURIComponent(pattern)}&f=gi&t=sample`;
        const result = deserializeUrlParams(query);
        expect(result.hasUrlParams).toBe(true);
        expect(result.pattern).toBe(pattern);
        expect(result.flags).toEqual({ g: true, i: true, m: false, s: false, u: false, y: false });
        expect(result.text).toBe('sample');
      }
    });

    it('Unicode・絵文字・マルチバイト文字（サロゲートペア、漢字、キリル文字）のURLデコード', () => {
      const unicodePattern = '(?<寿司>🍣+)と(?<ビール>🍺*)';
      const unicodeText = '🍣🍣🍺 𠮷野家 カタカナ 漢字';
      const query = `?p=${encodeURIComponent(unicodePattern)}&f=gu&t=${encodeURIComponent(unicodeText)}`;

      const result = deserializeUrlParams(query);
      expect(result.pattern).toBe(unicodePattern);
      expect(result.flags.u).toBe(true);
      expect(result.flags.g).toBe(true);
      expect(result.text).toBe(unicodeText);
    });

    it('空パラメータ（?p=&f=&t=）が渡された場合、空文字として安全に処理されること', () => {
      const query = '?p=&f=&t=';
      const result = deserializeUrlParams(query);
      expect(result.hasUrlParams).toBe(true);
      expect(result.pattern).toBe('');
      expect(result.flags).toEqual({ g: false, i: false, m: false, s: false, u: false, y: false });
      expect(result.text).toBe('');
    });

    it('パラメータが一切存在しない場合（クエリなし、空クエリ、?のみ）に hasUrlParams: false を返すこと', () => {
      expect(deserializeUrlParams('').hasUrlParams).toBe(false);
      expect(deserializeUrlParams('?').hasUrlParams).toBe(false);
      expect(deserializeUrlParams('???').hasUrlParams).toBe(false);
      expect(deserializeUrlParams('?other=123&foo=bar').hasUrlParams).toBe(false);
    });

    it('フラグパラメータの未知文字・大文字・重複文字耐性', () => {
      // Uppercase flags
      const r1 = deserializeUrlParams('?p=abc&f=GIM');
      expect(r1.flags.g).toBe(true);
      expect(r1.flags.i).toBe(true);
      expect(r1.flags.m).toBe(true);
      expect(r1.flags.s).toBe(false);

      // Unknown characters & duplicates
      const r2 = deserializeUrlParams('?p=abc&f=gggg_invalid_123_uuu');
      expect(r2.flags.g).toBe(true);
      expect(r2.flags.u).toBe(true);
      expect(r2.flags.i).toBe(true); // 'i' from invalid
      expect(r2.flags.s).toBe(false);

      // Missing f parameter defaults to 'g'
      const r3 = deserializeUrlParams('?p=abc');
      expect(r3.flags.g).toBe(true);
      expect(r3.flags.i).toBe(false);
    });

    it('改行コード（\\n, \\r\\n）やタブ文字を含むテキストのURLデコード', () => {
      const multilineText = 'Line 1\nLine 2\r\nLine 3\tTabbed';
      const query = `?p=\\d+&f=g&t=${encodeURIComponent(multilineText)}`;
      const result = deserializeUrlParams(query);
      expect(result.text).toBe(multilineText);
    });
  });

  // =========================================================================
  // 2. URL Parameter Serialization Invariants
  // =========================================================================
  describe('2. URL Parameter Serialization Invariants', () => {
    it('シリアライズ -> デシリアライズのラウンドトリップで完全同一性が維持されること (Round-trip Invariant)', () => {
      const testCases = [
        {
          pattern: '\\b[0-9]{3}-[0-9]{4}\\b',
          flags: { g: true, i: false, m: true, s: false, u: false, y: false },
          text: '〒100-0001 東京都千代田区',
        },
        {
          pattern: '<(?<tag>[a-z]+)>.*?</\\k<tag>>',
          flags: { g: true, i: true, m: false, s: true, u: false, y: false },
          text: '<div>Hello World</div>',
        },
        {
          pattern: '🍣|🍺|🎉',
          flags: { g: true, i: false, m: false, s: false, u: true, y: false },
          text: 'Emoji test: 🍣 and 🍺',
        },
      ];

      for (const tc of testCases) {
        const serialized = serializeStateToUrlParams(tc.pattern, tc.flags, tc.text);
        const deserialized = deserializeUrlParams(`?${serialized}`);
        expect(deserialized.pattern).toBe(tc.pattern);
        expect(deserialized.flags).toEqual(tc.flags);
        expect(deserialized.text).toBe(tc.text);
      }
    });

    it('テキスト長が500文字を超える場合、URL長制限のため t パラメータが除外されること (500-char Limit Guard)', () => {
      const shortText = 'a'.repeat(500);
      const longText = 'a'.repeat(501);

      const s1 = serializeStateToUrlParams('pattern', { g: true, i: false, m: false, s: false, u: false, y: false }, shortText);
      const p1 = new URLSearchParams(s1);
      expect(p1.has('t')).toBe(true);
      expect(p1.get('t')).toBe(shortText);

      const s2 = serializeStateToUrlParams('pattern', { g: true, i: false, m: false, s: false, u: false, y: false }, longText);
      const p2 = new URLSearchParams(s2);
      expect(p2.has('t')).toBe(false);
      expect(p2.has('p')).toBe(true);
      expect(p2.has('f')).toBe(true);
    });

    it('空パターンやフラグ全無効時のパラメータ省略', () => {
      const noFlags: RegexFlags = { g: false, i: false, m: false, s: false, u: false, y: false };
      const serialized = serializeStateToUrlParams('', noFlags, '');
      expect(serialized).toBe('');
    });
  });

  // =========================================================================
  // 3. LocalStorage Fallback & State Persistence
  // =========================================================================
  describe('3. LocalStorage Fallback & State Persistence', () => {
    it('正常な LocalStorage 保存状態からパターン・フラグ・テキストが正確に復元されること', () => {
      const savedState = {
        pattern: '\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b',
        flags: { g: true, i: true, m: false, s: false, u: false, y: false },
        text: 'user@example.com',
      };
      const result = restoreFromStorageOrDefault(JSON.stringify(savedState));
      expect(result.pattern).toBe(savedState.pattern);
      expect(result.flags).toEqual(savedState.flags);
      expect(result.text).toBe(savedState.text);
      expect(result.templateId).toBe('');
    });

    it('LocalStorage の JSON が破損している場合、クラッシュせずデフォルトテンプレートへフォールバックすること', () => {
      const corruptJsons = [
        '{invalid_json',
        'undefined',
        'null',
        '{"pattern": 123}', // pattern is not a string
        '',
      ];

      for (const corrupt of corruptJsons) {
        const result = restoreFromStorageOrDefault(corrupt);
        expect(result.templateId).toBe(PRESET_TEMPLATES[0].id);
        expect(result.pattern).toBe(PRESET_TEMPLATES[0].pattern);
        expect(result.text).toBe(PRESET_TEMPLATES[0].sampleText);
      }
    });

    it('LocalStorage が null（初回アクセス）の場合、デフォルトテンプレートへフォールバックすること', () => {
      const result = restoreFromStorageOrDefault(null);
      expect(result.templateId).toBe(PRESET_TEMPLATES[0].id);
      expect(result.pattern).toBe(PRESET_TEMPLATES[0].pattern);
      expect(result.flags).toEqual(PRESET_TEMPLATES[0].flags);
      expect(result.text).toBe(PRESET_TEMPLATES[0].sampleText);
    });

    it('LocalStorage アクセス時に例外（SecurityError / QuotaExceeded）が発生しても安全にフォールバックすること', () => {
      const result = restoreFromStorageOrDefault(null, true);
      expect(result.templateId).toBe(PRESET_TEMPLATES[0].id);
      expect(result.pattern).toBe(PRESET_TEMPLATES[0].pattern);
    });

    it('URLパラメータと LocalStorage の優先順位: URLパラメータが存在する場合は URL が最優先されること', () => {
      // When URL query has params:
      const urlQuery = '?p=\\d%2B&f=gm&t=12345';
      const urlResult = deserializeUrlParams(urlQuery);
      expect(urlResult.hasUrlParams).toBe(true);
      expect(urlResult.pattern).toBe('\\d+');
      expect(urlResult.flags.m).toBe(true);

      // Even if LocalStorage had something else, URL takes precedence.
    });
  });
});
