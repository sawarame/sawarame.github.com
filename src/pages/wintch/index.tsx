import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';
import MuiTheme from '@site/src/components/MuiTheme';
import CopyCommandPill from '@site/src/components/Wintch/CopyCommandPill';
import WintchShowcase from '@site/src/components/Wintch/WintchShowcase';
import {
  WindowSwitcherVisual,
  FuzzySearchVisual,
  SmartCloseVisual,
  NativeArchitectureVisual,
} from '@site/src/components/Wintch/WintchFeatureVisuals';
import {
  Download,
  ExternalLink,
  Layers,
  Search,
  XCircle,
  ShieldCheck,
  Keyboard,
  Package,
  FolderDown,
  CheckCircle2,
  Cpu,
  Scale,
} from 'lucide-react';
import GitHubIcon from '@mui/icons-material/GitHub';
import styles from './styles.module.css';

/**
 * GitHub リポジトリ URL
 */
const WINTCH_GITHUB_URL = 'https://github.com/sawarame/Wintch';

/**
 * GitHub Releases 最新リリースページ URL
 */
const WINTCH_RELEASES_URL = 'https://github.com/sawarame/Wintch/releases/latest';

/**
 * Homebrew Cask インストールコマンド
 */
const BREW_INSTALL_CMD = 'brew install --cask sawarame/tap/wintch';

/**
 * Homebrew Cask アップデートコマンド
 */
const BREW_UPGRADE_CMD = 'brew upgrade --cask wintch';

/**
 * Homebrew Cask アンインストールコマンド
 */
const BREW_UNINSTALL_CMD = 'brew uninstall --cask wintch';

/**
 * キーボードショートカット一覧の行データ型定義
 */
interface ShortcutRowItem {
  /** 操作キー表記 */
  keys: string;
  /** 対象モードまたは補足ラベルの翻訳 ID */
  scopeId: string;
  /** 対象モードまたは補足ラベルの既定日本語テキスト */
  scope: string;
  /** 機能説明の翻訳 ID */
  descId: string;
  /** 機能説明の既定日本語テキスト */
  desc: string;
}

/**
 * デフォルトのキーボードショートカット一覧データ
 */
const SHORTCUT_ITEMS: ShortcutRowItem[] = [
  {
    keys: '⌥ + Tab',
    scopeId: 'wintch.shortcuts.scope.normal',
    scope: '通常スイッチャー',
    descId: 'wintch.shortcuts.desc.normalNext',
    desc: 'ホールド式でスイッチャーを開き、次のウィンドウへ移動（修飾キーを離して確定）',
  },
  {
    keys: '⌥ + ⇧ + Tab',
    scopeId: 'wintch.shortcuts.scope.normal',
    scope: '通常スイッチャー',
    descId: 'wintch.shortcuts.desc.normalPrev',
    desc: '逆方向（前のウィンドウ）へ選択を移動',
  },
  {
    keys: '⌥ + Space',
    scopeId: 'wintch.shortcuts.scope.launcher',
    scope: '検索ランチャー',
    descId: 'wintch.shortcuts.desc.launcherToggle',
    desc: 'トグル式で検索ランチャーを開く / 閉じる（再押下でキャンセル）',
  },
  {
    keys: '↑ / ↓ · Ctrl + N / P',
    scopeId: 'wintch.shortcuts.scope.both',
    scope: '共通',
    descId: 'wintch.shortcuts.desc.navigate',
    desc: 'ウィンドウ候補およびアプリ起動候補を上下に循環移動（ランチャー中は ⌥ + Tab も可）',
  },
  {
    keys: '⌥ + Q',
    scopeId: 'wintch.shortcuts.scope.both',
    scope: '共通',
    descId: 'wintch.shortcuts.desc.close',
    desc: '選択中のウィンドウを閉じる',
  },
  {
    keys: 'Enter / Esc',
    scopeId: 'wintch.shortcuts.scope.both',
    scope: '共通',
    descId: 'wintch.shortcuts.desc.confirmCancel',
    desc: 'Enter で切り替え・アプリ起動を確定、Esc で切り替えずにキャンセル',
  },
];

/**
 * LinearMouse スタイルのダウンロード＋Homebrew コピー CTA グループを描画するコンポーネント
 * @returns CTA ボタングループの JSX 要素
 */
