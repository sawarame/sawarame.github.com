import React from 'react';
import Translate from '@docusaurus/Translate';
import {
  ArrowDown,
  Folder,
  Globe,
  Pin,
  ShieldCheck,
  Lock,
  Cloud,
  Languages,
  FileJson,
  Upload,
  Pencil,
  History,
} from 'lucide-react';
import styles from './NickmarkFeatureVisuals.module.css';

/**
 * コマンドパレットランチャーの操作感とタブ展開アクションを表すビジュアルカード
 * @returns コマンドパレットビジュアル JSX 要素
 */
export function CommandPaletteVisual(): JSX.Element {
  return (
    <div className={styles.visualCard}>
      <div className={styles.cardHeaderRow}>
        <kbd className={styles.accentKbd}>⌥ + ⇧ + D</kbd>
        <kbd className={styles.accentKbd}>Alt + Shift + D</kbd>
        <span className={styles.cardHeadline}>
          <Translate id="nickmark.visual.palette.headline">どこからでも即座に起動</Translate>
        </span>
      </div>

      <div className={styles.miniPanel}>
        <div className={`${styles.miniRow} ${styles.miniRowActive}`}>
          <Globe size={14} strokeWidth={2} aria-hidden="true" />
          <span className={styles.miniBadge}>gh</span>
          <span className={styles.miniTitle}>GitHub Repository</span>
          <span className={styles.miniSub}>Tier 1</span>
        </div>
        <div className={styles.miniRow}>
          <Globe size={14} strokeWidth={2} aria-hidden="true" />
          <span className={styles.miniBadge}>gh/pr</span>
          <span className={styles.miniTitle}>Open Pull Requests</span>
          <span className={styles.miniSub}>Tier 2</span>
        </div>
        <div className={styles.miniRow}>
          <Globe size={14} strokeWidth={2} aria-hidden="true" />
          <span className={styles.miniBadge}>docs</span>
          <span className={styles.miniTitle}>GitHub Actions Docs</span>
          <span className={styles.miniSub}>Tier 4</span>
        </div>
      </div>

      <div className={styles.dispositionGrid}>
        <div className={styles.dispositionChip}>
          <kbd>Enter</kbd>
          <span>
            <Translate id="nickmark.visual.palette.curTab">現在のタブ</Translate>
          </span>
        </div>
        <div className={styles.dispositionChip}>
          <kbd>⌘/Ctrl+Enter</kbd>
          <span>
            <Translate id="nickmark.visual.palette.newTab">新規タブ</Translate>
          </span>
        </div>
        <div className={styles.dispositionChip}>
          <kbd>Shift+Enter</kbd>
          <span>
            <Translate id="nickmark.visual.palette.bgTab">連続バックグラウンド</Translate>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 動的 URL (%s) 展開とブックマークレット実行を表すビジュアルカード
 * @returns 動的 URL ＆ ブックマークレットビジュアル JSX 要素
 */
export function DynamicUrlVisual(): JSX.Element {
  return (
    <div className={styles.visualCard}>
      <div className={styles.transformBox}>
        <div className={styles.codeLine}>
          <span className={styles.miniBadge}>gh</span>
          <span className={styles.templateUrl}>
            https://github.com/<span className={styles.placeholderTag}>%s</span>
          </span>
        </div>
        <div className={styles.codeLine}>
          <kbd className={styles.accentKbd}>gh sawarame/Nickmark</kbd>
        </div>
      </div>

      <div className={styles.arrowCenter} aria-hidden="true">
        <ArrowDown size={16} strokeWidth={2.4} />
      </div>

      <div className={styles.transformBox}>
        <div className={styles.codeLine}>
          <span className={styles.resolvedUrl}>https://github.com/sawarame/Nickmark</span>
        </div>
      </div>

      <div className={styles.bookmarkletBox}>
        <span className={styles.jsTag}>[JS]</span>
        <div className={styles.bookmarkletMeta}>
          <div className={styles.bookmarkletTitle}>
            <Translate id="nickmark.visual.dynamic.bmlTitle">
              userScripts API（MAIN world）で直接実行
            </Translate>
          </div>
          <div className={styles.bookmarkletSub}>
            javascript:navigator.clipboard.writeText(location.href)
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * スラッシュ区切りフォルダと一括オープン機能を表すビジュアルカード
 * @returns フォルダ一括オープンビジュアル JSX 要素
 */
export function FolderBatchVisual(): JSX.Element {
  const entries = [
    { nick: 'work/mail', title: 'Team Webmail', url: 'mail.example.com' },
    { nick: 'work/docs', title: 'Architecture Docs', url: 'docs.example.com' },
    { nick: 'work/board', title: 'Sprint Board', url: 'issues.example.com' },
  ];

  return (
    <div className={styles.visualCard}>
      <div className={styles.folderRootRow}>
        <span className={styles.folderRootLeft}>
          <Folder size={15} strokeWidth={2.2} aria-hidden="true" />
          <span>:open work/</span>
        </span>
        <span className={styles.folderCountPill}>
          <Translate id="nickmark.visual.folder.count">3タブを一括起動</Translate>
        </span>
      </div>

      <div className={styles.miniPanel}>
        {entries.map((item) => (
          <div key={item.nick} className={styles.miniRow}>
            <Globe size={14} strokeWidth={2} aria-hidden="true" />
            <span className={styles.miniBadge}>{item.nick}</span>
            <span className={styles.miniTitle}>{item.title}</span>
            <span className={styles.miniSub}>{item.url}</span>
          </div>
        ))}
      </div>

      <p className={styles.noteStrip}>
        <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
        <span>
          <Translate id="nickmark.visual.folder.safeNote">
            重複 URL 除外・安全上限（1〜100件、既定 20件）超過時は確認ダイアログを表示
          </Translate>
        </span>
      </p>
    </div>
  );
}

/**
 * 指数減衰スコアリングとインライン編集・インポート機能を表すビジュアルカード
 * @returns 自動学習＆管理ダッシュボードビジュアル JSX 要素
 */
export function RankingDashboardVisual(): JSX.Element {
  return (
    <div className={styles.visualCard}>
      <div className={styles.formulaBox}>
        <span className={styles.cardHeadline}>
          <Translate id="nickmark.visual.rank.formulaLabel">指数減衰スコア</Translate>
        </span>
        <code className={styles.formulaCode}>Score × 0.95^days + 1.0</code>
      </div>

      <div className={styles.miniPanel}>
        <div className={`${styles.miniRow} ${styles.miniRowActive}`}>
          <Pin size={14} strokeWidth={2.2} aria-hidden="true" />
          <span className={styles.miniBadge}>gh</span>
          <span className={styles.miniTitle}>GitHub</span>
          <span className={styles.rankMeta}>Pinned · 26.4</span>
        </div>
        <div className={styles.miniRow}>
          <Globe size={14} strokeWidth={2} aria-hidden="true" />
          <span className={styles.miniBadge}>g</span>
          <span className={styles.miniTitle}>Google Search</span>
          <span className={styles.rankMeta}>21.0</span>
        </div>
        <div className={styles.miniRow}>
          <Globe size={14} strokeWidth={2} aria-hidden="true" />
          <span className={styles.miniBadge}>work/mail</span>
          <span className={styles.miniTitle}>Team Webmail</span>
          <span className={styles.rankMeta}>18.7</span>
        </div>
      </div>

      <div className={styles.featureChipGrid}>
        <span className={styles.featureChip}>
          <Pencil size={12} strokeWidth={2.2} aria-hidden="true" />
          <Translate id="nickmark.visual.rank.inline">セル直接インライン編集</Translate>
        </span>
        <span className={styles.featureChip}>
          <Upload size={12} strokeWidth={2.2} aria-hidden="true" />
          <Translate id="nickmark.visual.rank.import">Chrome HTML / JSON 取込</Translate>
        </span>
        <span className={styles.featureChip}>
          <FileJson size={12} strokeWidth={2.2} aria-hidden="true" />
          <Translate id="nickmark.visual.rank.json">JSON エディタ＆バックアップ</Translate>
        </span>
      </div>
    </div>
  );
}

/**
 * プライバシー保護・ストレージ同期・多言語設計を表すビジュアルカード
 * @returns プライバシー＆アーキテクチャビジュアル JSX 要素
 */
export function PrivacySyncVisual(): JSX.Element {
  const rows = [
    {
      icon: <Lock size={16} strokeWidth={2} />,
      titleId: 'nickmark.visual.arch.localTitle',
      title: '外部サーバー通信・トラッキングなし',
      statusId: 'nickmark.visual.arch.localStatus',
      status: 'ブックマークデータはブラウザ内または個人 Chrome 同期にのみ保存',
    },
    {
      icon: <Cloud size={16} strokeWidth={2} />,
      titleId: 'nickmark.visual.arch.syncTitle',
      title: 'ローカル無制限 & Chrome アカウント同期',
      statusId: 'nickmark.visual.arch.syncStatus',
      status: '100KB 上限の自動 8KB チャンク分割・競合解決ダイアログ付き',
    },
    {
      icon: <History size={16} strokeWidth={2} />,
      titleId: 'nickmark.visual.arch.historyTitle',
      title: 'オプトイン履歴検索 (optional_permissions)',
      statusId: 'nickmark.visual.arch.historyStatus',
      status: '設定画面で明示的に有効化しない限り、閲覧履歴への権限を要求しません',
    },
    {
      icon: <Languages size={16} strokeWidth={2} />,
      titleId: 'nickmark.visual.arch.i18nTitle',
      title: '日英バイリンガル即時切替 & MIT ライセンス',
      statusId: 'nickmark.visual.arch.i18nStatus',
      status: 'TypeScript / Vue 3 / PrimeVue 製のオープンソース拡張機能',
    },
  ];

  return (
    <div className={styles.visualCard}>
      <div className={styles.archList}>
        {rows.map((row) => (
          <div key={row.titleId} className={styles.archRow}>
            <div className={styles.archIconWrap} aria-hidden="true">
              {row.icon}
            </div>
            <div className={styles.archTextWrap}>
              <div className={styles.archTitle}>
                <Translate id={row.titleId}>{row.title}</Translate>
              </div>
              <div className={styles.archStatus}>
                <Translate id={row.statusId}>{row.status}</Translate>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
