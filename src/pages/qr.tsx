import React, { useState, useRef, useMemo } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { TextField, Button, Stack, Snackbar, Alert, Tooltip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeCanvas } from 'qrcode.react';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/qr.module.css';

// ============================================================
// Sub Components
// ============================================================

function PageHeader() {
  return (
    <div className={common.pageHeader}>
      <div className={common.pageHeaderBg}>
        <div className={styles.pageHeaderOrb1} />
        <div className={styles.pageHeaderOrb2} />
      </div>
      <div className={common.pageHeaderContent}>
        <span className={styles.pageHeaderIcon}>📷</span>
        <h1 className={styles.pageHeaderTitle}>QRコード作成</h1>
        <p className={common.pageHeaderDesc}>
          URLや様々な情報からQRコードを生成します。Wi-Fiやカレンダー登録などにも対応しています。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

type Mode = 'text' | 'wifi' | 'contact' | 'event' | 'email';

export default function QR(): React.JSX.Element {
  const title = 'QRコード作成';
  const description = 'URLや様々な情報からQRコードを生成します。Wi-Fiやカレンダー登録などにも対応しています。';
  const { siteConfig } = useDocusaurusContext();

  const [mode, setMode] = useState<Mode>('text');

  // Form states
  const [textInput, setTextInput] = useState('https://sawara.me');

  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactTel, setContactTel] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [eventName, setEventName] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');

  const [emailTo, setEmailTo] = useState('');
  const [emailSub, setEmailSub] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Generate QR Value dynamically
  const generatedText = useMemo(() => {
    switch (mode) {
      case 'text':
        return textInput;
      case 'wifi':
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case 'contact':
        return `MECARD:N:${contactName};TEL:${contactTel};EMAIL:${contactEmail};;`;
      case 'event': {
        const formatDT = (dt: string) => {
          if (!dt) return '';
          return dt.replace(/[-:]/g, '') + '00';
        };
        const start = formatDT(eventStart);
        const end = formatDT(eventEnd);
        return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${eventName}
DTSTART:${start}
DTEND:${end}
END:VEVENT
END:VCALENDAR
`;
      }
      case 'email': {
        const sub = emailSub ? `subject=${encodeURIComponent(emailSub)}` : '';
        const body = emailBody ? `body=${encodeURIComponent(emailBody.replace(/\r?\n/g, '\r\n'))}` : '';
        const query = [sub, body].filter(Boolean).join('&');
        return `mailto:${emailTo}${query ? '?' + query : ''}`;
      }
      default:
        return '';
    }
  }, [mode, textInput, wifiEncryption, wifiSsid, wifiPassword, contactName, contactTel, contactEmail, eventName, eventStart, eventEnd, emailTo, emailSub, emailBody]);

  const downloadQRCode = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

    const getCurrentDateTimeStr = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    };

    let baseFileName = '';
    if (mode === 'wifi') baseFileName = wifiSsid;
    else if (mode === 'contact') baseFileName = contactName;
    else if (mode === 'event') baseFileName = eventName;
    else if (mode === 'email') baseFileName = emailSub;

    const sanitized = baseFileName.replace(/[<>:"/\\|?*]/g, '_').trim();
    const fileName = sanitized ? `${sanitized}.png` : `${getCurrentDateTimeStr()}.png`;

    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = fileName;
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
        navigator.clipboard.write([item]).then(() => setSnackbar({ open: true, message: '画像をコピーしました！' }));
      }
    });
  };

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div className={styles.container}>
            <div className={styles.layout}>

              {/* 入力カード */}
              <div className={common.card}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>✏️</span>
                  QRコードの内容を入力
                </h2>
                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel id="mode-select-label">種類</InputLabel>
                    <Select
                      labelId="mode-select-label"
                      value={mode}
                      label="種類"
                      onChange={(e) => setMode(e.target.value as Mode)}
                    >
                      <MenuItem value="text">テキスト / URL</MenuItem>
                      <MenuItem value="wifi">Wi-Fi</MenuItem>
                      <MenuItem value="contact">連絡先</MenuItem>
                      <MenuItem value="event">予定 (カレンダー)</MenuItem>
                      <MenuItem value="email">メール作成</MenuItem>
                    </Select>
                  </FormControl>

                  {mode === 'text' && (
                    <TextField fullWidth label="URL または テキスト" variant="outlined" value={textInput}
                      onChange={(e) => setTextInput(e.target.value)} placeholder="ここにURLやテキストを入力してください" multiline minRows={6} />
                  )}

                  {mode === 'wifi' && (
                    <>
                      <FormControl fullWidth>
                        <InputLabel id="wifi-enc-label">暗号化方式</InputLabel>
                        <Select labelId="wifi-enc-label" value={wifiEncryption} label="暗号化方式" onChange={(e) => setWifiEncryption(e.target.value)}>
                          <MenuItem value="WPA">WPA/WPA2/WPA3</MenuItem>
                          <MenuItem value="WEP">WEP</MenuItem>
                          <MenuItem value="nopass">なし</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField fullWidth label="SSID" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} />
                      <TextField fullWidth label="パスワード" type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} />
                    </>
                  )}

                  {mode === 'contact' && (
                    <>
                      <TextField fullWidth label="名前" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                      <TextField fullWidth label="電話番号" type="tel" value={contactTel} onChange={(e) => setContactTel(e.target.value)} />
                      <TextField fullWidth label="メールアドレス" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </>
                  )}

                  {mode === 'event' && (
                    <>
                      <TextField fullWidth label="予定名" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                      <TextField fullWidth label="開始日時" type="datetime-local" InputLabelProps={{ shrink: true }} value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
                      <TextField fullWidth label="終了日時" type="datetime-local" InputLabelProps={{ shrink: true }} value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} />
                    </>
                  )}

                  {mode === 'email' && (
                    <>
                      <TextField fullWidth label="送信先メールアドレス" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                      <TextField fullWidth label="タイトル" value={emailSub} onChange={(e) => setEmailSub(e.target.value)} />
                      <TextField fullWidth label="本文" multiline minRows={4} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                    </>
                  )}

                  {mode !== 'text' && (
                    <TextField
                      fullWidth
                      label="生成される文字列"
                      variant="outlined"
                      value={generatedText}
                      multiline
                      minRows={3}
                      InputProps={{ readOnly: true }}
                    />
                  )}

                  <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadQRCode} disabled={!generatedText} className={styles.actionBtn}>
                      画像を保存
                    </Button>
                    <Tooltip title="クリップボードに画像としてコピー">
                      <span>
                        <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyToClipboard} disabled={!generatedText} className={styles.actionBtn}>
                          画像をコピー
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </div>

              {/* QRプレビューカード */}
              <div className={common.card}>
                <h2 className={common.cardTitle}>
                  <span className={common.cardTitleIcon}>🔲</span>
                  プレビュー
                </h2>
                <div className={styles.qrWrap}>
                  {generatedText ? (
                    <div className={styles.qrInner}>
                      <QRCodeCanvas value={generatedText} size={240} level="H" includeMargin ref={qrRef} />
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
        <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
        </Snackbar>
      </MuiTheme>
    </Layout>
  );
}

