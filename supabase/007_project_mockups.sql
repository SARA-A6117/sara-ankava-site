-- עד שני מוקאפים לפרויקט (כל אחד: דסקטופ ומובייל, תמונה או סרטון גלילה), מתחלפים כל N שניות.
-- mockups: [{"desktop":{"type":"image|video","url":"..."},"mobile":{"type":"image|video","url":"..."}}, ...]
alter table public.projects add column if not exists mockups jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists mockup_interval int not null default 5;
alter table public.projects drop constraint if exists projects_mockups_check;
alter table public.projects add constraint projects_mockups_check check (jsonb_typeof(mockups) = 'array' and jsonb_array_length(mockups) <= 2);
alter table public.projects drop constraint if exists projects_mockup_interval_check;
alter table public.projects add constraint projects_mockup_interval_check check (mockup_interval between 2 and 60);
update public.projects
set mockups = jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
  'desktop', case when desktop_image_url is not null then jsonb_build_object('type','image','url',desktop_image_url) end,
  'mobile',  case when mobile_image_url  is not null then jsonb_build_object('type','image','url',mobile_image_url)  end)))
where mockups = '[]'::jsonb and (desktop_image_url is not null or mobile_image_url is not null);
-- הסרטונים נשמרים באותו באקט: עד 25MB, mp4 או webm.
update storage.buckets set file_size_limit = 26214400, allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'] where id = 'project-images';
