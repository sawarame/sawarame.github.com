import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from '../css/index.module.css';

import EnvIconPng from '@site/src/icons/EnvIcon.png';
import GeminiSparkPng from '@site/src/icons/gemini-spark.png';
import MdPickerPng from '@site/src/icons/MdPicker.png';

// ============================================================
// Data
// ============================================================

const tools = [
  {
    icon: '🔐',
    title: 'パスワードジェネレーター',
    description:
      '条件を指定してパスワードを作成できます。ブラウザ上で動作するため、作成したパスワードは安全に利用できます。',
    link: '/password',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: '📝',
    title: 'テキスト保存場所',
    description:
      'テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。',
    link: '/text',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: '📱',
    title: 'デバイス情報確認',
    description:
      '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。',
    link: '/device',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    icon: '📷',
    title: 'QRコード作成',
    description: 'URLやテキストからQRコードを生成します。',
    link: '/qr',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
];

const extensions = [
  {
    iconSrc: EnvIconPng,
    title: 'EnvIcon',
    description:
      '本番・検証・開発環境でfaviconを書き換えることができる、開発者向けのブラウザ拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/envicon/fkapincooiacacfebhkmjoekabbffako',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: GeminiSparkPng,
    title: 'Gemini Spark',
    description:
      'Google Gemini のウェブインターフェースを強化するためのブラウザ拡張機能です。エンターキーで改行し、Command+Enter (Ctrl+Enter) で送信できるようになります。',
    link: 'https://chromewebstore.google.com/detail/gemini-spark/iolhhcbgkkmlfndhmpclkabebjlinkic',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: MdPickerPng,
    title: 'MdPicker',
    description:
      'ウェブページのリンクをMarkdown形式で簡単にコピーできるブラウザ拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/mdpicker/eepnjnfgehgmmpfkjedngofblojheild',
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
          個人ツール & ブラウザ拡張機能
        </div>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroActions}>
          <a href="#tools" className={styles.heroPrimaryBtn}>
            ツールを見る
          </a>
          <a href="#extensions" className={styles.heroSecondaryBtn}>
            拡張機能を見る
          </a>
        </div>
      </div>
    </section>
  );
}

function ToolCard({
  icon,
  title,
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
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      <div className={styles.cardArrow}>→</div>
    </Link>
  );
}

function ExtensionCard({
  iconSrc,
  title,
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
        <p className={styles.cardDescription}>{description}</p>
      </div>
      <div className={styles.extensionLink}>
        Chrome Web Store で見る →
      </div>
    </a>
  );
}

function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionLabel}>{label}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSubtitle}>{subtitle}</p>
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
      description="sawara.me — 個人ツールとブラウザ拡張機能の置き場"
    >
      <HeroSection />

      {/* Tools Section */}
      <section id="tools" className={styles.section}>
        <div className={styles.container}>
          <SectionHeader
            label="🛠 ツール集"
            title="ブラウザで使えるツール"
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
            label="🧩 ブラウザ拡張機能"
            title="Chrome 拡張機能"
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
