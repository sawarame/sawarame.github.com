import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Container,
  Grid2 as Grid,
  TextField,
  FormLabel,
} from '@mui/material';

/**
 * デバイス情報確認ページ.
 */
export default function Device(): JSX.Element {
  const title = 'デバイス情報確認';
  const description = '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。';
  const {siteConfig} = useDocusaurusContext();

  const [state, setState] = useState({
    userAgent: '',
    physicalSize: '',
    logicalSize: '',
  });

  useEffect(() => {
    const updateState = () => {
      setState({
        userAgent: navigator.userAgent,
        physicalSize: `${window.screen.width} x ${window.screen.height}`,
        logicalSize: `${window.innerWidth} x ${window.innerHeight}`,
      });
    };

    updateState();

    window.addEventListener('resize', updateState);
    return () => window.removeEventListener('resize', updateState);
  }, []);

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
            
            <Grid size={{ xs: 12 }}>
              <FormLabel>ユーザーエージェント</FormLabel>
              <TextField 
                fullWidth
                multiline
                value={state.userAgent}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormLabel>物理画面サイズ</FormLabel>
              <TextField 
                fullWidth
                value={state.physicalSize}
                helperText="window.screen"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormLabel>論理画面サイズ</FormLabel>
              <TextField 
                fullWidth
                value={state.logicalSize}
                helperText="window.inner"
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </MuiTheme>
    </Layout>
  );
};