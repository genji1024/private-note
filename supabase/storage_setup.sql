-- Supabase Storage setup for image uploads
-- Run in Supabase Dashboard > Storage or SQL Editor

-- Create 'images' bucket if not exists (public)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload/read
-- Allow public read
create policy "Public read access for images bucket"
  on storage.objects for select
  using (bucket_id = 'images');

-- Allow authenticated users to upload
create policy "Authenticated upload for images bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

-- Allow authenticated users to update their own files
create policy "Users update own images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());

-- Allow authenticated users to delete their own files
create policy "Users delete own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());
