import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Paper,
} from '@mui/material';
import { Copy, Download, Upload } from 'lucide-react';
import { JsonView, defaultStyles, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import JsonToTS from 'json-to-ts';
import MuiTheme from '../MuiTheme';
import Translate, { translate } from '@docusaurus/Translate';
import { useColorMode } from '@docusaurus/theme-common';
import styles from './styles.module.css';
import common from '@site/src/css/common.module.css';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`json-tabpanel-${index}`}
      aria-labelledby={`json-tab-${index}`}
      {...other}
      className={styles.tabPanel}
    >
      {value === index && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
}

function UploadArea({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={common.card} style={{ marginBottom: '16px' }}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>📁</span>
        <Translate id="tool.common.uploadFile">ファイルを読み込む</Translate>
      </h2>
      <div
        className={`${common.dropZone} ${isDragOver ? common.dropZoneActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload size={48} color="var(--ifm-color-primary)" className={common.dropZoneIcon} />
        <p className={common.dropZoneText}>
          {translate({ id: 'tool.jsonFormatter.upload.dropLabel', message: 'クリック・ドラッグ＆ドロップ、または貼り付けで選択' })}
        </p>
        <p className={common.dropZoneSubText}>
          {translate({ id: 'tool.jsonFormatter.upload.formats', message: '対応フォーマット: JSON, Text' })}
        </p>
        <input
          type="file"
          accept=".json,text/plain"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default function JsonFormatter() {
  const { colorMode } = useColorMode();
  const [tabValue, setTabValue] = useState(0);
  const [jsonText, setJsonText] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number | 'tab'>(2);
  const [tsInterfaces, setTsInterfaces] = useState<string>('');
  
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('jsonFormatterData');
    if (saved) {
      setJsonText(saved);
      parseAndFormat(saved, indent);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('jsonFormatterData', jsonText);
  }, [jsonText]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const parseAndFormat = (text: string, currentIndent: number | 'tab') => {
    if (!text.trim()) {
      setParsedJson(null);
      setError(null);
      setTsInterfaces('');
      return;
    }
    
    try {
      const parsed = JSON.parse(text);
      setParsedJson(parsed);
      setError(null);
      
      // Update text with correct indentation
      const space = currentIndent === 'tab' ? '\t' : currentIndent;
      const formatted = JSON.stringify(parsed, null, space);
      if (text !== formatted) {
        setJsonText(formatted);
      }

      // Generate TS Interfaces
      try {
        const types = JsonToTS(parsed).join('\n\n');
        setTsInterfaces(types);
      } catch (tsError: any) {
        setTsInterfaces('// Error generating types: ' + tsError.message);
      }

    } catch (err: any) {
      setParsedJson(null);
      setError(err.message);
      setTsInterfaces('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setJsonText(newText);
    
    try {
      if (newText.trim()) {
        const parsed = JSON.parse(newText);
        setParsedJson(parsed);
        setError(null);
        try {
          const types = JsonToTS(parsed).join('\n\n');
          setTsInterfaces(types);
        } catch(e) {}
      } else {
        setParsedJson(null);
        setError(null);
        setTsInterfaces('');
      }
    } catch (err: any) {
      setParsedJson(null);
      setError(err.message);
    }
  };

  const handleFormatClick = () => {
    parseAndFormat(jsonText, indent);
  };

  const handleMinify = () => {
    try {
      if (!jsonText.trim()) return;
      const parsed = JSON.parse(jsonText);
      const minified = JSON.stringify(parsed);
      setJsonText(minified);
      setParsedJson(parsed);
      setError(null);
    } catch (err: any) {
      showToast(translate({id: 'tool.jsonFormatter.invalidJson', message: '無効なJSONです'}), 'error');
    }
  };

  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(translate({id: 'tool.common.copied', message: 'コピーしました'}));
    });
  };

  const handleDownload = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      parseAndFormat(content, indent);
    };
    reader.readAsText(file);
  };

  const handleFileSelectRef = useRef(handleFileSelect);
  handleFileSelectRef.current = handleFileSelect;

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.name.endsWith('.json') || file.type === 'application/json' || file.type === 'text/plain')) {
            handleFileSelectRef.current(file);
            break;
          }
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString((text) => {
             try {
               JSON.parse(text);
               handleFileSelectRef.current(new File([text], 'pasted.json', { type: 'application/json' }));
             } catch(e) {
               // ignore non-json text
             }
          });
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <MuiTheme>
      <Box className={styles.container}>
        <UploadArea onFileSelect={handleFileSelect} />
        
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="indent-select-label"><Translate id="tool.jsonFormatter.indent">インデント</Translate></InputLabel>
            <Select
              labelId="indent-select-label"
              value={indent}
              label={translate({id: 'tool.jsonFormatter.indent', message: 'インデント'})}
              onChange={(e) => {
                const val = e.target.value as number | 'tab';
                setIndent(val);
                if (!error && jsonText.trim()) {
                  parseAndFormat(jsonText, val);
                }
              }}
            >
              <MenuItem value={2}>2 Spaces</MenuItem>
              <MenuItem value={4}>4 Spaces</MenuItem>
              <MenuItem value="tab">Tab</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleFormatClick} disabled={!!error || !jsonText.trim()}>
            <Translate id="tool.jsonFormatter.formatBtn">整形 (Format)</Translate>
          </Button>

          <Button variant="outlined" onClick={handleMinify} disabled={!!error || !jsonText.trim()}>
            <Translate id="tool.jsonFormatter.minifyBtn">圧縮 (Minify)</Translate>
          </Button>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="json tools tabs">
            <Tab label={<Translate id="tool.jsonFormatter.tabEditor">エディタ</Translate>} />
            <Tab label={<Translate id="tool.jsonFormatter.tabTree">ツリー表示</Translate>} disabled={!!error || !jsonText.trim()} />
            <Tab label={<Translate id="tool.jsonFormatter.tabTypes">TypeScript 型定義</Translate>} disabled={!!error || !jsonText.trim()} />
          </Tabs>
        </Box>

        <Box className={styles.tabContentWrapper}>
          <CustomTabPanel value={tabValue} index={0}>
            <TextField
              fullWidth
              multiline
              minRows={15}
              maxRows={30}
              variant="outlined"
              placeholder='{"key": "value"}'
              value={jsonText}
              onChange={handleTextChange}
              sx={{ mb: 2, fontFamily: 'monospace' }}
              InputProps={{
                sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
              }}
            />
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Translate id="tool.jsonFormatter.errorPrefix">構文エラー:</Translate> {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                startIcon={<Copy size={18} />} 
                onClick={() => handleCopy(jsonText)}
                disabled={!jsonText.trim()}
              >
                <Translate id="tool.common.copy">コピー</Translate>
              </Button>
              <Button 
                startIcon={<Download size={18} />} 
                onClick={() => handleDownload(jsonText, 'formatted.json')}
                disabled={!jsonText.trim()}
              >
                <Translate id="tool.common.download">ダウンロード</Translate>
              </Button>
            </Stack>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={1}>
            <Box className={styles.treeContainer} sx={{ 
              backgroundColor: colorMode === 'dark' ? '#1e1e1e' : '#f5f5f5',
              p: 2, 
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '600px'
            }}>
              {parsedJson && (
                <JsonView 
                  data={parsedJson} 
                  shouldExpandNode={allExpanded} 
                  style={colorMode === 'dark' ? darkStyles : defaultStyles} 
                />
              )}
            </Box>
          </CustomTabPanel>

          <CustomTabPanel value={tabValue} index={2}>
             <TextField
              fullWidth
              multiline
              minRows={15}
              maxRows={30}
              variant="outlined"
              value={tsInterfaces}
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
              }}
              sx={{ mb: 2 }}
            />
             <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                startIcon={<Copy size={18} />} 
                onClick={() => handleCopy(tsInterfaces)}
                disabled={!tsInterfaces}
              >
                <Translate id="tool.common.copy">コピー</Translate>
              </Button>
              <Button 
                startIcon={<Download size={18} />} 
                onClick={() => handleDownload(tsInterfaces, 'types.ts')}
                disabled={!tsInterfaces}
              >
                <Translate id="tool.common.download">ダウンロード</Translate>
              </Button>
            </Stack>
          </CustomTabPanel>
        </Box>

        <Snackbar
          open={toastOpen}
          autoHideDuration={3000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </MuiTheme>
  );
}

// allExpanded equivalent since react-json-view-lite might not export it directly, but we assume it does based on their docs. 
// If it doesn't, we can just use () => true.
const allExpanded = () => true;
