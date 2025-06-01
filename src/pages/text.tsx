import React, {useState} from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import {
  Container,
  Grid2 as Grid,
  TextField,
  Button,
  Stack,
  FormLabel,
} from '@mui/material';

/**
 * 保存するテキストの形式.
 */
type SavedText = {
  date: Date,
  text: string,
};

/**
 * 保存したテキストを文字列形式で作成する.
 * @param text 
 * @returns 
 */
const createSavedText = (text: SavedText[]) => {
  let savedText = "";
  text.forEach((v) => {
    savedText += `[${v.date.toLocaleString()}] ---------------------\n${v.text}\n\n`;
  });
  return savedText;
};

/**
 * テキストをダウンロードする.
 * @param text 
 */
const downloadText = (text: string) => {
  var date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${year}${month}${day}${hours}${minutes}${seconds}.txt`;
  a.click();
};

/**
 * プレーンテキスト作業場本体.
 */
export default function Text(): JSX.Element {

  const [state, setState] = useState<{
    workText: string, 
    savedTexts: SavedText[],
  }>({
    workText: '',
    savedTexts: [],
  });

  return (
    <Layout>
      <MuiTheme>
        <Container maxWidth='xl' sx={{marginTop: 5, marginBottom: 5}}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 12 }}>
              <h1>プレーンテキスト作業場</h1>
              <p>プレーンテキストで文章を編集するためのツールです。ブラウザ上で動作するため、ページを閉じると保存したテキストも削除されます。</p>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} spacing={2}>
              <FormLabel>作業場</FormLabel>
              <Stack spacing={2}> 
                <TextField 
                  multiline
                  fullWidth
                  value={state.workText} 
                  minRows={10}
                  onChange={(e) => {
                    setState({...state, workText: e.target.value});
                  }}
                />
                <Stack spacing={2} direction="row">  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (state.workText == "") {
                        return;
                      }
                      var savedTexts = state.savedTexts;
                      savedTexts.unshift({
                        date: new Date(),
                        text: state.workText.trim(),
                      });
                      setState({
                        ...state,
                        savedTexts,
                      });
                    }}>保存</Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (state.workText == "") {
                        return;
                      }
                      navigator.clipboard.writeText(state.workText);
                    }}>コピー</Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setState({
                        ...state,
                        workText: "",
                      });
                    }}>クリア</Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormLabel>保存したテキスト</FormLabel>
              <Stack spacing={2}> 
                <TextField
                  disabled 
                  multiline
                  fullWidth
                  minRows={10}
                  value={createSavedText(state.savedTexts)}
                />
                <Stack spacing={2} direction="row">
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      downloadText(createSavedText(state.savedTexts));
                    }}>ダウンロード</Button>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      navigator.clipboard.writeText(createSavedText(state.savedTexts));
                    }}>コピー</Button>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      setState({
                        ...state,
                        savedTexts: [],
                      });
                    }}>クリア</Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </MuiTheme>
    </Layout>
  );
};