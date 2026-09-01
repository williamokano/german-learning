/**
 * Mirrors lesson audio files into web/public/ so Astro's static build can serve them.
 *
 * Source:  <repo>/<LEVEL>/<nn-slug>/audio/*.mp3   (LEVEL = A1…C1, or HOEREN)
 * Dest:    <repo>/web/public/audio/<LEVEL>/<nn-slug>/*.mp3
 *
 * uebungen.astro computes its audioDir as `audio/${level.toUpperCase()}/${lesson}/`
 * where `level` is the content directory name lowercased — so HOEREN/<slug>/audio/
 * must land at web/public/audio/HOEREN/<slug>/, same shape as the A1–C1 case.
 *
 * Run before `astro build` (or `astro dev`). In CI, `git lfs pull` must precede this.
 */
import { readdirSync, cpSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot   = fileURLToPath(new URL('..', import.meta.url));
const publicAudio = join(repoRoot, 'web/public/audio');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'HOEREN'];
let copied = 0;

for (const level of LEVELS) {
  const levelDir = join(repoRoot, level);
  if (!existsSync(levelDir)) continue;

  for (const entry of readdirSync(levelDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const audioSrc = join(levelDir, entry.name, 'audio');
    if (!existsSync(audioSrc)) continue;

    const audioDest = join(publicAudio, level, entry.name);
    mkdirSync(audioDest, { recursive: true });

    for (const f of readdirSync(audioSrc)) {
      if (!f.endsWith('.mp3')) continue;
      const src  = join(audioSrc, f);
      const dest = join(audioDest, f);

      // Skip if dest is already up-to-date (same size) to keep builds fast.
      if (existsSync(dest) && statSync(dest).size === statSync(src).size) continue;

      cpSync(src, dest);
      copied++;
    }
  }
}

console.log(`[mirror-audio] ${copied} file(s) copied → web/public/audio/`);
