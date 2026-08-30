/*
# Create profile table for single-tenant profile image

1. New Table
- `profile` — stores a single profile image URL for the portfolio owner.
2. Security
- Enable RLS.
- Allow anon + authenticated to SELECT (public view of profile pic).
- Allow anon + authenticated to INSERT/UPDATE/DELETE (no auth screen in this app).
*/

CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_select_all" ON profile;
CREATE POLICY "profile_select_all" ON profile
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profile_insert_all" ON profile;
CREATE POLICY "profile_insert_all" ON profile
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "profile_update_all" ON profile;
CREATE POLICY "profile_update_all" ON profile
  FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profile_delete_all" ON profile;
CREATE POLICY "profile_delete_all" ON profile
  FOR DELETE TO anon, authenticated
  USING (true);
