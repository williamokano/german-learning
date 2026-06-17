import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { ExerciseSet } from './core/content/schema';

const lessonSchema = z.object({
  level:    z.enum(['A1','A2','B1','B2','C1']).optional(),
  number:   z.number().int().positive().optional(),
  slug:     z.string().optional(),
  title:    z.string().optional(),
  titleEn:  z.string().optional(),
  canDo:    z.array(z.string()).optional(),
  grammar:  z.array(z.string()).optional(),
  buildsOn: z.array(z.string()).optional(),
});

// Always use the filepath as the entry id, even when frontmatter has a `slug:` field.
// Astro's default generateId returns data.slug when present, which loses the level/number
// prefix and breaks the [level]/[lesson] routing. We strip only the extension.
const byFilepath = ({ entry }: { entry: string }) =>
  entry.replace(/\.(md|mdx)$/, '').toLowerCase();

const lessons = defineCollection({
  loader: glob({ pattern: '*/*/lesson.{md,mdx}', base: '../', generateId: byFilepath }),
  schema: lessonSchema,
});

const lessonsShort = defineCollection({
  loader: glob({ pattern: '*/*/lesson-short.{md,mdx}', base: '../', generateId: byFilepath }),
  schema: lessonSchema,
});

const exercises = defineCollection({
  loader: glob({ pattern: '*/*/exercises.yml', base: '../' }),
  schema: ExerciseSet,
});

export const collections = { lessons, 'lessons-short': lessonsShort, exercises };
