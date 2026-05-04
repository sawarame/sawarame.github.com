import React, { useState, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import {
  TextField,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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
        }}>
          {translate({ id: 'date.header.title', message: '日付比較ツール' })}
        </h1>
        <p className={common.pageHeaderDesc}>
          {translate({ id: 'date.header.desc', message: '二つの日付の差分を計算します。様々なフォーマットの日付入力に対応しています。' })}
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

    const unitDays = translate({ id: 'date.unit.days', message: '日' });
    const unitHours = translate({ id: 'date.unit.hours', message: '時間' });
    const unitMinutes = translate({ id: 'date.unit.minutes', message: '分' });
    const unitSeconds = translate({ id: 'date.unit.seconds', message: '秒' });

    const parts = [];
    if (days > 0) parts.push(`${days}${unitDays}`);
    if (hours > 0) parts.push(`${hours}${unitHours}`);
    if (minutes > 0) parts.push(`${minutes}${unitMinutes}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}${unitSeconds}`);

    diffStr = parts.join(' ');
    totalSecStr = `${totalSec}${translate({ id: 'date.unit.sec', message: '秒' })}`;
  }

  const handleCopy = (text: string) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: translate({ id: 'common.copied', message: 'コピーしました！' }) });
  };

  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>⏱️</span>
        {translate({ id: 'date.result.title', message: '差分結果' })}
      </h2>
      <Stack spacing={2} style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>
              {translate({ id: 'date.result.dayLabel', message: '日時分秒' })}
            </span>
            <code style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'transparent', padding: 0, border: 'none', color: 'var(--ifm-color-primary)' }}>{diffStr}</code>
          </div>
          <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
            <IconButton size="small" onClick={() => handleCopy(diffStr)} disabled={!isValid}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--ifm-background-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>
              {translate({ id: 'date.result.totalSec', message: '総秒数' })}
            </span>
            <code style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'transparent', padding: 0, border: 'none', color: 'var(--ifm-color-primary)' }}>{totalSecStr}</code>
          </div>
          <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
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
  const { siteConfig } = useDocusaurusContext();

  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [alwaysCurrent, setAlwaysCurrent] = useState(false);

  const datePickerRef1 = useRef<HTMLInputElement>(null);
  const datePickerRef2 = useRef<HTMLInputElement>(null);

  // Set default state safely
  useEffect(() => {
    const now = new Date();
    setDate1(formatDate(now));
    setDate2('');
  }, []);

  // Update date1 continuously if alwaysCurrent is true
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (alwaysCurrent) {
      setDate1(formatDate(new Date()));
      timer = setInterval(() => {
        setDate1(formatDate(new Date()));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [alwaysCurrent]);

  return (
    <Layout
      title={`${translate({ id: 'date.header.title', message: '日付比較ツール' })} | ${siteConfig.title}`}
      description={translate({ id: 'date.header.desc', message: '二つの日付の差分を計算します。様々なフォーマットの日付入力に対応しています。' })}
    >
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div style={{ maxWidth: '800px', margin: '0 auto', gap: '24px', display: 'flex', flexDirection: 'column' }}>
            
            <div className={common.card}>
              <h2 className={common.cardTitle}>
                <span className={common.cardTitleIcon}>📅</span>
                {translate({ id: 'date.input.title', message: '比較する日付' })}
              </h2>
              <Stack spacing={3} style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={alwaysCurrent}
                        onChange={(e) => setAlwaysCurrent(e.target.checked)}
                        size="small"
                      />
                    }
                    label={<span style={{ fontSize: '0.85rem' }}>{translate({ id: 'date.input.alwaysCurrent', message: '常に現在時刻と比較' })}</span>}
                  />
                  <TextField
                    label="Date 1"
                    variant="outlined"
                    fullWidth
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                    disabled={alwaysCurrent}
                    helperText={parseCustomDate(date1) ? formatDate(parseCustomDate(date1)!) : ' '}
                    placeholder="2026/1/1 12:00:00, UNIXTIME, etc."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={() => datePickerRef1.current?.showPicker()} 
                            edge="end"
                            disabled={alwaysCurrent}
                          >
                            <CalendarMonthIcon />
                          </IconButton>
                          <input 
                            type="datetime-local" 
                            step="1"
                            ref={datePickerRef1} 
                            onChange={(e) => {
                              if (e.target.value) {
                                setDate1(formatDate(new Date(e.target.value)));
                              }
                            }} 
                            style={{ width: 0, height: 0, border: 0, padding: 0, visibility: 'hidden', position: 'absolute' }} 
                          />
                        </InputAdornment>
                      )
                    }}
                  />
                </div>
                <TextField
                  label="Date 2"
                  variant="outlined"
                  fullWidth
                  value={date2}
                  onChange={(e) => setDate2(e.target.value)}
                  helperText={parseCustomDate(date2) ? formatDate(parseCustomDate(date2)!) : ' '}
                  placeholder="2026/1/1 12:00:00, UNIXTIME, etc."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => datePickerRef2.current?.showPicker()} edge="end">
                          <CalendarMonthIcon />
                        </IconButton>
                        <input 
                          type="datetime-local" 
                          step="1"
                          ref={datePickerRef2} 
                          onChange={(e) => {
                            if (e.target.value) {
                              setDate2(formatDate(new Date(e.target.value)));
                            }
                          }} 
                          style={{ width: 0, height: 0, border: 0, padding: 0, visibility: 'hidden', position: 'absolute' }} 
                        />
                      </InputAdornment>
                    )
                  }}
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
