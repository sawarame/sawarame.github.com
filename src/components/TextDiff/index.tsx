import React, { useState, useEffect, useCallback, useRef } from 'react';
import Translate, { translate } from '@docusaurus/Translate';
import {
  Button,
  Stack,
  Typography,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Radio,
  FormControlLabel,
  RadioGroup,
  Checkbox,
  Tooltip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import CompareIcon from '@mui/icons-material/Compare';
import DifferenceIcon from '@mui/icons-material/Difference';
import ViewSideBySideIcon from '@mui/icons-material/ViewColumn';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import Encoding from 'encoding-japanese';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

interface FileData {
  id: string;
  name: string;
  content: string;
  size: number;
}

export default function TextDiff() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const muiTheme = useTheme();

  const [files, setFiles] = useState<FileData[]>([]);
  const [leftFileId, setLeftFileId] = useState<string>('');
  const [rightFileId, setRightFileId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // ファイル読み込み
  const processFile = useCallback((file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      const detected = Encoding.detect(bytes) as string;
      const unicodeArray = Encoding.convert(bytes, {
        to: 'UNICODE',
        from: detected || 'UTF8' as any,
      });
      const content = Encoding.codeToString(unicodeArray);
      
      const newFile: FileData = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: content,
        size: file.size,
      };

      setFiles(prev => {
        const next = [...prev, newFile];
        // 最初の2つのファイルを自動選択
        if (next.length === 1) setLeftFileId(newFile.id);
        if (next.length === 2) setRightFileId(newFile.id);
        return next;
      });
      setLoading(false);
    };
    reader.onerror = () => {
      setSnackbar({ open: true, message: translate({ id: 'diff.error.read', message: 'ファイルの読み込みに失敗しました。' }), severity: 'error' });
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // テキスト貼り付け
  const processText = useCallback((text: string) => {
    const newFile: FileData = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Pasted Text ${files.length + 1}`,
      content: text,
      size: new Blob([text]).size,
    };
    setFiles(prev => {
      const next = [...prev, newFile];
      if (next.length === 1) setLeftFileId(newFile.id);
      if (next.length === 2) setRightFileId(newFile.id);
      return next;
    });
  }, [files.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      Array.from(uploadedFiles).forEach(processFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles) {
      Array.from(droppedFiles).forEach(processFile);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const items = e.clipboardData?.items;
      if (!items) return;

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

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [processFile, processText]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (leftFileId === id) setLeftFileId('');
    if (rightFileId === id) setRightFileId('');
  };

  const leftFile = files.find(f => f.id === leftFileId);
  const rightFile = files.find(f => f.id === rightFileId);

  const diffStyles = {
    variables: {
      dark: {
        diffViewerBackground: 'var(--ifm-background-color)',
        diffViewerColor: 'var(--ifm-font-color-base)',
        addedBackground: 'rgba(46, 160, 67, 0.15)',
        addedColor: '#3fb950',
        removedBackground: 'rgba(248, 81, 70, 0.15)',
        removedColor: '#f85149',
        wordAddedBackground: 'rgba(46, 160, 67, 0.4)',
        wordRemovedBackground: 'rgba(248, 81, 70, 0.4)',
        addedGutterBackground: 'rgba(46, 160, 67, 0.25)',
        removedGutterBackground: 'rgba(248, 81, 70, 0.25)',
        gutterBackground: 'var(--ifm-background-surface-color)',
        gutterColor: 'var(--ifm-color-emphasis-500)',
        codeFoldGutterBackground: 'var(--ifm-background-surface-color)',
        codeFoldBackground: 'var(--ifm-background-surface-color)',
        emptyLineBackground: 'var(--ifm-background-color)',
        lineNumberColor: 'var(--ifm-color-emphasis-500)',
      },
      light: {
        diffViewerBackground: '#ffffff',
        diffViewerColor: '#24292f',
        addedBackground: '#e6ffec',
        addedColor: '#24292f',
        removedBackground: '#ffebe9',
        removedColor: '#24292f',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#ccffd8',
        removedGutterBackground: '#ffd7d5',
        gutterBackground: '#f6f8fa',
        gutterColor: '#57606a',
        codeFoldGutterBackground: '#f6f8fa',
        codeFoldBackground: '#f6f8fa',
        emptyLineBackground: '#ffffff',
        lineNumberColor: '#57606a',
      }
    }
  };

  return (
    <MuiTheme>
      <div className={styles.container}>
        <div className={common.card}>
          <h2 className={common.cardTitle}>
            <span className={common.cardTitleIcon}>📂</span>
            <Translate id="diff.upload.title">ファイルをアップロード</Translate>
          </h2>
          
          <div
            className={`${common.dropZone} ${isDragging ? common.dropZoneActive : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} multiple accept=".txt,.csv,.log,.md,.json,.js,.ts,.html,.css" />
            <DescriptionIcon className={common.dropZoneIcon} color="primary" sx={{ fontSize: '3rem !important' }} />
            <p className={common.dropZoneText}>
              <Translate id="diff.upload.dropLabel">クリック・ドラッグ＆ドロップ、または貼り付けで追加</Translate>
            </p>
            <p className={common.dropZoneSubText}>
              <Translate id="diff.upload.formats">対応フォーマット: .txt, .csv, .log, .md, .json, etc.</Translate>
            </p>
          </div>

          {files.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareIcon fontSize="small" />
                <Translate id="diff.list.title">比較対象を選択</Translate>
                <Typography variant="caption" sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary' }}>
                  ({files.length} <Translate id="diff.list.count">個のファイル</Translate>)
                </Typography>
              </Typography>
              
              <div className={styles.fileList}>
                <div className={styles.listHeader}>
                  <div className={styles.colRadio}><Translate id="diff.table.left">左 (元)</Translate></div>
                  <div className={styles.colRadio}><Translate id="diff.table.right">右 (先)</Translate></div>
                  <div className={styles.colName}><Translate id="diff.table.name">ファイル名</Translate></div>
                  <div className={styles.colSize}><Translate id="diff.table.size">サイズ</Translate></div>
                  <div className={styles.colAction}></div>
                </div>
                <div className={styles.listBody}>
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className={`${styles.listItem} ${file.id === leftFileId || file.id === rightFileId ? styles.rowSelected : ''}`}
                    >
                      <div className={styles.colRadio}>
                        <Radio
                          checked={leftFileId === file.id}
                          onChange={() => setLeftFileId(file.id)}
                          size="small"
                          color="primary"
                        />
                      </div>
                      <div className={styles.colRadio}>
                        <Radio
                          checked={rightFileId === file.id}
                          onChange={() => setRightFileId(file.id)}
                          size="small"
                          color="secondary"
                        />
                      </div>
                      <div className={styles.colName}>
                        <DescriptionIcon sx={{ fontSize: '1.2rem', color: 'text.secondary', flexShrink: 0 }} />
                        <span className={styles.fileName}>{file.name}</span>
                      </div>
                      <div className={styles.colSize}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                      <div className={styles.colAction}>
                        <IconButton size="small" onClick={() => removeFile(file.id)} color="error">
                          <DeleteIcon sx={{ fontSize: '1.2rem' }} />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {leftFile && rightFile && (
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem', fontWeight: 'bold' }}>
                      <DifferenceIcon color="primary" />
                      <Translate id="diff.viewer.title">差分比較</Translate>
                    </Typography>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <FormControlLabel
                        control={
                          <Checkbox 
                            size="small" 
                            checked={ignoreWhitespace} 
                            onChange={(e) => setIgnoreWhitespace(e.target.checked)} 
                          />
                        }
                        label={<Typography variant="body2"><Translate id="diff.options.ignoreWhitespace">空白を無視</Translate></Typography>}
                      />
                      
                      <ToggleButtonGroup
                        value={splitView}
                        exclusive
                        onChange={(_, next) => next !== null && setSplitView(next)}
                        size="small"
                        aria-label="view mode"
                      >
                        <ToggleButton value={true} aria-label="split view">
                          <Tooltip title={translate({ id: 'diff.tooltip.split', message: '2画面表示' })}>
                            <ViewSideBySideIcon fontSize="small" />
                          </Tooltip>
                        </ToggleButton>
                        <ToggleButton value={false} aria-label="unified view">
                          <Tooltip title={translate({ id: 'diff.tooltip.unified', message: '1画面表示' })}>
                            <ViewStreamIcon fontSize="small" />
                          </Tooltip>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>
                  </Box>

                  <div className={styles.diffWrapper}>
                    <ReactDiffViewer
                      oldValue={leftFile.content}
                      newValue={rightFile.content}
                      splitView={splitView}
                      compareMethod={ignoreWhitespace ? DiffMethod.TRIMMED_LINES : DiffMethod.CHARS}
                      leftTitle={`${leftFile.name} → ${rightFile.name}`}
                      rightTitle={undefined}
                      useDarkTheme={muiTheme.palette.mode === 'dark'}
                      styles={diffStyles}
                    />
                  </div>
                </Box>
              )}
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress size={32} />
            </Box>
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
