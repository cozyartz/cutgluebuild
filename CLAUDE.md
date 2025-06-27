# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Astro)
- `npm run build` - Build for production (runs astro check && astro build)
- `npm run preview` - Preview production build
- `astro check` - Type check and validate Astro files

## Project Architecture

### Tech Stack
- **Frontend**: Astro 4.x with React components and TypeScript
- **Styling**: Tailwind CSS with dark mode support + Framer Motion animations
- **Backend**: Supabase (auth, database, edge functions)
- **State Management**: Zustand with persistence
- **Payments**: Stripe integration
- **AI**: OpenAI GPT-4 for SVG generation and project ideas
- **Canvas**: Fabric.js for design editing

### Key Services & Libraries

**Authentication & Database** (`src/lib/`):
- `supabase.ts` - Database client with TypeScript interfaces
- `auth.ts` - AuthService class wrapping Supabase auth operations
- `authStore.ts` - Zustand store for auth state with persistence and subscription tier logic

**AI Integration** (`src/lib/openai.ts`):
- OpenAIService class for SVG generation, project ideas, and image vectorization
- MockAIService fallback when OpenAI key not configured
- Automatic service selection based on environment

**Core Components**:
- `DesignEditor.tsx` - Fabric.js canvas editor with save/export functionality
- Theme toggle with dark mode support
- Subscription tier-based feature access controls

### Database Schema (Supabase)

Key tables and relationships:
- `profiles` - User profiles with subscription tiers (free/starter/maker/pro)
- `user_projects` - Projects with revision tracking via `current_revision_id`
- `project_revisions` - Version history with automatic incremental numbering
- `templates` - Premium/free templates with download tracking
- `blog_posts` - CMS content

Row Level Security (RLS) enabled on all tables.

### Subscription Tiers & Feature Access

Defined in `authStore.ts`:
- **Free**: Basic access
- **Maker** ($19/month): Premium templates, priority support
- **Pro** ($49/month): Unlimited AI, API access, white-label

Feature gates use `useCanAccessFeature()` hook.

### Environment Variables

**Required**:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` - Database connection
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side operations
- `VITE_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` - Payments

**Optional**:
- `OPENAI_API_KEY` - AI features (falls back to mock data)
- `VITE_SITE_URL` - Base URL for redirects

### Project Structure

- `src/components/home/` - Landing page sections
- `src/components/tools/` - AI tool components (SVG gen, editor, etc.)
- `src/pages/tools/` - Tool pages with authentication
- `src/store/` - Zustand state management
- `supabase/functions/` - Edge functions for project revisions
- `supabase/migrations/` - Database schema

### Key Patterns

- Astro pages with React islands for interactivity
- Server-side authentication checks in Astro pages
- Client-side state management with Zustand
- Fabric.js integration for canvas editing
- OpenAI integration with graceful fallbacks
- Subscription-based feature gating throughout UI