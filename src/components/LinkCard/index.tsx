import React from 'react';
import Link from '@docusaurus/Link';
import { LucideIcon, ExternalLink } from 'lucide-react';
import styles from './styles.module.css';

interface LinkCardProps {
  title: string;
  description: string;
  url: string;
  emoji?: string | React.ReactNode;
}

/**
 * Zenn風のリッチなリンクカードコンポーネント
 * ブログ記事内での過去記事参照などに使用する
 */
export default function LinkCard({ title, description, url, emoji }: LinkCardProps): JSX.Element {
  const renderIcon = () => {
    if (!emoji) {
      return <ExternalLink size={32} />;
    }
    if (typeof emoji === 'string') {
      return <span className={styles.emoji}>{emoji}</span>;
    }
    return emoji;
  };

  return (
    <Link to={url} className={styles.linkCard}>
      <div className={styles.emojiWrapper}>
        {renderIcon()}
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </Link>
  );
}
