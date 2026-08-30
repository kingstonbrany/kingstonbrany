/*
# Add image_url column to updates table

1. Modified Tables
- `updates`
- Add `image_url` (text, nullable) — public URL of an attached image in the update-images storage bucket.
2. Security
- No policy changes. Existing anon+authenticated CRUD policies already cover the new column.
*/

ALTER TABLE updates ADD COLUMN IF NOT EXISTS image_url text;
