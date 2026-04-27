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
  const multiScore = Math.floor((500_000 * cores * passes) / totalTime);
  return multiScore;
}

function getSingleCoreRankInfo(score: number) {
  if (score >= 2000) return { rank: 'S', label: 'Rank S', desc: '非常に快適。最新のハイエンドデバイス並の速度です', className: styles.rankS };
  if (score >= 1000) return { rank: 'A', label: 'Rank A', desc: '快適。大抵のWebアプリがストレスなく動作します', className: styles.rankA };
  if (score >= 250) return { rank: 'B', label: 'Rank B', desc: '実用的。一般的なブラウジングには十分な性能です', className: styles.rankB };
  if (score >= 100) return { rank: 'C', label: 'Rank C', desc: '控えめ。複雑なページでは少し時間がかかるかもしれません', className: styles.rankC };
  if (score >= 50) return { rank: 'D', label: 'Rank D', desc: '低速。古い端末や省電力モードの影響が考えられます', className: styles.rankD };
  return { rank: 'E', label: 'Rank E', desc: '非常に低速。動作に支障が出る可能性があります', className: styles.rankE };
}

function getMultiCoreRankInfo(score: number) {
  if (score >= 8000) return { rank: 'S', label: 'Rank S', desc: '極めて強力。重い並列処理もスムーズにこなせます', className: styles.rankS };
  if (score >= 4000) return { rank: 'A', label: 'Rank A', desc: '強力。複数のタスクを同時に開いても安定します', className: styles.rankA };
  if (score >= 500) return { rank: 'B', label: 'Rank B', desc: '標準的。マルチタスクも問題なく行える性能です', className: styles.rankB };
  if (score >= 200) return { rank: 'C', label: 'Rank C', desc: '最小限。並列処理が増えると動作が鈍くなることがあります', className: styles.rankC };
  if (score >= 100) return { rank: 'D', label: 'Rank D', desc: '不足気味。並列処理には向かず、動作が制限されます', className: styles.rankD };
  return { rank: 'E', label: 'Rank E', desc: '著しく低い。並列処理の恩恵をほとんど受けられません', className: styles.rankE };
}

// ============================================================
// Feature Check Logic
// ============================================================

