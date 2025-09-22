import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    author: z.string(),
    tags: z.array(z.string()),
    published: z.boolean(),
    featured_image: z.string().optional(),
    reading_time: z.number().optional(),
    published_at: z.string().transform((str) => new Date(str)),
  }),
});

export const collections = {
  blog,
};