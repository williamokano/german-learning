import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// The site is served under a base path (/german-learning). A hard-coded
// root-relative link such as href="/path/" escapes it and 404s on the live
// site (#465). Links must be built from BASE_URL / a `base` prop instead.
const SRC = resolve(__dirname, '../..');
const DIRS = ['components', 'layouts', 'pages'];
const ROOT_RELATIVE_HREF = /href=(?:"\/(?!\/)|\{\s*[`'"]\/(?!\/))/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(svelte|astro)$/.test(name) ? [p] : [];
  });
}

describe('links respect the site base path', () => {
  it('has no root-relative href in components, layouts or pages', () => {
    const hits = DIRS.flatMap(d => files(join(SRC, d))).flatMap(f =>
      readFileSync(f, 'utf8').split('\n').flatMap((line, i) =>
        ROOT_RELATIVE_HREF.test(line) ? [`${relative(SRC, f)}:${i + 1}: ${line.trim()}`] : []),
    );
    expect(hits).toEqual([]);
  });
});
