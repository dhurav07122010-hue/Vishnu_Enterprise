-- ============================================================
-- Vishnu Enterprises — Supabase Setup SQL
-- Run this in your Supabase project: Dashboard → SQL Editor
-- ============================================================

-- ── 1. EXTENSIONS ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. TABLES ────────────────────────────────────────────────

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  description  text,
  sort_order   int  NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text NOT NULL UNIQUE,
  short_description     text,
  description           text,
  category_id           uuid REFERENCES categories(id) ON DELETE SET NULL,
  price_cents           int  NOT NULL,
  compare_at_price_cents int,
  currency              text NOT NULL DEFAULT 'INR',
  stock                 int  NOT NULL DEFAULT 0,
  rating                numeric(3,2) NOT NULL DEFAULT 0,
  rating_count          int  NOT NULL DEFAULT 0,
  is_active             boolean NOT NULL DEFAULT true,
  is_featured           boolean NOT NULL DEFAULT false,
  primary_image_url     text,
  specs                 jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Product images (gallery)
CREATE TABLE IF NOT EXISTS product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        text NOT NULL,
  alt        text,
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating        int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         text,
  body          text,
  is_approved   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text NOT NULL UNIQUE,
  user_id               uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name         text NOT NULL,
  customer_email        text NOT NULL,
  customer_phone        text NOT NULL,
  status                text NOT NULL DEFAULT 'pending',
  payment_method        text NOT NULL DEFAULT 'cod',
  payment_status        text NOT NULL DEFAULT 'pending',
  subtotal_cents        int  NOT NULL,
  shipping_cents        int  NOT NULL DEFAULT 0,
  total_cents           int  NOT NULL,
  currency              text NOT NULL DEFAULT 'INR',
  shipping_address_line1 text NOT NULL,
  shipping_address_line2 text,
  shipping_city         text NOT NULL,
  shipping_state        text NOT NULL,
  shipping_pincode      text NOT NULL,
  shipping_landmark     text,
  tracking_code         text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name      text NOT NULL,
  product_slug      text NOT NULL,
  quantity          int  NOT NULL,
  unit_price_cents  int  NOT NULL,
  line_total_cents  int  NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Payment screenshots
CREATE TABLE IF NOT EXISTS payment_screenshots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  url        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  subject    text,
  message    text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. UPDATED_AT TRIGGERS ───────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────
--
-- The admin panel uses localStorage-based authentication (not Supabase Auth),
-- so all admin CRUD (insert/update/delete on products, categories, etc.)
-- must be allowed via the anon key. The policies below are intentionally
-- permissive for a small-business deployment.
--
-- IMPORTANT: If you later add Supabase Auth for admins, replace these
-- policies with user-role-based ones.
-- ─────────────────────────────────────────────────────────────

-- Categories: public read, anon CRUD
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_read"   ON categories;
DROP POLICY IF EXISTS "categories_write"  ON categories;
CREATE POLICY "categories_read"  ON categories FOR SELECT USING (true);
CREATE POLICY "categories_write" ON categories FOR ALL    USING (true) WITH CHECK (true);

-- Products: public read (active only), anon CRUD
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_read"   ON products;
DROP POLICY IF EXISTS "products_admin"  ON products;
CREATE POLICY "products_read"  ON products FOR SELECT USING (true);
CREATE POLICY "products_admin" ON products FOR ALL    USING (true) WITH CHECK (true);

-- Product images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_images_read"  ON product_images;
DROP POLICY IF EXISTS "product_images_admin" ON product_images;
CREATE POLICY "product_images_read"  ON product_images FOR SELECT USING (true);
CREATE POLICY "product_images_admin" ON product_images FOR ALL    USING (true) WITH CHECK (true);

-- Reviews: public read (approved), anon insert, admin manage
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_read"   ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_admin"  ON reviews;
CREATE POLICY "reviews_read"   ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_admin"  ON reviews FOR ALL    USING (true) WITH CHECK (true);

-- Orders: users see their own, anon can insert (checkout), admin sees all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_own"    ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_admin"  ON orders;
CREATE POLICY "orders_own"    ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin"  ON orders FOR ALL    USING (true) WITH CHECK (true);

-- Order items: same as orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_admin"  ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_admin"  ON order_items FOR ALL    USING (true) WITH CHECK (true);

-- Payment screenshots
ALTER TABLE payment_screenshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_ss_insert" ON payment_screenshots;
DROP POLICY IF EXISTS "payment_ss_admin"  ON payment_screenshots;
CREATE POLICY "payment_ss_insert" ON payment_screenshots FOR INSERT WITH CHECK (true);
CREATE POLICY "payment_ss_admin"  ON payment_screenshots FOR ALL    USING (true) WITH CHECK (true);

-- Contact messages: anyone can insert, admin reads/updates
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contact_insert" ON contact_messages;
DROP POLICY IF EXISTS "contact_admin"  ON contact_messages;
CREATE POLICY "contact_insert" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_admin"  ON contact_messages FOR ALL    USING (true) WITH CHECK (true);

-- Newsletter subscribers: anyone can insert
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletter_insert" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin"  ON newsletter_subscribers;
CREATE POLICY "newsletter_insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "newsletter_admin"  ON newsletter_subscribers FOR ALL    USING (true) WITH CHECK (true);

-- Profiles: users manage own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ── 5. STORAGE BUCKET ────────────────────────────────────────
--
-- Run in the Supabase Dashboard → Storage → New Bucket:
--   Name: product-images
--   Public: YES
--   File size limit: 5 MB
--
-- Then add this storage policy (Dashboard → Storage → product-images → Policies):
--   Bucket: product-images
--   Operation: INSERT, SELECT, UPDATE, DELETE
--   Policy: allow all (for now, restrict later)
--
-- Or run this SQL (requires supabase_storage schema access):
-- INSERT INTO storage.buckets (id, name, public, file_size_limit)
-- VALUES ('product-images', 'product-images', true, 5242880)
-- ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Storage RLS (paste into Supabase SQL editor after enabling storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

DROP POLICY IF EXISTS "product_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_anon_upload"  ON storage.objects;
DROP POLICY IF EXISTS "product_images_anon_delete"  ON storage.objects;

CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_anon_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_anon_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');

-- ── 6. SLIDER ITEMS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS slider_items (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text    NOT NULL,
  subtitle    text,
  description text,
  image_url   text    NOT NULL,
  button_text text,
  button_link text,
  sort_order  int     NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE slider_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slider_public_read" ON slider_items;
CREATE POLICY "slider_public_read" ON slider_items
  FOR SELECT USING (true);

-- Allow anon/service-role writes for admin (admin uses service key via RLS bypass or anon key)
DROP POLICY IF EXISTS "slider_anon_write" ON slider_items;
CREATE POLICY "slider_anon_write" ON slider_items
  FOR ALL USING (true) WITH CHECK (true);

-- Add is_visible column to categories if it doesn't exist yet
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- ── 7. CATEGORY HIERARCHY MIGRATION ─────────────────────────
-- Run this if upgrading from the flat category system.
-- Adds parent_id (self-referential) and image_url to categories.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url text;

-- ── 8. SEED CATEGORIES ───────────────────────────────────────
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Mirror',   'mirror',   'Iridescent mirror-finish visors',         1),
  ('Tinted',   'tinted',   'Smoke and tinted visors for bright days',  2),
  ('Clear',    'clear',    'Crystal-clear visors for all conditions',  3),
  ('Coloured', 'coloured', 'Bold coloured visors',                    4)
ON CONFLICT (slug) DO NOTHING;
