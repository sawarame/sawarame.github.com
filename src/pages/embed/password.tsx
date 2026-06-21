import React from 'react';
import Head from '@docusaurus/Head';
import LayoutProvider from '@theme/Layout/Provider';
import PasswordGenerator from '@site/src/components/PasswordGenerator';
import { translate } from '@docusaurus/Translate';

/**
 * 埋め込み用のパスワードジェネレーターページ
 * LayoutProviderを使用してDocusaurusのコンテキスト（ColorMode等）を提供しつつ、
 * NavbarやFooterといったUIコンポーネントを完全にマウントしないようにします。
 */
export default function EmbeddedPasswordGenerator(): JSX.Element {
  return (
    <LayoutProvider>
      <Head>
        <title>{translate({ id: 'password.title', message: 'パスワードジェネレーター' })}</title>
        {/* 埋め込み用ページは検索エンジンのインデックス対象から外す */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main style={{ padding: '16px', width: '100%', margin: '0 auto', minHeight: '100vh', background: 'var(--ifm-background-color)' }}>
        <PasswordGenerator embedded={true} />
      </main>
    </LayoutProvider>
  );
}
