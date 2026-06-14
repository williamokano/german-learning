// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';

import remarkAudioLinks from './src/plugins/remark-audio-links.mjs';
import remarkHoerzu     from './src/plugins/remark-hoerzu.mjs';
import rehypeMerkasten  from './src/plugins/rehype-merkasten.mjs';

export default defineConfig({
  site: 'https://williamokano.github.io',
  base: '/german-learning',
  output: 'static',
  integrations: [mdx(), svelte()],
  markdown: {
    // Apply to ALL markdown (both .md lesson files and .mdx if any).
    // remark plugins transform MDAST; rehype plugin transforms HAST.
    remarkPlugins: [remarkAudioLinks, remarkHoerzu],
    rehypePlugins: [rehypeMerkasten],
    // Allow raw HTML in markdown (needed for <details>, <audio-play>, etc.)
    remarkRehype:  { allowDangerousHtml: true },
  },
});
