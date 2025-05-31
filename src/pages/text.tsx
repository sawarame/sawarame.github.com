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
 * プレーンテキスト作業場本体.
 */
export default function Text(): JSX.Element {

  const [state, setState] = useState({
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
                      var tmpTexts = state.savedTexts;
                      tmpTexts.unshift(state.workText);
                      setState({
                        ...state,
                        savedTexts: tmpTexts,
                      });
                    }}>保存</Button>
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
                  value={state.savedTexts.join(`\n--------------------\n`)}
                />
                <Stack spacing={2} direction="row">  
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