import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import styles from '../css/index.module.css';

import EnvIconPng from '@site/src/icons/EnvIcon.png';
import GeminiSparkPng from '@site/src/icons/gemini-spark.png';
import MdPickerPng from '@site/src/icons/MdPicker.png';
import BenchmarkSvg from '@site/src/icons/benchmark.svg';

// ============================================================
// Data
// ============================================================

const tools = [
  {
    icon: '🔐',
    titleId: 'home.tools.password.title',
    title: 'パスワードジェネレーター',
    descriptionId: 'home.tools.password.desc',
    description:
      '条件を指定してパスワードを作成できます。設定はURLに含まれるため、URLの共有により同じ条件で生成可能です。ブラウザ上で動作するため安全に利用できます。',
    link: '/password',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: '📝',
    titleId: 'home.tools.text.title',
    title: 'テキスト保存場所',
    descriptionId: 'home.tools.text.desc',
    description:
      'テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。',
    link: '/text',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: '📱',
    titleId: 'home.tools.device.title',
    title: 'デバイス情報チェッカー',
    descriptionId: 'home.tools.device.desc',
    description:
      '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。',
    link: '/device',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    icon: '📷',
    titleId: 'home.tools.qr.title',
    title: 'QRコード作成',
    descriptionId: 'home.tools.qr.desc',
    description: 'URLやテキストからQRコードを生成します。ロゴの埋め込みやWi-Fi・カレンダー登録のQRコード作成などにも対応しています。',
    link: '/qr',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    icon: '🔍',
    titleId: 'home.tools.qr-reader.title',
    title: 'QRコード読み取り',
    descriptionId: 'home.tools.qr-reader.desc',
    description: 'QRコードの画像をアップロードして、埋め込まれた文字列を解析します。URLの場合は直接開くことも可能。すべてブラウザ内で処理されます。',
    link: '/qr-reader',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
  },
  {
    icon: '🗓️',
    titleId: 'home.tools.date.title',
    title: '日付比較ツール',
    descriptionId: 'home.tools.date.desc',
    description: '二つの日付の差分を計算します。様々なフォーマットの日付入力に対応しています。',
    link: '/date',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    icon: '📸',
    titleId: 'home.tools.exif.title',
    title: '写真Exif情報チェッカー',
    descriptionId: 'home.tools.exif.desc',
    description: '写真の撮影日時やカメラ情報、GPSなどを読み取ります。写真はサーバーに送信されず、すべてブラウザ内で処理されるため安全です。',
    link: '/exif',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  {
    icon: '🖼️',
    titleId: 'home.tools.resize.title',
    title: '画像軽量化・クロップツール',
    descriptionId: 'home.tools.resize.desc',
    description: 'ブラウザ上で画像を軽量化し、WebPなどの形式に変換します。一括処理やEXIF情報の削除にも対応しています。',
    link: '/resize',
    gradient: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
  },
  {
    icon: '📄',
    titleId: 'home.tools.pdfEditor.title',
    title: 'PDF変換・編集',
    descriptionId: 'home.tools.pdfEditor.desc',
    description: 'PDFを画像に変換したり、必要なページだけを抽出・結合して新しいPDFを作成できます。プレビューを見ながら選択可能。ブラウザ上で完結するため安全です。',
    link: '/pdf-editor',
    gradient: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
  },
  {
    icon: <BenchmarkSvg role="img" aria-label="Web快適度測定" style={{ width: '36px', height: '36px' }} />,
    titleId: 'home.tools.benchmark.title',
    title: 'Web快適度測定',
    descriptionId: 'home.tools.benchmark.desc',
    description: 'ブラウザ上でデバイスの演算性能を測定し、スコアとランクで評価します。',
    link: '/benchmark',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #4facfe 100%)',
  },
];

const extensions = [
  {
    iconSrc: EnvIconPng,
    title: 'EnvIcon',
    descriptionId: 'home.extensions.envicon.desc',
    description:
      '本番・検証・開発環境でfaviconを書き換えることができる、開発者向けのブラウザ拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/envicon/fkapincooiacacfebhkmjoekabbffako',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: GeminiSparkPng,
    title: 'Gemini Spark',
    descriptionId: 'home.extensions.geminispark.desc',
    description:
      'Google Gemini のウェブインターフェースを強化するためのブラウザ拡張機能です。エンターキーで改行し、Command+Enter (Ctrl+Enter) で送信できるようになります。',
    link: 'https://chromewebstore.google.com/detail/gemini-spark/iolhhcbgkkmlfndhmpclkabebjlinkic',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: MdPickerPng,
    title: 'MdPicker',
    descriptionId: 'home.extensions.mdpicker.desc',
    description:
      'ウェブページのリンクをMarkdown形式で簡単にコピーできるブラウザ拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/mdpicker/aihoeldnpdpcbjbcgamhhkgnpmihooep',
    badge: 'Chrome Web Store',
  },
];

// ============================================================
// Components
// ============================================================

function HeroSection() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground}>
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroOrb3} />
      </div>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          <Translate id="home.hero.badge">便利ツール & ブラウザ拡張機能</Translate>
        </div>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>
          {translate({ id: 'home.hero.subtitle', message: siteConfig.tagline })}
        </p>
        <div className={styles.heroActions}>
          <a href="#tools" className={styles.heroPrimaryBtn}>
            <Translate id="home.hero.actions.tools">ツールを見る</Translate>
          </a>
          <a href="#extensions" className={styles.heroSecondaryBtn}>
            <Translate id="home.hero.actions.extensions">拡張機能を見る</Translate>
          </a>
        </div>
        <div style={{ marginTop: '1.5rem', opacity: 0.8 }}>
          <Link to="/about" style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'underline' }}>
            <Translate id="home.hero.aboutLink">このサイトについて</Translate>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ToolCard({
  icon,
  titleId,
  title,
  descriptionId,
  description,
  link,
  gradient,
}: (typeof tools)[number]) {
  return (
    <Link to={link} className={styles.card}>
      <div className={styles.cardIconWrap} style={{ background: gradient }}>
        <span className={styles.cardIcon}>{icon}</span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>
          {translate({ id: titleId, message: title })}
        </h3>
        <p className={styles.cardDescription}>
          {translate({ id: descriptionId, message: description })}
        </p>
      </div>
      <div className={styles.cardArrow}>→</div>
    </Link>
  );
}

