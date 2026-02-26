import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Container,
  Grid2 as Grid,
  TextField,
  Button,
  Stack,
  FormLabel,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

/**
 * 保存するテキストの形式.
 */
type SavedText = {
  date: Date,
  text: string,
};

const pad = (n: number) => n.toString().padStart(2, '0');

/**
 * 保存したテキストを文字列形式で作成する.
 * @param text 
 * @returns 
 */
const createSavedText = (text: SavedText[]) => {
  let savedText = "";
  text.forEach((v) => {
    
    const year = v.date.getFullYear();
    const month = pad(v.date.getMonth() + 1);
    const day = pad(v.date.getDate());
    const hours = pad(v.date.getHours());
    const minutes = pad(v.date.getMinutes());
    const seconds = pad(v.date.getSeconds());
    var date = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    savedText += `[${date}] ---------------------\n${v.text}\n\n`;
  });
  return savedText;
};

/**
 * テキストをダウンロードする.
 * @param text 
 */
const downloadText = (text: string) => {
  var date = new Date();
  
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
 * プレーンテキスト作業所本体.
 */
export default function Text(): JSX.Element {

  const title = 'プレーンテキスト作業所';
  const description = 'プレーンテキストで文章を編集するためのツールです。保存したテキストはブラウザのローカルストレージに保存されます。';
  const {siteConfig} = useDocusaurusContext();

  const [state, setState] = useState<{
    workText: string, 
    savedTexts: SavedText[],
  }>({
    workText: '',
    savedTexts: [],
  });

  // ローカルストレージから保存したテキストを読み込む
  useEffect(() => {
    const loadedTexts = localStorage.getItem("SavedTexts");
    if (loadedTexts !== null) {
      var persed = JSON.parse(loadedTexts) as {date: string; text: string;}[]; 
      var savedTexts = persed.map(v => ({
        ...v,
        date: new Date(v.date),
      } as SavedText));
      setState({
        ...state,
        savedTexts,
      });
    }
  }, []);

  // ローカルストレージにテキストを保存する
  useEffect(() => {
    localStorage.setItem("SavedTexts", JSON.stringify(state.savedTexts));
  }, [state]);

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

            <Grid size={{ xs: 12, md: 6 }}>
              <FormLabel>保存したテキスト</FormLabel>
              {state.savedTexts.length > 0 ? (
                state.savedTexts.map((savedText, index) => (
                  <Stack spacing={2} direction="row" sx={{ paddingTop: 2 }}>
                    <TextField
                      key={`${savedText.date.toISOString()}-${index}`}
                      disabled
                      multiline
                      fullWidth
                      label={savedText.date.toLocaleString('ja-JP')}
                      value={savedText.text}
                    />
                    
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        setState({
                          ...state,
                          savedTexts: state.savedTexts.filter((_, i) => i !== index),
                        });
                      }}>
                      <DeleteForeverIcon />
                    </Button>
                  </Stack>
                ))
              ) : (
                <div style={{ color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center', paddingTop: '20px' }}>保存されたテキストはありません。</div>
              )}
              {state.savedTexts.length > 0 && (
                <Stack spacing={2} direction="row" sx={{ paddingTop: 2 }}>
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
                    }}>全削除</Button>
                </Stack>
              )}
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
                      setState({
                        ...state,
                        workText: '',
                        savedTexts: [
                          ...state.savedTexts,
                          {
                            date: new Date(),
                            text: state.workText.trim(),
                          }
                        ],
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
                </Stack>
              </Stack>
            </Grid>

          </Grid>
        </Container>
      </MuiTheme>
    </Layout>
  );
};
