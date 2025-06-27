import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client for build time when env vars are not available
const createMockClient = () => {
  const mockQuery = {
    data: [],
    error: null,
    select: function() { return this; },
    insert: function() { return this; },
    update: function() { return this; },
    upsert: function() { return this; },
    delete: function() { return this; },
    single: function() { return this; },
    eq: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    then: function(resolve) { resolve({ data: [], error: null }); return this; }
  };

  return {
    from: () => mockQuery,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } })
    }
  };
};

export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: 'free' | 'starter' | 'maker' | 'pro';
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  materials: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  svg_data: string;
  preview_url?: string;
  is_premium: boolean;
  download_count: number;
  created_at: string;
}

export interface UserProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  svg_data?: string;
  project_type: 'svg_generated' | 'upload_vectorized' | 'project_idea';
  metadata?: any;
  current_revision_id?: string;
  canvas_settings?: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  created_at: string;
}

export interface ProjectRevision {
  id: string;
  project_id: string;
  revision_number: number;
  svg_data: string;
  changes_description?: string;
  metadata?: any;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  published: boolean;
  featured_image?: string;
  reading_time: number;
  published_at?: string;
  created_at: string;
}