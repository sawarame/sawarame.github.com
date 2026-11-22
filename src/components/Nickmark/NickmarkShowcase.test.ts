import { describe, it, expect } from 'vitest';
import {
  buildDemoPaletteItems,
  expandDemoDynamicUrl,
  extractDemoFolders,
  findDemoNicknamesForUrl,
  hasForbiddenDemoNicknameChars,
  normalizeDemoLocale,
  DemoBookmarkItem,
} from './nickmarkSearchUtils';

const SAMPLE_BOOKMARKS: DemoBookmarkItem[] = [
  {
    id: '1',
    nickname: 'gh',
    title: 'GitHub Search / Repository',
    url: 'https://github.com/%s',
    defaultValue: 'sawarame/Nickmark',
    isPinned: true,
    score: 24.5,
    lastUsedLabel: '2分前',
  },
  {
    id: '2',
    nickname: 'work/mail',
    title: 'Work Mail',
    url: 'https://mail.example.com',
    score: 18.2,
    lastUsedLabel: '1時間前',
  },
  {
    id: '3',
    nickname: 'work/docs',
    title: 'Design Docs',
    url: 'https://docs.example.com',
    score: 14.0,
    lastUsedLabel: '3時間前',
  },
  {
    id: '4',
    nickname: 'js/top',
    title: 'Scroll to Top',
    url: 'javascript:window.scrollTo({top:0,behavior:"smooth"})',
    score: 9.1,
    lastUsedLabel: '昨日',
  },
  {
    id: '5',
    nickname: 'github/repo/issues',
    title: 'Repository Issues',
    url: 'https://github.com/sawarame/Nickmark/issues',
    score: 12.0,
    lastUsedLabel: '5時間前',
  },
];

