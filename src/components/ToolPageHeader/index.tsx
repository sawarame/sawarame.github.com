import React from 'react';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

interface ToolPageHeaderProps {
  title: string;
  desc: string;
  icon: string;
  color1?: string;
  color2?: string;
  titleGradient?: string;
}

export default function ToolPageHeader({
  title,
  desc,
  icon,
  color1 = '#667eea',
  color2 = '#764ba2',
  titleGradient = 'linear-gradient(135deg, #fff 0%, #c7d2fe 60%, #a5b4fc 100%)',
}: ToolPageHeaderProps) {
  return (
    <div className={common.pageHeader} style={{ marginBottom: '3rem' }}>
      <div className={common.pageHeaderBg}>
        <div className={styles.pageHeaderOrb1} style={{ background: `radial-gradient(circle, ${color1}, transparent)` }} />
        <div className={styles.pageHeaderOrb2} style={{ background: `radial-gradient(circle, ${color2}, transparent)` }} />
      </div>
      <div className={common.pageHeaderContent}>
        <span 
          className={styles.pageHeaderIcon} 
          style={{ filter: `drop-shadow(0 4px 12px ${color1}80)` }}
        >
          {icon}
        </span>
        <h1 className={styles.pageHeaderTitle} style={{ backgroundImage: titleGradient }}>
          {title}
        </h1>
        <p className={common.pageHeaderDesc}>
          {desc}
        </p>
      </div>
    </div>
  );
}
