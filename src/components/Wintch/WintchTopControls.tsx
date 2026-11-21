import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation } from '@docusaurus/router';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import WintchTopControlsView, { type LocaleLinkProps } from './WintchTopControlsView';
import styles from './WintchTopControls.module.css';

/**
 * Docusaurus の Link コンポーネントを LocaleLinkProps に適合させて描画するラッパーコンポーネント
 * @param props - 言語切替リンクに必要なプロパティ
 * @returns Docusaurus Link の JSX 要素
 */
function DocusaurusLocaleLink(props: LocaleLinkProps): JSX.Element {
  return <Link {...props} />;
}

/**
 * Wintch 紹介ページ上部に表示する言語切替・ダークモード切替コントロールコンポーネント
 * 共通の Navbar を削除した状態でも、言語切替とカラーモード切替をデスクトップ・モバイル双方で操作可能にする
 * @returns トップコントロールバーの JSX 要素
 */
export default function WintchTopControls(): JSX.Element {
  const {
    siteConfig: { url: currentSiteUrl, baseUrl: currentBaseUrl, trailingSlash },
    i18n: { currentLocale, locales, localeConfigs },
  } = useDocusaurusContext();
  const { pathname, search, hash } = useLocation();

  return (
    <WintchTopControlsView
      currentLocale={currentLocale}
      locales={locales}
      localeConfigs={localeConfigs}
      currentSiteUrl={currentSiteUrl}
      currentBaseUrl={currentBaseUrl}
      trailingSlash={trailingSlash}
      pathname={pathname}
      search={search}
      hash={hash}
      LinkComponent={DocusaurusLocaleLink}
      colorModeToggle={<NavbarColorModeToggle className={styles.colorModeToggle} />}
    />
  );
}
