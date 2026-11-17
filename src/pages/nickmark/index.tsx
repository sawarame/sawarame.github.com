import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import MuiTheme from '@site/src/components/MuiTheme';
import CopyCommandPill from '@site/src/components/Wintch/CopyCommandPill';
import NickmarkShowcase from '@site/src/components/Nickmark/NickmarkShowcase';
import {
  CommandPaletteVisual,
  DynamicUrlVisual,
  FolderBatchVisual,
  RankingDashboardVisual,
  PrivacySyncVisual,
} from '@site/src/components/Nickmark/NickmarkFeatureVisuals';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  FolderOpen,
  Globe,
  Keyboard,
  Package,
  Puzzle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
} from 'lucide-react';
import GitHubIcon from '@mui/icons-material/GitHub';
import styles from './styles.module.css';

/**
 * Chrome Web Store 公開ページ URL
 */
const NICKMARK_STORE_URL =
  'https://chromewebstore.google.com/detail/nickmark/bicojpjoabhecikokcohbjgaiojggpno';

/**
 * GitHub リポジトリ URL
 */
const NICKMARK_GITHUB_URL = 'https://github.com/sawarame/Nickmark';

/**
 * ビルド用コマンド文字列
 */
const BUILD_COMMAND = 'npm install && npm run build';

/**
 * クローンコマンド文字列
 */
const CLONE_COMMAND = 'git clone https://github.com/sawarame/Nickmark.git';

/**
 * コマンド一覧の行データ型定義
 */
interface CommandRowItem {
  /** コマンド構文 */
  command: string;
  /** エイリアス表記 */
  alias: string;
  /** 説明文の翻訳 ID */
  descId: string;
  /** 説明文の既定日本語テキスト */
  desc: string;
}

/**
 * 組み込みコマンド一覧データ
 */
const COMMAND_ITEMS: CommandRowItem[] = [
  {
    command: ':add [nickname] [url] [title]',
    alias: ':a',
    descId: 'nickmark.commands.add',
    desc: '現在のタブ、指定した URL、または javascript: ブックマークレットを登録',
  },
  {
    command: ':addall [nickname]',
    alias: ':aa',
    descId: 'nickmark.commands.addall',
    desc: '現在のウィンドウで開いているすべてのタブを一括登録',
  },
  {
    command: ':open [nickname or folder/]',
    alias: ':o',
    descId: 'nickmark.commands.open',
    desc: '紐づく全 URL またはフォルダ配下をバックグラウンドタブで一括オープン',
  },
  {
    command: ':rm [nickname] [url]',
    alias: '—',
    descId: 'nickmark.commands.rm',
    desc: '指定したニックネームまたは特定の URL エントリを削除',
  },
  {
    command: ':ls',
    alias: '—',
    descId: 'nickmark.commands.ls',
    desc: 'ブックマーク一覧・インライン編集・フォルダ管理画面を開く',
  },
  {
    command: ':prefs',
    alias: '—',
    descId: 'nickmark.commands.prefs',
    desc: '設定画面（同期・言語・履歴検索・一括オープン安全上限）を開く',
  },
  {
    command: ':help',
    alias: '—',
    descId: 'nickmark.commands.help',
    desc: 'オンラインヘルプ・ドキュメントページを開く',
  },
];

/**
 * キーボードショートカット一覧データ
 */
