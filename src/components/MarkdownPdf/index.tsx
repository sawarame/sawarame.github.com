import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import { translate } from '@docusaurus/Translate';
import BrowserOnly from '@docusaurus/BrowserOnly';

import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox, 
  Stack, 
  CircularProgress,
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DescriptionIcon from '@mui/icons-material/Description';

import MuiTheme from '@site/src/components/MuiTheme';
import common from '@site/src/css/common.module.css';
import styles from './styles.module.css';

import { jsPDF } from 'jspdf';
import { marked } from 'marked';

// 日本語フォント (Sawarabi Gothic) のローカルパス
const FONT_URL = '/fonts/SawarabiGothic-Regular.ttf';
const CACHE_NAME = 'markdown-pdf-sawarabi-font-cache';

// サンプルのマークダウンテキスト
const SAMPLE_MARKDOWN = `# 📁 マークダウンPDF変換デモ 🚀

これは、ブラウザ上でマークダウンからPDFを生成するツールのデモです。
**完全ローカル処理**のため、入力したテキストやファイルがサーバーに送信されることはありません。🔒

## 🛠️ 主要な対応要素

### 1. リストの表現（ネスト対応）
* 箇条書きの項目1 📝
* 箇条書きの項目2
  * ネストされた2階層目の項目 💡
    * さらにネストされた3階層目の項目 ⭐
* 箇条書きの項目3

---

### 2. 引用 (Blockquote)
> 知識は力なり。📖
> このツールは、クライアントサイドでPDFを安全に生成します。
>
> 複数行にわたる長い引用や、複数段落の引用文であっても、自動的にページをまたいで左側に縦線を描画し続けます。✨

### 3. コードブロック
\`\`\`javascript
// JavaScriptのサンプルコード
function helloWorld() {
  console.log("Hello, World! 🎉");
}
\`\`\`

### 4. テーブル (表・セル内自動折り返し)
| 項目 | 説明 | 備考 |
| :--- | :--- | :--- |
| PDF生成 ⚙️ | jsPDFを使用。非常に長い説明テキストがセル内に入った場合であっても、自動的にセル内で折り返して描画されます。 | クライアントサイド 💻 |
| パース 🔍 | markedを使用します。 | 高速処理 ⚡ |

---

上記のような基本的なマークダウン記法に対応しています。
お好みのテキストを入力するか、ファイルをアップロードして、右側の「PDFをダウンロード」ボタンを押してください。
`;

interface PdfOptions {
  fontSize: 'small' | 'medium' | 'large';
  margin: 'narrow' | 'normal' | 'wide';
  format: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  showPageNumbers: boolean;
}

