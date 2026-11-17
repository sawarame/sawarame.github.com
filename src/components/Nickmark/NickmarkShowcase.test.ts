import { describe, it, expect } from 'vitest';
import {
  buildDemoPaletteItems,
  expandDemoDynamicUrl,
  extractDemoFolders,
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

    it('コロン入力時は組み込みコマンド候補を返すこと', () => {
      const items = buildDemoPaletteItems(':ad', SAMPLE_BOOKMARKS, 'ja');
      expect(items.some((item) => item.badge === ':add')).toBe(true);
      expect(items.some((item) => item.badge === ':addall')).toBe(true);
    });
  });
});