const SHORTCUT_ITEMS: Array<{
  keys: string;
  scopeId: string;
  scope: string;
  descId: string;
  desc: string;
}> = [
  {
    keys: '⌥ + ⇧ + D / Alt + Shift + D',
    scopeId: 'nickmark.shortcuts.scope.global',
    scope: '起動',
    descId: 'nickmark.shortcuts.desc.launch',
    desc: 'どこからでもコマンドパレットを起動（chrome://extensions/shortcuts で変更可能）',
  },
  {
    keys: '↑ / ↓ · Ctrl + N / P',
    scopeId: 'nickmark.shortcuts.scope.palette',
    scope: 'パレット',
    descId: 'nickmark.shortcuts.desc.navigate',
    desc: '候補リストの選択カーソルを上下に移動',
  },
  {
    keys: 'Tab',
    scopeId: 'nickmark.shortcuts.scope.palette',
    scope: 'パレット',
    descId: 'nickmark.shortcuts.desc.autocomplete',
    desc: '選択中のニックネームやフォルダパス・コマンドを入力欄へ補完',
  },
  {
    keys: 'Enter',
    scopeId: 'nickmark.shortcuts.scope.action',
    scope: '実行',
    descId: 'nickmark.shortcuts.desc.enter',
    desc: '現在のタブで開く（ブックマークレット・コマンドの場合は即時実行）',
  },
  {
    keys: 'Cmd / Ctrl / Alt + Enter',
    scopeId: 'nickmark.shortcuts.scope.action',
    scope: '実行',
    descId: 'nickmark.shortcuts.desc.newTab',
    desc: '新しいフォアグラウンドタブで開く',
  },
  {
    keys: 'Shift + Enter',
    scopeId: 'nickmark.shortcuts.scope.action',
    scope: '実行',
    descId: 'nickmark.shortcuts.desc.bgTab',
    desc: 'パレットを開いたままバックグラウンドタブで連続起動',
  },
  {
    keys: 'nm + Space',
    scopeId: 'nickmark.shortcuts.scope.omnibox',
    scope: 'アドレスバー',
    descId: 'nickmark.shortcuts.desc.omnibox',
    desc: 'アドレスバー（Omnibox）から直接ニックネーム検索・コマンド実行（後方互換）',
  },
];

/**
 * Chrome Web Store とドキュメント導線をまとめた CTA ボタングループ
 * @returns CTA ボタングループの JSX 要素
 */
function StoreCtaGroup(): JSX.Element {
  return (
    <div className={styles.ctaGroup}>
      <a
        href={NICKMARK_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.primaryStoreBtn}
      >
        <Puzzle size={18} strokeWidth={2.2} aria-hidden="true" />
        <span>
          <Translate id="nickmark.cta.store">Chrome Web Store で追加</Translate>
        </span>
        <ExternalLink size={14} strokeWidth={2.2} aria-hidden="true" />
      </a>

      <Link to="/extensions/nickmark" className={styles.secondaryDocsBtn}>
        <BookOpen size={17} strokeWidth={2} aria-hidden="true" />
        <span>
          <Translate id="nickmark.cta.docs">使い方ドキュメントを見る</Translate>
        </span>
      </Link>
    </div>
  );
}

/**
 * ページ上部のヒーローセクションコンポーネント
 * @returns ヒーローセクションの JSX 要素
 */
