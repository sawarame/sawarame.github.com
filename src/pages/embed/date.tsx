import React from 'react';
import Head from '@docusaurus/Head';
import LayoutProvider from '@theme/Layout/Provider';
import DateComparison from '@site/src/components/DateComparison';
import { translate } from '@docusaurus/Translate';

/**
 * 埋め込み用の日付比較ツールページ
 * LayoutProviderを使用してDocusaurusのコンテキスト（ColorMode等）を提供しつつ、
 * NavbarやFooterといったUIコンポーネントを完全にマウントしないようにします。
 * @returns 埋め込み用日付比較ページのJSX要素
 */
export default function EmbeddedDateComparison(): JSX.Element {
  return (
    <LayoutProvider>
      <Head>
        <title>{translate({ id: 'date.title', message: '日付比較ツール' })}</title>
        {/* 埋め込み用ページは検索エンジンのインデックス対象から外す */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main style={{ padding: '16px', width: '100%', margin: '0 auto', minHeight: '100vh', background: 'var(--ifm-background-color)' }}>
        <DateComparison embedded={true} />
      </main>
    </LayoutProvider>
  );
}
