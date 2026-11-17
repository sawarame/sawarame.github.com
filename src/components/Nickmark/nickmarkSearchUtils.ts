/**
 * デモ用ブックマーク項目の型定義
 */
export interface DemoBookmarkItem {
  /** 一意の識別子 */
  id: string;
  /** ニックネーム（スラッシュ区切りでフォルダを表現） */
  nickname: string;
  /** ページタイトル */
  title: string;
  /** 遷移先 URL（%s プレースホルダーや javascript: を含む） */
  url: string;
  /** 省略時デフォルト値（任意） */
  defaultValue?: string;
  /** ピン留めフラグ */
  isPinned?: boolean;
  /** 指数減衰スコア */
  score: number;
  /** 最終利用ラベル */
  lastUsedLabel: string;
}

/**
 * 検索結果アイテムの型定義
 */
export interface DemoSearchResult {
  /** 種別（通常ブックマーク / 動的URL / ブックマークレット / フォルダ一括オープン / コマンド） */
  kind: 'bookmark' | 'bookmarklet' | 'folder' | 'command';
  /** 一意キー */
  id: string;
  /** バッジ表示テキスト（ニックネームやコマンド） */
  badge: string;
  /** 主見出しタイトル */
  title: string;
  /** 展開後または表示用 URL / 説明 */
  subtitle: string;
  /** 種別タグ（[%s], [JS], 📁 等） */
  typeTag?: string;
  /** ピン留め状態 */
  isPinned?: boolean;
  /** Tab 補完時に入力欄へ反映するテキスト */
  fillText: string;
  /** 実行時のアクション種別用データ */
  executeValue: string;
}

/**
 * 動的 URL の `%s` を引数で展開するヘルパー関数
 * @param templateUrl - `%s` を含むテンプレート URL
 * @param arg - 埋め込む引数文字列
 * @param defaultValue - 引数省略時のデフォルト値（任意）
 * @returns 展開後の URL 文字列
 */
export function expandDemoDynamicUrl(
  templateUrl: string,
  arg: string,
  defaultValue?: string
): string {
  if (!templateUrl.includes('%s') || /^javascript:/i.test(templateUrl.trim())) {
    return templateUrl;
  }
  const trimmedArg = arg.trim();
  if (trimmedArg) {
    const queryIdx = templateUrl.indexOf('?');
    const hashIdx = templateUrl.indexOf('#');
    let boundary = templateUrl.length;
    if (queryIdx !== -1) boundary = Math.min(boundary, queryIdx);
    if (hashIdx !== -1) boundary = Math.min(boundary, hashIdx);

    const encodedPath = trimmedArg
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    const encodedQuery = encodeURIComponent(trimmedArg);

    return templateUrl.replace(/%s/g, (_match, offset: number) =>
      offset < boundary ? encodedPath : encodedQuery
    );
  }
  if (defaultValue && defaultValue.trim()) {
    return expandDemoDynamicUrl(templateUrl, defaultValue.trim());
  }
  try {
    const parsed = new URL(templateUrl.replace(/%s/g, ''));
    return parsed.origin;
  } catch {
    return templateUrl.replace(/%s/g, '');
  }
}

/**
 * ブックマーク配列からスラッシュ区切りのフォルダ一覧と配下件数を抽出する
 * @param bookmarks - デモブックマーク一覧
 * @returns フォルダパスと件数のマップ
 */
export function extractDemoFolders(bookmarks: DemoBookmarkItem[]): Map<string, number> {
  const folderUrls = new Map<string, Set<string>>();

  for (const item of bookmarks) {
    const parts = item.nickname.split('/').filter(Boolean);
    if (parts.length <= 1) continue;
    let current = '';
    for (let i = 0; i < parts.length - 1; i += 1) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      if (!folderUrls.has(current)) {
        folderUrls.set(current, new Set<string>());
      }
      if (!/^javascript:/i.test(item.url)) {
        folderUrls.get(current)!.add(item.url);
      }
    }
  }

  const counts = new Map<string, number>();
  for (const [path, urls] of folderUrls.entries()) {
    if (urls.size > 0) {
      counts.set(path, urls.size);
    }
  }
  return counts;
}

