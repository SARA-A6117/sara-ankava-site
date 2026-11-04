-- שמירת טיוטה (עמודה draft) לא מעדכנת את "עודכן לאחרונה" שמוצג באתר. רק שינוי בתוכן המפורסם (title, lead, content) מעדכן.
create or replace function public.pages_touch() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.content is distinct from old.content or new.title is distinct from old.title or new.lead is distinct from old.lead then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end $$;