function DownloadCtaGroup(): JSX.Element {
  return (
    <div className={styles.ctaGroup}>
      <a
        href={WINTCH_RELEASES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.primaryDownloadBtn}
      >
        <Download size={18} strokeWidth={2.2} aria-hidden="true" />
        <span>
          <Translate id="wintch.cta.download">ダウンロード (v0.1.1)</Translate>
        </span>
      </a>

      <CopyCommandPill
        command={BREW_INSTALL_CMD}
        variant="pill"
        ariaLabel={translate({
          id: 'wintch.cta.copyBrewAria',
          message: 'Homebrew インストールコマンドをコピー: brew install --cask sawarame/tap/wintch',
        })}
      />
    </div>
  );
}

/**
 * ページ上部のヒーローセクション（アプリアイコン・見出し・CTA・アンカーピル）コンポーネント
 * @returns ヒーローセクションの JSX 要素
 */
function WintchHeroSection(): JSX.Element {
  const appIconUrl = useBaseUrl('/img/wintch/app-icon.svg');

  const navPills = [
    { href: '#switcher', labelId: 'wintch.nav.switcher', label: '通常スイッチャー' },
    { href: '#launcher', labelId: 'wintch.nav.launcher', label: '検索ランチャー' },
    { href: '#close', labelId: 'wintch.nav.close', label: 'ウィンドウ終了' },
    { href: '#privacy', labelId: 'wintch.nav.privacy', label: 'ネイティブ設計' },
    { href: '#install', labelId: 'wintch.nav.install', label: 'インストール' },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.container}>
        {/* セクションアンカーピル（LinearMouse 風クイックナビ） */}
        <nav
          className={styles.anchorNav}
          aria-label={translate({ id: 'wintch.nav.ariaLabel', message: 'ページ内ナビゲーション' })}
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
              alt="Wintch App Icon"
              width={84}
              height={84}
              className={styles.heroIcon}
            />
            <span className={styles.metaPill}>
              <Translate id="wintch.hero.meta">
                v0.1.1 · macOS 14.0+ · MIT License
              </Translate>
            </span>
          </div>

          <h1 className={styles.heroTitle}>
            <Translate id="wintch.hero.titlePrefix">ウィンドウの切り替えを、</Translate>
            <br />
            <span className={styles.heroTitleAccent}>
              <Translate id="wintch.hero.titleAccent">もっと直感的に。</Translate>
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            <Translate id="wintch.hero.subtitle">
              Wintch（Window + Switch）は、macOS 標準の Command + Tab では届かない「同じアプリの複数ウィンドウ」へ瞬時に切り替えられる、シンプルで軽量なウィンドウ単位スイッチャー＆検索ランチャーです。
            </Translate>
          </p>

          <DownloadCtaGroup />

          <div className={styles.heroLinks}>
            <a
              href={WINTCH_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              <GitHubIcon sx={{ fontSize: 16 }} aria-hidden="true" />
              <span>GitHub (sawarame/Wintch)</span>
              <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 機能紹介セクション（左右交互レイアウト）の Props 型定義
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
  /** 箇条書きポイントの翻訳データ配列 */
  bullets: Array<{ id: string; text: string }>;
  /** 右側（または左側）に表示するビジュアルコンポーネント */
  visual: React.ReactNode;
  /** ビジュアルを左側に配置するかどうか */
  reverse?: boolean;
  /** 背景を交互カラーにするかどうか */
  altSurface?: boolean;
}

/**
 * LinearMouse スタイルの 2 カラム機能紹介セクションコンポーネント
 * @param props - 見出し・説明文・箇条書き・ビジュアル要素を含む Props
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
                  <CheckCircle2 size={16} strokeWidth={2.2} className={styles.bulletIcon} aria-hidden="true" />
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
 * Wintch の紹介・機能・ショートカット・インストール方法を掲載するランディングページ
 * @returns Wintch 紹介ページの JSX 要素
 */
export default function WintchPage(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const appIconUrl = useBaseUrl('/img/wintch/app-icon.svg');

  const pageTitle = translate({
    id: 'wintch.page.title',
    message: 'Wintch | macOS 向けシンプルウィンドウ単位スイッチャー＆ランチャー',
  });

  const pageDesc = translate({
    id: 'wintch.page.description',
    message:
      '完全ローカル動作・軽量でシンプルな macOS 向けウィンドウ単位スイッチャー＆検索ランチャー「Wintch」の紹介とインストール方法。',
  });

  return (
    <Layout title={`${pageTitle} | ${siteConfig.title}`} description={pageDesc}>
      <MuiTheme>
        <main className={styles.pageMain}>
          {/* 1. ヒーロー */}
          <WintchHeroSection />

          {/* 2. インタラクティブ UI プレビュー */}
          <section className={styles.showcaseSection}>
            <div className={styles.container}>
              <WintchShowcase />
            </div>
          </section>

          {/* 3. 機能紹介（LinearMouse スタイル 4 セクション） */}
          <FeatureSection
            id="switcher"
            icon={<Layers size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="wintch.feature1.eyebrow"
            eyebrow="通常スイッチャー (⌥ + Tab)"
            titlePrefixId="wintch.feature1.titlePrefix"
            titlePrefix="ウィンドウ単位で、"
            titleAccentId="wintch.feature1.titleAccent"
            titleAccent="迷わず切り替え。"
            descriptionId="wintch.feature1.desc"
            description="macOS 標準の Command + Tab がアプリケーション単位の切り替えであるのに対し、Wintch は開いているウィンドウを 1 枚ずつ一覧表示。同じアプリで複数のウィンドウを開いていても、直近で使っていた順（MRU）で目的の画面へ素早く行き来できます。"
            bullets={[
              {
                id: 'wintch.feature1.b1',
                text: 'Option + Tab を押してすぐ離すだけで、直前に使っていたウィンドウへすばやく切り替え',
              },
              {
                id: 'wintch.feature1.b2',
                text: '修飾キーを保持したまま Tab / Shift+Tab / 矢印キーで移動し、離した瞬間に確定',
              },
              {
                id: 'wintch.feature1.b3',
                text: '設定画面から好みのショートカット（Option / Control / Command）へ自由に変更可能',
              },
            ]}
            visual={<WindowSwitcherVisual />}
            altSurface
          />

          <FeatureSection
            id="launcher"
            icon={<Search size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="wintch.feature2.eyebrow"
            eyebrow="検索ランチャー (⌥ + Space)"
            titlePrefixId="wintch.feature2.titlePrefix"
            titlePrefix="検索もアプリ起動も、"
            titleAccentId="wintch.feature2.titleAccent"
            titleAccent="ひとつのパネルで。"
            descriptionId="wintch.feature2.desc"
            description="ウィンドウが増えてきたら検索ランチャーをトグル起動。アプリ名やウィンドウタイトルをスペース区切り AND のファジー検索で絞り込み、まだ開いていないアプリも下の「アプリを起動」欄からそのまま立ち上げられます。"
            bullets={[
              {
                id: 'wintch.feature2.b1',
                text: '一致した文字位置を太字とカラーでリアルタイムにハイライト表示',
              },
              {
                id: 'wintch.feature2.b2',
                text: '「メモ / Notes」のように日本語表示名と英語名のどちらでもアプリを起動検索可能',
              },
              {
                id: 'wintch.feature2.b3',
                text: '↑ / ↓・Ctrl + N / P に加え、ランチャー表示中でも ⌥ + Tab で候補をそのまま移動',
              },
            ]}
            visual={<FuzzySearchVisual />}
            reverse
          />

          <FeatureSection
            id="close"
            icon={<XCircle size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="wintch.feature3.eyebrow"
            eyebrow="ウィンドウ整理 (⌥ + Q)"
            titlePrefixId="wintch.feature3.titlePrefix"
            titlePrefix="一覧のまま、"
            titleAccentId="wintch.feature3.titleAccent"
            titleAccent="不要なウィンドウを閉じる。"
            descriptionId="wintch.feature3.desc"
            description="わざわざ対象ウィンドウへ切り替えてから閉じる必要はありません。スイッチャーやランチャーの一覧から選んで修飾キー + Q（デフォルト ⌥ + Q）を押すだけで、その場から素早く閉じられます。"
            bullets={[
              {
                id: 'wintch.feature3.b1',
                text: 'スイッチャーでも検索ランチャーでも、同じ ⌥ + Q の操作感でそのまま閉じられる',
              },
              {
                id: 'wintch.feature3.b2',
                text: 'パネルを開いたまま連続して不要なウィンドウを整理できる',
              },
              {
                id: 'wintch.feature3.b3',
                text: '未保存変更のあるウィンドウでは強制終了せず、アプリ標準の保存確認ダイアログを尊重',
              },
            ]}
            visual={<SmartCloseVisual />}
            altSurface
          />

          <FeatureSection
            id="privacy"
            icon={<ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />}
            eyebrowId="wintch.feature4.eyebrow"
            eyebrow="Native & Lightweight"
            titlePrefixId="wintch.feature4.titlePrefix"
            titlePrefix="ネイティブ実装で、"
            titleAccentId="wintch.feature4.titleAccent"
            titleAccent="軽快に、シンプルに。"
            descriptionId="wintch.feature4.desc"
            description="Swift 6.0 と SwiftUI を中心とした Apple 標準フレームワークのみで構成。外部依存のないシンプルな設計で、日々の切り替え操作をストレスなく支えます。"
            bullets={[
              {
                id: 'wintch.feature4.b1',
                text: 'Apple Silicon / Intel 両対応の Universal Binary で軽快に動作',
              },
              {
                id: 'wintch.feature4.b2',
                text: '外部サーバーへの通信やトラッキングを行わない完全ローカル動作',
              },
              {
                id: 'wintch.feature4.b3',
                text: 'Dock にアイコンを出さないメニューバー常駐（LSUIElement）スタイル',
              },
            ]}
            visual={<NativeArchitectureVisual />}
            reverse
          />

          {/* 4. キーボードショートカット早見表（flex リスト形式） */}
          <section id="shortcuts" className={`${styles.shortcutsSection} ${styles.sectionAlt}`}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrowCenter}>
                  <Keyboard size={15} strokeWidth={2.2} aria-hidden="true" />
                  <Translate id="wintch.shortcuts.eyebrow">キーボード操作</Translate>
                </span>
                <h2 className={styles.sectionTitle}>
                  <Translate id="wintch.shortcuts.title">基本ショートカット一覧</Translate>
                </h2>
                <p className={styles.sectionSubtitle}>
                  <Translate id="wintch.shortcuts.subtitle">
                    デフォルト設定のキーバインドです。起動ショートカットは設定画面（⌘ + ,）から自由にカスタマイズできます。
                  </Translate>
                </p>
              </div>

              <div className={styles.shortcutList} role="list">
                {SHORTCUT_ITEMS.map((item) => (
                  <div key={item.keys} className={styles.shortcutRow} role="listitem">
                    <div className={styles.shortcutKeyCell}>
                      <kbd className={styles.shortcutKbd}>{item.keys}</kbd>
                    </div>
                    <div className={styles.shortcutScopeCell}>
                      <span className={styles.shortcutScopeBadge}>
                        <Translate id={item.scopeId}>{item.scope}</Translate>
                      </span>
                    </div>
                    <div className={styles.shortcutDescCell}>
                      <Translate id={item.descId}>{item.desc}</Translate>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. インストール方法 & 動作要件 */}
          <section id="install" className={styles.installSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrowCenter}>
                  <Package size={15} strokeWidth={2.2} aria-hidden="true" />
                  <Translate id="wintch.install.eyebrow">インストール</Translate>
                </span>
                <h2 className={styles.sectionTitle}>
                  <Translate id="wintch.install.title">インストール方法とセットアップ</Translate>
                </h2>
                <p className={styles.sectionSubtitle}>
                  <Translate id="wintch.install.subtitle">
                    Homebrew Cask または GitHub Releases の配布 ZIP からすぐに導入できます。Developer ID 署名・Apple 公証済みです。
                  </Translate>
                </p>
              </div>

              <div className={styles.installGrid}>
                {/* Homebrew カード */}
                <div className={styles.installCard}>
                  <div className={styles.installCardHeader}>
                    <span className={styles.installBadgeRecommended}>
                      <Translate id="wintch.install.brew.badge">推奨</Translate>
                    </span>
                    <h3 className={styles.installCardTitle}>
                      <Translate id="wintch.install.brew.title">
                        Homebrew でインストール
                      </Translate>
                    </h3>
                  </div>
                  <p className={styles.installCardDesc}>
                    <Translate id="wintch.install.brew.desc">
                      ターミナルから以下のコマンドを実行すると、Tap の追加とインストールが一度に完了します。
                    </Translate>
                  </p>

                  <div className={styles.commandStack}>
                    <CopyCommandPill command={BREW_INSTALL_CMD} variant="block" />

                    <div className={styles.subCommandGroup}>
                      <span className={styles.subCommandLabel}>
                        <Translate id="wintch.install.brew.upgradeLabel">
                          最新版へアップデート
                        </Translate>
                      </span>
                      <CopyCommandPill command={BREW_UPGRADE_CMD} variant="block" />
                    </div>

                    <div className={styles.subCommandGroup}>
                      <span className={styles.subCommandLabel}>
                        <Translate id="wintch.install.brew.uninstallLabel">
                          アンインストール（設定削除は --zap を付与）
                        </Translate>
                      </span>
                      <CopyCommandPill command={BREW_UNINSTALL_CMD} variant="block" />
                    </div>
                  </div>
                </div>

                {/* GitHub Releases 手動インストールカード */}
                <div className={styles.installCard}>
                  <div className={styles.installCardHeader}>
                    <span className={styles.installBadgeManual}>
                      <FolderDown size={13} strokeWidth={2} aria-hidden="true" />
                      <span>ZIP</span>
                    </span>
                    <h3 className={styles.installCardTitle}>
                      <Translate id="wintch.install.manual.title">
                        GitHub Releases から手動インストール
                      </Translate>
                    </h3>
                  </div>
                  <p className={styles.installCardDesc}>
                    <Translate id="wintch.install.manual.desc">
                      Homebrew を利用しない場合は、リリースページから直接アプリをダウンロードして導入できます。
                    </Translate>
                  </p>

                  <ol className={styles.stepList}>
                    <li>
                      <Translate id="wintch.install.manual.step1">
                        GitHub Releases ページから最新の Wintch-vX.Y.Z.zip をダウンロードして展開します。
                      </Translate>
                    </li>
                    <li>
                      <Translate id="wintch.install.manual.step2">
                        展開された Wintch.app を /Applications（アプリケーション）フォルダへ移動して起動します。
                      </Translate>
                    </li>
                    <li>
                      <Translate id="wintch.install.manual.step3">
                        初回起動時に表示される案内に従って「システム設定 ＞ プライバシーとセキュリティ ＞ アクセシビリティ」で Wintch を許可します。
                      </Translate>
                    </li>
                  </ol>

                  <p className={styles.notarizedNote}>
                    <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />
                    <span>
                      <Translate id="wintch.install.manual.notarized">
                        配布版は Developer ID 署名および Apple 公証済みのため、通常の起動で Gatekeeper 警告は表示されません。
                      </Translate>
                    </span>
                  </p>

                  <a
                    href={WINTCH_RELEASES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.releasesLinkBtn}
                  >
                    <Download size={16} strokeWidth={2} aria-hidden="true" />
                    <span>
                      <Translate id="wintch.install.manual.button">
                        GitHub Releases を開く
                      </Translate>
                    </span>
                    <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* 動作環境・仕様サマリー */}
              <div className={styles.specsStrip}>
                <div className={styles.specItem}>
                  <Cpu size={18} strokeWidth={2} className={styles.specIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.specLabel}>
                      <Translate id="wintch.specs.osLabel">対応 OS / アーキテクチャ</Translate>
                    </div>
                    <div className={styles.specValue}>
                      <Translate id="wintch.specs.osValue">
                        macOS 14.0 (Sonoma) 以降 · Apple Silicon / Intel
                      </Translate>
                    </div>
                  </div>
                </div>

                <div className={styles.specItem}>
                  <ShieldCheck size={18} strokeWidth={2} className={styles.specIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.specLabel}>
                      <Translate id="wintch.specs.permLabel">必須権限</Translate>
                    </div>
                    <div className={styles.specValue}>
                      <Translate id="wintch.specs.permValue">
                        アクセシビリティ権限
                      </Translate>
                    </div>
                  </div>
                </div>

                <div className={styles.specItem}>
                  <Scale size={18} strokeWidth={2} className={styles.specIcon} aria-hidden="true" />
                  <div>
                    <div className={styles.specLabel}>
                      <Translate id="wintch.specs.licenseLabel">ライセンス / 技術</Translate>
                    </div>
                    <div className={styles.specValue}>
                      <Translate id="wintch.specs.licenseValue">
                        MIT License · Swift 6.0 / SwiftUI
                      </Translate>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. ページ下部 CTA（LinearMouse スタイル） */}
          <section className={`${styles.bottomCtaSection} ${styles.sectionAlt}`}>
            <div className={styles.container}>
              <div className={styles.bottomCtaInner}>
                <img
                  src={appIconUrl}
                  alt="Wintch App Icon"
                  width={68}
                  height={68}
                  className={styles.bottomCtaIcon}
                />
                <h2 className={styles.bottomCtaTitle}>
                  <Translate id="wintch.bottomCta.title">
                    ウィンドウ切り替えのストレスを、ゼロに。
                  </Translate>
                </h2>
                <p className={styles.bottomCtaDesc}>
                  <Translate id="wintch.bottomCta.desc">
                    無料・オープンソース（MIT ライセンス）で公開しています。
                  </Translate>
                </p>

                <DownloadCtaGroup />
              </div>
            </div>
          </section>
        </main>
      </MuiTheme>
    </Layout>
  );
}
