# CLAUDE.md

🏆 **OpenAI Hackathon Project - Best Overall Category**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hackathon Context

This project is a submission for the OpenAI Hackathon using gpt-oss-120b and gpt-oss-20b models via Cloudflare Workers AI. CutGlueBuild represents a novel application of gpt-oss models to physical fabrication and CNC/laser cutting assistance.

## Development Commands

- `npm run dev` - Start development server (Astro)
- `npm run build` - Build for production (runs astro check && astro build)
- `npm run preview` - Preview production build
- `astro check` - Type check and validate Astro files
- `wrangler d1 execute cutgluebuild-db --file migrations/0001_initial_schema.sql` - Initialize D1 database
- `wrangler d1 migrations apply cutgluebuild-db` - Apply database migrations

## Project Architecture

### Tech Stack
- **Frontend**: Astro 4.x with React components and TypeScript
- **Styling**: Tailwind CSS with dark mode support + Framer Motion animations
- **Backend**: Cloudflare D1 (database), Cloudflare Workers (API endpoints)
- **State Management**: Zustand with persistence
- **Payments**: Stripe integration
- **AI**: OpenAI GPT-4 for SVG generation and project ideas
- **Canvas**: Fabric.js for design editing

### Key Services & Libraries

**Authentication & Database** (`src/lib/`):
- `database.ts` - Cloudflare D1 database client with TypeScript interfaces
- `auth.ts` - AuthService class for session-based authentication
- `authStore.ts` - Zustand store for auth state with persistence and subscription tier logic

**AI Integration** (`src/lib/openai.ts`):
- OpenAIService class for SVG generation, project ideas, and image vectorization
- MockAIService fallback when OpenAI key not configured
- Automatic service selection based on environment

**Core Components**:
- `DesignEditor.tsx` - Fabric.js canvas editor with save/export functionality
- Theme toggle with dark mode support
- Subscription tier-based feature access controls

### Database Schema (Cloudflare D1)

Key tables and relationships:
- `profiles` - User profiles with subscription tiers (free/starter/maker/pro)
- `user_projects` - Projects with revision tracking via `current_revision_id`
- `project_revisions` - Version history with automatic incremental numbering
- `templates` - Premium/free templates with download tracking
- `blog_posts` - CMS content
- `user_sessions` - Session-based authentication storage

Database schema defined in `migrations/0001_initial_schema.sql`.

### Subscription Tiers & Feature Access

Defined in `authStore.ts`:
- **Free**: Basic access
- **Maker** ($19/month): Premium templates, priority support
- **Pro** ($49/month): Unlimited AI, API access, white-label

Feature gates use `useCanAccessFeature()` hook.

### Environment Variables

**Required**:
- `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` - Cloudflare API access
- Database automatically bound via wrangler.toml D1 configuration
- `VITE_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` - Payments

**Optional**:
- `OPENAI_API_KEY` - AI features (falls back to mock data)
- `VITE_SITE_URL` - Base URL for redirects

### Project Structure

- `src/components/home/` - Landing page sections
- `src/components/tools/` - AI tool components (SVG gen, editor, etc.)
- `src/pages/tools/` - Tool pages with authentication
- `src/pages/api/` - Cloudflare Workers API endpoints
- `src/store/` - Zustand state management
- `migrations/` - D1 database schema and migrations
- `src/lib/` - Database service and authentication

### Key Patterns

- Astro pages with React islands for interactivity
- Server-side authentication checks using session validation
- Client-side state management with Zustand
- Fabric.js integration for canvas editing
- OpenAI integration with graceful fallbacks
- Subscription-based feature gating throughout UI
- API-first architecture with Cloudflare Workers endpoints

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
- Mock database client for build-time when D1 binding unavailable
- Dynamic routes require `getStaticPaths()` returning empty arrays for server-side generation
- Database queries wrapped in try-catch for graceful build failures

### Environment Handling
The app gracefully handles missing environment variables during build:
- Database client auto-detects environment and provides mock responses
- OpenAI integration falls back to MockAIService when API key missing
- All external service integrations designed to fail gracefully

## Authentication & Subscription Flow

### Auth State Management
- Zustand store (`authStore.ts`) with persistence handles auth state
- Session-based authentication using httpOnly cookies (`cutglue_session`)
- Server-side auth checks in Astro pages using session validation
- Client-side auth state synchronized with server sessions

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

