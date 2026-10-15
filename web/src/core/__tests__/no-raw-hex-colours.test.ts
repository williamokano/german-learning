import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// Colours come from the design tokens in styles/theme.css, which define both the
// light and the dark theme. A raw hex value in a component ignores the theme and
// broke dark mode across pill mode (white-on-white flashcards, #475). Hex is fine
// only as the fallback inside var(--token, #hex) and in theme.css itself.
const SRC = resolve(__dirname, '../..');
const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(svelte|astro|css)$/.test(name) && !p.endsWith('theme.css') ? [p] : [];
  });
}

function styleSource(path: string): string {
  const s = readFileSync(path, 'utf8');
  const css = path.endsWith('.css')
    ? s
    : [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('component styles use theme tokens', () => {
  it('has no raw hex colours outside var() fallbacks', () => {
    const hits: string[] = [];
    for (const f of files(SRC)) {
      const css = styleSource(f);
      for (const m of css.matchAll(HEX)) {
        if (/var\(--[\w-]+,\s*$/.test(css.slice(Math.max(0, m.index! - 40), m.index))) continue;
        hits.push(`${relative(SRC, f)}: ${m[0]}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
