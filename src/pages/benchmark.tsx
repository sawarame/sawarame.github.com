import React, { useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import MuiTheme from '@site/src/components/MuiTheme';
import SpeedIcon from '@mui/icons-material/Speed';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
  if (score >= 4000) return { rank: 'S', label: 'Rank S', desc: '比類なき速さ。最新のハイエンド端末の中でも最高峰の処理能力です', className: styles.rankS };
  if (score >= 2000) return { rank: 'A', label: 'Rank A', desc: '快適。大抵のWebアプリがストレスなく動作します', className: styles.rankA };
  if (score >= 1000) return { rank: 'B', label: 'Rank B', desc: '実用的。一般的なブラウジングには十分な性能です', className: styles.rankB };
  if (score >= 250) return { rank: 'C', label: 'Rank C', desc: '控えめ。複雑なページでは少し時間がかかるかもしれません', className: styles.rankC };
  if (score >= 100) return { rank: 'D', label: 'Rank D', desc: '低速。古い端末や省電力モードの影響が考えられます', className: styles.rankD };
  if (score >= 50) return { rank: 'E', label: 'Rank E', desc: '非常に低速。動作に支障が出る可能性があります', className: styles.rankE };
  return { rank: 'F', label: 'Rank F', desc: '動作困難。現代のWebサービスを利用するには大幅な性能不足です', className: styles.rankF };
}

