import React, { useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import { Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip } from '@mui/material';
import MuiTheme from '@site/src/components/MuiTheme';
import SpeedIcon from '@mui/icons-material/Speed';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import XIcon from '@mui/icons-material/X';
import ShareIcon from '@mui/icons-material/Share';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/benchmark.module.css';

const BENCHMARK_VERSION = '1.0.0';

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
      onProgress(`${translate({ id: 'benchmark.progress.single', message: 'シングルコア測定中...' })} (${completedPasses}/${passes} ${translate({ id: 'benchmark.progress.pass', message: '回目' })})`);
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
        onProgress(`${translate({ id: 'benchmark.progress.multi', message: 'マルチコア測定中...' })} (${Math.floor((completedPasses / totalPasses) * 100)}%)`);
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
  if (score >= 4000) return { rank: 'S', label: 'Rank S', desc: translate({ id: 'benchmark.single.rank.s', message: '比類なき速さ。最新のハイエンド端末の中でも最高峰の処理能力です' }), className: styles.rankS };
  if (score >= 2000) return { rank: 'A', label: 'Rank A', desc: translate({ id: 'benchmark.single.rank.a', message: '快適。大抵のWebアプリがストレスなく動作します' }), className: styles.rankA };
  if (score >= 1000) return { rank: 'B', label: 'Rank B', desc: translate({ id: 'benchmark.single.rank.b', message: '実用的。一般的なブラウジングには十分な性能です' }), className: styles.rankB };
  if (score >= 250) return { rank: 'C', label: 'Rank C', desc: translate({ id: 'benchmark.single.rank.c', message: '標準的。一般的なページを閲覧するのに十分な性能です' }), className: styles.rankC };
  if (score >= 100) return { rank: 'D', label: 'Rank D', desc: translate({ id: 'benchmark.single.rank.d', message: '基本性能。複雑なページでは少し時間がかかるかもしれません' }), className: styles.rankD };
  if (score >= 50) return { rank: 'E', label: 'Rank E', desc: translate({ id: 'benchmark.single.rank.e', message: '低速。古い端末や省電力モードの影響が考えられます' }), className: styles.rankE };
  return { rank: 'F', label: 'Rank F', desc: translate({ id: 'benchmark.single.rank.f', message: '動作困難。現代のWebサービスを利用するには大幅な性能不足です' }), className: styles.rankF };
}

function getMultiCoreRankInfo(score: number) {
  if (score >= 30000) return { rank: 'S', label: 'Rank S', desc: translate({ id: 'benchmark.multi.rank.s', message: '最上級。圧倒的な並列処理能力で、あらゆる重い作業を軽快にこなします' }), className: styles.rankS };
  if (score >= 10000) return { rank: 'A', label: 'Rank A', desc: translate({ id: 'benchmark.multi.rank.a', message: '強力。複数のタスクを同時に開いても安定します' }), className: styles.rankA };
  if (score >= 4000) return { rank: 'B', label: 'Rank B', desc: translate({ id: 'benchmark.multi.rank.b', message: '快適。複数のタスクを並行しても余裕のある性能です' }), className: styles.rankB };
  if (score >= 500) return { rank: 'C', label: 'Rank C', desc: translate({ id: 'benchmark.multi.rank.c', message: '標準的。マルチタスクも問題なく行える性能です' }), className: styles.rankC };
  if (score >= 200) return { rank: 'D', label: 'Rank D', desc: translate({ id: 'benchmark.multi.rank.d', message: '最小限。並列処理が増えると動作が鈍くなることがあります' }), className: styles.rankD };
  if (score >= 100) return { rank: 'E', label: 'Rank E', desc: translate({ id: 'benchmark.multi.rank.e', message: '性能不足。並列処理には向かず、動作が制限されます' }), className: styles.rankE };
  return { rank: 'F', label: 'Rank F', desc: translate({ id: 'benchmark.multi.rank.f', message: '著しく性能不足。並列処理の恩恵をほとんど受けられません' }), className: styles.rankF };
}


// ============================================================
// Feature Check Logic
// ============================================================

