// Lesson-entry projection shared by every page that builds the learning path
// (/path, /today, /plan, /einstufungstest) and by the lesson route itself.
//
// The route segment is always the lesson's *folder name* ("04-wohnen"), taken from
// the content-collection entry id ("a1/04-wohnen/lesson"). Frontmatter `slug:`
// ("wohnen") must NOT be used for links — it has no number prefix and produced
// 404s for 67 of 68 path links (issue #464).

import type { PathManifestLessonInput, PathManifestVocabSetInput } from './path';

export interface LessonRoute {
  /** Lowercase level segment, e.g. "a1". */
  level: string;
  /** Folder name used as the route segment, e.g. "04-wohnen". */
  slug: string;
}

/** Route parts for a lesson entry id such as "a1/04-wohnen/lesson". */
export function lessonRoute(entryId: string): LessonRoute {
  const [level = '', slug = ''] = entryId.split('/');
  return { level: level.toLowerCase(), slug };
}

export interface LessonEntryLike {
  id: string;
  data: { number?: number; title?: string };
}

/**
 * Project lesson collection entries into path-manifest input. Level and slug come
 * from the entry id (same source as the route); the lesson number comes from
 * frontmatter, falling back to the folder's numeric prefix. Throws when neither
 * exists, so a malformed lesson fails the build instead of vanishing from the path.
 */
export function projectLessonEntries(entries: ReadonlyArray<LessonEntryLike>): PathManifestLessonInput[] {
  return entries.map(e => {
    const { level, slug } = lessonRoute(e.id);
    const number = e.data.number ?? Number(/^(\d+)-/.exec(slug)?.[1]);
    if (!level || !slug || !Number.isInteger(number)) {
      throw new Error(`Cannot derive level/slug/number for lesson entry "${e.id}"`);
    }
    const LEVEL = level.toUpperCase();
    return {
      id: e.id,
      data: {
        lesson: `${LEVEL}/${String(number).padStart(2, '0')}`,
        slug,
        title: e.data.title ?? '(unbenannt)',
        level: LEVEL,
        number,
      },
    };
  });
}

/** Flatten vocab collection entries to `{ id, lesson, entries }`, keeping the entry type. */
export function projectVocabSets<E extends PathManifestVocabSetInput['entries']>(
  entries: ReadonlyArray<{ id: string; data: { lesson: string; entries: E } }>,
): Array<{ id: string; lesson: string; entries: E }> {
  return entries.map(e => ({ id: e.id, lesson: e.data.lesson, entries: e.data.entries }));
}
