import React, { useState, useMemo, useCallback } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Translate, { translate } from '@docusaurus/Translate';
import {
  Search,
  Layers,
  Settings,
  Terminal,
  Compass,
  Code2,
  MessageSquare,
  Folder,
  FileText,
  Sliders,
  CheckCircle2,
  RotateCcw,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import styles from './WintchShowcase.module.css';
import { computeHighlightedSegments, matchesFuzzyAndQuery } from './searchUtils';

/**
 * ショーケースで切り替え表示するデモモード種別
 */
type ShowcaseTab = 'switcher' | 'launcher' | 'settings';

/**
 * デモ表示用のウィンドウ項目データ
 */
interface DemoWindowItem {
  /** 一意の識別子 */
  id: string;
  /** アプリケーション名 */
  appName: string;
  /** ウィンドウタイトル */
  windowTitle: string;
  /** アプリアイコン種別 */
  iconType: 'terminal' | 'browser' | 'code' | 'chat' | 'finder';
  /** 背景グラデーション */
  iconBg: string;
}

/**
 * デモ表示用の未起動アプリ候補データ
 */
interface DemoAppItem {
  /** 一意の識別子 */
  id: string;
  /** アプリケーション表示名 */
  displayName: string;
  /** 英語名などの別名 */
  alternateName: string;
  /** 既に開いているウィンドウのアプリ名と照合するためのキー */
  appKey: string;
  /** アイコン種別 */
  iconType: 'notes' | 'settings' | 'code' | 'browser' | 'chat';
  /** 背景グラデーション */
  iconBg: string;
}

/**
 * 初期状態のデモウィンドウ一覧（MRU 順）
 */
const INITIAL_WINDOWS: DemoWindowItem[] = [
  {
    id: 'w1',
    appName: 'Ghostty',
    windowTitle: '~/dev/Wintch — swift test',
    iconType: 'terminal',
    iconBg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  },
  {
    id: 'w2',
    appName: 'Safari',
    windowTitle: 'Wintch — GitHub Releases',
    iconType: 'browser',
    iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  },
  {
    id: 'w3',
    appName: 'Xcode',
    windowTitle: 'SwitcherListView.swift — Wintch',
    iconType: 'code',
    iconBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  },
  {
    id: 'w4',
    appName: 'Safari',
    windowTitle: 'Apple Developer Documentation — AXUIElement',
    iconType: 'browser',
    iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  },
  {
    id: 'w5',
    appName: 'Slack',
    windowTitle: '#dev-macos — ワークスペース',
    iconType: 'chat',
    iconBg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  },
  {
    id: 'w6',
    appName: 'Finder',
    windowTitle: 'Applications',
    iconType: 'finder',
    iconBg: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
  },
];

/**
 * ランチャーモードで表示するインストール済みアプリ候補
 */
const DEMO_APPS: DemoAppItem[] = [
  {
    id: 'a1',
    displayName: 'メモ',
    alternateName: 'Notes',
    appKey: 'Notes',
    iconType: 'notes',
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  },
  {
    id: 'a2',
    displayName: 'システム設定',
    alternateName: 'System Settings',
    appKey: 'System Settings',
    iconType: 'settings',
    iconBg: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  },
  {
    id: 'a3',
    displayName: 'Visual Studio Code',
    alternateName: 'VSCode',
    appKey: 'Visual Studio Code',
    iconType: 'code',
    iconBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
  },
  {
    id: 'a4',
    displayName: 'Safari',
    alternateName: '',
    appKey: 'Safari',
    iconType: 'browser',
    iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
  },
  {
    id: 'a5',
    displayName: 'Slack',
    alternateName: '',
    appKey: 'Slack',
    iconType: 'chat',
    iconBg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  },
];

/**
 * アプリ種別に対応するアイコン要素を返すヘルパー関数
 * @param iconType - アイコン種別文字列
 * @returns Lucide アイコン JSX 要素
 */
function renderAppIcon(iconType: DemoWindowItem['iconType'] | DemoAppItem['iconType']): JSX.Element {
  switch (iconType) {
    case 'terminal':
      return <Terminal size={14} strokeWidth={2.2} color="#ffffff" />;
    case 'browser':
      return <Compass size={14} strokeWidth={2.2} color="#ffffff" />;
    case 'code':
      return <Code2 size={14} strokeWidth={2.2} color="#ffffff" />;
    case 'chat':
      return <MessageSquare size={14} strokeWidth={2.2} color="#ffffff" />;
    case 'finder':
      return <Folder size={14} strokeWidth={2.2} color="#ffffff" />;
    case 'notes':
      return <FileText size={14} strokeWidth={2.2} color="#ffffff" />;
    case 'settings':
      return <Sliders size={14} strokeWidth={2.2} color="#ffffff" />;
  }
}

/**
 * LinearMouse のような macOS UI プレビューを提供するインタラクティブショーケースコンポーネント
 * 通常スイッチャー・検索ランチャー・設定画面の3モードを切り替えながら操作感を体験できる
 * @returns ショーケースセクションの JSX 要素
 */
export default function WintchShowcase(): JSX.Element {
  const menuBarIconUrl = useBaseUrl('/img/wintch/menubar-icon.svg');

  const [activeTab, setActiveTab] = useState<ShowcaseTab>('switcher');
  const [windows, setWindows] = useState<DemoWindowItem[]>(INITIAL_WINDOWS);
  const [selectedIndex, setSelectedIndex] = useState<number>(1);
  const [closeFeedback, setCloseFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('saf');
  const [launcherSelectedIndex, setLauncherSelectedIndex] = useState<number>(0);
  const [launchFeedback, setLaunchFeedback] = useState<string | null>(null);

  const [launchAtLogin, setLaunchAtLogin] = useState<boolean>(true);

  /**
   * 検索クエリに基づいてフィルタリングされたウィンドウ候補一覧
   */
  const filteredWindows = useMemo(() => {
    if (!searchQuery.trim()) {
      return windows;
    }
    return windows.filter((w) =>
      matchesFuzzyAndQuery(`${w.appName} ${w.windowTitle}`, searchQuery)
    );
  }, [windows, searchQuery]);

  /**
   * 検索クエリ入力時に上部ウィンドウ候補と重複しない未表示アプリ起動候補一覧
   */
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const visibleApps = new Set(filteredWindows.map((w) => w.appName.toLowerCase()));
    return DEMO_APPS.filter(
      (app) =>
        !visibleApps.has(app.appKey.toLowerCase()) &&
        matchesFuzzyAndQuery(`${app.displayName} ${app.alternateName}`, searchQuery)
    );
  }, [filteredWindows, searchQuery]);

  /**
   * 通常スイッチャーで選択カーソルを循環移動する
   * @param delta - 移動方向（+1: 次へ、-1: 前へ）
   * @returns なし
   */
  const moveSwitcherSelection = useCallback(
    (delta: number) => {
      if (windows.length === 0) return;
      setSelectedIndex((prev) => (prev + delta + windows.length) % windows.length);
      setCloseFeedback(null);
    },
    [windows.length]
  );

  /**
   * 通常スイッチャーで現在選択中のウィンドウを閉じるデモ動作を実行する
   * @returns なし
   */
  const handleDemoCloseSelected = useCallback(() => {
    if (windows.length === 0) return;
    const safeIdx = Math.min(selectedIndex, windows.length - 1);
    const target = windows[safeIdx];
    const nextWindows = windows.filter((w) => w.id !== target.id);

    setWindows(nextWindows);
    if (nextWindows.length === 0) {
      setSelectedIndex(0);
    } else if (safeIdx >= nextWindows.length) {
      setSelectedIndex(nextWindows.length - 1);
    } else {
      setSelectedIndex(safeIdx);
    }

    setCloseFeedback(
      translate(
        {
          id: 'wintch.showcase.feedback.closedWindow',
          message: '「{appName} — {title}」を閉じました',
        },
        { appName: target.appName, title: target.windowTitle }
      )
    );
  }, [windows, selectedIndex]);

  /**
   * デモウィンドウ一覧を初期状態にリセットする
   * @returns なし
   */
  const handleResetDemo = useCallback(() => {
    setWindows(INITIAL_WINDOWS);
    setSelectedIndex(1);
    setCloseFeedback(null);
  }, []);

  /**
   * ランチャー検索入力値を更新し、選択カーソルを先頭へ戻す
   * @param nextQuery - 新しい検索クエリ
   * @returns なし
   */
  const handleQueryChange = useCallback((nextQuery: string) => {
    setSearchQuery(nextQuery);
    setLauncherSelectedIndex(0);
    setLaunchFeedback(null);
  }, []);

  const safeSwitcherIndex = windows.length > 0 ? Math.min(selectedIndex, windows.length - 1) : 0;
  const totalLauncherCount = filteredWindows.length + filteredApps.length;
  const safeLauncherIndex =
    totalLauncherCount > 0 ? Math.min(launcherSelectedIndex, totalLauncherCount - 1) : 0;

  return (
    <div className={styles.showcaseWrap}>
      {/* モード切替タブ（macOS セグメント風） */}
      <div className={styles.tabBar} role="tablist" aria-label={translate({ id: 'wintch.showcase.tablistLabel', message: 'Wintch プレビューモード' })}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'switcher'}
          className={`${styles.tabButton} ${activeTab === 'switcher' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('switcher')}
        >
          <Layers size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <Translate id="wintch.showcase.tab.switcher">通常スイッチャー</Translate>
          </span>
          <kbd className={styles.tabShortcut}>⌥ Tab</kbd>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'launcher'}
          className={`${styles.tabButton} ${activeTab === 'launcher' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('launcher')}
        >
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <Translate id="wintch.showcase.tab.launcher">検索ランチャー</Translate>
          </span>
          <kbd className={styles.tabShortcut}>⌥ Space</kbd>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          className={`${styles.tabButton} ${activeTab === 'settings' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <Translate id="wintch.showcase.tab.settings">設定・権限</Translate>
          </span>
          <kbd className={styles.tabShortcut}>⌘ ,</kbd>
        </button>
      </div>

      {/* macOS デスクトップ風の背景キャンバス */}
      <div className={styles.desktopFrame}>
        {/* 模擬 macOS メニューバー */}
        <div className={styles.macMenuBar} aria-hidden="true">
          <div className={styles.macMenuBarLeft}>
            <span className={styles.macAppleDot} />
            <span className={styles.macMenuApp}>Wintch</span>
            <span className={styles.macMenuHint}>macOS 14.0+</span>
          </div>
          <div className={styles.macMenuBarRight}>
            <span className={styles.menuBarIconBadge} title="Wintch MenuBarExtra">
              <img src={menuBarIconUrl} alt="" className={styles.menuBarSvg} />
            </span>
            <span className={styles.macClock}>16:40</span>
          </div>
        </div>

        {/* パネル表示エリア */}
        <div className={styles.stageArea}>
          {activeTab === 'switcher' && (
            <div className={styles.panelColumn}>
              <div className={styles.wintchPanel}>
                {windows.length === 0 ? (
                  <div className={styles.emptyPanel}>
                    <p className={styles.emptyText}>
                      <Translate id="wintch.showcase.allClosed">
                        すべてのデモウィンドウを閉じました
                      </Translate>
                    </p>
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className={styles.demoResetInline}
                    >
                      <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                      <Translate id="wintch.showcase.reset">デモをリセット</Translate>
                    </button>
                  </div>
                ) : (
                  <div className={styles.listPadding}>
                    {windows.map((win, idx) => {
                      const isSelected = idx === safeSwitcherIndex;
                      return (
                        <button
                          key={win.id}
                          type="button"
                          onClick={() => {
                            setSelectedIndex(idx);
                            setCloseFeedback(null);
                          }}
                          className={`${styles.windowRow} ${isSelected ? styles.windowRowSelected : ''}`}
                        >
                          <span className={styles.rowAppIcon} style={{ background: win.iconBg }}>
                            {renderAppIcon(win.iconType)}
                          </span>
                          <span className={styles.rowTextGroup}>
                            <span className={styles.rowAppName}>{win.appName}</span>
                            <span className={styles.rowWindowTitle}>{win.windowTitle}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* プレビュー操作用コントロール */}
              <div className={styles.demoControls}>
                <button
                  type="button"
                  onClick={() => moveSwitcherSelection(-1)}
                  className={styles.demoControlBtn}
                  disabled={windows.length === 0}
                >
                  <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <Translate id="wintch.showcase.btn.prev">前へ</Translate>
                  </span>
                  <kbd>⌥⇧⇥</kbd>
                </button>
                <button
                  type="button"
                  onClick={() => moveSwitcherSelection(1)}
                  className={styles.demoControlBtn}
                  disabled={windows.length === 0}
                >
                  <span>
                    <Translate id="wintch.showcase.btn.next">次へ</Translate>
                  </span>
                  <kbd>⌥⇥</kbd>
                  <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleDemoCloseSelected}
                  className={`${styles.demoControlBtn} ${styles.demoDangerBtn}`}
                  disabled={windows.length === 0}
                >
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                  <span>
                    <Translate id="wintch.showcase.btn.close">閉じる</Translate>
                  </span>
                  <kbd>⌥Q</kbd>
                </button>
                {windows.length < INITIAL_WINDOWS.length && (
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className={styles.demoControlBtn}
                  >
                    <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                    <Translate id="wintch.showcase.reset">デモをリセット</Translate>
                  </button>
                )}
              </div>

              {closeFeedback && (
                <p className={styles.demoFeedback} role="status">
                  {closeFeedback}
                </p>
              )}
            </div>
          )}

          {activeTab === 'launcher' && (
            <div className={styles.panelColumn}>
              <div className={styles.wintchPanel}>
                {/* 検索入力ヘッダ */}
                <div className={styles.searchHeader}>
                  <Search size={16} strokeWidth={2} className={styles.searchIcon} aria-hidden="true" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={translate({
                      id: 'wintch.showcase.searchPlaceholder',
                      message: 'アプリ名やウィンドウタイトルで検索（例: saf, note, code）',
                    })}
                    className={styles.searchInput}
                    aria-label={translate({
                      id: 'wintch.showcase.searchAria',
                      message: '検索ランチャーのデモ入力欄',
                    })}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleQueryChange('')}
                      className={styles.clearQueryBtn}
                      aria-label={translate({ id: 'wintch.showcase.clearQuery', message: '検索をクリア' })}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>

                <div className={styles.panelDivider} />

                {filteredWindows.length === 0 && filteredApps.length === 0 ? (
                  <div className={styles.emptyPanel}>
                    <p className={styles.emptyText}>
                      <Translate id="wintch.showcase.noMatch">
                        一致するウィンドウがありません
                      </Translate>
                    </p>
                  </div>
                ) : (
                  <div className={styles.listPadding}>
                    {filteredWindows.map((win, idx) => {
                      const isSelected = idx === safeLauncherIndex;
                      const appSegments = computeHighlightedSegments(win.appName, searchQuery);
                      const titleSegments = computeHighlightedSegments(win.windowTitle, searchQuery);

                      return (
                        <button
                          key={win.id}
                          type="button"
                          onClick={() => {
                            setLauncherSelectedIndex(idx);
                            setLaunchFeedback(
                              translate(
                                {
                                  id: 'wintch.showcase.feedback.switchWindow',
                                  message: '「{appName} — {title}」へ切り替えました',
                                },
                                { appName: win.appName, title: win.windowTitle }
                              )
                            );
                          }}
                          className={`${styles.windowRow} ${isSelected ? styles.windowRowSelected : ''}`}
                        >
                          <span className={styles.rowAppIcon} style={{ background: win.iconBg }}>
                            {renderAppIcon(win.iconType)}
                          </span>
                          <span className={styles.rowTextGroup}>
                            <span className={styles.rowAppName}>
                              {appSegments.map((seg, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={
                                    seg.matched
                                      ? isSelected
                                        ? styles.matchSelected
                                        : styles.matchNormal
                                      : undefined
                                  }
                                >
                                  {seg.text}
                                </span>
                              ))}
                            </span>
                            <span className={styles.rowWindowTitle}>
                              {titleSegments.map((seg, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={
                                    seg.matched
                                      ? isSelected
                                        ? styles.matchSelected
                                        : styles.matchNormal
                                      : undefined
                                  }
                                >
                                  {seg.text}
                                </span>
                              ))}
                            </span>
                          </span>
                        </button>
                      );
                    })}

                    {filteredApps.length > 0 && (
                      <>
                        {filteredWindows.length > 0 && <div className={styles.sectionDivider} />}
                        <div className={styles.launchSectionHeader}>
                          <ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />
                          <span>
                            {filteredWindows.length === 0 ? (
                              <Translate id="wintch.showcase.launchHeaderNoWin">
                                一致するウィンドウがないため、アプリを起動
                              </Translate>
                            ) : (
                              <Translate id="wintch.showcase.launchHeader">
                                アプリを起動
                              </Translate>
                            )}
                          </span>
                        </div>

                        {filteredApps.map((app, appIdx) => {
                          const unifiedIdx = filteredWindows.length + appIdx;
                          const isSelected = unifiedIdx === safeLauncherIndex;
                          const nameSegments = computeHighlightedSegments(app.displayName, searchQuery);
                          const altSegments = computeHighlightedSegments(app.alternateName, searchQuery);

                          return (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => {
                                setLauncherSelectedIndex(unifiedIdx);
                                setLaunchFeedback(
                                  translate(
                                    {
                                      id: 'wintch.showcase.feedback.launchApp',
                                      message: '「{appName}」を起動しました',
                                    },
                                    { appName: app.displayName }
                                  )
                                );
                              }}
                              className={`${styles.windowRow} ${isSelected ? styles.windowRowSelected : ''}`}
                            >
                              <span className={styles.rowAppIcon} style={{ background: app.iconBg }}>
                                {renderAppIcon(app.iconType)}
                              </span>
                              <span className={styles.rowTextGroup}>
                                <span className={styles.rowAppName}>
                                  {nameSegments.map((seg, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={
                                        seg.matched
                                          ? isSelected
                                            ? styles.matchSelected
                                            : styles.matchNormal
                                          : undefined
                                      }
                                    >
                                      {seg.text}
                                    </span>
                                  ))}
                                </span>
                                {app.alternateName && (
                                  <span className={styles.rowWindowTitle}>
                                    {altSegments.map((seg, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className={
                                          seg.matched
                                            ? isSelected
                                              ? styles.matchSelected
                                              : styles.matchNormal
                                            : undefined
                                        }
                                      >
                                        {seg.text}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </span>
                              <span className={`${styles.launchBadge} ${isSelected ? styles.launchBadgeSelected : ''}`}>
                                <Translate id="wintch.showcase.launchBadge">起動</Translate>
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* サンプル検索チップ */}
              <div className={styles.sampleRow}>
                <span className={styles.sampleLabel}>
                  <Translate id="wintch.showcase.tryQuery">試してみる:</Translate>
                </span>
                {['saf', 'note', 'code', 'メモ', ''].map((sample) => (
                  <button
                    key={sample || 'empty'}
                    type="button"
                    onClick={() => handleQueryChange(sample)}
                    className={`${styles.sampleChip} ${searchQuery === sample ? styles.sampleChipActive : ''}`}
                  >
                    {sample ? `"${sample}"` : translate({ id: 'wintch.showcase.allMru', message: '空欄 (MRU)' })}
                  </button>
                ))}
              </div>

              {launchFeedback && (
                <p className={styles.demoFeedback} role="status">
                  {launchFeedback}
                </p>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className={styles.panelColumn}>
              <div className={styles.settingsWindow}>
                <div className={styles.settingsTitleBar}>
                  <span className={styles.trafficLights} aria-hidden="true">
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </span>
                  <span className={styles.settingsWindowTitle}>
                    <Translate id="wintch.showcase.settings.title">Wintch 設定</Translate>
                  </span>
                  <span className={styles.settingsSpacer} />
                </div>

                <div className={styles.settingsBody}>
                  <div className={styles.settingsSection}>
                    <div className={styles.settingsSectionLabel}>
                      <Translate id="wintch.showcase.settings.normalSection">
                        通常スイッチャー（ホールド式）
                      </Translate>
                    </div>
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsRow}>
                        <span>
                          <Translate id="wintch.showcase.settings.shortcut">
                            起動ショートカット
                          </Translate>
                        </span>
                        <kbd className={styles.shortcutCap}>⌥ + ⇥</kbd>
                      </div>
                      <div className={styles.settingsRowDivider} />
                      <div className={styles.settingsRow}>
                        <span>
                          <Translate id="wintch.showcase.settings.reverse">
                            逆順移動
                          </Translate>
                        </span>
                        <span className={styles.settingsMuted}>⌥ + ⇧ + ⇥</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsSection}>
                    <div className={styles.settingsSectionLabel}>
                      <Translate id="wintch.showcase.settings.launcherSection">
                        検索ランチャー（トグル式）
                      </Translate>
                    </div>
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsRow}>
                        <span>
                          <Translate id="wintch.showcase.settings.shortcut">
                            起動ショートカット
                          </Translate>
                        </span>
                        <kbd className={styles.shortcutCap}>⌥ + Space</kbd>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsSection}>
                    <div className={styles.settingsSectionLabel}>
                      <Translate id="wintch.showcase.settings.generalAndPerm">
                        一般・システム権限
                      </Translate>
                    </div>
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsRow}>
                        <span>
                          <Translate id="wintch.showcase.settings.launchAtLogin">
                            ログイン時に自動起動
                          </Translate>
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={launchAtLogin}
                          onClick={() => setLaunchAtLogin((prev) => !prev)}
                          className={`${styles.macSwitch} ${launchAtLogin ? styles.macSwitchOn : ''}`}
                          aria-label={translate({
                            id: 'wintch.showcase.settings.launchAtLogin',
                            message: 'ログイン時に自動起動',
                          })}
                        >
                          <span className={styles.macSwitchKnob} />
                        </button>
                      </div>
                      <div className={styles.settingsRowDivider} />
                      <div className={styles.settingsRow}>
                        <span>
                          <Translate id="wintch.showcase.settings.accessibility">
                            アクセシビリティ権限
                          </Translate>
                        </span>
                        <span className={styles.permGranted}>
                          <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden="true" />
                          <Translate id="wintch.showcase.settings.granted">許可済み</Translate>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
