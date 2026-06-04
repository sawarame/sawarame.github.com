import React from 'react';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import { 
  Image, 
  QrCode, 
  ScanQrCode, 
  FileText, 
  Languages, 
  Camera, 
  Lock, 
  StickyNote, 
  Smartphone, 
  FileDiff, 
  Calendar, 
  Target,
  Gauge,
  FileDown
} from 'lucide-react';
import styles from './styles.module.css';

import TabOrigamiPng from '@site/src/icons/TabOrigami.png';
import EnvIconPng from '@site/src/icons/EnvIcon.png';
import GemiKit from '@site/src/icons/GemiKit.png';
import MdPickerPng from '@site/src/icons/MdPicker.png';
import KetchupTimerPng from '@site/src/icons/KetchupTimer.png';
import NickmarkPng from '@site/src/icons/Nickmark.png';
import FourSightPng from '@site/src/icons/FourSight.png';

// ============================================================
// Data
// ============================================================

const ICON_SIZE = 32;

export const tools = [
  {
    icon: <Gauge size={ICON_SIZE} />,
    titleId: 'home.tools.benchmark.title',
    title: 'Web快適度測定',
    descriptionId: 'home.tools.benchmark.desc',
    description: 'ブラウザ上でデバイスの演算性能を測定し、スコアとランクで評価します。',
    link: '/benchmark',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #4facfe 100%)',
  },
  {
    icon: <Image size={ICON_SIZE} />,
    titleId: 'home.tools.resize.title',
    title: '画像軽量化・クロップツール',
    descriptionId: 'home.tools.resize.desc',
    description: 'ブラウザ上で画像を軽量化し、WebPなどの形式に変換します。一括処理やEXIF情報の削除にも対応しています。',
    link: '/resize',
    gradient: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
  },
  {
    icon: <QrCode size={ICON_SIZE} />,
    titleId: 'home.tools.qr.title',
    title: 'QRコード作成',
    descriptionId: 'home.tools.qr.desc',
    description: 'URLやテキストからQRコードを生成します。ロゴの埋め込みやWi-Fi・カレンダー登録のQRコード作成などにも対応しています。',
    link: '/qr',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    icon: <ScanQrCode size={ICON_SIZE} />,
    titleId: 'home.tools.qr-reader.title',
    title: 'QRコード読み取り',
    descriptionId: 'home.tools.qr-reader.desc',
    description: 'QRコードの画像をアップロードして、埋め込まれた文字列を解析します。URLの場合は直接開くことも可能。すべてブラウザ内で処理されます。',
    link: '/qr-reader',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
  },
  {
    icon: <FileText size={ICON_SIZE} />,
    titleId: 'home.tools.pdfEditor.title',
    title: 'PDF変換・編集',
    descriptionId: 'home.tools.pdfEditor.desc',
    description: 'PDFを画像に変換したり、必要なページだけを抽出・結合して新しいPDFを作成できます。プレビューを見ながら選択可能。ブラウザ上で完結するため安全です。',
    link: '/pdf-editor',
    gradient: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
  },
  {
    icon: <Languages size={ICON_SIZE} />,
    titleId: 'home.tools.encoding.title',
    title: 'テキスト文字コード変換',
    descriptionId: 'home.tools.encoding.desc',
    description: 'テキストファイルの文字コードを自動判別し、変換後の推定サイズを確認しながら指定した形式に変換できます。ペーストによる入力にも対応。',
    link: '/tools/encoding-converter',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
  },
  {
    icon: <Camera size={ICON_SIZE} />,
    titleId: 'home.tools.exif.title',
    title: '写真Exif情報チェッカー',
    descriptionId: 'home.tools.exif.desc',
    description: '写真の撮影日時やカメラ情報、GPSなどを読み取ります。写真はサーバーに送信されず、すべてブラウザ内で処理されるため安全です。',
    link: '/exif',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  {
    icon: <Lock size={ICON_SIZE} />,
    titleId: 'home.tools.password.title',
    title: 'パスワードジェネレーター',
    descriptionId: 'home.tools.password.desc',
    description:
      '条件を指定してパスワードを作成できます。設定はURLに含まれるため、URLの共有により同じ条件で生成可能です。ブラウザ上で動作するため安全に利用できます。',
    link: '/password',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    icon: <StickyNote size={ICON_SIZE} />,
    titleId: 'home.tools.text.title',
    title: 'テキスト保存場所',
    descriptionId: 'home.tools.text.desc',
    description:
      'テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。',
    link: '/text',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    icon: <Smartphone size={ICON_SIZE} />,
    titleId: 'home.tools.device.title',
    title: 'デバイス情報チェッカー',
    descriptionId: 'home.tools.device.desc',
    description:
      '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。',
    link: '/device',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    icon: <FileDiff size={ICON_SIZE} />,
    titleId: 'home.tools.diff.title',
    title: 'テキスト差分比較',
    descriptionId: 'home.tools.diff.desc',
    description: '2つのテキストやファイルを比較し、追加・削除された箇所の差分を視覚的に表示します。複数のファイルをアップロードして、任意の組み合わせで比較することが可能です。',
    link: '/tools/text-diff',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  },
  {
    icon: <Calendar size={ICON_SIZE} />,
    titleId: 'home.tools.date.title',
    title: '日付比較ツール',
    descriptionId: 'home.tools.date.desc',
    description: '二つの日付の差分を計算します。様々なフォーマットの日付入力に対応しています。',
    link: '/date',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    icon: <Target size={ICON_SIZE} />,
    titleId: 'home.tools.roulette.title',
    title: 'ルーレットメーカー',
    descriptionId: 'home.tools.roulette.desc',
    description: '入力したリストからサクッと抽選ができます。一度出た項目を除外する機能や、履歴の保存機能も備えています。',
    link: '/roulette',
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  },
  {
    icon: <FileDown size={ICON_SIZE} />,
    titleId: 'home.tools.markdownPdf.title',
    title: 'マークダウンPDF変換',
    descriptionId: 'home.tools.markdownPdf.desc',
    description: 'アップロードしたマークダウンファイルや直接入力したテキストを、文字の選択や検索が可能なPDFに変換してダウンロードします。',
    link: '/markdown-pdf',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
];

export const extensions = [
  {
    iconSrc: TabOrigamiPng,
    title: 'TabOrigami',
    descriptionId: 'home.extensions.taborigami.desc',
    description:
      '開きすぎたタブをAIが自動分類。Geminiの力で散らかったブラウザをスッキリ整理します。',
    link: 'https://chromewebstore.google.com/detail/taborigami/fdlipkbmeeompfjhhapjlgcccpgfndpe',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: EnvIconPng,
    title: 'EnvIcon',
    descriptionId: 'home.extensions.envicon.desc',
    description:
      '本番・検証・開発環境でfaviconを書き換えることができる、開発者向けのブラウザ拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/envicon/fkapincooiacacfebhkmjoekabbffako',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: NickmarkPng,
    title: 'Nickmark',
    descriptionId: 'home.extensions.nickmark.desc',
    description:
      'ニックネームを使ってアドレスバーからブックマークへ瞬時にアクセスするための、キーボード操作特化型拡張機能。',
    link: 'https://chromewebstore.google.com/detail/nickmark/bicojpjoabhecikokcohbjgaiojggpno',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: MdPickerPng,
    title: 'MdPicker',
    descriptionId: 'home.extensions.mdpicker.desc',
    description:
      'ウェブページのリンクをMarkdown形式で簡単にコピーできるブラウザ拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/mdpicker/aihoeldnpdpcbjbcgamhhkgnpmihooep',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: KetchupTimerPng,
    title: 'Ketchup Timer',
    descriptionId: 'home.extensions.ketchuptimer.desc',
    description:
      'ケチャップボトルの視覚的な演出が楽しいポモドーロ・タイマーです。集中するとケチャップが減り、休憩時間になると自動で補充される遊び心のあるデザインで、日々のタスク管理をサポートします。',
    link: 'https://chromewebstore.google.com/detail/ketchup-timer/kbgefliaonfokdibgopnlakhidlpibcb',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: GemiKit,
    title: 'GemiKit',
    descriptionId: 'home.extensions.gemikit.desc',
    description:
      'Google Gemini のウェブインターフェースを強化するためのブラウザ拡張機能です。エンターキーで改行し、Command+Enter (Ctrl+Enter) で送信できるようになります。',
    link: 'https://chromewebstore.google.com/detail/gemini-spark/iolhhcbgkkmlfndhmpclkabebjlinkic',
    badge: 'Chrome Web Store',
  },
  {
    iconSrc: FourSightPng,
    title: 'FourSight',
    descriptionId: 'home.extensions.foursight.desc',
    description:
      'GitHubのFour Keys（DORAメトリクス）を計測・可視化し、開発チームのパフォーマンス改善をサポートする拡張機能です。',
    link: 'https://chromewebstore.google.com/detail/foursight-dora-tracker-fo/ealiipikbpepgdeojlkjjibgfpdnmgam',
    badge: 'Chrome Web Store',
  },
];

// ============================================================
// Components
// ============================================================

export function ToolCard({
  icon,
  titleId,
  title,
  descriptionId,
  description,
  link,
  gradient,
}: (typeof tools)[number]) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      // LucideアイコンなどのReact要素の場合は色を白に設定
      // 型エラー回避のため any でキャスト
      return React.cloneElement(icon as React.ReactElement<any>, { color: '#ffffff' });
    }
    return icon;
  };

  return (
    <Link to={link} className={styles.card}>
      <div className={styles.cardIconWrap} style={{ background: gradient }}>
        <span className={styles.cardIcon}>{renderIcon()}</span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>
          {translate({ id: titleId, message: title })}
        </h3>
        <p className={styles.cardDescription}>
          {translate({ id: descriptionId, message: description })}
        </p>
      </div>
      <div className={styles.cardArrow}>→</div>
    </Link>
  );
}

export function ExtensionCard({
  iconSrc,
  title,
  descriptionId,
  description,
  link,
  badge,
}: (typeof extensions)[number]) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.extensionCard}
    >
      <div className={styles.extensionCardHeader}>
        <div className={styles.extensionIconWrap}>
          <img src={iconSrc} alt={title} className={styles.extensionIcon} />
        </div>
        <span className={styles.extensionBadge}>{badge}</span>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>
          {translate({ id: descriptionId, message: description })}
        </p>
      </div>
      <div className={styles.extensionLink}>
        <Translate id="home.extensions.linkText">Chrome Web Store で見る →</Translate>
      </div>
    </a>
  );
}

export function ToolGrid() {
  return (
    <div className={styles.grid}>
      {tools.map((tool) => (
        <ToolCard key={tool.title} {...tool} />
      ))}
    </div>
  );
}

export function ExtensionGrid() {
  return (
    <div className={styles.grid}>
      {extensions.map((ext) => (
        <ExtensionCard key={ext.title} {...ext} />
      ))}
    </div>
  );
}
