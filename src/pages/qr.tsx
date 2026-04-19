import React, { useState, useRef } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './qr.module.css';

// ============================================================
// Sub Components
// ============================================================

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderBg}>
        <div className={styles.pageHeaderOrb1} />
        <div className={styles.pageHeaderOrb2} />
      </div>
      <div className={styles.pageHeaderContent}>
        <span className={styles.pageHeaderIcon}>📷</span>
        <h1 className={styles.pageHeaderTitle}>QRコード作成</h1>
        <p className={styles.pageHeaderDesc}>
          URLやテキストからQRコードを生成します。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function QR(): React.JSX.Element {
  const title = 'QRコード作成';
  const description = 'URLやテキストからQRコードを生成します。';
  const { siteConfig } = useDocusaurusContext();

  const [text, setText] = useState('https://sawara.me');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const qrRef = useRef<HTMLCanvasElement>(null);

  const downloadQRCode = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'qrcode.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          setSnackbar({ open: true, message: '画像をコピーしました！' });
        });
      }
    });
  };

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />

        <div className={styles.body}>
          <div className={styles.container}>
            <div className={styles.layout}>

              {/* 入力カード */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>✏️</span>
                  テキスト / URL を入力
                </h2>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="URL または テキスト"
                    variant="outlined"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="ここにURLやテキストを入力してください"
                    multiline
                    minRows={6}
                  />
                  <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={downloadQRCode}
                      disabled={!text}
                      className={styles.actionBtn}
                    >
                      画像を保存
                    </Button>
                    <Tooltip title="クリップボードに画像としてコピー">
                      <span>
                        <Button
                          variant="outlined"
                          startIcon={<ContentCopyIcon />}
                          onClick={copyToClipboard}
                          disabled={!text}
                          className={styles.actionBtn}
                        >
                          画像をコピー
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </div>

              {/* QRプレビューカード */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardTitleIcon}>🔲</span>
                  プレビュー
                </h2>
                <div className={styles.qrWrap}>
                  {text ? (
                    <div className={styles.qrInner}>
                      <QRCodeCanvas
                        value={text}
                        size={240}
                        level="H"
                        includeMargin
                        ref={qrRef}
                      />
                    </div>
                  ) : (
                    <div className={styles.qrEmpty}>
                      <span className={styles.qrEmptyIcon}>🔲</span>
                      <p className={styles.qrEmptyText}>QRコードがここに表示されます</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={2000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MuiTheme>
    </Layout>
  );
}
