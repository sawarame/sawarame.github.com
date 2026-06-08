import { describe, it, expect } from 'vitest';
import { getSingleCoreRankInfo, getMultiCoreRankInfo, getBenchmarkData } from './index';

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
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('category');
      expect(data[0]).toHaveProperty('items');
    });
  });
});
