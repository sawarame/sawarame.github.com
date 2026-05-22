import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface LinkCardProps {
  title: string;
  description: string;
  url: string;
  emoji?: string;
}

/**
 * Zenn風のリッチなリンクカードコンポーネント
 * ブログ記事内での過去記事参照などに使用する
 */
export default function LinkCard({ title, description, url, emoji }: LinkCardProps): JSX.Element {
  return (
    <Link to={url} className={styles.linkCard}>
      <div className={styles.emojiWrapper}>
        <span className={styles.emoji}>{emoji || '🔗'}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </Link>
  );
}
