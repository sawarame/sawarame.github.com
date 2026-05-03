import React, { useState, useRef, useMemo } from 'react';
import Layout from '@theme/Layout';
import MuiTheme from '@site/src/components/MuiTheme';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { TextField, Button, Stack, Snackbar, Alert, Tooltip, FormControl, InputLabel, Select, MenuItem, Box, IconButton, Typography, FormControlLabel, Checkbox } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import { QRCodeCanvas } from 'qrcode.react';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/qr.module.css';

// ============================================================
// Constants & Utils
// ============================================================

type Mode = 'text' | 'wifi' | 'contact' | 'event' | 'email';

const PRESET_LOGOS: Record<Mode, string> = {
  text: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'),
  wifi: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a14 14 0 0 1 20 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1.2" fill="#333" stroke="none"/></svg>'),
  contact: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'),
  event: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'),
  email: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'),
};

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
          URLや様々な情報からQRコードを生成します。ロゴの埋め込みにも対応しています。
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
  const description = 'URLや様々な情報からQRコードを生成します。ロゴの埋め込みにも対応しています。';
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

  const [usePresetLogo, setUsePresetLogo] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [isSharing, setIsSharing] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Web Share API support
  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      // Create a dummy file to check sharing capability
      const file = new File([''], 'test.png', { type: 'image/png' });
      setCanShareFiles(navigator.canShare({ files: [file] }));
    }
  }, []);

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
        return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${eventName}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT\nEND:VCALENDAR\n`;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
        setUsePresetLogo(false); // New upload turns off preset
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const handleShare = async () => {
    if (isSharing) return;
    const canvas = qrRef.current;
    if (!canvas) return;

    setIsSharing(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }

        const file = new File([blob], 'qr_code.png', { type: 'image/png' });
        
        // Use Web Share API if supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
            });
          } catch (e) {
            if (e instanceof Error && e.name !== 'AbortError') {
              console.error('Share failed:', e);
            }
          }
        } else {
          // Fallback: Clipboard only
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setSnackbar({ open: true, message: 'QRをクリップボードにコピーしました！' });
          } catch (err) {
            console.error('Clipboard copy failed:', err);
          }
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      setIsSharing(false);
    }
  };

  const activeLogo = usePresetLogo ? PRESET_LOGOS[mode] : logoImage;

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

                  {/* ロゴアップロードセクション */}
                  <Box sx={{ border: '1px dashed #ccc', borderRadius: 2, p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                      中心にロゴを埋め込む (オプション)
                    </Typography>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={usePresetLogo}
                          onChange={(e) => setUsePresetLogo(e.target.checked)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">プリセットロゴを使用する</Typography>}
                      sx={{ mb: 1 }}
                    />

                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-select"
                      type="file"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    {!logoImage ? (
                      <label htmlFor="logo-select">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          size="small"
                          sx={{ textTransform: 'none' }}
                          disabled={usePresetLogo}
                        >
                          ロゴ画像を選択
                        </Button>
                      </label>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
                        <Box
                          component="img"
                          src={logoImage}
                          sx={{
                            width: 40,
                            height: 40,
                            objectFit: 'contain',
                            borderRadius: 1,
                            border: '1px solid #eee',
                            opacity: usePresetLogo ? 0.3 : 1
                          }}
                        />
                        <IconButton size="small" color="error" onClick={removeLogo}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    )}
                  </Box>
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
                    <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
                      <div className={styles.qrInner}>
                        <QRCodeCanvas
                          value={generatedText}
                          size={240}
                          level="H"
                          includeMargin
                          ref={qrRef}
                          imageSettings={activeLogo ? {
                            src: activeLogo,
                            x: undefined,
                            y: undefined,
                            height: 48,
                            width: 48,
                            excavate: true,
                          } : undefined}
                        />
                      </div>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          onClick={downloadQRCode}
                          disabled={!generatedText}
                          className={styles.actionBtn}
                          sx={{ flex: 1 }}
                        >
                          QRを保存
                        </Button>
                        <Tooltip title="クリップボードに画像としてコピー">
                          <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={copyToClipboard}
                            disabled={!generatedText}
                            className={styles.actionBtn}
                            sx={{ flex: 1 }}
                          >
                            QRをコピー
                          </Button>
                        </Tooltip>
                        {canShareFiles && (
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<ShareIcon />}
                            onClick={handleShare}
                            disabled={!generatedText || isSharing}
                            className={styles.actionBtn}
                            sx={{ flex: 1 }}
                          >
                            共有
                          </Button>
                        )}
                      </Stack>
                    </Stack>
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