### API Endpoints
Cloudflare Workers API endpoints handle database operations:
- `/api/projects/[projectId]/revisions` - Project revision history
- `/api/projects/[projectId]/restore-revision` - Project rollback functionality
- `/api/templates/[id]` - Template data retrieval
- `/api/templates/track-download` - Download tracking
- `/api/auth/signin` - User authentication
- `/api/auth/signup` - User registration

### Security Implementation
Database access controlled through:
- Session-based authentication with user ownership verification
- Server-side authorization checks on all API endpoints
- User-scoped data access enforced in database service methods

## Development Workflow

### Testing Database Changes
1. Create migration in `migrations/` directory
2. Test locally with `wrangler d1 execute` command
3. Deploy to staging D1 database first
4. Templates require both schema and data population scripts
5. Use `wrangler d1 migrations apply` for production deployment

### Component Development
- React components use TypeScript interfaces from `src/lib/database.ts`
- Astro pages handle server-side data fetching and authentication
- Client-side interactivity added via `client:load` directive
- Components make API calls to Cloudflare Workers endpoints for database operations

## Cloudflare Deployment

### D1 Database Setup
```bash
# Create D1 database
wrangler d1 create cutgluebuild-db

# Update wrangler.toml with database ID
# Run migrations
wrangler d1 execute cutgluebuild-db --file migrations/0001_initial_schema.sql
wrangler d1 execute cutgluebuild-db --file migrations/0002_populate_templates.sql

# Deploy to Cloudflare Pages
npm run build
wrangler pages deploy dist
```

### Environment Setup
1. Set up D1 database bindings in wrangler.toml
2. Configure environment variables in Cloudflare dashboard
3. Deploy Astro app to Cloudflare Pages with Workers integration
4. Test authentication and database operations

## Admin System Setup

### GitHub OAuth Configuration

The admin system requires GitHub OAuth for secure authentication. Follow these steps:

#### 1. Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `CutGlueBuild Local Development`
   - **Homepage URL**: `http://localhost:4321`
   - **Application description**: `CutGlueBuild admin authentication for local development`
   - **Authorization callback URL**: `http://localhost:4321/api/auth/github/callback`

#### 2. Configure Environment Variables
Add these to your `.env.local` or wrangler.toml:

```bash
# GitHub OAuth (Local Development)
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"
```

For production, create a separate OAuth app with:
- **Homepage URL**: `https://cutgluebuild.com`
- **Authorization callback URL**: `https://cutgluebuild.com/api/auth/github/callback`

#### 3. Admin Access
The system automatically grants superadmin privileges to the GitHub username `cozyartz` (Andrea Cozart-Lundin). When you login via GitHub OAuth:

- **Role**: Superadmin
- **Subscription**: Pro (automatically assigned)
- **Permissions**: All admin capabilities including:
  - User management
  - Template management
  - System settings
  - Analytics viewing
  - AI usage monitoring
  - Billing management
  - Content management

#### 4. Access Admin Dashboard
After configuring OAuth credentials:
1. Start development server: `npm run dev`
2. Navigate to `/login`
3. Click "Continue with GitHub"
4. Complete OAuth flow
5. Access admin dashboard at `/admin`

### Admin Features
- **User Analytics**: Total users, active users, subscription tiers
- **Template Management**: Download tracking, popular templates
- **AI Monitoring**: Generation statistics, error rates, response times
- **System Health**: Active sessions, database status
- **Activity Logs**: Admin action tracking and audit trails

## Migration Notes

This project has been migrated from Supabase to Cloudflare D1:
- **Authentication**: Now uses session-based auth with httpOnly cookies + GitHub OAuth
- **Database**: Migrated from PostgreSQL (Supabase) to SQLite (D1)
- **API**: Server-side operations moved to Cloudflare Workers endpoints
- **Build**: Optimized for Cloudflare Pages deployment
- **Security**: Enhanced with role-based admin system and activity logging
- **Admin System**: Complete admin dashboard with GitHub OAuth integration

All functionality has been preserved while gaining:
- Better performance with edge computing
- Lower costs with Cloudflare's pricing model
- Simplified deployment pipeline
- Enhanced security with session-based authentication
- Complete admin oversight and management capabilities