/* שליחת פנייה מהטופס במייל. פונקציית Vercel בלי תלויות. נשלח דרך Resend.
   משתני סביבה (מוגדרים ב-Vercel, לא בקוד):
   RESEND_API_KEY  מפתח ה-API של Resend
   CONTACT_TO      כתובת המייל שאליה מגיעות הפניות
   CONTACT_FROM    (אופציונלי) שולח, למשל "Sara Ankava <hello@yourdomain.com>". ברירת מחדל: onboarding@resend.dev */
const hits = new Map();
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okOrigin = o => !o || /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/.test(o) || /^https:\/\/(www\.)?sarankava\.com$/.test(o) || /^http:\/\/localhost(:\d+)?$/.test(o);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  if (!okOrigin(req.headers.origin)) return res.status(403).json({ ok: false });
  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO;
  if (!key || !to) return res.status(503).json({ ok: false, error: 'not_configured' });

  const ip = clean((req.headers['x-forwarded-for'] || '').split(',')[0], 64) || 'x', now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ ok: false, error: 'rate' });
  recent.push(now); hits.set(ip, recent);

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true });           // מלכודת בוטים
  if (Number(b.t) < 2000) return res.status(400).json({ ok: false });   // נשלח מהר מדי
  const name = clean(b.name, 80), phone = clean(b.phone, 30), about = clean(b.about, 200), pains = clean(b.pains, 400);
  if (name.length < 2 || !/^(0\d{8,9}|\+?972\d{8,9})$/.test(phone.replace(/[\s-]/g, '')) || b.consent !== true) return res.status(400).json({ ok: false, error: 'invalid' });

  const rows = [['שם', name], ['טלפון', phone], ['העסק', about || '(לא צוין)'], ['מה שמוכר', pains || '(לא צוין)']];
  const text = rows.map(r => r[0] + ': ' + r[1]).join('\n') + '\n\nנשלח מהאתר ב-' + new Date().toISOString();
  const html = '<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6"><h2 style="margin:0 0 12px">פנייה חדשה מהאתר</h2>' +
    rows.map(r => '<p style="margin:0 0 6px"><b>' + r[0] + ':</b> ' + esc(r[1]) + '</p>').join('') + '</div>';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.CONTACT_FROM || 'Sara Ankava Site <onboarding@resend.dev>', to: [to], subject: 'פנייה חדשה מהאתר: ' + name, text, html })
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'send_failed' });
    return res.status(200).json({ ok: true });
  } catch (e) { return res.status(502).json({ ok: false, error: 'send_failed' }); }
};
