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
 * ニックネームまたはフォルダ名に使用できない文字（ブラックリスト）の正規表現
 * コマンド起動文字（`:`, `;`）、空白、バックスラッシュ、URL/構文衝突記号、制御・ゼロ幅文字を禁止する（`/` は許可）
 */
const FORBIDDEN_DEMO_NICKNAME_CHAR_REGEX =
  /[:;\\\s%?#&=*"'`<>|\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/;

/**
 * 入力文字列がコマンドモード（`:` または `;` で開始）かどうかを判定する
 * @param rawQuery - 入力された検索/コマンド文字列
 * @returns コマンドモードの場合は true
 */
export function isDemoCommandQuery(rawQuery: string): boolean {
  if (!rawQuery) return false;
  const trimmedStart = rawQuery.trimStart();
  return trimmedStart.startsWith(':') || trimmedStart.startsWith(';');
}

/**
 * コマンド入力文字列の先頭プレフィックス `;` を標準の `:` へ正規化する
 * @param rawQuery - 入力されたコマンド文字列
 * @returns 先頭プレフィックスを `:` に正規化した文字列
 */
export function normalizeDemoCommandPrefix(rawQuery: string): string {
  const trimmedStart = rawQuery.trimStart();
  if (trimmedStart.startsWith(';')) {
    return `:${trimmedStart.slice(1)}`;
  }
  return trimmedStart;
}

/**
 * デモ用ニックネームに使用不可文字が含まれるか判定する
 * @param value - 判定対象のニックネーム文字列
 * @returns 使用不可文字を含む場合は true
 */
export function hasForbiddenDemoNicknameChars(value: string): boolean {
  if (!value) return false;
  return FORBIDDEN_DEMO_NICKNAME_CHAR_REGEX.test(value);
}

/**
 * ニックネームおよびフォルダパスの先頭・末尾・連続スラッシュを正規化する
 * @param rawPath - 入力された生のパス文字列
 * @returns 正規化後のパス文字列
 */
export function normalizeDemoNicknamePath(rawPath: string): string {
  return rawPath
    .trim()
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');
}

/**
 * フォルダパスがクエリ文字列にセグメント境界（`/` 区切り）起点で一致するか判定する
 * @param folderPath - フォルダパス
 * @param lowerNormQuery - 小文字化・正規化済みのクエリ文字列
 * @param exactSuffix - 末尾 `/` 明示時のサフィックス完全一致フラグ
 * @returns 一致する場合は true
 */
function matchesDemoFolderBySegment(
  folderPath: string,
  lowerNormQuery: string,
  exactSuffix: boolean
): boolean {
  const lowerPath = folderPath.toLowerCase();
  if (exactSuffix) {
    return lowerPath === lowerNormQuery || lowerPath.endsWith(`/${lowerNormQuery}`);
  }
  if (lowerPath.startsWith(lowerNormQuery)) {
    return true;
  }

  let searchFrom = 0;
  while (true) {
    const slashIndex = lowerPath.indexOf('/', searchFrom);
    if (slashIndex === -1) return false;
    if (lowerPath.startsWith(lowerNormQuery, slashIndex + 1)) {
      return true;
    }
    searchFrom = slashIndex + 1;
  }
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
 * 対象 URL がすでに登録されているデモブックマークのニックネーム一覧を返す
 * @param targetUrl - 判定対象の URL
 * @param bookmarks - デモブックマーク一覧
 * @returns 登録済みニックネームの配列
 */
export function findDemoNicknamesForUrl(
  targetUrl: string,
  bookmarks: DemoBookmarkItem[]
): string[] {
  if (!targetUrl || /^javascript:/i.test(targetUrl.trim())) return [];
  const normalizedTarget = targetUrl.trim().replace(/\/+$/, '').toLowerCase();
  const matched: string[] = [];

  for (const item of bookmarks) {
    if (/^javascript:/i.test(item.url.trim())) continue;
    const normItem = item.url.trim().replace(/\/+$/, '').toLowerCase();
    if (normItem === normalizedTarget && !matched.includes(item.nickname)) {
      matched.push(item.nickname);
    }
  }
  return matched;
}

/**
 * Nickmark デモでサポートする表示ロケール型
 */
export type DemoLocale = 'ja' | 'en' | 'zh-Hans' | 'zh-Hant' | 'ko';

/**
 * Docusaurus のロケール文字列をデモ用のサポートロケールへ正規化する
 * @param locale - 現在のロケール文字列（例: 'ja', 'en', 'zh-Hans', 'zh-Hant', 'ko'）
 * @returns 正規化されたデモ用ロケール
 */
export function normalizeDemoLocale(locale: string): DemoLocale {
  if (locale === 'ja' || locale.startsWith('ja-')) return 'ja';
  if (locale === 'zh-Hant' || locale.startsWith('zh-TW') || locale.startsWith('zh-HK')) {
    return 'zh-Hant';
  }
  if (locale === 'zh-Hans' || locale === 'zh' || locale.startsWith('zh-')) {
    return 'zh-Hans';
  }
  if (locale === 'ko' || locale.startsWith('ko-')) return 'ko';
  return 'en';
}

/**
 * フォルダ一括オープン候補のローカライズされたタイトルを生成する
 * @param folderPath - 対象フォルダパス
 * @param count - フォルダ配下のタブ件数
 * @param locale - 表示ロケール
 * @returns ローカライズされたタイトル文字列
 */
function formatDemoFolderBatchTitle(folderPath: string, count: number, locale: DemoLocale): string {
  switch (locale) {
    case 'ja':
      return `フォルダ「${folderPath}」を一括オープン (${count}タブ)`;
    case 'zh-Hans':
      return `批量打开文件夹「${folderPath}」(${count} 个标签页)`;
    case 'zh-Hant':
      return `批次開啟資料夾「${folderPath}」(${count} 個分頁)`;
    case 'ko':
      return `폴더 「${folderPath}」 일괄 열기 (${count}개 탭)`;
    case 'en':
    default:
      return `Open all bookmarks in "${folderPath}" (${count} tabs)`;
  }
}

/**
 * 組み込みコマンドの定義一覧
 */
const DEMO_COMMANDS: Array<{
  cmd: string;
  aliases: string[];
  usage: string;
  desc: Record<DemoLocale, string>;
}> = [
  {
    cmd: ':add',
    aliases: [':a'],
    usage: ':add [nickname]',
    desc: {
      ja: '現在のタブを登録（または URL・ブックマークレットを指定）',
      en: 'Save active tab (or specify URL / bookmarklet)',
      'zh-Hans': '保存当前标签页（或指定 URL / 书签脚本）',
      'zh-Hant': '儲存目前分頁（或指定 URL / 書籤小工具）',
      ko: '현재 탭 저장 (또는 URL / 북마클릿 지정)',
    },
  },
  {
    cmd: ':addall',
    aliases: [':aa'],
    usage: ':addall [nickname]',
    desc: {
      ja: '現在のウィンドウの全タブを一括登録',
      en: 'Save all open tabs in the current window',
      'zh-Hans': '批量保存当前窗口中打开的所有标签页',
      'zh-Hant': '批次儲存目前視窗中開啟的所有分頁',
      ko: '현재 창에 열려 있는 모든 탭 일괄 저장',
    },
  },
  {
    cmd: ':rm',
    aliases: [],
    usage: ':rm [nickname]',
    desc: {
      ja: 'ニックネームまたは特定の URL を削除',
      en: 'Remove a nickname or a specific URL entry',
      'zh-Hans': '删除指定昵称或特定 URL 条目',
      'zh-Hant': '刪除指定暱稱或特定 URL 項目',
      ko: '지정한 닉네임 또는 특정 URL 항목 삭제',
    },
  },
  {
    cmd: ':ls',
    aliases: [],
    usage: ':ls',
    desc: {
      ja: 'ブックマーク一覧・管理画面を開く',
      en: 'Open the bookmark management dashboard',
      'zh-Hans': '打开书签列表与管理界面',
      'zh-Hant': '開啟書籤列表與管理介面',
      ko: '북마크 목록 및 관리 대시보드 열기',
    },
  },
  {
    cmd: ':prefs',
    aliases: [],
    usage: ':prefs',
    desc: {
      ja: '設定画面（同期・言語・履歴検索・プリセット・上限）を開く',
      en: 'Open Preferences (sync, language, history, presets, batch limit)',
      'zh-Hans': '打开设置界面（同步、语言、历史搜索、预设、安全上限）',
      'zh-Hant': '開啟設定介面（同步、語言、歷史搜尋、預設集、安全上限）',
      ko: '설정 화면 열기 (동기화, 언어, 방문 기록 검색, 프리셋, 안전 상한)',
    },
  },
  {
    cmd: ':help',
    aliases: [],
    usage: ':help',
    desc: {
      ja: 'ヘルプ・ドキュメントを開く',
      en: 'Open the documentation page',
      'zh-Hans': '打开帮助与文档页面',
      'zh-Hant': '開啟說明與文件頁面',
      ko: '도움말 및 문서 페이지 열기',
    },
  },
];

/**
 * 入力クエリから Nickmark コマンドパレットのデモ候補リストを生成する
 * @param rawQuery - 入力された検索/コマンド文字列
 * @param bookmarks - 現在のデモブックマーク配列
 * @param locale - 表示ロケール（'ja' | 'en' | 'zh-Hans' | 'zh-Hant' | 'ko'）
 * @returns パレット候補配列
 */
export function buildDemoPaletteItems(
  rawQuery: string,
  bookmarks: DemoBookmarkItem[],
  locale: DemoLocale = 'ja'
): DemoSearchResult[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  // コマンドモード（':' または ';' プレフィックス、内部で ':' に正規化）
  if (isDemoCommandQuery(trimmed)) {
    const normalizedCmdInput = normalizeDemoCommandPrefix(trimmed);
    const spaceIdx = normalizedCmdInput.indexOf(' ');
    const cmdToken = spaceIdx === -1 ? normalizedCmdInput : normalizedCmdInput.slice(0, spaceIdx);
    const argText = spaceIdx === -1 ? '' : normalizedCmdInput.slice(spaceIdx + 1).trim();
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
          subtitle: def.desc[locale],
          fillText: `${def.cmd} ${argText}`,
          executeValue: `${def.cmd} ${argText}`,
        });
      } else {
        results.push({
          kind: 'command',
          id: `cmd-${def.cmd}`,
          badge: def.cmd,
          title: def.usage,
          subtitle: def.desc[locale],
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
  const cleanFolder = normalizeDemoNicknamePath(trimmed).toLowerCase();

  // スラッシュのみ（'/' や '///'）の入力時は全件誤ヒットを防ぐため空配列を返す
  if (!cleanFolder && trimmed.includes('/')) {
    return [];
  }

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

  // フォルダ一括オープン候補の挿入（セグメント境界一致・アルファベット順）
  if (cleanFolder) {
    const matchedFolders = Array.from(folders.entries())
      .filter(([folderPath]) =>
        matchesDemoFolderBySegment(folderPath, cleanFolder, isExplicitFolder)
      )
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));

    if (matchedFolders.length > 0) {
      const folderResults: DemoSearchResult[] = matchedFolders.map(([folderPath, count]) => ({
        kind: 'folder',
        id: `folder-${folderPath}`,
        badge: `${folderPath}/`,
        title: formatDemoFolderBatchTitle(folderPath, count, locale),
        subtitle: `${folderPath}/`,
        typeTag: `📁 ${count}`,
        fillText: `${folderPath}/`,
        executeValue: `folder:${folderPath}`,
      }));

      if (isExplicitFolder) {
        results.unshift(...folderResults);
      } else {
        const insertIdx = scored[0]?.tier === 1 ? 1 : 0;
        results.splice(insertIdx, 0, ...folderResults);
      }
    }
  }

  return results;
}