function NickmarkHeroSection(): JSX.Element {
  const appIconUrl = useBaseUrl('/img/nickmark/app-icon.svg');

  const navPills = [
    { href: '#palette', labelId: 'nickmark.nav.palette', label: 'コマンドパレット' },
    { href: '#dynamic-url', labelId: 'nickmark.nav.dynamic', label: '動的URL & JS' },
    { href: '#folders', labelId: 'nickmark.nav.folders', label: 'フォルダ一括起動' },
    { href: '#dashboard', labelId: 'nickmark.nav.dashboard', label: '学習 & 管理画面' },
    { href: '#privacy', labelId: 'nickmark.nav.privacy', label: '同期 & プライバシー' },
    { href: '#commands', labelId: 'nickmark.nav.commands', label: 'コマンド' },
    { href: '#install', labelId: 'nickmark.nav.install', label: '導入方法' },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.container}>
        <nav
          className={styles.anchorNav}
          aria-label={translate({ id: 'nickmark.nav.ariaLabel', message: 'ページ内ナビゲーション' })}
        >
          {navPills.map((pill) => (
            <a key={pill.href} href={pill.href} className={styles.anchorPill}>
              <Translate id={pill.labelId}>{pill.label}</Translate>
            </a>
          ))}
        </nav>

        <div className={styles.heroInner}>
          <div className={styles.heroAppBadge}>
            <img
              src={appIconUrl}
              alt="Nickmark Icon"
              width={84}
              height={84}
              className={styles.heroIcon}
            />
            <span className={styles.metaPill}>
              <Translate id="nickmark.hero.meta">
                v2.0.4 · Chrome 135+ · MIT License
              </Translate>
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            <Translate id="nickmark.hero.titlePrefix">ブックマークへのアクセスを、</Translate>
            <br />
            <span className={styles.heroTitleAccent}>
              <Translate id="nickmark.hero.titleAccent">キーボードだけで最速に。</Translate>
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            <Translate id="nickmark.hero.subtitle">
              Nickmark は、マウス移動を最小限にしたいエンジニアやパワーユーザーのための Chrome 拡張機能です。よく使うページ・検索テンプレート（%s）・フォルダグループ・ブックマークレットに短いニックネームを割り当て、コマンドパレットやアドレスバーから瞬時に呼び出せます。
            </Translate>
          </p>

          <StoreCtaGroup />

          <div className={styles.heroLinks}>
            <a
              href={NICKMARK_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              <GitHubIcon sx={{ fontSize: 16 }} aria-hidden="true" />
              <span>GitHub (sawarame/Nickmark)</span>
              <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 2 カラム機能紹介セクションの Props 型定義
 */
interface FeatureSectionProps {
  /** セクションのアンカー ID */
  id: string;
  /** アイコン要素 */
  icon: React.ReactNode;
  /** 小見出しラベルの翻訳 ID */
  eyebrowId: string;
  /** 小見出しラベルの既定テキスト */
  eyebrow: string;
  /** メイン見出し前半の翻訳 ID */
  titlePrefixId: string;
  /** メイン見出し前半の既定テキスト */
  titlePrefix: string;
  /** メイン見出しアクセント部分の翻訳 ID */
  titleAccentId: string;
  /** メイン見出しアクセント部分の既定テキスト */
  titleAccent: string;
  /** 本文説明の翻訳 ID */
  descriptionId: string;
  /** 本文説明の既定テキスト */
  description: string;
  /** 箇条書きポイント配列 */
  bullets: Array<{ id: string; text: string }>;
  /** ビジュアルカードコンポーネント */
  visual: React.ReactNode;
  /** 左右反転配置フラグ */
  reverse?: boolean;
  /** 交互背景色フラグ */
  altSurface?: boolean;
}

/**
 * 2 カラム交互配置の機能紹介セクションコンポーネント
 * @param props - 見出し・説明文・箇条書き・ビジュアルを含む Props
 * @returns 機能紹介セクションの JSX 要素
 */
function FeatureSection({
  id,
  icon,
  eyebrowId,
  eyebrow,
  titlePrefixId,
  titlePrefix,
  titleAccentId,
  titleAccent,
  descriptionId,
  description,
  bullets,
  visual,
  reverse = false,
  altSurface = false,
}: FeatureSectionProps): JSX.Element {
  return (
    <section
      id={id}
      className={`${styles.featureSection} ${altSurface ? styles.sectionAlt : ''}`}
    >
      <div className={styles.container}>
        <div className={`${styles.featureGrid} ${reverse ? styles.featureGridReverse : ''}`}>
          <div className={styles.featureCopy}>
            <span className={styles.eyebrow}>
              {icon}
              <Translate id={eyebrowId}>{eyebrow}</Translate>
            </span>

            <h2 className={styles.featureTitle}>
              <Translate id={titlePrefixId}>{titlePrefix}</Translate>{' '}
              <span className={styles.featureTitleAccent}>
                <Translate id={titleAccentId}>{titleAccent}</Translate>
              </span>
            </h2>

            <p className={styles.featureDesc}>
              <Translate id={descriptionId}>{description}</Translate>
            </p>

            <ul className={styles.bulletList}>
              {bullets.map((item) => (
                <li key={item.id} className={styles.bulletItem}>
                  <CheckCircle2
                    size={16}
                    strokeWidth={2.2}
                    className={styles.bulletIcon}
                    aria-hidden="true"
                  />
                  <span>
                    <Translate id={item.id}>{item.text}</Translate>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.featureVisual}>{visual}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * Nickmark ブラウザ拡張機能の紹介・デモ・コマンド・導入方法を掲載するページ
 * @returns Nickmark 紹介ページの JSX 要素
 */
export default function NickmarkPage(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const appIconUrl = useBaseUrl('/img/nickmark/app-icon.svg');

  const pageTitle = translate({
    id: 'nickmark.page.title',
    message: 'Nickmark | キーボード操作特化型ブックマークランチャー Chrome 拡張機能',
  });

  const pageDesc = translate({
    id: 'nickmark.page.description',
    message:
      'コマンドパレット、動的URL(%s)、フォルダ一括起動、ブックマークレット実行、指数減衰ランキングを備えたキーボード特化型 Chrome 拡張機能「Nickmark」の紹介ページ。',
  });

  return (
    <Layout title={`${pageTitle} | ${siteConfig.title}`} description={pageDesc}>
      <MuiTheme>
        <main className={styles.pageMain}>
          {/* 1. ヒーロー */}
          <NickmarkHeroSection />

          {/* 2. インタラクティブ UI プレビュー */}
          <section className={styles.showcaseSection}>
            <div className={styles.container}>
              <NickmarkShowcase />
            </div>
          </section>

          {/* 3. 機能紹介（5 セクション） */}
          <FeatureSection
            id="palette"
            icon={<Search size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="nickmark.feature1.eyebrow"
            eyebrow="コマンドパレット (⌥⇧D / Alt+⇧D)"
            titlePrefixId="nickmark.feature1.titlePrefix"
            titlePrefix="どこからでも、"
            titleAccentId="nickmark.feature1.titleAccent"
            titleAccent="思考を止めずに呼び出す。"
            descriptionId="nickmark.feature1.desc"
            description="Option + Shift + D（Windows / Linux は Alt + Shift + D）を押すだけでコマンドパレットが即座に展開。ニックネームの一致度だけでなくタイトルや URL 全体から横断検索し、開きたいタブの挙動まで Enter の修飾キーで自在に選べます。"
            bullets={[
              {
                id: 'nickmark.feature1.b1',
                text: '↑ / ↓ や Ctrl + N / P で候補移動、Tab で入力補完、IME 変換確定中の誤実行防止ガードを搭載',
              },
              {
                id: 'nickmark.feature1.b2',
                text: 'Enter で現在タブ、Cmd / Ctrl / Alt + Enter で新規タブ、Shift + Enter でパレットを閉じずに連続バックグラウンド起動',
              },
              {
                id: 'nickmark.feature1.b3',
                text: 'アドレスバーに「nm + Space」を入力するオムニボックス連携も後方互換として継続サポート',
              },
            ]}
            visual={<CommandPaletteVisual />}
            altSurface
          />

          <FeatureSection
            id="dynamic-url"
            icon={<Code2 size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="nickmark.feature2.eyebrow"
            eyebrow="動的 URL (%s) & ブックマークレット"
            titlePrefixId="nickmark.feature2.titlePrefix"
            titlePrefix="検索引数もスクリプトも、"
            titleAccentId="nickmark.feature2.titleAccent"
            titleAccent="そのままワンショットで。"
            descriptionId="nickmark.feature2.desc"
            description="URL に %s を埋め込めば、「gh sawarame/Nickmark」のように引数を渡して遷移できるカスタム検索ショートカットに早変わり。javascript: から始まるブックマークレットも、ページ遷移なしで安全に実行できます。"
            bullets={[
              {
                id: 'nickmark.feature2.b1',
                text: 'パス領域（/ を維持）とクエリ領域（URL エンコード）を自動判別し、引数省略時はデフォルト値またはサイトトップへ遷移',
              },
              {
                id: 'nickmark.feature2.b2',
                text: 'Chrome 135+ の userScripts API（MAIN world）により javascript: ブックマークレットを現在のタブへ直接実行',
              },
              {
                id: 'nickmark.feature2.b3',
                text: 'オプトイン設定で、ブックマーク候補の下に一致するブラウザ履歴を表示可能（重複 URL 自動除外・学習スコア非干渉）',
              },
            ]}
            visual={<DynamicUrlVisual />}
            reverse
          />

          <FeatureSection
            id="folders"
            icon={<FolderOpen size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="nickmark.feature3.eyebrow"
            eyebrow="フォルダ管理 & 一括オープン"
            titlePrefixId="nickmark.feature3.titlePrefix"
            titlePrefix="スラッシュ区切りで、"
            titleAccentId="nickmark.feature3.titleAccent"
            titleAccent="作業環境を一気に展開。"
            descriptionId="nickmark.feature3.desc"
            description="work/mail や work/docs のようにスラッシュを含めてニックネームを付けるだけで、自動的に階層フォルダとして整理。パレットで「work/」または「:open work/」と実行すれば、配下のタブをバックグラウンドでまとめて開けます。"
            bullets={[
              {
                id: 'nickmark.feature3.b1',
                text: '同一 URL の重複除外とブックマークレットの自動スキップにより、クリーンにタブを展開',
              },
              {
                id: 'nickmark.feature3.b2',
                text: '誤操作防止の安全上限（1〜100件で変更可能、既定 20件）を超える場合は確認プロンプトを表示',
              },
              {
                id: 'nickmark.feature3.b3',
                text: '管理画面ではフォルダ単位での絞り込み、一括オープン、フォルダ名の一括リネームや削除に対応',
              },
            ]}
            visual={<FolderBatchVisual />}
            altSurface
          />

          <FeatureSection
            id="dashboard"
            icon={<TrendingUp size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="nickmark.feature4.eyebrow"
            eyebrow="指数減衰ランキング & 管理画面"
            titlePrefixId="nickmark.feature4.titlePrefix"
            titlePrefix="使うほど上位へ、"
            titleAccentId="nickmark.feature4.titleAccent"
            titleAccent="メンテナンスも軽快に。"
            descriptionId="nickmark.feature4.desc"
            description="使用頻度と経過日数に基づく指数減衰スコアリングと手動ピン留めを組み合わせ、いま使いたい URL が常に最上位へ。管理画面（:ls）ではセルをクリックするだけでインライン編集でき、Chrome 標準ブックマークからの取り込みも簡単です。"
            bullets={[
              {
                id: 'nickmark.feature4.b1',
                text: '経過日数に応じて自然減衰するスコアリング（0.95^elapsedDays）とピン留め固定で、流行りの変化にも自動追従',
              },
              {
                id: 'nickmark.feature4.b2',
                text: '管理テーブルのニックネーム・タイトル・URL をクリックで即座にインライン編集（Enter 保存 / Esc キャンセル）',
              },
              {
                id: 'nickmark.feature4.b3',
                text: 'Chrome ブックマーク HTML・Nickmark JSON のインポート（マージ / 上書き / 取り込み先フォルダ指定）と JSON エディタを搭載',
              },
            ]}
            visual={<RankingDashboardVisual />}
            reverse
          />

          <FeatureSection
            id="privacy"
            icon={<ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="nickmark.feature5.eyebrow"
            eyebrow="Privacy First & Sync"
            titlePrefixId="nickmark.feature5.titlePrefix"
            titlePrefix="外部送信ゼロ、"
            titleAccentId="nickmark.feature5.titleAccent"
            titleAccent="ローカルも同期も思いのまま。"
            descriptionId="nickmark.feature5.desc"
            description="データ収集や外部サーバー通信は一切行いません。大容量のローカル保存と、複数 PC 間で共有できる Chrome アカウント同期をいつでも切り替え可能。日英バイリンガル UI もリロードなしで瞬時に切り替わります。"
            bullets={[
              {
                id: 'nickmark.feature5.b1',
                text: '容量無制限の chrome.storage.local と、自動 8KB チャンク分割対応の chrome.storage.sync（100KB 上限）を選択可能',
              },
              {
                id: 'nickmark.feature5.b2',
                text: '同期切替時にはローカルとクラウドのデータ件数・更新日時を比較できる競合解決ダイアログを表示',
              },
              {
                id: 'nickmark.feature5.b3',
                text: '履歴アクセス権限はオプトイン（optional_permissions）で、有効化するまで一切リクエストしません',
              },
            ]}
            visual={<PrivacySyncVisual />}
            altSurface
          />

          {/* 4. 組み込みコマンド & キーボードショートカット一覧 */}
          <section id="commands" className={styles.referenceSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrowCenter}>
                  <Terminal size={15} strokeWidth={2.2} aria-hidden="true" />
                  <Translate id="nickmark.ref.eyebrow">コマンド & ショートカット</Translate>
                </span>
                <h2 className={styles.sectionTitle}>
                  <Translate id="nickmark.ref.title">キーボード操作リファレンス</Translate>
                </h2>
                <p className={styles.sectionSubtitle}>
                  <Translate id="nickmark.ref.subtitle">
                    パレット（またはアドレスバー）でコロン「:」から始めるだけで、登録から設定画面の呼び出しまで完結します。
                  </Translate>
                </p>
              </div>

              <h3 className={styles.referenceSubheading}>
                <Terminal size={17} strokeWidth={2.2} aria-hidden="true" />
                <Translate id="nickmark.commands.heading">組み込みコマンド一覧</Translate>
              </h3>

              <div className={styles.flexList} role="list">
                {COMMAND_ITEMS.map((item) => (
                  <div key={item.command} className={styles.flexRow} role="listitem">
                    <div className={styles.keyCell}>
                      <code className={styles.kbdBadge}>{item.command}</code>
                    </div>
                    <div className={styles.aliasCell}>
                      <span className={styles.aliasPill}>{item.alias}</span>
                    </div>
                    <div className={styles.descCell}>
                      <Translate id={item.descId}>{item.desc}</Translate>
                    </div>
                  </div>
                ))}
              </div>

              <h3 id="shortcuts" className={styles.referenceSubheading}>
                <Keyboard size={17} strokeWidth={2.2} aria-hidden="true" />
                <Translate id="nickmark.shortcuts.heading">キーボードショートカット一覧</Translate>
              </h3>

              <div className={styles.flexList} role="list">
                {SHORTCUT_ITEMS.map((item) => (
                  <div key={item.keys} className={styles.flexRow} role="listitem">
                    <div className={styles.keyCell}>
                      <kbd className={styles.kbdBadge}>{item.keys}</kbd>
                    </div>
                    <div className={styles.aliasCell}>
                      <span className={styles.aliasPill}>
                        <Translate id={item.scopeId}>{item.scope}</Translate>
                      </span>
                    </div>
                    <div className={styles.descCell}>
                      <Translate id={item.descId}>{item.desc}</Translate>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. インストール方法 & 動作要件 */}
          <section id="install" className={`${styles.installSection} ${styles.sectionAlt}`}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrowCenter}>
                  <Package size={15} strokeWidth={2.2} aria-hidden="true" />
                  <Translate id="nickmark.install.eyebrow">インストール</Translate>
                </span>
                <h2 className={styles.sectionTitle}>
                  <Translate id="nickmark.install.title">導入方法とクイックスタート</Translate>
                </h2>
                <p className={styles.sectionSubtitle}>
                  <Translate id="nickmark.install.subtitle">
                    Chrome Web Store からワンクリックで導入できるほか、GitHub リポジトリから直接ビルドして読み込むこともできます。
                  </Translate>
                </p>
              </div>

              <div className={styles.installGrid}>
                {/* Chrome Web Store カード */}
                <div className={styles.installCard}>
                  <div className={styles.installCardHeader}>
                    <span className={styles.installBadgeRecommended}>
                      <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" />
                      <Translate id="nickmark.install.store.badge">推奨</Translate>
                    </span>
                    <h3 className={styles.installCardTitle}>
                      <Translate id="nickmark.install.store.title">
                        Chrome Web Store から追加
                      </Translate>
                    </h3>
                  </div>
                  <p className={styles.installCardDesc}>
                    <Translate id="nickmark.install.store.desc">
                      ストアから追加したら、すぐに以下の 4 ステップで使い始められます。
                    </Translate>
                  </p>

                  <ol className={styles.stepList}>
                    <li>
                      <Translate id="nickmark.install.store.step1">
                        よくアクセスするページを開きます。
                      </Translate>
                    </li>
                    <li>
                      <Translate id="nickmark.install.store.step2">
                        Option + Shift + D（Windows / Linux は Alt + Shift + D）でコマンドパレットを開きます。
                      </Translate>
                    </li>
                    <li>
                      <Translate id="nickmark.install.store.step3">
                        「:add gh」と入力して Enter を押すと、現在のタブがニックネーム「gh」として登録されます。
                      </Translate>
                    </li>
                    <li>
                      <Translate id="nickmark.install.store.step4">
                        次回からはパレットを開いて「gh」と入力し、Enter で即座にジャンプできます。
                      </Translate>
                    </li>
                  </ol>

                  <p className={styles.noteBox}>
                    <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
                    <span>
                      <Translate id="nickmark.install.store.userscriptsNote">
                        javascript: ブックマークレットを利用する場合は、Chrome の拡張機能詳細画面（chrome://extensions）で「ユーザー スクリプトを許可する」を有効にしてください。
                      </Translate>
                    </span>
                  </p>

                  <a
                    href={NICKMARK_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardActionBtnPrimary}
                  >
                    <Puzzle size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span>
                      <Translate id="nickmark.install.store.button">Chrome Web Store を開く</Translate>
                    </span>
                    <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                  </a>
                </div>

                {/* GitHub ソースビルドカード */}
                <div className={styles.installCard}>
                  <div className={styles.installCardHeader}>
                    <span className={styles.installBadgeDev}>
                      <Code2 size={13} strokeWidth={2} aria-hidden="true" />
                      <span>Source</span>
                    </span>
                    <h3 className={styles.installCardTitle}>
                      <Translate id="nickmark.install.dev.title">
                        GitHub からビルドして読み込む
                      </Translate>
                    </h3>
                  </div>
                  <p className={styles.installCardDesc}>
                    <Translate id="nickmark.install.dev.desc">
                      MIT ライセンスのオープンソースとして公開しています。ローカルでのビルド・カスタマイズも簡単です。
                    </Translate>
                  </p>

                  <div className={styles.commandStack}>
                    <div className={styles.subCommandGroup}>
                      <span className={styles.subCommandLabel}>
                        <Translate id="nickmark.install.dev.cloneLabel">リポジトリをクローン</Translate>
                      </span>
                      <CopyCommandPill command={CLONE_COMMAND} variant="block" />
                    </div>

                    <div className={styles.subCommandGroup}>
                      <span className={styles.subCommandLabel}>
                        <Translate id="nickmark.install.dev.buildLabel">依存関係インストール＆ビルド</Translate>
                      </span>
                      <CopyCommandPill command={BUILD_COMMAND} variant="block" />
                    </div>
                  </div>

                  <ol className={styles.stepList}>
                    <li>
                      <Translate id="nickmark.install.dev.step1">
                        Chrome で chrome://extensions を開き、右上の「デベロッパー モード」を有効にします。
                      </Translate>
                    </li>
                    <li>
                      <Translate id="nickmark.install.dev.step2">
                        「パッケージ化されていない拡張機能を読み込む」からビルド済みの package/ ディレクトリを選択します。
                      </Translate>
                    </li>
                  </ol>

                  <a
                    href={NICKMARK_GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cardActionBtnOutline}
                  >
                    <GitHubIcon sx={{ fontSize: 16 }} aria-hidden="true" />
                    <span>
                      <Translate id="nickmark.install.dev.button">GitHub リポジトリを見る</Translate>
                    </span>
                    <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* 動作環境・仕様サマリー */}
              <div className={styles.specsStrip}>
                <div className={styles.specItem}>
                  <Globe size={18} strokeWidth={2} className={styles.specIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.specLabel}>
                      <Translate id="nickmark.specs.browserLabel">対応ブラウザ / 仕様</Translate>
                    </div>
                    <div className={styles.specValue}>
                      <Translate id="nickmark.specs.browserValue">
                        Google Chrome 135 以降 · Manifest V3
                      </Translate>
                    </div>
                  </div>
                </div>

                <div className={styles.specItem}>
                  <ShieldCheck size={18} strokeWidth={2} className={styles.specIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.specLabel}>
                      <Translate id="nickmark.specs.permLabel">プライバシー / 権限</Translate>
                    </div>
                    <div className={styles.specValue}>
                      <Translate id="nickmark.specs.permValue">
                        外部送信ゼロ · 履歴アクセスはオプトイン
                      </Translate>
                    </div>
                  </div>
                </div>

                <div className={styles.specItem}>
                  <Scale size={18} strokeWidth={2} className={styles.specIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.specLabel}>
                      <Translate id="nickmark.specs.licenseLabel">ライセンス / 技術スタック</Translate>
                    </div>
                    <div className={styles.specValue}>
                      <Translate id="nickmark.specs.licenseValue">
                        MIT License · TypeScript / Vue 3 / PrimeVue
                      </Translate>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. ページ下部 CTA */}
          <section className={styles.bottomCtaSection}>
            <div className={styles.container}>
              <div className={styles.bottomCtaInner}>
                <img
                  src={appIconUrl}
                  alt="Nickmark Icon"
                  width={68}
                  height={68}
                  className={styles.bottomCtaIcon}
                />
                <h2 className={styles.bottomCtaTitle}>
                  <Translate id="nickmark.bottomCta.title">
                    ブックマークを探す時間を、ゼロに。
                  </Translate>
                </h2>
                <p className={styles.bottomCtaDesc}>
                  <Translate id="nickmark.bottomCta.desc">
                    無料・オープンソース（MIT ライセンス）で公開しています。Chrome Web Store からすぐに導入できます。
                  </Translate>
                </p>

                <StoreCtaGroup />
              </div>
            </div>
          </section>
        </main>
      </MuiTheme>
    </Layout>
  );
}
