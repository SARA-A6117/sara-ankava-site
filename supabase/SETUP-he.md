# הקמת מערכת הניהול והלידים: צעדים (בעברית)

הקוד מוכן. כדי שיעבוד צריך שלושה חיבורים שרק את יכולה לעשות. את המפתחות מזינים רק בלוח הבקרה של Supabase, לא בצ'אט ולא בקוד.

## 1. פרויקט Supabase
1. נכנסים ל-https://supabase.com/dashboard ומתחברים.
2. New project. שם: `sara-ankava-site`. אזור: Frankfurt (eu-central-1). מגדירים סיסמת מסד נתונים ושומרים אותה אצלך.
3. אחרי שהפרויקט עלה, מעדכנים אותי ("הפרויקט מוכן"), ואני מריץ את הטבלאות, ה-RLS והפונקציה ומחבר את האתר.

## 2. התחברות עם Google (OAuth)
1. https://console.cloud.google.com ופרויקט חדש. APIs & Services, OAuth consent screen: External, שם האפליקציה, מייל ankavagrafi@gmail.com.
2. Credentials, Create credentials, OAuth client ID, Web application.
   - Authorized redirect URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback` (ה-REF מופיע ב-Supabase, Project Settings).
3. מעתיקים Client ID ו-Client secret, ובתוך Supabase: Authentication, Sign In / Providers, Google, מדביקים שם (רק שם) ומפעילים.
4. Authentication, URL Configuration: Site URL `https://sara-ankava-site.vercel.app`, ו-Redirect URLs: `https://sara-ankava-site.vercel.app/admin`.

## 3. מייל על כל פנייה (Resend)
1. https://resend.com, Sign up עם **ankavagrafi@gmail.com** (חשוב: עם המייל הזה, כדי שהשולח הניסיוני `onboarding@resend.dev` יוכל לשלוח אלייך).
2. API Keys, Create API Key, הרשאה Sending access. מעתיקים את המפתח (מוצג פעם אחת).
3. ב-Supabase: Edge Functions, Secrets (או Project Settings, Edge Functions). מוסיפים שני סודות:
   - `RESEND_API_KEY` = המפתח מ-Resend.
   - `LEAD_WEBHOOK_SECRET` = מחרוזת אקראית ארוכה שאת בוחרת (למשל 40 תווים).
4. ב-SQL Editor של Supabase מריצים שורה אחת, עם **אותה** מחרוזת אקראית (לא מדביקים בצ'אט):
   `select vault.create_secret('המחרוזת-האקראית-שבחרת', 'lead_webhook_secret');`
   את הכתובת של הפרויקט (`project_url`) אני מוסיפה אחרי שהפרויקט קיים.
5. אם יש לך דומיין ב-Resend שאומת, אפשר להוסיף סוד `RESEND_FROM` (למשל `Sara Ankava <hello@הדומיין-שלך>`).

## בדיקה
1. נכנסים ל-https://sara-ankava-site.vercel.app/admin, מתחברים עם ankavagrafi@gmail.com. כל כתובת אחרת מתנתקת עם "אין הרשאה".
2. ממלאים את הטופס באתר, ומוודאים שמופיע ליד ב-/admin ושהגיע מייל.
