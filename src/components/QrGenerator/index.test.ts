import { describe, it, expect } from 'vitest';
import { buildQrData, sanitizeFileName, QrDataOptions } from './index';

describe('QrGenerator Utils', () => {
  const defaultOpts: QrDataOptions = {
    textInput: 'https://sawara.me',
    wifiEncryption: 'WPA',
    wifiSsid: 'MyWiFi',
    wifiPassword: 'password123',
    contactName: 'John Doe',
    contactTel: '09012345678',
    contactEmail: 'john@example.com',
    eventName: 'My Event',
    eventStart: '2026-06-08T12:00:00',
    eventEnd: '2026-06-08T15:00:00',
    emailTo: 'test@example.com',
    emailSub: 'Hello',
    emailBody: 'This is a test\nemail.'
  };

  describe('buildQrData', () => {
    it('テキストモードで入力されたテキストがそのまま返ること', () => {
      expect(buildQrData('text', defaultOpts)).toBe(defaultOpts.textInput);
    });

    it('WiFiモードで正しいWIFIスキーム文字列が生成されること', () => {
      expect(buildQrData('wifi', defaultOpts)).toBe('WIFI:T:WPA;S:MyWiFi;P:password123;;');
    });

    it('連絡先モードで正しいMECARDスキーム文字列が生成されること', () => {
      expect(buildQrData('contact', defaultOpts)).toBe('MECARD:N:John Doe;TEL:09012345678;EMAIL:john@example.com;;');
    });

    it('予定モードで正しいVCALENDAR形式が生成されること', () => {
      const result = buildQrData('event', defaultOpts);
      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('SUMMARY:My Event');
      expect(result).toContain('DTSTART:20260608T12000000');
      expect(result).toContain('DTEND:20260608T15000000');
    });

    it('予定モードで終了時刻が開始時刻以前の場合は空文字列を返すこと', () => {
      const invalidOpts = { ...defaultOpts, eventStart: '2026-06-08T15:00:00', eventEnd: '2026-06-08T12:00:00' };
      expect(buildQrData('event', invalidOpts)).toBe('');
    });

    it('メールモードで正しいmailtoスキーム文字列が生成されること', () => {
      const result = buildQrData('email', defaultOpts);
      expect(result).toBe('mailto:test@example.com?subject=Hello&body=This%20is%20a%20test%0D%0Aemail.');
    });
  });

  describe('sanitizeFileName', () => {
    it('WiFiモード時にSSIDに基づくファイル名が生成されること', () => {
      expect(sanitizeFileName('wifi', defaultOpts, '123456')).toBe('MyWiFi.png');
    });

    it('システム予約文字などがアンダースコアに置換されること', () => {
      const unsafeOpts = { ...defaultOpts, wifiSsid: 'My Wi-Fi/Test:Host*?' };
      expect(sanitizeFileName('wifi', unsafeOpts, '123456')).toBe('My Wi-Fi_Test_Host__.png');
    });

    it('対象のメタデータが空の場合はタイムスタンプ名になること', () => {
      const emptyOpts = { ...defaultOpts, wifiSsid: '' };
      expect(sanitizeFileName('wifi', emptyOpts, '20260608')).toBe('20260608.png');
    });
  });
});
