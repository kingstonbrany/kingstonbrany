/*
# Create portfolio updates table (single-tenant, no auth)

1. New Tables
- `updates`
- `id` (uuid, primary key)
- `title` (text, not null) — short headline of the update
- `body` (text, not null) — the update content
- `created_at` (timestamptz, defaults to now)
2. Security
- Enable RLS on `updates`.
- Allow anon + authenticated CRUD because this is a single-tenant portfolio with no sign-in.
*/

CREATE TABLE IF NOT EXISTS updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_updates" ON updates;
CREATE POLICY "anon_select_updates" ON updates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_updates" ON updates;
CREATE POLICY "anon_insert_updates" ON updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_updates" ON updates;
CREATE POLICY "anon_update_updates" ON updates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_updates" ON updates;
CREATE POLICY "anon_delete_updates" ON updates FOR DELETE
  TO anon, authenticated USING (true);
