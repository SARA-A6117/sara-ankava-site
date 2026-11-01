-- Sara Ankava admin: tables, RLS, storage. The authorized admin is enforced in the database (JWT email).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  type text check (char_length(type) <= 200),
  description text check (char_length(description) <= 2000),
  desktop_image_url text,
  mobile_image_url text,
  link text check (char_length(link) <= 500),
  is_concept boolean not null default false,
  position integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  business text check (char_length(business) <= 300),
  phone text not null check (char_length(phone) between 5 and 30),
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  created_at timestamptz not null default now()
);

create index if not exists projects_position_idx on public.projects (position);
create index if not exists leads_created_idx on public.leads (created_at desc);

alter table public.projects enable row level security;
alter table public.leads enable row level security;

-- helper expression: the only authorized admin
create or replace function public.is_site_admin() returns boolean
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ankavagrafi@gmail.com'
$$;

-- projects
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated using (published = true);

drop policy if exists projects_admin_select on public.projects;
create policy projects_admin_select on public.projects
  for select to authenticated using (public.is_site_admin());

drop policy if exists projects_admin_insert on public.projects;
create policy projects_admin_insert on public.projects
  for insert to authenticated with check (public.is_site_admin());

drop policy if exists projects_admin_update on public.projects;
create policy projects_admin_update on public.projects
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists projects_admin_delete on public.projects;
create policy projects_admin_delete on public.projects
  for delete to authenticated using (public.is_site_admin());

-- leads: public insert only; admin read/update
revoke all on public.leads from anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;

drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists leads_admin_select on public.leads;
create policy leads_admin_select on public.leads
  for select to authenticated using (public.is_site_admin());

drop policy if exists leads_admin_update on public.leads;
create policy leads_admin_update on public.leads
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

-- storage: public bucket for project images, writes only for the admin
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists project_images_admin_insert on storage.objects;
create policy project_images_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'project-images' and public.is_site_admin());

drop policy if exists project_images_admin_update on storage.objects;
create policy project_images_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'project-images' and public.is_site_admin())
  with check (bucket_id = 'project-images' and public.is_site_admin());

drop policy if exists project_images_admin_delete on storage.objects;
create policy project_images_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'project-images' and public.is_site_admin());

drop policy if exists project_images_admin_select on storage.objects;
create policy project_images_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'project-images' and public.is_site_admin());
