-- עמודים משפטיים (privacy, terms, accessibility) לעריכה מ-/admin. כבר הורץ על המסד. קריאה ציבורית, כתיבה רק למנהלת.
create table if not exists public.pages (
  slug text primary key check (slug in ('privacy','terms','accessibility')),
  title text not null,
  lead text,
  content text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.pages enable row level security;
drop policy if exists pages_read on public.pages;
create policy pages_read on public.pages for select to anon, authenticated using (true);
drop policy if exists pages_admin_ins on public.pages;
create policy pages_admin_ins on public.pages for insert to authenticated with check (public.is_site_admin());
drop policy if exists pages_admin_upd on public.pages;
create policy pages_admin_upd on public.pages for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
drop policy if exists pages_admin_del on public.pages;
create policy pages_admin_del on public.pages for delete to authenticated using (public.is_site_admin());
revoke all on public.pages from anon, authenticated;
grant select on public.pages to anon, authenticated;
grant insert, update, delete on public.pages to authenticated;
create or replace function public.pages_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before insert or update on public.pages for each row execute function public.pages_touch();
-- התוכן ההתחלתי נטען מהעמודים הקיימים (לא כלול כאן). אם השורה חסרה, /admin שולף את התוכן מהקוד ושמירה מכניסה אותו למסד.
