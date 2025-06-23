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
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 for design generation
- **Design Tools**: Fabric.js for canvas editing

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
│   ├── pages/            # Astro pages and API routes
│   ├── store/            # Zustand state management
│   └── styles/           # Global CSS
├── supabase/
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
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
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Site URL
   VITE_SITE_URL=http://localhost:4321
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Deploy the edge functions in `supabase/functions/`

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
- `template_downloads` - Download tracking
- `blog_posts` - CMS for blog content

### Key Features
- Row Level Security (RLS) enabled on all tables
- Automatic revision tracking for projects
- Subscription tier-based access control
- Download analytics and usage tracking

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

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🔐 Environment Variables

### Required
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- **Documentation**: [docs.cutgluebuild.com](https://docs.cutgluebuild.com)
- **Email**: support@cutgluebuild.com
- **Discord**: [Join our community](https://discord.gg/cutgluebuild)

## 🎯 Roadmap

- [ ] 3D model support
- [ ] CNC G-code generation
- [ ] Mobile app
- [ ] Marketplace for user templates
- [ ] Advanced CAM features
- [ ] Integration with more CNC machines

---

Built with ❤️ for the maker community
