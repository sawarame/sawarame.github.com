import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TextScratchpad from '@site/src/components/TextScratchpad';
import ToolPageHeader from '@site/src/components/ToolPageHeader';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/components/TextScratchpad/styles.module.css';

// ============================================================
// Sub Components
// ============================================================

function UsageGuide() {
  return (
    <div className={common.guideCard} style={{ marginTop: '2rem' }}>
      <h2 className={common.cardTitle}>
        <span className={common.cardTitleIcon}>
          <HelpOutlineIcon sx={{ fontSize: '1.1rem', verticalAlign: 'middle' }} />
        </span>
        {translate({ id: 'text.guide.title', message: '使い方' })}
      </h2>
      <ol className={common.guideList}>
        <li>{translate({ id: 'text.guide.step1', message: '左側の入力エリアにテキストを入力し、「保存」ボタンを押すか、エンターキー（設定によります）で保存します。' })}</li>
        <li>{translate({ id: 'text.guide.step2', message: '保存されたテキストは右側のリストに追加され、ブラウザのローカルストレージに記憶されます。' })}</li>
        <li>{translate({ id: 'text.guide.step3', message: 'よく使うテキストはピン留めアイコンで上部に固定できます。' })}</li>
        <li>{translate({ id: 'text.guide.step4', message: 'コピーや一括ダウンロード機能を使って、保存したテキストを活用しましょう。' })}</li>
      </ol>
      <div className={common.securityBox}>
        {translate({ id: 'text.guide.security', message: '🔒 データはすべてご利用のブラウザ内に保存されます。サーバーに送信されることはありません。' })}
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Text(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${translate({ id: 'text.header.title', message: 'テキスト保存場所' })} | ${siteConfig.title}`}
      description={translate({ id: 'text.header.desc', message: 'テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。' })}
    >
      <ToolPageHeader
        title={translate({ id: 'text.header.title', message: 'テキスト保存場所' })}
        desc={translate({ id: 'text.header.desc', message: 'テキストを一時的に保存するための場所です。保存したテキストはブラウザのローカルストレージに保存されます。' })}
        icon="📝"
        color1="#f093fb"
        color2="#f5576c"
        titleGradient="linear-gradient(135deg, #fff 0%, #f9a8d4 60%, #f472b6 100%)"
      />
      <div className={common.body}>
        <TextScratchpad />
        <div className={styles.container}>
          <UsageGuide />
        </div>
      </div>
    </Layout>
  );
}
