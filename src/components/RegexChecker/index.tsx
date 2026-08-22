import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import Translate, { translate } from '@docusaurus/Translate';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  InputAdornment,
  IconButton,
  Button,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SpeedIcon from '@mui/icons-material/Speed';
import LayersIcon from '@mui/icons-material/Layers';
import DataObjectIcon from '@mui/icons-material/DataObject';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import MuiTheme from '@site/src/components/MuiTheme';
import styles from './styles.module.css';

/**
 * 正規表現フラグのブール値表現
 */
export interface RegexFlags {
  /** g: グローバル検索（全体マッチ） */
  g: boolean;
  /** i: 大文字・小文字を区別しない */
  i: boolean;
  /** m: 複数行モード (^ と $ が各行の先頭・末尾にマッチ) */
  m: boolean;
  /** s: dotAll モード (. が改行文字 \n にもマッチ) */
  s: boolean;
  /** u: Unicode モード (サロゲートペアやUnicodeプロパティに対応) */
  u: boolean;
  /** y: Sticky モード (lastIndex からの固定位置マッチ) */
  y: boolean;
}

/**
 * キャプチャグループの詳細情報
 */
export interface CaptureGroup {
  /** グループ名（名前付きは "name"、番号付きは "$1", "$2" など） */
  name: string;
  /** マッチした文字列（未マッチの省略可能グループは undefined） */
  value: string | undefined;
  /** テキスト内での開始インデックス (0-based) */
  startIndex?: number;
  /** テキスト内での終了インデックス */
  endIndex?: number;
}

/**
 * 単一のマッチ結果項目
 */
export interface RegexMatchItem {
  /** 1から始まるマッチ番号 (1, 2, 3...) */
  matchIndex: number;
  /** マッチした文字列全体 */
  matchedText: string;
  /** テキスト内での開始インデックス (0-based) */
  startIndex: number;
  /** テキスト内での終了インデックス */
  endIndex: number;
  /** キャプチャグループのリスト */
  groups: CaptureGroup[];
  /** 名前付きグループのマップ */
  namedGroups?: Record<string, string | undefined>;
}

/**
 * ハイライト表示用セグメント
 */
export interface HighlightSegment {
  /** 当該セグメントの文字列 */
  text: string;
  /** マッチ部分かどうか (true: ハイライト対象, false: 通常テキスト) */
  isMatch: boolean;
  /** マッチ番号 (1-based, isMatch: true の場合) */
  matchNumber?: number;
  /** マッチ詳細情報への参照 (isMatch: true の場合) */
  matchItem?: RegexMatchItem;
}

/**
 * executeRegex の実行結果オブジェクト
 */
export interface RegexResult {
  /** 構文エラーなどのメッセージ（正常時は null） */
  error: string | null;
  /** マッチが存在したかどうか */
  hasMatch: boolean;
  /** マッチ件数 */
  matchCount: number;
  /** マッチ詳細の配列 */
  matches: RegexMatchItem[];
  /** ハイライト表示用セグメントの配列 */
  segments: HighlightSegment[];
  /** 実行時間（ミリ秒） */
  executionTimeMs: number;
  /** 最大マッチ件数で打ち切られたかどうか */
  isTruncated: boolean;
}

/**
 * プリセットテンプレートの型定義
 */
export interface RegexPresetTemplate {
  id: string;
  nameId: string;
  defaultName: string;
  pattern: string;
  flags: RegexFlags;
  sampleText: string;
}

/**
 * 頻出正規表現テンプレート集 (10種類)
 */
