
-- Run this in Supabase SQL Editor

-- 1. Applications table
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  full_name text not null,
  purok text not null,
  school text not null,
  year_level text not null,
  contact text not null,
  cert_url text,
  coe_url text,
  cert_name text,
  coe_name text,
  status text default 'Submitted',
  history jsonb default '[{"status":"Submitted"}]',
  created_at timestamp with time zone default now()
);

-- Enable RLS but allow anon for demo (lock down later)
alter table applications enable row level security;
create policy "Allow all for anon" on applications for all using (true) with check (true);

-- 2. Storage bucket for docs
insert into storage.buckets (id, name, public) values ('scholar-docs', 'scholar-docs', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public read" on storage.objects for select using (bucket_id='scholar-docs');
create policy "Allow upload" on storage.objects for insert with check (bucket_id='scholar-docs');
create policy "Allow update" on storage.objects for update using (bucket_id='scholar-docs');
create policy "Allow delete" on storage.objects for delete using (bucket_id='scholar-docs');
