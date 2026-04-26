import React, { useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Button, CircularProgress } from '@mui/material';
import MuiTheme from '@site/src/components/MuiTheme';
import SpeedIcon from '@mui/icons-material/Speed';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/benchmark.module.css';

// ============================================================
// Worker Logic (Blob URL approach)
// ============================================================

const workerScript = `
self.onmessage = function(e) {
  const passes = e.data.passes || 5;
  const times = [];

  for (let p = 1; p <= passes; p++) {
    const start = performance.now();

    // 1. 浮動小数点演算
    let floatSum = 0;
    for (let i = 0; i < 10000000; i++) {
      floatSum += Math.sin(i) * Math.cos(i) + Math.sqrt(i);
    }

    // 2. 整数・ビット演算
    let intSum = 0;
    for (let i = 0; i < 50000000; i++) {
      intSum += (i * 1337) ^ (i << 2);
    }

    // 3. メモリアクセス
    const size = 5000000;
    const arr = new Int32Array(size);
    for (let i = 0; i < size; i++) arr[i] = i;
    let memSum = 0;
    for (let i = 0; i < size; i++) {
      const idx = (i * 7919) % size;
      memSum += arr[idx];
      arr[idx] = memSum % 100;
    }

    const end = performance.now();
    times.push(end - start);

    if (floatSum === 0 && intSum === 0 && memSum === 0) {
      console.log('Anti-opt');
    }
    
    self.postMessage({ type: 'progress', pass: p, time: end - start });
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  self.postMessage({ type: 'done', avgTime });
};
`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function runWorkerTask(passes: number, onProgress?: (p: number) => void): Promise<number> {
  return new Promise((resolve) => {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      if (e.data.type === 'progress' && onProgress) {
        onProgress(e.data.pass);
      } else if (e.data.type === 'done') {
        worker.terminate();
        resolve(e.data.avgTime);
      }
    };
    worker.postMessage({ passes });
  });
}

async function runSingleCoreBenchmark(passes: number, onProgress?: (msg: string) => void): Promise<number> {
  let completedPasses = 0;
  const avgTime = await runWorkerTask(passes, () => {
    completedPasses++;
    if (onProgress) {
      onProgress(`シングルコア測定中... (${completedPasses}/${passes} 回目)`);
    }
  });
  if (avgTime === 0) return 9999;
  return Math.floor(500_000 / avgTime);
}

async function runMultiCoreBenchmark(cores: number, passes: number, onProgress?: (msg: string) => void): Promise<number> {
  const workers: Promise<number>[] = [];
  const startAll = performance.now();
  let completedPasses = 0;
  const totalPasses = passes * cores;

  for (let i = 0; i < cores; i++) {
    workers.push(runWorkerTask(passes, () => {
      completedPasses++;
      if (onProgress) {
        onProgress(`マルチコア測定中... (${Math.floor((completedPasses / totalPasses) * 100)}%)`);
      }
    }));
  }

  await Promise.all(workers);
  const endAll = performance.now();
  const totalTime = endAll - startAll;

  if (totalTime === 0) return 9999;
  // MultiScore = 500_000 * cores * passes / totalTime
  const multiScore = Math.floor((500_000 * cores * passes) / totalTime);
  return multiScore;
}

function getSingleCoreRankInfo(score: number) {
  if (score >= 2000) return { rank: 'S', label: 'Rank S', desc: 'ハイエンドPC (M4 Proなど最新SoC)', className: styles.rankS };
  if (score >= 1000) return { rank: 'A', label: 'Rank A', desc: '高性能ノートPC / 最新iPhone', className: styles.rankA };
  if (score >= 500) return { rank: 'B', label: 'Rank B', desc: '一般的なビジネスPC / ミドルレンジスマホ', className: styles.rankB };
  return { rank: 'C', label: 'Rank C', desc: 'エントリーモデル / 旧世代デバイス', className: styles.rankC };
}

