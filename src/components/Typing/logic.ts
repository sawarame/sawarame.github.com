import { type TypingPassage } from './passages';

/**
 * 選択可能なタイピングコースの制限時間（秒）
 */
export type CourseDuration = 60 | 180;

/**
 * タイピングツールの画面フェーズ
 */
export type GamePhase = 'idle' | 'countdown' | 'playing' | 'result';

/**
 * CPM に基づくタイピングランク評価
 */
export type TypingRank = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * コース別の自己ベスト記録データ
 */
export interface BestRecord {
  /** 総消化文字数 */
  chars: number;
  /** 1分あたりの消化文字数（CPM） */
  cpm: number;
  /** 正答率（%） */
  accuracy: number;
  /** 完走文章数 */
  completedPassages: number;
  /** 達成日時（ISO 8601 形式） */
  achievedAt: string;
}

/**
 * コース秒数をキーとした自己ベスト記録マップ
 */
export type BestRecordsMap = Partial<Record<CourseDuration, BestRecord>>;

/**
 * Enter 提出時の判定結果
 */
export interface SubmitEvaluation {
  /** 入力が空だったかどうか（空の場合は統計計上しない） */
  isEmpty: boolean;
  /** 提出された文字数（NFC 正規化後のコードポイント数） */
  submittedChars: number;
  /** 未消化部分の先頭から連続して一致した文字数 */
  matchedLen: number;
  /** 先頭一致分を取り除いた入力欄の残余文字列 */
  remainingInput: string;
  /** 消化後の例文カーソル位置 */
  nextCursor: number;
  /** 現在の例文を最後まで消化し終えたかどうか */
  isPassageCompleted: boolean;
  /** 1文字も一致しなかった（不一致）かどうか */
  isMismatch: boolean;
}

/**
 * 結果画面で表示するスコア集計結果
 */
export interface TypingResultMetrics {
  /** 総消化文字数 */
  digestedChars: number;
  /** 総提出文字数 */
  submittedChars: number;
  /** 1分あたりの消化文字数（CPM） */
  cpm: number;
  /** 正答率（0〜100、小数第1位まで） */
  accuracy: number;
  /** 完走文章数 */
  completedPassages: number;
  /** ランク評価 */
  rank: TypingRank;
}

/**
 * LocalStorage に自己ベスト記録を保存するキー
 */
export const TYPING_BEST_STORAGE_KEY = 'sawara_typing_best_records_v1';

/**
 * 利用可能なコース一覧（秒）
 */
export const AVAILABLE_COURSES: readonly CourseDuration[] = [60, 180];

/**
 * デフォルトのコース時間（秒）
 */
export const DEFAULT_COURSE: CourseDuration = 60;

/**
 * Safari 等の compositionend 直後の Enter 誤判定を防ぐガード時間（ミリ秒）
 */
export const COMPOSITION_END_GUARD_MS = 30;

/**
 * 1文字（NFC 正規化済み）を比較用に正規化する
 * 全角英数字・全角 ASCII 記号（U+FF01〜U+FF5E）を半角（U+0021〜U+007E）へ、
 * 全角スペース（U+3000）を半角スペース（U+0020）へ変換する。
 * アルファベットの大文字・小文字および日本語文字はそのまま保持する。
 * @param char - NFC 正規化済みの1文字
 * @returns 比較用に正規化された1文字
 */
export function normalizeChar(char: string): string {
  if (char.length === 0) {
    return char;
  }
  const code = char.charCodeAt(0);
  // 全角スペースを半角スペースへ正規化
  if (code === 0x3000) {
    return ' ';
  }
  // 全角英数字・全角 ASCII 記号を半角へ正規化
  if (code >= 0xff01 && code <= 0xff5e) {
    return String.fromCharCode(code - 0xfee0);
  }
  return char;
}

/**
 * 文字列を Unicode NFC 正規化し、コードポイント単位の文字配列へ分解する
 * @param text - 対象の文字列
 * @returns NFC 正規化済みの1文字ずつの配列
 */
export function splitNfcChars(text: string): string[] {
  return Array.from(text.normalize('NFC'));
}

/**
 * 文字列全体を比較用に正規化する（NFC 正規化＋半角・全角統一）
 * @param text - 対象の文字列
 * @returns 比較用に正規化された文字列
 */
export function normalizeText(text: string): string {
  return splitNfcChars(text).map(normalizeChar).join('');
}

/**
 * 変換確定後の入力文字列を現在の例文の未消化部分と先頭一致比較し、消化結果を算出する
 * @param passageText - 現在の課題例文テキスト
 * @param cursor - 現在の消化済み位置（NFC コードポイント単位）
 * @param rawInput - 入力欄の文字列
 * @returns 消化文字数・残余文字列・完走有無などを含む判定結果
 */
