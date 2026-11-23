-- תיקון אבטחה: עמודת draft ב-pages לא נגישה לציבור. הרשאת הקריאה הרחבה מ-005 חלה אוטומטית גם על עמודות חדשות,
-- לכן מחליפים אותה בהרשאה ברמת עמודה. הציבור קורא רק את המפורסם; draft ו-revision רק למחוברות (RLS ממשיך לחסום כתיבה למי שאינה המנהלת).
revoke select on public.pages from anon, authenticated;
grant select (slug, title, lead, content, updated_at) on public.pages to anon, authenticated;
grant select (draft, revision) on public.pages to authenticated;
