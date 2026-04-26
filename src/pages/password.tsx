import React, { useState } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/password.module.css';

/** 使用する文字列. */
const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
const upperCase = lowerCase.toLocaleUpperCase()
const numbers = '0123456789'
const symbols = '`~!@#$%^&*()-_[{]}=+;:\'",<.>/?\\|'

const generatePassword = (availableSymbols: string, filterStr: string, length: number, useSameChar: boolean, useSymbols: boolean) => {
  if (length < 1) return '';
  let symbolChars = '';
  if (useSymbols) {
    if (availableSymbols) {
      const availableSymbolsSet = new Set(availableSymbols.split(''));
      symbolChars = symbols.split('').filter(char => availableSymbolsSet.has(char)).join('');
    } else {
      symbolChars = symbols;
    }
  }
  const chars = lowerCase + upperCase + numbers + symbolChars;
  const s = chars.repeat(useSameChar ? 5 : 1);
  let a = s.split(""), b = filterStr.split(""), n = a.length;
  a = a.filter((c) => !b.includes(c));
  if (a.length < 1) return '';
  for (let i = n - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a.join("").substring(0, length);
};

const generateAll = (state) => {
  const result = [];
  for (let cnt = 0; cnt < state.createTimes; cnt++) {
    result.push(generatePassword(state.availableSymbols, state.filterStr, state.length, state.useSameChar, state.useSymbols));
  }
  return result;
};

// ============================================================
// Sub Components
// ============================================================

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div className={styles.pageHeaderOrb1} />
        <div className={styles.pageHeaderOrb2} />
      </div>
      <div className={common.pageHeaderContent}>
        <span className={styles.pageHeaderIcon}>🔐</span>
        <h1 className={styles.pageHeaderTitle}>パスワードジェネレーター</h1>
        <p className={common.pageHeaderDesc}>
          条件を指定してパスワードを作成できます。設定内容はURLに含まれるため、URLを共有することで同じ条件のパスワードを再度生成することも可能です。ブラウザ上で動作するため、作成したパスワードは安全に利用できます。
        </p>
      </div>
    </div>
  );
}

function SettingsCard({ state, setState }) {
  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>⚙️</span>
        設定
      </h2>
      <div className={styles.settingsGrid}>
        <div className={styles.settingsField}>
          <TextField label="パスワードの長さ" type="number" variant="outlined" size="small" value={state.length} fullWidth
            inputProps={{ min: 1, max: 128, style: { textAlign: 'center' } }} onChange={(e) => setState({ ...state, length: parseInt(e.target.value) || 1 })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton size="small" edge="start" onClick={() => setState({ ...state, length: Math.max(1, state.length - 1) })}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setState({ ...state, length: Math.min(128, state.length + 1) })}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </div>
        <div className={styles.settingsField}>
          <TextField label="作成数" type="number" variant="outlined" size="small" value={state.createTimes} fullWidth
            inputProps={{ min: 1, max: 20, style: { textAlign: 'center' } }} onChange={(e) => setState({ ...state, createTimes: parseInt(e.target.value) || 1 })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton size="small" edge="start" onClick={() => setState({ ...state, createTimes: Math.max(1, state.createTimes - 1) })}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setState({ ...state, createTimes: Math.min(20, state.createTimes + 1) })}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </div>
        <div className={styles.settingsField}>
          <TextField label="使用しない文字" variant="outlined" size="small" value={state.filterStr} fullWidth
            onChange={(e) => setState({ ...state, filterStr: e.target.value })} />
        </div>
        <div className={styles.settingsField}>
          <FormControlLabel
            control={<Checkbox checked={state.useSymbols} onChange={(e) => setState({ ...state, useSymbols: e.target.checked })} size="small" />}
            label="記号を使用する"
          />
        </div>
        <div className={styles.settingsField}>
          <TextField label="使用可能な記号（空欄=全記号）" variant="outlined" size="small" value={state.availableSymbols} fullWidth
            disabled={!state.useSymbols}
            onChange={(e) => setState({ ...state, availableSymbols: e.target.value })} />
        </div>
        <div className={styles.settingsCheckboxes}>
          <FormControlLabel control={<Checkbox checked={state.useSameChar} onChange={(e) => setState({ ...state, useSameChar: e.target.checked })} size="small" />} label="同じ文字を使用する" />
        </div>
      </div>
    </div>
  );
}

