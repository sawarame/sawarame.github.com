import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';
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
  Autocomplete,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

/** 使用する文字列. */
export const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
export const upperCase = lowerCase.toLocaleUpperCase()
export const numbers = '0123456789'
export const symbols = '`~!@#$%^&*()-_[{]}=+;:\'",<.>/?\\|'

export const generatePassword = (availableSymbols: string, filterStr: string, length: number, useSameChar: boolean, useSymbols: boolean) => {
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

  const chars = numbers + lowerCase + upperCase + symbolChars;
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

export interface PasswordState {
  availableSymbols: string;
  filterStr: string;
  length: number;
  createTimes: number;
  useSameChar: boolean;
  useSymbols: boolean;
}

export const generateAll = (state: PasswordState) => {
  const result = [];
  for (let cnt = 0; cnt < state.createTimes; cnt++) {
    result.push(generatePassword(state.availableSymbols, state.filterStr, state.length, state.useSameChar, state.useSymbols));
  }
  return result;
};

function SettingsCard({ state, setState }: { state: PasswordState; setState: React.Dispatch<React.SetStateAction<PasswordState>> }) {
  const excludePresets = [
    { label: translate({ id: 'password.settings.exclude.upperCase', message: '大文字を除外' }), value: upperCase },
    { label: translate({ id: 'password.settings.exclude.lowerCase', message: '小文字を除外' }), value: lowerCase },
  ];

  return (
    <div className={common.card}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>⚙️</span>
        {translate({ id: 'password.settings.title', message: '設定' })}
      </h2>
      <div className={styles.settingsGrid}>
        <div className={styles.settingsField}>
          <TextField label={translate({ id: 'password.settings.length', message: 'パスワードの長さ' })} type="number" variant="outlined" size="small" value={state.length} fullWidth
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
          <TextField label={translate({ id: 'password.settings.count', message: '作成数' })} type="number" variant="outlined" size="small" value={state.createTimes} fullWidth
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
          <Autocomplete
            freeSolo
            size="small"
            options={excludePresets}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return option.label;
            }}
            value={excludePresets.find(p => p.value === state.filterStr) || state.filterStr}
            onInputChange={(event, newValue) => {
              const preset = excludePresets.find(p => p.label === newValue);
              setState({ ...state, filterStr: preset ? preset.value : newValue });
            }}
            onChange={(event, newValue) => {
              if (typeof newValue === 'object' && newValue !== null) {
                setState({ ...state, filterStr: newValue.value });
              } else {
                setState({ ...state, filterStr: (newValue as string) || '' });
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label={translate({ id: 'password.settings.exclude.label', message: '使用しない文字' })} placeholder={translate({ id: 'password.settings.exclude.placeholder', message: '除外したい文字を入力（直接入力可）' })} />
            )}
          />
        </div>
        <div className={styles.settingsField}>
          <FormControlLabel
            control={<Checkbox checked={state.useSymbols} onChange={(e) => setState({ ...state, useSymbols: e.target.checked })} size="small" />}
            label={translate({ id: 'password.settings.useSymbols', message: '記号を使用する' })}
          />
        </div>
        <div className={styles.settingsField}>
          <TextField label={translate({ id: 'password.settings.symbols.label', message: '使用可能な記号（空欄=全記号）' })} variant="outlined" size="small" value={state.availableSymbols} fullWidth
            disabled={!state.useSymbols}
            onChange={(e) => setState({ ...state, availableSymbols: e.target.value })} />
        </div>
        <div className={styles.settingsCheckboxes}>
          <FormControlLabel control={<Checkbox checked={state.useSameChar} onChange={(e) => setState({ ...state, useSameChar: e.target.checked })} size="small" />} label={translate({ id: 'password.settings.useSameChar', message: '同じ文字を使用する' })} />
        </div>
      </div>
    </div>
  );
}