function ExtensionCard({
  iconSrc,
  title,
  descriptionId,
  description,
  link,
  badge,
}: (typeof extensions)[number]) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.extensionCard}
    >
      <div className={styles.extensionCardHeader}>
        <div className={styles.extensionIconWrap}>
          <img src={iconSrc} alt={title} className={styles.extensionIcon} />
        </div>
        <span className={styles.extensionBadge}>{badge}</span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>
          {translate({ id: descriptionId, message: description })}
        </p>
      </div>
      <div className={styles.extensionLink}>
        <Translate id="home.extensions.linkText">Chrome Web Store で見る →</Translate>
      </div>
    </a>
  );
}

function SectionHeader({
  labelId,
  label,
  titleId,
  title,
  subtitleId,
  subtitle,
}: {
  labelId: string;
  label: string;
  titleId: string;
  title: string;
  subtitleId: string;
  subtitle: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionLabel}>
        {translate({ id: labelId, message: label })}
      </span>
      <h2 className={styles.sectionTitle}>
        {translate({ id: titleId, message: title })}
      </h2>
      <p className={styles.sectionSubtitle}>
        {translate({ id: subtitleId, message: subtitle })}
      </p>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={translate({
        id: 'home.description',
        message: 'sawara.me — 日常のちょっとした不便を解決する、小さな便利ツールやアプリケーションを公開しているサイトです。'
      })}
    >
      <HeroSection />

      {/* Tools Section */}
      <section id="tools" className={styles.section}>
        <div className={styles.container}>
          <SectionHeader
            labelId="home.tools.label"
            label="🛠 ツール集"
            titleId="home.tools.title"
            title="ブラウザで使えるツール"
            subtitleId="home.tools.subtitle"
            subtitle="ブラウザ上で完結する、日常的に使えるシンプルなツール群です。"
          />
          <div className={styles.grid}>
            {tools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Extensions Section */}
      <section id="extensions" className={styles.sectionAlt}>
        <div className={styles.container}>
          <SectionHeader
            labelId="home.extensions.label"
            label="🧩 ブラウザ拡張機能"
            titleId="home.extensions.title"
            title="Chrome 拡張機能"
            subtitleId="home.extensions.subtitle"
            subtitle="Chrome Web Store で公開している拡張機能です。日々の開発・閲覧をより快適にします。"
          />
          <div className={styles.grid}>
            {extensions.map((ext) => (
              <ExtensionCard key={ext.title} {...ext} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
