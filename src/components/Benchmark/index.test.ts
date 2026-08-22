import { describe, it, expect } from 'vitest';
import {
  getSingleCoreRankInfo,
  getMultiCoreRankInfo,
  getBenchmarkData,
  getEcmaScriptVersion,
  getBrowserInfo,
} from './index';

describe('Benchmark Utils', () => {
  describe('getSingleCoreRankInfo', () => {
    it('スコアに応じて正しいシングルコアランク情報を返すこと', () => {
      expect(getSingleCoreRankInfo(4500).rank).toBe('S');
      expect(getSingleCoreRankInfo(2500).rank).toBe('A');
      expect(getSingleCoreRankInfo(1200).rank).toBe('B');
      expect(getSingleCoreRankInfo(500).rank).toBe('C');
      expect(getSingleCoreRankInfo(150).rank).toBe('D');
      expect(getSingleCoreRankInfo(75).rank).toBe('E');
      expect(getSingleCoreRankInfo(10).rank).toBe('F');
    });
  });

  describe('getMultiCoreRankInfo', () => {
    it('スコアに応じて正しいマルチコアランク情報を返すこと', () => {
      expect(getMultiCoreRankInfo(35000).rank).toBe('S');
      expect(getMultiCoreRankInfo(15000).rank).toBe('A');
      expect(getMultiCoreRankInfo(5000).rank).toBe('B');
      expect(getMultiCoreRankInfo(800).rank).toBe('C');
      expect(getMultiCoreRankInfo(300).rank).toBe('D');
      expect(getMultiCoreRankInfo(120).rank).toBe('E');
      expect(getMultiCoreRankInfo(20).rank).toBe('F');
    });
  });

  describe('getBenchmarkData', () => {
    it('ベンチマーク対象データ項目が配列で返されること', () => {
      const data = getBenchmarkData();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(4);
      expect(data[0]).toHaveProperty('category');
      expect(data[0]).toHaveProperty('items');
    });

    it('不要として削除された項目（object-fit, css-layer, crypto, indexeddb-v3）が含まれていないこと', () => {
      const data = getBenchmarkData();
      const allItemIds = data.flatMap(cat => cat.items.map(item => item.id));
      expect(allItemIds).not.toContain('object-fit');
      expect(allItemIds).not.toContain('css-layer');
      expect(allItemIds).not.toContain('crypto');
      expect(allItemIds).not.toContain('indexeddb-v3');
    });
  });

  describe('getEcmaScriptVersion', () => {
    it('Chrome/Edgeのバージョンに応じて正しいECMAScript仕様を返すこと', () => {
      expect(getEcmaScriptVersion('Chrome', 128)).toBe('ES2024');
      expect(getEcmaScriptVersion('Chrome', 124)).toBe('ES2024');
      expect(getEcmaScriptVersion('Chrome', 115)).toBe('ES2023');
      expect(getEcmaScriptVersion('Chrome', 95)).toBe('ES2022');
      expect(getEcmaScriptVersion('Chrome', 86)).toBe('ES2021');
      expect(getEcmaScriptVersion('Chrome', 80)).toBe('ES2020');
      expect(getEcmaScriptVersion('Chrome', 75)).toBe('ES2019');
      expect(getEcmaScriptVersion('Chrome', 65)).toBe('ES2018');
      expect(getEcmaScriptVersion('Chrome', 59)).toBe('ES2017');
      expect(getEcmaScriptVersion('Chrome', 52)).toBe('ES2016');
      expect(getEcmaScriptVersion('Chrome', 49)).toBe('ES2015');
      expect(getEcmaScriptVersion('Chrome', 40)).toBe('ES5');
    });

    it('Firefoxのバージョンに応じて正しいECMAScript仕様を返すこと', () => {
      expect(getEcmaScriptVersion('Firefox', 128)).toBe('ES2024');
      expect(getEcmaScriptVersion('Firefox', 115)).toBe('ES2023');
      expect(getEcmaScriptVersion('Firefox', 95)).toBe('ES2022');
      expect(getEcmaScriptVersion('Firefox', 86)).toBe('ES2021');
      expect(getEcmaScriptVersion('Firefox', 75)).toBe('ES2020');
      expect(getEcmaScriptVersion('Firefox', 40)).toBe('ES5');
    });

    it('Safariのバージョンに応じて正しいECMAScript仕様を返すこと', () => {
      expect(getEcmaScriptVersion('Safari', 17, 4)).toBe('ES2024');
      expect(getEcmaScriptVersion('Safari', 16, 4)).toBe('ES2023');
      expect(getEcmaScriptVersion('Safari', 15, 4)).toBe('ES2022');
      expect(getEcmaScriptVersion('Safari', 14, 1)).toBe('ES2021');
      expect(getEcmaScriptVersion('Safari', 14, 0)).toBe('ES2020');
      expect(getEcmaScriptVersion('Safari', 8, 0)).toBe('ES5');
    });

    it('iOS環境においてWebKit/OSバージョン基準で正しく判定できること', () => {
      expect(getEcmaScriptVersion('Chrome', 128, 0, 'iOS')).toBe('ES2024'); // iOS上のChrome
      expect(getEcmaScriptVersion('Safari', 16, 4, 'iOS')).toBe('ES2023');
    });
  });

  describe('getBrowserInfo', () => {
    it('ChromeのUAからブラウザ名、バージョン、OS、ES仕様を正しく取得できること', () => {
      const chromeUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
      const info = getBrowserInfo(chromeUa);
      expect(info).toBe('Chrome 128 (macOS) / ES2024');
    });

    it('FirefoxのUAからブラウザ名、バージョン、OS、ES仕様を正しく取得できること', () => {
      const firefoxUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
      const info = getBrowserInfo(firefoxUa);
      expect(info).toBe('Firefox 128 (Windows) / ES2024');
    });

    it('SafariのUAからブラウザ名、バージョン、OS、ES仕様を正しく取得できること', () => {
      const safariUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
      const info = getBrowserInfo(safariUa);
      expect(info).toBe('Safari 17 (macOS) / ES2024');
    });

    it('EdgeのUAからブラウザ名、バージョン、OS、ES仕様を正しく取得できること', () => {
      const edgeUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0';
      const info = getBrowserInfo(edgeUa);
      expect(info).toBe('Edge 124 (Windows) / ES2024');
    });
  });
});
