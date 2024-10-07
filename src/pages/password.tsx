import React, {useState} from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import {
  Container,
  Grid2 as Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  FormLabel,
} from '@mui/material';

/** 使用する文字列. */
const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
const upperCase = lowerCase.toLocaleUpperCase()
const numbers = '0123456789'
const symbols = '`~!@#$%^&*()-_[{]}=+;:\'",<.>/?\\|'

/**
 * パスワードを作成する.
 * 
 * @param filterStr 使用しない文字
 * @param length パスワードの長さ
 * @param useSameChar 同じ文字を使用するかどうか
 * @param useSymbols 同じ文字を使用するかどうか
 * @returns 
 */
const generatePassword = (filterStr: string, length: number, useSameChar: boolean, useSymbols: boolean) => {

  if (length < 1) {
    return '';
  }

  const chars = useSymbols 
    ? lowerCase + upperCase + numbers + symbols
    : lowerCase + upperCase + numbers;

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
  filterStr,
  length,
  createTimes,
  useSameChar,
  useSymbols,
}) => {

  let passwords = [];
  for(let cnt = 0; cnt < createTimes; cnt++) {
    passwords.push(generatePassword(filterStr, length, useSameChar, useSymbols));
  }

  return (
    <TextField 
      disabled
      multiline
      fullWidth
      value={passwords.join(`\n`)}
    />
  );
};

/**
 * パスワードジェネレーター本体.
 */
export default function Password(): JSX.Element {
   
  const [state, setState] = useState({
    filterStr: '',
    length: 16,
    createTimes: 5,
    useSameChar: true,
    useSymbols: true,
  });

  return (
    <Layout>
      <MuiTheme>
        <Container maxWidth='xl' sx={{marginTop: 5, marginBottom: 5}}>
          <Grid container spacing={2}>
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

            <Grid size={{ xs: 12, md: 12 }}>
              <FormLabel>作成したパスワード</FormLabel>
              <PasswordTextField
                filterStr={state.filterStr}
                length={state.length}
                createTimes={state.createTimes}
                useSameChar={state.useSameChar}
                useSymbols={state.useSymbols}
              />
            </Grid>
            
          </Grid>
        </Container>
      </MuiTheme>
    </Layout>
  );
};