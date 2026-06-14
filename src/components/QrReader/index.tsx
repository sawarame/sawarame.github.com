import React, { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from 'react';
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
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import common from '@site/src/css/common.module.css';
import MuiTheme from '@site/src/components/MuiTheme';
import styles from './styles.module.css';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function UploadCard({ onFileSelect }: { onFileSelect: (file: File) => void }) {
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
    e.target.value = '';
  };

  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>📁</span>
        {translate({ id: 'qrReader.upload.title', message: 'QRコード画像を選択' })}
      </h2>
      <div
        className={`${common.dropZone} ${isDragOver ? common.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      >
        <QrCodeScannerIcon className={common.dropZoneIcon} color="primary" sx={{ fontSize: '3rem !important' }} />
        <p className={common.dropZoneText}>{translate({ id: 'qrReader.upload.dropLabel', message: 'クリック・ドラッグ＆ドロップ、または貼り付けで選択' })}</p>
        <p className={common.dropZoneSubText}>{translate({ id: 'qrReader.upload.formats', message: '対応フォーマット: PNG, JPEG, WebP, GIF, BMP' })}</p>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

function ResultCard({ imageUrl, fileName, result, scanState, errorMsg, onClear }: { imageUrl: string; fileName: string; result: string | null; scanState: ScanState; errorMsg: string; onClear: () => void; }) {
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

      <div className={common.previewArea}>
        <div className={common.previewTitle}>
          <span className={common.previewMeta}>
            {translate({ id: 'common.file', message: 'ファイル:' })} <strong>{fileName}</strong>
          </span>
        </div>
        {imageUrl && (
          <div className={common.previewContent}>
            <img src={imageUrl} alt="Preview" className={common.previewImage} />
          </div>
        )}
      </div>

      {scanState === 'scanning' && (
        <div className={styles.scanningWrap}>
          <CircularProgress size={32} sx={{ color: '#818cf8' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-700)' }}>{translate({ id: 'qrReader.result.scanning', message: '解析中...' })}</p>
          <div className={styles.scanBar} />
        </div>
      )}

      {scanState === 'error' && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: 'var(--ifm-color-danger)',
          fontSize: '0.9rem',
          marginBottom: '1rem',
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {scanState === 'success' && result !== null && (
        <>
          {resultIsUrl && (
            <span className={styles.urlChip}>{translate({ id: 'qrReader.result.urlDetected', message: '🔗 URL が検出されました' })}</span>
          )}
          <div className={common.resultText} style={{ marginTop: resultIsUrl ? '0.75rem' : 0, marginBottom: '1rem' }}>
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

export default function QrReader(): React.JSX.Element {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [globalSnackbar, setGlobalSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' });

  const handleFileSelect = useCallback((file: File) => {
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

    const decode = async () => {
      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const codeReader = new BrowserMultiFormatReader(hints);
        
        try {
          const result = await codeReader.decodeFromImageUrl(url);
          setResult(result.getText());
          setScanState('success');
          return;
        } catch (e) {
          console.warn('Pass 1 (Original) failed:', e);
        }

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const scalePasses = [1000, 500]; 
        for (const maxDim of scalePasses) {
          if (img.naturalWidth > maxDim || img.naturalHeight > maxDim) {
            const scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth * scale;
            canvas.height = img.naturalHeight * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              try {
                const result = await codeReader.decodeFromCanvas(canvas);
                setResult(result.getText());
                setScanState('success');
                return;
              } catch (e2) {
                console.warn(`Pass 2 (Scale ${maxDim}) failed:`, e2);
              }
            }
          }
        }

        throw new Error('QR code not found in any pass');
      } catch (err: any) {
        console.error('ZXing decode completely failed:', err);
        setErrorMsg(translate({ id: 'qrReader.error.notQR', message: 'QRコードが見つかりませんでした。画像が鮮明か確認してください。' }));
        setScanState('error');
      }
    };
    decode();
  }, [imageUrl]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFileSelect]);

  const handleClear = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
    setFileName('');
    setResult(null);
    setScanState('idle');
    setErrorMsg('');
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      setImageUrl(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return '';
      });
    };
  }, []);

  return (
    <MuiTheme>
      <div className={styles.container}>
      <UploadCard onFileSelect={handleFileSelect} />

      {scanState !== 'idle' && (
        <ResultCard
          imageUrl={imageUrl}
          fileName={fileName}
          result={result}
          scanState={scanState}
          errorMsg={errorMsg}
          onClear={handleClear}
        />
      )}

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
    </div>
    </MuiTheme>
  );
}