function PasswordRow({ password, onCopy }: { password: string; onCopy: (pw: string) => void }) {
  return (
    <div className={styles.passwordRow}>
      <code className={styles.passwordText}>{password || '—'}</code>
      <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
        <IconButton size="small" onClick={() => onCopy(password)} disabled={!password} className={styles.copyBtn} aria-label={translate({ id: 'password.copy.ariaLabel', message: 'パスワードをコピー' })}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
}

function ResultCard({ passwords, onRefresh, onSave, onCopy }: { passwords: string[]; onRefresh: () => void; onSave: () => void; onCopy: (pw: string) => void }) {
  return (
    <div className={common.card}>
      <div className={styles.resultCardHeader}>
        <h2 className={common.cardTitleNoMargin}>
          <span className={common.cardTitleIcon}>🔑</span>
          {translate({ id: 'password.result.title', message: '生成されたパスワード' })}
        </h2>
        <div className={styles.resultActions}>
          <Tooltip title={translate({ id: 'password.result.regenerate', message: '再生成' })}>
            <IconButton size="small" onClick={onRefresh} aria-label={translate({ id: 'password.result.regenerate', message: '再生成' })}><RefreshIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={onSave} className={styles.saveBtn}>
            {translate({ id: 'common.save', message: '保存' })}
          </Button>
        </div>
      </div>
      <Stack spacing={1}>
        {passwords.map((pw, i) => <PasswordRow key={i} password={pw} onCopy={onCopy} />)}
      </Stack>
    </div>
  );
}

export default function PasswordGenerator() {
  const history = useHistory();
  const location = useLocation();

  const defaultState = { availableSymbols: '', filterStr: '', length: 16, createTimes: 5, useSameChar: true, useSymbols: true };
  const [state, setState] = useState(defaultState);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [isMounted, setIsMounted] = useState(false);

  // 初回マウント
  useEffect(() => {
    setIsMounted(true);
    // URLパラメータから初期状態を復元
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.toString() !== '') {
      let filterStr = searchParams.get('exclude') ?? defaultState.filterStr;
      
      // 互換性維持
      if (searchParams.get('ex_mode') === 'upper' || searchParams.get('no_upper') === 'true') {
        filterStr = upperCase;
      } else if (searchParams.get('ex_mode') === 'lower' || searchParams.get('no_lower') === 'true') {
        filterStr = lowerCase;
      }

      const newState = {
        availableSymbols: searchParams.get('symbols') ?? defaultState.availableSymbols,
        filterStr,
        length: parseInt(searchParams.get('len') || '') || defaultState.length,
        createTimes: parseInt(searchParams.get('count') || '') || defaultState.createTimes,
        useSameChar: searchParams.get('same') === 'false' ? false : 
                     searchParams.get('same') === 'true' ? true : defaultState.useSameChar,
        useSymbols: searchParams.get('use_sym') === 'false' ? false : 
                    searchParams.get('use_sym') === 'true' ? true : defaultState.useSymbols,
      };
      setState(newState);
      setPasswords(generateAll(newState));
    } else {
      setPasswords(generateAll(defaultState));
    }
  }, []);

  // 状態変更時にURL更新とパスワード再生成
  useEffect(() => {
    if (!isMounted) return;

    const params = new URLSearchParams();
    if (state.length !== defaultState.length) params.set('len', state.length.toString());
    if (state.createTimes !== defaultState.createTimes) params.set('count', state.createTimes.toString());
    if (state.filterStr !== defaultState.filterStr) params.set('exclude', state.filterStr);
    if (state.availableSymbols !== defaultState.availableSymbols) params.set('symbols', state.availableSymbols);
    if (state.useSameChar !== defaultState.useSameChar) params.set('same', state.useSameChar.toString());
    if (state.useSymbols !== defaultState.useSymbols) params.set('use_sym', state.useSymbols.toString());

    const newSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.substring(1) : location.search;
    
    if (newSearch !== currentSearch) {
      history.replace({
        search: newSearch ? `?${newSearch}` : '',
      });
    }

    setPasswords(generateAll(state));
  }, [state, isMounted]);

  const handleRefresh = () => setPasswords(generateAll(state));
  const handleCopy = (password: string) => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setSnackbar({ open: true, message: translate({ id: 'common.copied', message: 'コピーしました！' }) });
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
    <MuiTheme>
      <div className={styles.container}>
        <div className={styles.layout}>
          <div><SettingsCard state={state} setState={setState} /></div>
          <div><ResultCard passwords={passwords} onRefresh={handleRefresh} onCopy={handleCopy} onSave={handleSave} /></div>
        </div>
      </div>
      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </MuiTheme>
  );
}
