import { describe, it, expect } from 'vitest';
import { parseItems, restoreRemovedItems, RemovedItem } from './index';

describe('RouletteMaker Utils', () => {
  describe('parseItems', () => {
    it('改行区切りのテキストがトリミングされて配列にパースされること', () => {
      const input = '  Item 1  \nItem 2\n\n  Item 3\n';
      const parsed = parseItems(input);
      expect(parsed).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('空文字列や改行のみの場合は空配列を返すこと', () => {
      expect(parseItems('')).toEqual([]);
      expect(parseItems('\n\n')).toEqual([]);
    });
  });

  describe('restoreRemovedItems', () => {
    it('除外されたアイテムが元のインデックスに基づいてリストに正しく復元されること', () => {
      const items = ['A', 'C', 'E'];
      const removedItems: Array<string | RemovedItem> = [
        { text: 'B', index: 1 },
        { text: 'D', index: 2 }
      ];

      const restored = restoreRemovedItems(items, removedItems);
      expect(restored).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('単純な文字列の除外アイテムは末尾に追加されること', () => {
      const items = ['A', 'B'];
      const removedItems = ['C', 'D'];
      const restored = restoreRemovedItems(items, removedItems);
      expect(restored).toEqual(['A', 'B', 'D', 'C']);
    });
  });
});
