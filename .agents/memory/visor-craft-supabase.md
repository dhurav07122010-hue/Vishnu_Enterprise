---
name: Visor Craft Pro / Supabase project
description: Which Supabase project backs this app, and where its schema lives
---

Visor Craft Pro (artifacts/visor-craft) uses Supabase directly from the frontend
(@supabase/supabase-js), not the lib/db Drizzle scaffold (that scaffold is an
empty placeholder and unused).

The live/correct Supabase project for this app is `trbzkuwppgnsijiloqlo`
(https://trbzkuwppgnsijiloqlo.supabase.co). An earlier, different project ref
(shkonjwxqkcdecobtnvj) was tried first based on a stale assumption and turned
out to be the wrong project — always read the current VITE_SUPABASE_URL env
var (or ask the user to confirm the project ref) before running migrations or
trusting schema state.

Schema source of truth is `supabase-setup.sql` at the repo root (base tables +
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations for categories.parent_id,
categories.image_url, categories.is_visible — the main/subcategory hierarchy
feature). There is no DB connection string / service role key available in
this environment, so schema migrations must be run manually by the user via
the Supabase SQL Editor — give them the exact SQL snippet to paste rather than
trying to execute DDL through the anon REST key (PostgREST can't run DDL).

**Why:** No Supabase connector/integration exists in this Replit project, and
the anon key can only do REST reads/writes, not schema changes. Getting the
project ref wrong wastes a full round trip of user SQL execution before the
mistake surfaces via a REST schema-cache check.

**How to apply:** Before touching Supabase schema/storage for this app, GET
`{VITE_SUPABASE_URL}/rest/v1/<table>?select=<col>` with the anon key to verify
current schema state, and diff `VITE_SUPABASE_URL` against any project ref the
user mentions before assuming they match.
