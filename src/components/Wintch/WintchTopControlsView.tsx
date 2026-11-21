import React, { useEffect, useRef, useState } from 'react';
import { translate } from '@docusaurus/Translate';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { buildAlternateLocaleLinkTarget } from './localeUtils';
import styles from './WintchTopControls.module.css';

/**
 * Docusaurus ロケール設定の最小表現型
 */
export interface LocaleConfigItem {
  /** UI 表示用ラベル（例: "日本語", "English"） */
  label?: string;
  /** HTML lang 属性値（例: "ja", "en"） */
  htmlLang?: string;
  /** ロケール固有のベース URL */
  baseUrl?: string;
  /** ロケール固有のサイト URL */
  url?: string;
}

/**
 * 言語リンクを描画するためのリンクコンポーネント Props 型定義
 */
export interface LocaleLinkProps {
  /** 遷移先 URL または Docusaurus pathname:// ターゲット */
  to: string;
  /** リンクターゲット（_self 等） */
  target?: string;
  /** ベース URL 自動付与の制御フラグ */
  autoAddBaseUrl?: boolean;
  /** 対象言語コード */
  lang?: string;
  /** hreflang 属性値 */
  hrefLang?: string;
  /** WAI-ARIA role */
  role?: string;
  /** 現在ページ表記用の aria-current */
  'aria-current'?: 'page';
  /** CSS クラス名 */
  className?: string;
  /** クリック時ハンドラ */
  onClick?: () => void;
  /** 子要素 */
  children: React.ReactNode;
}

/**
 * WintchTopControlsView コンポーネントの Props 型定義
 */
export interface WintchTopControlsViewProps {
  /** 現在アクティブなロケール識別子 */
  currentLocale: string;
  /** 利用可能なロケール一覧 */
  locales: string[];
  /** ロケールごとの設定マップ */
  localeConfigs: Record<string, LocaleConfigItem>;
  /** 現在のサイト URL */
  currentSiteUrl: string;
  /** 現在のロケールベース URL */
  currentBaseUrl: string;
  /** Docusaurus の trailingSlash 設定 */
  trailingSlash?: boolean;
  /** 現在のパス名 */
  pathname: string;
  /** 現在のクエリ文字列 */
  search: string;
  /** 現在のハッシュ文字列 */
  hash: string;
  /** 言語リンクの描画に使用するコンポーネント */
  LinkComponent: React.ComponentType<LocaleLinkProps>;
  /** ダークモード切替コントロール要素 */
  colorModeToggle: React.ReactNode;
}

/**
 * Wintch 紹介ページ上部の言語切替・ダークモード切替 UI を描画するビューコンポーネント
 * @param props - ロケール情報・現在 URL・リンク描画コンポーネント・カラーモード切替要素
 * @returns トップコントロールバーの JSX 要素
 */
export default function WintchTopControlsView({
  currentLocale,
  locales,
  localeConfigs,
  currentSiteUrl,
  currentBaseUrl,
  trailingSlash,
  pathname,
  search,
  hash,
  LinkComponent,
  colorModeToggle,
}: WintchTopControlsViewProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外部のクリック・フォーカス移動・Escape キーでメニューを閉じる
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    /**
     * 外側クリックまたはフォーカスアウトを検知してメニューを閉じるハンドラ
     * @param event - DOM イベントオブジェクト
     */
    const handleOutsideInteraction = (event: Event): void => {
      const target = event.target as Node | null;
      if (!dropdownRef.current || (target && dropdownRef.current.contains(target))) {
        return;
      }
      setIsMenuOpen(false);
    };

    /**
     * Escape キー押下時にメニューを閉じるハンドラ
     * @param event - キーボードイベントオブジェクト
     */
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction);
    document.addEventListener('focusin', handleOutsideInteraction);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('focusin', handleOutsideInteraction);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const currentLocaleLabel = localeConfigs[currentLocale]?.label ?? currentLocale;

  return (
    <div className={styles.controlsBar}>
      <div className={styles.controlsPill}>
        {/* 言語切替ドロップダウン */}
        <div ref={dropdownRef} className={styles.localeDropdown}>
          <button
            type="button"
            className={styles.localeTrigger}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={translate({
              id: 'wintch.topControls.languageAria',
              message: '言語を切り替え',
            })}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <Languages size={15} strokeWidth={2} aria-hidden="true" />
            <span>{currentLocaleLabel}</span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              aria-hidden="true"
              className={`${styles.chevronIcon} ${isMenuOpen ? styles.chevronIconOpen : ''}`}
            />
          </button>

          {isMenuOpen && (
            <ul
              role="menu"
              aria-label={translate({
                id: 'wintch.topControls.menuAria',
                message: '言語一覧',
              })}
              className={styles.localeMenu}
            >
              {locales.map((locale) => {
                const config = localeConfigs[locale];
                const label = config?.label ?? locale;
                const htmlLang = config?.htmlLang ?? locale;
                const isCurrent = locale === currentLocale;
                const linkTarget = buildAlternateLocaleLinkTarget({
                  pathname,
                  search,
                  hash,
                  currentBaseUrl,
                  targetBaseUrl: config?.baseUrl ?? currentBaseUrl,
                  currentSiteUrl,
                  targetSiteUrl: config?.url ?? currentSiteUrl,
                  trailingSlash,
                });

                return (
                  <li key={locale} role="none">
                    <LinkComponent
                      to={linkTarget}
                      target="_self"
                      autoAddBaseUrl={false}
                      lang={htmlLang}
                      hrefLang={htmlLang}
                      role="menuitem"
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`${styles.localeMenuItem} ${isCurrent ? styles.localeMenuItemActive : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{label}</span>
                      {isCurrent && <Check size={14} strokeWidth={2.2} aria-hidden="true" />}
                    </LinkComponent>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <span className={styles.divider} aria-hidden="true" />

        {/* ダークモード / ライトモード切替ボタン */}
        {colorModeToggle}
      </div>
    </div>
  );
}
