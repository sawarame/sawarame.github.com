import React, { useState, useRef, useMemo, useEffect } from 'react';
import { translate } from '@docusaurus/Translate';
import { TextField, Button, Stack, Snackbar, Alert, Tooltip, FormControl, InputLabel, Select, MenuItem, Box, IconButton, Typography, FormControlLabel, Checkbox, ToggleButton, ToggleButtonGroup, Grid2 as Grid } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import type QRCodeStyling from 'qr-code-styling';
import type { DotType, CornerSquareType, CornerDotType, Options } from 'qr-code-styling';
import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

export type Mode = 'text' | 'wifi' | 'contact' | 'event' | 'email';
type Resolution = 240 | 480;

const PRESET_LOGOS: Record<Mode, string> = {
  text: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'),
  wifi: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a14 14 0 0 1 20 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1.2" fill="#333" stroke="none"/></svg>'),
  contact: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'),
  event: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'),
  email: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'),
};

export interface QrDataOptions {
  textInput: string;
  wifiEncryption: string;
  wifiSsid: string;
  wifiPassword: string;
  contactName: string;
  contactTel: string;
  contactEmail: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  emailTo: string;
  emailSub: string;
  emailBody: string;
}

export function buildQrData(mode: Mode, opts: QrDataOptions): string {
  switch (mode) {
    case 'text':
      return opts.textInput;
    case 'wifi':
      return `WIFI:T:${opts.wifiEncryption};S:${opts.wifiSsid};P:${opts.wifiPassword};;`;
    case 'contact':
      return `MECARD:N:${opts.contactName};TEL:${opts.contactTel};EMAIL:${opts.contactEmail};;`;
    case 'event': {
      if (opts.eventStart && opts.eventEnd && new Date(opts.eventStart) >= new Date(opts.eventEnd)) return '';
      const formatDT = (dt: string) => {
        if (!dt) return '';
        return dt.replace(/[-:]/g, '') + '00';
      };
      const start = formatDT(opts.eventStart);
      const end = formatDT(opts.eventEnd);
      return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${opts.eventName}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT\nEND:VCALENDAR\n`;
    }
    case 'email': {
      const sub = opts.emailSub ? `subject=${encodeURIComponent(opts.emailSub)}` : '';
      const body = opts.emailBody ? `body=${encodeURIComponent(opts.emailBody.replace(/\r?\n/g, '\r\n'))}` : '';
      const query = [sub, body].filter(Boolean).join('&');
      return `mailto:${opts.emailTo}${query ? '?' + query : ''}`;
    }
    default:
      return '';
  }
}

export function sanitizeFileName(mode: Mode, opts: { wifiSsid: string; contactName: string; eventName: string; emailSub: string }, timestamp: string): string {
  let baseFileName = '';
  if (mode === 'wifi') baseFileName = opts.wifiSsid;
  else if (mode === 'contact') baseFileName = opts.contactName;
  else if (mode === 'event') baseFileName = opts.eventName;
  else if (mode === 'email') baseFileName = opts.emailSub;

  const sanitized = baseFileName.replace(/[<>:"/\\|?*]/g, '_').trim();
  return sanitized ? `${sanitized}.png` : `${timestamp}.png`;
}

export default function QrGenerator(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('text');
  const [resolution, setResolution] = useState<Resolution>(480);

  // Styles
  const [dotsType, setDotsType] = useState<DotType>('square');
  const [cornerType, setCornerType] = useState<CornerSquareType>('square');

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
  
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      const file = new File([''], 'test.png', { type: 'image/png' });
      setCanShareFiles(navigator.canShare({ files: [file] }));
    }
  }, []);

  const generatedText = useMemo(() => {
    return buildQrData(mode, {
      textInput,
      wifiEncryption,
      wifiSsid,
      wifiPassword,
      contactName,
      contactTel,
      contactEmail,
      eventName,
      eventStart,
      eventEnd,
      emailTo,
      emailSub,
      emailBody,
    });
  }, [mode, textInput, wifiEncryption, wifiSsid, wifiPassword, contactName, contactTel, contactEmail, eventName, eventStart, eventEnd, emailTo, emailSub, emailBody]);

  const activeLogo = usePresetLogo ? PRESET_LOGOS[mode] : logoImage;

  const utf8Data = useMemo(() => {
    const data = generatedText || ' ';
    try {
      return unescape(encodeURIComponent(data));
    } catch {
      return data;
    }
  }, [generatedText]);

  const qrOptions = useMemo<Options>(() => ({
    width: resolution,
    height: resolution,
    data: utf8Data,
    image: activeLogo || undefined,
    dotsOptions: {
      type: dotsType,
      color: '#000000',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 10,
      imageSize: 0.25,
      hideBackgroundDots: true,
    },
    cornersSquareOptions: {
      type: cornerType,
      color: '#000000',
    },
    cornersDotOptions: {
      type: cornerType as CornerDotType,
      color: '#000000',
    },
    qrOptions: {
      errorCorrectionLevel: 'H',
    }
  }), [generatedText, resolution, activeLogo, dotsType, cornerType]);

  useEffect(() => {
    if (typeof window !== 'undefined' && qrContainerRef.current) {
      // Dynamic import to avoid SSR issues
      const QRCodeStyling = require('qr-code-styling');
      if (!qrCodeRef.current) {
        const qrCode = new QRCodeStyling(qrOptions);
        qrCode.append(qrContainerRef.current);
        qrCodeRef.current = qrCode;
      } else {
        qrCodeRef.current.update(qrOptions);
        if (!qrContainerRef.current.firstChild) {
          qrCodeRef.current.append(qrContainerRef.current);
        }
      }
    }
  }, [qrOptions]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
        setUsePresetLogo(false); 
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

  const getCurrentDateTimeStr = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  const getFileName = () => {
    return sanitizeFileName(mode, {
      wifiSsid,
      contactName,
      eventName,
      emailSub,
    }, getCurrentDateTimeStr());
  };

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;
    qrCodeRef.current.download({ name: getFileName().replace('.png', ''), extension: 'png' });
  };

  const copyToClipboard = async () => {
    if (!qrCodeRef.current) return;
    try {
      const blob = await qrCodeRef.current.getRawData('png');
      if (blob instanceof Blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setSnackbar({ open: true, message: translate({ id: 'qr.copied.image', message: '画像をコピーしました！' }) });
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleShare = async () => {
    if (isSharing || !qrCodeRef.current) return;
    setIsSharing(true);
    try {
      const blob = await qrCodeRef.current.getRawData('png');
      if (!(blob instanceof Blob)) {
        setIsSharing(false);
        return;
      }

      const file = new File([blob], 'qr_code.png', { type: 'image/png' });
      
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
        await copyToClipboard();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <MuiTheme>
      <div className={styles.container}>
      <div className={styles.layout}>
        <div className={common.card}>
          <h2 className={common.cardTitle}>
            <span className={common.cardTitleIcon}>✏️</span>
            {translate({ id: 'qr.input.title', message: 'QRコードの内容を入力' })}
          </h2>
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel id="mode-select-label">{translate({ id: 'qr.input.type', message: '種類' })}</InputLabel>
              <Select
                labelId="mode-select-label"
                value={mode}
                label={translate({ id: 'qr.input.type', message: '種類' })}
                onChange={(e) => setMode(e.target.value as Mode)}
              >
                <MenuItem value="text">{translate({ id: 'qr.mode.text', message: 'テキスト / URL' })}</MenuItem>
                <MenuItem value="wifi">Wi-Fi</MenuItem>
                <MenuItem value="contact">{translate({ id: 'qr.mode.contact', message: '連絡先' })}</MenuItem>
                <MenuItem value="event">{translate({ id: 'qr.mode.event', message: '予定 (カレンダー)' })}</MenuItem>
                <MenuItem value="email">{translate({ id: 'qr.mode.email', message: 'メール作成' })}</MenuItem>
              </Select>
            </FormControl>

            {mode === 'text' && (
              <TextField fullWidth label={translate({ id: 'qr.text.label', message: 'URL または テキスト' })} variant="outlined" value={textInput}
                onChange={(e) => setTextInput(e.target.value)} placeholder={translate({ id: 'qr.text.placeholder', message: 'ここにURLやテキストを入力してください' })} multiline minRows={6} />
            )}

            {mode === 'wifi' && (
              <>
                <FormControl fullWidth>
                  <InputLabel id="wifi-enc-label">{translate({ id: 'qr.wifi.encryption', message: '暗号化方式' })}</InputLabel>
                  <Select labelId="wifi-enc-label" value={wifiEncryption} label={translate({ id: 'qr.wifi.encryption', message: '暗号化方式' })} onChange={(e) => setWifiEncryption(e.target.value)}>
                    <MenuItem value="WPA">WPA/WPA2/WPA3</MenuItem>
                    <MenuItem value="WEP">WEP</MenuItem>
                    <MenuItem value="nopass">{translate({ id: 'qr.wifi.none', message: 'なし' })}</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="SSID" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} />
                <TextField fullWidth label={translate({ id: 'qr.wifi.password', message: 'パスワード' })} type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} />
              </>
            )}

            {mode === 'contact' && (
              <>
                <TextField fullWidth label={translate({ id: 'qr.contact.name', message: '名前' })} value={contactName} onChange={(e) => setContactName(e.target.value)} />
                <TextField fullWidth label={translate({ id: 'qr.contact.phone', message: '電話番号' })} type="tel" value={contactTel} onChange={(e) => setContactTel(e.target.value)} />
                <TextField fullWidth label={translate({ id: 'qr.contact.email', message: 'メールアドレス' })} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </>
            )}

            {mode === 'event' && (
              <>
                <TextField fullWidth label={translate({ id: 'qr.event.name', message: '予定名' })} value={eventName} onChange={(e) => setEventName(e.target.value)} />
                <TextField fullWidth label={translate({ id: 'qr.event.start', message: '開始日時' })} type="datetime-local" InputLabelProps={{ shrink: true }} value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
                <TextField 
                  fullWidth 
                  label={translate({ id: 'qr.event.end', message: '終了日時' })} 
                  type="datetime-local" 
                  InputLabelProps={{ shrink: true }} 
                  value={eventEnd} 
                  onChange={(e) => setEventEnd(e.target.value)} 
                  error={Boolean(eventStart && eventEnd && new Date(eventStart) >= new Date(eventEnd))}
                  helperText={Boolean(eventStart && eventEnd && new Date(eventStart) >= new Date(eventEnd)) ? translate({ id: 'qr.event.error.date', message: '終了日時は開始日時より後に設定してください' }) : ''}
                />
              </>
            )}

            {mode === 'email' && (
              <>
                <TextField fullWidth label={translate({ id: 'qr.email.to', message: '送信先メールアドレス' })} type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                <TextField fullWidth label={translate({ id: 'qr.email.subject', message: 'タイトル' })} value={emailSub} onChange={(e) => setEmailSub(e.target.value)} />
                <TextField fullWidth label={translate({ id: 'qr.email.body', message: '本文' })} multiline minRows={4} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
              </>
            )}

            {mode !== 'text' && (
              <TextField
                fullWidth
                label={translate({ id: 'qr.input.generated', message: '生成される文字列' })}
                variant="outlined"
                value={generatedText}
                multiline
                minRows={3}
                InputProps={{ readOnly: true }}
              />
            )}

            <Box sx={{ border: '1px dashed var(--ifm-color-emphasis-300)', borderRadius: 2, p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                {translate({ id: 'qr.logo.title', message: '中心にロゴを埋め込む (オプション)' })}
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={usePresetLogo}
                    onChange={(e) => setUsePresetLogo(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{translate({ id: 'qr.logo.usePreset', message: 'プリセットロゴを使用する' })}</Typography>}
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
                    {translate({ id: 'qr.logo.select', message: 'ロゴ画像を選択' })}
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
                      border: '1px solid var(--ifm-color-emphasis-200)',
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

        <div className={common.card}>
          <h2 className={common.cardTitle}>
            <span className={common.cardTitleIcon}>🔲</span>
            {translate({ id: 'qr.preview.title', message: 'プレビュー' })}
          </h2>
          <div className={styles.qrWrap}>
            {generatedText ? (
              <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
                    {translate({ id: 'qr.style.title', message: 'デザイン設定' })}
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="dots-type-label">{translate({ id: 'qr.style.dots', message: 'ドットの形状' })}</InputLabel>
                        <Select
                          labelId="dots-type-label"
                          value={dotsType}
                          label={translate({ id: 'qr.style.dots', message: 'ドットの形状' })}
                          onChange={(e) => setDotsType(e.target.value as DotType)}
                        >
                          <MenuItem value="square">{translate({ id: 'qr.style.shape.square', message: '四角' })}</MenuItem>
                          <MenuItem value="dots">{translate({ id: 'qr.style.shape.dots', message: 'ドット' })}</MenuItem>
                          <MenuItem value="rounded">{translate({ id: 'qr.style.shape.rounded', message: '角丸' })}</MenuItem>
                          <MenuItem value="extra-rounded">{translate({ id: 'qr.style.shape.extraRounded', message: '強角丸' })}</MenuItem>
                          <MenuItem value="classy">{translate({ id: 'qr.style.shape.classy', message: 'クラシック' })}</MenuItem>
                          <MenuItem value="classy-rounded">{translate({ id: 'qr.style.shape.classyRounded', message: 'クラシック角丸' })}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="corner-type-label">{translate({ id: 'qr.style.corner', message: '角の形状' })}</InputLabel>
                        <Select
                          labelId="corner-type-label"
                          value={cornerType}
                          label={translate({ id: 'qr.style.corner', message: '角の形状' })}
                          onChange={(e) => setCornerType(e.target.value as CornerSquareType)}
                        >
                          <MenuItem value="square">{translate({ id: 'qr.style.shape.square', message: '四角' })}</MenuItem>
                          <MenuItem value="dot">{translate({ id: 'qr.style.shape.dot', message: 'ドット' })}</MenuItem>
                          <MenuItem value="extra-rounded">{translate({ id: 'qr.style.shape.extraRounded', message: '角丸' })}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ height: '100%' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {translate({ id: 'qr.input.resolution', message: '解像度' })}
                        </Typography>
                        <ToggleButtonGroup
                          value={resolution}
                          exclusive
                          onChange={(_, val) => val && setResolution(val)}
                          size="small"
                          sx={{ flex: 1 }}
                        >
                          <ToggleButton value={240} sx={{ flex: 1 }}>240</ToggleButton>
                          <ToggleButton value={480} sx={{ flex: 1 }}>480</ToggleButton>
                        </ToggleButtonGroup>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                <div className={styles.qrInner}>
                  <div ref={qrContainerRef} style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }} />
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
                    {translate({ id: 'qr.preview.save', message: 'QRを保存' })}
                  </Button>
                  <Tooltip title={translate({ id: 'qr.tooltip.copyImage', message: 'クリップボードに画像としてコピー' })}>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={copyToClipboard}
                      disabled={!generatedText}
                      className={styles.actionBtn}
                      sx={{ flex: 1 }}
                    >
                      {translate({ id: 'qr.preview.copy', message: 'QRをコピー' })}
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
                      {translate({ id: 'qr.preview.share', message: '共有' })}
                    </Button>
                  )}
                </Stack>
              </Stack>
            ) : (
              <div className={styles.qrEmpty}>
                <span className={styles.qrEmptyIcon}>🔲</span>
                <p className={styles.qrEmptyText}>{translate({ id: 'qr.preview.empty', message: 'QRコードがここに表示されます' })}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
    </MuiTheme>
  );
}