/**
 * 組み込みコマンドの定義一覧
 */
const DEMO_COMMANDS: Array<{
  cmd: string;
  aliases: string[];
  usage: string;
  descJa: string;
  descEn: string;
}> = [
  {
    cmd: ':add',
    aliases: [':a'],
    usage: ':add [nickname]',
    descJa: '現在のタブを登録（または URL・ブックマークレットを指定）',
    descEn: 'Save active tab (or specify URL / bookmarklet)',
  },
  {
    cmd: ':addall',
    aliases: [':aa'],
    usage: ':addall [nickname]',
    descJa: '現在のウィンドウの全タブを一括登録',
    descEn: 'Save all open tabs in the current window',
  },
  {
    cmd: ':rm',
    aliases: [],
    usage: ':rm [nickname]',
    descJa: 'ニックネームまたは特定の URL を削除',
    descEn: 'Remove a nickname or a specific URL entry',
  },
  {
    cmd: ':ls',
    aliases: [],
    usage: ':ls',
    descJa: 'ブックマーク一覧・管理画面を開く',
    descEn: 'Open the bookmark management dashboard',
  },
  {
    cmd: ':prefs',
    aliases: [],
    usage: ':prefs',
    descJa: '設定画面（同期・言語・履歴検索・上限件数）を開く',
    descEn: 'Open Preferences (sync, language, history, batch limit)',
  },
  {
    cmd: ':help',
    aliases: [],
    usage: ':help',
    descJa: 'ヘルプ・ドキュメントを開く',
    descEn: 'Open the documentation page',
  },
];

/**
 * 入力クエリから Nickmark コマンドパレットのデモ候補リストを生成する
 * @param rawQuery - 入力された検索/コマンド文字列
 * @param bookmarks - 現在のデモブックマーク配列
 * @param locale - 表示ロケール（'ja' または 'en'）
 * @returns パレット候補配列
 */
