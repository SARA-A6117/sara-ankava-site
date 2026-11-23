-- העורך העיצובי (ענף design-editor): שינויי עיצוב לפי אלמנט. props = המפורסם (ציבורי), draft = טיוטה (פרטית).
-- הערכים עצמם מנוקים ונבדקים בזמן הבנייה (tools/design.js): רק תכונות וערכים מהרשימה הלבנה נכנסים ל-CSS.
create table if not exists public.design_overrides (
  el text primary key check (el ~ '^[a-z0-9._-]{2,90}$'),
  props jsonb not null default '{}'::jsonb check (jsonb_typeof(props) = 'object' and length(props::text) < 4000),
  draft jsonb check (draft is null or (jsonb_typeof(draft) = 'object' and length(draft::text) < 4000)),
  revision int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.design_overrides enable row level security;
revoke all on public.design_overrides from anon, authenticated;
grant select (el, props) on public.design_overrides to anon;
grant select, insert, update, delete on public.design_overrides to authenticated;
drop policy if exists design_public_read on public.design_overrides;
create policy design_public_read on public.design_overrides for select to anon using (props <> '{}'::jsonb);
drop policy if exists design_admin_all on public.design_overrides;
create policy design_admin_all on public.design_overrides for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create or replace function public.design_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists design_touch on public.design_overrides;
create trigger design_touch before insert or update on public.design_overrides for each row execute function public.design_touch();
-- היסטוריית גרסאות גם לעיצוב
alter table public.revisions drop constraint if exists revisions_entity_check;
alter table public.revisions add constraint revisions_entity_check check (entity in ('page', 'text', 'design'));
