import React from 'react';
import Head from '@docusaurus/Head';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

interface ToolPageHeaderProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color1?: string;
  color2?: string;
  titleGradient?: string;
}

export default function ToolPageHeader({
  title,
  desc,
  icon,
}: ToolPageHeaderProps) {
  return (
    <>
      <Head>
        <meta name="description" content={desc} />
        <meta property="og:description" content={desc} />
        <meta name="twitter:description" content={desc} />
      </Head>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div className={styles.pageHeaderIcon}>
            {icon}
          </div>
          <h1 className={styles.pageHeaderTitle}>
            {title}
          </h1>
          <p className={styles.pageHeaderDesc}>
            {desc}
          </p>
        </div>
      </div>
    </>
  );
}