export function evaluateSubmission(
  passageText: string,
  cursor: number,
  rawInput: string
): SubmitEvaluation {
  const inputChars = splitNfcChars(rawInput);

  // 空入力での Enter は何もせず統計にも計上しない
  if (inputChars.length === 0) {
    return {
      isEmpty: true,
      submittedChars: 0,
      matchedLen: 0,
      remainingInput: '',
      nextCursor: cursor,
      isPassageCompleted: false,
      isMismatch: false,
    };
  }

  const passageChars = splitNfcChars(passageText);
  const safeCursor = Math.max(0, Math.min(cursor, passageChars.length));
  const remainingPassageLen = passageChars.length - safeCursor;
  const maxCompareLen = Math.min(remainingPassageLen, inputChars.length);

  // 未消化部分の先頭から1文字ずつ正規化比較して最長一致プレフィックス長を求める
  let matchedLen = 0;
  for (let i = 0; i < maxCompareLen; i += 1) {
    if (normalizeChar(passageChars[safeCursor + i]) === normalizeChar(inputChars[i])) {
      matchedLen += 1;
    } else {
      break;
    }
  }

  const nextCursor = safeCursor + matchedLen;
  const remainingInput = inputChars.slice(matchedLen).join('');

  return {
    isEmpty: false,
    submittedChars: inputChars.length,
    matchedLen,
    remainingInput,
    nextCursor,
    isPassageCompleted: nextCursor >= passageChars.length,
    isMismatch: matchedLen === 0,
  };
}

/**
 * IME 変換状態に基づいて Enter キーイベントを判定対象から除外すべきか判定する
 * @param params - キーイベントと IME 状態に関する情報
 * @returns 変換確定操作として判定をスキップすべき場合は true
 */
export function shouldIgnoreEnterKey(params: {
  key: string;
  isNativeComposing: boolean;
  isComposingRef: boolean;
  keyCode?: number;
  nowMs: number;
  lastCompositionEndMs: number;
}): boolean {
  if (params.key !== 'Enter') {
    return true;
  }
  if (params.isNativeComposing || params.isComposingRef || params.keyCode === 229) {
    return true;
  }
  // Safari 等で compositionend 直後に発火する変換確定 Enter を誤判定しないよう保護
  if (
    params.lastCompositionEndMs > 0 &&
    params.nowMs - params.lastCompositionEndMs < COMPOSITION_END_GUARD_MS
  ) {
    return true;
  }
  return false;
}

/**
 * 総消化文字数とコース秒数から CPM（1分あたりの消化文字数）を算出する
 * @param digestedChars - 総消化文字数
 * @param courseSeconds - コースの制限時間（秒）
 * @returns 四捨五入された CPM 値
 */
export function calculateCpm(digestedChars: number, courseSeconds: CourseDuration): number {
  if (digestedChars <= 0 || courseSeconds <= 0) {
    return 0;
  }
  return Math.round((digestedChars * 60) / courseSeconds);
}

/**
 * 総消化文字数と総提出文字数から正答率（%）を算出する
 * @param digestedChars - 総消化文字数
 * @param submittedChars - 空 Enter を除く総提出文字数
 * @returns 0〜100 の正答率（小数第1位で丸め、提出 0 の場合は 0）
 */
export function calculateAccuracy(digestedChars: number, submittedChars: number): number {
  if (submittedChars <= 0 || digestedChars <= 0) {
    return 0;
  }
  const raw = (digestedChars / submittedChars) * 100;
  const clamped = Math.min(100, Math.max(0, raw));
  return Math.round(clamped * 10) / 10;
}

/**
 * CPM に応じたランク評価（S / A / B / C / D）を判定する
 * @param cpm - 1分あたりの消化文字数
 * @returns 判定されたランク
 */
export function determineRank(cpm: number): TypingRank {
  if (cpm >= 200) return 'S';
  if (cpm >= 150) return 'A';
  if (cpm >= 100) return 'B';
  if (cpm >= 60) return 'C';
  return 'D';
}

/**
 * プレイ終了時の各種統計指標をまとめて算出する
 * @param params - 消化文字数・提出文字数・完走文章数・コース秒数
 * @returns 結果画面向けの統計指標オブジェクト
 */
export function computeResultMetrics(params: {
  digestedChars: number;
  submittedChars: number;
  completedPassages: number;
  courseSeconds: CourseDuration;
}): TypingResultMetrics {
  const cpm = calculateCpm(params.digestedChars, params.courseSeconds);
  const accuracy = calculateAccuracy(params.digestedChars, params.submittedChars);
  const rank = determineRank(cpm);

  return {
    digestedChars: params.digestedChars,
    submittedChars: params.submittedChars,
    cpm,
    accuracy,
    completedPassages: params.completedPassages,
    rank,
  };
}

/**
 * 例文配列を Fisher-Yates 法で重複なくシャッフルする
 * 再シャッフル時に直前の末尾例文が先頭へ連続しないよう調整する
 * @param passages - 元の例文配列
 * @param previousLastId - 直前サイクルの最後に表示した例文ID（任意）
 * @param rng - 0以上1未満の乱数を返す関数（テスト用に差し替え可能）
 * @returns シャッフルされた新しい例文配列
 */