function MarkdownPdfContent() {
  const history = useHistory();
  const location = useLocation();

  // 状態管理
  const [markdownText, setMarkdownText] = useState<string>('');
  const [pdfOptions, setPdfOptions] = useState<PdfOptions>({
    fontSize: 'medium',
    margin: 'normal',
    format: 'a4',
    orientation: 'portrait',
    showPageNumbers: true
  });
  
  const [activeTab, setActiveTab] = useState<number>(0); // 0: HTMLプレビュー, 1: PDFプレビュー
  const [isFontLoading, setIsFontLoading] = useState<boolean>(false);
  const [fontData, setFontData] = useState<ArrayBuffer | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URLパラメータと localStorage から初期値を復元
  useEffect(() => {
    const savedText = localStorage.getItem('markdown_pdf_text');
    if (savedText) {
      setMarkdownText(savedText);
    } else {
      setMarkdownText(SAMPLE_MARKDOWN);
    }

    const params = new URLSearchParams(location.search);
    const fs = params.get('fs') as PdfOptions['fontSize'] || 'medium';
    const mg = params.get('mg') as PdfOptions['margin'] || 'normal';
    const sz = params.get('sz') as PdfOptions['format'] || 'a4';
    const or = params.get('or') as PdfOptions['orientation'] || 'portrait';
    const pn = params.get('pn') !== 'false';

    setPdfOptions({
      fontSize: ['small', 'medium', 'large'].includes(fs) ? fs : 'medium',
      margin: ['narrow', 'normal', 'wide'].includes(mg) ? mg : 'normal',
      format: ['a4', 'letter'].includes(sz) ? sz : 'a4',
      orientation: ['portrait', 'landscape'].includes(or) ? or : 'portrait',
      showPageNumbers: pn
    });
  }, []);

  const updateOption = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
    const newOptions = { ...pdfOptions, [key]: value };
    setPdfOptions(newOptions);

    const params = new URLSearchParams(location.search);
    params.set('fs', newOptions.fontSize);
    params.set('mg', newOptions.margin);
    params.set('sz', newOptions.format);
    params.set('or', newOptions.orientation);
    params.set('pn', newOptions.showPageNumbers.toString());

    history.replace({ search: params.toString() });
  };

  const handleTextChange = (text: string) => {
    setMarkdownText(text);
    localStorage.setItem('markdown_pdf_text', text);
  };

  // 日本語フォントの読み込み (キャッシュ対応)
  const fetchFont = async (): Promise<ArrayBuffer> => {
    if (fontData) return fontData;
    
    setIsFontLoading(true);
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(FONT_URL);
        if (cachedResponse) {
          const buffer = await cachedResponse.arrayBuffer();
          setFontData(buffer);
          setIsFontLoading(false);
          return buffer;
        }
      }
      
      const response = await fetch(FONT_URL);
      if (!response.ok) throw new Error('Font download failed');
      
      const clone = response.clone();
      const buffer = await response.arrayBuffer();
      
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(FONT_URL, clone);
      }
      
      setFontData(buffer);
      setIsFontLoading(false);
      return buffer;
    } catch (error) {
      console.error('Error loading font:', error);
      setIsFontLoading(false);
      throw error;
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const generatePdfInstance = async (isDownload: boolean = false) => {
    if (!markdownText.trim()) return;
    
    setIsGeneratingPdf(true);
    try {
      const fontBuffer = await fetchFont();
      const fontBase64 = arrayBufferToBase64(fontBuffer);

      const doc = new jsPDF({
        orientation: pdfOptions.orientation,
        unit: 'mm',
        format: pdfOptions.format
      });

      // さわらびゴシックフォントを仮想ファイルシステムに登録
      doc.addFileToVFS('SawarabiGothic-Regular.ttf', fontBase64);
      doc.addFont('SawarabiGothic-Regular.ttf', 'SawarabiGothic', 'normal');
      doc.setFont('SawarabiGothic', 'normal');

      const marginMap = { narrow: 10, normal: 20, wide: 30 };
      const margin = marginMap[pdfOptions.margin];
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const writableWidth = pageWidth - 2 * margin;
      
      let currentY = margin;

      const fontSizeMap = {
        small: { body: 9, h1: 18, h2: 15, h3: 12, code: 8 },
        medium: { body: 11, h1: 22, h2: 18, h3: 15, code: 9.5 },
        large: { body: 13, h1: 26, h2: 22, h3: 18, code: 11 }
      };
      const sizes = fontSizeMap[pdfOptions.fontSize];

      const tokens = marked.lexer(markdownText);

      const ensureSpace = (neededHeight: number): boolean => {
        if (currentY + neededHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
          doc.setFont('SawarabiGothic', 'normal');
          return true;
        }
        return false;
      };

      // 絵文字の頭切れを防ぐためのパディング係数 (1.4倍の余白付きキャンバスに描画)
      const paddingFactor = 1.4;

      // 絵文字を一時的なCanvasで描画し、PNGのDataURLとして取得する (解像度向上のためスケールを適用)
      const renderEmojiToDataUrl = (emoji: string, fontSizePt: number): string => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        
        const fontSizePx = fontSizePt * 1.33;
        const scale = 2; // 2倍高解像度化
        const emojiSize = fontSizePx * scale;
        const canvasSize = emojiSize * paddingFactor;
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // OS固有の絵文字フォントを優先適用
        ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
        
        return canvas.toDataURL('image/png');
      };

      // 1行の中で太字、インラインコード、さらにはカラー絵文字を混在して描画するインラインワードラップエンジン
      const drawInlineText = (
        inlineTokens: any[], 
        size: number, 
        indent: number = 0, 
        isQuote: boolean = false,
        disableAutoPageBreak: boolean = false
      ) => {
        doc.setFontSize(size);
        const lineHeight = (size * 0.3528) * 1.5;
        
        let curX = margin + indent;
        const startX = margin + indent;
        const endX = pageWidth - margin;

        let hasLineForCurrentRow = false;

        // 最初の行 of 引用符縦線を描画
        if (isQuote && !hasLineForCurrentRow) {
          if (!disableAutoPageBreak) ensureSpace(lineHeight);
          doc.setFillColor(220, 220, 220);
          doc.rect(margin, currentY, 1.5, lineHeight, 'F');
          hasLineForCurrentRow = true;
        }

        inlineTokens.forEach((t: any) => {
          const isBold = t.type === 'strong';
          const isCode = t.type === 'codespan';
          const text = t.text || '';
          
          // サロゲートペア（絵文字）を壊さないように Array.from で文字を正しく分解
          const chars = Array.from(text);
          
          chars.forEach((charStr: any) => {
            const char = charStr as string;
            
            if (!hasLineForCurrentRow && isQuote) {
              if (!disableAutoPageBreak) ensureSpace(lineHeight);
              doc.setFillColor(220, 220, 220);
              doc.rect(margin, currentY, 1.5, lineHeight, 'F');
              hasLineForCurrentRow = true;
            }

            if (char === '\n') {
              if (!disableAutoPageBreak) ensureSpace(lineHeight);
              curX = startX;
              currentY += lineHeight;
              hasLineForCurrentRow = false;
              return;
            }

            // Unicode Property Escape を使って絵文字プレゼンテーションを判定 (英数字などを除外)
            const isEmoji = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u.test(char);
            
            // 絵文字はフォントサイズと同じ正方形として幅を決定
            const charWidth = isEmoji 
              ? (size * 0.3528 * 1.1) 
              : doc.getTextWidth(char);
            
            // 右端を超える場合は自動折り返し
            if (curX + charWidth > endX) {
              if (!disableAutoPageBreak) ensureSpace(lineHeight);
              curX = startX;
              currentY += lineHeight;
              hasLineForCurrentRow = false;
            } else {
              // ページ下端チェック
              const pageChanged = !disableAutoPageBreak ? ensureSpace(lineHeight) : false;
              if (pageChanged) {
                curX = startX;
                hasLineForCurrentRow = false;
              }
            }

            // 引用符の再描画チェック
            if (isQuote && !hasLineForCurrentRow) {
              doc.setFillColor(220, 220, 220);
              doc.rect(margin, currentY, 1.5, lineHeight, 'F');
              hasLineForCurrentRow = true;
            }

            if (isEmoji) {
              // 絵文字を画像としてPDFにインライン埋め込み
              const emojiDataUrl = renderEmojiToDataUrl(char, size);
              if (emojiDataUrl) {
                // 余白分を考慮して、描画サイズを拡大し、座標を少し左上にずらすことで
                // 見かけ上のサイズと位置を維持したまま、頭切れを防ぐ
                const drawWidth = charWidth * paddingFactor;
                const offsetX = (drawWidth - charWidth) / 2;
                doc.addImage(
                  emojiDataUrl, 
                  'PNG', 
                  curX - offsetX, 
                  currentY + 0.3 - offsetX, 
                  drawWidth, 
                  drawWidth
                );
              }
            } else if (isBold) {
              // 擬似ボールド適用
              doc.setLineWidth(size * 0.008);
              doc.text(char, curX, currentY + (size * 0.3528), { renderingMode: 'fillThenStroke' });
            } else if (isCode) {
              // インラインコード背景の描画
              doc.setFillColor(240, 240, 240);
              doc.rect(curX, currentY + 1, charWidth, size * 0.3528 + 1, 'F');
              doc.text(char, curX, currentY + (size * 0.3528));
            } else {
              doc.text(char, curX, currentY + (size * 0.3528));
            }

            curX += charWidth;
          });
        });

        // 段落の最後で行送り
        currentY += lineHeight;
      };

      // プレーンテキストの描画 (改行・ワードラップ対応、見出し等のブロック用)
      const drawParagraph = (
        text: string, 
        size: number, 
        indent: number = 0, 
        isBold: boolean = false,
        disableAutoPageBreak: boolean = false
      ) => {
        // 絵文字対応のため、ダミートークンとして drawInlineText に流し込む
        const dummyToken = [{ type: isBold ? 'strong' : 'text', text }];
        drawInlineText(dummyToken, size, indent, false, disableAutoPageBreak);
      };

      // リストを再帰的にインデントを下げて描画する関数 (ネスト対応)
      const drawList = (listToken: any, depth: number = 0, isQuote: boolean = false) => {
        const indent = (depth * 6) + (isQuote ? 6 : 0);
        
        listToken.items.forEach((item: any, index: number) => {
          const prefix = listToken.ordered ? `${index + 1}. ` : '・ ';
          
          const inlineTokens: any[] = [];
          const nestedLists: any[] = [];
          
          if (item.tokens) {
            item.tokens.forEach((subt: any) => {
              if (subt.type === 'text' || subt.type === 'paragraph') {
                if (subt.tokens) {
                  inlineTokens.push(...subt.tokens);
                } else {
                  inlineTokens.push(subt);
                }
              } else if (subt.type === 'list') {
                nestedLists.push(subt);
              } else {
                inlineTokens.push(subt);
              }
            });
          } else {
            inlineTokens.push({ type: 'text', text: item.text });
          }

          doc.setFontSize(sizes.body);
          const itemLineHeight = (sizes.body * 0.3528) * 1.5;
          ensureSpace(itemLineHeight);
          
          if (isQuote) {
            doc.setFillColor(220, 220, 220);
            doc.rect(margin, currentY, 1.5, itemLineHeight, 'F');
          }
          
          // リスト接頭辞の描画 (サロゲートペア対応のインライン処理に統合しないため別途描画)
          doc.text(prefix, margin + 2 + indent, currentY + (sizes.body * 0.3528));
          
          // リスト本文のインライン描画
          drawInlineText(inlineTokens, sizes.body, 7 + indent, isQuote);
          
          // ネストされたリストがある場合は再帰的に描画
          nestedLists.forEach((nestedList: any) => {
            drawList(nestedList, depth + 1, isQuote);
          });
        });
      };

      // テーブルのヘッダーを描画するヘルパー
      const drawTableHeader = (headers: string[], colWidth: number) => {
        const headerHeight = (sizes.body * 0.3528) * 2;
        ensureSpace(headerHeight);
        
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, currentY, writableWidth, headerHeight, 'F');
        
        doc.setFontSize(sizes.body);
        doc.setFont('SawarabiGothic', 'normal');
        
        const baseOffsetY = currentY + (sizes.body * 0.3528) / 2; // 補正用のベースY座標 (上下中央揃え)
        
        headers.forEach((header: string, i: number) => {
          const dummy = [{ type: 'text', text: header }];
          
          // 各セルの描画時は、常に一定の baseOffsetY を基準にする
          const savedY = currentY;
          currentY = baseOffsetY;
          // ヘッダー描画時は自動改ページを無効化
          drawInlineText(dummy, sizes.body, (i * colWidth) + 2, false, true);
          currentY = savedY; // 元の Y 座標に戻す
        });
        currentY += headerHeight;
      };

      tokens.forEach((token) => {
        if (token.type === 'space') {
          currentY += 4;
        } 
        else if (token.type === 'hr') {
          ensureSpace(6);
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(margin, currentY + 3, pageWidth - margin, currentY + 3);
          currentY += 8;
        }
        else if (token.type === 'heading') {
          const headingSize = token.depth === 1 ? sizes.h1 : token.depth === 2 ? sizes.h2 : sizes.h3;
          const headingLineHeight = (headingSize * 0.3528) * 1.5;
          const bodyLineHeight = (sizes.body * 0.3528) * 1.5;
          
          const neededSpace = headingLineHeight + (bodyLineHeight * 2) + 6;
          ensureSpace(neededSpace);

          currentY += 4;
          drawParagraph(token.text, headingSize, 0, true);
          
          if (token.depth === 2) {
            ensureSpace(2);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 4;
          } else {
            currentY += 2;
          }
        } 
        else if (token.type === 'paragraph') {
          const inlineTokens = token.tokens || [{ type: 'text', text: token.text }];
          drawInlineText(inlineTokens, sizes.body);
          currentY += 3;
        } 
        else if (token.type === 'list') {
          drawList(token, 0);
          currentY += 3;
        } 
        else if (token.type === 'blockquote') {
          const subTokens = token.tokens || [];
          
          subTokens.forEach((subToken: any) => {
            if (subToken.type === 'space') {
              const spaceHeight = 4;
              ensureSpace(spaceHeight);
              doc.setFillColor(220, 220, 220);
              doc.rect(margin, currentY, 1.5, spaceHeight, 'F');
              currentY += spaceHeight;
            }
            else if (subToken.type === 'paragraph') {
              const inlineTokens = subToken.tokens || [{ type: 'text', text: subToken.text }];
              drawInlineText(inlineTokens, sizes.body, 6, true);
              
              const spacing = 3;
              ensureSpace(spacing);
              doc.setFillColor(220, 220, 220);
              doc.rect(margin, currentY, 1.5, spacing, 'F');
              currentY += spacing;
            }
            else if (subToken.type === 'list') {
              drawList(subToken, 0, true);
            }
          });
          
          currentY += 4;
        } 
        else if (token.type === 'code') {
          const lines = doc.splitTextToSize(token.text, writableWidth - 6);
          const lineHeight = (sizes.code * 0.3528) * 1.4;
          
          doc.setFontSize(sizes.code);
          
          ensureSpace(lineHeight + 2);
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, currentY, writableWidth, 2, 'F');
          currentY += 2;

          lines.forEach((line: string) => {
            const pageChanged = ensureSpace(lineHeight);
            if (pageChanged) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, currentY, writableWidth, 2, 'F');
              currentY += 2;
            }

            doc.setFillColor(245, 245, 245);
            doc.rect(margin, currentY, writableWidth, lineHeight, 'F');
            
            // コードブロック行の描画 (コード内絵文字対応のため drawParagraph に変更、自動改ページ無効化)
            drawParagraph(line, sizes.code, 3, false, true);
          });

          ensureSpace(2);
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, currentY, writableWidth, 2, 'F');
          currentY += 2;
          
          currentY += 4;
        } 
        else if (token.type === 'table') {
          const headers = token.header.map((h: any) => h.text);
          const rows = token.rows.map((row: any) => row.map((cell: any) => cell.text));
          
          const colCount = headers.length;
          const colWidth = writableWidth / colCount;
          
          drawTableHeader(headers, colWidth);

          rows.forEach((row: string[]) => {
            const cellLines = row.map(cell => doc.splitTextToSize(cell, colWidth - 4));
            
            const maxLines = Math.max(...cellLines.map(lines => lines.length), 1);
            const linePadding = 1.5;
            const singleLineHeight = (sizes.body * 0.3528) * 1.3;
            const calculatedRowHeight = (maxLines * singleLineHeight) + (linePadding * 2);

            const pageChanged = ensureSpace(calculatedRowHeight);
            if (pageChanged) {
              drawTableHeader(headers, colWidth);
            }

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.line(margin, currentY, margin + writableWidth, currentY);

            // 各セルの折り返しテキスト描画 (絵文字対応のため、drawParagraph の擬似インライン化を適用)
            doc.setFontSize(sizes.body);
            row.forEach((cell: string, i: number) => {
              const lines = cellLines[i];
              lines.forEach((line: string, lineIdx: number) => {
                const savedY = currentY;
                // 各行の位置を算出して一時的に currentY を動かし描画する (上端基準で計算)
                currentY = currentY + linePadding + (lineIdx * singleLineHeight);
                const dummy = [{ type: 'text', text: line }];
                // セル内テキスト描画時は自動改ページを無効化
                drawInlineText(dummy, sizes.body, (i * colWidth) + 2, false, true);
                currentY = savedY;
              });
            });

            currentY += calculatedRowHeight;
          });
          currentY += 4;
        }
        else if (token.type === 'image') {
          const altText = token.text || 'Image';
          drawParagraph(`[画像: ${altText}]`, sizes.body);
          currentY += 3;
        }
      });

      // ページ番号の描画
      if (pdfOptions.showPageNumbers) {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const pageNumText = `${i} / ${totalPages}`;
          const textWidth = doc.getTextWidth(pageNumText);
          doc.text(pageNumText, (pageWidth - textWidth) / 2, pageHeight - 10);
        }
      }

      if (isDownload) {
        const date = new Date();
        const timestamp = date.getFullYear().toString() +
          (date.getMonth() + 1).toString().padStart(2, '0') +
          date.getDate().toString().padStart(2, '0') +
          date.getHours().toString().padStart(2, '0') +
          date.getMinutes().toString().padStart(2, '0') +
          date.getSeconds().toString().padStart(2, '0');
        
        doc.save(`markdown_${timestamp}.pdf`);
      } else {
        const blob = doc.output('blob');
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
        const newUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(newUrl);
        setActiveTab(1);
      }
    } catch (error) {
      console.error(error);
      alert(translate({ id: 'markdownPdf.error.generate', message: 'PDFの生成中にエラーが発生しました。' }));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleTextChange(text);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasteText = event.clipboardData.getData('text');
    if (pasteText && !markdownText.trim()) {
      handleTextChange(pasteText);
    }
  };

  const handleInsertSample = () => {
    handleTextChange(SAMPLE_MARKDOWN);
  };

  const handleClearText = () => {
    if (window.confirm(translate({ id: 'markdownPdf.confirm.clear', message: 'テキストをクリアしますか？' }))) {
      handleTextChange('');
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <MuiTheme>
      <Box className={styles.container} onPaste={handlePaste}>
        <Stack spacing={4}>
          
          {/* 1. ファイル選択エリア (DropZone) */}
          <div className={common.card}>
            <h2 className={common.cardTitle}>
              <span className={common.cardTitleIcon}>📁</span>
              {translate({ id: 'markdownPdf.upload.title', message: 'マークダウンファイルを選択' })}
            </h2>
            <div
              className={`${common.dropZone} ${isDragOver ? common.dropZoneActive : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  readFileContent(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <DescriptionIcon className={common.dropZoneIcon} color="primary" sx={{ fontSize: '3rem !important' }} />
              <p className={common.dropZoneText}>
                {translate({ id: 'markdownPdf.upload.dropLabel', message: 'クリック・ドラッグ＆ドロップ、または貼り付けで選択' })}
              </p>
              <p className={common.dropZoneSubText}>
                {translate({ id: 'markdownPdf.upload.formats', message: '対応フォーマット: Markdown (.md)' })}
              </p>
              <input
                type="file"
                accept=".md,.txt"
                hidden
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* 2. エディタエリア */}
          <Card variant="outlined" className={styles.card}>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    {translate({ id: 'markdownPdf.editor.title', message: 'マークダウン入力' })}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="secondary"
                      startIcon={<AutoFixHighIcon />}
                      onClick={handleInsertSample}
                    >
                      {translate({ id: 'markdownPdf.editor.sample', message: 'サンプル挿入' })}
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearText}
                      disabled={!markdownText}
                    >
                      {translate({ id: 'markdownPdf.editor.clear', message: 'クリア' })}
                    </Button>
                  </Stack>
                </Box>

                <TextField
                  multiline
                  rows={15}
                  value={markdownText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={translate({ id: 'markdownPdf.editor.placeholder', message: '# ここにマークダウンを入力します...' })}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    className: styles.textarea
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* 3. PDF 出力設定 */}
          <Card variant="outlined" className={styles.card}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 800 }}>
                ⚙️ {translate({ id: 'markdownPdf.options.title', message: 'PDF 出力設定' })}
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{translate({ id: 'markdownPdf.options.fontSize', message: 'フォントサイズ' })}</InputLabel>
                    <Select
                      value={pdfOptions.fontSize}
                      label={translate({ id: 'markdownPdf.options.fontSize', message: 'フォントサイズ' })}
                      onChange={(e) => updateOption('fontSize', e.target.value as PdfOptions['fontSize'])}
                    >
                      <MenuItem value="small">{translate({ id: 'markdownPdf.options.fontSize.small', message: '小 (10pt)' })}</MenuItem>
                      <MenuItem value="medium">{translate({ id: 'markdownPdf.options.fontSize.medium', message: '中 (12pt)' })}</MenuItem>
                      <MenuItem value="large">{translate({ id: 'markdownPdf.options.fontSize.large', message: '大 (14pt)' })}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{translate({ id: 'markdownPdf.options.margin', message: '余白' })}</InputLabel>
                    <Select
                      value={pdfOptions.margin}
                      label={translate({ id: 'markdownPdf.options.margin', message: '余白' })}
                      onChange={(e) => updateOption('margin', e.target.value as PdfOptions['margin'])}
                    >
                      <MenuItem value="narrow">{translate({ id: 'markdownPdf.options.margin.narrow', message: '狭い (10mm)' })}</MenuItem>
                      <MenuItem value="normal">{translate({ id: 'markdownPdf.options.margin.normal', message: '標準 (20mm)' })}</MenuItem>
                      <MenuItem value="wide">{translate({ id: 'markdownPdf.options.margin.wide', message: '広い (30mm)' })}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{translate({ id: 'markdownPdf.options.format', message: '用紙サイズ' })}</InputLabel>
                    <Select
                      value={pdfOptions.format}
                      label={translate({ id: 'markdownPdf.options.format', message: '用紙サイズ' })}
                      onChange={(e) => updateOption('format', e.target.value as PdfOptions['format'])}
                    >
                      <MenuItem value="a4">A4</MenuItem>
                      <MenuItem value="letter">Letter</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{translate({ id: 'markdownPdf.options.orientation', message: '向き' })}</InputLabel>
                    <Select
                      value={pdfOptions.orientation}
                      label={translate({ id: 'markdownPdf.options.orientation', message: '向き' })}
                      onChange={(e) => updateOption('orientation', e.target.value as PdfOptions['orientation'])}
                    >
                      <MenuItem value="portrait">{translate({ id: 'markdownPdf.options.orientation.portrait', message: '縦' })}</MenuItem>
                      <MenuItem value="landscape">{translate({ id: 'markdownPdf.options.orientation.landscape', message: '横' })}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} display="flex" alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={pdfOptions.showPageNumbers}
                        onChange={(e) => updateOption('showPageNumbers', e.target.checked)}
                      />
                    }
                    label={translate({ id: 'markdownPdf.options.pageNumbers', message: 'ページ番号をフッターに表示する' })}
                  />
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => generatePdfInstance(false)}
                  disabled={isGeneratingPdf || isFontLoading || !markdownText.trim()}
                  startIcon={isGeneratingPdf ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isFontLoading 
                    ? translate({ id: 'markdownPdf.btn.loadingFont', message: 'フォント準備中...' }) 
                    : translate({ id: 'markdownPdf.btn.preview', message: 'PDF プレビュー生成' })
                  }
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => generatePdfInstance(true)}
                  disabled={isGeneratingPdf || isFontLoading || !markdownText.trim()}
                  startIcon={isGeneratingPdf ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                >
                  {translate({ id: 'markdownPdf.btn.download', message: 'PDF ダウンロード' })}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* 4. プレビューエリア */}
          <Card variant="outlined" className={styles.card}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} variant="fullWidth">
                <Tab label={translate({ id: 'markdownPdf.tab.previewHtml', message: 'HTML プレビュー' })} />
                <Tab label={translate({ id: 'markdownPdf.tab.previewPdf', message: 'PDF プレビュー' })} disabled={!pdfBlobUrl} />
              </Tabs>
            </Box>
            <CardContent className={styles.previewContainer}>
              {activeTab === 0 && (
                <Paper variant="outlined" className={styles.htmlPreview}>
                  {markdownText ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: marked.parse(markdownText) as string 
                      }} 
                    />
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                      <Typography color="text.secondary">
                        {translate({ id: 'markdownPdf.preview.empty', message: 'マークダウンを入力すると、ここにプレビューが表示されます。' })}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}

              {activeTab === 1 && pdfBlobUrl && (
                <Box className={styles.pdfPreviewWrap}>
                  <iframe
                    src={`${pdfBlobUrl}#toolbar=0`}
                    width="100%"
                    height="100%"
                    className={styles.pdfIframe}
                    title="PDF Preview"
                  />
                </Box>
              )}
            </CardContent>
          </Card>

        </Stack>
      </Box>
    </MuiTheme>
  );
}

export default function MarkdownPdf() {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => <MarkdownPdfContent />}
    </BrowserOnly>
  );
}
