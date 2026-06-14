import React, { useState, useRef, DragEvent, ChangeEvent, useEffect, useCallback } from 'react';
import { useHistory } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';
import {
  Button,
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
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import MuiTheme from '@site/src/components/MuiTheme';
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

export function formatExposureTime(time: number | undefined): string {
  if (!time) return '';
  if (time >= 1) return time.toString();
  return `1/${Math.round(1 / time)}`;
}

export function formatGps(lat: number | undefined, lng: number | undefined): string {
  if (lat === undefined || lng === undefined) return '';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// --- Sub Components ---

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
        {translate({ id: 'exif.upload.title', message: '写真を選択' })}
      </h2>
      <div
        className={`${common.dropZone} ${isDragOver ? common.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <AddPhotoAlternateIcon className={common.dropZoneIcon} color="primary" sx={{ fontSize: '3rem !important' }} />
        <p className={common.dropZoneText}>
          {translate({ id: 'exif.upload.dropLabel', message: 'クリック・ドラッグ＆ドロップ、または貼り付けで選択' })}
        </p>
        <p className={common.dropZoneSubText}>
          {translate({ id: 'exif.upload.formats', message: '対応フォーマット: JPEG, PNG, WebP, etc.' })}
        </p>
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

function ExifResultCard({ exifData, onClear, fileName, imageUrl, originalFile }: { exifData: ExifData | null, onClear: () => void, fileName: string, imageUrl: string, originalFile: File | null }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const history = useHistory();

  if (!originalFile) return null;

  const handleCopy = (text: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: translate({ id: 'common.copied', message: 'コピーしました！' }) });
  };

  const renderRow = (label: string, value: string | undefined) => {
    const displayValue = value || '—';
    const isGps = label === translate({ id: 'exif.result.gps', message: 'GPS位置情報' }) && value;

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
            <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
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
          {translate({ id: 'exif.result.title', message: 'EXIF情報' })}
        </h2>
        <Tooltip title={translate({ id: 'common.clear', message: 'クリア' })}>
          <IconButton onClick={onClear} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>

      <div className={common.previewArea}>
        <div className={common.previewTitle}>
          <span className={common.previewMeta} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>{translate({ id: 'common.file', message: 'ファイル:' })} <strong>{fileName}</strong></span>
            {originalFile && (
              <a
                href="/resize"
                onClick={(e) => {
                  e.preventDefault();
                  history.push('/resize', { file: originalFile });
                }}
                style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--ifm-color-primary)', textDecoration: 'none' }}
              >
                ✨ {exifData 
                     ? translate({ id: 'exif.result.removeExifLink', message: 'Exif情報を消すことができます' })
                     : translate({ id: 'exif.result.changeFormatLink', message: '画像のフォーマットを変更することができます' })}
              </a>
            )}
          </span>
        </div>
        {imageUrl && (
          <div className={common.previewContent}>
            <img src={imageUrl} alt="Thumbnail" className={common.previewImage} />
          </div>
        )}
      </div>

      {exifData ? (
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
              {renderRow(translate({ id: 'exif.result.dateTime', message: '撮影日時' }), exifData.dateTime)}
              {renderRow(translate({ id: 'exif.result.make', message: 'カメラメーカー' }), exifData.make)}
              {renderRow(translate({ id: 'exif.result.model', message: 'モデル名' }), exifData.model)}
              {renderRow(translate({ id: 'exif.result.fNumber', message: '絞り（F値）' }), exifData.fNumber ? `f/${exifData.fNumber}` : undefined)}
              {renderRow(translate({ id: 'exif.result.exposureTime', message: 'シャッタースピード' }), exifData.exposureTime ? `${exifData.exposureTime} ${translate({ id: 'exif.result.sec', message: '秒' })}` : undefined)}
              {renderRow(translate({ id: 'exif.result.iso', message: 'ISO感度' }), exifData.iso)}
              {renderRow(translate({ id: 'exif.result.gps', message: 'GPS位置情報' }), exifData.gps)}
              {renderRow(translate({ id: 'exif.result.resolution', message: '解像度' }), exifData.resolution)}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', background: 'var(--ifm-color-emphasis-100)', borderRadius: '8px', fontWeight: 600 }}>
          {translate({ id: 'exif.result.noExifData', message: 'この画像にはEXIF情報が含まれていません。' })}
        </div>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}

export default function ExifViewer(): JSX.Element {
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setErrorMsg('');
    setExifData(null);
    setFileName('');
    setOriginalFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg(translate({ id: 'exif.error.notImage', message: '画像ファイルを選択してください。' }));
      return;
    }

    try {
      // Parse everything including GPS
      const parsed = await exifr.parse(file, true);

      if (!parsed) {
        setFileName(file.name);
        setOriginalFile(file);
        setImageUrl(URL.createObjectURL(file));
        return;
      }

      const data: ExifData = {
        dateTime: parsed.DateTimeOriginal ? new Date(parsed.DateTimeOriginal).toLocaleString() :
          (parsed.DateTime ? new Date(parsed.DateTime).toLocaleString() : undefined),
        make: parsed.Make,
        model: parsed.Model,
        fNumber: parsed.FNumber?.toString(),
        exposureTime: formatExposureTime(parsed.ExposureTime),
        iso: parsed.ISO?.toString(),
        gps: formatGps(parsed.latitude, parsed.longitude),
        resolution: (parsed.ExifImageWidth && parsed.ExifImageHeight) ?
          `${parsed.ExifImageWidth} x ${parsed.ExifImageHeight}` : undefined
      };

      const hasAnyValue = Object.values(data).some(v => v !== undefined && v !== '');

      if (!hasAnyValue) {
        setFileName(file.name);
        setOriginalFile(file);
        setImageUrl(URL.createObjectURL(file));
        return;
      }

      setExifData(data);
      setFileName(file.name);
      setOriginalFile(file);
      setImageUrl(URL.createObjectURL(file));

    } catch (err) {
      console.error(err);
      setErrorMsg(translate({ id: 'exif.error.parse', message: 'ファイルの読み込みまたはEXIF解析に失敗しました。' }));
    }
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

  const handleClear = () => {
    setExifData(null);
    setFileName('');
    setErrorMsg('');
    setOriginalFile(null);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl('');
    }
  };

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
      <div style={{ width: '100%', margin: '0 auto', gap: '24px', display: 'flex', flexDirection: 'column' }}>
      <UploadArea onFileSelect={handleFileSelect} />

      {originalFile && (
        <ExifResultCard exifData={exifData} onClear={handleClear} fileName={fileName} imageUrl={imageUrl} originalFile={originalFile} />
      )}

      <Snackbar open={!!errorMsg} autoHideDuration={5000} onClose={() => setErrorMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setErrorMsg('')} sx={{ borderRadius: 2 }}>{errorMsg}</Alert>
      </Snackbar>
    </div>
    </MuiTheme>
  );
}
