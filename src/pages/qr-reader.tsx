import React, { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import {
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import jsQR from 'jsqr';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/qr-reader.module.css';

// ============================================================
// Types
// ============================================================

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

// ============================================================
// Utils
// ============================================================

function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function decodeQR(imageElement: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(imageElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });
  return code ? code.data : null;
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
        <span className={styles.pageHeaderIcon}>🔍</span>
        <h1 className={styles.pageHeaderTitle}>{translate({ id: 'qrReader.header.title', message: 'QRコード読み取り' })}</h1>
        <p className={common.pageHeaderDesc}>
          {translate({ id: 'qrReader.header.desc', message: 'QRコードの画像をアップロードすると、埋め込まれた文字列を解析します。すべてブラウザ内で処理されるため、画像はサーバーに送信されません。' })}
        </p>
      </div>
    </div>
  );
}

// ---- Upload Card ----

interface UploadCardProps {
  onFileSelect: (file: File) => void;
}

function UploadCard({ onFileSelect }: UploadCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
    e.dataTransfer.clearData();
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // reset so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>📁</span>
        {translate({ id: 'qrReader.upload.title', message: 'QRコード画像を選択' })}
      </h2>
      <div
        className={`${styles.dropArea} ${isDragOver ? styles.dropAreaActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        aria-label={translate({ id: 'qrReader.upload.ariaLabel', message: 'QRコード画像を選択またはドロップ' })}
      >
        <span className={styles.dropIcon}>📷</span>
        <p className={styles.dropLabel}>{translate({ id: 'qrReader.upload.dropLabel', message: 'クリックまたはドラッグ＆ドロップで画像を選択' })}</p>
        <p className={styles.dropSub}>{translate({ id: 'qrReader.upload.formats', message: '対応フォーマット: PNG / JPEG / WebP / GIF / BMP' })}</p>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="qr-reader-file-input"
        />
      </div>
    </div>
  );
}

// ---- Result Card ----

interface ResultCardProps {
  imageUrl: string;
  fileName: string;
  result: string | null;
  scanState: ScanState;
  errorMsg: string;
  onClear: () => void;
}

function ResultCard({ imageUrl, fileName, result, scanState, errorMsg, onClear }: ResultCardProps) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setSnackbar({ open: true, message: translate({ id: 'qrReader.copied', message: 'テキストをコピーしました！' }) });
    });
  }, [result]);

  const resultIsUrl = result ? isUrl(result) : false;

  return (
    <div className={common.card}>
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 className={common.cardTitle} style={{ margin: 0 }}>
          <span className={common.cardTitleIcon}>📊</span>
          {translate({ id: 'qrReader.result.title', message: '解析結果' })}
        </h2>
        <Tooltip title={translate({ id: 'common.clear', message: 'クリア' })}>
          <IconButton onClick={onClear} color="error" size="small" aria-label={translate({ id: 'common.clear', message: 'クリア' })}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* File name */}
      <div style={{
        marginBottom: '1rem',
        padding: '8px 12px',
        background: 'var(--ifm-color-emphasis-100)',
        borderRadius: '6px',
        fontSize: '0.9rem',
        color: 'var(--ifm-color-emphasis-800)',
      }}>
        {translate({ id: 'common.file', message: 'ファイル:' })} <strong>{fileName}</strong>
      </div>

      {/* Preview */}
      {imageUrl && (
        <div className={styles.previewWrap}>
          <img src={imageUrl} alt={translate({ id: 'qrReader.upload.ariaLabel', message: 'QRコード画像を選択またはドロップ' })} className={styles.previewImg} />
        </div>
      )}

      {/* Scanning state */}
      {scanState === 'scanning' && (
        <div className={styles.scanningWrap}>
          <CircularProgress size={32} sx={{ color: '#818cf8' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-700)' }}>{translate({ id: 'qrReader.result.scanning', message: '解析中...' })}</p>
          <div className={styles.scanBar} />
        </div>
      )}

      {/* Error */}
      {scanState === 'error' && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: 'var(--ifm-color-danger)',
          fontSize: '0.9rem',
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Success */}
      {scanState === 'success' && result !== null && (
        <>
          {resultIsUrl && (
            <span className={styles.urlChip}>{translate({ id: 'qrReader.result.urlDetected', message: '🔗 URL が検出されました' })}</span>
          )}
          <div className={styles.resultText} style={{ marginTop: resultIsUrl ? '0.75rem' : 0 }}>
            {result}
          </div>
          <div className={styles.resultActions}>
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
              sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, background: 'linear-gradient(135deg, #818cf8, #c084fc)', '&:hover': { background: 'linear-gradient(135deg, #6366f1, #a855f7)' } }}
            >
              {translate({ id: 'qrReader.result.copy', message: 'テキストをコピー' })}
            </Button>
            {resultIsUrl && (
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                component="a"
                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, borderColor: '#818cf8', color: '#818cf8', '&:hover': { borderColor: '#6366f1', background: 'rgba(129,140,248,0.08)' } }}
              >
                {translate({ id: 'qrReader.result.open', message: 'URLを開く' })}
              </Button>
            )}
          </div>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function QrReader(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [globalSnackbar, setGlobalSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' });

  const handleFileSelect = useCallback((file: File) => {
    // Reset state
    setResult(null);
    setErrorMsg('');
    setScanState('idle');
    if (imageUrl) URL.revokeObjectURL(imageUrl);

    if (!file.type.startsWith('image/')) {
      setGlobalSnackbar({ open: true, message: translate({ id: 'qrReader.error.notImage', message: '画像ファイルを選択してください。' }), severity: 'error' });
      return;
    }

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScanState('scanning');

    // Use HTMLImageElement to load and decode
    const img = new Image();
    img.onload = () => {
      try {
        const decoded = decodeQR(img);
        if (decoded !== null) {
          setResult(decoded);
          setScanState('success');
        } else {
          setErrorMsg(translate({ id: 'qrReader.error.notQR', message: 'QRコードが見つかりませんでした。画像が鮮明か確認してください。' }));
          setScanState('error');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg(translate({ id: 'qrReader.error.parse', message: '解析中にエラーが発生しました。' }));
        setScanState('error');
      }
    };
    img.onerror = () => {
      setErrorMsg(translate({ id: 'qrReader.error.loadImage', message: '画像の読み込みに失敗しました。' }));
      setScanState('error');
    };
    img.src = url;
  }, [imageUrl]);

  const handleClear = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
    setFileName('');
    setResult(null);
    setScanState('idle');
    setErrorMsg('');
  }, [imageUrl]);

  const showResult = scanState !== 'idle';

  return (
    <Layout title={`${translate({ id: 'qrReader.header.title', message: 'QRコード読み取り' })} | ${siteConfig.title}`} description={translate({ id: 'qrReader.header.desc', message: 'QRコードの画像をアップロードして、埋め込まれた文字列を解析します。ブラウザ内で完結するため安全です。' })}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div className={styles.container}>

            {/* Upload area */}
            <UploadCard onFileSelect={handleFileSelect} />

            {/* Result — visible once a file is selected */}
            {showResult && (
              <ResultCard
                imageUrl={imageUrl}
                fileName={fileName}
                result={result}
                scanState={scanState}
                errorMsg={errorMsg}
                onClear={handleClear}
              />
            )}

            {/* Usage guide */}
            {!showResult && (
              <div className={common.card}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>
                    <QrCodeScannerIcon sx={{ fontSize: '1.1rem', verticalAlign: 'middle' }} />
                  </span>
                  {translate({ id: 'qrReader.guide.title', message: '使い方' })}
                </h2>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 2, color: 'var(--ifm-color-emphasis-700)', fontSize: '0.92rem' }}>
                  <li>{translate({ id: 'qrReader.guide.step1', message: 'QRコードが写った画像ファイルを選択またはドラッグ＆ドロップしてください。' })}</li>
                  <li>{translate({ id: 'qrReader.guide.step2', message: '自動的にQRコードが解析され、埋め込まれたテキストが表示されます。' })}</li>
                  <li>{translate({ id: 'qrReader.guide.step3', message: '結果はコピーボタンでクリップボードにコピーできます。URLの場合は直接開くことも可能です。' })}</li>
                </ol>
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(129, 140, 248, 0.08)',
                  border: '1px solid rgba(129, 140, 248, 0.2)',
                  fontSize: '0.85rem',
                  color: 'var(--ifm-color-emphasis-700)',
                }}>
                  {translate({ id: 'qrReader.guide.security', message: '🔒 アップロードした画像はサーバーに送信されません。すべての処理はブラウザ内で完結します。' })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Global snackbar for non-file errors */}
        <Snackbar
          open={globalSnackbar.open}
          autoHideDuration={4000}
          onClose={() => setGlobalSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={globalSnackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {globalSnackbar.message}
          </Alert>
        </Snackbar>
      </MuiTheme>
    </Layout>
  );
}
