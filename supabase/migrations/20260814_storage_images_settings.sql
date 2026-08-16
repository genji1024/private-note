-- Storage settings for the 'images' bucket with size + MIME limits
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Allow public read
drop policy if exists "Public read access for images bucket" on storage.objects;
create policy "Public read access for images bucket"
  on storage.objects for select
  using (bucket_id = 'images');

-- Allow authenticated users to upload
drop policy if exists "Authenticated upload for images bucket" on storage.objects;
create policy "Authenticated upload for images bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

-- Allow authenticated users to update their own files
drop policy if exists "Users update own images" on storage.objects;
create policy "Users update own images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());

-- Allow authenticated users to delete their own files
drop policy if exists "Users delete own images" on storage.objects;
create policy "Users delete own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());
