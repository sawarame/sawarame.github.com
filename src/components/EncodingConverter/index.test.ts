import { describe, it, expect } from 'vitest';
import { formatBytes, detectLineBreak } from './index';

describe('EncodingConverter Utils', () => {
  describe('formatBytes', () => {
    it('バイト数が適切に単位変換されて文字列として返ること', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });
  });

  describe('detectLineBreak', () => {
    it('バイト配列（テキスト）内の改行コードを正しく検出すること', () => {
      // "Hello\r\nWorld" in UTF-8
      const crlfBytes = new Uint8Array([72, 101, 108, 108, 111, 13, 10, 87, 111, 114, 108, 100]);
      expect(detectLineBreak(crlfBytes, 'UTF8')).toBe('CRLF');

      // "Hello\nWorld" in UTF-8
      const lfBytes = new Uint8Array([72, 101, 108, 108, 111, 10, 87, 111, 114, 108, 100]);
      expect(detectLineBreak(lfBytes, 'UTF8')).toBe('LF');

      // "Hello\rWorld" in UTF-8
      const crBytes = new Uint8Array([72, 101, 108, 108, 111, 13, 87, 111, 114, 108, 100]);
      expect(detectLineBreak(crBytes, 'UTF8')).toBe('CR');
    });
  });
});