describe('NickmarkShowcase 検索デモユーティリティ', () => {
  describe('expandDemoDynamicUrl', () => {
    it('パス領域の %s ではスラッシュを保持して展開すること', () => {
      expect(expandDemoDynamicUrl('https://github.com/%s', 'sawarame/Nickmark')).toBe(
        'https://github.com/sawarame/Nickmark'
      );
    });

    it('クエリ領域の %s では URL エンコードして展開すること', () => {
      expect(expandDemoDynamicUrl('https://www.google.com/search?q=%s', 'a/b c')).toBe(
        'https://www.google.com/search?q=a%2Fb%20c'
      );
    });

    it('引数省略時はデフォルト値またはオリジンへフォールバックすること', () => {
      expect(expandDemoDynamicUrl('https://github.com/%s', '', 'sawarame/Nickmark')).toBe(
        'https://github.com/sawarame/Nickmark'
      );
      expect(expandDemoDynamicUrl('https://github.com/%s', '')).toBe('https://github.com');
    });
  });

  describe('extractDemoFolders', () => {
    it('ブックマークレットを除外してフォルダ配下のオープン可能件数を集計すること', () => {
      const folders = extractDemoFolders(SAMPLE_BOOKMARKS);
      expect(folders.get('work')).toBe(2);
      expect(folders.get('github/repo')).toBe(1);
      expect(folders.has('js')).toBe(false);
    });
  });

  describe('buildDemoPaletteItems', () => {
    it('動的 URL の引数をリアルタイムに展開した候補を返すこと', () => {
      const items = buildDemoPaletteItems('gh react/react', SAMPLE_BOOKMARKS, 'ja');
      expect(items[0].badge).toBe('gh');
      expect(items[0].subtitle).toBe('https://github.com/react/react');
      expect(items[0].typeTag).toBe('(react/react)');
    });

    it('末尾スラッシュ入力時はフォルダ一括オープン候補を最上位に返すこと', () => {
      const items = buildDemoPaletteItems('work/', SAMPLE_BOOKMARKS, 'ja');
      expect(items[0].kind).toBe('folder');
      expect(items[0].badge).toBe('work/');
      expect(items[0].typeTag).toBe('📁 2');
    });

    it('階層途中のフォルダ名でもセグメント境界一致で一括オープン候補を返すこと', () => {
      const items = buildDemoPaletteItems('repo/', SAMPLE_BOOKMARKS, 'ja');
      expect(items[0].kind).toBe('folder');
      expect(items[0].badge).toBe('github/repo/');
      expect(items[0].typeTag).toBe('📁 1');
    });

    it('コロン入力時は組み込みコマンド候補を返すこと', () => {
      const items = buildDemoPaletteItems(':ad', SAMPLE_BOOKMARKS, 'ja');
      expect(items.some((item) => item.badge === ':add')).toBe(true);
      expect(items.some((item) => item.badge === ':addall')).toBe(true);
    });

    it('セミコロン入力時もコマンドモードとして起動し正規化されたコマンド候補を返すこと', () => {
      const items = buildDemoPaletteItems(';add dev', SAMPLE_BOOKMARKS, 'ja');
      expect(items[0].kind).toBe('command');
      expect(items[0].badge).toBe(':add');
      expect(items[0].fillText).toBe(':add dev');
    });

    it('中国語（簡体字・繁体字）および韓国語ロケールでコマンド説明とフォルダ一括オープン文言を返すこと', () => {
      const zhHansCmd = buildDemoPaletteItems(':add', SAMPLE_BOOKMARKS, 'zh-Hans');
      expect(zhHansCmd[0].subtitle).toContain('当前标签页');
      const zhHansFolder = buildDemoPaletteItems('work/', SAMPLE_BOOKMARKS, 'zh-Hans');
      expect(zhHansFolder[0].title).toBe('批量打开文件夹「work」(2 个标签页)');

      const zhHantCmd = buildDemoPaletteItems(':add', SAMPLE_BOOKMARKS, 'zh-Hant');
      expect(zhHantCmd[0].subtitle).toContain('目前分頁');
      const zhHantFolder = buildDemoPaletteItems('work/', SAMPLE_BOOKMARKS, 'zh-Hant');
      expect(zhHantFolder[0].title).toBe('批次開啟資料夾「work」(2 個分頁)');

      const koCmd = buildDemoPaletteItems(':add', SAMPLE_BOOKMARKS, 'ko');
      expect(koCmd[0].subtitle).toContain('현재 탭');
      const koFolder = buildDemoPaletteItems('work/', SAMPLE_BOOKMARKS, 'ko');
      expect(koFolder[0].title).toBe('폴더 「work」 일괄 열기 (2개 탭)');
    });
  });

  describe('normalizeDemoLocale', () => {
    it('Docusaurus のロケール文字列をサポート対象ロケールへ正規化すること', () => {
      expect(normalizeDemoLocale('ja')).toBe('ja');
      expect(normalizeDemoLocale('en')).toBe('en');
      expect(normalizeDemoLocale('zh-Hans')).toBe('zh-Hans');
      expect(normalizeDemoLocale('zh-Hant')).toBe('zh-Hant');
      expect(normalizeDemoLocale('zh-TW')).toBe('zh-Hant');
      expect(normalizeDemoLocale('ko')).toBe('ko');
      expect(normalizeDemoLocale('fr')).toBe('en');
    });
  });

  describe('hasForbiddenDemoNicknameChars', () => {
    it('コマンド起動文字や禁止記号を検出し、スラッシュは許可すること', () => {
      expect(hasForbiddenDemoNicknameChars('work/gh-1')).toBe(false);
      expect(hasForbiddenDemoNicknameChars('my:nick')).toBe(true);
      expect(hasForbiddenDemoNicknameChars('my;nick')).toBe(true);
      expect(hasForbiddenDemoNicknameChars('my nick')).toBe(true);
      expect(hasForbiddenDemoNicknameChars('q?a=1')).toBe(true);
    });
  });

  describe('findDemoNicknamesForUrl', () => {
    it('すでに登録されている URL に一致するニックネーム一覧を返すこと', () => {
      expect(findDemoNicknamesForUrl('https://mail.example.com/', SAMPLE_BOOKMARKS)).toEqual([
        'work/mail',
      ]);
    });
  });
});
