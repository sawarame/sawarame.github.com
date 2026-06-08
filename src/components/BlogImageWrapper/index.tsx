import React from 'react';

/**
 * ブログ記事内の画像を中央揃えにし、オプションで下部にキャプション（説明文）を表示するラッパーコンポーネントです。
 * Docusaurusによる画像の相対パス解決やプラグイン（画像ズームなど）を正しく機能させるため、
 * コンポーネントの中に標準のMarkdown画像記法を配置して使用します。
 */
interface BlogImageWrapperProps {
  /** ラップする画像（Markdownの画像記法など） */
  children: React.ReactNode;
  /** 画像の下部に表示する説明文 */
  caption?: string;
}

export default function BlogImageWrapper({ children, caption }: BlogImageWrapperProps): React.JSX.Element {
  return (
    <div className="text--center" style={{ margin: '2rem 0' }}>
      {children}
      {caption && (
        <small style={{ display: 'block', marginTop: '-1rem', color: 'var(--ifm-color-emphasis-600)' }}>
          {caption}
        </small>
      )}
    </div>
  );
}
