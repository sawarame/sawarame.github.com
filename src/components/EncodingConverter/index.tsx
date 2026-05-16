import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import Translate, { translate } from '@docusaurus/Translate';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import Encoding from 'encoding-japanese';
import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

const ENCODINGS = [
  { value: 'UTF8', label: 'UTF-8' },
  { value: 'SJIS', label: 'Shift_JIS' },
  { value: 'EUCJP', label: 'EUC-JP' },
  { value: 'JIS', label: 'ISO-2022-JP (JIS)' },
  { value: 'UNICODE', label: 'UTF-16' },
];

const DETECTABLE_ENCODINGS: Record<string, string> = {
  'UTF8': 'UTF-8',
  'SJIS': 'Shift_JIS',
  'EUCJP': 'EUC-JP',
  'JIS': 'ISO-2022-JP (JIS)',
  'UNICODE': 'UTF-16',
  'ASCII': 'ASCII',
  'BINARY': 'Binary',
};

export default function EncodingConverter() {
  const history = useHistory();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputData, setInputData] = useState<{ bytes: Uint8Array; fileName: string } | null>(null);
  const [currentEncoding, setCurrentEncoding] = useState<string>('AUTO');
  const [targetEncoding, setTargetEncoding] = useState<string>('UTF8');
  const [previewText, setPreviewText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // URL同期
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const to = params.get('to');
    if (to && ENCODINGS.some(e => e.value === to)) {
      setTargetEncoding(to);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (targetEncoding === 'UTF8') {
      params.delete('to');
    } else {
      params.set('to', targetEncoding);
    }
    const search = params.toString();
    history.replace({ search: search ? `?${search}` : '' });
  }, [targetEncoding]);

  const processFile = useCallback((file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      const detected = Encoding.detect(bytes) as string;
      
      setInputData({ bytes, fileName: file.name });
      setCurrentEncoding(detected || 'UTF8');
      setLoading(false);
    };
    reader.onerror = () => {
      setSnackbar({ open: true, message: translate({ id: 'encoding.error.read', message: 'ファイルの読み込みに失敗しました。' }), severity: 'error' });
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const processText = useCallback((text: string) => {
    const bytes = Encoding.stringToCode(text);
    const uint8 = new Uint8Array(bytes);
    setInputData({ bytes: uint8, fileName: 'pasted_text.txt' });
    setCurrentEncoding('UNICODE'); // JavaScript strings are UTF-16
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          return;
        }
      }
    }
    const text = e.clipboardData.getData('text');
    if (text) processText(text);
  };

  useEffect(() => {
    if (!inputData) {
      setPreviewText('');
      return;
    }

    try {
      // プレビュー用に変換（最大10KB）
      const previewBytes = inputData.bytes.slice(0, 10000);
      const unicodeArray = Encoding.convert(previewBytes, {
        to: 'UNICODE',
        from: currentEncoding as any,
      });
      setPreviewText(Encoding.codeToString(unicodeArray));
    } catch (err) {
      setPreviewText(translate({ id: 'encoding.error.preview', message: 'プレビューの生成に失敗しました。文字コード設定を確認してください。' }));
    }
  }, [inputData, currentEncoding]);

  const handleDownload = () => {
    if (!inputData) return;

    try {
      const converted = Encoding.convert(inputData.bytes, {
        to: targetEncoding as any,
        from: currentEncoding as any,
      });
      const uint8 = new Uint8Array(converted);
      const blob = new Blob([uint8], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const extIndex = inputData.fileName.lastIndexOf('.');
      const name = extIndex !== -1 ? inputData.fileName.substring(0, extIndex) : inputData.fileName;
      const ext = extIndex !== -1 ? inputData.fileName.substring(extIndex) : '.txt';
      
      link.href = url;
      link.download = `${name}_${targetEncoding}${ext}`;
      link.click();
      URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: translate({ id: 'encoding.success.download', message: '変換して保存しました。' }), severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: translate({ id: 'encoding.error.convert', message: '変換に失敗しました。' }), severity: 'error' });
    }
  };

  return (
    <MuiTheme>
      <div className={styles.container} onPaste={handlePaste}>
        <div className={common.card}>
          <h2 className={common.cardTitle}>
            <span className={common.cardTitleIcon}>📄</span>
            {translate({ id: 'encoding.upload.title', message: 'テキストを選択' })}
          </h2>
          {/* アップロードエリア */}
          <div
            className={`${common.dropZone} ${isDragging ? common.dropZoneActive : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".txt,.csv,.log,.md,.json,.js,.ts,.html,.css" />
            <DescriptionIcon className={common.dropZoneIcon} color="primary" />
            <p className={common.dropZoneText}>
              <Translate id="encoding.upload.main" values={{ br: <br /> }}>
                {'ファイルをドロップするか、{br}ここをクリックして選択、またはペースト'}
              </Translate>
            </p>
            <p className={common.dropZoneSubText}>
              <Translate id="encoding.upload.sub">テキストファイルやコピーしたテキストに対応しています</Translate>
            </p>
          </div>

          {inputData && (
            <Stack spacing={3} sx={{ mt: 3 }}>
              {/* プレビュー */}
              <div className={common.previewArea}>
                <div className={common.previewTitle}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    <Translate id="encoding.preview.title">プレビュー</Translate>
                  </Typography>
                  <span className={common.previewMeta}>
                    {inputData.fileName} ({Math.round(inputData.bytes.length / 1024 * 10) / 10} KB)
                  </span>
                </div>
                <div className={common.previewContent}>
                  <div className={common.previewText}>
                    {loading ? (
                      <Box display="flex" justifyContent="center" p={2}><CircularProgress size={24} /></Box>
                    ) : previewText}
                  </div>
                </div>
              </div>

              <div className={styles.configGrid}>
                {/* 現在の文字コード設定（手動修正用） */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="current-encoding-label">
                    <Translate id="encoding.label.current">現在の文字コード (自動判別)</Translate>
                  </InputLabel>
                  <Select
                    labelId="current-encoding-label"
                    value={currentEncoding}
                    onChange={(e) => setCurrentEncoding(e.target.value)}
                    label={translate({ id: 'encoding.label.current', message: '現在の文字コード (自動判別)' })}
                  >
                    {Object.entries(DETECTABLE_ENCODINGS).map(([val, label]) => (
                      <MenuItem key={val} value={val}>{label}</MenuItem>
                    ))}
                    <MenuItem value="AUTO">AUTO</MenuItem>
                  </Select>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, ml: 1 }}>
                    {translate({ id: 'encoding.detected', message: '判別結果:' })} {DETECTABLE_ENCODINGS[Encoding.detect(inputData.bytes) as string] || 'Unknown'}
                  </Typography>
                </FormControl>

                {/* 変換先文字コード設定 */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="target-encoding-label">
                    <Translate id="encoding.label.target">変換後の文字コード</Translate>
                  </InputLabel>
                  <Select
                    labelId="target-encoding-label"
                    value={targetEncoding}
                    onChange={(e) => setTargetEncoding(e.target.value)}
                    label={translate({ id: 'encoding.label.target', message: '変換後の文字コード' })}
                  >
                    {ENCODINGS.map((enc) => (
                      <MenuItem key={enc.value} value={enc.value}>{enc.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* ダウンロードボタン */}
              <div className={styles.actionArea}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<FileDownloadIcon />}
                  className={styles.downloadBtn}
                  onClick={handleDownload}
                >
                  <Translate id="encoding.button.download">変換してダウンロード</Translate>
                </Button>
              </div>
            </Stack>
          )}
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MuiTheme>
  );
}
