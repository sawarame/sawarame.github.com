import React from 'react';
import styles from './styles.module.css';

/**
 * 魚を模した「sawara.me」のSVGタイポグラフィコンポーネント
 * 
 * デザイン意図:
 * - 全体的に流線型のシルエット（サワラのような細長い形）
 * - 's' を頭部、'me' を尾びれに見立てた構成
 * - SVGの path を使用して、文字と魚の輪郭を融合
 */
export default function SawaraFishLogo() {
  return (
    <div className={styles.fishContainer}>
      <svg
        viewBox="0 0 400 100"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.fishSvg}
        role="img"
        aria-label="sawara.me"
      >
        <defs>
          <linearGradient id="fishGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="60%" stopColor="#c7d2fe" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
          
          {/* 水中を泳ぐような穏やかなアニメーション */}
          <filter id="wave">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.02" numOctaves="2" result="noise">
              <animate attributeName="baseFrequency" values="0.01 0.02;0.015 0.025;0.01 0.02" dur="5s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>

        <g className={styles.fishGroup}>
          {/* 魚の体全体を模したパス。文字のベースラインにもなる */}
          <path
            className={styles.fishBody}
            d="M 20,50 Q 50,20 150,30 T 350,50 Q 380,50 390,40 M 390,60 Q 380,50 350,50 T 150,70 Q 50,80 20,50"
            fill="none"
            stroke="url(#fishGradient)"
            strokeWidth="0.5"
            opacity="0.3"
          />

          {/* sawara.me 文字列をパスに沿わせるか、個別にスタイリングして魚の形を構築 */}
          {/* ここではSVGテキストを使いつつ、配置で魚のシルエットを表現 */}
          <text
            x="50%"
            y="55"
            textAnchor="middle"
            className={styles.fishText}
            fill="url(#fishGradient)"
          >
            <tspan className={styles.fishHead}>s</tspan>
            <tspan className={styles.fishLetter}>a</tspan>
            <tspan className={styles.fishLetter}>w</tspan>
            <tspan className={styles.fishLetter}>a</tspan>
            <tspan className={styles.fishLetter}>r</tspan>
            <tspan className={styles.fishLetter}>a</tspan>
            <tspan className={styles.fishDot}>.</tspan>
            <tspan className={styles.fishTail}>m</tspan>
            <tspan className={styles.fishTail}>e</tspan>
          </text>
          
          {/* 魚の目にあたるドット */}
          <circle cx="45" cy="48" r="1.5" fill="#fff" className={styles.fishEye} />
        </g>
      </svg>
    </div>
  );
}
