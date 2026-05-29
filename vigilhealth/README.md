# VigilHealth Community Platform

A hyperlocal health intelligence Progressive Web Application — "Waze for health risks meets Nextdoor for wellness."

## Overview

VigilHealth combines real-time health authority data (WHO, CDC) with community-sourced reports to provide:

- **Risk Radar** — Interactive map showing health risk levels by neighborhood
- **Symptom Checker** — AI-guided triage matching symptoms to outbreak profiles
- **Supply Finder** — Crowdsourced map of health supply availability
- **Alert System** — Personalized daily digests and critical push notifications
- **Community Network** — Neighbor-to-neighbor mutual aid coordination
- **Community Q&A** — Verified health information with authoritative citations
- **Business Dashboard** — B2B employee wellness monitoring (HIPAA-compliant)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (JWT) |
| Realtime | Supabase Realtime (WebSocket) |
| Maps | Mapbox GL JS |
| Email | Resend |
| Payments | Stripe |
| Hosting | Vercel (free tier) |

## Getting Started

### Prerequisites

- Node.js 20.x or later
- A [Supabase](https://supabase.com) project
- A [Mapbox](https://mapbox.com) account
- A [Resend](https://resend.com) account
- A [Stripe](https://stripe.com) account (for payment features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/vigilhealth.git
   cd vigilhealth
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and fill in your actual values (see [Environment Variables](#environment-variables) below).

4. **Set up the database**

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your Supabase project
   supabase link --project-ref YOUR_PROJECT_REF

   # Apply migrations
   supabase db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

### Supabase

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (from Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never expose to client) |

### Mapbox

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public access token (restrict to your domain in Mapbox dashboard) |

### Resend

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for sending transactional emails |

### Application

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public URL of your app (e.g., `https://vigilhealth.com`) |
| `NEXTAUTH_SECRET` | Secret for JWT signing — generate with `openssl rand -base64 32` |
| `DEPLOYMENT_PHASE` | `phase1` (Vercel + Supabase) or `phase2` (CloudPanel + self-hosted) |

### Telehealth

| Variable | Description |
|----------|-------------|
| `TELEHEALTH_WEBHOOK_SECRET` | Secret for verifying telehealth consultation completion webhooks |

### Stripe

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe for client) |

### External Health Data APIs

| Variable | Description |
|----------|-------------|
| `WHO_API_BASE_URL` | WHO Disease Outbreak News API base URL |
| `CDC_NNDSS_BASE_URL` | CDC NNDSS Socrata API base URL |

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Format all files with Prettier
npm run format:check # Check formatting without writing
```

## Project Structure

```
vigilhealth/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes (login, register, reset)
│   ├── (dashboard)/        # Authenticated dashboard routes
│   ├── api/                # API route handlers
│   │   ├── risk/           # Risk Radar endpoints
│   │   ├── symptom/        # Symptom Checker endpoints
│   │   ├── supply/         # Supply Finder endpoints
│   │   ├── community/      # Community Network endpoints
│   │   ├── data/           # Cron job data fetchers
│   │   ├── email/          # Email delivery endpoints
│   │   └── analytics/      # Analytics endpoints
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable React components
│   ├── ui/                 # Base UI components
│   ├── maps/               # Map components (RiskRadarMap)
│   ├── forms/              # Form components
│   └── layout/             # Layout components (Header, Footer)
├── lib/                    # Shared utilities and clients
│   ├── supabase/           # Supabase client (server + client)
│   ├── auth/               # Auth utilities and middleware
│   ├── db/                 # Database abstraction layer
│   ├── realtime/           # Realtime WebSocket abstraction
│   ├── email/              # Email templates and sending
│   ├── geo/                # Geolocation and distance utilities
│   └── utils/              # General utilities
├── types/                  # TypeScript type definitions
├── public/                 # Static assets
│   ├── icons/              # PWA icons
│   └── manifest.json       # PWA manifest
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migration files
├── .env.example            # Environment variable template
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vercel.json             # Vercel deployment configuration
```

## Deployment

### Vercel (Phase 1 — Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add all environment variables in Vercel project settings
4. Deploy — Vercel auto-detects Next.js and configures everything

Cron jobs defined in `vercel.json` will run automatically on Vercel's infrastructure.

### CloudPanel (Phase 2 — Self-Hosted)

See `docs/migration-rollback.md` for migration instructions from Vercel to CloudPanel.

## Free Tier Limits

The platform is designed to operate within free tier limits:

| Service | Limit | Alert Threshold |
|---------|-------|-----------------|
| Vercel | 100 GB bandwidth/month | 80 GB |
| Supabase | 500 MB storage, 2 GB bandwidth | 400 MB / 1.6 GB |
| Mapbox | 50,000 map loads/month | 40,000 loads |
| Resend | 100 emails/day | 80 emails/day |

## Medical Disclaimer

VigilHealth provides health information for educational purposes only. This platform does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. In case of emergency, call 911 immediately.

## License

Private — All rights reserved.
