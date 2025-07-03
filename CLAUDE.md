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

## Templates System

### Template Structure
Templates are stored in `templates/` directory with SVG files and organized by category:
- `templates/woodworking/` - Categorized by type (bird-houses, home-decor, etc.)
- Database-driven with free/premium tiers
- Download tracking and subscription validation via `TemplateDownloadButton`

### Template Categories & Pricing
- **Free**: Basic templates for lead generation (Classic Bird House, Pegboard Tools, Picture Frames, Plant Markers)
- **Premium**: Advanced designs requiring Maker/Pro subscriptions (Modern designs, Traditional build plans)

## Build System Considerations

### Static Build Compatibility
- Mock Supabase client for build-time when environment variables unavailable
- Dynamic routes require `getStaticPaths()` returning empty arrays for server-side generation
- Database queries wrapped in try-catch for graceful build failures

### Environment Handling
The app gracefully handles missing environment variables during build:
- Supabase client auto-detects environment and provides mock responses
- OpenAI integration falls back to MockAIService when API key missing
- All external service integrations designed to fail gracefully

## Authentication & Subscription Flow

### Auth State Management
- Zustand store (`authStore.ts`) with persistence handles auth state
- Automatic session refresh and auth state change listeners
- Server-side auth checks in Astro pages using `authService.getCurrentUser()`

### Feature Access Control
Use `useCanAccessFeature(feature)` hook for subscription gating:
- `premium_templates` - Maker/Pro tiers
- `unlimited_ai` - Pro tier only  
- `priority_support` - Maker/Pro tiers
- `api_access` - Pro tier only
- `white_label` - Pro tier only

## AI Integration Architecture

### Service Layer Pattern
- `OpenAIService` class for production AI features
- `MockAIService` for development/fallback with realistic test data
- Automatic service selection based on API key availability
- Client-side usage with `dangerouslyAllowBrowser: true` for development

### AI Tool Types
- SVG Generation: Text-to-SVG with material and style parameters
- Project Ideas: Personalized suggestions based on user skills/tools
- Image Vectorization: Photo-to-vector conversion for laser cutting

## Database Integration

### Edge Functions
Supabase edge functions handle complex operations:
- `save-project-revision/` - Automatic versioning with incremental numbering
- `restore-project-revision/` - Project rollback functionality

### RLS Implementation
All tables use Row Level Security:
- User-scoped access for projects and downloads
- Public read access for templates
- Admin-only write access for templates and system data

## Development Workflow

### Testing Database Changes
1. Create migration in `supabase/migrations/`
2. Test locally with Supabase CLI
3. Deploy to staging environment first
4. Templates require both schema and data population scripts

### Component Development
- React components use TypeScript interfaces from `src/lib/supabase.ts`
- Astro pages handle server-side data fetching and authentication
- Client-side interactivity added via `client:load` directive