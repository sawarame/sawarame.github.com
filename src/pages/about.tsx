import React from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Box,
  Typography,
  Stack,
  Container,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import ExtensionIcon from '@mui/icons-material/Extension';
import DevicesIcon from '@mui/icons-material/Devices';
import common from '@site/src/css/common.module.css';

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(123, 31, 162, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(103, 58, 183, 0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className={common.pageHeaderContent}>
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          margin: '0 0 1rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #7b1fa2 60%, #673ab7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>sawara.meについて</h1>
        <p className={common.pageHeaderDesc}>
          sawara.me のコンセプト、および提供している機能について
        </p>
      </div>
    </div>
  );
}

export default function About(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={`このサイトについて | ${siteConfig.title}`}>
      <MuiTheme>
        <PageHeader />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Stack spacing={6}>
            
            <section>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, textAlign: 'center', mb: 4 }}>
                コンセプト
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', borderRadius: '16px', border: '1px solid var(--ifm-color-emphasis-200)' }} elevation={0}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Box sx={{ color: 'primary.main', display: 'flex' }}>
                          <VolunteerActivismIcon fontSize="large" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          誰でも無料で利用可能
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                          sawara.me は、日常のちょっとした不便を解決するための小さな便利ツールを無料で公開しているサイトです。面倒な会員登録やログイン、広告に邪魔されることなく、必要な時にすぐ利用できる場所を目指しています。
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%', borderRadius: '16px', border: '1px solid var(--ifm-color-emphasis-200)' }} elevation={0}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Box sx={{ color: 'success.main', display: 'flex' }}>
                          <SecurityIcon fontSize="large" />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          100% ブラウザ完結の安全性
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                          「画像を軽量化したいけど、サーバーに写真をアップロードするのは不安」「パスワードを生成したいけど、通信内容を見られたくない」といった心配は不要です。本サイトのツールは、すべての処理をお使いのブラウザ内で行います。データが外部サーバーに送信されることは決してありません。
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </section>

            <section>
              <Card sx={{ bgcolor: 'rgba(103, 58, 183, 0.05)', borderRadius: '20px', p: { xs: 2, md: 4 } }} elevation={0}>
                <Stack spacing={3} alignItems="center" textAlign="center">
                  <Box sx={{ color: 'secondary.main', display: 'flex' }}>
                    <ExtensionIcon sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    ブラウザ拡張機能の提供
                  </Typography>
                  <Typography variant="body1" sx={{ maxWidth: '600px', lineHeight: 1.8 }}>
                    Webツールだけでなく、日々のブラウジングをより快適にする Chrome / Edge 向け拡張機能の紹介・提供も行っています。
                    特定のサイトの使い勝手を向上させたり、開発効率を上げるための小さな「Spark（ひらめき）」をお届けします。
                  </Typography>
                </Stack>
              </Card>
            </section>

            <section>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, textAlign: 'center', mb: 4 }}>
                技術スタック
              </Typography>
              <Grid container spacing={2}>
                {[
                  { icon: <DevicesIcon />, label: 'Docusaurus (React)', desc: '高速な静的サイト生成', link: 'https://docusaurus.io/' },
                  { icon: <ExtensionIcon />, label: 'Material UI', desc: '一貫性のある美しいUIコンポーネント', link: 'https://mui.com/material-ui/' },
                  { icon: <SecurityIcon />, label: 'TypeScript', desc: '型安全による安定した動作', link: 'https://www.typescriptlang.org/ja/' },
                ].map((item, i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Box sx={{ color: 'text.secondary', mb: 1 }}>{item.icon}</Box>
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                          {item.label}
                        </Typography>
                      </a>
                      <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </section>

          </Stack>
        </Container>
      </MuiTheme>
    </Layout>
  );
}
