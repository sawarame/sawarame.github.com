import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Button,
  Stack,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import common from '@site/src/css/common.module.css';
import exifr from 'exifr';

// --- Types ---

interface ExifData {
  dateTime?: string;
  make?: string;
  model?: string;
  fNumber?: string;
  exposureTime?: string;
  iso?: string;
  gps?: string;
  resolution?: string;
}

// --- Utils ---

function formatExposureTime(time: number | undefined): string {
  if (!time) return '';
  if (time >= 1) return time.toString();
  return `1/${Math.round(1 / time)}`;
}

function formatGps(lat: number | undefined, lng: number | undefined): string {
  if (lat === undefined || lng === undefined) return '';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// --- Sub Components ---

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(161, 140, 209, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(251, 194, 235, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className={common.pageHeaderContent}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📸</span>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          margin: '0 0 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #a18cd1 60%, #fbc2eb 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>写真EXIF情報チェック</h1>
        <p className={common.pageHeaderDesc}>
          アップロードした写真からカメラ情報、撮影日時、GPSなどのメタデータを読み取ります。写真はサーバーに送信されず、すべてブラウザ内で処理されるため安全です。
        </p>
      </div>
    </div>
  );
}

function UploadArea({ onFileSelect }: { onFileSelect: (file: File) => void }) {
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>📁</span>
        写真を選択
      </h2>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        sx={{
          marginTop: '1rem',
          padding: '3rem 1rem',
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'var(--ifm-color-emphasis-300)',
          borderRadius: '12px',
          backgroundColor: isDragOver ? 'action.hover' : 'var(--ifm-background-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'primary.main',
          }
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'var(--ifm-color-emphasis-500)', marginBottom: '1rem' }} />
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--ifm-color-emphasis-800)' }}>
          クリックまたはドラッグ＆ドロップでファイルを選択
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)' }}>
          対応フォーマット: JPEG, PNG, HEIC, WEBPなど
        </p>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Box>
    </div>
  );
}

function ExifResultCard({ exifData, onClear, fileName, imageUrl }: { exifData: ExifData | null, onClear: () => void, fileName: string, imageUrl: string }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  if (!exifData) return null;

  const handleCopy = (text: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'コピーしました！' });
  };

  const renderRow = (label: string, value: string | undefined) => {
    const displayValue = value || '—';
    const isGps = label === 'GPS位置情報' && value;

    return (
      <TableRow>
        <TableCell component="th" scope="row" sx={{ color: 'var(--ifm-color-emphasis-600)', width: '40%' }}>
          {label}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'var(--ifm-color-emphasis-900)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            {isGps ? (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ifm-color-primary)', textDecoration: 'underline' }}>
                {displayValue}
              </a>
            ) : (
              <span>{displayValue}</span>
            )}
            <Tooltip title="コピー">
              <IconButton size="small" onClick={() => handleCopy(displayValue)} disabled={!value}>
                <ContentCopyIcon fontSize="small" sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className={common.card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 className={common.cardTitle} style={{ margin: 0 }}>
          <span className={common.cardTitleIcon}>📊</span>
          EXIF情報
        </h2>
        <Tooltip title="クリア">
          <IconButton onClick={onClear} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>

      <div style={{ marginBottom: '1rem', padding: '8px 12px', background: 'var(--ifm-color-emphasis-100)', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-800)' }}>
        ファイル: <strong>{fileName}</strong>
      </div>

      {imageUrl && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', background: 'var(--ifm-color-emphasis-100)', padding: '1rem', borderRadius: '8px' }}>
          <img src={imageUrl} alt="Thumbnail" style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ background: 'var(--ifm-background-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '8px', overflow: 'hidden' }}>
        <Table size="small" aria-label="exif data table" sx={{
          margin: 0,
          display: 'table',
          '& th, & td': {
            border: 'none',
            borderBottom: '1px solid var(--ifm-color-emphasis-200)'
          },
          '& tr:last-child th, & tr:last-child td': {
            borderBottom: 'none'
          }
        }}>
          <TableBody>
            {renderRow('撮影日時', exifData.dateTime)}
            {renderRow('カメラメーカー', exifData.make)}
            {renderRow('モデル名', exifData.model)}
            {renderRow('絞り（F値）', exifData.fNumber ? `f/${exifData.fNumber}` : undefined)}
            {renderRow('シャッタースピード', exifData.exposureTime ? `${exifData.exposureTime} 秒` : undefined)}
            {renderRow('ISO感度', exifData.iso)}
            {renderRow('GPS位置情報', exifData.gps)}
            {renderRow('解像度', exifData.resolution)}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}

// --- Main Page ---

export default function ExifViewer(): JSX.Element {
  const title = '写真EXIF情報チェック';
  const description = 'アップロードした写真からカメラ情報、撮影日時、GPSなどのメタデータを読み取ります。';
  const { siteConfig } = useDocusaurusContext();

  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setErrorMsg('');
    setExifData(null);
    setFileName('');
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('画像ファイルを選択してください。');
      return;
    }

    try {
      // Parse everything including GPS
      const parsed = await exifr.parse(file, true);

      if (!parsed) {
        setErrorMsg('EXIF情報が見つかりませんでした。');
        setFileName(file.name);
        return;
      }

      const data: ExifData = {
        dateTime: parsed.DateTimeOriginal ? new Date(parsed.DateTimeOriginal).toLocaleString('ja-JP') :
          (parsed.DateTime ? new Date(parsed.DateTime).toLocaleString('ja-JP') : undefined),
        make: parsed.Make,
        model: parsed.Model,
        fNumber: parsed.FNumber?.toString(),
        exposureTime: formatExposureTime(parsed.ExposureTime),
        iso: parsed.ISO?.toString(),
        gps: formatGps(parsed.latitude, parsed.longitude),
        resolution: (parsed.ExifImageWidth && parsed.ExifImageHeight) ?
          `${parsed.ExifImageWidth} x ${parsed.ExifImageHeight}` : undefined
      };

      setExifData(data);
      setFileName(file.name);
      setImageUrl(URL.createObjectURL(file));

    } catch (err) {
      console.error(err);
      setErrorMsg('ファイルの読み込みまたはEXIF解析に失敗しました。');
    }
  };

  const handleClear = () => {
    setExifData(null);
    setFileName('');
    setErrorMsg('');
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
    }
  };

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto', gap: '24px', display: 'flex', flexDirection: 'column' }}>

            <UploadArea onFileSelect={handleFileSelect} />

            {exifData && (
              <ExifResultCard exifData={exifData} onClear={handleClear} fileName={fileName} imageUrl={imageUrl} />
            )}

            <Snackbar open={!!errorMsg} autoHideDuration={5000} onClose={() => setErrorMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
              <Alert severity="error" variant="filled" onClose={() => setErrorMsg('')} sx={{ borderRadius: 2 }}>{errorMsg}</Alert>
            </Snackbar>

          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
