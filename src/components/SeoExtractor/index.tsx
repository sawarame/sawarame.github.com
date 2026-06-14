import React, { useState } from 'react';
import Translate, { translate } from '@docusaurus/Translate';

import {
  TextField,
  Button,
  Stack,
  Tabs,
  Tab,
  Box,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Typography,
  Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

// ============================================================
// Types
// ============================================================

/**
 * 抽出されたSEOメタデータの型定義
 */
export interface SeoData {
  title: string;
  description: string;
  keywords: string;
  favicon: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  ogSiteName: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  robots: string;
}

// ============================================================
// Utilities
// ============================================================

/**
 * 相対URLを絶対URLに解決します。
 * 
 * @param url 対象のURL（相対パスまたは絶対パス）
 * @param baseUrl 基準となるURL
 * @returns 解決された絶対URL
 */
export const resolveUrl = (url: string | null, baseUrl: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^data:/i.test(trimmed)) return trimmed; // Base64データはそのまま
  try {
    return new URL(trimmed, baseUrl).href;
  } catch (e) {
    return trimmed;
  }
};

/**
 * HTML文字列をパースし、各種SEOタグのメタデータを抽出します。
 * 
 * @param htmlContent HTMLソースコード
 * @param baseUrl 基準URL（相対URL解決用）
 * @returns 抽出されたSEOメタデータ
 */
export const parseHtml = (htmlContent: string, baseUrl: string): SeoData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // faviconの抽出
  let favicon = '';
  const faviconElements = doc.querySelectorAll('link[rel*="icon"]');
  if (faviconElements.length > 0) {
    const href = faviconElements[0].getAttribute('href') || '';
    favicon = resolveUrl(href, baseUrl);
  } else {
    // デフォルトの /favicon.ico を解決
    favicon = resolveUrl('/favicon.ico', baseUrl);
  }

  // canonical URLの抽出
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonical = canonicalEl ? canonicalEl.getAttribute('href') || '' : '';

  /**
   * メタ属性（name または property）に合致するcontentを取得します。
   */
  const getMeta = (key: string): string => {
    const el = doc.querySelector(`meta[name="${key}"]`) || doc.querySelector(`meta[property="${key}"]`);
    return el ? el.getAttribute('content') || '' : '';
  };

  const title = doc.querySelector('title')?.textContent || '';
  const description = getMeta('description');
  const keywords = getMeta('keywords');

  // OGP
  const ogTitle = getMeta('og:title') || title;
  const ogDescription = getMeta('og:description') || description;
  const ogImage = resolveUrl(getMeta('og:image'), baseUrl);
  const ogUrl = getMeta('og:url');
  const ogType = getMeta('og:type');
  const ogSiteName = getMeta('og:site_name');

  // Twitter Card
  const twitterCard = getMeta('twitter:card');
  const twitterTitle = getMeta('twitter:title') || ogTitle;
  const twitterDescription = getMeta('twitter:description') || ogDescription;
  const twitterImage = resolveUrl(getMeta('twitter:image'), baseUrl);

  // robots
  const robots = getMeta('robots');

  return {
    title,
    description,
    keywords,
    favicon,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    ogType,
    ogSiteName,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    robots
  };
};

/**
 * 与えられたURLからドメイン（ホスト名）を抽出します。
 * 
 * @param urlStr URL文字列
 * @returns ドメイン名
 */
export const getDomainName = (urlStr: string): string => {
  try {
    const urlObj = new URL(urlStr);
    return urlObj.hostname;
  } catch (e) {
    return urlStr;
  }
};

/**
 * ファイル名として安全なタイムスタンプ文字列 (YYYYMMDDHHMMSS) を生成します。
 */
export const getTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

// ============================================================
// Main Component
// ============================================================