const benchmarkData = [
  {
    category: "SNS・メディア閲覧",
    summary: "動画や画像がサクサク、綺麗に見えるか",
    items: [
      { 
        id: "avif-webp", 
        name: "AVIF / WebP 対応", 
        check: () => {
          if (typeof window === 'undefined') return false;
          try {
            // 1. Canvasを使ったエンコード判定 (WebP)
            const canvas = document.createElement('canvas');
            if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
              return true;
            }
            // 2. CSS.supportsを使った判定 (image-set type指定)
            if (typeof CSS !== 'undefined') {
              const supportsWebp = CSS.supports('background-image', 'image-set(url("check.webp") type("image/webp"))');
              const supportsAvif = CSS.supports('background-image', 'image-set(url("check.avif") type("image/avif"))');
              if (supportsWebp || supportsAvif) return true;
            }
            // 3. Canvasを使った判定 (AVIF)
            if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
              return true;
            }
          } catch (e) {
            return false;
          }
          return false;
        }, 
        desc: "次世代の超軽量画像。読み込み速度に直結します。" 
      },
      { 
        id: "av1", 
        name: "AV1 デコード", 
        check: () => {
          if (typeof document === 'undefined') return false;
          // video要素のcanPlayTypeでAV1コーデックの再生可否を確認
          const v = document.createElement('video');
          return v.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== "";
        }, 
        desc: "YouTubeの4K動画などを低負荷・高画質で再生できます。" 
      },
      { 
        id: "priority-hints", 
        name: "Priority Hints", 
        check: () => {
          // HTMLImageElementにfetchPriorityプロパティが存在するか確認
          return typeof HTMLImageElement !== 'undefined' && 'fetchPriority' in HTMLImageElement.prototype;
        }, 
        desc: "重要な画像を優先して読み込み、表示速度を改善します。" 
      },
      { 
        id: "object-fit", 
        name: "Object-fit / Aspect-ratio", 
        check: () => {
          // CSS.supportsでaspect-ratioプロパティのサポートを確認
          return typeof CSS !== 'undefined' && CSS.supports('aspect-ratio', '1/1');
        }, 
        desc: "写真が変に伸びたり潰れたりせず、綺麗に枠に収まります。" 
      },
      { 
        id: "css-layer", 
        name: "CSS @layer", 
        check: () => {
          // CSSLayerBlockRuleインターフェースの存在を確認
          return typeof window !== 'undefined' && 'CSSLayerBlockRule' in window;
        }, 
        desc: "大規模サイトのスタイルが意図通りに正しく適用されます。" 
      }
    ]
  },
  {
    category: "ビジネス・ツール",
    summary: "NotionやFigma等のアプリ級サイトが動くか",
    items: [
      { 
        id: "anchor-pos", 
        name: "Anchor Positioning API", 
        check: () => {
          // CSS.supportsでアンカーポジショニングのプロパティを確認
          return typeof CSS !== 'undefined' && CSS.supports('anchor-name', '--a');
        }, 
        desc: "ポップアップがボタンに吸い付くように正しく表示されます。" 
      },
      { 
        id: "popover", 
        name: "Popover API", 
        check: () => {
          // HTMLElementにshowPopoverメソッドが存在するか確認
          return typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
        }, 
        desc: "メニューが他の要素に邪魔されず最前面に表示されます。" 
      },
      { 
        id: "compression", 
        name: "Compression Streams API", 
        check: () => {
          // CompressionStreamインターフェースの存在を確認
          return typeof window !== 'undefined' && 'CompressionStream' in window;
        }, 
        desc: "ブラウザ上でファイルを高速にZIP圧縮・解凍できます。" 
      },
      { 
        id: "crypto", 
        name: "Web Crypto API", 
        check: () => {
          // window.cryptoおよびSubtleCryptoの存在を確認
          return typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle;
        }, 
        desc: "セキュアな通信やパスワード管理・暗号化を可能にします。" 
      },
      { 
        id: "indexeddb-v3", 
        name: "IndexedDB (v3)", 
        check: () => {
          // indexedDB.databasesメソッドの存在を確認
          return typeof indexedDB !== 'undefined' && 'databases' in indexedDB;
        }, 
        desc: "大容量データを保存し、オフラインでも作業を継続できます。" 
      }
    ]
  },
  {
    category: "エンタメ・クリエイティブ",
    summary: "3D、アニメーション、ゲームが快適か",
    items: [
      { 
        id: "webgpu", 
        name: "WebGPU", 
        check: () => {
          // navigator.gpuプロパティの存在を確認
          return typeof navigator !== 'undefined' && 'gpu' in navigator;
        }, 
        desc: "本格的な3DゲームやAI画像生成がブラウザで動きます。" 
      },
      { 
        id: "view-transitions", 
        name: "View Transitions API", 
        check: () => {
          // document.startViewTransitionメソッドの存在を確認
          return typeof document !== 'undefined' && !!document.startViewTransition;
        }, 
        desc: "画面遷移がアプリのように滑らかにフェードします。" 
      },
      { 
        id: "scroll-animations", 
        name: "Scroll-driven Animations", 
        check: () => {
          // CSS.supportsでスクロール駆動アニメーションのサポートを確認
          return typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'scroll()');
        }, 
        desc: "スクロールに連動するリッチな演出に対応しています。" 
      },
      { 
        id: "offscreen-canvas", 
        name: "Offscreen Canvas", 
        check: () => {
          // OffscreenCanvasインターフェースの存在を確認
          return typeof window !== 'undefined' && 'OffscreenCanvas' in window;
        }, 
        desc: "重いグラフィック処理を裏側で回し、動作を軽くします。" 
      },
      { 
        id: "spatial-audio", 
        name: "Web Audio (Spatial Audio)", 
        check: () => {
          if (typeof window === 'undefined') return false;
          // PannerNodeまたはAudioPannerNodeのインターフェースを確認
          const Panner = window.PannerNode || (window as any).AudioPannerNode;
          return !!Panner && 'panningModel' in Panner.prototype;
        }, 
        desc: "ブラウザでの立体音響に対応しています。" 
      }
    ]
  },
  {
    category: "システム・セキュリティ",
    summary: "アプリ化、通知、ログインの快適さ",
    items: [
      { 
        id: "passkeys", 
        name: "WebAuthn (Passkeys)", 
        check: () => {
          // PublicKeyCredentialインターフェースの存在を確認
          return typeof window !== 'undefined' && !!window.PublicKeyCredential;
        }, 
        desc: "指紋や顔認証で、パスワードなしでログインできます。" 
      },
      { 
        id: "badging", 
        name: "Badging API", 
        check: () => {
          // navigator.setAppBadgeメソッドの存在を確認
          return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
        }, 
        desc: "アプリアイコンに未読数を表示できます。" 
      },
      { 
        id: "wake-lock", 
        name: "Screen Wake Lock API", 
        check: () => {
          // navigator.wakeLockプロパティの存在を確認
          return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
        }, 
        desc: "閲覧中に画面が勝手に消えないように制御できます。" 
      },
      { 
        id: "file-system", 
        name: "File System Access API", 
        check: () => {
          // showOpenFilePickerメソッドの存在を確認
          return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
        }, 
        desc: "端末内のファイルを直接編集・保存できます。" 
      }
    ]
  }
];

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

  // Feature results state
  const [featureResults, setFeatureResults] = useState<Record<string, boolean | null>>({});
  const [openCategory, setOpenCategory] = useState<number | null>(null);

  React.useEffect(() => {
    setCores(navigator.hardwareConcurrency || 4);
  }, []);

  const handleStart = async () => {
    setIsMeasuring(true);
    setSingleScore(null);
    setMultiScore(null);
    setFeatureResults({}); // Reset feature checks
    setProgressMsg('準備中...');

    await sleep(100);

    // 1. シングルコア測定
    setProgressMsg('シングルコア測定準備中...');
    const sScore = await runSingleCoreBenchmark(5, setProgressMsg);
    setSingleScore(sScore);

    // マルチ測定との間に少し間を置く
    setProgressMsg('マルチコア測定準備中...');
    await sleep(800);

    // 2. マルチコア測定
    const mScore = await runMultiCoreBenchmark(cores, 5, setProgressMsg);
    setMultiScore(mScore);

    // 3. ブラウザ機能チェック (最後に実行)
    setProgressMsg('機能サポート状況を判定中...');
    for (const cat of benchmarkData) {
      for (const item of cat.items) {
        const result = await item.check();
        setFeatureResults(prev => ({ ...prev, [item.id]: result }));
        await sleep(30);
      }
    }

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
                「測定開始」ボタンをクリックすると、ブラウザ上で負荷の高い演算処理を実行し、その処理速度からスコアを算出します。
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

                <div className={styles.resultsGrid}>
                  <div className={styles.resultCard}>
                    <div className={styles.scoreLabel}>シングルコア (1 Worker)</div>
                    {singleScore !== null ? (
                      <>
                        <div className={styles.scoreValue}>{singleScore.toLocaleString()}</div>
                        <div className={`${styles.rankBadge} ${getSingleCoreRankInfo(singleScore).className}`}>
                          {getSingleCoreRankInfo(singleScore).label}
                        </div>
                        <div className={styles.deviceImage}>
                          目安: <strong>{getSingleCoreRankInfo(singleScore).desc}</strong>
                        </div>
                      </>
                    ) : (isMeasuring && !progressMsg.includes('機能サポート')) ? (
                      <div style={{ padding: '2rem 0' }}>
                        <CircularProgress />
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-600)' }}>測定中...</div>
                      </div>
                    ) : (
                      <div style={{ padding: '2.4rem 0' }}>
                        <div className={styles.scoreValue} style={{ opacity: 0.2 }}>-</div>
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-500)' }}>未実施</div>
                      </div>
                    )}
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
                    ) : (isMeasuring && singleScore !== null && !progressMsg.includes('機能サポート')) ? (
                      <div style={{ padding: '2rem 0' }}>
                        <CircularProgress />
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-600)' }}>測定中...</div>
                      </div>
                    ) : (
                      <div style={{ padding: '2.4rem 0' }}>
                        <div className={styles.scoreValue} style={{ opacity: 0.2 }}>-</div>
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-500)' }}>未実施</div>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            <div className={styles.featureSection}>
              <h2 className={styles.sectionTitle}>ブラウザ機能サポート状況</h2>
              <div className={styles.categoryGrid}>
                {benchmarkData.map((cat, idx) => {
                  const passCount = cat.items.filter(item => featureResults[item.id] === true).length;
                  const totalCount = cat.items.length;
                  const isActive = passCount === totalCount;
                  const isOpen = openCategory === idx;

                  return (
                    <div 
                      key={cat.category} 
                      className={`${styles.categoryCard} ${isActive ? styles.activeCategory : ''} ${isOpen ? styles.categoryCardOpen : ''}`}
                      onClick={() => setOpenCategory(isOpen ? null : idx)}
                    >
                      <div className={styles.categoryHeader}>
                        <h3 className={styles.categoryTitle}>{cat.category}</h3>
                        <div className={styles.categoryScore}>{passCount} / {totalCount}</div>
                      </div>
                      <div className={styles.categorySummary}>{cat.summary}</div>
                      
                      <div className={`${styles.featureList} ${isOpen ? styles.featureListOpen : ''}`}>
                        {cat.items.map(item => (
                          <div key={item.id} className={styles.featureItem}>
                            <div className={styles.checkStatus}>
                              {featureResults[item.id] === undefined ? '-' : featureResults[item.id] ? '✅' : '❌'}
                            </div>
                            <div className={styles.featureContent}>
                              <div className={styles.featureNameWrap}>
                                <span className={styles.featureName}>{item.name}</span>
                              </div>
                              <div className={styles.featureDesc}>{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <td>非常に快適。ハイエンドデバイス並の性能</td>
                </tr>
                <tr>
                  <td><strong>Rank A</strong></td>
                  <td>1000〜1999</td>
                  <td>4000〜7999</td>
                  <td>快適。大抵のアプリがスムーズに動作</td>
                </tr>
                <tr>
                  <td><strong>Rank B</strong></td>
                  <td>250〜999</td>
                  <td>500〜3999</td>
                  <td>実用的。一般的な利用には十分な性能</td>
                </tr>
                <tr>
                  <td><strong>Rank C</strong></td>
                  <td>100〜249</td>
                  <td>200〜499</td>
                  <td>控えめ。負荷により動作が鈍くなる可能性</td>
                </tr>
                <tr>
                  <td><strong>Rank D</strong></td>
                  <td>50〜99</td>
                  <td>100〜199</td>
                  <td>低速。古い端末や省電力モードの可能性</td>
                </tr>
                <tr>
                  <td><strong>Rank E</strong></td>
                  <td>50未満</td>
                  <td>100未満</td>
                  <td>非常に低速。動作に支障が出るレベル</td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
