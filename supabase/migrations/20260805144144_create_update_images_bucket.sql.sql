/*
# Create storage bucket and policies for update images (single-tenant, no auth)

1. Storage
- Create public bucket `update-images` for portfolio update images.
- 2MB max file size, allowed mime types: jpg, png, webp, gif.
2. Security
- Enable public read (anyone can view images).
- Allow anon + authenticated to upload/update/delete in this bucket.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'update-images',
  'update-images',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_update_images" ON storage.objects;
CREATE POLICY "anon_select_update_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'update-images');

DROP POLICY IF EXISTS "anon_insert_update_images" ON storage.objects;
CREATE POLICY "anon_insert_update_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'update-images');

DROP POLICY IF EXISTS "anon_update_update_images" ON storage.objects;
CREATE POLICY "anon_update_update_images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'update-images') WITH CHECK (bucket_id = 'update-images');

DROP POLICY IF EXISTS "anon_delete_update_images" ON storage.objects;
CREATE POLICY "anon_delete_update_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'update-images');
