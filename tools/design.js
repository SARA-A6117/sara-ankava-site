/* העורך העיצובי: רשימה לבנה ומחולל overrides.css.
   העורך (ואף אחד אחר) לא יכול לכתוב CSS חופשי: רק התכונות והערכים שמוגדרים כאן נכנסים לקובץ.
   לא קיימת כאן אפשרות לכתוב background, גרדיאנט, position, transform, animation, width/height, z-index וכד'. */
const COLORS = { cream: '#F3EEE2', sand: '#E8DFCB', charcoal: '#1E201F', cobalt: '#1B33C9', 'cobalt-bright': '#2F55E8', yellow: '#FFE66D', cyan: '#6FD0FF', white: '#FFFFFF' };
const SIZES = { 'fs-1': 'var(--fs-1)', 'fs-2': 'var(--fs-2)', 'fs-3': 'var(--fs-3)', 'fs-4': 'var(--fs-4)', 'fs-5': 'var(--fs-5)', 'fs-mega': 'var(--fs-mega)' };
const WEIGHTS = [300, 400, 500, 700, 900];
const SPACES = { none: '0', inner: 'var(--sp-inner)', group: 'var(--sp-group)', section: 'var(--sp-section)', outer: 'var(--sp-outer)' };
const DEVICES = ['base', 'tablet', 'mobile'];
/* נקודות שבירה: טאבלט עד 1024, טלפון עד 900 (כמו באתר). base = מחשב ומעלה, והשאר יורשים ממנו */
const MQ = { base: null, tablet: '(max-width:1024px)', mobile: '(max-width:900px)' };
const HIDE_MQ = { desktop: '(min-width:1025px)', tablet: '(min-width:901px) and (max-width:1024px)', mobile: '(max-width:900px)' };
const PROP_NEEDS = { color: 'color', size: 'size', weight: 'weight', mt: 'space', mb: 'space' };
const EL_RE = /^[a-z0-9._-]{2,90}$/;

