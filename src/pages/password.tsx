import React, {useState} from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Container,
  Grid2 as Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Button,
  Stack,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/** 使用する文字列. */
const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
const upperCase = lowerCase.toLocaleUpperCase()
const numbers = '0123456789'
const symbols = '`~!@#$%^&*()-_[{]}=+;:\'",<.>/?\\|'

/**
 * パスワードを作成する.
 * 
 * @param availableSymbols 使用可能な記号の文字列
 * @param filterStr 使用しない文字
 * @param length パスワードの長さ
 * @param useSameChar 同じ文字を使用するかどうか
 * @param useSymbols 記号を使用するかどうか
 * @returns 
 */
const generatePassword = (availableSymbols: string, filterStr: string, length: number, useSameChar: boolean, useSymbols: boolean) => {

  if (length < 1) {
    return '';
  }

  // 使用する記号を決定する
  let symbolChars = '';
  if (useSymbols) {
    // availableSymbols が指定されている場合、デフォルトの記号セットとの共通部分を使う
    if (availableSymbols) {
      const availableSymbolsSet = new Set(availableSymbols.split(''));
      symbolChars = symbols.split('').filter(char => availableSymbolsSet.has(char)).join('');
    } else {
      // availableSymbols が指定されていない場合、デフォルトの記号セットをすべて使う
      symbolChars = symbols;
    }
  }

  const chars = lowerCase + upperCase + numbers + symbolChars;

  const s = chars.repeat(useSameChar? 5 : 1);

  let a = s.split(""),
      b = filterStr.split(""),
      n = a.length;

  // フィルタ文字を削除
  a = a.filter((c) => !b.includes(c));

  if (a.length < 1) {
    return '';
  }

  // ランダムに並び替え
  for(let i = n - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
  }
  return a.join("").substring(0, length);
}


/**
 * パスワードを設定したテキストエリア.
 */
const PasswordTextField = ({
  passwords,
}) => {
  return (
    <Stack spacing={2}>
      {passwords.map((password, index) => (
        <Stack direction="row" spacing={1} key={index}>
          <Button
            variant="outlined"
            onClick={() => navigator.clipboard.writeText(password)}
            aria-label="パスワードをコピー">
            <ContentCopyIcon />
          </Button>
          <TextField
            value={password}
            fullWidth
            disabled
          />
        </Stack>
      ))}
    </Stack>
  );
};

/**
 * パスワードジェネレーター本体.
 */
export default function Password(): JSX.Element {
  const title = 'パスワードジェネレーター';
  const description = '条件を指定してパスワードを作成できます。ブラウザ上で動作するため、作成したパスワードは安全に利用できます。';
  const {siteConfig} = useDocusaurusContext();
  const [state, setState] = useState({
    availableSymbols: '',
    filterStr: '',
    length: 16,
    createTimes: 5,
    useSameChar: true,
    useSymbols: true,
  });
  const [passwords, setPasswords] = useState([]);

  React.useEffect(() => {
    const newPasswords = [];
    for (let cnt = 0; cnt < state.createTimes; cnt++) {
      newPasswords.push(
        generatePassword(
          state.availableSymbols,
          state.filterStr,
          state.length,
          state.useSameChar,
          state.useSymbols
        )
      );
    }
    setPasswords(newPasswords);
  }, [state]);

  const handleSave = () => {
    const content = passwords.join('\n');
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = (now.getMonth() + 1).toString().padStart(2, '0');
    const DD = now.getDate().toString().padStart(2, '0');
    const HH = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const SS = now.getSeconds().toString().padStart(2, '0');
    a.download = `${YYYY}${MM}${DD}${HH}${mm}${SS}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout
      title={`${title} ${siteConfig.title}`}
      description={description}
    >
      <MuiTheme>
        <Container maxWidth='xl' sx={{marginTop: 5, marginBottom: 5}}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              <h1>{title}</h1>
              <p>{description}</p>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                label="パスワードの長さ" 
                type='number'
                variant="standard"
                defaultValue={state.length}
                fullWidth
                onChange={(e) => {
                  setState({...state, length: parseInt(e.target.value)});
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                label="作成数" 
                type='number'
                variant="standard"
                defaultValue={state.createTimes}
                fullWidth
                onChange={(e) => {
                  setState({...state, createTimes: parseInt(e.target.value)});
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                label="使用しない文字" 
                variant="standard"
                defaultValue={state.filterStr}
                fullWidth
                onChange={(e) => {
                  setState({...state, filterStr: e.target.value});
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel control={<Checkbox
                  checked={state.useSameChar}
                  onChange={(e) => {
                    setState({...state, useSameChar: e.target.checked});
                  }}
                />} label='同じ文字を使用する' />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel control={<Checkbox
                  checked={state.useSymbols}
                  onChange={(e) => {
                    setState({...state, useSymbols: e.target.checked});
                  }}
                />} label='記号を使用する' />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField 
                label="使用可能な記号" 
                variant="standard"
                defaultValue={state.availableSymbols}
                fullWidth
                onChange={(e) => {
                  setState({...state, availableSymbols: e.target.value});
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 12 }}>
              <FormLabel>作成したパスワード</FormLabel>
              <PasswordTextField passwords={passwords} />
            </Grid>

            <Grid size={{ xs: 12, md: 12 }}>
              <Button variant="outlined" onClick={handleSave}>ファイルに保存</Button>
            </Grid>
            
          </Grid>
        </Container>
      </MuiTheme>
    </Layout>
  );
};