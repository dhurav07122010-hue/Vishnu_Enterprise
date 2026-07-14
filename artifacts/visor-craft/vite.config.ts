import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const isBuildCommand = process.env.npm_lifecycle_event === 'build';
const isReplitEnv = process.env.REPL_ID !== undefined;

// ── PORT ─────────────────────────────────────────────────────────────────────
// Required for the dev/preview server only — not needed during `vite build`.
const rawPort = process.env.PORT;
if (!isBuildCommand && !rawPort) {
  throw new Error('PORT environment variable is required for the dev server.');
}
const port = Number(rawPort ?? '3000');

// ── BASE_PATH ─────────────────────────────────────────────────────────────────
// Defaults to '/' — correct for Vercel (root deployment).
// Replit overrides this via the artifact service env config.
const basePath = process.env.BASE_PATH ?? '/';

// ── SUPABASE CREDENTIALS ──────────────────────────────────────────────────────
// Vite bakes VITE_* vars into the bundle at build time.
// → For Vercel: set in Project → Settings → Environment Variables
// → For local dev on Replit: set in Settings → Secrets
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const missing = [
    ...(!supabaseUrl ? ['VITE_SUPABASE_URL'] : []),
    ...(!supabaseKey ? ['VITE_SUPABASE_PUBLISHABLE_KEY'] : []),
  ];
  throw new Error(
    `Missing required Supabase environment variable(s): ${missing.join(', ')}.\n` +
      'For Vercel: Project → Settings → Environment Variables.\n' +
      'For Replit: Settings → Secrets.',
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Replit-only dev plugins — never loaded outside the Replit environment
    ...(process.env.NODE_ENV !== 'production' && isReplitEnv
      ? [
          await import('@replit/vite-plugin-runtime-error-modal').then((m) =>
            m.default(),
          ),
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
