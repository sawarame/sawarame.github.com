import { describe, it, expect } from 'vitest';
import { fixSvgDimensions } from './index';

describe('ImageOptimizer Utils', () => {
  describe('fixSvgDimensions', () => {
    it('SVGではないファイルはそのまま返すこと', async () => {
      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      const result = await fixSvgDimensions(file);
      expect(result).toBe(file);
    });

    it('SVGファイルにすでにサイズ属性が存在する場合はそのまま返すこと', async () => {
      const svgContent = '<svg width="100" height="100" viewBox="0 0 100 100"></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
      const result = await fixSvgDimensions(file);
      
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(result);
      });

      expect(text).toContain('width="100"');
      expect(text).toContain('height="100"');
    });

    it('サイズ属性が不足しており、viewBoxが存在する場合、viewBoxからサイズを付与した新しいファイルが作成されること', async () => {
      const svgContent = '<svg viewBox="0 0 500 300"></svg>';
      const file = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });
      const result = await fixSvgDimensions(file);

      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(result);
      });

      expect(text).toContain('width="500"');
      expect(text).toContain('height="300"');
    });
  });
});
