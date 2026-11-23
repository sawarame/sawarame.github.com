import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import Translate, { translate } from '@docusaurus/Translate';
import { Box, Button, Chip, LinearProgress } from '@mui/material';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  Keyboard,
  Play,
  RotateCcw,
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
  buildCourseSearch,
  computeResultMetrics,
  evaluateInputPreview,
  evaluateSubmission,
  formatRemainingTime,
  loadBestRecords,
  parseCourseFromSearch,
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
 * 変換確定ベースの日本語長文タイピングツール本体コンポーネント
 * @returns タイピングツールの JSX 要素
 */
function TypingToolContent(): JSX.Element {
  const history = useHistory();
  const location = useLocation();

  // コース・画面フェーズ状態
  const [course, setCourse] = useState<CourseDuration>(() =>
    parseCourseFromSearch(location.search)
  );
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
  const [isComposing, setIsComposing] = useState<boolean>(false);

  // 結果画面の状態
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // タイマー・IME・スクロール同期・最新スコア参照用 Ref
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);
  const isComposingRef = useRef<boolean>(false);
  const lastCompositionEndMsRef = useRef<number>(0);
  const endTimeMsRef = useRef<number>(0);
  const hasFinishedRef = useRef<boolean>(false);
  const digestedCharsRef = useRef<number>(0);
  const submittedCharsRef = useRef<number>(0);
  const completedPassagesRef = useRef<number>(0);
  const feedbackSeqRef = useRef<number>(0);

  // クライアントマウント時に LocalStorage から自己ベストを読み込む
  useEffect(() => {
    setBestRecords(loadBestRecords());
  }, []);

  // URL クエリパラメータ変更時（ブラウザ戻る/進む等）に待機中のコースを同期
  useEffect(() => {
    const parsedCourse = parseCourseFromSearch(location.search);
    if (phase === 'idle' && parsedCourse !== course) {
      setCourse(parsedCourse);
      setRemainingMs(parsedCourse * 1000);
    }
  }, [location.search, phase, course]);

  /**
   * 選択コースを更新し、URL クエリパラメータへリアルタイム同期する
   * @param nextCourse - 新たに選択するコース秒数
   */
  const handleSelectCourse = useCallback(
    (nextCourse: CourseDuration) => {
      setCourse(nextCourse);
      setRemainingMs(nextCourse * 1000);
      const nextSearch = buildCourseSearch(location.search, nextCourse);
      history.replace({ search: nextSearch ? `?${nextSearch}` : '' });
    },
    [history, location.search]
  );

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
   * 制限時間終了時に現在の確定済みスコアを集計して結果画面へ遷移する
   * 未 Enter の入力欄テキストはスコアへ一切含めない
   */
  const finishSession = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }
    hasFinishedRef.current = true;

    const metrics = computeResultMetrics({
      digestedChars: digestedCharsRef.current,
      submittedChars: submittedCharsRef.current,
      completedPassages: completedPassagesRef.current,
      courseSeconds: course,
    });

    const currentRecord: BestRecord = {
      chars: metrics.digestedChars,
      cpm: metrics.cpm,
      accuracy: metrics.accuracy,
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
    setCopied(false);
    setPhase('result');
  }, [course]);

  /**
   * 新しいセッションを初期化して 3 秒カウントダウンを開始する
   */
  const startCountdown = useCallback(() => {
    const shuffled = shufflePassages(TYPING_PASSAGES);
    hasFinishedRef.current = false;
    isComposingRef.current = false;
    lastCompositionEndMsRef.current = 0;
    digestedCharsRef.current = 0;
    submittedCharsRef.current = 0;
    completedPassagesRef.current = 0;

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
    setOutcome(null);
    setCopied(false);
    setCountdown(3);
    setPhase('countdown');
  }, [course]);

  /**
   * 進行中のカウントダウンまたはプレイを中断し、待機画面へ戻る
   */
  const handleAbortToIdle = useCallback(() => {
    hasFinishedRef.current = true;
    isComposingRef.current = false;
    setIsComposing(false);
    setInputValue('');
    setFeedback(null);
    setIsInputError(false);
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

  // プレイ開始直後に入力欄へ自動フォーカスする
  useEffect(() => {
    if (phase !== 'playing') {
      return undefined;
    }
    const rafId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
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

    // 総提出文字数へ加算
    submittedCharsRef.current += evaluation.submittedChars;

    if (evaluation.isMismatch) {
      // 1文字も一致しない場合は消化せず視覚フィードバックを表示し入力内容は残す
      setIsInputError(true);
      setShakeTrigger((prev) => prev + 1);
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
    digestedCharsRef.current += evaluation.matchedLen;
    setDigestedChars(digestedCharsRef.current);
    setInputValue(evaluation.remainingInput);

    if (evaluation.isPassageCompleted) {
      // 例文を最後まで消化したら完走数を加算し、次の例文へ切り替える
      completedPassagesRef.current += 1;
      setCompletedPassages(completedPassagesRef.current);
      setCursor(0);

      if (deckIndex + 1 < deck.length) {
        setDeckIndex(deckIndex + 1);
      } else {
        // 全件消化したら直前末尾が連続しないよう再シャッフルして巡回継続
        const reshuffled = shufflePassages(TYPING_PASSAGES, currentPassage.id);
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
   * 結果テキストをクリップボードへコピーする
   */
  const handleCopyResult = useCallback(async () => {
    if (!outcome) {
      return;
    }

    const title = translate({
      id: 'typing.result.copyTemplateTitle',
      message: '日本語変換タイピング結果',
    });
    const courseText = getCourseLabel(outcome.course);
    const charsLabel = translate({
      id: 'typing.result.totalDigested',
      message: '総消化文字数',
    });
    const charsUnit = translate({ id: 'typing.best.charsUnit', message: '文字' });
    const cpmLabel = translate({ id: 'typing.result.cpm', message: 'CPM（文字/分）' });
    const accuracyLabel = translate({ id: 'typing.result.accuracy', message: '正答率' });
    const passagesLabel = translate({
      id: 'typing.result.completedPassages',
      message: '完走文章数',
    });
    const passagesUnit = translate({ id: 'typing.best.passagesUnit', message: '本' });
    const rankLabel = translate({ id: 'typing.result.rank', message: 'ランク評価' });

    const lines = [
      `【${title}】(${courseText})`,
      `${rankLabel}: Rank ${outcome.metrics.rank}`,
      `${charsLabel}: ${outcome.metrics.digestedChars}${charsUnit}`,
      `${cpmLabel}: ${outcome.metrics.cpm}`,
      `${accuracyLabel}: ${outcome.metrics.accuracy}%`,
      `${passagesLabel}: ${outcome.metrics.completedPassages}${passagesUnit}`,
      'https://sawara.me/typing',
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API 非対応環境では静かに無視
    }
  }, [outcome]);

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
    <div className={styles.container}>
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

            <div className={styles.startActionRow}>
              <Button
                variant="contained"
                size="large"
                className={styles.primaryGradientButton}
                startIcon={<Play size={20} strokeWidth={2} />}
                onClick={startCountdown}
                sx={{ mt: 3 }}
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
                <div
                  key={shakeTrigger}
                  className={`${styles.inputWrap} ${isInputError ? styles.inputShake : ''}`}
                >
                  <div
                    className={`${styles.richInputContainer} ${
                      isInputError ? styles.richInputContainerError : ''
                    }`}
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
                  onClick={handleSubmitInput}
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

            <div className={styles.timerProgressWrap}>
              <LinearProgress
                variant="determinate"
                value={timerProgress}
                color={isTimeWarning ? 'error' : 'primary'}
                sx={{ height: 8, borderRadius: 4 }}
              />
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
                <Target size={15} strokeWidth={2} />
                <Translate id="typing.result.accuracy">正答率</Translate>
              </span>
              <span className={styles.statValue}>{outcome.metrics.accuracy}%</span>
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
                copied ? <Check size={18} strokeWidth={2} /> : <Copy size={18} strokeWidth={2} />
              }
              onClick={handleCopyResult}
              sx={{ borderRadius: 3, px: 3, py: 1.25, textTransform: 'none', fontWeight: 700 }}
            >
              {copied ? (
                <Translate id="typing.action.copied">コピーしました</Translate>
              ) : (
                <Translate id="typing.action.copyResult">結果をコピー</Translate>
              )}
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