export default function SeoExtractor(): JSX.Element {
  // 入力状態
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [inputUrl, setInputUrl] = useState('');
  const [inputHtml, setInputHtml] = useState('');

  // 解析データ・処理状態
  const [extractedData, setExtractedData] = useState<SeoData | null>(null);
  const [sourceUrl, setSourceUrl] = useState(''); // 解析元のURL（プレビューの表示用）
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI表示用
  const [resultTab, setResultTab] = useState<number>(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  /**
   * クリップボードへのコピーを実行します。
   */
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: translate({ id: 'common.copied', message: 'コピーしました！' }),
    });
  };

  /**
   * JSONデータとしてエクスポート (ダウンロード) します。
   */
  const handleExportJson = () => {
    if (!extractedData) return;
    const jsonString = JSON.stringify(extractedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    // セキュリティサニタイズされた安全なタイムスタンプファイル名
    const timestamp = getTimestamp();
    a.download = `seo_metadata_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: translate({ id: 'seo.export.success', message: 'JSONファイルをエクスポートしました' }),
    });
  };

  /**
   * 指定されたURLからメタデータを取得します。
   */
  const handleFetchMetadata = async () => {
    if (!inputUrl.trim()) return;

    let targetUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    setLoading(true);
    setError(null);
    setExtractedData(null);
    
    try {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://127.0.0.1:3001/v1/website/metadata' 
        : 'https://api.sawara.me/v1/website/metadata';
      
      const url = new URL(baseUrl);
      url.searchParams.append('url', targetUrl);

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SeoData = await response.json();
      
      setSourceUrl(targetUrl);
      setExtractedData(data);
      setResultTab(0); // プレビュータブを初期表示
    } catch (err) {
      console.error(err);
      setError(translate({ id: 'seo.error.fetchFailed', message: 'メタデータの取得に失敗しました。URLが間違っているか、または対象サイトがアクセスをブロックしている可能性があります。' }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 貼り付けられたHTMLソースコードを解析します。
   */
  const handleParseFromHtml = () => {
    if (!inputHtml.trim()) return;

    setLoading(true);
    setError(null);
    setExtractedData(null);
    
    // HTMLの先頭部分に canonical または og:url があればそれを基準URLにする。なければダミーのURLを指定。
    const dummyBase = 'https://example.com';
    
    try {
      // 予備パースで canonical または og:url を調べる
      const tempParser = new DOMParser();
      const tempDoc = tempParser.parseFromString(inputHtml, 'text/html');
      
      const canonicalEl = tempDoc.querySelector('link[rel="canonical"]');
      const ogUrlEl = tempDoc.querySelector('meta[property="og:url"]') || tempDoc.querySelector('meta[name="og:url"]');
      
      const foundUrl = (canonicalEl?.getAttribute('href') || ogUrlEl?.getAttribute('content') || '').trim();
      let resolvedBase = dummyBase;
      
      if (foundUrl) {
        try {
          // 有効な絶対URLであればそれをベースにする
          const urlObj = new URL(foundUrl);
          resolvedBase = urlObj.origin + urlObj.pathname;
        } catch (e) {
          // 相対URLや無効なURLの場合はダミー
        }
      }

      const result = parseHtml(inputHtml, resolvedBase);
      setSourceUrl(result.canonical || result.ogUrl || resolvedBase);
      setExtractedData(result);
      setResultTab(0); // プレビュータブを初期表示
    } catch (err) {
      console.error(err);
      setError(translate({ id: 'seo.error.parseFailed', message: 'HTMLの解析に失敗しました。ソースコードを確認してください。' }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 入力データと解析結果を完全にクリアします。
   */
  const handleReset = () => {
    setInputUrl('');
    setInputHtml('');
    setExtractedData(null);
    setError(null);
    setSourceUrl('');
  };

  // 文字数判定用コンポーネント
  const CharCountProgress = ({ text, type }: { text: string; type: 'title' | 'description' }) => {
    const len = text.length;
    let min = 0;
    let max = 0;
    let typeName = '';

    if (type === 'title') {
      min = 25;
      max = 35;
      typeName = translate({ id: 'seo.meta.title', message: 'タイトル' });
    } else {
      min = 80;
      max = 120;
      typeName = translate({ id: 'seo.meta.desc', message: '説明文' });
    }

    let status: 'success' | 'warning' | 'danger' = 'warning';
    let statusText = '';

    if (len === 0) {
      status = 'danger';
      statusText = translate({ id: 'seo.status.missing', message: '未設定' });
    } else if (len >= min && len <= max) {
      status = 'success';
      statusText = translate({ id: 'seo.status.good', message: '適正' });
    } else if (len < min) {
      status = 'warning';
      statusText = translate({ id: 'seo.status.short', message: '文字数が少なめ' });
    } else {
      status = 'warning';
      statusText = translate({ id: 'seo.status.long', message: '文字数が多め' });
    }

    // 進捗率（プログレスバー表示用）
    const limit = max * 1.3; // 最大文字数の1.3倍をMAXとする
    const progressPercent = Math.min((len / limit) * 100, 100);

    let barClass = styles.bgWarning;
    let textClass = styles.statusWarning;
    if (status === 'success') {
      barClass = styles.bgSuccess;
      textClass = styles.statusSuccess;
    } else if (status === 'danger') {
      barClass = styles.bgDanger;
      textClass = styles.statusError;
    }

    return (
      <div className={styles.charCounter}>
        <div className={styles.charCounterHeader}>
          <span>
            {typeName}: <strong>{len}</strong> 文字
            <span style={{ fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-500)', marginLeft: '8px' }}>
              ({translate({ id: 'seo.recommend', message: '推奨' })}: {min}〜{max}文字)
            </span>
          </span>
          <span className={`${styles.charCounterStatus} ${textClass}`}>{statusText}</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div
            className={`${styles.progressBar} ${barClass}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <MuiTheme>
      <div className={styles.container}>
        
        {/* 入力エリア */}
        <div className={common.card}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={inputMode}
              onChange={(_, val) => {
                setInputMode(val);
                handleReset();
              }}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label={translate({ id: 'seo.tab.url', message: 'URLから取得' })} value="url" />
              <Tab label={translate({ id: 'seo.tab.html', message: 'HTMLを貼り付け' })} value="html" />
            </Tabs>
          </Box>

          {inputMode === 'url' ? (
            <Stack spacing={2}>
              <TextField
                label={translate({ id: 'seo.input.urlLabel', message: '対象のURL' })}
                variant="outlined"
                fullWidth
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && inputUrl) {
                    handleFetchMetadata();
                  }
                }}
              />
              <div className={styles.warningBox} style={{ borderLeftColor: 'var(--ifm-color-info)' }}>
                ℹ️ <strong>{translate({ id: 'seo.info.title', message: 'URLから自動取得' })}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--ifm-color-emphasis-700)' }}>
                  {translate({
                    id: 'seo.info.desc',
                    message:
                      '指定されたURLへサーバーからアクセスし、メタデータを取得します。※認証が必要なページや内部ネットワークのページは取得できない場合があります。',
                  })}
                </p>
              </div>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleReset}
                  disabled={loading || (!inputUrl && !extractedData)}
                  startIcon={<RefreshIcon />}
                >
                  {translate({ id: 'common.reset', message: 'クリア' })}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleFetchMetadata}
                  disabled={loading || !inputUrl}
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                >
                  {loading
                    ? translate({ id: 'seo.action.fetching', message: '取得中...' })
                    : translate({ id: 'seo.action.fetch', message: '取得する' })}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label={translate({ id: 'seo.input.htmlLabel', message: 'HTMLソースコード' })}
                variant="outlined"
                multiline
                rows={8}
                fullWidth
                value={inputHtml}
                onChange={(e) => setInputHtml(e.target.value)}
                placeholder="<!DOCTYPE html><html><head><title>サンプル...</title></head><body>...</body></html>"
              />
              <div className={styles.warningBox} style={{ borderLeftColor: 'var(--ifm-color-success)' }}>
                🔒 <strong>{translate({ id: 'seo.security.title.secure', message: '100% 安全なローカル処理 (CORS制限なし)' })}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--ifm-color-emphasis-700)' }}>
                  {translate({
                    id: 'seo.security.desc.secure',
                    message:
                      '貼り付けられたHTMLソースコードは、完全にあなたのブラウザの内部（ローカル）でのみ解析処理されます。外部のサーバーへURLやHTMLデータが送信されることは一切ありません。オフライン環境や、社内向けの非公開サイトのソースコードであっても、完全に安全にご利用いただけます。',
                  })}
                </p>
              </div>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleReset}
                  disabled={loading || (!inputHtml && !extractedData)}
                  startIcon={<RefreshIcon />}
                >
                  {translate({ id: 'common.reset', message: 'クリア' })}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleParseFromHtml}
                  disabled={loading || !inputHtml}
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                >
                  {loading
                    ? translate({ id: 'seo.action.parsing', message: '解析中...' })
                    : translate({ id: 'seo.action.parse', message: '解析する' })}
                </Button>
              </Stack>
            </Stack>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>
              ⚠️ {translate({ id: 'seo.error.title', message: 'エラーが発生しました' })}
            </div>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        )}

        {/* 解析結果の表示 */}
        {extractedData && !loading && (
          <div className={styles.container}>
            {/* 結果タブ選択 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={resultTab}
                onChange={(_, val) => setResultTab(val)}
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab label={translate({ id: 'seo.resultTab.preview', message: 'プレビュー' })} />
                <Tab label={translate({ id: 'seo.resultTab.basic', message: '基本メタ情報' })} />
                <Tab label={translate({ id: 'seo.resultTab.ogp', message: 'OGP・SNS情報' })} />
                <Tab label={translate({ id: 'seo.resultTab.json', message: 'JSONデータ' })} />
              </Tabs>
            </Box>

            {/* [TAB 0] プレビュー */}
            {resultTab === 0 && (
              <div className={common.card}>
                <h3 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>🖥️</span>
                  {translate({ id: 'seo.preview.title', message: '検索結果＆SNSでの見え方プレビュー' })}
                </h3>
                <div className={styles.previewSection}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--ifm-color-emphasis-700)' }}>
                      Google 検索結果風プレビュー
                    </h4>
                    <div className={styles.googlePreview}>
                      <div className={styles.googleUrlContainer}>
                        {extractedData.favicon ? (
                          <img
                            src={extractedData.favicon}
                            alt="favicon"
                            className={styles.googleFavicon}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={styles.googleFavicon}>🌐</div>
                        )}
                        <span className={styles.googleSiteName}>{extractedData.ogSiteName || getDomainName(sourceUrl)}</span>
                        <span className={styles.googleUrl}>› {getDomainName(sourceUrl)}</span>
                      </div>
                      <h3 className={styles.googleTitle}>{extractedData.title || translate({ id: 'seo.preview.noTitle', message: 'タイトルが設定されていません' })}</h3>
                      <p className={styles.googleDescription}>
                        {extractedData.description ||
                          translate({ id: 'seo.preview.noDesc', message: '説明文が設定されていません。検索エンジンによって本文から自動生成される可能性があります。' })}
                      </p>
                    </div>
                  </div>

                  <Divider sx={{ my: 2 }} />

                  <div>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--ifm-color-emphasis-700)' }}>
                      SNSシェア風プレビュー (Facebook / Slack 等)
                    </h4>
                    <div className={styles.snsPreview}>
                      <div className={styles.snsImageArea}>
                        {extractedData.ogImage ? (
                          <img
                            src={extractedData.ogImage}
                            alt="OGP"
                            className={styles.snsImage}
                            onError={(e) => {
                              // エラー時はフォールバックのプレースホルダーへ
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className={styles.snsImagePlaceholder}>
                            <span style={{ fontSize: '2rem' }}>🖼️</span>
                            <span style={{ fontSize: '0.8rem' }}>{translate({ id: 'seo.preview.noImage', message: 'OGP画像なし' })}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.snsContent}>
                        <div className={styles.snsDomain}>{getDomainName(sourceUrl)}</div>
                        <h4 className={styles.snsTitle}>{extractedData.ogTitle || extractedData.title}</h4>
                        <p className={styles.snsDescription}>{extractedData.ogDescription || extractedData.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* [TAB 1] 基本メタ情報 */}
            {resultTab === 1 && (
              <Stack spacing={3}>
                {/* 文字数評価 */}
                <div className={common.card}>
                  <h3 className={common.cardTitle}>
                    <span className={common.cardTitleIcon}>📊</span>
                    {translate({ id: 'seo.eval.title', message: '文字数チェック評価' })}
                  </h3>
                  <Stack spacing={3} style={{ marginTop: '1.5rem' }}>
                    <CharCountProgress text={extractedData.title} type="title" />
                    <CharCountProgress text={extractedData.description} type="description" />
                  </Stack>
                </div>

                {/* 基本情報データリスト */}
                <div className={styles.dataList}>
                  {/* タイトル */}
                  <div className={styles.dataRow}>
                    <div className={styles.dataKeyColumn}>
                      <span className={styles.dataLabel}>{translate({ id: 'seo.item.title', message: 'タイトル' })}</span>
                      <span className={styles.dataTag}>&lt;title&gt;</span>
                    </div>
                    <div className={styles.dataValueColumn}>
                      <p className={styles.dataValueText}>
                        {extractedData.title ? (
                          extractedData.title
                        ) : (
                          <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                        )}
                      </p>
                      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                        <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                          className={styles.dataCopyBtn}
                          onClick={() => handleCopy(extractedData.title)}
                          disabled={!extractedData.title}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  {/* メタ説明文 */}
                  <div className={styles.dataRow}>
                    <div className={styles.dataKeyColumn}>
                      <span className={styles.dataLabel}>{translate({ id: 'seo.item.desc', message: '説明文 (Description)' })}</span>
                      <span className={styles.dataTag}>meta[name="description"]</span>
                    </div>
                    <div className={styles.dataValueColumn}>
                      <p className={styles.dataValueText}>
                        {extractedData.description ? (
                          extractedData.description
                        ) : (
                          <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                        )}
                      </p>
                      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                        <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                          className={styles.dataCopyBtn}
                          onClick={() => handleCopy(extractedData.description)}
                          disabled={!extractedData.description}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  {/* メタキーワード */}
                  <div className={styles.dataRow}>
                    <div className={styles.dataKeyColumn}>
                      <span className={styles.dataLabel}>{translate({ id: 'seo.item.keywords', message: 'キーワード (Keywords)' })}</span>
                      <span className={styles.dataTag}>meta[name="keywords"]</span>
                    </div>
                    <div className={styles.dataValueColumn}>
                      <p className={styles.dataValueText}>
                        {extractedData.keywords ? (
                          extractedData.keywords
                        ) : (
                          <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                        )}
                      </p>
                      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                        <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                          className={styles.dataCopyBtn}
                          onClick={() => handleCopy(extractedData.keywords)}
                          disabled={!extractedData.keywords}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  {/* favicon */}
                  <div className={styles.dataRow}>
                    <div className={styles.dataKeyColumn}>
                      <span className={styles.dataLabel}>Favicon URL</span>
                      <span className={styles.dataTag}>link[rel="icon"]</span>
                    </div>
                    <div className={styles.dataValueColumn}>
                      <div className={styles.faviconWrapper}>
                        {extractedData.favicon ? (
                          <>
                            <img
                              src={extractedData.favicon}
                              alt="favicon preview"
                              className={styles.faviconPreview}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <p className={styles.dataValueText}>{extractedData.favicon}</p>
                          </>
                        ) : (
                          <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                        )}
                      </div>
                      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                        <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                          className={styles.dataCopyBtn}
                          onClick={() => handleCopy(extractedData.favicon)}
                          disabled={!extractedData.favicon}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Canonical URL */}
                  <div className={styles.dataRow}>
                    <div className={styles.dataKeyColumn}>
                      <span className={styles.dataLabel}>Canonical URL</span>
                      <span className={styles.dataTag}>link[rel="canonical"]</span>
                    </div>
                    <div className={styles.dataValueColumn}>
                      <p className={styles.dataValueText}>
                        {extractedData.canonical ? (
                          extractedData.canonical
                        ) : (
                          <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                        )}
                      </p>
                      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                        <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                          className={styles.dataCopyBtn}
                          onClick={() => handleCopy(extractedData.canonical)}
                          disabled={!extractedData.canonical}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Robots */}
                  <div className={styles.dataRow}>
                    <div className={styles.dataKeyColumn}>
                      <span className={styles.dataLabel}>{translate({ id: 'seo.item.robots', message: '検索回避 (Robots)' })}</span>
                      <span className={styles.dataTag}>meta[name="robots"]</span>
                    </div>
                    <div className={styles.dataValueColumn}>
                      <p className={styles.dataValueText}>
                        {extractedData.robots ? (
                          extractedData.robots
                        ) : (
                          <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty.none', message: '未設定 (インデックス許可)' })}</span>
                        )}
                      </p>
                      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                        <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                          className={styles.dataCopyBtn}
                          onClick={() => handleCopy(extractedData.robots)}
                          disabled={!extractedData.robots}
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Stack>
            )}

            {/* [TAB 2] OGP・SNS情報 */}
            {resultTab === 2 && (
              <div className={styles.dataList}>
                {/* og:title */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>og:title</span>
                    <span className={styles.dataTag}>og:title</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.ogTitle ? (
                        extractedData.ogTitle
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.ogTitle)}
                        disabled={!extractedData.ogTitle}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* og:description */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>og:description</span>
                    <span className={styles.dataTag}>og:description</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.ogDescription ? (
                        extractedData.ogDescription
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.ogDescription)}
                        disabled={!extractedData.ogDescription}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* og:image */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>og:image URL</span>
                    <span className={styles.dataTag}>og:image</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.ogImage ? (
                        extractedData.ogImage
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.ogImage)}
                        disabled={!extractedData.ogImage}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* og:url */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>og:url</span>
                    <span className={styles.dataTag}>og:url</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.ogUrl ? (
                        extractedData.ogUrl
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.ogUrl)}
                        disabled={!extractedData.ogUrl}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* og:site_name */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>og:site_name</span>
                    <span className={styles.dataTag}>og:site_name</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.ogSiteName ? (
                        extractedData.ogSiteName
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.ogSiteName)}
                        disabled={!extractedData.ogSiteName}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* og:type */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>og:type</span>
                    <span className={styles.dataTag}>og:type</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.ogType ? (
                        extractedData.ogType
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.ogType)}
                        disabled={!extractedData.ogType}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>

                {/* twitter:card */}
                <div className={styles.dataRow}>
                  <div className={styles.dataKeyColumn}>
                    <span className={styles.dataLabel}>twitter:card</span>
                    <span className={styles.dataTag}>twitter:card</span>
                  </div>
                  <div className={styles.dataValueColumn}>
                    <p className={styles.dataValueText}>
                      {extractedData.twitterCard ? (
                        extractedData.twitterCard
                      ) : (
                        <span className={styles.dataValueEmpty}>{translate({ id: 'seo.empty', message: '未設定' })}</span>
                      )}
                    </p>
                    <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
                      <IconButton aria-label={translate({ id: 'common.copy', message: 'コピー' })}
                        className={styles.dataCopyBtn}
                        onClick={() => handleCopy(extractedData.twitterCard)}
                        disabled={!extractedData.twitterCard}
                        size="small"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )}

            {/* [TAB 3] JSON */}
            {resultTab === 3 && (
              <div className={styles.jsonContainer}>
                <div className={styles.jsonHeader}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ifm-color-emphasis-700)' }}>
                    JSON Output
                  </span>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopy(JSON.stringify(extractedData, null, 2))}
                    >
                      {translate({ id: 'common.copy', message: 'コピー' })}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportJson}
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: '#ffffff',
                      }}
                    >
                      {translate({ id: 'seo.action.download', message: 'ダウンロード' })}
                    </Button>
                  </Stack>
                </div>
                <pre className={styles.jsonCode}>
                  <code>{JSON.stringify(extractedData, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 通知ポップアップ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MuiTheme>
  );
}