/* מנקה אובייקט של אלמנט אחד. מחזיר { props, errors }. ערך אסור נזרק (ונרשם בשגיאות), לא נכנס ל-CSS */
/* ניגודיות WCAG: צבע טקסט חייב לעבור 4.5:1 מול כל רקע אפשרי של האלמנט (node.bg) */
const lum = (hex) => { const c = [1, 3, 5].map((i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const colorOk = (name, node) => !node || !node.bg || node.bg.every((bg) => ratio(COLORS[name], COLORS[bg]) >= 4.5);
/* בגוף טקסט, כותרות ורשימות: לא הקטן ביותר (14px) ולא משקל דק (300) */
const BODYISH = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4']);
const sizeOk = (v, node) => !(node && BODYISH.has(node.tag) && v === 'fs-5');
const weightOk = (v, node) => !(node && BODYISH.has(node.tag) && v === 300);

function normalize(raw, allow, node) {
  const errors = [], out = {}, a = new Set(allow || []);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { props: {}, errors: ['props is not an object'] };
  for (const k of Object.keys(raw)) {
    if (k === 'hide') continue;
    if (!DEVICES.includes(k)) { errors.push('unknown key ' + k); continue; }
    const d = raw[k], o = {};
    if (!d || typeof d !== 'object' || Array.isArray(d)) { errors.push(k + ' is not an object'); continue; }
    for (const p of Object.keys(d)) {
      const v = d[p];
      if (!Object.prototype.hasOwnProperty.call(PROP_NEEDS, p)) { errors.push('property not allowed: ' + p); continue; }
      if (!a.has(PROP_NEEDS[p])) { errors.push(p + ' not allowed on this element'); continue; }
      if (p === 'color' && Object.prototype.hasOwnProperty.call(COLORS, v)) { if (colorOk(v, node)) o.color = v; else errors.push('low contrast: ' + v); }
      else if (p === 'size' && Object.prototype.hasOwnProperty.call(SIZES, v)) { if (sizeOk(v, node)) o.size = v; else errors.push('size too small for body text: ' + v); }
      else if (p === 'weight' && WEIGHTS.includes(v)) { if (weightOk(v, node)) o.weight = v; else errors.push('weight too thin for body text'); }
      else if ((p === 'mt' || p === 'mb') && Object.prototype.hasOwnProperty.call(SPACES, v)) o[p] = v;
      else errors.push('value not allowed: ' + p + '=' + JSON.stringify(v).slice(0, 30));
    }
    if (Object.keys(o).length) out[k] = o;
  }
  if (raw.hide !== undefined) {
    if (!a.has('hide')) errors.push('hide not allowed on this element');
    else if (raw.hide && typeof raw.hide === 'object' && !Array.isArray(raw.hide)) {
      const h = {}; for (const d of Object.keys(raw.hide)) { const known = Object.prototype.hasOwnProperty.call(HIDE_MQ, d); if (known && raw.hide[d] === true) h[d] = true; else if (!known || raw.hide[d] !== false) errors.push('bad hide ' + d); }
      if (Object.keys(h).length) out.hide = h;
    } else errors.push('hide is not an object');
  }
  return { props: out, errors };
}

function decls(o) {
  const d = [];
  if (o.color) d.push('color:' + COLORS[o.color] + '!important');
  if (o.size) d.push('font-size:' + SIZES[o.size] + '!important');
  if (o.weight) d.push('font-weight:' + o.weight + '!important');
  if (o.mt) d.push('margin-top:' + SPACES[o.mt] + '!important');
  if (o.mb) d.push('margin-bottom:' + SPACES[o.mb] + '!important');
  return d.join(';');
}
/* משקל הסלקטור גבוה בכוונה (שלוש פעמים תכונה) כדי לגבור על כללי !important קיימים ב-CSS של האתר */
const sel = (el) => 'html body [data-el="' + el + '"][data-el="' + el + '"][data-el="' + el + '"]';

/* map: { elKey: rawProps }, treeNodes: Map(elKey -> node{allow,locked}). מחזיר { css, errors:[{el,msg}], applied } */
function generate(map, treeNodes) {
  const rules = { base: [], tablet: [], mobile: [], hide: { desktop: [], tablet: [], mobile: [] } }, errors = []; let applied = 0;
  for (const el of Object.keys(map || {}).sort()) {
    const node = treeNodes.get(el);
    if (!EL_RE.test(el) || !node) { errors.push({ el, msg: 'unknown element' }); continue; }
    if (node.locked) { errors.push({ el, msg: 'locked element (' + node.locked + ')' }); continue; }
    const r = normalize(map[el], node.allow, node);
    r.errors.forEach((m) => errors.push({ el, msg: m }));
    for (const d of DEVICES) if (r.props[d]) { const x = decls(r.props[d]); if (x) rules[d].push(sel(el) + '{' + x + '}'); }
    if (r.props.hide) for (const d of Object.keys(r.props.hide)) rules.hide[d].push(sel(el) + '{display:none!important}');
    if (Object.keys(r.props).length) applied++;
  }
  let css = '/* overrides.css: נוצר אוטומטית מהעורך העיצובי. לא לערוך ידנית */\n';
  if (rules.base.length) css += rules.base.join('\n') + '\n';
  for (const d of ['tablet', 'mobile']) if (rules[d].length) css += '@media ' + MQ[d] + '{\n' + rules[d].join('\n') + '\n}\n';
  for (const d of ['desktop', 'tablet', 'mobile']) if (rules.hide[d].length) css += '@media ' + HIDE_MQ[d] + '{\n' + rules.hide[d].join('\n') + '\n}\n';
  return { css: applied ? css : '', errors, applied };
}

module.exports = { colorOk, sizeOk, weightOk, ratio, COLORS, SIZES, WEIGHTS, SPACES, DEVICES, MQ, HIDE_MQ, normalize, generate };
