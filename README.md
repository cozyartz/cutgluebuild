# CutGlueBuild - AI-Powered CNC Design Assistant

Cut. Glue. Build. Repeat. Transform your creative ideas into laser-cut masterpieces with AI-powered tools, premium templates, and step-by-step guides.

## 🚀 Features

### AI-Powered Tools
- **SVG Generator**: Describe your design and get laser-ready SVG files with proper cut/engrave layers
- **Project Ideas**: Get personalized project suggestions based on your materials, tools, and skill level
- **Upload & Vectorize**: Convert photos and images into clean, laser-ready vector files

### Design Management
- **Project History**: Track all your designs with automatic revision control
- **Design Editor**: Built-in editor for refining and customizing your designs
- **Multiple Export Formats**: Download as SVG, PNG, PDF, and DXF

### Premium Templates
- 500+ professional-grade templates
- Glowforge and Cricut ready
- Organized by category, material, and difficulty
- Free and premium options

### Content & Community
- **Blog**: CNC tutorials, tool reviews, and project showcases
- **Material Recommendations**: Affiliate-powered product suggestions
- **Step-by-Step Guides**: Detailed instructions for every project

## 🛠 Tech Stack

- **Frontend**: Astro + React + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Cloudflare D1 (Database) + Cloudflare Workers (API)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 for design generation
- **Design Tools**: Fabric.js for canvas editing
- **Authentication**: Session-based with httpOnly cookies

## 📁 Project Structure

```
/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── home/         # Homepage sections
│   │   ├── tools/        # AI tool components
│   │   └── templates/    # Template components
│   ├── layouts/          # Astro layouts
│   ├── lib/              # Utilities and services
│   │   ├── database.ts   # D1 database service
│   │   ├── auth.ts      # Session-based auth
│   │   └── openai.ts    # AI integration
│   ├── pages/            # Astro pages
│   │   └── api/         # Cloudflare Workers API endpoints
│   ├── store/            # Zustand state management
│   └── styles/           # Global CSS
├── migrations/           # D1 database migrations
├── templates/           # SVG template files
├── wrangler.toml       # Cloudflare configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for production)
- Wrangler CLI (`npm install -g wrangler`)
- Stripe account (for payments)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cutgluebuild
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Cloudflare (for production)
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   
   # Stripe
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   
   # OpenAI (optional - falls back to mock data)
   OPENAI_API_KEY=your_openai_api_key
   
   # Site URL
   VITE_SITE_URL=http://localhost:4321
   ```

4. **Set up Cloudflare D1 Database (Optional)**
   ```bash
   # Create D1 database
   wrangler d1 create cutgluebuild-db
   
   # Update wrangler.toml with your database ID
   # Run migrations
   wrangler d1 execute cutgluebuild-db --file migrations/0001_initial_schema.sql
   wrangler d1 execute cutgluebuild-db --file migrations/0002_populate_templates.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:4321`

## 🗄 Database Schema

### Core Tables
- `profiles` - User profiles and subscription info
- `user_projects` - User-created designs and projects
- `project_revisions` - Version history for projects
- `templates` - Premium and free design templates
- `blog_posts` - CMS for blog content
- `user_sessions` - Session-based authentication

### Key Features
- Session-based authentication with httpOnly cookies
- Automatic revision tracking for projects
- Subscription tier-based access control
- Download analytics and usage tracking
- JSON fields stored as TEXT with application-layer parsing

## 🎨 Design System

### Colors
- **Primary**: Orange gradient (#f97316 to #ea580c)
- **Secondary**: Blue gradient (#3b82f6 to #2563eb)
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

### Components
- Consistent card-based layouts
- Hover animations and micro-interactions
- Dark mode support
- Responsive design (mobile-first)

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run astro` | Run Astro CLI commands |
| `wrangler d1 execute cutgluebuild-db --command "SELECT * FROM profiles"` | Query D1 database |
| `wrangler pages deploy dist` | Deploy to Cloudflare Pages |

## 🚀 Deployment

### Cloudflare Pages (Recommended)
1. Connect your repository to Cloudflare Pages
2. Set up D1 database with `wrangler d1 create`
3. Run database migrations with `wrangler d1 execute`
4. Configure environment variables in Cloudflare dashboard
5. Deploy with `wrangler pages deploy dist`

### Manual Deployment
```bash
npm run build
wrangler pages deploy dist
```

## 🔐 Environment Variables

### Required for Production
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - API token with D1 permissions
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key

### Optional
- `OPENAI_API_KEY` - For AI features (falls back to mock data)
- `VITE_SITE_URL` - Site URL for redirects
- `AMAZON_ASSOCIATE_TAG` - For affiliate links

## 📊 Subscription Tiers

### Free (Starter)
- 5 AI tool uses per day
- Basic templates
- Community support
- Export to SVG

### Maker ($19/month)
- 100 AI tool uses per day
- Premium templates
- Project history
- Priority support
- Advanced vectorization

### Pro ($49/month)
- Unlimited AI tool uses
- All premium templates
- Private community access
- Early feature access
- API access
- White-label options

## 🏗 Architecture

### Cloudflare-Native Stack
- **Frontend**: Astro with React islands, deployed to Cloudflare Pages
- **Database**: Cloudflare D1 (SQLite) for global edge performance
- **API**: Cloudflare Workers for serverless API endpoints
- **Authentication**: Session-based with secure httpOnly cookies
- **Storage**: Cloudflare R2 for file storage (future)

### Performance Benefits
- Sub-100ms response times globally via Cloudflare's edge network
- Automatic scaling with zero configuration
- Cost-effective serverless architecture
- Built-in DDoS protection and security

## 🔧 Development

### Local Development
- Uses mock services when Cloudflare credentials not configured
- All features work with placeholder data
- Hot reloading and TypeScript checking

### Database Development
```bash
# Create new migration
touch migrations/0003_your_migration.sql

# Test locally
wrangler d1 execute cutgluebuild-db --file migrations/0003_your_migration.sql

# Deploy to production
wrangler d1 migrations apply cutgluebuild-db
```

### API Development
- API endpoints in `src/pages/api/`
- Automatic Cloudflare Workers deployment
- Session-based authentication built-in

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Ensure session-based auth is properly implemented
- Test with both mock and real Cloudflare services

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- **Documentation**: [Internal docs at /docs](http://localhost:4321/docs)
- **Email**: support@cutgluebuild.com
- **Discord**: [Join our community](https://discord.gg/cutgluebuild)

## 🎯 Roadmap

- [ ] 3D model support
- [ ] CNC G-code generation
- [ ] Mobile app
- [ ] Marketplace for user templates
- [ ] Advanced CAM features
- [ ] Integration with more CNC machines
- [ ] Cloudflare R2 integration for file storage
- [ ] Real-time collaboration features

## 🔄 Migration Notes

This project has been migrated from Supabase to Cloudflare D1:
- **Database**: PostgreSQL → SQLite (D1)
- **Authentication**: JWT tokens → Session cookies
- **API**: Supabase Edge Functions → Cloudflare Workers
- **Hosting**: Generic hosting → Cloudflare Pages

All functionality has been preserved while gaining better performance and lower costs.

---

Built with ❤️ for the maker community