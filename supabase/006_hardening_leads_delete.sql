-- הקשחה אחרי בדיקת האבטחה: IP מהכותרת של Cloudflare (לא ניתנת לזיוף) לפני x-forwarded-for, תקרה יומית כללית,
-- דילוג על מייל התראה בהצפה, מחיקת לידים למנהלת בלבד, ואילוץ על שדה הקישור של פרויקטים.
create or replace function public.leads_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare h json; ip text; n int; d int;
begin
  if coalesce(new.hp, '') <> '' then raise exception 'spam'; end if;
  new.hp := null;
  begin h := current_setting('request.headers', true)::json; exception when others then h := null; end;
  ip := coalesce(nullif(h ->> 'cf-connecting-ip', ''), nullif(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), ''), 'unknown');
  new.ip_hash := md5(ip || ':sa-leads');
  select count(*) into n from public.leads where ip_hash = new.ip_hash and created_at > now() - interval '10 minutes';
  if n >= 5 then raise exception 'rate_limited'; end if;
  select count(*) into d from public.leads where created_at > now() - interval '24 hours';
  if d >= 60 then raise exception 'rate_limited'; end if;
  new.status := 'new';
  new.created_at := now();
  return new;
end $$;

create or replace function public.leads_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
declare secret text; base text; h int;
begin
  begin
    select count(*) into h from public.leads where created_at > now() - interval '1 hour';
    if h > 15 then return new; end if;
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

grant delete on public.leads to authenticated;
drop policy if exists leads_admin_delete on public.leads;
create policy leads_admin_delete on public.leads for delete to authenticated using (public.is_site_admin());

alter table public.projects drop constraint if exists projects_link_check;
alter table public.projects add constraint projects_link_check check (link is null or link ~* '^(https?://|/|#)');
