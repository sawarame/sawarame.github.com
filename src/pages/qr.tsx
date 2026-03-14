import React, { useState, useRef } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  Container,
  Grid2 as Grid,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeCanvas } from 'qrcode.react';

export default function QR(): React.JSX.Element {
  const title = 'QRコード作成';
  const description = 'URLやテキストからQRコードを生成します。';
  const { siteConfig } = useDocusaurusContext();

  const [text, setText] = useState('https://sawara.me');
  const qrRef = useRef<HTMLCanvasElement>(null);

  const downloadQRCode = () => {
    const canvas = qrRef.current;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const copyToClipboard = () => {
    const canvas = qrRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]);
        }
      });
    }
  };

  return (
    <Layout title={`${title} ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <Container maxWidth="xl" sx={{ marginTop: 5, marginBottom: 5 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                {title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {description}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="URL または テキスト"
                  variant="outlined"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="ここにURLやテキストを入力してください"
                  multiline
                  minRows={4}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={downloadQRCode}
                    disabled={!text}
                  >
                    画像を保存
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={copyToClipboard}
                    disabled={!text}
                  >
                    画像をコピー
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper
                elevation={3}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 4,
                  aspectRatio: '1/1',
                  backgroundColor: '#fff',
                }}
              >
                {text ? (
                  <Box sx={{ p: 2, bgcolor: 'white' }}>
                    <QRCodeCanvas
                      value={text}
                      size={256}
                      level={'H'}
                      includeMargin={true}
                      ref={qrRef}
                    />
                  </Box>
                ) : (
                  <Typography color="text.disabled">
                    QRコードがここに表示されます
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </MuiTheme>
    </Layout>
  );
}
