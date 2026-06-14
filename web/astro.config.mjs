// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://williamokano.github.io',
  base: '/german-learning',
  output: 'static',
  integrations: [mdx(), svelte()],
  // markdown.remarkPlugins / rehypePlugins: lesson-enrichment passes added in P1
  // (see docs/web/CONTENT-MODEL.md §Lesson and docs/web/BUILD-PIPELINE.md §Lesson rendering)
});
