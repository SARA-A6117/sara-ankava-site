// Sends an email to the site owner for every new lead. Called by the database trigger (public.leads_notify).
// Secrets (Supabase > Edge Functions > Secrets, never in the repo): RESEND_API_KEY, LEAD_WEBHOOK_SECRET. Optional: RESEND_FROM, ADMIN_URL.
const TO = 'ankavagrafi@gmail.com';
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const same = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const secret = Deno.env.get('LEAD_WEBHOOK_SECRET') ?? '';
  const got = req.headers.get('x-webhook-secret') ?? '';
  if (!secret || !same(secret, got)) return new Response('unauthorized', { status: 401 });

  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return new Response('resend not configured', { status: 503 });
  let l: Record<string, unknown> = {};
  try { l = await req.json(); } catch (_) { return new Response('bad request', { status: 400 }); }

  const admin = Deno.env.get('ADMIN_URL') ?? 'https://sara-ankava-site.vercel.app/admin';
  const rows: [string, unknown][] = [['שם', l.name], ['טלפון', l.phone], ['מייל', l.email || '(לא צוין)'], ['העסק', l.business || '(לא צוין)'], ['הודעה', l.message || '(לא צוינה)']];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nלידים באתר: ${admin}`;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6"><h2 style="margin:0 0 12px">פנייה חדשה מהאתר</h2>` +
    rows.map(([k, v]) => `<p style="margin:0 0 6px"><b>${k}:</b> ${esc(v)}</p>`).join('') +
    `<p style="margin:18px 0 0"><a href="${esc(admin)}">לכל הפניות במערכת הניהול</a></p></div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('RESEND_FROM') ?? 'Sara Ankava Site <onboarding@resend.dev>', to: [TO], subject: `פנייה חדשה מהאתר: ${String(l.name ?? '')}`.slice(0, 150), text, html }),
  });
  return new Response(r.ok ? 'ok' : 'send_failed', { status: r.ok ? 200 : 502 });
});
