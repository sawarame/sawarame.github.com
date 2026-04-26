import React, { useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Button, CircularProgress } from '@mui/material';
import MuiTheme from '@site/src/components/MuiTheme';
import SpeedIcon from '@mui/icons-material/Speed';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/benchmark.module.css';

// ============================================================
// Logic
// ============================================================

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runBenchmark(onProgress: (msg: string, percent: number) => void): Promise<number> {
  const passes = 5;
  const times: number[] = [];

  for (let p = 1; p <= passes; p++) {
    onProgress(`測定中... (${p}/${passes} 回目)`, (p / passes) * 100);
    // UIを更新し、ガベージコレクションやJITコンパイルのためのアイドル時間を確保する
    await sleep(50); 

    const start = performance.now();

    // 1. 浮動小数点演算 (Floating Point Math)
    let floatSum = 0;
    for (let i = 0; i < 10_000_000; i++) {
      floatSum += Math.sin(i) * Math.cos(i) + Math.sqrt(i);
    }

    // 2. 整数・ビット演算 (Integer & Bitwise Math)
    let intSum = 0;
    for (let i = 0; i < 50_000_000; i++) {
      intSum += (i * 1337) ^ (i << 2);
    }

    // 3. メモリアクセス (Memory & Array Operations)
    const size = 5_000_000;
    const arr = new Int32Array(size);
    for (let i = 0; i < size; i++) arr[i] = i;
    let memSum = 0;
    for (let i = 0; i < size; i++) {
      const idx = (i * 7919) % size; // 素数を使った疑似ランダムアクセス
      memSum += arr[idx];
      arr[idx] = memSum % 100;
    }

    const end = performance.now();
    times.push(end - start);

    // 最適化によるコード削除（Dead Code Elimination）を防ぐための処理
    if (floatSum === 0 && intSum === 0 && memSum === 0) {
      console.log('Anti-optimization triggered');
    }
  }

  // 初回はJITコンパイルのオーバーヘッドが乗るため、複数回の平均を取る
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

  // 0除算を防ぐ
  if (avgTime === 0) return 9999;

  // スコア計算 (係数は調整が必要。平均250msならスコア2000になるように設定)
  const score = Math.floor(500_000 / avgTime);
  return score;
}

function getRankInfo(score: number) {
  if (score >= 2000) {
    return { rank: 'S', label: 'Rank S', desc: 'ハイエンドPC (M4 Proなど最新SoC)', className: styles.rankS };
  } else if (score >= 1000) {
    return { rank: 'A', label: 'Rank A', desc: '高性能ノートPC / 最新iPhone', className: styles.rankA };
  } else if (score >= 500) {
    return { rank: 'B', label: 'Rank B', desc: '一般的なビジネスPC / ミドルレンジスマホ', className: styles.rankB };
  } else {
    return { rank: 'C', label: 'Rank C', desc: 'エントリーモデル / 旧世代デバイス', className: styles.rankC };
  }
}

// ============================================================
// Sub Components
// ============================================================

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div className={styles.pageHeaderOrb1} />
        <div className={styles.pageHeaderOrb2} />
      </div>
      <div className={common.pageHeaderContent}>
        <span className={styles.pageHeaderIcon}>🚀</span>
        <h1 className={styles.pageHeaderTitle}>デバイスベンチマーク</h1>
        <p className={common.pageHeaderDesc}>
          お使いのブラウザ・デバイスの演算性能を測定し、スコアとランクで評価します。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Benchmark(): JSX.Element {
  const title = 'デバイスベンチマーク';
  const description = 'お使いのブラウザ・デバイスの演算性能を測定し、スコアとランクで評価します。';
  const { siteConfig } = useDocusaurusContext();

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [score, setScore] = useState<number | null>(null);

  const handleStart = async () => {
    setIsMeasuring(true);
    setScore(null);
    setProgressMsg('準備中...');
    
    // UIを更新させてからベンチマークを開始
    await sleep(100);

    const resultScore = await runBenchmark((msg) => {
      setProgressMsg(msg);
    });

    setScore(resultScore);
    setIsMeasuring(false);
    setProgressMsg('');
  };

  const rankInfo = score !== null ? getRankInfo(score) : null;

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div className={styles.container}>
            
            <div className={styles.benchCard}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>ブラウザの演算性能をテスト</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>
                「測定開始」ボタンをクリックすると、ブラウザ上で重い計算処理（1千万回のループ計算）を実行し、かかった時間からスコアを算出します。
              </p>

              <div className={styles.buttonWrap}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleStart}
                  disabled={isMeasuring}
                  className={styles.benchButton}
                  startIcon={isMeasuring ? <CircularProgress size={24} color="inherit" /> : <SpeedIcon />}
                >
                  {isMeasuring ? progressMsg : '測定開始'}
                </Button>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'left', background: 'var(--ifm-color-warning-contrast-background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ifm-color-warning-dark)' }}>
                <p style={{ color: 'var(--ifm-color-warning-dark)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  ⚠️ <strong>注意:</strong> このベンチマークテストは負荷の高い計算を行うため、スマートフォンやモバイル端末では一時的にバッテリーを大きく消耗する場合があります。
                </p>
              </div>

              {rankInfo && (
                <div className={styles.resultContainer}>
                  <div className={styles.scoreLabel}>測定スコア</div>
                  <div className={styles.scoreValue}>{score?.toLocaleString()}</div>
                  <div className={`${styles.rankBadge} ${rankInfo.className}`}>
                    {rankInfo.label}
                  </div>
                  <div className={styles.deviceImage}>
                    目安: <strong>{rankInfo.desc}</strong>
                  </div>
                </div>
              )}
            </div>

            <table className={styles.referenceTable}>
              <thead>
                <tr>
                  <th>スコア</th>
                  <th>ランク</th>
                  <th>デバイスのイメージ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2000以上</td>
                  <td><strong>Rank S</strong></td>
                  <td>ハイエンドPC (M4 Proなど最新SoC)</td>
                </tr>
                <tr>
                  <td>1000〜1999</td>
                  <td><strong>Rank A</strong></td>
                  <td>高性能ノートPC / 最新iPhone</td>
                </tr>
                <tr>
                  <td>500〜999</td>
                  <td><strong>Rank B</strong></td>
                  <td>一般的なビジネスPC / ミドルレンジスマホ</td>
                </tr>
                <tr>
                  <td>500未満</td>
                  <td><strong>Rank C</strong></td>
                  <td>エントリーモデル / 旧世代デバイス</td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
