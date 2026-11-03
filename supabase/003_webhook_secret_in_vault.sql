-- project_url (not secret) and a random webhook secret generated inside the database (never leaves it).
select vault.create_secret('https://xghdcavsjnucawnpzprk.supabase.co', 'project_url')
where not exists (select 1 from vault.decrypted_secrets where name = 'project_url');
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'lead_webhook_secret')
where not exists (select 1 from vault.decrypted_secrets where name = 'lead_webhook_secret');

-- The Edge Function verifies the incoming secret through this function, so the secret never has to be copied anywhere.
create or replace function public.check_lead_webhook(p_secret text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'lead_webhook_secret' and decrypted_secret = p_secret and p_secret <> '')
$$;
revoke all on function public.check_lead_webhook(text) from public;
grant execute on function public.check_lead_webhook(text) to anon;
