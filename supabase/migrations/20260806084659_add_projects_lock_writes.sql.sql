/*
# Add projects table, lock down writes to authenticated only

1. New Table
- `projects` — stores GitHub project cards shown on the Projects page.
  - id (uuid PK)
  - title (text, not null)
  - description (text)
  - repo_url (text, not null) — link to the GitHub repo
  - demo_url (text) — optional live demo link
  - tech_tags (text[]) — optional list of technologies
  - sort_order (int, default 0) — manual ordering
  - created_at (timestamptz)

2. Security changes
- `projects`: SELECT open to anon + authenticated (public viewing).
  INSERT/UPDATE/DELETE restricted to authenticated (admin only).
- `updates`: tighten INSERT/UPDATE/DELETE from anon+authenticated to
  authenticated only. SELECT stays anon+authenticated so visitors can
  read updates, but only the logged-in admin can post/edit/delete.
- `profile`: tighten INSERT/UPDATE/DELETE from anon+authenticated to
  authenticated only. SELECT stays anon+authenticated.
- `storage.objects` in the `update-images` bucket: tighten INSERT/UPDATE/DELETE
  from anon+authenticated to authenticated only. SELECT stays anon+authenticated
  so public image URLs still resolve for visitors.

3. Important notes
- The admin logs in via Supabase email/password auth. Writes now require
  an authenticated session, so the anon-key visitor can read everything
  but change nothing.
- No user_id column is needed on updates/projects/profile because this is
  a single-admin app — any authenticated user IS the admin.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  repo_url text NOT NULL,
  demo_url text,
  tech_tags text[] DEFAULT '{}',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_all" ON projects;
CREATE POLICY "projects_select_all" ON projects
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert_auth" ON projects;
CREATE POLICY "projects_insert_auth" ON projects
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projects_update_auth" ON projects;
CREATE POLICY "projects_update_auth" ON projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "projects_delete_auth" ON projects;
CREATE POLICY "projects_delete_auth" ON projects
  FOR DELETE TO authenticated USING (true);

-- Tighten updates table: writes to authenticated only
DROP POLICY IF EXISTS "anon_insert_updates" ON updates;
CREATE POLICY "auth_insert_updates" ON updates
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_updates" ON updates;
CREATE POLICY "auth_update_updates" ON updates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_updates" ON updates;
CREATE POLICY "auth_delete_updates" ON updates
  FOR DELETE TO authenticated USING (true);

-- Tighten profile table: writes to authenticated only
DROP POLICY IF EXISTS "profile_insert_all" ON profile;
CREATE POLICY "profile_insert_auth" ON profile
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profile_update_all" ON profile;
CREATE POLICY "profile_update_auth" ON profile
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profile_delete_all" ON profile;
CREATE POLICY "profile_delete_auth" ON profile
  FOR DELETE TO authenticated USING (true);

-- Tighten storage: writes to authenticated only in update-images bucket
DROP POLICY IF EXISTS "anon_insert_update_images" ON storage.objects;
CREATE POLICY "auth_insert_update_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'update-images');

DROP POLICY IF EXISTS "anon_update_update_images" ON storage.objects;
CREATE POLICY "auth_update_update_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'update-images') WITH CHECK (bucket_id = 'update-images');

DROP POLICY IF EXISTS "anon_delete_update_images" ON storage.objects;
CREATE POLICY "auth_delete_update_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'update-images');
