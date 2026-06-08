import { vi } from 'vitest';

// Docusaurusモジュールのモック
vi.mock('@docusaurus/router', () => ({
  useHistory: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
}));

vi.mock('@docusaurus/Translate', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
  translate: ({ message, id }: any) => message || id || '',
}));

// window.URLのモック
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn().mockReturnValue('mock-url');
  window.URL.revokeObjectURL = vi.fn();
}

// navigator.clipboardのモック
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});