export const PRESET_TEMPLATES: RegexPresetTemplate[] = [
  {
    id: 'email',
    nameId: 'regex.template.email',
    defaultName: 'メールアドレス',
    pattern: '[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}',
    flags: { g: true, i: true, m: false, s: false, u: false, y: false },
    sampleText: 'Contact us at info@example.com or support.team@service.co.jp for inquiries.\nInvalid: user@.com, test@domain',
  },
  {
    id: 'url',
    nameId: 'regex.template.url',
    defaultName: 'URL (HTTP/HTTPS)',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: 'Official site: https://sawara.me and repository at https://github.com/sawarame/sawarame.github.com?ref=readme#features',
  },
  {
    id: 'postal',
    nameId: 'regex.template.postal',
    defaultName: '日本の郵便番号',
    pattern: '\\b\\d{3}-\\d{4}\\b|\\b\\d{7}\\b',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: '〒100-0001 東京都千代田区千代田1-1\n〒1500043 東京都渋谷区道玄坂\n不正な例: 12-3456, 1234-567',
  },
  {
    id: 'phone',
    nameId: 'regex.template.phone',
    defaultName: '日本の電話番号',
    pattern: '\\b0\\d{1,4}-\\d{1,4}-\\d{4}\\b',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: '東京本社: 03-1234-5678\n携帯電話: 090-1234-5678\n大阪支店: 06-9876-5432\nフリーダイヤル: 0120-123-456',
  },
  {
    id: 'date',
    nameId: 'regex.template.date',
    defaultName: '日付 (YYYY-MM-DD / YYYY/MM/DD)',
    pattern: '\\b(?<year>\\d{4})[-/](?<month>0[1-9]|1[0-2])[-/](?<day>0[1-9]|[12]\\d|3[01])\\b',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: 'Release dates:\nv1.0: 2026-01-15\nv1.1: 2026/04/30\nNext target: 2026-12-31',
  },
  {
    id: 'time',
    nameId: 'regex.template.time',
    defaultName: '時刻 (HH:MM:SS)',
    pattern: '\\b(?<hour>[01]\\d|2[0-3]):(?<minute>[0-5]\\d)(?::(?<second>[0-5]\\d))?\\b',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: 'Meeting scheduled at 09:30, lunch break 12:00:00, and evening wrap-up at 18:45:30.',
  },
  {
    id: 'ipv4',
    nameId: 'regex.template.ipv4',
    defaultName: 'IPv4 アドレス',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: 'Router IP: 192.168.1.1\nDNS: 8.8.8.8, 1.1.1.1\nBroadcast: 255.255.255.255\nInvalid: 256.100.0.1, 192.168.1',
  },
  {
    id: 'alphanumeric',
    nameId: 'regex.template.alphanumeric',
    defaultName: '半角英数字',
    pattern: '[a-zA-Z0-9]+',
    flags: { g: true, i: false, m: false, s: false, u: false, y: false },
    sampleText: 'User_ID: admin2026, Token: abcXYZ789, Status: OK',
  },
  {
    id: 'html',
    nameId: 'regex.template.html',
    defaultName: 'HTML タグ',
    pattern: '<(?<tag>[a-zA-Z][a-zA-Z0-9]*)\\b(?<attrs>[^>]*)>(?<content>.*?)<\\/\\k<tag>>|<(?<selfClosing>[a-zA-Z][a-zA-Z0-9]*)\\b(?<selfAttrs>[^>]*)\\/>',
    flags: { g: true, i: false, m: false, s: true, u: false, y: false },
    sampleText: '<div class="container">\n  <h1 id="title">Sawara Tools</h1>\n  <img src="logo.png" alt="Logo" />\n  <p>Easy Regex Testing</p>\n</div>',
  },
  {
    id: 'hexColor',
    nameId: 'regex.template.hexColor',
    defaultName: '16進数カラーコード (#RGB / #RRGGBB)',
    pattern: '#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b',
    flags: { g: true, i: true, m: false, s: false, u: false, y: false },
    sampleText: 'Primary: #3366cc, Accent: #4f9dff, Short: #fff, #000, Alpha: #ff000080, Invalid: #gggggg, #12345',
  },
];

/**
 * 各フラグの設定情報
 */
const FLAG_CONFIGS: Array<{
  key: keyof RegexFlags;
  label: string;
  titleId: string;
  title: string;
  descId: string;
  desc: string;
}> = [
  {
    key: 'g',
    label: 'g',
    titleId: 'regex.flag.g.title',
    title: 'グローバル検索 (g)',
    descId: 'regex.flag.g.desc',
    desc: 'すべての一致を検索します',
  },
  {
    key: 'i',
    label: 'i',
    titleId: 'regex.flag.i.title',
    title: '大文字小文字無視 (i)',
    descId: 'regex.flag.i.desc',
    desc: '大文字と小文字を区別しません',
  },
  {
    key: 'm',
    label: 'm',
    titleId: 'regex.flag.m.title',
    title: '複数行モード (m)',
    descId: 'regex.flag.m.desc',
    desc: '^ と $ が各行の先頭と末尾にマッチします',
  },
  {
    key: 's',
    label: 's',
    titleId: 'regex.flag.s.title',
    title: 'dotAll (s)',
    descId: 'regex.flag.s.desc',
    desc: 'ドット (.) が改行文字 \\n にもマッチします',
  },
  {
    key: 'u',
    label: 'u',
    titleId: 'regex.flag.u.title',
    title: 'Unicode (u)',
    descId: 'regex.flag.u.desc',
    desc: 'Unicode (サロゲートペア等) に対応します',
  },
  {
    key: 'y',
    label: 'y',
    titleId: 'regex.flag.y.title',
    title: 'Sticky (y)',
    descId: 'regex.flag.y.desc',
    desc: 'lastIndex の位置から連続してマッチします',
  },
];

