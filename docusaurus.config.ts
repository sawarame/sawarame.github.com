import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'sawara.me',
  tagline: '忘れるための記録場所',
  favicon: 'img/sawara.ico',

  // Set the production url of your site here
  url: 'https://sawara.me',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // By default, Docusaurus generates location pages like /docs/intro.html and then
  // redirects from /docs/intro to /docs/intro.html. Many hosting providers already
  // do this automatically. So you can safely turn this off if you don't need it.
  //
  // This is recommended for GitHub Pages deployments.
  // See: https://docusaurus.io/docs/deployment#deploying-to-github-pages
  // See: https://docusaurus.io/docs/api/docusaurus-config#trailingSlash
  trailingSlash: false,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sawarame', // Usually your GitHub org/user name.
  projectName: 'sawarame.github.com', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/sawarame/sawarame.github.com/tree/master/',
        },
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ['rss', 'atom'],
        //     xslt: true,
        //   },
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   // editUrl:
        //   //   'https://github.com/sawarame/sawarame.github.com/tree/master/',
        //   // Useful options to enforce blogging best practices
        //   onInlineTags: 'warn',
        //   onInlineAuthors: 'warn',
        //   onUntruncatedBlogPosts: 'warn',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'sawara.me',
      logo: {
        alt: 'sawara.meのロゴ',
        src: 'img/sawara.png',
      },
      items: [
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'installSidebar',
        //   position: 'left',
        //   label: 'Install notes',
        // },
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'cheatsheetSidebar',
        //   position: 'left',
        //   label: 'Cheat sheets',
        // },
        // {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://github.com/facebook/docusaurus',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        // {
        //   title: 'Docs',
        //   items: [
        //     {
        //       label: 'Install notes',
        //       to: '/docs/install',
        //     },
        //     {
        //       label: 'Cheat sheets',
        //       to: '/docs/cheatsheet',
        //     },
        //   ],
        // },
        // {
        //   title: 'Tools',
        //   items: [
        //     {
        //       label: 'パスワードジェネレーター',
        //       to: '/password',
        //     },
        //     {
        //       label: 'プレーンテキスト作業場',
        //       to: '/text',
        //     },
        //   ],
        // },
        // {
        //   title: 'SNS',
        //   items: [
        //     {
        //       label: 'X',
        //       href: 'https://twitter.com/sawarame',
        //     },
        //   ],
        // },
        // {
        //   title: 'More',
        //   items: [
        //     {
        //       label: 'Blog',
        //       to: '/blog',
        //     },
        //     {
        //       label: 'GitHub',
        //       href: 'https://github.com/sawarame',
        //     },
        //   ],
        // },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} sawara.me`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
