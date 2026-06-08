import { describe, it, expect } from 'vitest';
import { checkIsBot } from './index';

describe('DeviceInfo Utils', () => {
  describe('checkIsBot', () => {
    it('Botやクローラーのユーザーエージェントをボットとして判定すること', () => {
      const bots = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
        'Baiduspider+(+http://www.baidu.com/search/spider.htm)',
      ];
      bots.forEach(ua => {
        expect(checkIsBot(ua)).toBe(true);
      });
    });

    it('一般的なブラウザのユーザーエージェントはボットではないと判定すること', () => {
      const users = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      ];
      users.forEach(ua => {
        expect(checkIsBot(ua)).toBe(false);
      });
    });
  });
});
