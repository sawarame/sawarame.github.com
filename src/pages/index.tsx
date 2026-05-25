import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import { Wrench, Puzzle } from 'lucide-react';
import { ToolGrid, ExtensionGrid } from '@site/src/components/FeatureList';
import SawaraFishLogo from '@site/src/components/SawaraFishLogo';
import styles from '../css/index.module.css';

// ============================================================
// Components
// ============================================================

/**
 * ホームページの最上部に表示されるメインビジュアル（ヒーローセクション）です。
 * サイトのロゴ、キャッチコピー、および多言語対応のサイト概要テキストを表示します。
 */
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
        <div className={styles.heroLogoWrapper}>
          <SawaraFishLogo />
        </div>
        <p className={styles.heroSubtitle}>
          {translate({ id: 'home.hero.subtitle', message: siteConfig.tagline })}
        </p>
        <p className={styles.heroDescription}>
          {translate({
            id: 'home.hero.description',
            message: '日常のちょっとした不便を解決する、ブラウザ完結型で安全な便利ツール＆拡張機能集。'
          })}
        </p>
      </div>
    </section>
  );
}

function SectionHeader({
  labelId,
  label,
  titleId,
  title,
  subtitleId,
  subtitle,
  icon,
}: {
  labelId: string;
  label: string;
  titleId: string;
  title: string;
  subtitleId: string;
  subtitle: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionLabel}>
        {icon && <span className={styles.sectionLabelIcon}>{icon}</span>}
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

/**
 * sawara.me のトップページコンポーネントです。
 * ブラウザツール一覧、ブラウザ拡張機能一覧をグリッド状に美しくレイアウトして表示します。
 * SEO対策のため、メタ情報（description）の明示と、不要なタイトルの重複を回避する設定を行っています。
 */
export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title=""
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
            label="ツール集"
            titleId="home.tools.title"
            title="ブラウザで使えるツール"
            subtitleId="home.tools.subtitle"
            subtitle="ブラウザ上で完結する、日常的に使えるシンプルなツール群です。"
            icon={<Wrench size={16} />}
          />
          <ToolGrid />
        </div>
      </section>

      {/* Extensions Section */}
      <section id="extensions" className={styles.sectionAlt}>
        <div className={styles.container}>
          <SectionHeader
            labelId="home.extensions.label"
            label="ブラウザ拡張機能"
            titleId="home.extensions.title"
            title="Chrome 拡張機能"
            subtitleId="home.extensions.subtitle"
            subtitle="Chrome Web Store で公開している拡張機能です。日々の開発・閲覧をより快適にします。"
            icon={<Puzzle size={16} />}
          />
          <ExtensionGrid />
        </div>
      </section>
    </Layout>
  );
}
