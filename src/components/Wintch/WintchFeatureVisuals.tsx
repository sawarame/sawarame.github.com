import React from 'react';
import Translate from '@docusaurus/Translate';
import {
  Layers,
  Search,
  X,
  ShieldCheck,
  ArrowDown,
  Compass,
  FileText,
  Terminal,
  Cpu,
  ArrowUpRight,
  Lock,
  AppWindow,
} from 'lucide-react';
import styles from './WintchFeatureVisuals.module.css';

/**
 * ウィンドウ単位の切り替えと直近利用順（MRU）並び替えを表すビジュアルカードコンポーネント
 * @returns ウィンドウスイッチャービジュアルカード JSX 要素
 */
export function WindowSwitcherVisual(): JSX.Element {
  return (
    <div className={styles.visualCard}>
      <div className={styles.compareBox}>
        <div className={styles.compareLabel}>
          <Translate id="wintch.visual.switcher.beforeLabel">標準の Command + Tab（アプリ単位）</Translate>
        </div>
        <div className={styles.appChipRow}>
          <span className={styles.appChip}>
            <Terminal size={12} strokeWidth={2} />
            <span>Ghostty</span>
          </span>
          <span className={styles.appChip}>
            <Compass size={12} strokeWidth={2} />
            <span>Safari</span>
          </span>
          <span className={styles.appChip}>
            <AppWindow size={12} strokeWidth={2} />
            <span>Xcode</span>
          </span>
        </div>
      </div>

      <div className={styles.flowArrowRow} aria-hidden="true">
        <span className={styles.flowPill}>
          <Layers size={13} strokeWidth={2} />
          <span>Wintch (MRU)</span>
          <ArrowDown size={13} strokeWidth={2} />
        </span>
      </div>

      <div className={styles.miniPanel}>
        <div className={styles.miniPanelRow}>
          <span className={styles.miniRank}>1</span>
          <span className={styles.miniApp}>Ghostty</span>
          <span className={styles.miniSub}>~/dev/Wintch</span>
        </div>
        <div className={`${styles.miniPanelRow} ${styles.miniPanelRowActive}`}>
          <span className={styles.miniRank}>2</span>
          <span className={styles.miniApp}>Safari</span>
          <span className={styles.miniSub}>GitHub Releases</span>
        </div>
        <div className={styles.miniPanelRow}>
          <span className={styles.miniRank}>3</span>
          <span className={styles.miniApp}>Safari</span>
          <span className={styles.miniSub}>Documentation</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 検索ランチャーのファジー検索ハイライトとアプリ起動候補併用を表すビジュアルカードコンポーネント
 * @returns 検索ランチャービジュアルカード JSX 要素
 */
export function FuzzySearchVisual(): JSX.Element {
  return (
    <div className={styles.visualCard}>
      <div className={styles.miniPanel}>
        <div className={styles.miniSearchBar}>
          <Search size={14} strokeWidth={2} />
          <span className={styles.miniQuery}>note</span>
          <span className={styles.caret} aria-hidden="true" />
        </div>
        <div className={styles.miniDivider} />

        <div className={`${styles.miniPanelRow} ${styles.miniPanelRowActive}`}>
          <Compass size={14} strokeWidth={2} />
          <span className={styles.miniApp}>Safari</span>
          <span className={styles.miniSub}>
            Release <strong>Note</strong>s — Wintch
          </span>
        </div>

        <div className={styles.miniDivider} />
        <div className={styles.miniSectionHint}>
          <ArrowUpRight size={11} strokeWidth={2} />
          <span>
            <Translate id="wintch.visual.launchSection">アプリを起動</Translate>
          </span>
        </div>

        <div className={styles.miniPanelRow}>
          <FileText size={14} strokeWidth={2} />
          <span className={styles.miniApp}>
            <Translate id="wintch.visual.notesApp">メモ</Translate>
          </span>
          <span className={styles.miniSub}>
            <strong>Note</strong>s
          </span>
          <span className={styles.miniLaunchTag}>
            <Translate id="wintch.showcase.launchBadge">起動</Translate>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 一覧から選択中のウィンドウをそのまま閉じる操作を表すビジュアルカードコンポーネント
 * @returns ウィンドウクローズビジュアルカード JSX 要素
 */
export function SmartCloseVisual(): JSX.Element {
  return (
    <div className={styles.visualCard}>
      <div className={styles.closeActionHeader}>
        <kbd className={styles.keyPill}>⌥ + Q</kbd>
        <span className={styles.closeActionTitle}>
          <Translate id="wintch.visual.close.headline">選択中のウィンドウをその場で閉じる</Translate>
        </span>
      </div>

      <div className={styles.miniPanel}>
        <div className={styles.miniPanelRow}>
          <Terminal size={14} strokeWidth={2} />
          <span className={styles.miniApp}>Ghostty</span>
          <span className={styles.miniSub}>~/dev/Wintch</span>
        </div>
        <div className={`${styles.miniPanelRow} ${styles.miniPanelRowClosing}`}>
          <Compass size={14} strokeWidth={2} />
          <span className={styles.miniApp}>Safari</span>
          <span className={styles.miniSub}>Old Tab — Reference</span>
          <span className={styles.closeBadge}>
            <X size={12} strokeWidth={2.4} aria-hidden="true" />
            <span>⌥Q</span>
          </span>
        </div>
        <div className={styles.miniPanelRow}>
          <AppWindow size={14} strokeWidth={2} />
          <span className={styles.miniApp}>Xcode</span>
          <span className={styles.miniSub}>SwitcherListView.swift</span>
        </div>
      </div>

      <p className={styles.closeSafeNote}>
        <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
        <span>
          <Translate id="wintch.visual.close.safeNote">
            未保存の変更がある場合は、アプリ標準の確認ダイアログを尊重します
          </Translate>
        </span>
      </p>
    </div>
  );
}

/**
 * ネイティブ実装と完全ローカル動作を表すビジュアルカードコンポーネント
 * @returns ネイティブ設計ビジュアルカード JSX 要素
 */
export function NativeArchitectureVisual(): JSX.Element {
  const rows = [
    {
      icon: <Cpu size={16} strokeWidth={2} />,
      titleId: 'wintch.visual.arch.swiftTitle',
      title: 'Swift 6.0 + SwiftUI',
      statusId: 'wintch.visual.arch.swiftStatus',
      status: 'Apple Silicon / Intel 両対応のネイティブ実装',
    },
    {
      icon: <Lock size={16} strokeWidth={2} />,
      titleId: 'wintch.visual.arch.localTitle',
      title: '完全ローカル動作',
      statusId: 'wintch.visual.arch.localStatus',
      status: '外部通信やトラッキングは一切なし',
    },
    {
      icon: <AppWindow size={16} strokeWidth={2} />,
      titleId: 'wintch.visual.arch.menuBarTitle',
      title: 'メニューバー常駐',
      statusId: 'wintch.visual.arch.menuBarStatus',
      status: 'Dock を専有せず軽快に待機',
    },
    {
      icon: <ShieldCheck size={16} strokeWidth={2} />,
      titleId: 'wintch.visual.arch.axTitle',
      title: 'アクセシビリティ権限',
      statusId: 'wintch.visual.arch.axStatus',
      status: 'ショートカット検知とウィンドウ切り替えに使用',
    },
  ];

  return (
    <div className={styles.visualCard}>
      <div className={styles.permList}>
        {rows.map((row) => (
          <div key={row.titleId} className={styles.permRow}>
            <span className={styles.permIconPrimary}>{row.icon}</span>
            <div className={styles.permTextWrap}>
              <div className={styles.permTitle}>
                <Translate id={row.titleId}>{row.title}</Translate>
              </div>
              <div className={styles.permStatus}>
                <Translate id={row.statusId}>{row.status}</Translate>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
