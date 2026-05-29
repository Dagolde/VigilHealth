# Supabase Setup Guide for VigilHealth

This guide walks you through setting up Supabase for the VigilHealth Community Platform.

---

## 1. Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project** from your dashboard.
3. Fill in the project details:
   - **Name**: `vigilhealth` (or your preferred name)
   - **Database Password**: Choose a strong password and save it somewhere safe.
   - **Region**: Select the region closest to your users.
4. Click **Create new project** and wait 1–2 minutes for provisioning.

---

## 2. Retrieve Your Connection Credentials

Once your project is ready, navigate to **Project Settings → API** in the left sidebar.

You will find:

| Credential | Where to Find It | Used For |
|---|---|---|
| **Project URL** | "Project URL" field | `NEXT_PUBLIC_SUPABASE_URL` |
| **Anon Key** | "Project API keys → anon public" | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Service Role Key** | "Project API keys → service_role secret" | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **Never expose the Service Role Key in client-side code.** It bypasses Row Level Security and should only be used in server-side code or cron jobs.

---

## 3. Copy Credentials into `.env.local`

Open `vigilhealth/.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## 4. Find the Database Connection String

For direct PostgreSQL access (e.g., running migrations manually or using a DB client like TablePlus):

1. Go to **Project Settings → Database** in the left sidebar.
2. Under **Connection string**, select the **URI** tab.
3. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project.

You can also use the **Connection pooling** string (port 6543) for production workloads.

---

## 5. Enable PostGIS Extension

VigilHealth uses PostGIS for all geospatial queries (location-based searches, distance calculations). You need to enable it before running migrations.

### Option A: Via Migration (Recommended)

The first migration file (`20240101000001_enable_extensions.sql`) handles this automatically when you run `supabase db push` or `supabase start`.

### Option B: Via Supabase Dashboard

1. Go to **Database → Extensions** in the left sidebar.
2. Search for `postgis`.
3. Click the toggle to enable it.
4. Also enable `pgcrypto` and `pg_trgm` while you're there.

---

## 6. Install the Supabase CLI

### macOS (Homebrew)

```bash
brew install supabase/tap/supabase
```

### Windows (Scoop)

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux / npm

```bash
npm install -g supabase
```

### Verify Installation

```bash
supabase --version
```

---

## 7. Configure Local Development

The `supabase/config.toml` file in this project is already configured. To start the local Supabase stack:

```bash
# From the vigilhealth/ directory
supabase start
```

This starts a local PostgreSQL instance, Supabase Studio, and all services. The first run downloads Docker images and may take a few minutes.

Once running, you'll see output like:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
```

### Apply Migrations Locally

```bash
supabase db push
```

Or to reset and re-apply all migrations:

```bash
supabase db reset
```

### Seed the Database

```bash
supabase db reset  # This also runs seed.sql automatically
```

Or manually:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql
```

### Stop Local Services

```bash
supabase stop
```

---

## 8. Push Migrations to Production

Once you're ready to deploy to your hosted Supabase project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

---

## 9. Supabase Studio

Access the local Supabase Studio at [http://localhost:54323](http://localhost:54323) to:
- Browse tables and data
- Run SQL queries
- Manage RLS policies
- View realtime logs

For the hosted project, go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and select your project.
