/**
 * 代替ロケールページへの遷移 URL を生成するための入力パラメータ型定義
 */
export interface AlternateLocaleUrlParams {
  /** 現在のパス名（例: "/wintch" や "/en/wintch"） */
  pathname: string;
  /** 現在のクエリ文字列（先頭の ? を含む） */
  search: string;
  /** 現在のハッシュ文字列（先頭の # を含む） */
  hash: string;
  /** 現在ロケールのベース URL（例: "/" や "/en/"） */
  currentBaseUrl: string;
  /** 遷移先ロケールのベース URL（例: "/en/" や "/"） */
  targetBaseUrl: string;
  /** 現在ロケールのサイト URL（例: "https://sawara.me"） */
  currentSiteUrl: string;
  /** 遷移先ロケールのサイト URL（例: "https://sawara.me"） */
  targetSiteUrl: string;
  /** Docusaurus の trailingSlash 設定（true / false / undefined） */
  trailingSlash?: boolean;
}

/**
 * ベース URL の末尾に必ずスラッシュが付くように正規化するヘルパー関数
 * @param baseUrl - 正規化対象のベース URL
 * @returns 末尾スラッシュ付きのベース URL
 */
function ensureTrailingSlash(baseUrl: string): string {
  if (!baseUrl) {
    return '/';
  }
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

/**
 * trailingSlash 設定に応じてパス末尾のスラッシュを調整するヘルパー関数
 * @param path - 調整対象のパス文字列
 * @param baseUrl - 対象ロケールのベース URL
 * @param trailingSlash - Docusaurus の trailingSlash 設定
 * @returns 正規化されたパス文字列
 */
function applyTrailingSlashToPath(
  path: string,
  baseUrl: string,
  trailingSlash?: boolean,
): string {
  if (trailingSlash === undefined) {
    return path;
  }

  // ルートベース URL（"/"）やロケールルートそのものの場合は、末尾スラッシュを壊さないよう調整する
  if (path === baseUrl) {
    return trailingSlash || path === '/' ? path : path.replace(/\/$/, '') || '/';
  }

  if (trailingSlash) {
    return path.endsWith('/') ? path : `${path}/`;
  }

  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

/**
 * 現在のパスから現在ロケールのベース URL を取り除いたサフィックスを取得するヘルパー関数
 * @param pathname - 現在のパス名
 * @param currentBaseUrl - 現在ロケールのベース URL
 * @returns ベース URL 以降の相対パス文字列
 */
function extractPathnameSuffix(pathname: string, currentBaseUrl: string): string {
  const normalizedBase = ensureTrailingSlash(currentBaseUrl);
  const baseWithoutTrailingSlash =
    normalizedBase.length > 1 ? normalizedBase.slice(0, -1) : normalizedBase;

  if (pathname === baseWithoutTrailingSlash || pathname === normalizedBase) {
    return '';
  }

  if (pathname.startsWith(normalizedBase)) {
    return pathname.slice(normalizedBase.length);
  }

  // フォールバック: 先頭スラッシュのみを取り除いて扱う
  return pathname.startsWith('/') ? pathname.slice(1) : pathname;
}

/**
 * 現在のロケーション情報を維持したまま、指定ロケール向けの遷移先 URL（またはパス）を生成する関数
 * @param params - 現在のパス・クエリ・ハッシュおよびロケール設定パラメータ
 * @returns 遷移先 URL 文字列（同一ドメイン時はベース URL からのパス、別ドメイン時は完全 URL）
 */
export function buildAlternateLocaleHref(params: AlternateLocaleUrlParams): string {
  const {
    pathname,
    search,
    hash,
    currentBaseUrl,
    targetBaseUrl,
    currentSiteUrl,
    targetSiteUrl,
    trailingSlash,
  } = params;

  const normalizedTargetBase = ensureTrailingSlash(targetBaseUrl);
  const suffix = extractPathnameSuffix(pathname, currentBaseUrl);
  const rawTargetPath = `${normalizedTargetBase}${suffix}`;
  const targetPath = applyTrailingSlashToPath(
    rawTargetPath,
    normalizedTargetBase,
    trailingSlash,
  );

  const isSameDomain = targetSiteUrl === currentSiteUrl;
  const prefix = isSameDomain ? '' : targetSiteUrl.replace(/\/$/, '');

  return `${prefix}${targetPath}${search}${hash}`;
}

/**
 * Docusaurus の Link コンポーネント向けに、SPA ルーティングをバイパスしてフル遷移するターゲット文字列を生成する関数
 * @param params - 現在のパス・クエリ・ハッシュおよびロケール設定パラメータ
 * @returns 同一ドメイン時は "pathname://..." 形式、別ドメイン時は完全 URL
 */
export function buildAlternateLocaleLinkTarget(params: AlternateLocaleUrlParams): string {
  const href = buildAlternateLocaleHref(params);
  const isSameDomain = params.targetSiteUrl === params.currentSiteUrl;
  return isSameDomain ? `pathname://${href}` : href;
}
