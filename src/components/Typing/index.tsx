import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import { Box, Button, Chip, CircularProgress, LinearProgress } from '@mui/material';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  FileCheck2,
  Info,
  Keyboard,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Target,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import MuiTheme from '@site/src/components/MuiTheme';
import { TYPING_PASSAGES, type TypingGenre, type TypingPassage } from './passages';
import {
  AVAILABLE_COURSES,
  DEFAULT_COURSE,
  TYPING_VERSION,
  buildTypingShareText,
  computeResultMetrics,
  evaluateInputPreview,
  evaluateSubmission,
  formatRemainingTime,
  getTypingDeviceInfo,
  loadBestRecords,
  saveBestRecordIfImproved,
  shouldIgnoreEnterKey,
  shufflePassages,
  splitNfcChars,
  type BestRecord,
  type BestRecordsMap,
  type CourseDuration,
  type GamePhase,
  type TypingRank,
  type TypingResultMetrics,
} from './logic';
import styles from './styles.module.css';

/**
 * プレイ中のフィードバック表示データ
 */
interface FeedbackState {
  /** フィードバック種別 */
  type: 'success' | 'warning' | 'error';
  /** 表示メッセージ */
  message: string;
  /** アニメーション再トリガー用の一意キー */
  key: number;
}

/**
 * 結果画面で保持するセッション結果データ
 */
interface SessionOutcome {
  /** 集計されたスコア指標 */
  metrics: TypingResultMetrics;
  /** 今回自己ベストを更新したかどうか */
  isNewBest: boolean;
  /** 更新前の自己ベスト記録 */
  previousBest: BestRecord | null;
  /** 今回対象となったコース秒数 */
  course: CourseDuration;
}

/**
 * ジャンルに応じた多言語ラベルを返す
 * @param genre - 例文ジャンル
 * @returns ローカライズされたジャンル名
 */
function getGenreLabel(genre: TypingGenre): string {
  switch (genre) {
    case 'business':
      return translate({ id: 'typing.genre.business', message: 'ビジネス' });
    case 'tech':
      return translate({ id: 'typing.genre.tech', message: 'IT・開発' });
    case 'news':
      return translate({ id: 'typing.genre.news', message: 'ニュース・コラム' });
    case 'daily':
      return translate({ id: 'typing.genre.daily', message: '日常・教養' });
  }
}

/**
 * ランクに応じた評価コメントを返す
 * @param rank - 算出されたランク
 * @returns ローカライズされたランク説明文
 */
function getRankDescription(rank: TypingRank): string {
  switch (rank) {
    case 'S':
      return translate({
        id: 'typing.result.rankDesc.S',
        message: 'エキスパート級！変換込みで驚異的なスピードと正確さです。',
      });
    case 'A':
      return translate({
        id: 'typing.result.rankDesc.A',
        message: '上級レベル！実務でも極めて高い入力パフォーマンスです。',
      });
    case 'B':
      return translate({
        id: 'typing.result.rankDesc.B',
        message: '実務レベル！安定した変換とテンポで入力できています。',
      });
    case 'C':
      return translate({
        id: 'typing.result.rankDesc.C',
        message: '標準レベル！変換確定のリズムを掴むとさらに伸びます。',
      });
    case 'D':
      return translate({
        id: 'typing.result.rankDesc.D',
        message: '入門レベル！焦らず一文節ずつ正確に確定してみましょう。',
      });
  }
}

/**
 * ランクに対応する CSS モジュールクラス名を返す
 * @param rank - 算出されたランク
 * @returns ランクバッジ用クラス名
 */
function getRankClassName(rank: TypingRank): string {
  switch (rank) {
    case 'S':
      return styles.rankS;
    case 'A':
      return styles.rankA;
    case 'B':
      return styles.rankB;
    case 'C':
      return styles.rankC;
    case 'D':
      return styles.rankD;
  }
}

/**
 * コース秒数に応じた多言語表示名を返す
 * @param course - コース秒数
 * @returns コース名文字列
 */
function getCourseLabel(course: CourseDuration): string {
  return course === 60
    ? translate({ id: 'typing.course.1min', message: '1分コース' })
    : translate({ id: 'typing.course.3min', message: '3分コース' });
}

/**
 * 共有用スコア画像生成に必要なパラメータ
 */
export interface TypingResultImageParams {
  /** 集計されたスコア指標 */
  metrics: TypingResultMetrics;
  /** プレイしたコース秒数 */
  course: CourseDuration;
  /** 自己ベストを更新したかどうか */
  isNewBest: boolean;
  /** 表示するツールバージョン（省略時は TYPING_VERSION） */
  version?: string;
  /** 表示するデバイス情報文字列（省略時は getTypingDeviceInfo()） */
  deviceInfo?: string;
}

/**
 * Canvas 2D コンテキストへ角丸矩形のパスを描画する
 * @param ctx - Canvas 2D コンテキスト
 * @param x - 左上 X 座標
 * @param y - 左上 Y 座標
 * @param width - 幅
 * @param height - 高さ
 * @param radius - 角丸半径
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Canvas 上で指定幅に収まるように文字列を折り返して描画する
 * @param ctx - Canvas 2D コンテキスト
 * @param text - 描画する文字列
 * @param x - 描画開始 X 座標
 * @param startY - 1行目の Y 座標
 * @param maxWidth - 1行の最大幅（px）
 * @param lineHeight - 行送り高さ（px）
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): void {
  let line = '';
  let yPos = startY;
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i += 1) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line, x, yPos);
      line = chars[i];
      yPos += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, yPos);
  }
}

/**
 * ランクに応じた Canvas グラデーション用カラーペアを返す
 * @param rank - 算出されたランク
 * @returns [開始色, 終了色] のタプル
 */
