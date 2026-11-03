-- ניהול פרויקטים: הצגה בדף הבית, כרטיס "הפרויקט הבא שלכם" כרשומה, ומוקאפ מובנה.
-- כבר הורץ על המסד (sara-ankava-site). בטוח להרצה חוזרת.
alter table public.projects add column if not exists show_on_home boolean not null default false;
alter table public.projects add column if not exists is_placeholder boolean not null default false;
alter table public.projects add column if not exists mockup_key text check (mockup_key in ('gan'));
create index if not exists projects_home_idx on public.projects (position) where published = true and show_on_home = true;

-- זריעה ראשונית רק כשהטבלה ריקה: שלושת הפריטים שהיו בקוד.
insert into public.projects (title, type, description, link, desktop_image_url, mobile_image_url, mockup_key, is_concept, is_placeholder, show_on_home, published, position)
select * from (values
  ('רפאל אנקוה סת״ם', 'WEBSITE · CATALOG · WHATSAPP', 'סופר סת״ם שענה על אותן שאלות שוב ושוב בטלפון. עכשיו הלקוחות רואים את המוצרים, בוחרים ושואלים בהודעה אחת.', 'https://refael-ankava.com/', 'assets/img/refael-desktop.jpg', 'assets/img/refael-mobile.jpg', null, false, false, true, true, 0),
  ('סטודיו לפרחים', 'CONCEPT · ORDERS · DASHBOARD', 'הזמנות שמגיעות בוואטסאפ, בטלפון ובהודעות, ועכשיו הכול על מסך אחד: מי הזמין, מה, ומתי לספק. קונספט שבניתי כדי להראות איך נראה סדר.', '/projects', null, null, 'gan', true, false, true, true, 1),
  ('הפרויקט הבא שלכם', null, 'יש לכם עסק שגדל? נתחיל מלהבין איפה הוא מאבד לקוחות.', '#contact', null, null, null, false, true, true, true, 2)
) as v(title, type, description, link, desktop_image_url, mobile_image_url, mockup_key, is_concept, is_placeholder, show_on_home, published, position)
where not exists (select 1 from public.projects);