/**
 * RegexFlags オブジェクトを正規表現フラグ文字列（例: "gim"）に変換します。
 *
 * @param flags フラグオブジェクト
 * @returns フラグ文字列
 */
export function flagsToString(flags: RegexFlags): string {
  let result = '';
  if (flags.g) result += 'g';
  if (flags.i) result += 'i';
  if (flags.m) result += 'm';
  if (flags.s) result += 's';
  if (flags.u) result += 'u';
  if (flags.y) result += 'y';
  return result;
}

/**
 * フラグ文字列（例: "gim"）を RegexFlags オブジェクトに変換します。
 * 重複文字や未知の文字が含まれていても安全に処理します。
 *
 * @param flagStr フラグ文字列
 * @returns RegexFlags オブジェクト
 */
export function stringToFlags(flagStr: string): RegexFlags {
  const flags: RegexFlags = {
    g: false,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  };
  if (!flagStr) return flags;
  const str = flagStr.toLowerCase();
  if (str.includes('g')) flags.g = true;
  if (str.includes('i')) flags.i = true;
  if (str.includes('m')) flags.m = true;
  if (str.includes('s')) flags.s = true;
  if (str.includes('u')) flags.u = true;
  if (str.includes('y')) flags.y = true;
  return flags;
}

/**
 * 正規表現パターンからキャプチャグループ名（"$1", "$2", または名前付きグループ名）を出現順に抽出します。
 *
 * @param pattern 正規表現パターン文字列
 * @returns キャプチャグループ名の配列
 */
export function getGroupNames(pattern: string): string[] {
  const groupNames: string[] = [];
  let inCharClass = false;
  let escaped = false;
  let groupIndex = 1;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (inCharClass) {
      if (char === ']') {
        inCharClass = false;
      }
      continue;
    }

    if (char === '[') {
      inCharClass = true;
      continue;
    }

    if (char === '(') {
      // 後読み (?<=, (?<! はキャプチャグループではないため除外
      if (pattern.startsWith('(?<=', i) || pattern.startsWith('(?<!', i)) {
        continue;
      }
      // 非キャプチャ (?:, 先読み (?=, (?! は除外
      if (pattern.startsWith('(?:', i) || pattern.startsWith('(?=', i) || pattern.startsWith('(?!', i)) {
        continue;
      }
      // 名前付きキャプチャ (?<name>...) の判定
      if (pattern.startsWith('(?<', i)) {
        const endName = pattern.indexOf('>', i + 3);
        if (endName !== -1) {
          const name = pattern.slice(i + 3, endName);
          groupNames.push(name);
          groupIndex++;
          i = endName;
          continue;
        }
      }
      // 通常の番号付きキャプチャグループ ($1, $2, ...)
      groupNames.push(`$${groupIndex}`);
      groupIndex++;
    }
  }

  return groupNames;
}

/**
 * 対象テキストとマッチ配列から、ハイライト表示用の連続したセグメント配列を生成します。
 * 全セグメントの text を結合すると元の text と100%一致する不変条件を保証します。
 *
 * @param text 対象テキスト
 * @param matches 抽出されたマッチ配列
 * @returns HighlightSegment の配列
 */
export function buildHighlightSegments(
  text: string,
  matches: RegexMatchItem[]
): HighlightSegment[] {
  if (text.length === 0) {
    return [];
  }

  if (matches.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const { startIndex, endIndex, matchIndex } = match;

    // 前回のカーソルから今回のマッチ開始位置までの非マッチ区間
    if (startIndex > cursor) {
      segments.push({
        text: text.slice(cursor, startIndex),
        isMatch: false,
      });
      cursor = startIndex;
    }

    // マッチ区間（長さ > 0 の場合）
    if (endIndex > cursor) {
      segments.push({
        text: text.slice(cursor, endIndex),
        isMatch: true,
        matchNumber: matchIndex,
        matchItem: match,
      });
      cursor = endIndex;
    }
  }

  // 最後のマッチ終了位置からテキスト末尾までの非マッチ区間
  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isMatch: false,
    });
  }

  return segments;
}

