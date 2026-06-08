import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@site/src': path.resolve(__dirname, './src'),
      '@site': path.resolve(__dirname, '.'),
      '@docusaurus/Translate': path.resolve(__dirname, './src/__mocks__/docusaurus-translate.ts'),
      '@docusaurus/router': path.resolve(__dirname, './src/__mocks__/docusaurus-router.ts'),
      '@docusaurus/useDocusaurusContext': path.resolve(__dirname, './src/__mocks__/docusaurus-context.ts'),
      '@docusaurus/theme-common': path.resolve(__dirname, './src/__mocks__/docusaurus-theme-common.ts'),
    },
  },
});
