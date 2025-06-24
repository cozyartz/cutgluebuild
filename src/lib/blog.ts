// src/lib/blog.ts
import type { CollectionEntry } from 'astro:content';
import { getCollection, getEntryBySlug } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getAllPosts(): Promise<BlogPost[]> {
  const all = await getCollection('blog', (post) => !post.data.draft);
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = await getEntryBySlug('blog', slug);
  return post && !post.data.draft ? post : null;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getCollection('blog');
  return posts.map((p) => p.slug);
}
