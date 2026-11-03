# מערכת הניהול והלידים: מה כבר הוקם ומה נשאר (פרויקט xghdcavsjnucawnpzprk)

## כבר הוקם (אוטומטית)
- טבלאות, RLS, אחסון תמונות (001), לידים ושמירה מפני ספאם וטריגר מייל (002), סוד פנימי ב-Vault ופונקציית אימות (003).
- Edge Function `notify-lead` פרוסה. הסוד הפנימי שבין הטריגר לפונקציה נוצר אקראית בתוך מסד הנתונים ולא עובר דרך אף אחד.
- האתר מחובר ל-Supabase (`assets/js/admin-config.js`: כתובת ו-anon key ציבורי בלבד).

## מה נשאר לך (שלוש פעולות, בלי להדביק כלום בצ'אט)
1. **מפתח Resend** (בשביל המייל):
   - נרשמים ב-https://resend.com עם **ankavagrafi@gmail.com**.
   - https://resend.com/api-keys , Create API Key , הרשאה Sending access, מעתיקים.
   - מדביקים ב-Supabase: https://supabase.com/dashboard/project/xghdcavsjnucawnpzprk/functions/secrets , Add new secret, שם `RESEND_API_KEY`, ערך המפתח.
2. **התחברות עם Google:**
   - https://console.cloud.google.com/apis/credentials , Create credentials , OAuth client ID , Web application.
   - Authorized redirect URI: `https://xghdcavsjnucawnpzprk.supabase.co/auth/v1/callback`
   - מדביקים Client ID ו-Client secret ב-https://supabase.com/dashboard/project/xghdcavsjnucawnpzprk/auth/providers , Google , Enable.
   - באותו מסך: Email , מכבים (Disable), כדי שלא תהיה כניסה בסיסמה.
3. **כתובות האתר:** https://supabase.com/dashboard/project/xghdcavsjnucawnpzprk/auth/url-configuration
   - Site URL: `https://sara-ankava-site.vercel.app`
   - Redirect URLs: `https://sara-ankava-site.vercel.app/admin`

## בדיקה
1. https://sara-ankava-site.vercel.app/admin , התחברות עם ankavagrafi@gmail.com. כל כתובת אחרת מתנתקת עם "אין הרשאה".
2. ממלאים את הטופס באתר: הליד מופיע ב-/admin ומגיע מייל.
