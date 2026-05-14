import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { translate } from '@docusaurus/Translate';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PasswordGenerator from '@site/src/components/PasswordGenerator';
import ToolPageHeader from '@site/src/components/ToolPageHeader';
import common from '@site/src/css/common.module.css';
import styles from '@site/src/css/password.module.css';

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
        {translate({ id: 'password.guide.title', message: '使い方' })}
      </h2>
      <ol className={common.guideList}>
        <li>{translate({ id: 'password.guide.step1', message: 'パスワードの長さや使用する文字の種類（記号、大文字、小文字など）を指定します。' })}</li>
        <li>{translate({ id: 'password.guide.step2', message: '設定を変更すると、自動的に新しいパスワードが生成されます。' })}</li>
        <li>{translate({ id: 'password.guide.step3', message: '「コピー」ボタンで個別にコピーするか、「保存」ボタンで生成されたリストをテキストファイルとしてダウンロードできます。' })}</li>
        <li>{translate({ id: 'password.guide.step4', message: 'パスワードの作成設定はURLに反映されますので、ブックマークしておくことで次回以降も同じ条件でパスワードを素早く生成できます。' })}</li>
      </ol>
      <div className={common.securityBox}>
        {translate({ id: 'password.guide.security', message: '🔒 生成処理はすべてご利用のブラウザ内で行われます。パスワードや設定内容がサーバーに送信されることはありません。' })}
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function Password(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`${translate({ id: 'password.header.title', message: 'パスワードジェネレーター' })} | ${siteConfig.title}`}
      description={translate({ id: 'password.header.desc', message: '条件を指定してパスワードを作成できます。ブラウザ上で動作するため、作成したパスワードは安全に利用できます。' })}
    >
      <ToolPageHeader
        title={translate({ id: 'password.header.title', message: 'パスワードジェネレーター' })}
        desc={translate({ id: 'password.header.desc', message: '条件を指定してパスワードを作成できます。設定内容はURLに含まれるため、URLを共有することで同じ条件のパスワードを再度生成することも可能です。ブラウザ上で動作するため、作成したパスワードは安全に利用できます。' })}
        icon="🔐"
      />
      <div className={common.body}>
        <PasswordGenerator />
        <div className={styles.container}>
          <UsageGuide />
        </div>
      </div>
    </Layout>
  );
}
