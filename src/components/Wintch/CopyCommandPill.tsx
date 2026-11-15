import React, { useState, useCallback, useEffect, useRef } from 'react';
import { translate } from '@docusaurus/Translate';
import { Terminal, Copy, Check } from 'lucide-react';
import styles from './CopyCommandPill.module.css';

/**
 * CopyCommandPill コンポーネントの Props 型定義
 */
export interface CopyCommandPillProps {
  /** クリップボードへコピーするコマンド文字列 */
  command: string;
  /** 表示バリエーション（pill: ヒーロー等のピル型ボタン, block: インストール手順用のコードブロック型） */
  variant?: 'pill' | 'block';
  /** コピー対象コマンドの説明ラベル（アクセシビリティ用） */
  ariaLabel?: string;
}

/**
 * クリックでターミナルコマンドをクリップボードへコピーし、完了フィードバックを表示するボタンコンポーネント
 * @param props - コマンド文字列や表示バリエーションを含む Props
 * @returns コピー機能付きコマンドボタンの JSX 要素
 */
export default function CopyCommandPill({
  command,
  variant = 'pill',
  ariaLabel,
}: CopyCommandPillProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /**
   * コマンド文字列をクリップボードへコピーし、一時的にチェックマーク状態へ切り替える
   * @returns なし
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // クリップボード API が制限された環境向けのフォールバック処理
      const textarea = document.createElement('textarea');
      textarea.value = command;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [command]);

  const copiedLabel = translate({
    id: 'wintch.copy.copied',
    message: 'コピーしました',
  });

  const copyHint = translate({
    id: 'wintch.copy.hint',
    message: 'クリックしてコマンドをコピー',
  });

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={variant === 'block' ? styles.blockButton : styles.pillButton}
      aria-label={ariaLabel ?? `${command} (${copyHint})`}
      title={copied ? copiedLabel : copyHint}
    >
      <span className={styles.terminalIcon} aria-hidden="true">
        <Terminal size={16} strokeWidth={2} />
      </span>
      <code className={styles.commandText}>{command}</code>
      <span className={styles.statusWrap} aria-live="polite">
        {copied ? (
          variant === 'pill' ? (
            /* ピル型はボタン幅を広げないため、アイコンのみ切り替えつつ上部にバッジを浮かせる */
            <>
              <Check size={15} strokeWidth={2.5} className={styles.copiedIconOnly} aria-hidden="true" />
              <span className={styles.copiedFloatingBadge}>
                <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                <span>{copiedLabel}</span>
              </span>
            </>
          ) : (
            <span className={styles.copiedBadge}>
              <Check size={14} strokeWidth={2.5} aria-hidden="true" />
              <span>{copiedLabel}</span>
            </span>
          )
        ) : (
          <Copy size={15} strokeWidth={2} className={styles.copyIcon} aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
