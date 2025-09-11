// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    starlight({
      title: 'CutGlueBuild Docs',
      description: 'Documentation for the CutGlueBuild AI-powered laser cutting platform',
      logo: {
        src: './src/assets/logo.svg',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/cozyartz/cutgluebuild',
        },
        {
          icon: 'instagram',
          label: 'Instagram',
          href: 'https://instagram.com/cutgluebuild',
        },
        {
          icon: 'twitter',
          label: 'X.com',
          href: 'https://x.com/cutgluebuild',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/docs/' },
            { label: 'Quick Start', link: '/docs/quick-start/' },
            { label: 'Development Setup', link: '/docs/development/setup/' },
          ],
        },
        {
          label: 'Content Creation',
          items: [
            { label: 'Blog Writing Guide', link: '/docs/guides/blog-writing-guide/' },
            { label: 'Content Strategy', link: '/docs/guides/content-strategy/' },
            { label: 'Affiliate Integration', link: '/docs/guides/affiliate-integration/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Database Schema', link: '/docs/reference/database-schema/' },
            { label: 'API Reference', link: '/docs/reference/api-reference/' },
            { label: 'Component Library', link: '/docs/reference/component-library/' },
          ],
        },
        {
          label: 'Development',
          items: [
            { label: 'Contributing', link: '/docs/development/contributing/' },
            { label: 'Deployment', link: '/docs/development/deployment/' },
            { label: 'Testing', link: '/docs/development/testing/' },
          ],
        },
      ],
      customCss: [
        './src/styles/starlight.css',
      ],
      components: {
        // Override components to match main site design
        Header: './src/components/docs/Header.astro',
      },
    }),
    mdx(),
  ],
  site: 'https://cutgluebuild.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
});
