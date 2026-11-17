import React, { useState, useMemo, useCallback } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import {
  Search,
  Terminal,
  List,
  Settings,
  Globe,
  Folder,
  Code2,
  Pin,
  Lightbulb,
  X,
  CheckCircle2,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import styles from './NickmarkShowcase.module.css';
import {
  buildDemoPaletteItems,
  DemoBookmarkItem,
  DemoSearchResult,
  extractDemoFolders,
} from './nickmarkSearchUtils';

/**
 * ショーケースで表示するプレビュータブ種別
 */
type ShowcaseTab = 'palette' | 'dashboard' | 'preferences';

/**
 * 初期状態のデモ用ブックマークデータ
 */
const INITIAL_DEMO_BOOKMARKS: DemoBookmarkItem[] = [
  {
    id: 'b1',
    nickname: 'gh',
    title: 'GitHub Repository / Search',
    url: 'https://github.com/%s',
    defaultValue: 'sawarame/Nickmark',
    isPinned: true,
    score: 26.4,
    lastUsedLabel: '2m',
  },
  {
    id: 'b2',
    nickname: 'work/mail',
    title: 'Team Webmail',
    url: 'https://mail.example.com/inbox',
    isPinned: false,
    score: 18.7,
    lastUsedLabel: '1h',
  },
  {
    id: 'b3',
    nickname: 'work/docs',
    title: 'Architecture & Design Docs',
    url: 'https://docs.example.com/architecture',
    isPinned: false,
    score: 15.2,
    lastUsedLabel: '3h',
  },
  {
    id: 'b4',
    nickname: 'work/board',
    title: 'Sprint Issue Board',
    url: 'https://issues.example.com/board',
    isPinned: false,
    score: 12.1,
    lastUsedLabel: '1d',
  },
  {
    id: 'b5',
    nickname: 'g',
    title: 'Google Search',
    url: 'https://www.google.com/search?q=%s',
    isPinned: false,
    score: 21.0,
    lastUsedLabel: '20m',
  },
  {
    id: 'b6',
    nickname: 'js/top',
    title: 'Smooth Scroll to Top (Bookmarklet)',
    url: 'javascript:window.scrollTo({top:0,behavior:"smooth"})',
    isPinned: false,
    score: 9.4,
    lastUsedLabel: '2d',
  },
];

/**
 * パレット空入力時に順番に表示するヒント一覧
 */
const DEMO_TIPS: Array<{ id: string; message: string }> = [
  {
    id: 'nickmark.showcase.tip1',
    message: ':add <名前>（短縮 :a）で、開いているタブを即座にブックマーク登録できます。',
  },
  {
    id: 'nickmark.showcase.tip2',
    message: 'フォルダ名/ または :open フォルダ名/ と入力して Enter を押すと、配下のブックマークを一括で開けます。',
  },
  {
    id: 'nickmark.showcase.tip3',
    message: 'URL に %s を含めて登録すると、「ニックネーム 検索語」で引数を埋め込んで遷移できます。',
  },
  {
    id: 'nickmark.showcase.tip4',
    message: 'Shift+Enter でパレットを閉じずにバックグラウンドタブへ連続起動、Cmd/Ctrl+Enter で新しいタブに開けます。',
  },
];

/**
 * Nickmark のコマンドパレット・管理画面・設定画面をブラウザ上で試せるインタラクティブショーケース
 * @returns ショーケースセクションの JSX 要素
 */
export default function NickmarkShowcase(): JSX.Element {
  const { i18n } = useDocusaurusContext();
  const locale: 'ja' | 'en' = i18n.currentLocale.startsWith('en') ? 'en' : 'ja';
  const appIconUrl = useBaseUrl('/img/nickmark/app-icon.svg');

  const [activeTab, setActiveTab] = useState<ShowcaseTab>('palette');
  const [bookmarks, setBookmarks] = useState<DemoBookmarkItem[]>(INITIAL_DEMO_BOOKMARKS);
  const [query, setQuery] = useState<string>('gh sawarame/Nickmark');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // 管理画面デモ状態
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [sortByScore, setSortByScore] = useState<boolean>(true);

  // 設定画面デモ状態
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true);
  const [historyEnabled, setHistoryEnabled] = useState<boolean>(false);
  const [batchLimit, setBatchLimit] = useState<number>(20);

  const isCommandMode = query.trimStart().startsWith(':');

  /**
   * 現在の検索クエリに基づく候補リスト
   */
  const paletteItems = useMemo(
    () => buildDemoPaletteItems(query, bookmarks, locale),
    [query, bookmarks, locale]
  );

  const safeSelectedIndex =
    paletteItems.length > 0 ? Math.min(selectedIndex, paletteItems.length - 1) : 0;

  /**
   * 検索文字列を更新し、ハイライト位置を先頭へリセットする
   * @param next - 新しい入力文字列
   * @returns なし
   */
  const handleQueryChange = useCallback((next: string) => {
    setQuery(next);
    setSelectedIndex(0);
    setFeedback(null);
  }, []);

  /**
   * 選択中またはクリックされた候補アイテムのデモ実行を行う
   * @param item - 実行対象の候補アイテム
   * @param disposition - タブの開き方（'current' | 'foreground' | 'background'）
   * @returns なし
   */
  const executeDemoItem = useCallback(
    (item: DemoSearchResult, disposition: 'current' | 'foreground' | 'background' = 'current') => {
      if (item.kind === 'command') {
        const val = item.executeValue.trim();
        if (val === ':ls') {
          setActiveTab('dashboard');
          setFeedback(null);
          return;
        }
        if (val === ':prefs') {
          setActiveTab('preferences');
          setFeedback(null);
          return;
        }
        if (val.startsWith(':add ')) {
          const newNick = val.slice(5).trim().split(/\s+/)[0];
          if (newNick) {
            setBookmarks((prev) => {
              if (prev.some((b) => b.nickname === newNick)) {
                return prev;
              }
              return [
                {
                  id: `demo-${Date.now()}`,
                  nickname: newNick,
                  title: 'Nickmark Official Intro',
                  url: 'https://sawara.me/nickmark',
                  isPinned: false,
                  score: 1.0,
                  lastUsedLabel: locale === 'en' ? 'Just now' : 'たった今',
                },
                ...prev,
              ];
            });
            setFeedback(
              translate(
                {
                  id: 'nickmark.showcase.feedback.added',
                  message: '「{nickname}」をデモリストに登録しました',
                },
                { nickname: newNick }
              )
            );
            setQuery('');
            return;
          }
        }
        if (val.startsWith(':rm ')) {
          const targetNick = val.slice(4).trim().split(/\s+/)[0];
          if (targetNick) {
            setBookmarks((prev) => prev.filter((b) => b.nickname !== targetNick));
            setFeedback(
              translate(
                {
                  id: 'nickmark.showcase.feedback.removed',
                  message: '「{nickname}」をデモリストから削除しました',
                },
                { nickname: targetNick }
              )
            );
            setQuery('');
            return;
          }
        }
        if (val.startsWith(':open ')) {
          const folder = val.slice(6).trim().replace(/\/+$/, '');
          setFeedback(
            translate(
              {
                id: 'nickmark.showcase.feedback.batchOpen',
                message: 'フォルダ「{folder}/」配下のタブをバックグラウンドで一括オープンしました',
              },
              { folder }
            )
          );
          return;
        }
        setFeedback(
          translate(
            {
              id: 'nickmark.showcase.feedback.command',
              message: 'コマンド {cmd} を実行しました',
            },
            { cmd: val }
          )
        );
        return;
      }

      if (item.kind === 'folder') {
        const folderPath = item.executeValue.replace(/^folder:/, '');
        setFeedback(
          translate(
            {
              id: 'nickmark.showcase.feedback.batchOpen',
              message: 'フォルダ「{folder}/」配下のタブをバックグラウンドで一括オープンしました',
            },
            { folder: folderPath }
          )
        );
        return;
      }

      if (item.kind === 'bookmarklet') {
        setFeedback(
          translate({
            id: 'nickmark.showcase.feedback.bookmarklet',
            message: 'userScripts API（MAIN world）で現在のタブにブックマークレットを実行しました',
          })
        );
        return;
      }

      const modeText =
        disposition === 'background'
          ? translate({ id: 'nickmark.showcase.mode.bg', message: 'バックグラウンドタブで開きました（パレット維持）' })
          : disposition === 'foreground'
            ? translate({ id: 'nickmark.showcase.mode.fg', message: '新しいタブで開きました' })
            : translate({ id: 'nickmark.showcase.mode.cur', message: '現在のタブで開きました' });

      setFeedback(`${item.subtitle} — ${modeText}`);
    },
    [locale]
  );

  /**
   * 検索入力欄でのキーボードナビゲーション処理
   * @param event - キーボードイベント
   * @returns なし
   */
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.nativeEvent.isComposing) return;

    if (
      event.key === 'ArrowDown' ||
      (event.ctrlKey && !event.metaKey && !event.altKey && (event.key === 'n' || event.key === 'N'))
    ) {
      event.preventDefault();
      if (paletteItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % paletteItems.length);
      }
      return;
    }

    if (
      event.key === 'ArrowUp' ||
      (event.ctrlKey && !event.metaKey && !event.altKey && (event.key === 'p' || event.key === 'P'))
    ) {
      event.preventDefault();
      if (paletteItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + paletteItems.length) % paletteItems.length);
      }
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const target = paletteItems[safeSelectedIndex];
      if (target) {
        handleQueryChange(target.fillText);
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const target = paletteItems[safeSelectedIndex];
      if (target) {
        const disp = event.shiftKey
          ? 'background'
          : event.metaKey || event.ctrlKey || event.altKey
            ? 'foreground'
            : 'current';
        executeDemoItem(target, disp);
      }
    }
  };

  /**
   * 管理画面テーブルのフィルタ＆ソート済み一覧
   */
  const dashboardRows = useMemo(() => {
    const filtered = bookmarks.filter((item) => {
      if (folderFilter === 'all') return true;
      if (folderFilter === 'root') return !item.nickname.includes('/');
      return item.nickname.startsWith(`${folderFilter}/`);
    });
    return [...filtered].sort((a, b) => {
      if (sortByScore) {
        const pinDiff = (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        if (pinDiff !== 0) return pinDiff;
        return b.score - a.score;
      }
      return a.nickname.localeCompare(b.nickname);
    });
  }, [bookmarks, folderFilter, sortByScore]);

  const demoFolders = useMemo(() => Array.from(extractDemoFolders(bookmarks).keys()), [bookmarks]);

  const togglePin = useCallback((id: string) => {
    setBookmarks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item))
    );
  }, []);

  const presets = [
    { label: 'gh sawarame/Nickmark', value: 'gh sawarame/Nickmark' },
    { label: 'work/', value: 'work/' },
    { label: ':add dev', value: ':add dev' },
    { label: ':open work/', value: ':open work/' },
    { label: 'js/top', value: 'js/top' },
  ];

  const currentTip = DEMO_TIPS[tipIndex % DEMO_TIPS.length];

  return (
    <div className={styles.showcaseWrap}>
      {/* モード切替タブ */}
      <div
        className={styles.tabBar}
        role="tablist"
        aria-label={translate({
          id: 'nickmark.showcase.tablistLabel',
          message: 'Nickmark プレビューモード',
        })}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'palette'}
          className={`${styles.tabButton} ${activeTab === 'palette' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('palette')}
        >
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <Translate id="nickmark.showcase.tab.palette">コマンドパレット</Translate>
          </span>
          <kbd className={styles.tabShortcut}>⌥⇧D</kbd>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'dashboard'}
          className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <List size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <Translate id="nickmark.showcase.tab.dashboard">管理画面</Translate>
          </span>
          <kbd className={styles.tabShortcut}>:ls</kbd>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'preferences'}
          className={`${styles.tabButton} ${activeTab === 'preferences' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Settings size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <Translate id="nickmark.showcase.tab.preferences">設定・同期</Translate>
          </span>
          <kbd className={styles.tabShortcut}>:prefs</kbd>
        </button>
      </div>

      {/* ブラウザウィンドウ枠 */}
      <div className={styles.browserFrame}>
        <div className={styles.browserTopBar} aria-hidden="true">
          <div className={styles.trafficLights}>
            <span className={`${styles.trafficDot} ${styles.trafficDotRed}`} />
            <span className={`${styles.trafficDot} ${styles.trafficDotYellow}`} />
            <span className={`${styles.trafficDot} ${styles.trafficDotGreen}`} />
          </div>

          <div className={styles.omniboxPill}>
            <span className={styles.omniboxBadge}>nm</span>
            <span className={styles.omniboxUrl}>https://sawara.me/nickmark</span>
          </div>

          <div className={styles.extensionActionBadge}>
            <img src={appIconUrl} alt="" className={styles.extensionMiniIcon} />
            <span>Nickmark v2.0.4</span>
          </div>
        </div>

        <div className={styles.stageArea}>
          {activeTab === 'palette' && (
            <>
              {/* ワンクリック入力プリセット */}
              <div className={styles.presetBar}>
                <span className={styles.presetLabel}>
                  <Translate id="nickmark.showcase.presetsLabel">入力例:</Translate>
                </span>
                {presets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleQueryChange(p.value)}
                    className={`${styles.presetChip} ${query === p.value ? styles.presetChipActive : ''}`}
                  >
                    {p.label}
                  </button>
                ))}
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange('')}
                    className={styles.presetChip}
                  >
                    <Translate id="nickmark.showcase.clearPreset">空にする (Tips)</Translate>
                  </button>
                )}
              </div>

              {/* パレット UI 本体 */}
              <div className={styles.palettePanel}>
                <div className={styles.paletteSearchBar}>
                  {isCommandMode ? (
                    <Terminal size={17} strokeWidth={2.2} className={styles.searchLeadingIcon} aria-hidden="true" />
                  ) : (
                    <Search size={17} strokeWidth={2.2} className={styles.searchLeadingIcon} aria-hidden="true" />
                  )}
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={translate({
                      id: 'nickmark.showcase.placeholder',
                      message: 'ニックネーム検索 または :add / :open / :rm ...',
                    })}
                    className={styles.paletteInput}
                    aria-label={translate({
                      id: 'nickmark.showcase.inputAria',
                      message: 'Nickmark コマンドパレットデモ入力欄',
                    })}
                  />
                  <div className={styles.paletteHeaderActions}>
                    {query && (
                      <button
                        type="button"
                        onClick={() => handleQueryChange('')}
                        className={styles.headerIconBtn}
                        aria-label={translate({ id: 'nickmark.showcase.clear', message: '入力をクリア' })}
                      >
                        <X size={14} strokeWidth={2.2} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className={styles.headerIconBtn}
                      title={translate({ id: 'nickmark.showcase.openList', message: '管理画面を開く (:ls)' })}
                      aria-label={translate({ id: 'nickmark.showcase.openList', message: '管理画面を開く (:ls)' })}
                    >
                      <List size={15} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preferences')}
                      className={styles.headerIconBtn}
                      title={translate({ id: 'nickmark.showcase.openPrefs', message: '設定画面を開く (:prefs)' })}
                      aria-label={translate({ id: 'nickmark.showcase.openPrefs', message: '設定画面を開く (:prefs)' })}
                    >
                      <Settings size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {feedback && (
                  <div className={styles.paletteFeedback} role="status">
                    <CheckCircle2 size={15} strokeWidth={2.2} aria-hidden="true" />
                    <span>{feedback}</span>
                  </div>
                )}

                {query.trim() ? (
                  paletteItems.length === 0 ? (
                    <div className={styles.paletteEmpty}>
                      <Translate id="nickmark.showcase.noMatch">
                        一致する候補が見つかりませんでした。
                      </Translate>
                    </div>
                  ) : (
                    <div className={styles.paletteList} role="listbox">
                      {paletteItems.map((item, idx) => {
                        const isSelected = idx === safeSelectedIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={(e) => {
                              const disp = e.shiftKey
                                ? 'background'
                                : e.metaKey || e.ctrlKey || e.altKey
                                  ? 'foreground'
                                  : 'current';
                              executeDemoItem(item, disp);
                            }}
                            className={`${styles.paletteItem} ${isSelected ? styles.paletteItemSelected : ''}`}
                          >
                            <span className={styles.itemIconWrap} aria-hidden="true">
                              {item.kind === 'folder' ? (
                                <Folder size={14} strokeWidth={2.2} />
                              ) : item.kind === 'bookmarklet' ? (
                                <Code2 size={14} strokeWidth={2.2} className={styles.itemIconCode} />
                              ) : item.kind === 'command' ? (
                                <Terminal size={14} strokeWidth={2.2} className={styles.itemIconCmd} />
                              ) : (
                                <Globe size={14} strokeWidth={2} />
                              )}
                            </span>

                            <span className={styles.itemBody}>
                              <span className={styles.itemTopRow}>
                                <span className={styles.itemBadge}>{item.badge}</span>
                                <span className={styles.itemTitle}>{item.title}</span>
                                {item.isPinned && (
                                  <Pin size={12} strokeWidth={2.2} className={styles.itemPinIcon} aria-hidden="true" />
                                )}
                                {item.typeTag && <span className={styles.itemTypeTag}>{item.typeTag}</span>}
                              </span>
                              <span className={styles.itemSubtitle}>{item.subtitle}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setTipIndex((prev) => prev + 1)}
                    className={styles.paletteTips}
                    title={translate({
                      id: 'nickmark.showcase.nextTip',
                      message: 'クリックで次のヒントを表示',
                    })}
                  >
                    <Lightbulb size={16} strokeWidth={2.2} className={styles.tipsIcon} aria-hidden="true" />
                    <span className={styles.tipsContent}>
                      <span className={styles.tipsBadge}>TIP</span>
                      <span className={styles.tipsText}>
                        <Translate id={currentTip.id}>{currentTip.message}</Translate>
                      </span>
                    </span>
                    <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* キー操作デモボタン */}
              <div className={styles.actionHintsRow}>
                <button
                  type="button"
                  disabled={paletteItems.length === 0}
                  onClick={() => {
                    const target = paletteItems[safeSelectedIndex];
                    if (target) executeDemoItem(target, 'current');
                  }}
                  className={styles.actionHintBtn}
                >
                  <kbd>Enter</kbd>
                  <span>
                    <Translate id="nickmark.showcase.hint.current">現在のタブで開く</Translate>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={paletteItems.length === 0}
                  onClick={() => {
                    const target = paletteItems[safeSelectedIndex];
                    if (target) executeDemoItem(target, 'foreground');
                  }}
                  className={styles.actionHintBtn}
                >
                  <kbd>⌘/Ctrl + Enter</kbd>
                  <span>
                    <Translate id="nickmark.showcase.hint.newTab">新しいタブで開く</Translate>
                  </span>
                </button>
                <button
                  type="button"
                  disabled={paletteItems.length === 0}
                  onClick={() => {
                    const target = paletteItems[safeSelectedIndex];
                    if (target) executeDemoItem(target, 'background');
                  }}
                  className={styles.actionHintBtn}
                >
                  <kbd>Shift + Enter</kbd>
                  <span>
                    <Translate id="nickmark.showcase.hint.bgTab">バックグラウンドで連続起動</Translate>
                  </span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'dashboard' && (
            <div className={styles.dashboardPanel}>
              <div className={styles.dashboardToolbar}>
                <div className={styles.folderFilterGroup}>
                  <button
                    type="button"
                    onClick={() => setFolderFilter('all')}
                    className={`${styles.filterChip} ${folderFilter === 'all' ? styles.filterChipActive : ''}`}
                  >
                    <Translate id="nickmark.showcase.dash.all">すべて</Translate>
                  </button>
                  {demoFolders.map((folder) => (
                    <button
                      key={folder}
                      type="button"
                      onClick={() => setFolderFilter(folder)}
                      className={`${styles.filterChip} ${folderFilter === folder ? styles.filterChipActive : ''}`}
                    >
                      📁 {folder}/
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFolderFilter('root')}
                    className={`${styles.filterChip} ${folderFilter === 'root' ? styles.filterChipActive : ''}`}
                  >
                    <Translate id="nickmark.showcase.dash.root">未分類</Translate>
                  </button>
                </div>

                <div className={styles.dashboardMetaActions}>
                  <button
                    type="button"
                    onClick={() => setSortByScore((prev) => !prev)}
                    className={styles.sortBadgeBtn}
                  >
                    <ArrowUpDown size={13} strokeWidth={2} aria-hidden="true" />
                    <span>
                      {sortByScore ? (
                        <Translate id="nickmark.showcase.dash.sortScore">スコア順</Translate>
                      ) : (
                        <Translate id="nickmark.showcase.dash.sortName">名前順</Translate>
                      )}
                    </span>
                  </button>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                  <span>
                    <Translate id="nickmark.showcase.dash.colNick">ニックネーム</Translate>
                  </span>
                  <span>
                    <Translate id="nickmark.showcase.dash.colTitle">タイトル</Translate>
                  </span>
                  <span className={styles.tableHeaderUrl}>URL</span>
                  <span>
                    <Translate id="nickmark.showcase.dash.colScore">スコア</Translate>
                  </span>
                  <span>
                    <Translate id="nickmark.showcase.dash.colPin">固定</Translate>
                  </span>
                </div>

                {dashboardRows.map((row) => (
                  <div key={row.id} className={styles.tableRow}>
                    <span className={styles.tableCellTruncate}>
                      <span className={styles.itemBadge}>{row.nickname}</span>
                    </span>
                    <span className={styles.tableCellTruncate}>{row.title}</span>
                    <span className={`${styles.tableCellTruncate} ${styles.tableUrlText} ${styles.tableCellUrl}`}>
                      {row.url}
                    </span>
                    <span className={styles.scorePill}>{row.score.toFixed(1)}</span>
                    <span>
                      <button
                        type="button"
                        onClick={() => togglePin(row.id)}
                        className={`${styles.pinToggleBtn} ${row.isPinned ? styles.pinToggleBtnActive : ''}`}
                        aria-pressed={!!row.isPinned}
                        aria-label={translate({
                          id: 'nickmark.showcase.dash.togglePinAria',
                          message: 'ピン留めを切り替え',
                        })}
                      >
                        <Pin size={14} strokeWidth={2.2} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className={styles.prefsPanel}>
              <div className={styles.prefsCard}>
                <div className={styles.prefsInfo}>
                  <div className={styles.prefsTitle}>
                    <Translate id="nickmark.showcase.prefs.syncTitle">Google アカウント同期</Translate>
                  </div>
                  <div className={styles.prefsDesc}>
                    <Translate id="nickmark.showcase.prefs.syncDesc">
                      複数デバイス間でブックマークを同期（上限 100KB・自動 8KB チャンク分割・競合解決ダイアログ付き）
                    </Translate>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={syncEnabled}
                  onClick={() => setSyncEnabled((prev) => !prev)}
                  className={`${styles.switchBtn} ${syncEnabled ? styles.switchBtnOn : ''}`}
                  aria-label={translate({
                    id: 'nickmark.showcase.prefs.syncTitle',
                    message: 'Google アカウント同期',
                  })}
                >
                  <span className={styles.switchKnob} />
                </button>
              </div>

              <div className={styles.prefsCard}>
                <div className={styles.prefsInfo}>
                  <div className={styles.prefsTitle}>
                    <Translate id="nickmark.showcase.prefs.limitTitle">一括オープンの安全上限件数</Translate>
                  </div>
                  <div className={styles.prefsDesc}>
                    <Translate id="nickmark.showcase.prefs.limitDesc">
                      フォルダ一括オープン時に確認なしで自動展開する最大タブ数（1〜100件、既定 20件）
                    </Translate>
                  </div>
                </div>
                <div className={styles.stepperGroup}>
                  <button
                    type="button"
                    onClick={() => setBatchLimit((v) => Math.max(1, v - 5))}
                    className={styles.stepperBtn}
                    aria-label="-5"
                  >
                    -
                  </button>
                  <span className={styles.stepperValue}>{batchLimit}</span>
                  <button
                    type="button"
                    onClick={() => setBatchLimit((v) => Math.min(100, v + 5))}
                    className={styles.stepperBtn}
                    aria-label="+5"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.prefsCard}>
                <div className={styles.prefsInfo}>
                  <div className={styles.prefsTitle}>
                    <Translate id="nickmark.showcase.prefs.historyTitle">ブラウザ履歴検索（オプトイン）</Translate>
                  </div>
                  <div className={styles.prefsDesc}>
                    <Translate id="nickmark.showcase.prefs.historyDesc">
                      有効化したときのみ履歴権限を要求し、パレット検索のブックマーク候補の下へ一致履歴を表示します
                    </Translate>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={historyEnabled}
                  onClick={() => setHistoryEnabled((prev) => !prev)}
                  className={`${styles.switchBtn} ${historyEnabled ? styles.switchBtnOn : ''}`}
                  aria-label={translate({
                    id: 'nickmark.showcase.prefs.historyTitle',
                    message: 'ブラウザ履歴検索（オプトイン）',
                  })}
                >
                  <span className={styles.switchKnob} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
