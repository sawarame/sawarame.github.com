import { describe, it, expect, beforeEach } from 'vitest';
import {
  AVAILABLE_COURSES,
  TYPING_BEST_STORAGE_KEY,
  TYPING_VERSION,
  buildTypingShareText,
  calculateCpm,
  computeResultMetrics,
  determineRank,
  evaluateInputPreview,
  evaluateSubmission,
  formatRemainingTime,
  getTypingDeviceInfo,
  loadBestRecords,
  normalizeChar,
  normalizeText,
  saveBestRecordIfImproved,
  shouldIgnoreEnterKey,
  shufflePassages,
  splitNfcChars,
  type BestRecord,
} from './logic';
import { TYPING_PASSAGES } from './passages';

describe('Typing Tool Pure Logic Suite', () => {
  // =========================================================================
  // 1. 文字正規化ルール
  // =========================================================================
  describe('文字正規化（normalizeChar / normalizeText）', () => {
    it('全角英数字・全角ASCII記号を対応する半角へ変換すること', () => {
      expect(normalizeText('ＡＢＣａｂｃ０１２９')).toBe('ABCabc0129');
      expect(normalizeText('！＠＃＄％＆（）－＝：；／．，？')).toBe('!@#$%&()-=:;/.,?');
    });

    it('全角スペース（U+3000）を半角スペース（U+0020）へ変換すること', () => {
      expect(normalizeChar('\u3000')).toBe(' ');
      expect(normalizeText('A\u3000B')).toBe('A B');
    });

    it('長音符「ー」とハイフン「-」「－」を同一文字（"-"）へ正規化すること', () => {
      expect(normalizeChar('ー')).toBe('-');
      expect(normalizeChar('-')).toBe('-');
      expect(normalizeChar('－')).toBe('-');
      expect(normalizeText('ミーティング 14:00-15:30')).toBe('ミ-ティング 14:00-15:30');
      expect(normalizeText('ミ-ティング 14:00ー15:30')).toBe('ミ-ティング 14:00-15:30');
      expect(normalizeText('ミ－ティング 14:00－15:30')).toBe('ミ-ティング 14:00-15:30');
    });

    it('大文字・小文字は厳密に区別したまま保持すること', () => {
      expect(normalizeChar('Ａ')).toBe('A');
      expect(normalizeChar('ａ')).toBe('a');
      expect(normalizeChar('Ａ')).not.toBe(normalizeChar('a'));
    });

    it('日本語文字・句読点・括弧はそのまま保持し、濁点結合文字はNFC正規化されること', () => {
      // NFD 形式の「が」（か + 結合濁点 U+3099）が NFC 形式と一致すること
      const nfdGa = 'か\u3099';
      expect(normalizeText(nfdGa)).toBe('が');
      expect(normalizeText('「日本語」、。カタカナ')).toBe('「日本語」、。カタカナ');
    });
  });

  // =========================================================================
  // 2. 先頭一致による消化と不一致時の挙動
  // =========================================================================
  describe('先頭一致消化ロジック（evaluateSubmission）', () => {
    const sampleText = 'API(v2.4)の応答は100%です。';

    it('空文字での Enter は isEmpty: true とし、提出文字数も 0 とすること', () => {
      const result = evaluateSubmission(sampleText, 0, '');
      expect(result).toEqual({
        isEmpty: true,
        submittedChars: 0,
        matchedLen: 0,
        remainingInput: '',
        nextCursor: 0,
        isPassageCompleted: false,
        isMismatch: false,
      });
    });

    it('全角英数字・記号・スペースで入力しても半角と同一視して完全一致消化できること', () => {
      const result = evaluateSubmission(sampleText, 0, 'ＡＰＩ（ｖ２．４）の応答');
      expect(result.isEmpty).toBe(false);
      expect(result.isMismatch).toBe(false);
      expect(result.matchedLen).toBe(12);
      expect(result.nextCursor).toBe(12);
      expect(result.remainingInput).toBe('');
      expect(result.isPassageCompleted).toBe(false);
    });

    it('大文字・小文字が異なる場合は一致とみなさず、不一致の残余文字列を入力欄に残すこと', () => {
      // 'A' は一致、'p' は 'P' と不一致
      const result = evaluateSubmission(sampleText, 0, 'ApI');
      expect(result.matchedLen).toBe(1);
      expect(result.nextCursor).toBe(1);
      expect(result.remainingInput).toBe('pI');
      expect(result.submittedChars).toBe(3);
      expect(result.isMismatch).toBe(false);
    });

    it('先頭が一致し後半に誤変換がある場合、一致した先頭分だけ消化し残余を保持すること', () => {
      const result = evaluateSubmission('来週の月次定例会議', 0, '来週の月時定例');
      expect(result.matchedLen).toBe(4); // '来週の月'
      expect(result.nextCursor).toBe(4);
      expect(result.remainingInput).toBe('時定例');
      expect(result.isMismatch).toBe(false);
    });

    it('先頭から1文字も一致しない場合は消化を進めず isMismatch: true とし入力を残すこと', () => {
      const result = evaluateSubmission('来週の月次定例会議', 0, '先週の会議');
      expect(result.matchedLen).toBe(0);
      expect(result.nextCursor).toBe(0);
      expect(result.remainingInput).toBe('先週の会議');
      expect(result.submittedChars).toBe(5);
      expect(result.isMismatch).toBe(true);
    });

    it('NFD 形式の濁点文字が入力されても NFC 正規化で正しく一致消化されること', () => {
      const result = evaluateSubmission('がっこう', 0, 'か\u3099っこう');
      expect(result.matchedLen).toBe(4);
      expect(result.isPassageCompleted).toBe(true);
      expect(result.remainingInput).toBe('');
    });

    it('例文の末尾までちょうど消化した場合に isPassageCompleted: true を返すこと', () => {
      const text = 'テスト123';
      const first = evaluateSubmission(text, 0, 'テスト');
      expect(first.isPassageCompleted).toBe(false);
      expect(first.nextCursor).toBe(3);

      const second = evaluateSubmission(text, first.nextCursor, '１２３');
      expect(second.isPassageCompleted).toBe(true);
      expect(second.matchedLen).toBe(3);
      expect(second.remainingInput).toBe('');
    });

    it('例文の残り文字数を超える入力でも、例文末尾までを消化し余剰文字を残余として返すこと', () => {
      const result = evaluateSubmission('ABC', 1, 'BCDEF');
      expect(result.matchedLen).toBe(2);
      expect(result.isPassageCompleted).toBe(true);
      expect(result.remainingInput).toBe('DEF');
    });

    it('「ー」と「-」「－」を相互に同一文字として消化判定できること', () => {
      const res1 = evaluateSubmission('ミーティング14:00-15:30', 0, 'ミ-ティング14:00ー15:30');
      expect(res1.matchedLen).toBe(17);
      expect(res1.isPassageCompleted).toBe(true);
      expect(res1.remainingInput).toBe('');

      const res2 = evaluateSubmission('#project-alpha', 0, '#projectーalpha');
      expect(res2.matchedLen).toBe(14);
      expect(res2.isPassageCompleted).toBe(true);
    });
  });

  // =========================================================================
  // 2.5. 入力欄内の送信前リアルタイム色分け判定
  // =========================================================================
  describe('入力欄内の送信前リアルタイム色分け判定（evaluateInputPreview）', () => {
    it('入力が空の場合は空配列を返すこと', () => {
      expect(evaluateInputPreview('来週の会議', 2, '')).toEqual([]);
    });

    it('一致文字を true（緑）、不一致文字を false（赤）として1文字ずつ判定すること', () => {
      // '来週の月時定例' vs '来週の月次定例会議'
      const preview = evaluateInputPreview('来週の月次定例会議', 0, '来週の月時定例');
      expect(preview).toEqual([
        { char: '来', isMatch: true },
        { char: '週', isMatch: true },
        { char: 'の', isMatch: true },
        { char: '月', isMatch: true },
        { char: '時', isMatch: false },
        { char: '定', isMatch: true },
        { char: '例', isMatch: true },
      ]);
    });

    it('全角半角統一・「ー」と「-」同一視・大文字小文字区別が入力欄色分けにも反映されること', () => {
      const preview = evaluateInputPreview('API-キー', 0, 'ＡpＩーキ-');
      expect(preview).toEqual([
        { char: 'Ａ', isMatch: true },
        { char: 'p', isMatch: false },
        { char: 'Ｉ', isMatch: true },
        { char: 'ー', isMatch: true },
        { char: 'キ', isMatch: true },
        { char: '-', isMatch: true },
      ]);
    });

    it('例文末尾を超過して入力された余剰文字は false（赤）となること', () => {
      const preview = evaluateInputPreview('ABC', 1, 'BCDE');
      expect(preview).toEqual([
        { char: 'B', isMatch: true },
        { char: 'C', isMatch: true },
        { char: 'D', isMatch: false },
        { char: 'E', isMatch: false },
      ]);
    });
  });

  // =========================================================================
  // 3. IME Enter 除外判定
  // =========================================================================
  describe('IME 変換中 Enter ガード（shouldIgnoreEnterKey）', () => {
    it('Enter 以外のキーは無視すること', () => {
      expect(
        shouldIgnoreEnterKey({
          key: 'a',
          isNativeComposing: false,
          isComposingRef: false,
          keyCode: 65,
          nowMs: 1000,
          lastCompositionEndMs: 0,
        })
      ).toBe(true);
    });

    it('isComposing や composition 中フラグ、keyCode === 229 の Enter は無視すること', () => {
      expect(
        shouldIgnoreEnterKey({
          key: 'Enter',
          isNativeComposing: true,
          isComposingRef: false,
          keyCode: 13,
          nowMs: 1000,
          lastCompositionEndMs: 0,
        })
      ).toBe(true);

      expect(
        shouldIgnoreEnterKey({
          key: 'Enter',
          isNativeComposing: false,
          isComposingRef: true,
          keyCode: 13,
          nowMs: 1000,
          lastCompositionEndMs: 0,
        })
      ).toBe(true);

      expect(
        shouldIgnoreEnterKey({
          key: 'Enter',
          isNativeComposing: false,
          isComposingRef: false,
          keyCode: 229,
          nowMs: 1000,
          lastCompositionEndMs: 0,
        })
      ).toBe(true);
    });

    it('compositionend 直後の極短時間内の Enter（Safari 対策）は無視し、十分経過した Enter は受理すること', () => {
      expect(
        shouldIgnoreEnterKey({
          key: 'Enter',
          isNativeComposing: false,
          isComposingRef: false,
          keyCode: 13,
          nowMs: 1010,
          lastCompositionEndMs: 1000,
        })
      ).toBe(true);

      expect(
        shouldIgnoreEnterKey({
          key: 'Enter',
          isNativeComposing: false,
          isComposingRef: false,
          keyCode: 13,
          nowMs: 1100,
          lastCompositionEndMs: 1000,
        })
      ).toBe(false);
    });
  });

  // =========================================================================
  // 4. スコア・CPM・ランク算出・共有ユーティリティ
  // =========================================================================
  describe('スコア指標とランク判定', () => {
    it('ツールバージョン定数がセマンティックバージョン形式で定義されていること', () => {
      expect(TYPING_VERSION).toBe('1.2.0');
      expect(TYPING_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('利用可能なコース一覧が1分・3分・5分・10分の4コースで定義されていること', () => {
      expect(AVAILABLE_COURSES).toEqual([60, 180, 300, 600]);
    });

    it('1分・3分・5分・10分コースの CPM を正しく算出すること', () => {
      expect(calculateCpm(120, 60)).toBe(120);
      expect(calculateCpm(360, 180)).toBe(120);
      expect(calculateCpm(600, 300)).toBe(120);
      expect(calculateCpm(1500, 600)).toBe(150);
      expect(calculateCpm(0, 60)).toBe(0);
    });

    it('CPM 閾値に応じて S / A / B / C / D ランクを正しく判定すること', () => {
      expect(determineRank(200)).toBe('S');
      expect(determineRank(199)).toBe('A');
      expect(determineRank(150)).toBe('A');
      expect(determineRank(149)).toBe('B');
      expect(determineRank(100)).toBe('B');
      expect(determineRank(99)).toBe('C');
      expect(determineRank(60)).toBe('C');
      expect(determineRank(59)).toBe('D');
      expect(determineRank(0)).toBe('D');
    });

    it('computeResultMetrics が正答率を含まず全指標を一貫して算出すること', () => {
      const metrics = computeResultMetrics({
        digestedChars: 480,
        completedPassages: 4,
        courseSeconds: 180,
      });
      expect(metrics).toEqual({
        digestedChars: 480,
        cpm: 160,
        completedPassages: 4,
        rank: 'A',
      });
      expect('accuracy' in metrics).toBe(false);
    });

    it('formatRemainingTime が残りミリ秒を MM:SS へ正しく整形すること', () => {
      expect(formatRemainingTime(60000)).toBe('01:00');
      expect(formatRemainingTime(180000)).toBe('03:00');
      expect(formatRemainingTime(300000)).toBe('05:00');
      expect(formatRemainingTime(600000)).toBe('10:00');
      expect(formatRemainingTime(9100)).toBe('00:10');
      expect(formatRemainingTime(0)).toBe('00:00');
      expect(formatRemainingTime(-500)).toBe('00:00');
    });

    it('getTypingDeviceInfo が各 UA から ES バージョンを含まないブラウザ・OS 情報を取得できること', () => {
      const chromeMacUa =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
      expect(getTypingDeviceInfo(chromeMacUa, 0)).toBe('Chrome 128 (macOS)');

      const firefoxWinUa =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
      expect(getTypingDeviceInfo(firefoxWinUa, 0)).toBe('Firefox 128 (Windows)');

      const safariMacUa =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      expect(getTypingDeviceInfo(safariMacUa, 0)).toBe('Safari 17 (macOS)');
      // iPadOS（Mac UA + タッチ対応）は iOS として判定されること
      expect(getTypingDeviceInfo(safariMacUa, 5)).toBe('Safari 17 (iOS)');

      const edgeWinUa =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0';
      expect(getTypingDeviceInfo(edgeWinUa, 0)).toBe('Edge 124 (Windows)');

      const safariIosUa =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
      expect(getTypingDeviceInfo(safariIosUa, 5)).toBe('Safari 18 (iOS)');

      const chromeAndroidUa =
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';
      expect(getTypingDeviceInfo(chromeAndroidUa, 5)).toBe('Chrome 128 (Android)');

      expect(getTypingDeviceInfo('', 0)).toBe('');
    });

    it('buildTypingShareText が正答率を含まない共有テキストを正しく生成すること', () => {
      const textWithUrl = buildTypingShareText({
        title: '日本語変換タイピング結果',
        courseLabel: '1分コース',
        rankLabel: 'ランク評価',
        rank: 'A',
        charsLabel: '総消化文字数',
        digestedChars: 165,
        charsUnit: '文字',
        cpmLabel: 'CPM（文字/分）',
        cpm: 165,
        passagesLabel: '完走文章数',
        completedPassages: 1,
        passagesUnit: '本',
        url: 'https://sawara.me/typing',
      });

      expect(textWithUrl).toContain('【日本語変換タイピング結果】(1分コース)');
      expect(textWithUrl).toContain('ランク評価: Rank A');
      expect(textWithUrl).toContain('総消化文字数: 165文字');
      expect(textWithUrl).toContain('CPM（文字/分）: 165');
      expect(textWithUrl).toContain('完走文章数: 1本');
      expect(textWithUrl).toContain('https://sawara.me/typing');
      expect(textWithUrl).not.toContain('正答率');

      const textWithoutUrl = buildTypingShareText({
        title: '日本語変換タイピング結果',
        courseLabel: '3分コース',
        rankLabel: 'ランク評価',
        rank: 'S',
        charsLabel: '総消化文字数',
        digestedChars: 620,
        charsUnit: '文字',
        cpmLabel: 'CPM（文字/分）',
        cpm: 207,
        passagesLabel: '完走文章数',
        completedPassages: 5,
        passagesUnit: '本',
      });
      expect(textWithoutUrl).not.toContain('https://sawara.me/typing');
    });
  });

  // =========================================================================
  // 5. シャッフル巡回・LocalStorage 永続化
  // =========================================================================
  describe('シャッフル巡回・LocalStorage 永続化', () => {
    /**
     * テスト用のインメモリ Storage モックを生成する
     * @returns Web Storage 互換のインメモリ実装
     */
    const createMemoryStorage = (): Storage => {
      const store = new Map<string, string>();
      return {
        get length() {
          return store.size;
        },
        clear() {
          store.clear();
        },
        getItem(key: string) {
          return store.has(key) ? (store.get(key) ?? null) : null;
        },
        key(index: number) {
          return Array.from(store.keys())[index] ?? null;
        },
        removeItem(key: string) {
          store.delete(key);
        },
        setItem(key: string, value: string) {
          store.set(key, String(value));
        },
      };
    };

    let mockStorage: Storage;

    beforeEach(() => {
      mockStorage = createMemoryStorage();
    });

    it('shufflePassages が全要素を重複なく保持し、直前末尾と同じ先頭を回避すること', () => {
      const subset = TYPING_PASSAGES.slice(0, 5);
      // 固定乱数 0.999... で順序維持させても previousLastId と先頭が重複しないこと
      const shuffled = shufflePassages(subset, subset[0].id, () => 0.9999);
      expect(shuffled).toHaveLength(subset.length);
      expect(shuffled[0].id).not.toBe(subset[0].id);
      expect(new Set(shuffled.map((p) => p.id))).toEqual(new Set(subset.map((p) => p.id)));
    });

    it('コース別の自己ベスト記録（accuracy なし新規形式）を保存・更新判定・復元できること', () => {
      const first: BestRecord = {
        chars: 120,
        cpm: 120,
        completedPassages: 1,
        achievedAt: '2026-11-23T00:00:00.000Z',
      };

      const res1 = saveBestRecordIfImproved(60, first, mockStorage);
      expect(res1.isNewBest).toBe(true);
      expect(res1.previousBest).toBeNull();
      expect(loadBestRecords(mockStorage)[60]).toEqual(first);

      // 下回るスコアでは更新されないこと
      const lower: BestRecord = { ...first, chars: 100, cpm: 100 };
      const res2 = saveBestRecordIfImproved(60, lower, mockStorage);
      expect(res2.isNewBest).toBe(false);
      expect(res2.previousBest).toEqual(first);
      expect(loadBestRecords(mockStorage)[60]).toEqual(first);

      // 上回るスコアで更新されること
      const higher: BestRecord = { ...first, chars: 185, cpm: 185 };
      const res3 = saveBestRecordIfImproved(60, higher, mockStorage);
      expect(res3.isNewBest).toBe(true);
      expect(res3.previousBest).toEqual(first);
      expect(loadBestRecords(mockStorage)[60]).toEqual(higher);

      // 3分・5分・10分コースはそれぞれ独立して保存・復元されること
      const course3Min: BestRecord = {
        chars: 420,
        cpm: 140,
        completedPassages: 3,
        achievedAt: '2026-11-23T01:00:00.000Z',
      };
      const course5Min: BestRecord = {
        chars: 780,
        cpm: 156,
        completedPassages: 7,
        achievedAt: '2026-11-27T01:00:00.000Z',
      };
      const course10Min: BestRecord = {
        chars: 1520,
        cpm: 152,
        completedPassages: 13,
        achievedAt: '2026-11-27T02:00:00.000Z',
      };
      saveBestRecordIfImproved(180, course3Min, mockStorage);
      saveBestRecordIfImproved(300, course5Min, mockStorage);
      saveBestRecordIfImproved(600, course10Min, mockStorage);
      const loaded = loadBestRecords(mockStorage);
      expect(loaded[60]).toEqual(higher);
      expect(loaded[180]).toEqual(course3Min);
      expect(loaded[300]).toEqual(course5Min);
      expect(loaded[600]).toEqual(course10Min);
    });

    it('既存の accuracy を含む LocalStorage データも後方互換で読み込め、更新できること', () => {
      const legacyPayload = {
        '60': {
          chars: 150,
          cpm: 150,
          accuracy: 95.4,
          completedPassages: 1,
          achievedAt: '2026-11-20T00:00:00.000Z',
        },
      };
      mockStorage.setItem(TYPING_BEST_STORAGE_KEY, JSON.stringify(legacyPayload));

      const loaded = loadBestRecords(mockStorage);
      expect(loaded[60]).toEqual(legacyPayload['60']);

      const improved: BestRecord = {
        chars: 180,
        cpm: 180,
        completedPassages: 2,
        achievedAt: '2026-11-23T10:00:00.000Z',
      };
      const updated = saveBestRecordIfImproved(60, improved, mockStorage);
      expect(updated.isNewBest).toBe(true);
      expect(updated.previousBest?.chars).toBe(150);
      expect(loadBestRecords(mockStorage)[60]).toEqual(improved);
    });

    it('0 文字のスコアでは自己ベストを新規登録しないこと', () => {
      const zero: BestRecord = {
        chars: 0,
        cpm: 0,
        completedPassages: 0,
        achievedAt: '2026-11-23T00:00:00.000Z',
      };
      const res = saveBestRecordIfImproved(60, zero, mockStorage);
      expect(res.isNewBest).toBe(false);
      expect(loadBestRecords(mockStorage)[60]).toBeUndefined();
    });

    it('破損した LocalStorage JSON でもクラッシュせず空オブジェクトを返すこと', () => {
      mockStorage.setItem(TYPING_BEST_STORAGE_KEY, '{invalid-json');
      expect(loadBestRecords(mockStorage)).toEqual({});
    });
  });

  // =========================================================================
  // 6. 内蔵プリセット例文の品質検証
  // =========================================================================
  describe('内蔵プリセット例文（TYPING_PASSAGES）の品質条件', () => {
    it('15本以上のユニークな例文が複数ジャンルで収録されていること', () => {
      expect(TYPING_PASSAGES.length).toBeGreaterThanOrEqual(15);
      const ids = new Set(TYPING_PASSAGES.map((p) => p.id));
      expect(ids.size).toBe(TYPING_PASSAGES.length);

      const genres = new Set(TYPING_PASSAGES.map((p) => p.genre));
      expect(genres.size).toBeGreaterThanOrEqual(3);
    });

    it('すべての例文が改行を含まず、適切な長さ（80〜150文字）で日本語と英数字・記号を含むこと', () => {
      for (const passage of TYPING_PASSAGES) {
        const len = splitNfcChars(passage.text).length;
        expect(len).toBeGreaterThanOrEqual(80);
        expect(len).toBeLessThanOrEqual(150);
        expect(passage.text).not.toMatch(/[\r\n]/);
        // 日本語文字（ひらがな・カタカナ・漢字）を含む
        expect(passage.text).toMatch(/[\u3040-\u30ff\u4e00-\u9faf]/);
        // 数字を含む
        expect(passage.text).toMatch(/[0-9]/);
      }

      // 全体として英字の大文字・小文字および多様な記号を含むこと
      const combined = TYPING_PASSAGES.map((p) => p.text).join('');
      expect(combined).toMatch(/[A-Z]/);
      expect(combined).toMatch(/[a-z]/);
      for (const symbol of ['%', '/', '-', ':', '(', ')', '@', '#', '!', '?', '.', ',']) {
        expect(combined).toContain(symbol);
      }
    });
  });
});