function getRankGradientColors(rank: TypingRank): [string, string] {
  switch (rank) {
    case 'S':
      return ['#f59e0b', '#ef4444'];
    case 'A':
      return ['#667eea', '#764ba2'];
    case 'B':
      return ['#0ea5e9', '#2563eb'];
    case 'C':
      return ['#10b981', '#059669'];
    case 'D':
      return ['#64748b', '#475569'];
  }
}

/**
 * 日本語変換タイピングの結果共有用スコア画像（PNG）をブラウザ内の Canvas で生成する
 * @param params - スコア・コース・バージョン・デバイス情報を含む生成パラメータ
 * @returns 生成された PNG 画像の Blob（非ブラウザ環境や Canvas 初期化失敗時は null）
 */
export async function generateTypingResultImage(
  params: TypingResultImageParams
): Promise<Blob | null> {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const versionText = `v${params.version ?? TYPING_VERSION}`;
  const deviceInfoText = params.deviceInfo ?? getTypingDeviceInfo();
  const titleText = translate({
    id: 'typing.share.title',
    message: '日本語変換タイピング結果',
  });
  const courseText = getCourseLabel(params.course);
  const totalDigestedLabel = translate({
    id: 'typing.result.totalDigested',
    message: '総消化文字数',
  });
  const charsUnit = translate({ id: 'typing.best.charsUnit', message: '文字' });
  const cpmLabel = translate({ id: 'typing.result.cpm', message: 'CPM（文字/分）' });
  const passagesLabel = translate({
    id: 'typing.result.completedPassages',
    message: '完走文章数',
  });
  const passagesUnit = translate({ id: 'typing.best.passagesUnit', message: '本' });
  const newBestLabel = translate({ id: 'typing.result.newBest', message: 'NEW BEST!' });
  const rankDescText = getRankDescription(params.metrics.rank);

  // 背景グラデーション（Web快適度測定と同系統のダークトーン）
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#1a1a1a');
  bgGrad.addColorStop(1, '#2d2d2d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // ブランディング用オーブ装飾
  ctx.globalAlpha = 0.28;
  const orb1 = ctx.createRadialGradient(180, 90, 0, 180, 90, 440);
  orb1.addColorStop(0, '#667eea');
  orb1.addColorStop(1, 'transparent');
  ctx.fillStyle = orb1;
  ctx.beginPath();
  ctx.arc(180, 90, 440, 0, Math.PI * 2);
  ctx.fill();

  const orb2 = ctx.createRadialGradient(1040, 560, 0, 1040, 560, 380);
  orb2.addColorStop(0, '#ff0844');
  orb2.addColorStop(1, 'transparent');
  ctx.fillStyle = orb2;
  ctx.beginPath();
  ctx.arc(1040, 560, 380, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // ヘッダー左: ブランド・タイトル・バージョン・コースバッジ
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('sawara.me', 60, 58);

  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(titleText, 60, 112);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(versionText, 60, 148);

  const versionWidth = ctx.measureText(versionText).width;
  const coursePillX = 60 + versionWidth + 16;
  const coursePillY = 124;
  ctx.font = 'bold 18px sans-serif';
  const coursePillW = Math.max(108, ctx.measureText(courseText).width + 28);
  const coursePillH = 30;
  ctx.fillStyle = 'rgba(102, 126, 234, 0.28)';
  ctx.strokeStyle = 'rgba(102, 126, 234, 0.7)';
  ctx.lineWidth = 1.5;
  drawRoundedRectPath(ctx, coursePillX, coursePillY, coursePillW, coursePillH, 15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0e7ff';
  ctx.textAlign = 'center';
  ctx.fillText(courseText, coursePillX + coursePillW / 2, coursePillY + 21);
  ctx.textAlign = 'left';

  // ヘッダー右: デバイス情報
  if (deviceInfoText) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(deviceInfoText, 1140, 58);
    ctx.textAlign = 'left';
  }

  // メイン結果カード
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  drawRoundedRectPath(ctx, 60, 176, 1080, 392, 24);
  ctx.fill();
  ctx.stroke();

  // ランクバッジ
  const badgeX = 100;
  const badgeY = 214;
  const badgeSize = 148;
  const [rankStart, rankEnd] = getRankGradientColors(params.metrics.rank);
  const badgeGrad = ctx.createLinearGradient(
    badgeX,
    badgeY,
    badgeX + badgeSize,
    badgeY + badgeSize
  );
  badgeGrad.addColorStop(0, rankStart);
  badgeGrad.addColorStop(1, rankEnd);
  ctx.fillStyle = badgeGrad;
  drawRoundedRectPath(ctx, badgeX, badgeY, badgeSize, badgeSize, 24);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RANK', badgeX + badgeSize / 2, badgeY + 42);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 76px sans-serif';
  ctx.fillText(params.metrics.rank, badgeX + badgeSize / 2, badgeY + 120);
  ctx.textAlign = 'left';

  // メインスコア（総消化文字数）＋ NEW BEST バッジ
  const scoreX = 286;
  ctx.fillStyle = '#bbbbbb';
  ctx.font = '24px sans-serif';
  ctx.fillText(totalDigestedLabel, scoreX, 244);

  if (params.isNewBest) {
    const labelWidth = ctx.measureText(totalDigestedLabel).width;
    const nbX = scoreX + labelWidth + 16;
    const nbY = 220;
    ctx.font = 'bold 16px sans-serif';
    const nbW = Math.max(106, ctx.measureText(newBestLabel).width + 24);
    const nbH = 28;
    const nbGrad = ctx.createLinearGradient(nbX, nbY, nbX + nbW, nbY + nbH);
    nbGrad.addColorStop(0, '#f59e0b');
    nbGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = nbGrad;
    drawRoundedRectPath(ctx, nbX, nbY, nbW, nbH, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(newBestLabel, nbX + nbW / 2, nbY + 20);
    ctx.textAlign = 'left';
  }

  const scoreValueText = params.metrics.digestedChars.toLocaleString();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText(scoreValueText, scoreX, 332);
  const scoreValueWidth = ctx.measureText(scoreValueText).width;

  ctx.fillStyle = '#cccccc';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(charsUnit, scoreX + scoreValueWidth + 12, 328);

  // ランク評価コメント
  ctx.fillStyle = '#bbbbbb';
  ctx.font = '20px sans-serif';
  drawWrappedText(ctx, rankDescText, scoreX, 372, 810, 28);

  // カード内区切り線
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, 424);
  ctx.lineTo(1100, 424);
  ctx.stroke();

  // 下段サブ指標（CPM / 完走文章数）
  const subCards = [
    {
      x: 100,
      label: cpmLabel,
      value: params.metrics.cpm.toLocaleString(),
    },
    {
      x: 614,
      label: passagesLabel,
      value: `${params.metrics.completedPassages.toLocaleString()}${passagesUnit}`,
    },
  ];

  for (const card of subCards) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    drawRoundedRectPath(ctx, card.x, 446, 486, 96, 16);
    ctx.fill();

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px sans-serif';
    ctx.fillText(card.label, card.x + 24, 480);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(card.value, card.x + 24, 526);
  }

  // フッター URL
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '20px sans-serif';
  ctx.fillText('https://sawara.me/typing', 60, 604);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * 変換確定ベースの日本語長文タイピングツール本体コンポーネント
 * @returns タイピングツールの JSX 要素
 */
function TypingToolContent(): JSX.Element {
  // コース・画面フェーズ状態
  const [course, setCourse] = useState<CourseDuration>(DEFAULT_COURSE);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [countdown, setCountdown] = useState<number>(3);

  // 自己ベスト記録（LocalStorage から復元）
  const [bestRecords, setBestRecords] = useState<BestRecordsMap>({});

  // プレイ中の状態
  const [deck, setDeck] = useState<TypingPassage[]>(() => [...TYPING_PASSAGES]);
  const [deckIndex, setDeckIndex] = useState<number>(0);
  const [cursor, setCursor] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [digestedChars, setDigestedChars] = useState<number>(0);
  const [completedPassages, setCompletedPassages] = useState<number>(0);
  const [remainingMs, setRemainingMs] = useState<number>(course * 1000);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isInputError, setIsInputError] = useState<boolean>(false);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isComposing, setIsComposing] = useState<boolean>(false);

  // 結果画面の状態
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  // スタート／リトライ／もう一度押下時にタイピング領域へスクロールするためのトリガーカウンタ
  const [scrollRequestCount, setScrollRequestCount] = useState<number>(0);

  // タイマー・IME・スクロール同期・最新スコア／入力状態参照用 Ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const isComposingRef = useRef<boolean>(false);
  const lastCompositionEndMsRef = useRef<number>(0);
  const endTimeMsRef = useRef<number>(0);
  const hasFinishedRef = useRef<boolean>(false);
  const digestedCharsRef = useRef<number>(0);
  const completedPassagesRef = useRef<number>(0);
  const currentPassageTextRef = useRef<string>(TYPING_PASSAGES[0].text);
  const cursorRef = useRef<number>(0);
  const inputValueRef = useRef<string>('');
  const feedbackSeqRef = useRef<number>(0);

  // クライアントマウント時に LocalStorage から自己ベストを読み込む
  useEffect(() => {
    setBestRecords(loadBestRecords());
  }, []);

  /**
   * タイピング領域のコンテナ上端へスムーズスクロールする
   * prefers-reduced-motion が有効な場合は即時スクロールし、未対応環境では安全にスキップする
   */
  const scrollToTypingArea = useCallback(() => {
    const containerEl = containerRef.current;
    if (!containerEl || typeof containerEl.scrollIntoView !== 'function') {
      return;
    }
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    containerEl.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  // セッション開始（スタート／リトライ／もう一度）の描画コミット後にタイピング領域へスクロールする
  useEffect(() => {
    if (scrollRequestCount === 0) {
      return;
    }
    scrollToTypingArea();
  }, [scrollRequestCount, scrollToTypingArea]);

  /**
   * 選択コースを更新する（URL クエリパラメータは変更しない）
   * @param nextCourse - 新たに選択するコース秒数
   */
  const handleSelectCourse = useCallback((nextCourse: CourseDuration) => {
    setCourse(nextCourse);
    setRemainingMs(nextCourse * 1000);
  }, []);

  /**
   * フィードバック表示を更新する
   * @param type - フィードバック種別
   * @param message - 表示するメッセージ
   */
  const pushFeedback = useCallback((type: FeedbackState['type'], message: string) => {
    feedbackSeqRef.current += 1;
    setFeedback({ type, message, key: feedbackSeqRef.current });
  }, []);

  /**
   * 制限時間終了時に未送信の入力文字も含めて最終スコアを集計し、結果画面へ遷移する
   * IME 変換中かどうかにかかわらず、入力欄に残っている文字列を通常の先頭一致判定で自動集計する
   */
  const finishSession = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }
    hasFinishedRef.current = true;

    // タイムアップ時点で入力欄に未送信の文字列が残っていれば自動で先頭一致判定・集計を行う
    const pendingInput = inputRef.current ? inputRef.current.value : inputValueRef.current;
    const finalEvaluation = evaluateSubmission(
      currentPassageTextRef.current,
      cursorRef.current,
      pendingInput
    );

    if (!finalEvaluation.isEmpty && finalEvaluation.matchedLen > 0) {
      digestedCharsRef.current += finalEvaluation.matchedLen;
      setDigestedChars(digestedCharsRef.current);
      if (finalEvaluation.isPassageCompleted) {
        completedPassagesRef.current += 1;
        setCompletedPassages(completedPassagesRef.current);
      }
    }

    // 結果画面遷移前に入力状態と IME 状態をリセット
    inputValueRef.current = '';
    isComposingRef.current = false;
    setInputValue('');
    setIsComposing(false);

    const metrics = computeResultMetrics({
      digestedChars: digestedCharsRef.current,
      completedPassages: completedPassagesRef.current,
      courseSeconds: course,
    });

    const currentRecord: BestRecord = {
      chars: metrics.digestedChars,
      cpm: metrics.cpm,
      completedPassages: metrics.completedPassages,
      achievedAt: new Date().toISOString(),
    };

    const { records, isNewBest, previousBest } = saveBestRecordIfImproved(
      course,
      currentRecord
    );

    setBestRecords(records);
    setOutcome({
      metrics,
      isNewBest,
      previousBest,
      course,
    });
    setRemainingMs(0);
    setIsSharing(false);
    setPhase('result');
  }, [course]);

  /**
   * 新しいセッションを初期化して 3 秒カウントダウンを開始し、タイピング領域へスクロールする
   */
  const startCountdown = useCallback(() => {
    const shuffled = shufflePassages(TYPING_PASSAGES);
    hasFinishedRef.current = false;
    isComposingRef.current = false;
    lastCompositionEndMsRef.current = 0;
    digestedCharsRef.current = 0;
    completedPassagesRef.current = 0;
    currentPassageTextRef.current = (shuffled[0] ?? TYPING_PASSAGES[0]).text;
    cursorRef.current = 0;
    inputValueRef.current = '';

    setDeck(shuffled);
    setDeckIndex(0);
    setCursor(0);
    setInputValue('');
    setIsComposing(false);
    setDigestedChars(0);
    setCompletedPassages(0);
    setRemainingMs(course * 1000);
    setFeedback(null);
    setIsInputError(false);
    setIsShaking(false);
    setOutcome(null);
    setIsSharing(false);
    setCountdown(3);
    setPhase('countdown');
    setScrollRequestCount((prev) => prev + 1);
  }, [course]);

  /**
   * 進行中のカウントダウンまたはプレイを中断し、待機画面へ戻る
   */
  const handleAbortToIdle = useCallback(() => {
    hasFinishedRef.current = true;
    isComposingRef.current = false;
    cursorRef.current = 0;
    inputValueRef.current = '';
    setIsComposing(false);
    setInputValue('');
    setFeedback(null);
    setIsInputError(false);
    setIsShaking(false);
    setRemainingMs(course * 1000);
    setPhase('idle');
  }, [course]);

  // カウントダウン（3 -> 2 -> 1 -> プレイ開始）の制御
  useEffect(() => {
    if (phase !== 'countdown') {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown((prev) => prev - 1);
      } else {
        endTimeMsRef.current = performance.now() + course * 1000;
        setRemainingMs(course * 1000);
        setPhase('playing');
      }
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [phase, countdown, course]);

  // プレイ開始直後に入力欄へ自動フォーカスする（合わせたスクロール位置がズレないよう preventScroll を指定）
  useEffect(() => {
    if (phase !== 'playing') {
      return undefined;
    }
    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [phase]);

  // プレイ中の残り時間カウントダウン（実経過時間基準でズレを防止）
  useEffect(() => {
    if (phase !== 'playing') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const left = endTimeMsRef.current - performance.now();
      if (left <= 0) {
        window.clearInterval(intervalId);
        finishSession();
      } else {
        setRemainingMs(left);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [phase, finishSession]);

  const currentPassage = deck[deckIndex] ?? TYPING_PASSAGES[0];

  // 現在の例文を NFC コードポイント配列としてメモ化
  const passageChars = useMemo(
    () => splitNfcChars(currentPassage.text),
    [currentPassage.text]
  );

  /**
   * 現在の入力欄文字列を例文と照合して消化処理を実行する
   */
  const handleSubmitInput = useCallback(() => {
    if (phase !== 'playing' || hasFinishedRef.current) {
      return;
    }

    const evaluation = evaluateSubmission(currentPassage.text, cursor, inputValue);

    // 空 Enter は無視し、統計やエラー表示にも影響させない
    if (evaluation.isEmpty) {
      return;
    }

    if (evaluation.isMismatch) {
      // 1文字も一致しない場合は消化せず視覚フィードバックを表示し入力内容とフォーカスを残す
      setIsInputError(true);
      setShakeTrigger((prev) => prev + 1);
      setIsShaking(true);
      pushFeedback(
        'error',
        translate({
          id: 'typing.feedback.mismatch',
          message: '先頭が一致しません。入力内容を確認して再 Enter してください。',
        })
      );
      return;
    }

    // 先頭一致した文字数だけ消化を進める
    setIsInputError(false);
    setIsShaking(false);
    digestedCharsRef.current += evaluation.matchedLen;
    setDigestedChars(digestedCharsRef.current);
    inputValueRef.current = evaluation.remainingInput;
    setInputValue(evaluation.remainingInput);

    if (evaluation.isPassageCompleted) {
      // 例文を最後まで消化したら完走数を加算し、次の例文へ切り替える
      completedPassagesRef.current += 1;
      setCompletedPassages(completedPassagesRef.current);
      cursorRef.current = 0;
      setCursor(0);

      if (deckIndex + 1 < deck.length) {
        currentPassageTextRef.current = (deck[deckIndex + 1] ?? TYPING_PASSAGES[0]).text;
        setDeckIndex(deckIndex + 1);
      } else {
        // 全件消化したら直前末尾が連続しないよう再シャッフルして巡回継続
        const reshuffled = shufflePassages(TYPING_PASSAGES, currentPassage.id);
        currentPassageTextRef.current = (reshuffled[0] ?? TYPING_PASSAGES[0]).text;
        setDeck(reshuffled);
        setDeckIndex(0);
      }

      pushFeedback(
        'success',
        translate({
          id: 'typing.feedback.passageComplete',
          message: '文章を完走しました！次の例文へ進みます。',
        })
      );
      return;
    }

    cursorRef.current = evaluation.nextCursor;
    setCursor(evaluation.nextCursor);
    if (evaluation.remainingInput.length > 0) {
      pushFeedback(
        'warning',
        translate(
          {
            id: 'typing.feedback.matchedPartial',
            message: '{count}文字を消化しました（不一致の残りを修正して再 Enter）',
          },
          { count: evaluation.matchedLen }
        )
      );
    } else {
      pushFeedback(
        'success',
        translate(
          {
            id: 'typing.feedback.matchedAll',
            message: '{count}文字を消化しました',
          },
          { count: evaluation.matchedLen }
        )
      );
    }
  }, [phase, currentPassage, cursor, inputValue, deckIndex, deck.length, pushFeedback]);

  /**
   * 入力欄のキー押下ハンドラ（IME 変換中の Enter を除外して判定を実行）
   * @param event - キーボードイベント
   */
  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        shouldIgnoreEnterKey({
          key: event.key,
          isNativeComposing: event.nativeEvent.isComposing,
          isComposingRef: isComposingRef.current,
          keyCode: event.nativeEvent.keyCode,
          nowMs: performance.now(),
          lastCompositionEndMs: lastCompositionEndMsRef.current,
        })
      ) {
        return;
      }

      event.preventDefault();
      handleSubmitInput();
    },
    [handleSubmitInput]
  );

  /**
   * ペーストおよびドロップによる不正入力を防止するハンドラ
   * @param event - クリップボードまたはドラッグイベント
   */
  const handleBlockPasteOrDrop = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault();
      setIsInputError(true);
      setShakeTrigger((prev) => prev + 1);
      setIsShaking(true);
      pushFeedback(
        'error',
        translate({
          id: 'typing.feedback.pasteBlocked',
          message: 'ペーストおよびドラッグ＆ドロップによる入力は無効化されています。',
        })
      );
    },
    [pushFeedback]
  );

  /**
   * 結果スコア画像を生成し、Web Share API またはクリップボードコピー＋X投稿画面で共有する
   */
  const handleShareResult = useCallback(async () => {
    if (isSharing || !outcome) {
      return;
    }

    setIsSharing(true);
    try {
      const blob = await generateTypingResultImage({
        metrics: outcome.metrics,
        course: outcome.course,
        isNewBest: outcome.isNewBest,
      });
      if (!blob) {
        return;
      }

      const siteUrl = 'https://sawara.me/typing';
      const baseTextParams = {
        title: translate({
          id: 'typing.share.title',
          message: '日本語変換タイピング結果',
        }),
        courseLabel: getCourseLabel(outcome.course),
        rankLabel: translate({ id: 'typing.result.rank', message: 'ランク評価' }),
        rank: outcome.metrics.rank,
        charsLabel: translate({
          id: 'typing.result.totalDigested',
          message: '総消化文字数',
        }),
        digestedChars: outcome.metrics.digestedChars,
        charsUnit: translate({ id: 'typing.best.charsUnit', message: '文字' }),
        cpmLabel: translate({ id: 'typing.result.cpm', message: 'CPM（文字/分）' }),
        cpm: outcome.metrics.cpm,
        passagesLabel: translate({
          id: 'typing.result.completedPassages',
          message: '完走文章数',
        }),
        completedPassages: outcome.metrics.completedPassages,
        passagesUnit: translate({ id: 'typing.best.passagesUnit', message: '本' }),
      };

      const shareTextWithUrl = buildTypingShareText({ ...baseTextParams, url: siteUrl });
      const file = new File([blob], 'typing_result.png', { type: 'image/png' });

      // Web Share API（ファイル共有対応）が利用できる場合は OS 標準の共有シートを起動
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          text: shareTextWithUrl,
        });
      } else {
        // 非対応環境（PCブラウザ等）では画像をクリップボードへコピーした上で X 投稿画面を開く
        if (
          typeof ClipboardItem !== 'undefined' &&
          typeof navigator !== 'undefined' &&
          navigator.clipboard &&
          typeof navigator.clipboard.write === 'function'
        ) {
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            window.alert(
              translate({
                id: 'typing.share.alert',
                message:
                  '結果画像をクリップボードにコピーしました！\nX（Twitter）などの投稿画面に貼り付けて投稿してください。',
              })
            );
          } catch {
            // クリップボード権限拒否・非対応時はクラッシュさせず投稿画面のみ開く
          }
        }

        const intentText = buildTypingShareText(baseTextParams);
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(intentText)}&url=${encodeURIComponent(siteUrl)}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, outcome]);

  const timerProgress = Math.max(
    0,
    Math.min(100, (remainingMs / (course * 1000)) * 100)
  );
  const isTimeWarning = remainingMs <= 10_000;

  /**
   * 入力欄の横スクロール位置を背面の色分けミラーレイヤーへ同期する
   */
  const syncInputScroll = useCallback(() => {
    if (mirrorRef.current && inputRef.current) {
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, []);

  // 入力値や変換状態の変化時にも横スクロール位置を同期する
  useEffect(() => {
    syncInputScroll();
  }, [inputValue, isComposing, syncInputScroll]);

  // 入力欄内の送信前リアルタイム照合（合っている文字を緑、合っていない文字を赤で表示）
  const inputPreviewChars = useMemo(
    () => evaluateInputPreview(currentPassage.text, cursor, inputValue),
    [currentPassage.text, cursor, inputValue]
  );

  // 課題文を消化済み・現在位置・未消化に分割
  const digestedSegment = passageChars.slice(0, cursor).join('');
  const currentCharSegment = passageChars[cursor] ?? '';
  const remainingSegment = passageChars.slice(cursor + 1).join('');

  // IME 変換中でなく入力文字列がある場合に、入力欄内の文字を緑／赤オーバーレイ表示する
  const useColorOverlay = !isComposing && inputValue.length > 0;

  return (
    <div ref={containerRef} className={styles.container}>
      {phase === 'idle' && (
        <>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <Timer size={20} strokeWidth={2} />
              <Translate id="typing.course.label">コースを選択</Translate>
            </h2>

            <div className={styles.courseGrid}>
              {AVAILABLE_COURSES.map((duration) => {
                const isActive = course === duration;
                const record = bestRecords[duration];
                return (
                  <button
                    key={duration}
                    type="button"
                    className={`${styles.courseCard} ${isActive ? styles.courseCardActive : ''}`}
                    onClick={() => handleSelectCourse(duration)}
                    aria-pressed={isActive}
                  >
                    <div className={styles.courseCardHeader}>
                      <span className={styles.courseName}>{getCourseLabel(duration)}</span>
                      <Chip
                        size="small"
                        color={isActive ? 'primary' : 'default'}
                        variant={isActive ? 'filled' : 'outlined'}
                        label={
                          duration === 60
                            ? translate({
                                id: 'typing.course.1minSub',
                                message: '60秒・短期集中',
                              })
                            : translate({
                                id: 'typing.course.3minSub',
                                message: '180秒・長文持久',
                              })
                        }
                      />
                    </div>

                    <div className={styles.courseBestBox}>
                      <span>
                        <Trophy
                          size={14}
                          strokeWidth={2}
                          style={{ verticalAlign: '-2px', marginRight: 4 }}
                        />
                        <Translate id="typing.best.title">コース別自己ベスト</Translate>
                      </span>
                      {record ? (
                        <span className={styles.courseBestValue}>
                          {record.chars}
                          <Translate id="typing.best.charsUnit">文字</Translate> / {record.cpm}{' '}
                          CPM
                        </span>
                      ) : (
                        <span>
                          <Translate id="typing.best.noRecord">まだ記録がありません</Translate>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={styles.imeNotice} role="note">
              <Info size={18} strokeWidth={2} className={styles.imeNoticeIcon} aria-hidden="true" />
              <span>
                <Translate id="typing.idle.imeNotice">
                  スタートボタンを押す前に、日本語入力（IME）をONにしておいてください。
                </Translate>
              </span>
            </div>

            <div className={styles.startActionRow}>
              <Button
                variant="contained"
                size="large"
                className={styles.primaryGradientButton}
                startIcon={<Play size={20} strokeWidth={2} />}
                onClick={startCountdown}
              >
                <Translate id="typing.action.start">スタート</Translate>
              </Button>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <Keyboard size={20} strokeWidth={2} />
              <Translate id="typing.rules.title">遊び方・判定ルール</Translate>
            </h2>
            <ul className={styles.rulesList}>
              <li>
                <Translate id="typing.rules.item1">
                  日本語IMEで変換確定したあと、もう一度 Enter を押すと入力文字列を判定します。
                </Translate>
              </li>
              <li>
                <Translate id="typing.rules.item2">
                  送信前でも入力欄内の文字はリアルタイムに照合され、合っている文字は緑・合っていない文字は赤で表示されます。Enter 時は先頭一致分のみ消化され、不一致部分は入力欄に残ります。
                </Translate>
              </li>
              <li>
                <Translate id="typing.rules.item3">
                  英数字・記号・スペースの半角／全角、および「ー」と「-」は同一視されますが、アルファベットの大文字・小文字は厳密に区別されます。
                </Translate>
              </li>
              <li>
                <Translate id="typing.rules.item4">
                  出題例文は全ロケール共通で日本語長文が出題されます。ペーストおよびドロップ入力は無効です。
                </Translate>
              </li>
              <li>
                <Translate id="typing.rules.item5">
                  制限時間終了時に入力欄へ未送信の文字が残っている場合は、自動で判定（先頭一致分を加算）してスコアに集計されます。
                </Translate>
              </li>
            </ul>
          </section>
        </>
      )}

      {phase === 'countdown' && (
        <section className={`${styles.card} ${styles.countdownCard}`} aria-live="polite">
          <Chip color="primary" label={getCourseLabel(course)} />
          <div key={countdown} className={styles.countdownNumber}>
            {countdown}
          </div>
          <p className={styles.countdownSubtitle}>
            <Translate id="typing.countdown.ready">まもなくスタートします...</Translate>
          </p>
          <p className={styles.countdownHint}>
            <Translate id="typing.countdown.hint">
              開始と同時に自動で入力欄にフォーカスされます
            </Translate>
          </p>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<X size={16} strokeWidth={2} />}
            onClick={handleAbortToIdle}
            sx={{ mt: 1, borderRadius: 3, textTransform: 'none' }}
          >
            <Translate id="typing.action.cancel">中断して戻る</Translate>
          </Button>
        </section>
      )}

      {phase === 'playing' && (
        <>
          <section className={styles.card}>
            <div className={styles.passageHeader}>
              <div className={styles.passageMeta}>
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={getGenreLabel(currentPassage.genre)}
                />
                <span className={styles.passageTitle}>{currentPassage.title}</span>
              </div>
              <span className={styles.passageCounter}>
                <Translate id="typing.playing.passageProgress">進捗</Translate>: {cursor} /{' '}
                {passageChars.length}
              </span>
            </div>

            <div
              className={styles.passageBox}
              onClick={() => inputRef.current?.focus()}
              role="region"
              aria-label={currentPassage.title}
            >
              <span className={styles.charDigested}>{digestedSegment}</span>
              {currentCharSegment && (
                <span className={styles.charCurrent}>{currentCharSegment}</span>
              )}
              <span className={styles.charRemaining}>{remainingSegment}</span>
            </div>

            <Box className={styles.inputSection} sx={{ mt: 3 }}>
              <div className={styles.inputRow}>
                <div className={styles.inputWrap}>
                  <div
                    className={`${styles.richInputContainer} ${
                      isInputError ? styles.richInputContainerError : ''
                    } ${
                      isShaking
                        ? shakeTrigger % 2 === 1
                          ? styles.inputShakeA
                          : styles.inputShakeB
                        : ''
                    }`}
                    onAnimationEnd={() => setIsShaking(false)}
                  >
                    <div
                      ref={mirrorRef}
                      className={`${styles.richInputMirror} ${
                        useColorOverlay ? '' : styles.richInputMirrorHidden
                      }`}
                      aria-hidden="true"
                    >
                      {inputPreviewChars.map((item, idx) => (
                        <span
                          key={`${idx}-${item.isMatch ? 'm' : 'x'}`}
                          className={
                            item.isMatch ? styles.inputCharMatch : styles.inputCharMismatch
                          }
                        >
                          {item.char}
                        </span>
                      ))}
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      className={`${styles.richInputField} ${
                        useColorOverlay ? styles.richInputFieldOverlay : ''
                      }`}
                      value={inputValue}
                      aria-invalid={isInputError}
                      aria-label={translate({
                        id: 'typing.playing.inputPlaceholder',
                        message: '変換確定後に Enter で判定...',
                      })}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder={translate({
                        id: 'typing.playing.inputPlaceholder',
                        message: '変換確定後に Enter で判定...',
                      })}
                      onChange={(event) => {
                        inputValueRef.current = event.target.value;
                        setInputValue(event.target.value);
                        if (isInputError) {
                          setIsInputError(false);
                        }
                        syncInputScroll();
                      }}
                      onCompositionStart={() => {
                        isComposingRef.current = true;
                        setIsComposing(true);
                      }}
                      onCompositionEnd={() => {
                        isComposingRef.current = false;
                        lastCompositionEndMsRef.current = performance.now();
                        setIsComposing(false);
                        syncInputScroll();
                      }}
                      onKeyDown={handleInputKeyDown}
                      onKeyUp={syncInputScroll}
                      onScroll={syncInputScroll}
                      onClick={syncInputScroll}
                      onSelect={syncInputScroll}
                      onPaste={handleBlockPasteOrDrop}
                      onDrop={handleBlockPasteOrDrop}
                      onDragOver={(event) => event.preventDefault()}
                    />
                  </div>
                  <div className={styles.timerProgressWrap}>
                    <LinearProgress
                      variant="determinate"
                      value={timerProgress}
                      color={isTimeWarning ? 'error' : 'primary'}
                      aria-label={translate({
                        id: 'typing.playing.remainingTime',
                        message: '残り時間',
                      })}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </div>
                  <p className={styles.inputHelperText}>
                    {translate({
                      id: 'typing.playing.inputHelper',
                      message:
                        'IME変換確定の Enter では判定されません。確定後にもう一度 Enter で送信してください。',
                    })}
                  </p>
                </div>
                <Button
                  variant="contained"
                  color="primary"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    handleSubmitInput();
                    inputRef.current?.focus();
                  }}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    height: 56,
                    fontWeight: 700,
                    textTransform: 'none',
                    flexShrink: 0,
                  }}
                >
                  <Translate id="typing.playing.submitButton">判定 (Enter)</Translate>
                </Button>
              </div>

              <div className={styles.feedbackSlot} aria-live="polite">
                {feedback && (
                  <span
                    key={feedback.key}
                    className={`${styles.feedbackBadge} ${
                      feedback.type === 'success'
                        ? styles.feedbackSuccess
                        : feedback.type === 'warning'
                          ? styles.feedbackWarning
                          : styles.feedbackError
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 size={16} strokeWidth={2} />
                    ) : (
                      <AlertCircle size={16} strokeWidth={2} />
                    )}
                    {feedback.message}
                  </span>
                )}
              </div>
            </Box>
          </section>

          <section className={styles.card}>
            <div className={styles.statusBar}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <Timer size={15} strokeWidth={2} />
                  <Translate id="typing.playing.remainingTime">残り時間</Translate>
                </span>
                <span
                  className={`${styles.statValue} ${isTimeWarning ? styles.statValueWarning : ''}`}
                >
                  {formatRemainingTime(remainingMs)}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <Target size={15} strokeWidth={2} />
                  <Translate id="typing.playing.digestedChars">消化文字数</Translate>
                </span>
                <span className={styles.statValue}>{digestedChars}</span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>
                  <FileCheck2 size={15} strokeWidth={2} />
                  <Translate id="typing.playing.completedPassages">完走文章</Translate>
                </span>
                <span className={styles.statValue}>{completedPassages}</span>
              </div>
            </div>

            <Box className={styles.playingControls} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RotateCcw size={16} strokeWidth={2} />}
                onClick={startCountdown}
                sx={{ borderRadius: 3, textTransform: 'none' }}
              >
                <Translate id="typing.action.retry">リトライ</Translate>
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<X size={16} strokeWidth={2} />}
                onClick={handleAbortToIdle}
                sx={{ borderRadius: 3, textTransform: 'none' }}
              >
                <Translate id="typing.action.abort">中断</Translate>
              </Button>
            </Box>
          </section>
        </>
      )}

      {phase === 'result' && outcome && (
        <section className={styles.card}>
          <div className={styles.resultHeader}>
            <div className={styles.resultHero}>
              <div className={`${styles.rankBadge} ${getRankClassName(outcome.metrics.rank)}`}>
                <span className={styles.rankBadgeLabel}>RANK</span>
                <span className={styles.rankBadgeValue}>{outcome.metrics.rank}</span>
              </div>

              <div className={styles.resultScoreBlock}>
                <div className={styles.resultTitleRow}>
                  <h2 className={styles.resultHeading}>
                    <Translate id="typing.result.title">タイムアップ！結果発表</Translate>
                  </h2>
                  <Chip size="small" color="primary" label={getCourseLabel(outcome.course)} />
                  {outcome.isNewBest && (
                    <span className={styles.newBestBadge}>
                      <Sparkles size={14} strokeWidth={2} />
                      <Translate id="typing.result.newBest">NEW BEST!</Translate>
                    </span>
                  )}
                </div>

                <div className={styles.mainScoreRow}>
                  <span className={styles.mainScoreValue}>{outcome.metrics.digestedChars}</span>
                  <span className={styles.mainScoreUnit}>
                    <Translate id="typing.best.charsUnit">文字</Translate>（
                    <Translate id="typing.result.totalDigested">総消化文字数</Translate>）
                  </span>
                </div>

                <p className={styles.rankDescription}>
                  {getRankDescription(outcome.metrics.rank)}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                <Award size={15} strokeWidth={2} />
                <Translate id="typing.result.cpm">CPM（文字/分）</Translate>
              </span>
              <span className={styles.statValue}>{outcome.metrics.cpm}</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                <FileCheck2 size={15} strokeWidth={2} />
                <Translate id="typing.result.completedPassages">完走文章数</Translate>
              </span>
              <span className={styles.statValue}>
                {outcome.metrics.completedPassages}
                <Translate id="typing.best.passagesUnit">本</Translate>
              </span>
            </div>
          </div>

          <div className={styles.bestComparisonBox}>
            <div className={styles.bestComparisonText}>
              <Trophy size={18} strokeWidth={2} />
              <span>
                {outcome.metrics.digestedChars === 0 ? (
                  <Translate id="typing.result.noScore">
                    消化文字数が 0 のため自己ベストは更新されませんでした。
                  </Translate>
                ) : outcome.isNewBest && !outcome.previousBest ? (
                  <Translate id="typing.result.firstRecord">初回記録を保存しました！</Translate>
                ) : outcome.isNewBest && outcome.previousBest ? (
                  translate(
                    {
                      id: 'typing.result.beatBestBy',
                      message: '前回の自己ベスト（{prev}文字）を +{diff}文字 更新しました！',
                    },
                    {
                      prev: outcome.previousBest.chars,
                      diff: outcome.metrics.digestedChars - outcome.previousBest.chars,
                    }
                  )
                ) : outcome.previousBest &&
                  outcome.metrics.digestedChars === outcome.previousBest.chars ? (
                  translate(
                    {
                      id: 'typing.result.tiedBest',
                      message: '自己ベスト（{best}文字）と同点です！',
                    },
                    { best: outcome.previousBest.chars }
                  )
                ) : outcome.previousBest ? (
                  translate(
                    {
                      id: 'typing.result.diffFromBest',
                      message: '自己ベスト（{best}文字）まであと {diff}文字',
                    },
                    {
                      best: outcome.previousBest.chars,
                      diff: outcome.previousBest.chars - outcome.metrics.digestedChars,
                    }
                  )
                ) : null}
              </span>
            </div>
          </div>

          <div className={styles.resultActions}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={
                isSharing ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Share2 size={18} strokeWidth={2} />
                )
              }
              onClick={handleShareResult}
              disabled={isSharing}
              sx={{ borderRadius: 3, px: 3, py: 1.25, textTransform: 'none', fontWeight: 700 }}
            >
              <Translate id="typing.action.shareResult">結果を共有</Translate>
            </Button>

            <Button
              variant="contained"
              className={styles.primaryGradientButton}
              startIcon={<RotateCcw size={18} strokeWidth={2} />}
              onClick={startCountdown}
            >
              <Translate id="typing.action.playAgain">同じコースでもう一度</Translate>
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowLeft size={18} strokeWidth={2} />}
              onClick={handleAbortToIdle}
              sx={{ borderRadius: 3, px: 3, py: 1.25, textTransform: 'none', fontWeight: 600 }}
            >
              <Translate id="typing.action.backToSelect">コース選択へ戻る</Translate>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * MuiTheme でラップされた日本語変換タイピングツールコンポーネント
 * @returns テーマ同期済みのタイピングツール JSX 要素
 */
export default function TypingTool(): JSX.Element {
  return (
    <MuiTheme>
      <TypingToolContent />
    </MuiTheme>
  );
}