const benchmarkData = [
  {
    category: translate({ id: "benchmark.cat.sns.category", message: "SNS・メディア閲覧" }),
    summary: translate({ id: "benchmark.cat.sns.summary", message: "動画や画像がサクサク、綺麗に見えるか" }),
    items: [
      { 
        id: "avif-webp", 
        name: translate({ id: "benchmark.cat.sns.avif.name", message: "AVIF / WebP 対応" }), 
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
        desc: translate({ id: "benchmark.cat.sns.avif.desc", message: "次世代の超軽量画像。読み込み速度に直結します。" }) 
      },
      { 
        id: "av1", 
        name: translate({ id: "benchmark.cat.sns.av1.name", message: "AV1 デコード" }),
        url: "https://developer.mozilla.org/ja/docs/Web/Media/Formats/Video_codecs#AV1", 
        must: true,
        check: () => {
          if (typeof document === 'undefined') return false;
          const v = document.createElement('video');
          return v.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== "";
        }, 
        desc: translate({ id: "benchmark.cat.sns.av1.desc", message: "YouTubeの4K動画などを低負荷・高画質で再生できます。" }) 
      },
      { 
        id: "web-share", 
        name: translate({ id: "benchmark.cat.sns.webshare.name", message: "Web Share API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Share_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && !!navigator.share,
        desc: translate({ id: "benchmark.cat.sns.webshare.desc", message: "OS標準の共有メニューを呼び出し、画像やリンクを素早く共有できます。" }) 
      },
      { 
        id: "speculation-rules", 
        name: translate({ id: "benchmark.cat.sns.speculation.name", message: "Speculation Rules" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Speculation_Rules_API",
        must: false,
        check: () => typeof HTMLScriptElement !== 'undefined' && !!(HTMLScriptElement as any).supports && (HTMLScriptElement as any).supports('speculationrules'),
        desc: translate({ id: "benchmark.cat.sns.speculation.desc", message: "リンクをクリックする前にページを予備ロードし、一瞬で画面遷移させます。" }) 
      },
      { 
        id: "fetchpriority", 
        name: translate({ id: "benchmark.cat.sns.fetchpriority.name", message: "fetchpriority属性" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/HTML/Reference/Attributes/fetchpriority",
        must: true,
        check: () => typeof HTMLImageElement !== 'undefined' && 'fetchPriority' in HTMLImageElement.prototype, 
        desc: translate({ id: "benchmark.cat.sns.fetchpriority.desc", message: "重要な画像を優先して読み込み、表示速度を改善します。" }) 
      },
      { 
        id: "object-fit", 
        name: translate({ id: "benchmark.cat.sns.objectfit.name", message: "Object-fit / Aspect-ratio" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/aspect-ratio",
        must: true,
        check: () => typeof CSS !== 'undefined' && CSS.supports('aspect-ratio', '1/1'), 
        desc: translate({ id: "benchmark.cat.sns.objectfit.desc", message: "写真が変に伸びたり潰れたりせず、綺麗に枠に収まります。" }) 
      },
      { 
        id: "css-layer", 
        name: translate({ id: "benchmark.cat.sns.csslayer.name", message: "CSS @layer" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/At-rules/@layer",
        must: true,
        check: () => typeof window !== 'undefined' && 'CSSLayerBlockRule' in window, 
        desc: translate({ id: "benchmark.cat.sns.csslayer.desc", message: "大規模サイトのスタイルが意図通りに正しく適用されます。" }) 
      }
    ]
  },
  {
    category: translate({ id: "benchmark.cat.biz.category", message: "ビジネス・ツール" }),
    summary: translate({ id: "benchmark.cat.biz.summary", message: "NotionやFigma等のアプリ級サイトが動くか" }),
    items: [
      { 
        id: "eyedropper", 
        name: translate({ id: "benchmark.cat.biz.eyedropper.name", message: "EyeDropper API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/EyeDropper_API",
        must: false,
        check: () => typeof window !== 'undefined' && 'EyeDropper' in window,
        desc: translate({ id: "benchmark.cat.biz.eyedropper.desc", message: "画面上の任意の色を抽出できるスポイト機能。デザイン作業を効率化します。" }) 
      },
      { 
        id: "navigation-api", 
        name: translate({ id: "benchmark.cat.biz.navigation.name", message: "Navigation API" }), 
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API",
        must: false,
        check: () => typeof window !== 'undefined' && 'navigation' in window,
        desc: translate({ id: "benchmark.cat.biz.navigation.desc", message: "SPAの画面遷移をより滑らかに、安定して制御できる次世代の基盤技術です。" }) 
      },
      { 
        id: "anchor-pos", 
        name: translate({ id: "benchmark.cat.biz.anchorpos.name", message: "Anchor Positioning API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/position-anchor",
        must: true,
        check: () => typeof CSS !== 'undefined' && CSS.supports('anchor-name', '--a'), 
        desc: translate({ id: "benchmark.cat.biz.anchorpos.desc", message: "ポップアップがボタンに吸い付くように正しく表示されます。" }) 
      },
      { 
        id: "popover", 
        name: translate({ id: "benchmark.cat.biz.popover.name", message: "Popover API" }),
        url: "https://developer.mozilla.org/ja/docs/Web/API/Popover_API",
        must: true,
        check: () => typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype, 
        desc: translate({ id: "benchmark.cat.biz.popover.desc", message: "メニューが他の要素に邪魔されず最前面に表示されます。" }) 
      },
      { 
        id: "compression", 
        name: translate({ id: "benchmark.cat.biz.compression.name", message: "Compression Streams API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Compression_Streams_API",
        must: true,
        check: () => typeof window !== 'undefined' && 'CompressionStream' in window, 
        desc: translate({ id: "benchmark.cat.biz.compression.desc", message: "ブラウザ上でファイルを高速にZIP圧縮・解凍できます。" }) 
      },
      { 
        id: "crypto", 
        name: translate({ id: "benchmark.cat.biz.crypto.name", message: "Web Crypto API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Crypto_API",
        must: true,
        check: () => typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle, 
        desc: translate({ id: "benchmark.cat.biz.crypto.desc", message: "セキュアな通信やパスワード管理・暗号化を可能にします。" }) 
      },
      { 
        id: "indexeddb-v3", 
        name: translate({ id: "benchmark.cat.biz.indexeddb.name", message: "IndexedDB (v3)" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API",
        must: true,
        check: () => typeof indexedDB !== 'undefined' && 'databases' in indexedDB, 
        desc: translate({ id: "benchmark.cat.biz.indexeddb.desc", message: "大容量データを保存し、オフラインでも作業を継続できます。" }) 
      }
    ]
  },
  {
    category: translate({ id: "benchmark.cat.creative.category", message: "エンタメ・クリエイティブ" }),
    summary: translate({ id: "benchmark.cat.creative.summary", message: "3D、アニメーション、ゲームが快適か" }),
    items: [
      { 
        id: "webgpu", 
        name: translate({ id: "benchmark.cat.creative.webgpu.name", message: "WebGPU" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/WebGPU_API",
        must: true,
        check: () => typeof navigator !== 'undefined' && 'gpu' in navigator, 
        desc: translate({ id: "benchmark.cat.creative.webgpu.desc", message: "本格的な3DゲームやAI画像生成がブラウザで動きます。" }) 
      },
      { 
        id: "webxr", 
        name: translate({ id: "benchmark.cat.creative.webxr.name", message: "WebXR Device API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/WebXR_Device_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && 'xr' in navigator,
        desc: translate({ id: "benchmark.cat.creative.webxr.desc", message: "ブラウザからVR（仮想現実）やAR（拡張現実）デバイスを直接操作できます。" }) 
      },
      { 
        id: "view-transitions", 
        name: translate({ id: "benchmark.cat.creative.viewtransitions.name", message: "View Transitions API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/View_Transition_API",
        must: true,
        check: () => typeof document !== 'undefined' && !!(document as any).startViewTransition, 
        desc: translate({ id: "benchmark.cat.creative.viewtransitions.desc", message: "画面遷移がアプリのように滑らかにフェードします。" }) 
      },
      { 
        id: "scroll-animations", 
        name: translate({ id: "benchmark.cat.creative.scrollanimations.name", message: "Scroll-driven Animations" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Properties/animation-timeline",
        must: true,
        check: () => typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'scroll()'), 
        desc: translate({ id: "benchmark.cat.creative.scrollanimations.desc", message: "スクロールに連動するリッチな演出に対応しています。" }) 
      },
      { 
        id: "offscreen-canvas", 
        name: translate({ id: "benchmark.cat.creative.offscreencanvas.name", message: "Offscreen Canvas" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/OffscreenCanvas",
        must: true,
        check: () => typeof window !== 'undefined' && 'OffscreenCanvas' in window, 
        desc: translate({ id: "benchmark.cat.creative.offscreencanvas.desc", message: "重いグラフィック処理を裏側で回し、動作を軽くします。" }) 
      },
      { 
        id: "spatial-audio", 
        name: translate({ id: "benchmark.cat.creative.spatialaudio.name", message: "Web Audio (Spatial Audio)" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API",
        must: true,
        check: () => {
          if (typeof window === 'undefined') return false;
          const Panner = window.PannerNode || (window as any).AudioPannerNode;
          return !!Panner && 'panningModel' in Panner.prototype;
        }, 
        desc: translate({ id: "benchmark.cat.creative.spatialaudio.desc", message: "ブラウザでの立体音響に対応しています。" }) 
      }
    ]
  },
  {
    category: translate({ id: "benchmark.cat.sys.category", message: "システム・その他" }),
    summary: translate({ id: "benchmark.cat.sys.summary", message: "アプリ化、通知、ログインの快適さ" }),
    items: [
      { 
        id: "passkeys", 
        name: translate({ id: "benchmark.cat.sys.passkeys.name", message: "WebAuthn (Passkeys)" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Web_Authentication_API",
        must: true,
        check: () => typeof window !== 'undefined' && !!window.PublicKeyCredential, 
        desc: translate({ id: "benchmark.cat.sys.passkeys.desc", message: "指紋や顔認証で、パスワードなしでログインできます。" }) 
      },
      { 
        id: "badging", 
        name: translate({ id: "benchmark.cat.sys.badging.name", message: "Badging API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Badging_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && 'setAppBadge' in navigator, 
        desc: translate({ id: "benchmark.cat.sys.badging.desc", message: "アプリアイコンに未読数を表示できます。" }) 
      },
      { 
        id: "wake-lock", 
        name: translate({ id: "benchmark.cat.sys.wakelock.name", message: "Screen Wake Lock API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/Screen_Wake_Lock_API",
        must: true,
        check: () => typeof navigator !== 'undefined' && 'wakeLock' in navigator, 
        desc: translate({ id: "benchmark.cat.sys.wakelock.desc", message: "閲覧中に画面が勝手に消えないように制御できます。" }) 
      },
      { 
        id: "web-usb", 
        name: translate({ id: "benchmark.cat.sys.webusb.name", message: "Web USB" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/WebUSB_API",
        must: false,
        check: () => typeof navigator !== 'undefined' && 'usb' in navigator,
        desc: translate({ id: "benchmark.cat.sys.webusb.desc", message: "USB接続された専用デバイスを、ブラウザから直接制御できます。" }) 
      },
      { 
        id: "file-system", 
        name: translate({ id: "benchmark.cat.sys.filesystem.name", message: "File System Access API" }), 
        url: "https://developer.mozilla.org/ja/docs/Web/API/File_System_API",
        must: false,
        check: () => typeof window !== 'undefined' && 'showOpenFilePicker' in window, 
        desc: translate({ id: "benchmark.cat.sys.filesystem.desc", message: "端末内のファイルを直接編集・保存できます。" }) 
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
        <img src="/icons/benchmark.svg" alt="Web快適度測定" className={styles.pageHeaderIcon} style={{ width: '48px', height: '48px', verticalAlign: 'middle' }} />
        <h1 className={styles.pageHeaderTitle}>
          {translate({ id: 'benchmark.header.title', message: 'Web快適度測定' })}
          <span style={{ fontSize: '0.5em', marginLeft: '10px', color: 'var(--ifm-color-emphasis-500)', verticalAlign: 'middle', fontWeight: 'normal' }}>v{BENCHMARK_VERSION}</span>
        </h1>
        <p className={common.pageHeaderDesc}>
          {translate({ id: 'benchmark.header.desc', message: 'お使いのブラウザ・デバイスの演算性能を測定し、スコアとランクで評価します。' })}
        </p>
      </div>
    </div>
  );
}

const rankReferenceData = [
  { rank: 'Rank S', single: translate({ id: 'benchmark.ref.rank.s.single', message: '4000以上' }), multi: translate({ id: 'benchmark.ref.rank.s.multi', message: '30000以上' }), desc: translate({ id: 'benchmark.ref.rank.s.desc', message: '比類なき速さ。ハイエンドを凌駕する最高峰の性能' }), className: styles.rankS },
  { rank: 'Rank A', single: translate({ id: 'benchmark.ref.rank.a.single', message: '2000〜3999' }), multi: translate({ id: 'benchmark.ref.rank.a.multi', message: '10000〜29999' }), desc: translate({ id: 'benchmark.ref.rank.a.desc', message: '非常に快適。大抵のアプリが極めてスムーズに動作' }), className: styles.rankA },
  { rank: 'Rank B', single: translate({ id: 'benchmark.ref.rank.b.single', message: '1000〜1999' }), multi: translate({ id: 'benchmark.ref.rank.b.multi', message: '4000〜9999' }), desc: translate({ id: 'benchmark.ref.rank.b.desc', message: '快適。複数のタスクを並行しても余裕のある性能' }), className: styles.rankB },
  { rank: 'Rank C', single: translate({ id: 'benchmark.ref.rank.c.single', message: '250〜999' }), multi: translate({ id: 'benchmark.ref.rank.c.multi', message: '500〜3999' }), desc: translate({ id: 'benchmark.ref.rank.c.desc', message: '標準的。一般的なページ閲覧に十分な性能' }), className: styles.rankC },
  { rank: 'Rank D', single: translate({ id: 'benchmark.ref.rank.d.single', message: '100〜249' }), multi: translate({ id: 'benchmark.ref.rank.d.multi', message: '200〜499' }), desc: translate({ id: 'benchmark.ref.rank.d.desc', message: '基本的。負荷により読み込みが遅くなる可能性' }), className: styles.rankD },
  { rank: 'Rank E', single: translate({ id: 'benchmark.ref.rank.e.single', message: '50〜99' }), multi: translate({ id: 'benchmark.ref.rank.e.multi', message: '100〜199' }), desc: translate({ id: 'benchmark.ref.rank.e.desc', message: '低速。古い端末や省電力モードの可能性' }), className: styles.rankE },
  { rank: 'Rank F', single: translate({ id: 'benchmark.ref.rank.f.single', message: '50未満' }), multi: translate({ id: 'benchmark.ref.rank.f.multi', message: '100未満' }), desc: translate({ id: 'benchmark.ref.rank.f.desc', message: '動作困難。現代のWeb標準に対し大幅な性能不足' }), className: styles.rankF },
];

// ============================================================
// Page
// ============================================================

export default function Benchmark(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  const title = translate({ id: 'benchmark.header.title', message: 'Web快適度測定' });
  const description = translate({ id: 'benchmark.header.desc', message: 'お使いのブラウザ・デバイスの演算性能を測定し、スコアとランクで評価します。' });

  const [cores, setCores] = React.useState<number>(4);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const [singleScore, setSingleScore] = useState<number | null>(null);
  const [multiScore, setMultiScore] = useState<number | null>(null);

  // Feature results state
  const [featureResults, setFeatureResults] = useState<Record<string, boolean | null>>({});
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  React.useEffect(() => {
    setCores(navigator.hardwareConcurrency || 4);
  }, []);

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    
    // Order matters (Edge/Opera often contain Chrome/Safari strings)
    if (ua.indexOf("Firefox") > -1 || ua.indexOf("FxiOS") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Browser";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1 || ua.indexOf("EdgiOS") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1 || ua.indexOf("CriOS") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    const version = ua.match(/(?:firefox|fxios|sdk|version|chrome|crios|safari|opr|edge|edg|edgios)[\/: ]([\d\.]+)/i);
    const vStr = version ? version[1].split('.')[0] : "";
    
    let os = "Unknown OS";
    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) {
      // iPadOS sometimes reports as Mac (desktop mode), checking touch support
      if (navigator.maxTouchPoints > 0) os = "iOS";
      else os = "macOS";
    }
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) os = "iOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";

    return `${browser} ${vStr} (${os})`;
  };

  const generateBenchmarkImage = async (): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 960; // コンテンツ増加に合わせて高さを調整
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 960);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#2d2d2d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 960);

    // Orbs (Branding)
    ctx.globalAlpha = 0.3;
    const orb1 = ctx.createRadialGradient(200, 100, 0, 200, 100, 500);
    orb1.addColorStop(0, '#ff0844');
    orb1.addColorStop(1, 'transparent');
    ctx.fillStyle = orb1;
    ctx.beginPath(); ctx.arc(200, 100, 500, 0, Math.PI * 2); ctx.fill();

    const orb2 = ctx.createRadialGradient(1000, 840, 0, 1000, 840, 400);
    orb2.addColorStop(0, '#ffb199');
    orb2.addColorStop(1, 'transparent');
    ctx.fillStyle = orb2;
    ctx.beginPath(); ctx.arc(1000, 840, 400, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0;

    // Title / Branding
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('sawara.me', 60, 70);
    ctx.font = 'bold 56px sans-serif';
    const titleText = translate({ id: 'benchmark.canvas.title', message: 'Web快適度測定結果' });
    ctx.fillText(titleText, 60, 140);

    // Version Info
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`v${BENCHMARK_VERSION}`, 60, 180);

    // Browser Info
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(getBrowserInfo(), 1140, 70);
    ctx.textAlign = 'left';

    // Results Box (Main Score)
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    const r = 24;
    const x = 60, y = 200, w = 1080, h = 420;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    const drawResult = (label: string, score: number, rankInfo: any, startX: number) => {
      ctx.fillStyle = '#aaa';
      ctx.font = '24px sans-serif';
      ctx.fillText(label, startX, 270);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 90px sans-serif';
      ctx.fillText(score.toLocaleString(), startX, 370);

      // Rank Badge
      const badgeW = 240, badgeH = 80;
      const bx = startX, by = 420;
      let badgeGrad = ctx.createLinearGradient(bx, by, bx + badgeW, by + badgeH);
      if (rankInfo.rank === 'S') { badgeGrad.addColorStop(0, '#ff0844'); badgeGrad.addColorStop(1, '#ffb199'); }
      else if (rankInfo.rank === 'A') { badgeGrad.addColorStop(0, '#f6d365'); badgeGrad.addColorStop(1, '#fda085'); }
      else if (rankInfo.rank === 'B') { badgeGrad.addColorStop(0, '#4facfe'); badgeGrad.addColorStop(1, '#00f2fe'); }
      else if (rankInfo.rank === 'C') { badgeGrad.addColorStop(0, '#43e97b'); badgeGrad.addColorStop(1, '#38f9d7'); }
      else { badgeGrad.addColorStop(0, '#868f96'); badgeGrad.addColorStop(1, '#596164'); }

      ctx.fillStyle = badgeGrad;
      const br = 12;
      ctx.beginPath();
      ctx.moveTo(bx + br, by); ctx.lineTo(bx + badgeW - br, by); ctx.quadraticCurveTo(bx + badgeW, by, bx + badgeW, by + br);
      ctx.lineTo(bx + badgeW, by + badgeH - br); ctx.quadraticCurveTo(bx + badgeW, by + badgeH, bx + badgeW - br, by + badgeH);
      ctx.lineTo(bx + br, by + badgeH); ctx.quadraticCurveTo(bx, by + badgeH, bx, by + badgeH - br);
      ctx.lineTo(bx, by + br); ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rankInfo.label, bx + badgeW / 2, by + 56);
      ctx.textAlign = 'left';

      // Description (Score side only)
      ctx.fillStyle = '#bbb';
      ctx.font = '22px sans-serif';
      const desc = rankInfo.desc;
      const maxWidth = 460;
      let line = '';
      let yPos = 540;
      const chars = desc.split('');
      for (let n = 0; n < chars.length; n++) {
        let testLine = line + chars[n];
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, startX, yPos);
          line = chars[n];
          yPos += 32;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, startX, yPos);
    };

    if (singleScore !== null) drawResult('Single Core Score', singleScore, getSingleCoreRankInfo(singleScore), 120);
    if (multiScore !== null) drawResult(`Multi Core Score (${cores} Cores)`, multiScore, getMultiCoreRankInfo(multiScore), 620);

    // Feature Support Section
    const fsY = 700;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(translate({ id: 'benchmark.canvas.featureTitle', message: 'Web機能サポート状況' }), 60, fsY);

    const drawFeatureBadge = (catName: string, passed: number, total: number, index: number) => {
      const colW = 270;
      const bx = 60 + index * colW;
      const by = fsY + 50;
      const bw = 260, bh = 140;

      // Card
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      const br = 16;
      ctx.moveTo(bx + br, by); ctx.lineTo(bx + bw - br, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
      ctx.lineTo(bx + bw, by + bh - br); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
      ctx.lineTo(bx + br, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
      ctx.lineTo(bx, by + br); ctx.quadraticCurveTo(bx, by, bx + br, by);
      ctx.closePath(); ctx.fill();

      // Category Label
      ctx.fillStyle = '#aaa';
      ctx.font = '19px sans-serif';
      ctx.fillText(catName, bx + 15, by + 45);

      // Score Badge
      const isComplete = passed === total;
      const isLow = passed < total / 2;
      
      let badgeCol = '#4facfe'; // Default Blue
      if (isComplete) badgeCol = '#43e97b'; // Success Green
      if (isLow) badgeCol = '#aaa'; // Grey

      ctx.fillStyle = badgeCol;
      const sbx = bx + 15, sby = by + 70, sbw = 120, sbh = 44;
      const sbr = 8;
      ctx.beginPath();
      ctx.moveTo(sbx + sbr, sby); ctx.lineTo(sbx + sbw - sbr, sby); ctx.quadraticCurveTo(sbx + sbw, sby, sbx + sbw, sby + sbr);
      ctx.lineTo(sbx + sbw, sby + sbh - sbr); ctx.quadraticCurveTo(sbx + sbw, sby + sbh, sbx + sbw - sbr, sby + sbh);
      ctx.lineTo(sbx + sbr, sby + sbh); ctx.quadraticCurveTo(sbx, sby + sbh, sbx, sby + sbh - sbr);
      ctx.lineTo(sbx, sby + sbr); ctx.quadraticCurveTo(sbx, sby, sbx + sbr, sby);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#000';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${passed} / ${total}`, sbx + sbw / 2, sby + 31);
      ctx.textAlign = 'left';
    };

    benchmarkData.forEach((cat, idx) => {
      const passedCount = cat.items.filter(item => featureResults[item.id] === true).length;
      drawFeatureBadge(cat.category, passedCount, cat.items.length, idx);
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  const handleShareX = async () => {
    if (isSharing) return;
    if (singleScore === null || multiScore === null) return;
    
    setIsSharing(true);
    try {
      const blob = await generateBenchmarkImage();
      if (!blob) return;

      const shareTitle = translate({ id: 'benchmark.share.title', message: 'Web快適度測定結果' });
      const shareSingle = translate({ id: 'benchmark.share.single', message: 'シングル:' });
      const shareMulti = translate({ id: 'benchmark.share.multi', message: 'マルチ:' });
      const text = `${shareTitle}\n${shareSingle} ${singleScore.toLocaleString()} / ${shareMulti} ${multiScore.toLocaleString()}\nhttps://sawara.me/benchmark`;

      const file = new File([blob], 'benchmark_result.png', { type: 'image/png' });

      // Check if navigator.share is supported for files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: text,
        });

      } else {
        // Fallback: Clipboard + Twitter Intent
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        alert(translate({ id: 'benchmark.share.alert', message: '結果画像をクリップボードにコピーしました！\nX（Twitter）などの投稿画面に貼り付けて投稿してください。' }));
        const siteUrl = 'https://sawara.me/benchmark';
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(siteUrl)}`;
        window.open(xUrl, '_blank');
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Share failed:', e);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleStart = async () => {
    setIsMeasuring(true);
    setSingleScore(null);
    setMultiScore(null);
    setFeatureResults({}); // 状態をリセット
    setProgressMsg(translate({ id: 'benchmark.progress.preparing', message: '準備中...' }));

    await sleep(100);

    // 1. シングルコア測定
    setProgressMsg(translate({ id: 'benchmark.progress.singlePreparing', message: 'シングルコア測定準備中...' }));
    const sScore = await runSingleCoreBenchmark(5, setProgressMsg);
    setSingleScore(sScore);

    // 測定の間に少し間を置く
    setProgressMsg(translate({ id: 'benchmark.progress.multiPreparing', message: 'マルチコア測定準備中...' }));
    await sleep(800);

    // 2. マルチコア測定
    const mScore = await runMultiCoreBenchmark(cores, 5, setProgressMsg);
    setMultiScore(mScore);

    // 3. ブラウザ機能チェック (最後に実行)
    setProgressMsg(translate({ id: 'benchmark.progress.feature', message: '機能サポート状況を判定中...' }));
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
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{translate({ id: 'benchmark.ui.testTitle', message: 'ブラウザの演算性能をテスト' })}</h2>
              <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>
                {translate({ id: 'benchmark.ui.testDesc', message: '「測定開始」ボタンをクリックすると、ブラウザ上で負荷の高い演算処理を実行し、その処理速度からスコアを算出します。' })}
              </p>

              <div style={{ marginTop: '1.5rem', textAlign: 'left', background: 'var(--ifm-color-warning-contrast-background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ifm-color-warning-dark)' }}>
                <p style={{ color: 'var(--ifm-color-warning-dark)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  ⚠️ <strong>{translate({ id: 'benchmark.ui.warning.bold', message: '注意:' })}</strong> {translate({ id: 'benchmark.ui.warning', message: 'このベンチマークテストは負荷の高い計算を行うため、スマートフォンやモバイル端末では一時的にバッテリーを大きく消耗する場合があります。' })}
                </p>
              </div>

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
                  {isMeasuring ? translate({ id: 'benchmark.ui.measuring', message: '測定中...' }) : translate({ id: 'benchmark.ui.start', message: '測定開始' })}
                </Button>
              </div>

                <div className={styles.resultsGrid}>
                  {/* Measurement Environment info */}
                  <div style={{ gridColumn: '1 / -1', textAlign: 'left', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{translate({ id: 'benchmark.ui.env', message: '測定環境:' })}</span>
                      <strong style={{ color: 'var(--ifm-color-emphasis-800)' }}>{getBrowserInfo()}</strong>
                    </div>
                  </div>

                  <div className={styles.resultCard}>
                    <div className={styles.scoreLabel}>{translate({ id: 'benchmark.ui.singleCore', message: 'シングルコア (1 Worker)' })}</div>
                    {singleScore !== null ? (
                      <>
                        <div className={styles.scoreValue}>{singleScore.toLocaleString()}</div>
                        <div className={`${styles.rankBadge} ${getSingleCoreRankInfo(singleScore).className}`}>
                          {getSingleCoreRankInfo(singleScore).label}
                        </div>
                        <div className={styles.deviceImage}>
                          {translate({ id: 'benchmark.ui.estimate', message: '目安:' })} <strong>{getSingleCoreRankInfo(singleScore).desc}</strong>
                        </div>
                      </>
                    ) : (isMeasuring && progressMsg.includes('シングルコア')) ? (
                      <div style={{ padding: '2rem 0' }}>
                        <CircularProgress />
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-primary)', fontWeight: 'bold' }}>
                          {progressMsg.replace('シングルコア測定中...', '') || '測定中...'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '2.4rem 0' }}>
                        <div className={styles.scoreValue} style={{ opacity: 0.2 }}>-</div>
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-500)' }}>{translate({ id: 'benchmark.ui.notStarted', message: '未実施' })}</div>
                      </div>
                    )}
                  </div>

                  <div className={styles.resultCard}>
                    <div className={styles.scoreLabel}>{translate({ id: 'benchmark.ui.multiCore', message: 'マルチコア' })} ({cores} Workers)</div>
                    {multiScore !== null ? (
                      <>
                        <div className={styles.scoreValue}>{multiScore.toLocaleString()}</div>
                        <div className={`${styles.rankBadge} ${getMultiCoreRankInfo(multiScore).className}`}>
                          {getMultiCoreRankInfo(multiScore).label}
                        </div>
                        <div className={styles.deviceImage}>
                          {translate({ id: 'benchmark.ui.estimate', message: '目安:' })} <strong>{getMultiCoreRankInfo(multiScore).desc}</strong>
                        </div>
                      </>
                    ) : (isMeasuring && progressMsg.includes('マルチコア')) ? (
                      <div style={{ padding: '2rem 0' }}>
                        <CircularProgress />
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-primary)', fontWeight: 'bold' }}>
                          {progressMsg.replace('マルチコア測定中...', '') || '測定中...'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '2.4rem 0' }}>
                        <div className={styles.scoreValue} style={{ opacity: 0.2 }}>-</div>
                        <div style={{ marginTop: '1rem', color: 'var(--ifm-color-emphasis-500)' }}>{translate({ id: 'benchmark.ui.notStarted', message: '未実施' })}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.modalLinkWrap} style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button
                    startIcon={<InfoOutlinedIcon />}
                    onClick={() => setIsModalOpen(true)}
                    className={styles.modalLink}
                  >
                    {translate({ id: 'benchmark.ui.modalBtn', message: 'スコアの目安について' })}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={isSharing ? <CircularProgress size={20} /> : <ShareIcon />}
                    onClick={handleShareX}
                    disabled={isSharing || isMeasuring || (singleScore === null && multiScore === null)}
                    style={{ borderRadius: '20px', fontWeight: 'bold', textTransform: 'none' }}
                  >
                    {translate({ id: 'benchmark.ui.share', message: '結果を共有' })}
                  </Button>
                </div>
            </div>

            <div className={styles.featureSection}>
              <h2 className={styles.sectionTitle}>{translate({ id: 'benchmark.ui.featureTitle', message: 'ブラウザ機能サポート状況' })}</h2>
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
                                  {item.must && <span className={styles.mustTag}>{translate({ id: 'benchmark.ui.must', message: '必須' })}</span>}
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
                  <strong>{translate({ id: 'benchmark.modal.title', message: 'スコアの判定基準' })}</strong>
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
                            <span>{translate({ id: 'benchmark.modal.single', message: 'シングル:' })}</span> <strong>{item.single}</strong>
                          </div>
                          <div className={styles.rankScoreDetail}>
                            <span>{translate({ id: 'benchmark.modal.multi', message: 'マルチ:' })}</span> <strong>{item.multi}</strong>
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
                  {translate({ id: 'common.close', message: '閉じる' })}
                </Button>
              </DialogActions>
            </Dialog>

          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
