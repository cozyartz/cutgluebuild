// src/lib/blog.ts
import type { CollectionEntry } from 'astro:content';
import { getCollection, getEntryBySlug } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export async function getAllPosts(): Promise<BlogPost[]> {
  const all = await getCollection('blog', (post) => !post.data.draft);
  return all.sort((a, b) => {
    const dateA = new Date(a.data.published_at || '').getTime();
    const dateB = new Date(b.data.published_at || '').getTime();
    return dateB - dateA;
  });
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const post = await getEntryBySlug('blog', slug);
    return post && !post.data.draft ? post : null;
  } catch {
    return null;
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getCollection('blog');
  return posts.map((p) => p.slug);
}
