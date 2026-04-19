import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  TextField,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import styles from './text.module.css';

// ============================================================
// Types & Helpers
// ============================================================

type SavedText = {
  date: Date;
  text: string;
};

const pad = (n: number) => n.toString().padStart(2, '0');

const formatDate = (date: Date) =>
  `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const createSavedText = (texts: SavedText[]) =>
  texts.map((v) => `[${formatDate(v.date)}]\n${v.text}`).join('\n\n');

const downloadText = (text: string) => {
  const now = new Date();
  const filename = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ============================================================
// Sub Components
// ============================================================

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderBg}>
        <div className={styles.pageHeaderOrb1} />
        <div className={styles.pageHeaderOrb2} />
      </div>
      <div className={styles.pageHeaderContent}>
        <span className={styles.pageHeaderIcon}>📝</span>
        <h1 className={styles.pageHeaderTitle}>テキスト保存場所</h1>
        <p className={styles.pageHeaderDesc}>
          テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。
        </p>
      </div>
    </div>
  );
}

function SavedTextCard({
  savedText,
  index,
  onCopy,
  onDelete,
}: {
  savedText: SavedText;
  index: number;
  onCopy: (text: string) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div className={styles.savedItem}>
      <div className={styles.savedItemMeta}>
        <span className={styles.savedItemDate}>{formatDate(savedText.date)}</span>
        <div className={styles.savedItemActions}>
          <Tooltip title="コピー">
            <IconButton size="small" onClick={() => onCopy(savedText.text)} aria-label="コピー">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="削除">
            <IconButton size="small" onClick={() => onDelete(index)} aria-label="削除" color="error">
              <DeleteForeverIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <p className={styles.savedItemText}>{savedText.text}</p>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Text(): JSX.Element {
  const title = 'テキスト保存場所';
  const description = 'テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。';
  const { siteConfig } = useDocusaurusContext();

  const [state, setState] = useState<{
    workText: string;
    savedTexts: SavedText[];
  }>({
    workText: '',
    savedTexts: [],
  });

  const [saveOnEnter, setSaveOnEnter] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // ローカルストレージから読み込む
  useEffect(() => {
    const loadedTexts = localStorage.getItem('SavedTexts');
    if (loadedTexts !== null) {
      const parsed = JSON.parse(loadedTexts) as { date: string; text: string }[];
      const savedTexts = parsed.map((v) => ({ ...v, date: new Date(v.date) } as SavedText));
      setState((s) => ({ ...s, savedTexts }));
    }
    const loadedSaveOnEnter = localStorage.getItem('SaveOnEnter');
    if (loadedSaveOnEnter !== null) {
      setSaveOnEnter(JSON.parse(loadedSaveOnEnter));
    }
  }, []);

  // ローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('SavedTexts', JSON.stringify(state.savedTexts));
  }, [state.savedTexts]);

  useEffect(() => {
    localStorage.setItem('SaveOnEnter', JSON.stringify(saveOnEnter));
  }, [saveOnEnter]);

  const handleSave = () => {
    if (state.workText.trim() === '') return;
    setState((s) => ({
      ...s,
      workText: '',
      savedTexts: [...s.savedTexts, { date: new Date(), text: s.workText.trim() }],
    }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'コピーしました！' });
  };

  const handleDelete = (index: number) => {
    setState((s) => ({
      ...s,
      savedTexts: s.savedTexts.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteAll = () => {
    setState((s) => ({ ...s, savedTexts: [] }));
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(createSavedText(state.savedTexts));
    setSnackbar({ open: true, message: '全テキストをコピーしました！' });
  };

  const handleDownload = () => {
    downloadText(createSavedText(state.savedTexts));
  };

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />

        <div className={styles.body}>
          <div className={styles.container}>
            <div className={styles.layout}>

              {/* 入力エリア */}
              <div className={styles.inputPanel}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    <span className={styles.cardTitleIcon}>✏️</span>
                    テキストを入力
                  </h2>
                  <Stack spacing={2}>
                    <TextField
                      multiline
                      fullWidth
                      placeholder="ここにテキストを入力..."
                      value={state.workText}
                      minRows={10}
                      onChange={(e) => setState((s) => ({ ...s, workText: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing) return;
                        const isModEnter = (e.metaKey || e.ctrlKey) && e.key === 'Enter';
                        const isEnterOnly = e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
                        if ((saveOnEnter && isEnterOnly) || (!saveOnEnter && isModEnter)) {
                          e.preventDefault();
                          handleSave();
                        }
                      }}
                    />
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={state.workText.trim() === ''}
                        className={styles.saveBtn}
                      >
                        保存
                      </Button>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={saveOnEnter}
                            onChange={(e) => setSaveOnEnter(e.target.checked)}
                            size="small"
                          />
                        }
                        label={<span className={styles.checkboxLabel}>エンターで保存</span>}
                      />
                    </Stack>
                  </Stack>
                </div>
              </div>

              {/* 保存済みエリア */}
              <div className={styles.savedPanel}>
                <div className={styles.card}>
                  <div className={styles.savedCardHeader}>
                    <h2 className={styles.cardTitle}>
                      <span className={styles.cardTitleIcon}>📋</span>
                      保存済みテキスト
                      {state.savedTexts.length > 0 && (
                        <span className={styles.savedCount}>{state.savedTexts.length}</span>
                      )}
                    </h2>
                    {state.savedTexts.length > 0 && (
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="全コピー">
                          <IconButton size="small" onClick={handleCopyAll} aria-label="全コピー">
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ダウンロード">
                          <IconButton size="small" onClick={handleDownload} aria-label="ダウンロード">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="全削除">
                          <IconButton size="small" onClick={handleDeleteAll} color="error" aria-label="全削除">
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                  </div>

                  {state.savedTexts.length > 0 ? (
                    <Stack spacing={1.5}>
                      {[...state.savedTexts].reverse().map((savedText, i) => {
                        const originalIndex = state.savedTexts.length - 1 - i;
                        return (
                          <SavedTextCard
                            key={`${savedText.date.toISOString()}-${originalIndex}`}
                            savedText={savedText}
                            index={originalIndex}
                            onCopy={handleCopy}
                            onDelete={handleDelete}
                          />
                        );
                      })}
                    </Stack>
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>🗒️</span>
                      <p className={styles.emptyText}>保存されたテキストはありません</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

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
      </MuiTheme>
    </Layout>
  );
}
