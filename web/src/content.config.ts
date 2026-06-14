import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// All fields optional — lessons have no YAML frontmatter yet;
// routing metadata is derived from the folder name in getStaticPaths.
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

// base: '../' resolves to the repo root (one level up from web/).
// Pattern picks up A1/01-erste-kontakte/lesson.md, A2/…, etc.
const lessons = defineCollection({
  loader: glob({ pattern: '*/*/lesson.{md,mdx}', base: '../' }),
  schema: lessonSchema,
});

export const collections = { lessons };
