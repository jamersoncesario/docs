-- Create storage buckets
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false),
       ('pops', 'pops', false)
on conflict do nothing;

-- Documents bucket: users can only access their own folder
create policy "Users upload own documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- POPs bucket: all authenticated users can read and upload
create policy "Authenticated users read pops storage"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pops');

create policy "Authenticated users upload pops"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pops');

create policy "Authenticated users delete pops"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pops');
