import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import { ToolGrid, ExtensionGrid } from '@site/src/components/FeatureList';
import SawaraFishLogo from '@site/src/components/SawaraFishLogo';
import styles from '../css/index.module.css';

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
        <div className={styles.heroLogoWrapper}>
          <SawaraFishLogo />
        </div>
        <p className={styles.heroSubtitle}>
          {translate({ id: 'home.hero.subtitle', message: siteConfig.tagline })}
        </p>
        <div className={styles.heroAbout}>
          <Link to="/about" className={styles.heroAboutLink}>
            <Translate id="home.hero.aboutLink">このサイトについて</Translate>
          </Link>
        </div>
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
          <ToolGrid />
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
          <ExtensionGrid />
        </div>
      </section>
    </Layout>
  );
}
