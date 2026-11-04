-- שלב 2 של מערכת הניהול החדשה (ענף admin-editor): טקסטי האתר, היסטוריית גרסאות וטיוטה לעמודים משפטיים.
-- אדיטיבי בלבד: לא מוחק ולא משנה נתונים קיימים. בטוח להרצה חוזרת.

-- עמודים משפטיים: טיוטה ומספר גרסה (האתר ממשיך לקרוא את content, כלומר את המפורסם)
alter table public.pages add column if not exists draft jsonb;
alter table public.pages add column if not exists revision int not null default 0;

-- טקסטי האתר: value = מפורסם (ציבורי), draft = טיוטה (פרטית)
create table if not exists public.site_texts (
  key text primary key check (key ~ '^[a-z0-9._-]{3,80}$'),
  kind text not null default 'text' check (kind in ('text', 'longtext', 'rich')),
  value text check (char_length(value) <= 5000),
  draft text check (char_length(draft) <= 5000),
  revision int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_texts enable row level security;
revoke all on public.site_texts from anon, authenticated;
-- הציבור קורא רק את העמודות key, kind, value של טקסטים מפורסמים. העמודה draft לא נגישה לו בכלל.
grant select (key, kind, value) on public.site_texts to anon;
grant select, insert, update, delete on public.site_texts to authenticated;
drop policy if exists site_texts_public_read on public.site_texts;
create policy site_texts_public_read on public.site_texts for select to anon using (value is not null);
drop policy if exists site_texts_admin_all on public.site_texts;
create policy site_texts_admin_all on public.site_texts for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create or replace function public.site_texts_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists site_texts_touch on public.site_texts;
create trigger site_texts_touch before insert or update on public.site_texts for each row execute function public.site_texts_touch();

-- היסטוריית גרסאות (עד 20 לכל פריט) לעמודים משפטיים ולטקסטים. פרטית לגמרי.
create table if not exists public.revisions (
  id bigserial primary key,
  entity text not null check (entity in ('page', 'text')),
  ref text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists revisions_ref_idx on public.revisions (entity, ref, created_at desc);
alter table public.revisions enable row level security;
revoke all on public.revisions from anon, authenticated;
grant select, insert, delete on public.revisions to authenticated;
grant usage, select on sequence public.revisions_id_seq to authenticated;
drop policy if exists revisions_admin_all on public.revisions;
create policy revisions_admin_all on public.revisions for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create or replace function public.revisions_trim() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.revisions r
  where r.entity = new.entity and r.ref = new.ref
    and r.id not in (select id from public.revisions where entity = new.entity and ref = new.ref order by created_at desc, id desc limit 20);
  return null;
end $$;
drop trigger if exists revisions_trim_ai on public.revisions;
create trigger revisions_trim_ai after insert on public.revisions for each row execute function public.revisions_trim();