/**
 * 正規表現判定・抽出・セグメンテーションを実行する純粋関数
 *
 * @param pattern 正規表現パターン文字列
 * @param flagsInput 正規表現フラグ（RegexFlags オブジェクトまたは文字列）
 * @param text テスト対象テキスト
 * @param maxMatches 最大マッチ件数（デフォルト: 1000件）
 * @returns RegexResult 実行結果オブジェクト
 */
export function executeRegex(
  pattern: string,
  flagsInput: RegexFlags | string,
  text: string,
  maxMatches: number = 1000
): RegexResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  // パターンが空文字の場合は初期状態を安全に返却
  if (!pattern) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      error: null,
      hasMatch: false,
      matchCount: 0,
      matches: [],
      segments: text ? [{ text, isMatch: false }] : [],
      executionTimeMs: Math.max(0, Math.round(elapsed * 100) / 100),
      isTruncated: false,
    };
  }

  // テキストが空文字の場合
  if (!text) {
    const flagStr = typeof flagsInput === 'string' ? flagsInput : flagsToString(flagsInput);
    try {
      new RegExp(pattern, flagStr);
    } catch (err: unknown) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
      return {
        error: err instanceof Error ? err.message : String(err),
        hasMatch: false,
        matchCount: 0,
        matches: [],
        segments: [{ text: '', isMatch: false }],
        executionTimeMs: Math.max(0, Math.round(elapsed * 100) / 100),
        isTruncated: false,
      };
    }
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      error: null,
      hasMatch: false,
      matchCount: 0,
      matches: [],
      segments: [{ text: '', isMatch: false }],
      executionTimeMs: Math.max(0, Math.round(elapsed * 100) / 100),
      isTruncated: false,
    };
  }

  const flagStr = typeof flagsInput === 'string' ? flagsInput : flagsToString(flagsInput);

  // 正確なグループ開始・終了位置取得のため ES2022 の 'd' フラグ付与を試行
  let effectiveFlagStr = flagStr;
  try {
    if (!flagStr.includes('d')) {
      new RegExp('', flagStr + 'd');
      effectiveFlagStr = flagStr + 'd';
    }
  } catch {
    effectiveFlagStr = flagStr;
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, effectiveFlagStr);
  } catch {
    try {
      regex = new RegExp(pattern, flagStr);
    } catch (err: unknown) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
      return {
        error: err instanceof Error ? err.message : String(err),
        hasMatch: false,
        matchCount: 0,
        matches: [],
        segments: [{ text, isMatch: false }],
        executionTimeMs: Math.max(0, Math.round(elapsed * 100) / 100),
        isTruncated: false,
      };
    }
  }

  const isGlobal = regex.global;
  const isSticky = regex.sticky;
  const isUnicode = regex.unicode;
  const groupNames = getGroupNames(pattern);
  const matches: RegexMatchItem[] = [];
  let isTruncated = false;
  let match: RegExpExecArray | null;
  let matchIndex = 1;

  try {
    while ((match = regex.exec(text)) !== null) {
      const startIndex = match.index;
      const matchedText = match[0];
      const endIndex = startIndex + matchedText.length;

      // キャプチャグループの抽出
      const groups: CaptureGroup[] = [];
      const indices = (match as unknown as { indices?: Array<[number, number] | undefined> }).indices;

      for (let g = 1; g < match.length; g++) {
        const val = match[g];
        const name = groupNames[g - 1] || `$${g}`;
        let groupStart: number | undefined;
        let groupEnd: number | undefined;

        if (indices && indices[g]) {
          groupStart = indices[g]![0];
          groupEnd = indices[g]![1];
        }

        groups.push({
          name,
          value: val,
          startIndex: groupStart,
          endIndex: groupEnd,
        });
      }

      const namedGroups = match.groups ? { ...match.groups } : undefined;

      matches.push({
        matchIndex,
        matchedText,
        startIndex,
        endIndex,
        groups,
        namedGroups,
      });

      matchIndex++;

      // マッチ上限ガード
      if (matches.length >= maxMatches) {
        isTruncated = true;
        break;
      }

      // g または y フラグがない場合は最初の1件で終了
      if (!isGlobal && !isSticky) {
        break;
      }

      // ゼロ幅マッチ（長さ0）における無限ループ防止ガード
      if (matchedText.length === 0) {
        if (regex.lastIndex === startIndex) {
          if (regex.lastIndex >= text.length) {
            break;
          }
          // Unicode サロゲートペア対応
          if (isUnicode) {
            const codePoint = text.codePointAt(regex.lastIndex);
            if (codePoint !== undefined && codePoint > 0xffff) {
              regex.lastIndex += 2;
            } else {
              regex.lastIndex += 1;
            }
          } else {
            regex.lastIndex += 1;
          }
        }
      }
    }
  } catch (loopErr: unknown) {
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    return {
      error: loopErr instanceof Error ? loopErr.message : String(loopErr),
      hasMatch: matches.length > 0,
      matchCount: matches.length,
      matches,
      segments: [{ text, isMatch: false }],
      executionTimeMs: Math.max(0, Math.round(elapsed * 100) / 100),
      isTruncated,
    };
  }

  const segments = buildHighlightSegments(text, matches);
  const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

  return {
    error: null,
    hasMatch: matches.length > 0,
    matchCount: matches.length,
    matches,
    segments,
    executionTimeMs: Math.max(0, Math.round(elapsed * 100) / 100),
    isTruncated,
  };
}

