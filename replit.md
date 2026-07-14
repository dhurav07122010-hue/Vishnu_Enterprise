# Visor Craft Pro — Vishnu Enterprises

A helmet visor e-commerce storefront for Vishnu Enterprises (Delhi). Customers can browse mirror, tinted, and crystal-clear visors, place orders, and track delivery. Cash on Delivery and UPI supported.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TanStack Router + Tailwind CSS v4 + shadcn/ui |
| Auth & database | Supabase (PostgreSQL + Auth) |
| API server | Express 5 + Drizzle ORM (PostgreSQL) |
| Package manager | pnpm (workspace monorepo) |

## Structure

```
artifacts/
  visor-craft/        # React frontend (main storefront + admin)
  api-server/         # Express REST API server
  mockup-sandbox/     # Design / component preview server
lib/
  api-spec/           # OpenAPI spec + Orval codegen config
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod schemas
  db/                 # Drizzle ORM schema + migrations
```

## Running the app

Both services start automatically via Replit workflows:

- **Frontend** (`artifacts/visor-craft: web`) — Vite dev server on `$PORT`
- **API server** (`artifacts/api-server: API Server`) — Express on `$PORT`

## Required secrets

| Secret | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Settings → API → Project API keys (anon/public) |
| `SESSION_SECRET` | Already set — used by the API server |

## Key pages

- `/` — Homepage hero
- `/store` — Product listing
- `/products/:slug` — Product detail
- `/checkout` — Order checkout
- `/orders` — Order list
- `/track` — Order tracking
- `/admin` — Admin dashboard (products, orders, messages, newsletter)
- `/admin-login` — Admin login

## One-time Supabase setup (required for Add Product to work)

Run **`supabase-setup.sql`** (project root) in your Supabase dashboard → SQL Editor.

It creates all tables with correct RLS policies and the `product-images` storage bucket.
Without it, admin product inserts will be blocked by Row Level Security.

## User preferences

<!-- Add preferences here as they come up -->
