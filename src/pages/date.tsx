import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  TextField,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import common from '@site/src/css/common.module.css';

// --- Date Utils ---

function parseCustomDate(input: string): Date | null {
  if (!input) return null;
  const str = input.trim();

  // Try parsing purely numeric string as Unix time (seconds or milliseconds)
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    // Defaults: <= 10 digits is seconds, else ms
    if (str.length <= 10) {
      return new Date(num * 1000);
    } else {
      return new Date(num);
    }
  }

  // Normalize Japanese formatting to slash/colon separators
  let normalizedStr = str
    .replace(/年/g, '/')
    .replace(/月/g, '/')
    .replace(/日/g, ' ')
    .replace(/時/g, ':')
    .replace(/分/g, ':')
    .replace(/秒/g, '');

  // Normalize hyphens to slashes so new Date() parses it as local time instead of UTC (for YYYY-MM-DD formats)
  normalizedStr = normalizedStr.replace(/-/g, '/');

  const parsed = new Date(normalizedStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Fallback to standard Date string parsing
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

// --- Sub Components ---

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        {/* Reusing existing common styles, adjusting inline slightly for layout */}
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(246, 211, 101, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(253, 160, 133, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className={common.pageHeaderContent}>
        <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>🗓️</span>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          margin: '0 0 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #ffecd2 60%, #fcb69f 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>日付比較ツール</h1>
        <p className={common.pageHeaderDesc}>
          二つの日付の差分を計算します。様々なフォーマットの日付入力に対応しています。
        </p>
      </div>
    </div>
  );
}

function DiffResultCard({ date1Str, date2Str }: { date1Str: string, date2Str: string }) {
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const d1 = parseCustomDate(date1Str);
  const d2 = parseCustomDate(date2Str);

  const isValid = d1 && d2;
  let diffStr = '—';
  let totalSecStr = '—';

  if (isValid) {
    let diffMs = Math.abs(d2!.getTime() - d1!.getTime());
    const totalSec = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSec / (24 * 3600));
    diffMs -= days * 24 * 3600 * 1000;
    
    const hours = Math.floor(diffMs / (3600 * 1000));
    diffMs -= hours * 3600 * 1000;

    const minutes = Math.floor(diffMs / (60 * 1000));
    diffMs -= minutes * 60 * 1000;

    const seconds = Math.floor(diffMs / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}日`);
    if (hours > 0) parts.push(`${hours}時間`);
    if (minutes > 0) parts.push(`${minutes}分`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`); // Always show seconds if 0 diff

    diffStr = parts.join(' ');
    totalSecStr = `${totalSec}秒`;
  }

  const handleCopy = (text: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'コピーしました！' });
  };

  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>⏱️</span>
        差分結果
      </h2>
      <Stack spacing={2} style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>日時分秒</span>
            <code style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'transparent', padding: 0, border: 'none', color: 'var(--ifm-color-primary)' }}>{diffStr}</code>
          </div>
          <Tooltip title="コピー">
            <IconButton size="small" onClick={() => handleCopy(diffStr)} disabled={!isValid}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>総秒数</span>
            <code style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'transparent', padding: 0, border: 'none', color: 'var(--ifm-color-primary)' }}>{totalSecStr}</code>
          </div>
          <Tooltip title="コピー">
            <IconButton size="small" onClick={() => handleCopy(totalSecStr)} disabled={!isValid}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </Stack>

      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}

// --- Main Page ---

export default function DateComparison(): JSX.Element {
  const title = '日付比較ツール';
  const description = '二つの日付の差分を計算します。様々なフォーマットの日付入力に対応しています。';
  const { siteConfig } = useDocusaurusContext();

  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');

  // Removed handleBlur


  // Set default state safely
  useEffect(() => {
    const now = new Date();
    setDate1(formatDate(now));
    setDate2('');
  }, []);

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto', gap: '24px', display: 'flex', flexDirection: 'column' }}>
            
            <div className={common.card}>
              <h2 className={common.cardTitle}>
                <span className={common.cardTitleIcon}>📅</span>
                比較する日付
              </h2>
              <Stack spacing={3} style={{ marginTop: '1rem' }}>
                <TextField
                  label="Date 1"
                  variant="outlined"
                  fullWidth
                  value={date1}
                  onChange={(e) => setDate1(e.target.value)}
                  helperText={parseCustomDate(date1) ? formatDate(parseCustomDate(date1)!) : ' '}
                  placeholder="2026/1/1 12:00:00, UNIXTIME, etc."
                />
                <TextField
                  label="Date 2"
                  variant="outlined"
                  fullWidth
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  helperText={parseCustomDate(date2) ? formatDate(parseCustomDate(date2)!) : ' '}
                  placeholder="2026/1/1 12:00:00, UNIXTIME, etc."
                />
              </Stack>
            </div>

            <DiffResultCard date1Str={date1} date2Str={date2} />

          </div>
        </div>
      </MuiTheme>
    </Layout>
  );
}