export function buildDemoPaletteItems(
  rawQuery: string,
  bookmarks: DemoBookmarkItem[],
  locale: 'ja' | 'en' = 'ja'
): DemoSearchResult[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  // コマンドモード（':' プレフィックス）
  if (trimmed.startsWith(':')) {
    const spaceIdx = trimmed.indexOf(' ');
    const cmdToken = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const argText = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();
    const results: DemoSearchResult[] = [];

    for (const def of DEMO_COMMANDS) {
      const targets = [def.cmd, ...def.aliases];
      const matches = spaceIdx === -1
        ? targets.some((t) => t.startsWith(cmdToken))
        : targets.includes(cmdToken);
      if (!matches) continue;

      if ((def.cmd === ':add' || def.cmd === ':addall' || def.cmd === ':rm') && argText) {
        results.push({
          kind: 'command',
          id: `cmd-exec-${def.cmd}`,
          badge: def.cmd,
          title: `${def.cmd} ${argText}`,
          subtitle: locale === 'en' ? def.descEn : def.descJa,
          fillText: `${def.cmd} ${argText}`,
          executeValue: `${def.cmd} ${argText}`,
        });
      } else {
        results.push({
          kind: 'command',
          id: `cmd-${def.cmd}`,
          badge: def.cmd,
          title: def.usage,
          subtitle: locale === 'en' ? def.descEn : def.descJa,
          fillText: def.cmd === ':ls' || def.cmd === ':prefs' || def.cmd === ':help' ? def.cmd : `${def.cmd} `,
          executeValue: def.cmd === ':ls' || def.cmd === ':prefs' || def.cmd === ':help' ? def.cmd : `${def.cmd} ${argText}`.trim(),
        });
      }
    }
    return results;
  }

  // 通常検索モード（ニックネーム一致ティア ＞ ピン留め ＞ スコア降順）
  const firstSpace = trimmed.search(/\s+/);
  const firstToken = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
  const restArg = firstSpace === -1 ? '' : trimmed.slice(firstSpace).trim();
  const firstLower = firstToken.toLowerCase();
  const allTokensLower = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  const folders = extractDemoFolders(bookmarks);
  const isExplicitFolder = trimmed.endsWith('/');
  const cleanFolder = trimmed.replace(/^\/+|\/+$/g, '').toLowerCase();

  const scored: Array<{ tier: number; item: DemoBookmarkItem; resolvedUrl: string; isDynamic: boolean }> = [];

  for (const item of bookmarks) {
    const nickLower = item.nickname.toLowerCase();
    const isDynamic = item.url.includes('%s') && !/^javascript:/i.test(item.url);
    let tier: number | null = null;

    if (nickLower === firstLower) {
      tier = 1;
    } else if (nickLower.startsWith(firstLower)) {
      tier = 2;
    } else if (nickLower.includes(firstLower)) {
      tier = 3;
    }

    if (tier !== null) {
      if (isDynamic) {
        scored.push({
          tier,
          item,
          resolvedUrl: expandDemoDynamicUrl(item.url, restArg, item.defaultValue),
          isDynamic: true,
        });
      } else {
        const searchable = `${item.nickname} ${item.title} ${item.url}`.toLowerCase();
        const restTokens = restArg ? restArg.toLowerCase().split(/\s+/).filter(Boolean) : [];
        if (restTokens.every((tok) => searchable.includes(tok))) {
          scored.push({ tier, item, resolvedUrl: item.url, isDynamic: false });
        }
      }
    } else {
      const fullSearchable = `${item.nickname} ${item.title} ${item.url}`.toLowerCase();
      if (allTokensLower.every((tok) => fullSearchable.includes(tok))) {
        scored.push({
          tier: 4,
          item,
          resolvedUrl: isDynamic ? expandDemoDynamicUrl(item.url, '', item.defaultValue) : item.url,
          isDynamic,
        });
      }
    }
  }

  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const pinDiff = (b.item.isPinned ? 1 : 0) - (a.item.isPinned ? 1 : 0);
    if (pinDiff !== 0) return pinDiff;
    return b.item.score - a.item.score;
  });

  const results: DemoSearchResult[] = scored.map(({ item, resolvedUrl, isDynamic }) => {
    const isBookmarklet = /^javascript:/i.test(item.url);
    return {
      kind: isBookmarklet ? 'bookmarklet' : 'bookmark',
      id: item.id,
      badge: item.nickname,
      title: item.title,
      subtitle: resolvedUrl,
      typeTag: isBookmarklet
        ? '[JS]'
        : isDynamic
          ? restArg
            ? `(${restArg})`
            : '[%s]'
          : undefined,
      isPinned: item.isPinned,
      fillText: isDynamic && restArg ? `${item.nickname} ${restArg}` : item.nickname,
      executeValue: resolvedUrl,
    };
  });

  // フォルダ一括オープン候補の挿入
  if (cleanFolder) {
    for (const [folderPath, count] of folders.entries()) {
      const pathLower = folderPath.toLowerCase();
      if (pathLower === cleanFolder || (!isExplicitFolder && pathLower.startsWith(cleanFolder))) {
        const folderResult: DemoSearchResult = {
          kind: 'folder',
          id: `folder-${folderPath}`,
          badge: `${folderPath}/`,
          title:
            locale === 'en'
              ? `Open all bookmarks in "${folderPath}" (${count} tabs)`
              : `フォルダ「${folderPath}」を一括オープン (${count}タブ)`,
          subtitle: `${folderPath}/`,
          typeTag: `📁 ${count}`,
          fillText: `${folderPath}/`,
          executeValue: `folder:${folderPath}`,
        };
        if (isExplicitFolder) {
          results.unshift(folderResult);
        } else {
          const insertIdx = scored[0]?.tier === 1 ? 1 : 0;
          results.splice(insertIdx, 0, folderResult);
        }
        break;
      }
    }
  }

  return results;
}
