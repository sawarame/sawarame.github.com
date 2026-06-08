import { describe, it, expect } from 'vitest';
import { generatePassword, generateAll, lowerCase, upperCase, numbers, symbols } from './index';

describe('PasswordGenerator Utils', () => {
  describe('generatePassword', () => {
    it('指定された長さのパスワードが生成されること', () => {
      const length = 12;
      const pw = generatePassword('', '', length, true, true);
      expect(pw).toHaveLength(length);
    });

    it('長さが0以下の場合は空文字列を返すこと', () => {
      expect(generatePassword('', '', 0, true, true)).toBe('');
      expect(generatePassword('', '', -5, true, true)).toBe('');
    });

    it('使用しない文字（除外文字）がパスワードに含まれないこと', () => {
      const filterStr = 'abcABC123';
      const pw = generatePassword('', filterStr, 50, true, true);
      for (const char of filterStr) {
        expect(pw).not.toContain(char);
      }
    });

    it('重複使用不可の場合、同じ文字が重複しないこと', () => {
      const pw = generatePassword('', '', 10, false, false);
      const usedChars = new Set<string>();
      for (const char of pw) {
        expect(usedChars.has(char)).toBe(false);
        usedChars.add(char);
      }
    });

    it('記号不使用の場合、記号が含まれないこと', () => {
      const pw = generatePassword('', '', 50, true, false);
      for (const char of symbols) {
        expect(pw).not.toContain(char);
      }
    });

    it('特定の記号のみ使用する場合、それ以外の記号が含まれないこと', () => {
      const allowedSymbols = '@#';
      const pw = generatePassword(allowedSymbols, '', 100, true, true);
      
      // `@` または `#` 以外の記号が含まれていないことを確認
      const otherSymbols = symbols.split('').filter(c => !allowedSymbols.includes(c));
      for (const char of otherSymbols) {
        expect(pw).not.toContain(char);
      }
    });
  });

  describe('generateAll', () => {
    it('指定された個数のパスワードが生成されること', () => {
      const count = 5;
      const state = {
        availableSymbols: '',
        filterStr: '',
        length: 16,
        createTimes: count,
        useSameChar: true,
        useSymbols: true,
      };
      const result = generateAll(state);
      expect(result).toHaveLength(count);
      result.forEach(pw => {
        expect(pw).toHaveLength(16);
      });
    });
  });
});