function getMultiCoreRankInfo(score: number) {
  if (score >= 30000) return { rank: 'S', label: 'Rank S', desc: 'デスクトップ級。圧倒的な並列処理能力で、あらゆる重い作業を軽快にこなします', className: styles.rankS };
  if (score >= 10000) return { rank: 'A', label: 'Rank A', desc: '強力。複数のタスクを同時に開いても安定します', className: styles.rankA };
  if (score >= 4000) return { rank: 'B', label: 'Rank B', desc: '標準的。マルチタスクも問題なく行える性能です', className: styles.rankB };
  if (score >= 500) return { rank: 'C', label: 'Rank C', desc: '最小限。並列処理が増えると動作が鈍くなることがあります', className: styles.rankC };
  if (score >= 200) return { rank: 'D', label: 'Rank D', desc: '不足気味。並列処理には向かず、動作が制限されます', className: styles.rankD };
  if (score >= 100) return { rank: 'E', label: 'Rank E', desc: '著しく低い。並列処理の恩恵をほとんど受けられません', className: styles.rankE };
  return { rank: 'F', label: 'Rank F', desc: '極めて深刻。並列処理がほぼ機能せず、ブラウジングが困難な状態です', className: styles.rankF };
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
        url: "https://developer.mozilla.org/ja/docs/Web/Media/Guides/Formats/Image_types",
        must: true,
        check: () => {
          if (typeof window === 'undefined') return false;
          try {
            const canvas = document.createElement('canvas');
            if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) return true;
            if (typeof CSS !== 'undefined') {
              const supportsWebp = CSS.supports('background-image', 'image-set(url("check.webp") type("image/webp"))');
              const supportsAvif = CSS.supports('background-image', 'image-set(url("check.avif") type("image/avif"))');
              if (supportsWebp || supportsAvif) return true;
            }
            if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) return true;
          } catch (e) { return false; }
          return false;
        }, 
        desc: "次世代の超軽量画像。読み込み速度に直結します。" 
      },
      { 
        id: "av1", 
        name: "AV1 デコード",
        url: "https://developer.mozilla.org/ja/docs/Web/Media/Formats/Video_codecs#AV1", 
        must: true,
        check: () => {
          if (typeof document === 'undefined') return false;
          const v = document.createElement('video');
          return v.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== "";
        }, 
        desc: "YouTubeの4K動画などを低負荷・高画質で再生できます。" 
      },
      { 
        id: "web-share", 
        name: "Web Share API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Share_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && !!navigator.share,
        desc: "OS標準の共有メニューを呼び出し、画像やリンクを素早く共有できます。" 
      },
      { 
        id: "speculation-rules", 
        name: "Speculation Rules", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Speculation_Rules_API",
        must: false,
        check: () => typeof HTMLScriptElement !== 'undefined' && !!(HTMLScriptElement as any).supports && (HTMLScriptElement as any).supports('speculationrules'),
        desc: "リンクをクリックする前にページを予備ロードし、一瞬で画面遷移させます。" 
      },
      { 
        id: "fetchpriority", 
        name: "fetchpriority属性", 
        url: "https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Attributes/fetchpriority",
        must: true,
        check: () => typeof HTMLImageElement !== 'undefined' && 'fetchPriority' in HTMLImageElement.prototype, 
        desc: "重要な画像を優先して読み込み、表示速度を改善します。" 
      },
      { 
        id: "object-fit", 
        name: "Object-fit / Aspect-ratio", 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/aspect-ratio",
        must: true,
        check: () => typeof CSS !== 'undefined' && CSS.supports('aspect-ratio', '1/1'), 
        desc: "写真が変に伸びたり潰れたりせず、綺麗に枠に収まります。" 
      },
      { 
        id: "css-layer", 
        name: "CSS @layer", 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/At-rules/@layer",
        must: true,
        check: () => typeof window !== 'undefined' && 'CSSLayerBlockRule' in window, 
        desc: "大規模サイトのスタイルが意図通りに正しく適用されます。" 
      }
    ]
  },
  {
    category: "ビジネス・ツール",
    summary: "NotionやFigma等のアプリ級サイトが動くか",
    items: [
      { 
        id: "eyedropper", 
        name: "EyeDropper API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/EyeDropper_API",
        must: false,
        check: () => typeof window !== 'undefined' && 'EyeDropper' in window,
        desc: "画面上の任意の色を抽出できるスポイト機能。デザイン作業を効率化します。" 
      },
      { 
        id: "navigation-api", 
        name: "Navigation API", 
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API",
        must: false,
        check: () => typeof window !== 'undefined' && 'navigation' in window,
        desc: "SPAの画面遷移をより滑らかに、安定して制御できる次世代の基盤技術です。" 
      },
      { 
        id: "anchor-pos", 
        name: "Anchor Positioning API", 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/position-anchor",
        must: true,
        check: () => typeof CSS !== 'undefined' && CSS.supports('anchor-name', '--a'), 
        desc: "ポップアップがボタンに吸い付くように正しく表示されます。" 
      },
      { 
        id: "popover", 
        name: "Popover API",
        url: "https://developer.mozilla.org/ja/docs/Web/API/Popover_API",
        must: true,
        check: () => typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype, 
        desc: "メニューが他の要素に邪魔されず最前面に表示されます。" 
      },
      { 
        id: "compression", 
        name: "Compression Streams API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Compression_Streams_API",
        must: true,
        check: () => typeof window !== 'undefined' && 'CompressionStream' in window, 
        desc: "ブラウザ上でファイルを高速にZIP圧縮・解凍できます。" 
      },
      { 
        id: "crypto", 
        name: "Web Crypto API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Crypto_API",
        must: true,
        check: () => typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle, 
        desc: "セキュアな通信やパスワード管理・暗号化を可能にします。" 
      },
      { 
        id: "indexeddb-v3", 
        name: "IndexedDB (v3)", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API",
        must: true,
        check: () => typeof indexedDB !== 'undefined' && 'databases' in indexedDB, 
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
        url: "https://developer.mozilla.org/ja/docs/Web/API/WebGPU_API",
        must: true,
        check: () => typeof navigator !== 'undefined' && 'gpu' in navigator, 
        desc: "本格的な3DゲームやAI画像生成がブラウザで動きます。" 
      },
      { 
        id: "webxr", 
        name: "WebXR Device API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/WebXR_Device_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && 'xr' in navigator,
        desc: "ブラウザからVR（仮想現実）やAR（拡張現実）デバイスを直接操作できます。" 
      },
      { 
        id: "view-transitions", 
        name: "View Transitions API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/View_Transition_API",
        must: true,
        check: () => typeof document !== 'undefined' && !!document.startViewTransition, 
        desc: "画面遷移がアプリのように滑らかにフェードします。" 
      },
      { 
        id: "scroll-animations", 
        name: "Scroll-driven Animations", 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/animation-timeline",
        must: true,
        check: () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'scroll()'), 
        desc: "スクロールに連動するリッチな演出に対応しています。" 
      },
      { 
        id: "offscreen-canvas", 
        name: "Offscreen Canvas", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/OffscreenCanvas",
        must: true,
        check: () => typeof window !== 'undefined' && 'OffscreenCanvas' in window, 
        desc: "重いグラフィック処理を裏側で回し、動作を軽くします。" 
      },
      { 
        id: "spatial-audio", 
        name: "Web Audio (Spatial Audio)", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API",
        must: true,
        check: () => {
          if (typeof window === 'undefined') return false;
          const Panner = window.PannerNode || (window as any).AudioPannerNode;
          return !!Panner && 'panningModel' in Panner.prototype;
        }, 
        desc: "ブラウザでの立体音響に対応しています。" 
      }
    ]
  },
  {
    category: "システム・その他",
    summary: "アプリ化、通知、ログインの快適さ",
    items: [
      { 
        id: "passkeys", 
        name: "WebAuthn (Passkeys)", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Authentication_API",
        must: true,
        check: () => typeof window !== 'undefined' && !!window.PublicKeyCredential, 
        desc: "指紋や顔認証で、パスワードなしでログインできます。" 
      },
      { 
        id: "badging", 
        name: "Badging API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Badging_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && 'setAppBadge' in navigator, 
        desc: "アプリアイコンに未読数を表示できます。" 
      },
      { 
        id: "wake-lock", 
        name: "Screen Wake Lock API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Screen_Wake_Lock_API",
        must: true,
        check: () => typeof navigator !== 'undefined' && 'wakeLock' in navigator, 
        desc: "閲覧中に画面が勝手に消えないように制御できます。" 
      },
      { 
        id: "web-usb", 
        name: "Web USB", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/WebUSB_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && 'usb' in navigator,
        desc: "USB接続された専用デバイスを、ブラウザから直接制御できます。" 
      },
      { 
        id: "file-system", 
        name: "File System Access API", 
        url: "https://developer.mozilla.org/ja/docs/Web/API/File_System_API",
        must: false,
        check: () => typeof window !== 'undefined' && 'showOpenFilePicker' in window, 
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

const rankReferenceData = [
  { rank: 'Rank S', single: '4000以上', multi: '30000以上', desc: '比類なき速さ。ハイエンドを凌駕する最高峰の性能', className: styles.rankS },
  { rank: 'Rank A', single: '2000〜3999', multi: '10000〜29999', desc: '非常に快適。大抵のアプリが極めてスムーズに動作', className: styles.rankA },
  { rank: 'Rank B', single: '1000〜1999', multi: '4000〜9999', desc: '快適。一般的な利用には全く支障のない性能', className: styles.rankB },
  { rank: 'Rank C', single: '250〜999', multi: '500〜3999', desc: '実用的。標準的なブラウジングに十分な性能', className: styles.rankC },
  { rank: 'Rank D', single: '100〜249', multi: '200〜499', desc: '控えめ。負荷により動作が鈍くなる可能性', className: styles.rankD },
  { rank: 'Rank E', single: '50〜99', multi: '100〜199', desc: '低速。古い端末や省電力モードの可能性', className: styles.rankE },
  { rank: 'Rank F', single: '50未満', multi: '100未満', desc: '動作困難。現代のWeb標準に対し大幅な性能不足', className: styles.rankF },
];

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
    setCores(navigator.hardwareConcurrency || 4);
  }, []);

  const handleStart = async () => {
    setIsMeasuring(true);
    setSingleScore(null);
    setMultiScore(null);
    setFeatureResults({}); // 状態をリセット
    setProgressMsg('準備中...');

    await sleep(100);

    // 1. シングルコア測定
    setProgressMsg('シングルコア測定準備中...');
    const sScore = await runSingleCoreBenchmark(5, setProgressMsg);
    setSingleScore(sScore);

    // 測定の間に少し間を置く
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

                <div className={styles.modalLinkWrap}>
                  <Button
                    startIcon={<InfoOutlinedIcon />}
                    onClick={() => setIsModalOpen(true)}
                    className={styles.modalLink}
                  >
                    スコアの目安について
                  </Button>
                </div>
            </div>

            <div className={styles.featureSection}>
              <h2 className={styles.sectionTitle}>ブラウザ機能サポート状況</h2>
              <div className={styles.categoryGrid}>
                {benchmarkData.map((cat, idx) => {
                  const items = cat.items;
                  const passedItems = items.filter(item => featureResults[item.id] === true);
                  const mustItems = items.filter(item => item.must);
                  const passedMustItems = mustItems.filter(item => featureResults[item.id] === true);
                  
                  const isComplete = passedItems.length === items.length;
                  const isOK = !isComplete && passedMustItems.length === mustItems.length;
                  
                  const isOpen = openCategory === idx;
                  const passCount = passedItems.length;
                  const totalCount = items.length;

                  return (
                    <div 
                      key={cat.category} 
                      className={`
                        ${styles.categoryCard} 
                        ${isComplete ? styles.completeCategory : ''} 
                        ${isOK ? styles.okCategory : ''} 
                        ${isOpen ? styles.categoryCardOpen : ''}
                      `}
                      onClick={() => setOpenCategory(isOpen ? null : idx)}
                    >
                      <div className={styles.categoryHeader}>
                        <h3 className={styles.categoryTitle}>{cat.category}</h3>
                        <div className={styles.categoryScore}>
                          {passCount} / {totalCount}
                        </div>
                      </div>
                      <div className={styles.categorySummary}>{cat.summary}</div>
                      
                      <div className={`${styles.featureList} ${isOpen ? styles.featureListOpen : ''}`}>
                        {cat.items.map(item => (
                          <div 
                            key={item.id} 
                            className={`${styles.featureItem} ${item.url ? styles.featureItemClickable : ''}`}
                            onClick={(e) => {
                              if (item.url) {
                                e.stopPropagation();
                                window.open(item.url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <div className={styles.checkStatus}>
                              {featureResults[item.id] === undefined ? '-' : featureResults[item.id] ? '✅' : '❌'}
                            </div>
                            <div className={styles.featureContent}>
                              <div className={styles.featureNameWrap}>
                                <span className={styles.featureName}>
                                  {item.name}
                                  {item.must && <span className={styles.mustTag}>必須</span>}
                                </span>
                                {item.url && <span className={styles.externalIcon}>↗</span>}
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

            <Dialog
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                style: { borderRadius: '16px', padding: '8px' }
              }}
            >
              <DialogTitle>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>スコアの判定基準</strong>
                  <IconButton onClick={() => setIsModalOpen(false)} size="small">
                    <CloseIcon />
                  </IconButton>
                </div>
              </DialogTitle>
              <DialogContent dividers>
                <div className={styles.rankReferenceList}>
                  {rankReferenceData.map((item) => (
                    <div key={item.rank} className={styles.rankReferenceItem}>
                      <div className={styles.rankReferenceHeader}>
                        <span className={`${styles.rankReferenceBadge} ${item.className}`}>
                          {item.rank}
                        </span>
                        <div className={styles.rankReferenceScores}>
                          <div className={styles.rankScoreDetail}>
                            <span>シングル:</span> <strong>{item.single}</strong>
                          </div>
                          <div className={styles.rankScoreDetail}>
                            <span>マルチ:</span> <strong>{item.multi}</strong>
                          </div>
                        </div>
                      </div>
                      <p className={styles.rankReferenceDesc}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsModalOpen(false)} color="primary">
                  閉じる
                </Button>
              </DialogActions>
            </Dialog>

          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