function getMultiCoreRankInfo(score: number) {
  if (score >= 8000) return { rank: 'S', label: 'Rank S', desc: 'ハイエンドPC (M4 Proなど最新SoC)', className: styles.rankS };
  if (score >= 4000) return { rank: 'A', label: 'Rank A', desc: '高性能ノートPC / 最新iPhone', className: styles.rankA };
  if (score >= 1000) return { rank: 'B', label: 'Rank B', desc: '一般的なビジネスPC / ミドルレンジスマホ', className: styles.rankB };
  return { rank: 'C', label: 'Rank C', desc: 'エントリーモデル / 旧世代デバイス', className: styles.rankC };
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

  const [cores, setCores] = React.useState<number>(4);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const [singleScore, setSingleScore] = useState<number | null>(null);
  const [multiScore, setMultiScore] = useState<number | null>(null);

  React.useEffect(() => {
    setCores(navigator.hardwareConcurrency || 4);
  }, []);

  const handleStart = async () => {
    setIsMeasuring(true);
    setSingleScore(null);
    setMultiScore(null);
    setProgressMsg('準備中...');

    await sleep(100);

    // 1. シングルコア測定
    const sScore = await runSingleCoreBenchmark(5, setProgressMsg);
    setSingleScore(sScore);

    // マルチ測定との間に少し間を置く
    setProgressMsg('マルチコア測定準備中...');
    await sleep(800);

    // 2. マルチコア測定
    const mScore = await runMultiCoreBenchmark(cores, 5, setProgressMsg);
    setMultiScore(mScore);

    setIsMeasuring(false);
    setProgressMsg('');
  };

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

              {singleScore !== null && (
                <div className={styles.resultsGrid}>
                  <div className={styles.resultCard}>
                    <div className={styles.scoreLabel}>シングルコア ({1} Worker)</div>
                    <div className={styles.scoreValue}>{singleScore.toLocaleString()}</div>
                    <div className={`${styles.rankBadge} ${getSingleCoreRankInfo(singleScore).className}`}>
                      {getSingleCoreRankInfo(singleScore).label}
                    </div>
                    <div className={styles.deviceImage}>
                      目安: <strong>{getSingleCoreRankInfo(singleScore).desc}</strong>
                    </div>
                  </div>

                  <div className={styles.resultCard}>
                    <div className={styles.scoreLabel}>マルチコア ({cores} Workers)</div>
                    {multiScore !== null ? (
                      <>
                        <div className={styles.scoreValue}>{multiScore.toLocaleString()}</div>
                        <div className={`${styles.rankBadge} ${getMultiCoreRankInfo(multiScore).className}`}>
                          {getMultiCoreRankInfo(multiScore).label}
                        </div>
                        <div className={styles.deviceImage}>
                          目安: <strong>{getMultiCoreRankInfo(multiScore).desc}</strong>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '2rem 0' }}>
                        <CircularProgress />
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-600)' }}>測定中...</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <table className={styles.referenceTable}>
              <thead>
                <tr>
                  <th>ランク</th>
                  <th>シングルコア目安</th>
                  <th>マルチコア目安</th>
                  <th>デバイスのイメージ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Rank S</strong></td>
                  <td>2000以上</td>
                  <td>8000以上</td>
                  <td>ハイエンドPC (M4 Proなど最新SoC)</td>
                </tr>
                <tr>
                  <td><strong>Rank A</strong></td>
                  <td>1000〜1999</td>
                  <td>4000〜7999</td>
                  <td>高性能ノートPC / 最新iPhone</td>
                </tr>
                <tr>
                  <td><strong>Rank B</strong></td>
                  <td>500〜999</td>
                  <td>1000〜3999</td>
                  <td>一般的なビジネスPC / ミドルレンジスマホ</td>
                </tr>
                <tr>
                  <td><strong>Rank C</strong></td>
                  <td>500未満</td>
                  <td>1000未満</td>
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
