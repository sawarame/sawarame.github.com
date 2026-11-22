import React, { useState, useMemo, useCallback } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import {
  Search,
  Terminal,
  Globe,
  Folder,
  Code2,
  Pin,
  Lightbulb,
  X,
  CheckCircle2,
  RotateCcw,
  Plus,
  Star,
  GitBranch,
  Mail,
  BookOpen,
  Kanban,
  Sparkles,
  ArrowUp,
  Puzzle,
  Info,
} from 'lucide-react';
import styles from './NickmarkShowcase.module.css';
import {
  buildDemoPaletteItems,
  DemoBookmarkItem,
  DemoLocale,
  DemoSearchResult,
  findDemoNicknamesForUrl,
  hasForbiddenDemoNicknameChars,
  isDemoCommandQuery,
  normalizeDemoCommandPrefix,
  normalizeDemoLocale,
  normalizeDemoNicknamePath,
} from './nickmarkSearchUtils';

/**
 * デモブックマーク追加時の「たった今」ラベル（5 言語対応）
 */
const JUST_NOW_LABELS: Record<DemoLocale, string> = {
  ja: 'たった今',
  en: 'Just now',
  'zh-Hans': '刚刚',
  'zh-Hant': '剛剛',
  ko: '방금 전',
};

/**
 * デモブラウザの模擬タブ項目データ
 */
interface DemoBrowserTab {
  /** 一意の識別子 */
  id: string;
  /** タブのページタイトル */
  title: string;
  /** タブで表示中の URL */
  url: string;
  /** バックグラウンドで新規追加された未確認タブかどうか */
  isUnreadBg?: boolean;
}

/**
 * 初期状態のデモブラウザタブ一覧
 */
const INITIAL_BROWSER_TABS: DemoBrowserTab[] = [
  {
    id: 'tab-initial',
    title: 'Nickmark — sawara.me',
    url: 'https://sawara.me/nickmark',
  },
];

/**
 * 初期状態のデモ用ブックマークデータ
 */
const INITIAL_DEMO_BOOKMARKS: DemoBookmarkItem[] = [
  {
    id: 'b1',
    nickname: 'gh/Nickmark',
    title: 'sawarame/Nickmark — GitHub',
    url: 'https://github.com/sawarame/Nickmark',
    isPinned: true,
    score: 26.4,
    lastUsedLabel: '2m',
  },
  {
    id: 'b2',
    nickname: 'gh/Wintch',
    title: 'sawarame/Wintch — GitHub',
    url: 'https://github.com/sawarame/Wintch',
    isPinned: false,
    score: 22.8,
    lastUsedLabel: '15m',
  },
  {
    id: 'b3',
    nickname: 'work/mail',
    title: 'Team Webmail',
    url: 'https://mail.example.com/inbox',
    isPinned: false,
    score: 18.7,
    lastUsedLabel: '1h',
  },
  {
    id: 'b4',
    nickname: 'work/docs',
    title: 'Architecture & Design Docs',
    url: 'https://docs.example.com/architecture',
    isPinned: false,
    score: 15.2,
    lastUsedLabel: '3h',
  },
  {
    id: 'b5',
    nickname: 'work/board',
    title: 'Sprint Issue Board',
    url: 'https://issues.example.com/board',
    isPinned: false,
    score: 12.1,
    lastUsedLabel: '1d',
  },
  {
    id: 'b6',
    nickname: 'g',
    title: 'Google Search',
    url: 'https://www.google.com/search?q=%s',
    defaultValue: 'Nickmark',
    isPinned: false,
    score: 21.0,
    lastUsedLabel: '20m',
  },
  {
    id: 'b7',
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
    message: ':add <名前>（または ;add / :a）で、開いているタブを即座にブックマーク登録できます。',
  },
  {
    id: 'nickmark.showcase.tip2',
    message: 'フォルダ名/（例: work/）と入力して Enter を押すと、配下のブックマークを一括で開けます。',
  },
  {
    id: 'nickmark.showcase.tip3',
    message: 'URL に %s を含めて登録すると、「ニックネーム 検索語」で引数を埋め込んで遷移できます。',
  },
  {
    id: 'nickmark.showcase.tip4',
    message: 'Shift+Enter でポップアップを閉じずにバックグラウンドタブへ連続起動、Cmd/Ctrl+Enter で新しいタブに開けます。',
  },
];

