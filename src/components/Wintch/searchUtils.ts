/**
 * 検索テキスト内のクエリ一致文字位置を計算し、ハイライト用のチャンク配列を返すヘルパー関数
 * @param text - 検索対象テキスト
 * @param query - 検索クエリ（空白区切り AND 対応）
 * @returns テキスト断片とハイライト有無の配列
 */
export function computeHighlightedSegments(
  text: string,
  query: string
): Array<{ text: string; matched: boolean }> {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return [{ text, matched: false }];
  }

  const lower = text.toLowerCase();
  const mask = new Array<boolean>(text.length).fill(false);

  for (const token of tokens) {
    const subIdx = lower.indexOf(token);
    if (subIdx !== -1) {
      for (let i = subIdx; i < subIdx + token.length; i += 1) {
        mask[i] = true;
      }
    } else {
      // 連続部分一致しない場合は文字順のファジーマッチ位置を抽出する
      let cursor = 0;
      const fuzzyIndices: number[] = [];
      for (const ch of token) {
        const found = lower.indexOf(ch, cursor);
        if (found === -1) {
          fuzzyIndices.length = 0;
          break;
        }
        fuzzyIndices.push(found);
        cursor = found + 1;
      }
      for (const idx of fuzzyIndices) {
        mask[idx] = true;
      }
    }
  }

  const segments: Array<{ text: string; matched: boolean }> = [];
  let currentText = '';
  let currentMatched = mask[0] ?? false;

  for (let i = 0; i < text.length; i += 1) {
    if (mask[i] === currentMatched) {
      currentText += text[i];
    } else {
      if (currentText) {
        segments.push({ text: currentText, matched: currentMatched });
      }
      currentText = text[i];
      currentMatched = mask[i];
    }
  }
  if (currentText) {
    segments.push({ text: currentText, matched: currentMatched });
  }

  return segments;
}

/**
 * スペース区切り AND 条件で文字列がトークン群に一致するか判定する関数
 * @param target - 判定対象の結合テキスト
 * @param query - 検索クエリ
 * @returns すべてのトークンが連続一致またはファジー一致する場合は true
 */
export function matchesFuzzyAndQuery(target: string, query: string): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }

  const lower = target.toLowerCase();
  return tokens.every((token) => {
    if (lower.includes(token)) {
      return true;
    }
    let cursor = 0;
    for (const ch of token) {
      const found = lower.indexOf(ch, cursor);
      if (found === -1) {
        return false;
      }
      cursor = found + 1;
    }
    return true;
  });
}
