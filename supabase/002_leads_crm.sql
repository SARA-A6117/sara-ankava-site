-- Leads CRM: extra columns, column-level insert grant, spam guard (honeypot + rate limit), email notification trigger.
-- Safe to run more than once.

alter table public.leads add column if not exists email text check (char_length(email) <= 200);
alter table public.leads add column if not exists message text check (char_length(message) <= 2000);
alter table public.leads add column if not exists note text check (char_length(note) <= 2000);
alter table public.leads add column if not exists hp text;          -- honeypot (always cleared by the trigger)
alter table public.leads add column if not exists ip_hash text;     -- hashed IP, only for rate limiting

-- Visitors may insert only these columns (no status, note, id, created_at, ip_hash).
revoke insert on public.leads from anon, authenticated;
grant insert (name, business, phone, email, message, hp) on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;

-- RLS: open insert for everyone, read and update only for the admin.
alter table public.leads enable row level security;
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads for insert to anon, authenticated with check (status = 'new');
drop policy if exists leads_admin_select on public.leads;
create policy leads_admin_select on public.leads for select to authenticated using (public.is_site_admin());
drop policy if exists leads_admin_update on public.leads;
create policy leads_admin_update on public.leads for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

-- Spam guard: honeypot must be empty, max 5 leads per 10 minutes per IP.
create or replace function public.leads_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h json; ip text; n int;
begin
  if coalesce(new.hp, '') <> '' then raise exception 'spam'; end if;
  new.hp := null;
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  ip := coalesce(nullif(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), ''), h ->> 'cf-connecting-ip', 'unknown');
  new.ip_hash := md5(ip || ':sa-leads');
  select count(*) into n from public.leads where ip_hash = new.ip_hash and created_at > now() - interval '10 minutes';
  if n >= 5 then raise exception 'rate_limited'; end if;
  new.status := 'new';
  new.created_at := now();
  return new;
end $$;
drop trigger if exists leads_guard_bi on public.leads;
create trigger leads_guard_bi before insert on public.leads for each row execute function public.leads_guard();

-- Email notification: after every new lead, call the notify-lead Edge Function (async, never blocks or fails the insert).
create extension if not exists pg_net with schema extensions;
create or replace function public.leads_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare secret text; base text;
begin
  begin
    select decrypted_secret into secret from vault.decrypted_secrets where name = 'lead_webhook_secret' limit 1;
    select decrypted_secret into base from vault.decrypted_secrets where name = 'project_url' limit 1;
    if secret is not null and base is not null then
      perform net.http_post(
        url := base || '/functions/v1/notify-lead',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
        body := jsonb_build_object('id', new.id, 'name', new.name, 'phone', new.phone, 'email', new.email, 'business', new.business, 'message', new.message, 'created_at', new.created_at),
        timeout_milliseconds := 5000
      );
    end if;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists leads_notify_ai on public.leads;
create trigger leads_notify_ai after insert on public.leads for each row execute function public.leads_notify();
