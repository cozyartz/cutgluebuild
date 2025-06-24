import type { CollectionEntry, z } from 'astro:content';
import { defineCollection, z as zod } from 'astro:content';

const blogCollection = defineCollection({
  schema: zod.object({
    title: zod.string(),
    excerpt: zod.string(),
    published_at: zod.string(),
    author: zod.string().optional(),
    tags: zod.array(zod.string()).optional(),
    featured_image: zod.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};

export type BlogEntry = CollectionEntry<'blog'>;
