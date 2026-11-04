/* פרסום האתר: מפעיל בנייה מחדש ב-Vercel (Deploy Hook) אחרי שמירה במערכת הניהול.
   רק ankavagrafi@gmail.com (מאומת מול Supabase) יכולה להפעיל. ה-Hook לא נחשף לדפדפן.
   משתני סביבה (ב-Vercel, לא בקוד): SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, VERCEL_DEPLOY_HOOK_URL */
let last = 0;   /* הגבלת קצב פשוטה: לא יותר מבנייה אחת ב-30 שניות לכל מופע */

module.exports = async (req, res) => {
  const send = (code, body) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: 'method_not_allowed' }); }
  const { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_EMAIL, VERCEL_DEPLOY_HOOK_URL } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !VERCEL_DEPLOY_HOOK_URL) return send(503, { error: 'not_configured' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return send(401, { error: 'unauthorized' });
  let user = null;
  try {
    const r = await fetch(SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/user', { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token } });
    if (!r.ok) return send(401, { error: 'unauthorized' });
    user = await r.json();
  } catch (e) { return send(502, { error: 'auth_unreachable' }); }
  const email = String((user && user.email) || '').toLowerCase();
  if (!user || email !== String(ADMIN_EMAIL).toLowerCase() || !user.email_confirmed_at) return send(403, { error: 'forbidden' });
  const now = Date.now();
  if (now - last < 30000) return send(429, { error: 'too_soon', retryAfterSeconds: Math.ceil((30000 - (now - last)) / 1000) });
  try {
    const h = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
    if (!h.ok) return send(502, { error: 'hook_failed' });
  } catch (e) { return send(502, { error: 'hook_unreachable' }); }
  last = now;
  return send(200, { ok: true });
};
