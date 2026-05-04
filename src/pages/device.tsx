import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { IconButton, Snackbar, Alert, Tooltip } from '@mui/material';
import MuiTheme from '@site/src/components/MuiTheme';
import { translate } from '@docusaurus/Translate';
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
        <h1 className={styles.pageHeaderTitle}>
          {translate({ id: 'device.header.title', message: 'デバイス情報チェッカー' })}
        </h1>
        <p className={common.pageHeaderDesc}>
          {translate({ id: 'device.header.desc', message: '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。' })}
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
          <Tooltip title={translate({ id: 'common.copy', message: 'コピー' })}>
            <IconButton size="small" onClick={() => onCopy(value)} className={styles.copyBtn} aria-label={`${label} copy`}>
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
  const { siteConfig } = useDocusaurusContext();

  const [state, setState] = useState({
    userAgent: '',
    physicalSize: '',
    logicalSize: '',
    ipAddress: translate({ id: 'device.loading', message: '読み込み中...' }),
    hardwareConcurrency: '',
    deviceMemory: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const isBot = /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    if (isBot) {
      setState((s) => ({ ...s, ipAddress: translate({ id: 'device.ip.bot', message: 'ボット/クローラーからのアクセスと判定されたため、IPアドレスは表示されません。' }) }));
    } else {
      (async () => {
        try {
          const res = await fetch('https://api.sawara.me/v1/ipaddress/');
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          setState((s) => ({ ...s, ipAddress: data.ip }));
        } catch (err) {
          console.error('IPアドレスの取得に失敗しました。', err);
          setState((s) => ({ ...s, ipAddress: translate({ id: 'device.ip.error', message: '取得に失敗しました。' }) }));
        }
      })();
    }
    const update = () => {
      // メモリ容量 (navigator.deviceMemory) はブラウザによって未実装の場合がある
      const memory = (navigator as any).deviceMemory
        ? `${(navigator as any).deviceMemory} GB`
        : translate({ id: 'device.memory.unknown', message: '不明（未対応のブラウザです）' });
      const cores = navigator.hardwareConcurrency
        ? `${navigator.hardwareConcurrency}${translate({ id: 'device.cores.unit', message: ' コア' })}`
        : translate({ id: 'device.cores.unknown', message: '不明' });

      setState((s) => ({
        ...s,
        userAgent: navigator.userAgent,
        physicalSize: `${window.screen.width} × ${window.screen.height} px`,
        logicalSize: `${window.innerWidth} × ${window.innerHeight} px`,
        hardwareConcurrency: cores,
        deviceMemory: memory
      }));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    setSnackbar({ open: true, message: translate({ id: 'common.copied', message: 'コピーしました！' }) });
  };

  return (
    <Layout
      title={`${translate({ id: 'device.header.title', message: 'デバイス情報チェッカー' })} | ${siteConfig.title}`}
      description={translate({ id: 'device.header.desc', message: '現在利用しているデバイスの画面サイズやユーザーエージェント情報を表示します。' })}
    >
      <MuiTheme>
        <PageHeader />
        <div className={common.body}>
          <div className={styles.container}>
            <div className={styles.grid}>
              <SectionCard icon="🌐" title={translate({ id: 'device.section.network', message: 'ネットワーク' })}>
                <InfoRow label={translate({ id: 'device.info.ip', message: 'IPアドレス' })} value={state.ipAddress} onCopy={handleCopy} mono />
              </SectionCard>
              <SectionCard icon="🖥️" title={translate({ id: 'device.section.screen', message: '画面サイズ' })}>
                <InfoRow label={translate({ id: 'device.info.physicalSize', message: '物理解像度' })} value={state.physicalSize} note="window.screen" onCopy={handleCopy} mono />
                <InfoRow label={translate({ id: 'device.info.logicalSize', message: 'ウィンドウサイズ' })} value={state.logicalSize} note="window.inner" onCopy={handleCopy} mono />
              </SectionCard>
              <SectionCard icon="⚙️" title={translate({ id: 'device.section.hardware', message: 'ハードウェア' })}>
                <InfoRow label={translate({ id: 'device.info.cores', message: '論理コア数' })} value={state.hardwareConcurrency} note="hardwareConcurrency" onCopy={handleCopy} mono />
                <InfoRow label={translate({ id: 'device.info.memory', message: 'メモリ容量' })} value={state.deviceMemory} note="deviceMemory" onCopy={handleCopy} mono />
                <p className={styles.disclaimer}>
                  {translate({ id: 'device.disclaimer', message: '※プライバシー保護のため、正確な容量が制限されたり、丸められた値が表示される場合があります。' })}
                </p>
              </SectionCard>
              <SectionCard icon="🔍" title={translate({ id: 'device.section.ua', message: 'ユーザーエージェント' })}>
                <InfoRow label="User-Agent" value={state.userAgent} onCopy={handleCopy} mono />
              </SectionCard>
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