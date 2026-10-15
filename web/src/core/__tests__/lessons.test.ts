import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lessonRoute, projectLessonEntries, projectVocabSets } from '@core/content/lessons';
import { buildPathManifest } from '@core/content/path';

describe('lessonRoute', () => {
  it('uses the folder name as the route slug', () => {
    expect(lessonRoute('a1/04-wohnen/lesson')).toEqual({ level: 'a1', slug: '04-wohnen' });
  });
});

describe('projectLessonEntries', () => {
  it('ignores the short frontmatter slug and keeps the numbered folder name', () => {
    const [p] = projectLessonEntries([
      { id: 'a1/04-wohnen/lesson', data: { number: 4, title: 'Wohnen' } },
    ]);
    expect(p.data).toEqual({ lesson: 'A1/04', slug: '04-wohnen', title: 'Wohnen', level: 'A1', number: 4 });
  });

  it('falls back to the folder prefix when frontmatter has no number', () => {
    const [p] = projectLessonEntries([{ id: 'b2/07-konnektoren-fuer-profis/lesson', data: {} }]);
    expect(p.data.lesson).toBe('B2/07');
    expect(p.data.title).toBe('(unbenannt)');
  });

  it('throws instead of silently dropping a lesson it cannot place', () => {
    expect(() => projectLessonEntries([{ id: 'a1/no-number/lesson', data: {} }])).toThrow(/a1\/no-number/);
  });
});

describe('projectVocabSets', () => {
  it('flattens entries', () => {
    expect(projectVocabSets([{ id: 'v', data: { lesson: 'A1/01', entries: [1, 2] } }]))
      .toEqual([{ id: 'v', lesson: 'A1/01', entries: [1, 2] }]);
  });
});

// Regression for #464: every path node must point at an existing lesson folder,
// i.e. the URL /<level>/<slug>/ is a real route.
describe('path manifest over the real course', () => {
  const REPO = resolve(__dirname, '../../../..');
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const entries = LEVELS.flatMap(level =>
    readdirSync(join(REPO, level), { withFileTypes: true })
      .filter(d => d.isDirectory() && existsSync(join(REPO, level, d.name, 'lesson.md')))
      .map(d => {
        const fm = readFileSync(join(REPO, level, d.name, 'lesson.md'), 'utf8');
        const number = Number(/^number:\s*(\d+)/m.exec(fm)?.[1]);
        const title = /^title:\s*(.+)$/m.exec(fm)?.[1];
        const slug = /^slug:\s*(.+)$/m.exec(fm)?.[1]; // the short frontmatter slug that caused #464
        return { id: `${level.toLowerCase()}/${d.name}/lesson`, data: { number, title, slug } };
      }),
  );
  const lessons = projectLessonEntries(entries);
  const vocabSets = lessons.map(l => ({ id: l.id, lesson: l.data.lesson!, entries: [{}] }));
  const manifest = buildPathManifest({ lessons, vocabSets });

  it('covers every lesson folder', () => {
    expect(manifest.length).toBe(entries.length);
    expect(manifest.length).toBeGreaterThanOrEqual(68);
  });

  it('links every node to an existing lesson folder', () => {
    const broken = manifest.filter(n => !existsSync(join(REPO, n.level, n.slug, 'lesson.md')));
    expect(broken.map(n => `${n.level}/${n.slug}`)).toEqual([]);
  });
});