/**
 * 現在アクティブなブラウザタブの URL に応じてブラウザビューポート全体の模擬 Web ページを描画する
 * 右上に Nickmark ポップアップが重なっても左側・下側でページ切り替えがはっきり視認できる構成にする
 * @param tab - アクティブなデモブラウザタブ
 * @returns 模擬 Web ページの JSX 要素
 */
function SimulatedWebPage({ tab }: { tab: DemoBrowserTab }): JSX.Element {
  const url = tab.url;

  // 1. GitHub リポジトリ画面
  if (url.includes('github.com')) {
    const repoPath = url.replace(/^https?:\/\/github\.com\//, '') || 'sawarame/Nickmark';
    const isWintch = repoPath.toLowerCase().includes('wintch');
    return (
      <div className={`${styles.webPageSurface} ${styles.pageGithub}`}>
        <div className={styles.ghHeader}>
          <div className={styles.ghRepoTitleRow}>
            <div className={styles.ghRepoLeft}>
              <Code2 size={17} strokeWidth={2.2} className={styles.ghRepoIcon} />
              <span className={styles.ghOwnerText}>{repoPath.split('/')[0] || 'sawarame'}</span>
              <span className={styles.ghSlash}>/</span>
              <span className={styles.ghRepoName}>{repoPath.split('/')[1] || 'Nickmark'}</span>
              <span className={styles.ghPublicBadge}>Public</span>
            </div>
            <div className={styles.ghActionPills}>
              <span className={styles.ghActionPill}>
                <Star size={12} strokeWidth={2.2} />
                <span>Star</span>
                <strong>{isWintch ? '84' : '128'}</strong>
              </span>
              <span className={styles.ghActionPill}>
                <GitBranch size={12} strokeWidth={2.2} />
                <span>main</span>
              </span>
            </div>
          </div>
          <div className={styles.ghNavTabs}>
            <span className={`${styles.ghNavTab} ${styles.ghNavTabActive}`}>&lt;&gt; Code</span>
            <span className={styles.ghNavTab}>Issues 2</span>
            <span className={styles.ghNavTab}>Pull requests</span>
            <span className={styles.ghNavTab}>Actions</span>
          </div>
        </div>
        <div className={styles.ghBody}>
          <div className={styles.ghFileList}>
            <div className={styles.ghFileRow}>
              <Folder size={13} className={styles.ghFolderIcon} />
              <span className={styles.ghFileName}>{isWintch ? 'Sources/WintchCore' : 'src/popup'}</span>
              <span className={styles.ghCommitMsg}>
                {isWintch ? 'feat: window switcher & launcher' : 'feat: keyboard command palette'}
              </span>
              <span className={styles.ghTime}>2h ago</span>
            </div>
            <div className={styles.ghFileRow}>
              <Folder size={13} className={styles.ghFolderIcon} />
              <span className={styles.ghFileName}>{isWintch ? 'Tests/WintchCoreTests' : 'src/background'}</span>
              <span className={styles.ghCommitMsg}>
                {isWintch ? 'test: add window filter specs' : 'feat: exponential decay scoring'}
              </span>
              <span className={styles.ghTime}>5h ago</span>
            </div>
            <div className={styles.ghFileRow}>
              <Code2 size={13} className={styles.ghFileIcon} />
              <span className={styles.ghFileName}>{isWintch ? 'Package.swift' : 'manifest.json'}</span>
              <span className={styles.ghCommitMsg}>
                {isWintch ? 'Swift 6.0 native package' : 'Chrome 135+ Manifest V3'}
              </span>
              <span className={styles.ghTime}>1d ago</span>
            </div>
          </div>

          <div className={styles.ghReadmeCard}>
            <div className={styles.ghReadmeHeader}>README.md</div>
            <div className={styles.ghReadmeTitle}>
              {isWintch
                ? 'Wintch — Simple Per-Window Switcher & Launcher for macOS'
                : 'Nickmark — Keyboard-First Bookmark Launcher for Chrome'}
            </div>
            <div className={styles.ghReadmeDesc}>
              {isWintch
                ? 'Switch between multiple windows of the same app with Option + Tab and fuzzy search.'
                : 'Open bookmarks, dynamic URLs (%s), slash folders, and bookmarklets at keyboard speed.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Web メール画面
  if (url.includes('mail.example.com')) {
    return (
      <div className={`${styles.webPageSurface} ${styles.pageMail}`}>
        <div className={styles.mailHeader}>
          <div className={styles.mailBrand}>
            <Mail size={16} strokeWidth={2.2} />
            <span>Team Webmail</span>
            <span className={styles.mailCountBadge}>Inbox · 4</span>
          </div>
          <span className={styles.mailComposeBtn}>+ Compose</span>
        </div>
        <div className={styles.mailList}>
          <div className={`${styles.mailRow} ${styles.mailRowUnread}`}>
            <span className={styles.mailUnreadDot} />
            <span className={styles.mailSender}>Release Bot</span>
            <span className={styles.mailSubject}>[Nickmark] v2.1.0 deployed to Chrome Web Store</span>
            <span className={styles.mailTime}>10:42</span>
          </div>
          <div className={`${styles.mailRow} ${styles.mailRowUnread}`}>
            <span className={styles.mailUnreadDot} />
            <span className={styles.mailSender}>GitHub Actions</span>
            <span className={styles.mailSubject}>[sawarame/Wintch] Release v0.2.5 notarized &amp; published</span>
            <span className={styles.mailTime}>09:15</span>
          </div>
          <div className={styles.mailRow}>
            <span className={styles.mailReadSpacer} />
            <span className={styles.mailSender}>Platform Team</span>
            <span className={styles.mailSubject}>Weekly architecture review &amp; sync notes</span>
            <span className={styles.mailTime}>Yesterday</span>
          </div>
          <div className={styles.mailRow}>
            <span className={styles.mailReadSpacer} />
            <span className={styles.mailSender}>Design System</span>
            <span className={styles.mailSubject}>Updated component tokens for dark mode</span>
            <span className={styles.mailTime}>2d ago</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. ドキュメント画面
  if (url.includes('docs.example.com')) {
    return (
      <div className={`${styles.webPageSurface} ${styles.pageDocs}`}>
        <div className={styles.docsHeader}>
          <div className={styles.docsBrand}>
            <BookOpen size={16} strokeWidth={2.2} />
            <span>Engineering Docs</span>
          </div>
          <div className={styles.docsBreadcrumb}>Architecture / Exponential Decay &amp; Sync</div>
        </div>
        <div className={styles.docsBody}>
          <div className={styles.docsSidebar}>
            <span className={styles.docsNavItemActive}>Overview</span>
            <span className={styles.docsNavItem}>Storage Chunks</span>
            <span className={styles.docsNavItem}>UserScripts API</span>
            <span className={styles.docsNavItem}>Folder Batch Open</span>
          </div>
          <div className={styles.docsArticle}>
            <div className={styles.docsArticleTitle}>Architecture &amp; Design Specification</div>
            <p className={styles.docsParagraph}>
              Nickmark calculates priority scores using exponential time decay combined with manual pinning.
            </p>
            <div className={styles.docsCodeSnippet}>
              score = prevScore * Math.pow(0.95, elapsedDays) + 1.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. カンバン・イシューボード画面
  if (url.includes('issues.example.com')) {
    return (
      <div className={`${styles.webPageSurface} ${styles.pageBoard}`}>
        <div className={styles.boardHeader}>
          <div className={styles.boardBrand}>
            <Kanban size={16} strokeWidth={2.2} />
            <span>Sprint Issue Board</span>
          </div>
          <span className={styles.boardSprintTag}>Sprint #24</span>
        </div>
        <div className={styles.boardColumns}>
          <div className={styles.boardCol}>
            <div className={styles.boardColTitle}>TO DO (2)</div>
            <div className={styles.boardCard}>#42 Folder batch rename</div>
            <div className={styles.boardCard}>#46 Export filtered JSON</div>
          </div>
          <div className={styles.boardCol}>
            <div className={styles.boardColTitle}>IN PROGRESS (1)</div>
            <div className={`${styles.boardCard} ${styles.boardCardActive}`}>
              #45 Command palette UX
            </div>
          </div>
          <div className={styles.boardCol}>
            <div className={styles.boardColTitle}>DONE (2)</div>
            <div className={styles.boardCard}>#39 Chrome sync chunking</div>
            <div className={styles.boardCard}>#40 MAIN world bookmarklets</div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Google 検索画面
  if (url.includes('google.com')) {
    let qParam = 'Nickmark';
    try {
      qParam = new URL(url).searchParams.get('q') || 'Nickmark';
    } catch {
      qParam = 'Nickmark';
    }
    return (
      <div className={`${styles.webPageSurface} ${styles.pageSearch}`}>
        <div className={styles.searchPageHeader}>
          <span className={styles.searchBrandLogo}>Google</span>
          <div className={styles.searchQueryPill}>
            <Search size={12} strokeWidth={2.2} />
            <span>{qParam}</span>
          </div>
        </div>
        <div className={styles.searchResultsBody}>
          <div className={styles.searchResultItem}>
            <div className={styles.searchResultUrl}>https://sawara.me › nickmark</div>
            <div className={styles.searchResultTitle}>
              {qParam} — Keyboard-First Bookmark Launcher for Chrome
            </div>
            <div className={styles.searchResultDesc}>
              Launch bookmarks, dynamic URLs (%s), folders, and bookmarklets from the command palette.
            </div>
          </div>
          <div className={styles.searchResultItem}>
            <div className={styles.searchResultUrl}>https://github.com › sawarame › Nickmark</div>
            <div className={styles.searchResultTitle}>
              sawarame/Nickmark: Chrome Extension (Manifest V3)
            </div>
            <div className={styles.searchResultDesc}>
              Open-source bookmark launcher built with TypeScript, Vue 3, and PrimeVue.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. デフォルト（sawara.me / Nickmark 紹介ページ）
  return (
    <div className={`${styles.webPageSurface} ${styles.pageSawara}`}>
      <div className={styles.sawaraHeader}>
        <div className={styles.sawaraBrand}>
          <Globe size={15} strokeWidth={2.2} />
          <span>sawara.me</span>
          <div className={styles.sawaraNavLinks}>
            <span>Tools</span>
            <span className={styles.sawaraNavActive}>Extensions</span>
            <span>About</span>
          </div>
        </div>
      </div>
      <div className={styles.sawaraHeroContent}>
        <div className={styles.sawaraBadge}>v2.1.0 · Chrome 135+ · MIT License</div>
        <div className={styles.sawaraHeroHeading}>{tab.title}</div>
        <div className={styles.sawaraHeroSub}>
          よく使うページやフォルダに短いニックネームを付けて、キーボードだけで瞬時に起動。
        </div>
        <div className={styles.sawaraHeroActions}>
          <span className={styles.sawaraPrimaryPill}>
            <Puzzle size={13} strokeWidth={2.2} />
            <span>Chrome Web Store</span>
          </span>
          <span className={styles.sawaraSecondaryPill}>GitHub (sawarame/Nickmark)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Nickmark の拡張機能ポップアップとブラウザ内ページ遷移・別タブ展開を試せるインタラクティブショーケース
 * @returns ショーケースセクションの JSX 要素
 */
export default function NickmarkShowcase(): JSX.Element {
  const { i18n } = useDocusaurusContext();
  const locale: DemoLocale = normalizeDemoLocale(i18n.currentLocale);
  const appIconUrl = useBaseUrl('/img/nickmark/app-icon.svg');

  const [bookmarks, setBookmarks] = useState<DemoBookmarkItem[]>(INITIAL_DEMO_BOOKMARKS);
  const [query, setQuery] = useState<string>('gh/Nickmark');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [commandFeedback, setCommandFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);

  // 模擬ブラウザのタブとページ状態
  const [browserTabs, setBrowserTabs] = useState<DemoBrowserTab[]>(INITIAL_BROWSER_TABS);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState<string>(INITIAL_BROWSER_TABS[0].id);
  const [navRevision, setNavRevision] = useState<number>(0);
  const [scriptBanner, setScriptBanner] = useState<string | null>(null);

  const isCommandMode = isDemoCommandQuery(query);

  /**
   * 現在アクティブな模擬ブラウザタブ
   */
  const activeBrowserTab = useMemo(() => {
    return browserTabs.find((t) => t.id === activeBrowserTabId) ?? browserTabs[0];
  }, [browserTabs, activeBrowserTabId]);

  /**
   * :add / ;add 入力時に現在の模擬タブが登録済みであればお知らせメッセージを生成する
   */
  const alreadyBookmarkedNotice = useMemo(() => {
    if (!isCommandMode) return null;
    const normalized = normalizeDemoCommandPrefix(query);
    const firstToken = normalized.split(/\s+/)[0] || '';
    if (firstToken.length < 2 || ![':add', ':a', ':ad'].some((c) => c === firstToken || ':add'.startsWith(firstToken))) {
      return null;
    }
    if (!firstToken.startsWith(':a')) return null;
    const existing = findDemoNicknamesForUrl(activeBrowserTab.url, bookmarks);
    if (existing.length === 0) return null;
    return translate(
      {
        id: 'nickmark.showcase.alreadyBookmarked',
        message: 'このページはすでにブックマークに登録されています（ニックネーム: {nicknames}）',
      },
      { nicknames: existing.join(', ') }
    );
  }, [isCommandMode, query, activeBrowserTab.url, bookmarks]);

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
    setCommandFeedback(null);
  }, []);

  /**
   * 模擬ブラウザのタブを選択してアクティブ化する
   * @param tabId - 切り替え先のタブ ID
   * @returns なし
   */
  const handleSelectBrowserTab = useCallback((tabId: string) => {
    setActiveBrowserTabId(tabId);
    setBrowserTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, isUnreadBg: false } : t))
    );
    setScriptBanner(null);
    setNavRevision((r) => r + 1);
  }, []);

  /**
   * 模擬ブラウザの指定タブを閉じる
   * @param event - マウスクリックイベント
   * @param tabId - 閉じる対象のタブ ID
   * @returns なし
   */
  const handleCloseBrowserTab = useCallback(
    (event: React.MouseEvent, tabId: string) => {
      event.stopPropagation();
      setBrowserTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === activeBrowserTabId && next.length > 0) {
          const fallbackIdx = Math.max(0, Math.min(idx, next.length - 1));
          setActiveBrowserTabId(next[fallbackIdx].id);
        }
        return next;
      });
    },
    [activeBrowserTabId]
  );

  /**
   * 模擬ブラウザのタブとブックマークを初期状態にリセットする
   * @returns なし
   */
  const handleResetDemoBrowser = useCallback(() => {
    setBrowserTabs(INITIAL_BROWSER_TABS);
    setActiveBrowserTabId(INITIAL_BROWSER_TABS[0].id);
    setBookmarks(INITIAL_DEMO_BOOKMARKS);
    setCommandFeedback(null);
    setScriptBanner(null);
    setNavRevision((r) => r + 1);
  }, []);

  /**
   * 選択中またはクリックされた候補アイテムのデモ実行を行う
   * ページ遷移時はパレットを消さずに背後のブラウザページやタブを直接更新する
   * @param item - 実行対象の候補アイテム
   * @param disposition - タブの開き方（'current' | 'foreground' | 'background'）
   * @returns なし
   */
  const executeDemoItem = useCallback(
    (item: DemoSearchResult, disposition: 'current' | 'foreground' | 'background' = 'current') => {
      setCommandFeedback(null);
      setScriptBanner(null);

      if (item.kind === 'command') {
        const val = item.executeValue.trim();
        if (val.startsWith(':addall ')) {
          const newNick = normalizeDemoNicknamePath(val.slice(8).trim().split(/\s+/)[0] || '');
          if (newNick) {
            if (hasForbiddenDemoNicknameChars(newNick)) {
              setCommandFeedback({
                severity: 'error',
                message: translate({
                  id: 'nickmark.showcase.feedback.forbidden',
                  message:
                    'ニックネームに使用できない文字（空白、: ; \\ % ? # & = * " \' ` < > | など）が含まれています。',
                }),
              });
              return;
            }
            setBookmarks((prev) => {
              const additions: DemoBookmarkItem[] = browserTabs.map((t, i) => ({
                id: `demo-all-${Date.now()}-${i}`,
                nickname: browserTabs.length > 1 ? `${newNick}/${i + 1}` : newNick,
                title: t.title,
                url: t.url,
                isPinned: false,
                score: 1.0,
                lastUsedLabel: JUST_NOW_LABELS[locale],
              }));
              return [...additions, ...prev];
            });
            setCommandFeedback({
              severity: 'success',
              message: translate(
                {
                  id: 'nickmark.showcase.feedback.added',
                  message: '「{nickname}」をデモリストに登録しました',
                },
                { nickname: newNick }
              ),
            });
            setQuery('');
            return;
          }
        }
        if (val.startsWith(':add ')) {
          const newNick = normalizeDemoNicknamePath(val.slice(5).trim().split(/\s+/)[0] || '');
          if (newNick) {
            if (hasForbiddenDemoNicknameChars(newNick)) {
              setCommandFeedback({
                severity: 'error',
                message: translate({
                  id: 'nickmark.showcase.feedback.forbidden',
                  message:
                    'ニックネームに使用できない文字（空白、: ; \\ % ? # & = * " \' ` < > | など）が含まれています。',
                }),
              });
              return;
            }
            setBookmarks((prev) => {
              if (prev.some((b) => b.nickname === newNick)) {
                return prev;
              }
              return [
                {
                  id: `demo-${Date.now()}`,
                  nickname: newNick,
                  title: activeBrowserTab.title,
                  url: activeBrowserTab.url,
                  isPinned: false,
                  score: 1.0,
                  lastUsedLabel: JUST_NOW_LABELS[locale],
                },
                ...prev,
              ];
            });
            setCommandFeedback({
              severity: 'success',
              message: translate(
                {
                  id: 'nickmark.showcase.feedback.added',
                  message: '「{nickname}」をデモリストに登録しました',
                },
                { nickname: newNick }
              ),
            });
            setQuery('');
            return;
          }
        }
        if (val.startsWith(':rm ')) {
          const targetNick = val.slice(4).trim().split(/\s+/)[0];
          if (targetNick) {
            setBookmarks((prev) => prev.filter((b) => b.nickname !== targetNick));
            setCommandFeedback({
              severity: 'success',
              message: translate(
                {
                  id: 'nickmark.showcase.feedback.removed',
                  message: '「{nickname}」をデモリストから削除しました',
                },
                { nickname: targetNick }
              ),
            });
            setQuery('');
            return;
          }
        }
        setCommandFeedback({
          severity: 'success',
          message: translate(
            {
              id: 'nickmark.showcase.feedback.command',
              message: 'コマンド {cmd} を実行しました',
            },
            { cmd: val }
          ),
        });
        return;
      }

      if (item.kind === 'folder') {
        const folderPath = item.executeValue.replace(/^folder:/, '');
        const folderEntries = bookmarks.filter(
          (b) => b.nickname.startsWith(`${folderPath}/`) && !/^javascript:/i.test(b.url)
        );
        if (folderEntries.length > 0) {
          const seenUrls = new Set<string>();
          const newTabs: DemoBrowserTab[] = [];
          folderEntries.forEach((entry, idx) => {
            if (!seenUrls.has(entry.url)) {
              seenUrls.add(entry.url);
              newTabs.push({
                id: `tab-folder-${Date.now()}-${idx}`,
                title: entry.title,
                url: entry.url,
                isUnreadBg: true,
              });
            }
          });
          setBrowserTabs((prev) => [...prev, ...newTabs]);
        }
        return;
      }

      if (item.kind === 'bookmarklet') {
        setScriptBanner(
          translate({
            id: 'nickmark.showcase.feedback.bookmarklet',
            message: 'userScripts API（MAIN world）で現在のタブにブックマークレットを実行しました',
          })
        );
        setNavRevision((r) => r + 1);
        return;
      }

      // 通常ブックマーク・動的 URL のブラウザ遷移処理（ポップアップは維持したまま背景のページまたはタブを更新）
      if (disposition === 'current') {
        setBrowserTabs((prev) =>
          prev.map((t) =>
            t.id === activeBrowserTab.id
              ? { ...t, title: item.title, url: item.subtitle, isUnreadBg: false }
              : t
          )
        );
        setNavRevision((r) => r + 1);
      } else if (disposition === 'foreground') {
        const newTabId = `tab-fg-${Date.now()}`;
        const newTab: DemoBrowserTab = {
          id: newTabId,
          title: item.title,
          url: item.subtitle,
          isUnreadBg: false,
        };
        setBrowserTabs((prev) => [...prev, newTab]);
        setActiveBrowserTabId(newTabId);
        setNavRevision((r) => r + 1);
      } else {
        const newTabId = `tab-bg-${Date.now()}`;
        const newTab: DemoBrowserTab = {
          id: newTabId,
          title: item.title,
          url: item.subtitle,
          isUnreadBg: true,
        };
        setBrowserTabs((prev) => [...prev, newTab]);
      }
    },
    [locale, activeBrowserTab, bookmarks, browserTabs]
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

  const presets = [
    { label: 'gh/Nickmark', value: 'gh/Nickmark' },
    { label: 'work/', value: 'work/' },
    { label: ':add dev', value: ':add dev' },
    { label: ';add dev', value: ';add dev' },
    { label: 'js/top', value: 'js/top' },
  ];

  const currentTip = DEMO_TIPS[tipIndex % DEMO_TIPS.length];
  const isBrowserModified =
    browserTabs.length > 1 || activeBrowserTab.url !== INITIAL_BROWSER_TABS[0].url;

  return (
    <div className={styles.showcaseWrap}>
      {/* ワンクリック入力プリセット（ブラウザ外上部） */}
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
      </div>

      {/* ブラウザウィンドウ枠 */}
      <div className={styles.browserFrame}>
        {/* 模擬ブラウザタブバー */}
        <div className={styles.browserTabStrip}>
          <div className={styles.trafficLights} aria-hidden="true">
            <span className={`${styles.trafficDot} ${styles.trafficDotRed}`} />
            <span className={`${styles.trafficDot} ${styles.trafficDotYellow}`} />
            <span className={`${styles.trafficDot} ${styles.trafficDotGreen}`} />
          </div>

          <div
            className={styles.browserTabList}
            role="tablist"
            aria-label={translate({
              id: 'nickmark.showcase.browser.tabsAria',
              message: 'デモブラウザのタブ一覧',
            })}
          >
            {browserTabs.map((tab) => {
              const isActive = tab.id === activeBrowserTab.id;
              return (
                <div
                  key={tab.id}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  onClick={() => handleSelectBrowserTab(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectBrowserTab(tab.id);
                    }
                  }}
                  className={`${styles.browserTab} ${isActive ? styles.browserTabActive : ''} ${
                    tab.isUnreadBg ? styles.browserTabUnread : ''
                  }`}
                >
                  <Globe size={12} strokeWidth={2.2} className={styles.browserTabIcon} aria-hidden="true" />
                  <span className={styles.browserTabTitle}>{tab.title}</span>
                  {tab.isUnreadBg && (
                    <span className={styles.browserTabNewBadge}>NEW</span>
                  )}
                  {browserTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseBrowserTab(e, tab.id)}
                      className={styles.browserTabClose}
                      aria-label={translate({
                        id: 'nickmark.showcase.browser.closeTabAria',
                        message: 'タブを閉じる',
                      })}
                    >
                      <X size={11} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              );
            })}
            <span className={styles.browserTabCountPill} aria-hidden="true">
              <Plus size={11} strokeWidth={2.4} />
              <span>{browserTabs.length}</span>
            </span>
          </div>

          {isBrowserModified && (
            <button
              type="button"
              onClick={handleResetDemoBrowser}
              className={styles.resetBrowserBtn}
            >
              <RotateCcw size={12} strokeWidth={2.2} aria-hidden="true" />
              <span>
                <Translate id="nickmark.showcase.browser.reset">タブをリセット</Translate>
              </span>
            </button>
          )}
        </div>

        {/* 模擬アドレスバー・右端の拡張機能アイコンバー（Chrome ツールバー準拠） */}
        <div className={styles.browserTopBar}>
          <div key={navRevision} className={`${styles.omniboxPill} ${styles.omniboxAnimated}`}>
            <Info size={14} strokeWidth={2} className={styles.omniboxInfoIcon} aria-hidden="true" />
            <span className={styles.omniboxUrl}>{activeBrowserTab.url}</span>
            <div className={styles.omniboxRightIcons} aria-hidden="true">
              <Search size={13} strokeWidth={2} />
              <Star size={13} strokeWidth={2} />
            </div>
          </div>

          <div className={styles.toolbarRightActions} aria-hidden="true">
            <div className={styles.extensionIconActiveRing} title="Nickmark">
              <img src={appIconUrl} alt="" className={styles.extensionMiniIcon} />
            </div>
          </div>
        </div>

        {/* ブラウザビューポート：全面に模擬 Web ページを描画し、右上（拡張機能アイコン直下）にポップアップを配置 */}
        <div className={styles.browserViewport}>
          {/* 背後の模擬 Web ページ本体 */}
          <div key={navRevision} className={styles.webPageContainer}>
            <div className={styles.pageLoadProgress} aria-hidden="true" />
            {scriptBanner && (
              <div className={styles.scriptExecutedToast} role="status">
                <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>{scriptBanner}</span>
                <ArrowUp size={14} strokeWidth={2.4} aria-hidden="true" />
              </div>
            )}
            <SimulatedWebPage tab={activeBrowserTab} />
          </div>

          {/* アドレスバー右端（拡張機能アイコン）直下にぶら下がる Nickmark ポップアップ */}
          <div className={styles.paletteOverlayWrap}>
            <div className={styles.palettePanel}>
              <div className={styles.paletteSearchBar}>
                {isCommandMode ? (
                  <Terminal size={16} strokeWidth={2.2} className={styles.searchLeadingIcon} aria-hidden="true" />
                ) : (
                  <Search size={16} strokeWidth={2.2} className={styles.searchLeadingIcon} aria-hidden="true" />
                )}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={translate({
                    id: 'nickmark.showcase.placeholder',
                    message: 'ニックネーム検索 または :add / ;add / :rm ...',
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
                </div>
              </div>

              {commandFeedback && (
                <div
                  className={`${styles.paletteFeedback} ${
                    commandFeedback.severity === 'error' ? styles.paletteFeedbackError : ''
                  }`}
                  role={commandFeedback.severity === 'error' ? 'alert' : 'status'}
                >
                  {commandFeedback.severity === 'error' ? (
                    <Info size={15} strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <CheckCircle2 size={15} strokeWidth={2.2} aria-hidden="true" />
                  )}
                  <span>{commandFeedback.message}</span>
                </div>
              )}

              {alreadyBookmarkedNotice && (
                <div
                  className={`${styles.paletteFeedback} ${styles.paletteFeedbackInfo}`}
                  role="status"
                >
                  <Info size={15} strokeWidth={2.2} aria-hidden="true" />
                  <span>{alreadyBookmarkedNotice}</span>
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
          </div>
        </div>
      </div>

      {/* キー操作デモボタン（ブラウザ外下部） */}
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
    </div>
  );
}