/**
 * 正規表現チェッカー メインUIコンポーネント
 */
export default function RegexChecker(): React.ReactElement {
  const history = useHistory();
  const location = useLocation();

  const [pattern, setPattern] = useState<string>('');
  const [flags, setFlags] = useState<RegexFlags>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });
  const [text, setText] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // 初回マウント時に URL クエリパラメータまたは LocalStorage から状態を復元
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(location.search);
    const hasUrlParams = searchParams.has('p') || searchParams.has('f') || searchParams.has('t');

    if (hasUrlParams) {
      const urlPattern = searchParams.get('p') ?? '';
      const urlFlags = stringToFlags(searchParams.get('f') ?? 'g');
      const urlText = searchParams.get('t') ?? '';
      setPattern(urlPattern);
      setFlags(urlFlags);
      setText(urlText);
      setSelectedTemplateId('');
    } else {
      // LocalStorage からの復元を試行
      try {
        const saved = localStorage.getItem('sawara_regex_checker_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.pattern === 'string') {
            setPattern(parsed.pattern);
            setFlags(
              parsed.flags
                ? stringToFlags(flagsToString(parsed.flags))
                : { g: true, i: false, m: false, s: false, u: false, y: false }
            );
            setText(parsed.text ?? '');
            setSelectedTemplateId('');
            return;
          }
        }
      } catch {
        // パース失敗時はデフォルトへ
      }

      // デフォルトテンプレート（メールアドレス）を初期セット
      const defaultTemplate = PRESET_TEMPLATES[0];
      setPattern(defaultTemplate.pattern);
      setFlags({ ...defaultTemplate.flags });
      setText(defaultTemplate.sampleText);
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, []);

  // 状態変更時に URL クエリパラメータおよび LocalStorage へ同期
  useEffect(() => {
    if (!isMounted) return;

    // LocalStorage への永続化
    try {
      localStorage.setItem(
        'sawara_regex_checker_state',
        JSON.stringify({
          pattern,
          flags,
          text,
        })
      );
    } catch {
      // ignore
    }

    // URL クエリパラメータの同期
    const params = new URLSearchParams();
    if (pattern) {
      params.set('p', pattern);
    }
    const flagStr = flagsToString(flags);
    if (flagStr) {
      params.set('f', flagStr);
    }
    // URL長制限を考慮し、短いテキスト（500文字以下）のみ URL パラメータに含める
    if (text && text.length <= 500) {
      params.set('t', text);
    }

    const newSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.substring(1) : location.search;

    if (newSearch !== currentSearch) {
      history.replace({
        search: newSearch ? `?${newSearch}` : '',
      });
    }
  }, [pattern, flags, text, isMounted]);

  // 正規表現の実行と結果のメモ化
  const result: RegexResult = useMemo(() => {
    return executeRegex(pattern, flags, text);
  }, [pattern, flags, text]);

  // フラグのトグル操作
  const handleFlagToggle = useCallback((flagKey: keyof RegexFlags) => {
    setFlags((prev) => ({
      ...prev,
      [flagKey]: !prev[flagKey],
    }));
    setSelectedTemplateId('');
  }, []);

  // プリセットテンプレートの選択
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      setPattern(found.pattern);
      setFlags({ ...found.flags });
      setText(found.sampleText);
    }
  }, []);

  // 正規表現パターンのコピー
  const handleCopyPattern = useCallback(() => {
    if (!pattern) return;
    const fullPattern = `/${pattern}/${flagsToString(flags)}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullPattern);
      setSnackbar({
        open: true,
        message: translate({
          id: 'regex.result.copiedPattern',
          message: '正規表現パターンをコピーしました！',
        }),
      });
    }
  }, [pattern, flags]);

  // マッチ結果一覧のコピー
  const handleCopyMatches = useCallback(() => {
    if (!result.matches.length) {
      setSnackbar({
        open: true,
        message: translate({
          id: 'regex.result.noMatchesToCopy',
          message: 'コピー可能なマッチがありません',
        }),
      });
      return;
    }
    const matchTexts = result.matches.map((m) => m.matchedText).join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(matchTexts);
      setSnackbar({
        open: true,
        message: translate({
          id: 'regex.result.copiedMatches',
          message: 'マッチ結果をコピーしました！',
        }),
      });
    }
  }, [result.matches]);

  // 単一マッチ文字列のコピー
  const handleCopySingleMatch = useCallback((matchText: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(matchText);
      setSnackbar({
        open: true,
        message: translate({
          id: 'regex.result.copiedSingle',
          message: 'マッチテキストをコピーしました！',
        }),
      });
    }
  }, []);

  const textLength = text.length;
  const lineCount = text ? text.split('\n').length : 0;
  const flagsStr = flagsToString(flags);

  return (
    <MuiTheme>
      <div className={styles.container}>
        {/* ---- 上部ツールバー: テンプレート選択 ---- */}
        <div className={styles.topBar}>
          <div className={styles.templateSelector}>
            <DataObjectIcon color="primary" />
            <FormControl size="small" fullWidth sx={{ minWidth: 240 }}>
              <InputLabel id="regex-template-select-label">
                <Translate id="regex.template.selectLabel" description="Preset template dropdown label">
                  プリセットテンプレートを選択
                </Translate>
              </InputLabel>
              <Select
                labelId="regex-template-select-label"
                value={selectedTemplateId}
                label={translate({
                  id: 'regex.template.selectLabel',
                  message: 'プリセットテンプレートを選択',
                })}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>
                    <Translate id="regex.template.custom" description="Custom user input">
                      カスタム (直接入力)
                    </Translate>
                  </em>
                </MenuItem>
                {PRESET_TEMPLATES.map((tmpl) => (
                  <MenuItem key={tmpl.id} value={tmpl.id}>
                    {translate({ id: tmpl.nameId, message: tmpl.defaultName })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={styles.topActions}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => {
                setPattern('');
                setText('');
                setSelectedTemplateId('');
              }}
              sx={{ borderRadius: 2 }}
            >
              <Translate id="regex.actions.resetAll" description="Reset pattern and text">
                全クリア
              </Translate>
            </Button>
          </div>
        </div>

        {/* ---- メイン 2 カラムグリッド ---- */}
        <div className={styles.layoutGrid}>
          {/* ---- 左カラム: 入力パネル ---- */}
          <div className={styles.leftColumn}>
            {/* パターン入力カード */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>
                    <LayersIcon fontSize="small" />
                  </span>
                  <Translate id="regex.pattern.title" description="Regex Pattern field title">
                    正規表現パターン
                  </Translate>
                </h3>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {pattern && (
                    <Tooltip
                      title={translate({
                        id: 'regex.pattern.copyTooltip',
                        message: '正規表現パターンをコピー (/{pattern}/{flags})',
                      })}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={handleCopyPattern}
                        color="primary"
                        aria-label={translate({ id: 'regex.pattern.copy', message: 'パターンをコピー' })}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {pattern && (
                    <Tooltip
                      title={translate({ id: 'regex.pattern.clear', message: 'パターンをクリア' })}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={() => {
                          setPattern('');
                          setSelectedTemplateId('');
                        }}
                        aria-label={translate({ id: 'regex.pattern.clear', message: 'パターンをクリア' })}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </div>

              <div className={styles.patternWrapper}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="medium"
                  value={pattern}
                  onChange={(e) => {
                    setPattern(e.target.value);
                    setSelectedTemplateId('');
                  }}
                  placeholder={translate({
                    id: 'regex.pattern.placeholder',
                    message: '例: [\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}',
                  })}
                  error={Boolean(result.error)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                          /
                        </Typography>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', fontFamily: 'monospace' }}>
                            /{flagsStr}
                          </Typography>
                          {pattern && (
                            <Tooltip
                              title={translate({
                                id: 'regex.pattern.copyTooltip',
                                message: '正規表現パターンをコピー (/{pattern}/{flags})',
                              })}
                              arrow
                            >
                              <IconButton
                                size="small"
                                onClick={handleCopyPattern}
                                edge="end"
                                sx={{ p: 0.5 }}
                                aria-label={translate({ id: 'regex.pattern.copy', message: 'パターンをコピー' })}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </InputAdornment>
                    ),
                    sx: { fontFamily: 'var(--ifm-font-family-monospace)', borderRadius: 2 },
                  }}
                />

                {result.error && (
                  <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ borderRadius: 2 }}>
                    <strong>
                      <Translate id="regex.error.title" description="Syntax error alert title">
                        正規表現エラー:
                      </Translate>
                    </strong>{' '}
                    {result.error}
                  </Alert>
                )}

                {/* フラグトグルボタングループ */}
                <div className={styles.flagsContainer}>
                  <span className={styles.flagsLabel}>
                    <Translate id="regex.flags.title" description="Regex flags label">
                      フラグ設定:
                    </Translate>
                  </span>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {FLAG_CONFIGS.map((flag) => {
                      const active = flags[flag.key];
                      const title = translate({ id: flag.titleId, message: flag.title });
                      const desc = translate({ id: flag.descId, message: flag.desc });
                      return (
                        <Tooltip key={flag.key} title={`${title} — ${desc}`} arrow>
                          <Button
                            variant={active ? 'contained' : 'outlined'}
                            size="small"
                            color={active ? 'primary' : 'inherit'}
                            onClick={() => handleFlagToggle(flag.key)}
                            sx={{
                              minWidth: 36,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1.5,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            {flag.label}
                          </Button>
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </div>
              </div>
            </div>

            {/* テスト対象テキスト入力カード */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>
                    <PlaylistAddCheckIcon fontSize="small" />
                  </span>
                  <Translate id="regex.text.title" description="Test text field title">
                    テスト対象テキスト
                  </Translate>
                </h3>
                {text && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setText('');
                      setSelectedTemplateId('');
                    }}
                    title={translate({ id: 'regex.text.clear', message: 'テキストをクリア' })}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </div>

              <TextField
                fullWidth
                multiline
                minRows={7}
                maxRows={16}
                variant="outlined"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setSelectedTemplateId('');
                }}
                placeholder={translate({
                  id: 'regex.text.placeholder',
                  message: 'ここにテストしたいテキストを入力してください...',
                })}
                InputProps={{
                  sx: {
                    fontFamily: 'var(--ifm-font-family-monospace)',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    borderRadius: 2,
                  },
                }}
              />

              <div className={styles.textMetaRow}>
                <span>
                  {translate(
                    {
                      id: 'regex.text.meta',
                      message: '{chars} 文字 / {lines} 行',
                    },
                    { chars: textLength, lines: lineCount }
                  )}
                </span>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    const found = PRESET_TEMPLATES.find((t) => t.id === (selectedTemplateId || 'email'));
                    if (found) {
                      setText(found.sampleText);
                    }
                  }}
                >
                  <Translate id="regex.text.insertSample" description="Insert sample text">
                    サンプルテキストを挿入
                  </Translate>
                </Button>
              </div>
            </div>
          </div>

          {/* ---- 右カラム: マッチ結果・ハイライト & グループ抽出 ---- */}
          <div className={styles.rightColumn}>
            {/* ハイライト結果カード */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>
                    <CheckCircleIcon fontSize="small" />
                  </span>
                  <Translate id="regex.result.title" description="Match results and highlight title">
                    マッチ結果・ハイライト
                  </Translate>
                </h3>
                <Stack direction="row" spacing={1} alignItems="center">
                  {result.error ? (
                    <Chip
                      icon={<ErrorOutlineIcon />}
                      label={translate({ id: 'regex.result.errorStatus', message: 'エラー' })}
                      color="error"
                      size="small"
                    />
                  ) : result.hasMatch ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={translate(
                        { id: 'regex.result.matchCount', message: '{count} 件マッチ' },
                        { count: result.matchCount }
                      )}
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Chip
                      label={translate({ id: 'regex.result.noMatch', message: 'マッチなし' })}
                      size="small"
                      variant="outlined"
                    />
                  )}

                  <Chip
                    icon={<SpeedIcon />}
                    label={`${result.executionTimeMs} ms`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </div>

              {result.isTruncated && (
                <Box sx={{ mb: 1.5 }}>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Translate id="regex.warning.truncated" description="Truncated matches warning">
                      マッチ件数が上限（1,000件）に達したため、以降のマッチは省略されました。
                    </Translate>
                  </Alert>
                </Box>
              )}

              {/* アクションボタン（コピー） */}
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  disabled={!pattern}
                  onClick={handleCopyPattern}
                  sx={{ borderRadius: 2 }}
                >
                  <Translate id="regex.result.copyPattern" description="Copy full pattern">
                    パターンをコピー
                  </Translate>
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  disabled={!result.hasMatch}
                  onClick={handleCopyMatches}
                  sx={{ borderRadius: 2 }}
                >
                  <Translate id="regex.result.copyMatches" description="Copy all matched strings">
                    マッチ一覧をコピー
                  </Translate>
                </Button>
              </Stack>

              {/* ハイライト表示ビューア */}
              <div className={styles.highlightViewer}>
                {!text ? (
                  <div className={styles.emptyPlaceholder}>
                    <Translate id="regex.viewer.placeholder" description="Viewer empty placeholder">
                      テキストを入力すると、ここにマッチ箇所がハイライト表示されます。
                    </Translate>
                  </div>
                ) : (
                  result.segments.map((seg, idx) => {
                    if (!seg.isMatch) {
                      return <span key={idx}>{seg.text}</span>;
                    }
                    const isEven = (seg.matchNumber || 0) % 2 === 0;
                    const markClass = `${styles.matchMark} ${isEven ? styles.matchEven : styles.matchOdd}`;
                    const tooltipText = `Match #${seg.matchNumber}: "${seg.text}" [${seg.matchItem?.startIndex ?? 0} : ${seg.matchItem?.endIndex ?? 0}]`;
                    return (
                      <Tooltip key={idx} title={tooltipText} arrow placement="top">
                        <mark className={markClass}>{seg.text}</mark>
                      </Tooltip>
                    );
                  })
                )}
              </div>
            </div>

            {/* マッチ詳細・キャプチャグループ一覧カード */}
            {result.matches.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    <span className={styles.cardTitleIcon}>
                      <DataObjectIcon fontSize="small" />
                    </span>
                    <Translate id="regex.details.title" description="Match details and groups title">
                      マッチ詳細 & キャプチャグループ
                    </Translate>
                  </h3>
                  <Chip
                    label={`${result.matches.length} 件`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </div>

                <div className={styles.matchDetailsList}>
                  {result.matches.map((match) => (
                    <div key={match.matchIndex} className={styles.matchDetailCard}>
                      <div className={styles.matchDetailHeader}>
                        <div className={styles.matchTitleGroup}>
                          <Chip
                            label={`Match #${match.matchIndex}`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                          <span className={styles.matchRangeBadge}>
                            [{match.startIndex} : {match.endIndex}] ({match.matchedText.length}{' '}
                            <Translate id="regex.details.charsUnit" description="characters unit">
                              文字
                            </Translate>
                            )
                          </span>
                        </div>
                        <IconButton
                          size="small"
                          onClick={() => handleCopySingleMatch(match.matchedText)}
                          title={translate({ id: 'common.copy', message: 'コピー' })}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </div>

                      <div className={styles.matchTextPreview}>
                        <code>{match.matchedText}</code>
                      </div>

                      {match.groups.length > 0 && (
                        <div className={styles.groupsTable}>
                          {match.groups.map((group, gIdx) => (
                            <div key={gIdx} className={styles.groupRow}>
                              <span className={styles.groupKey}>{group.name}:</span>
                              {group.value !== undefined ? (
                                <span className={styles.groupVal}>{group.value}</span>
                              ) : (
                                <span className={`${styles.groupVal} ${styles.groupUndefined}`}>
                                  (undefined)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* クリップボードコピー通知 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MuiTheme>
  );
}