export function shufflePassages(
  passages: readonly TypingPassage[],
  previousLastId?: string,
  rng: () => number = Math.random
): TypingPassage[] {
  const list = [...passages];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }

  // 全件巡回後の再シャッフルで同一例文が連続することを回避
  if (previousLastId && list.length > 1 && list[0].id === previousLastId) {
    const swapIndex = list.length - 1;
    const temp = list[0];
    list[0] = list[swapIndex];
    list[swapIndex] = temp;
  }

  return list;
}

/**
 * URL クエリ文字列からコース秒数を安全に復元する
 * @param search - `location.search` 文字列（例: "?course=180"）
 * @returns 有効なコース秒数（不正値または未指定時は 60）
 */
export function parseCourseFromSearch(search: string): CourseDuration {
  const params = new URLSearchParams(search);
  const raw = params.get('course');
  if (raw === '180') {
    return 180;
  }
  return DEFAULT_COURSE;
}

/**
 * 既存の URL クエリパラメータを保持しつつ course パラメータを更新したクエリ文字列を返す
 * @param currentSearch - 現在の `location.search`
 * @param course - 設定するコース秒数
 * @returns `?` を除いたクエリ文字列（例: "course=180"）
 */
export function buildCourseSearch(currentSearch: string, course: CourseDuration): string {
  const params = new URLSearchParams(currentSearch);
  params.set('course', String(course));
  return params.toString();
}

/**
 * 任意オブジェクトが有効な BestRecord 形式かどうかを検証する
 * @param value - 検証対象の値
 * @returns 有効な BestRecord であれば true
 */
function isValidBestRecord(value: unknown): value is BestRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.chars === 'number' &&
    Number.isFinite(candidate.chars) &&
    candidate.chars >= 0 &&
    typeof candidate.cpm === 'number' &&
    Number.isFinite(candidate.cpm) &&
    candidate.cpm >= 0 &&
    typeof candidate.accuracy === 'number' &&
    Number.isFinite(candidate.accuracy) &&
    candidate.accuracy >= 0 &&
    typeof candidate.completedPassages === 'number' &&
    Number.isFinite(candidate.completedPassages) &&
    candidate.completedPassages >= 0 &&
    typeof candidate.achievedAt === 'string'
  );
}

/**
 * LocalStorage からコース別の自己ベスト記録を安全に読み込む
 * @param storage - 参照する Storage インスタンス（省略時はブラウザの localStorage）
 * @returns 読み込まれた自己ベスト記録マップ
 */
export function loadBestRecords(storage?: Storage): BestRecordsMap {
  try {
    const targetStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!targetStorage) {
      return {};
    }
    const raw = targetStorage.getItem(TYPING_BEST_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    const parsedObj = parsed as Record<string, unknown>;
    const result: BestRecordsMap = {};
    for (const course of AVAILABLE_COURSES) {
      const candidate = parsedObj[String(course)];
      if (isValidBestRecord(candidate)) {
        result[course] = candidate;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * 今回の結果でコース別自己ベストが更新されたか判定し、更新時のみ LocalStorage へ保存する
 * @param course - 対象コース秒数
 * @param currentRecord - 今回のプレイ記録
 * @param storage - 保存先の Storage インスタンス（省略時はブラウザの localStorage）
 * @returns 更新後の自己ベストマップ、新記録フラグ、更新前の自己ベスト
 */
export function saveBestRecordIfImproved(
  course: CourseDuration,
  currentRecord: BestRecord,
  storage?: Storage
): {
  records: BestRecordsMap;
  isNewBest: boolean;
  previousBest: BestRecord | null;
} {
  const existingRecords = loadBestRecords(storage);
  const previousBest = existingRecords[course] ?? null;
  const isNewBest =
    currentRecord.chars > 0 && (!previousBest || currentRecord.chars > previousBest.chars);

  if (!isNewBest) {
    return {
      records: existingRecords,
      isNewBest: false,
      previousBest,
    };
  }

  const nextRecords: BestRecordsMap = {
    ...existingRecords,
    [course]: currentRecord,
  };

  try {
    const targetStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (targetStorage) {
      targetStorage.setItem(TYPING_BEST_STORAGE_KEY, JSON.stringify(nextRecords));
    }
  } catch {
    // プライベートブラウズや容量上限などによる保存失敗時はアプリ動作を止めない
  }

  return {
    records: nextRecords,
    isNewBest: true,
    previousBest,
  };
}

/**
 * 残り秒数（ミリ秒）を表示用の MM:SS 形式へフォーマットする
 * @param remainingMs - 残り時間（ミリ秒）
 * @returns "01:00" のような分:秒フォーマット文字列
 */
export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