function PasswordRow({ password, onCopy }) {
  return (
    <div className={styles.passwordRow}>
      <code className={styles.passwordText}>{password || '—'}</code>
      <Tooltip title="コピー">
        <IconButton size="small" onClick={() => onCopy(password)} disabled={!password} className={styles.copyBtn} aria-label="パスワードをコピー">
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
}

function ResultCard({ passwords, onRefresh, onSave, onCopy }) {
  return (
    <div className={common.card}>
      <div className={styles.resultCardHeader}>
        <h2 className={common.cardTitleNoMargin}>
          <span className={common.cardTitleIcon}>🔑</span>
          生成されたパスワード
        </h2>
        <div className={styles.resultActions}>
          <Tooltip title="再生成">
            <IconButton size="small" onClick={onRefresh} aria-label="再生成"><RefreshIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={onSave} className={styles.saveBtn}>保存</Button>
        </div>
      </div>
      <Stack spacing={1}>
        {passwords.map((pw, i) => <PasswordRow key={i} password={pw} onCopy={onCopy} />)}
      </Stack>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Password(): JSX.Element {
  const title = 'パスワードジェネレーター';
  const description = '条件を指定してパスワードを作成できます。ブラウザ上で動作するため、作成したパスワードは安全に利用できます。';
  const { siteConfig } = useDocusaurusContext();

  const defaultState = { availableSymbols: '', filterStr: '', length: 16, createTimes: 5, useSameChar: true, useSymbols: true };
  const [state, setState] = useState(defaultState);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [isMounted, setIsMounted] = useState(false);

  // マウント状態の管理
  React.useEffect(() => {
    setIsMounted(true);
    setPasswords(generateAll(state));
  }, []);

  // URLパラメータから初期状態を取得
  React.useEffect(() => {
    if (!isMounted) return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.toString() === '') return;

    const newState = {
      availableSymbols: searchParams.get('symbols') ?? defaultState.availableSymbols,
      filterStr: searchParams.get('exclude') ?? defaultState.filterStr,
      length: parseInt(searchParams.get('len')) || defaultState.length,
      createTimes: parseInt(searchParams.get('count')) || defaultState.createTimes,
      useSameChar: searchParams.get('same') === 'false' ? false : 
                   searchParams.get('same') === 'true' ? true : defaultState.useSameChar,
      useSymbols: searchParams.get('use_sym') === 'false' ? false : 
                  searchParams.get('use_sym') === 'true' ? true : defaultState.useSymbols,
    };
    setState(newState);
  }, [isMounted]);

  // 状態が変更されたらURLパラメータを更新
  React.useEffect(() => {
    if (!isMounted) return;
    const params = new URLSearchParams();
    if (state.length !== defaultState.length) params.set('len', state.length.toString());
    if (state.createTimes !== defaultState.createTimes) params.set('count', state.createTimes.toString());
    if (state.filterStr !== defaultState.filterStr) params.set('exclude', state.filterStr);
    if (state.availableSymbols !== defaultState.availableSymbols) params.set('symbols', state.availableSymbols);
    if (state.useSameChar !== defaultState.useSameChar) params.set('same', state.useSameChar.toString());
    if (state.useSymbols !== defaultState.useSymbols) params.set('use_sym', state.useSymbols.toString());

    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '');
    if (window.location.search !== (newSearch ? '?' + newSearch : '')) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [state, isMounted]);

  React.useEffect(() => {
    if (!isMounted) return;
    setPasswords(generateAll(state));
  }, [state, isMounted]);

  const handleRefresh = () => setPasswords(generateAll(state));
  const handleCopy = (password: string) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setSnackbar({ open: true, message: 'コピーしました！' });
  };
  const handleSave = () => {
    const blob = new Blob([passwords.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    a.download = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div className={styles.container}>
            <div className={styles.layout}>
              <div><SettingsCard state={state} setState={setState} /></div>
              <div><ResultCard passwords={passwords} onRefresh={handleRefresh} onCopy={handleCopy} onSave={handleSave} /></div>
            </div>
          </div>
        </div>
        <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
        </Snackbar>
      </MuiTheme>
    </Layout>
  );
}