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
  Popover,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
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

const LINE_BREAKS = [
  { value: 'LF', label: 'LF (Unix/macOS)', char: '\n' },
  { value: 'CRLF', label: 'CRLF (Windows)', char: '\r\n' },
  { value: 'CR', label: 'CR (Classic Mac)', char: '\r' },
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
  const [currentLineBreak, setCurrentLineBreak] = useState<string>('LF');
  const [targetLineBreak, setTargetLineBreak] = useState<string>('LF');
  const [previewText, setPreviewText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // 改行コード判別
  const detectLineBreak = useCallback((bytes: Uint8Array, encoding: string): string => {
    try {
      const sampleBytes = bytes.slice(0, 10000);
      const unicodeArray = Encoding.convert(sampleBytes, {
        to: 'UNICODE',
        from: encoding === 'AUTO' ? (Encoding.detect(sampleBytes) as any) : encoding as any,
      });
      const text = Encoding.codeToString(unicodeArray);
      if (text.includes('\r\n')) return 'CRLF';
      if (text.includes('\n')) return 'LF';
      if (text.includes('\r')) return 'CR';
    } catch (e) {
      console.error('Line break detection failed', e);
    }
    return 'LF';
  }, []);

  // URL同期
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const to = params.get('to');
    if (to && ENCODINGS.some(e => e.value === to)) {
      setTargetEncoding(to);
    }
    const lb = params.get('lb');
    if (lb && LINE_BREAKS.some(l => l.value === lb)) {
      setTargetLineBreak(lb);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (targetEncoding === 'UTF8') {
      params.delete('to');
    } else {
      params.set('to', targetEncoding);
    }
    if (targetLineBreak === 'LF') {
      params.delete('lb');
    } else {
      params.set('lb', targetLineBreak);
    }
    const search = params.toString();
    history.replace({ search: search ? `?${search}` : '' });
  }, [targetEncoding, targetLineBreak]);

  const processFile = useCallback((file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      const detected = Encoding.detect(bytes) as string;
      const lb = detectLineBreak(bytes, detected || 'UTF8');
      
      setInputData({ bytes, fileName: file.name });
      setCurrentEncoding(detected || 'UTF8');
      setCurrentLineBreak(lb);
      setTargetLineBreak(lb); // デフォルトで現在の改行コードに合わせる
      setLoading(false);
    };
    reader.onerror = () => {
      setSnackbar({ open: true, message: translate({ id: 'encoding.error.read', message: 'ファイルの読み込みに失敗しました。' }), severity: 'error' });
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [detectLineBreak]);

  const processText = useCallback((text: string) => {
    const bytes = Encoding.stringToCode(text);
    const uint8 = new Uint8Array(bytes);
    const lb = detectLineBreak(uint8, 'UNICODE');
    
    setInputData({ bytes: uint8, fileName: 'pasted_text.txt' });
    setCurrentEncoding('UNICODE'); // JavaScript strings are UTF-16
    setCurrentLineBreak(lb);
    setTargetLineBreak(lb);
  }, [detectLineBreak]);

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
      // 一度 Unicode 文字列にデコードして改行コードを置換
      const unicodeArray = Encoding.convert(inputData.bytes, {
        to: 'UNICODE',
        from: currentEncoding as any,
      });
      let text = Encoding.codeToString(unicodeArray);
      
      const targetLBChar = LINE_BREAKS.find(l => l.value === targetLineBreak)?.char || '\n';
      text = text.replace(/\r\n|\r|\n/g, targetLBChar);

      // 再度ターゲットの文字コードにエンコード
      const converted = Encoding.convert(Encoding.stringToCode(text), {
        to: targetEncoding as any,
        from: 'UNICODE',
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

  const handleCorrectClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCorrectClose = () => {
    setAnchorEl(null);
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
            <DescriptionIcon className={common.dropZoneIcon} color="primary" sx={{ fontSize: '3rem !important' }} />
            <p className={common.dropZoneText}>
              {translate({ id: 'encoding.upload.dropLabel', message: 'クリック・ドラッグ＆ドロップ、または貼り付けで選択' })}
            </p>
            <p className={common.dropZoneSubText}>
              {translate({ id: 'encoding.upload.formats', message: '対応フォーマット: .txt, .csv, .log, .md, .json, etc.' })}
            </p>
          </div>

          {inputData && (
            <Stack spacing={3} sx={{ mt: 3 }}>
              {/* プレビューと判定情報 */}
              <div className={common.previewArea}>
                <div className={common.previewTitle}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    width: '100%',
                    gap: 1
                  }}>
                    {/* 左側：ファイル情報 */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ flexShrink: 0 }}>
                        <Translate id="encoding.preview.title">プレビュー</Translate>
                      </Typography>
                      <Typography 
                        variant="caption" 
                        className={common.previewMeta} 
                        sx={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          color: 'var(--ifm-color-emphasis-600)'
                        }}
                      >
                        {inputData.fileName} ({Math.round(inputData.bytes.length / 1024 * 10) / 10} KB)
                      </Typography>
                    </Stack>

                    {/* 右側：判定情報と修正ボタン */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ color: 'var(--ifm-color-emphasis-700)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {translate({ id: 'encoding.detected', message: '判別結果:' })} {DETECTABLE_ENCODINGS[currentEncoding] || currentEncoding} / {currentLineBreak}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SettingsBackupRestoreIcon sx={{ fontSize: '1rem !important' }} />}
                        sx={{ 
                          minWidth: 'auto', 
                          px: 1, 
                          py: 0.2, 
                          textTransform: 'none', 
                          fontSize: '0.7rem',
                          borderRadius: '4px',
                          borderColor: 'var(--ifm-color-emphasis-300)',
                          color: 'var(--ifm-color-emphasis-700)',
                          '&:hover': {
                            borderColor: 'var(--ifm-color-primary)',
                            backgroundColor: 'rgba(var(--ifm-color-primary-rgb), 0.04)',
                          }
                        }}
                        onClick={handleCorrectClick}
                      >
                        {translate({ id: 'encoding.button.correct', message: '修正' })}
                      </Button>
                      <Popover
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        onClose={handleCorrectClose}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                        PaperProps={{
                          sx: { p: 2, width: 280, borderRadius: 2, mt: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                          <Translate id="encoding.correct.title">判別結果の修正</Translate>
                        </Typography>
                        <Stack spacing={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel><Translate id="encoding.label.current">文字コード</Translate></InputLabel>
                            <Select
                              value={currentEncoding}
                              onChange={(e) => {
                                const newEnc = e.target.value;
                                setCurrentEncoding(newEnc);
                                setCurrentLineBreak(detectLineBreak(inputData.bytes, newEnc));
                              }}
                              label={translate({ id: 'encoding.label.current', message: '文字コード' })}
                            >
                              {Object.entries(DETECTABLE_ENCODINGS).map(([val, label]) => (
                                <MenuItem key={val} value={val}>{label}</MenuItem>
                              ))}
                              <MenuItem value="AUTO">AUTO</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl fullWidth size="small">
                            <InputLabel><Translate id="encoding.label.currentLineBreak">改行コード</Translate></InputLabel>
                            <Select
                              value={currentLineBreak}
                              onChange={(e) => setCurrentLineBreak(e.target.value)}
                              label={translate({ id: 'encoding.label.currentLineBreak', message: '改行コード' })}
                            >
                              {LINE_BREAKS.map((lb) => (
                                <MenuItem key={lb.value} value={lb.value}>{lb.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      </Popover>
                    </Box>
                  </Box>
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

                {/* 変換先改行コード設定 */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="target-lb-label">
                    <Translate id="encoding.label.targetLineBreak">変換後の改行コード</Translate>
                  </InputLabel>
                  <Select
                    labelId="target-lb-label"
                    value={targetLineBreak}
                    onChange={(e) => setTargetLineBreak(e.target.value)}
                    label={translate({ id: 'encoding.label.targetLineBreak', message: '変換後の改行コード' })}
                  >
                    {LINE_BREAKS.map((lb) => (
                      <MenuItem key={lb.value} value={lb.value}>{lb.label}</MenuItem>
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
