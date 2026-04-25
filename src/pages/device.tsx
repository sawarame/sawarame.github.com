import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { IconButton, Snackbar, Alert, Tooltip } from '@mui/material';
import MuiTheme from '@site/src/components/MuiTheme';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/device.module.css';

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
        <span className={styles.pageHeaderIcon}>📱</span>
        <h1 className={styles.pageHeaderTitle}>デバイス情報チェッカー</h1>
        <p className={common.pageHeaderDesc}>
          現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, note, onCopy, mono = false }: {
  label: string; value: string; note?: string; onCopy?: (value: string) => void; mono?: boolean;
}) {
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoRowTop}>
        <span className={styles.infoLabel}>{label}</span>
        {note && <span className={styles.infoNote}>{note}</span>}
        {onCopy && (
          <Tooltip title="コピー">
            <IconButton size="small" onClick={() => onCopy(value)} className={styles.copyBtn} aria-label={`${label}をコピー`}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <p className={`${styles.infoValue} ${mono ? styles.infoValueMono : ''}`}>{value || '—'}</p>
    </div>
  );
}

function SectionCard({ icon, title, children, full = false }: { icon: string; title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`${common.card} ${full ? common.cardFull : ''}`}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Device(): JSX.Element {
  const title = 'デバイス情報チェッカー';
  const description = '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。';
  const { siteConfig } = useDocusaurusContext();

  const [state, setState] = useState({ userAgent: '', physicalSize: '', logicalSize: '', ipAddress: '読み込み中...' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const isBot = /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    if (isBot) {
      setState((s) => ({ ...s, ipAddress: 'ボット/クローラーからのアクセスと判定されたため、IPアドレスは表示されません。' }));
    } else {
      (async () => {
        try {
          const res = await fetch('https://api.sawara.me/v1/ipaddress/');
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          setState((s) => ({ ...s, ipAddress: data.ip }));
        } catch (err) {
          console.error('IPアドレスの取得に失敗しました。', err);
          setState((s) => ({ ...s, ipAddress: '取得に失敗しました。' }));
        }
      })();
    }
    const update = () => {
      setState((s) => ({ ...s, userAgent: navigator.userAgent, physicalSize: `${window.screen.width} × ${window.screen.height} px`, logicalSize: `${window.innerWidth} × ${window.innerHeight} px` }));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setSnackbar({ open: true, message: 'コピーしました！' });
  };

  return (
    <Layout title={`${title} | ${siteConfig.title}`} description={description}>
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div className={styles.container}>
            <div className={styles.grid}>
              <SectionCard icon="🌐" title="ネットワーク" full>
                <InfoRow label="IPアドレス" value={state.ipAddress} onCopy={handleCopy} mono />
              </SectionCard>
              <SectionCard icon="🖥️" title="画面サイズ" full>
                <InfoRow label="物理解像度" value={state.physicalSize} note="window.screen" onCopy={handleCopy} mono />
                <InfoRow label="ウィンドウサイズ" value={state.logicalSize} note="window.inner" onCopy={handleCopy} mono />
              </SectionCard>
              <div className={styles.fullWidth}>
                <SectionCard icon="🔍" title="ユーザーエージェント">
                  <InfoRow label="User-Agent" value={state.userAgent} onCopy={handleCopy} mono />
                </SectionCard>
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