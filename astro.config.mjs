// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
// import starlight from '@astrojs/starlight';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  vite: {
    ssr: {
      external: ['gaxios', 'url', 'workers-ai-provider', 'openai', 'fabric', 'zustand'],
      noExternal: ['lucide-react', '@heroicons/react']
    },
    build: {
      rollupOptions: {
        external: ['node:url', 'node:path', 'node:fs']
      }
    }
  },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    mdx(),
  ],
  site: 'https://cutgluebuild.com',
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
    },
  },
});
