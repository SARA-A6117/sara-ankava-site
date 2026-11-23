const fs = require('fs');
const root = require('path').resolve(__dirname, '..', '..') + '/';   // דורש build קודם (dist/assets/tree.json)
const D = require(root + 'tools/design.js');
const tree = require(root + 'dist/assets/tree.json');
const nodes = new Map(); Object.values(tree.pages).forEach((l) => l.forEach((n) => nodes.set(n.id, n)));
const idx = tree.pages.index;
const pick = (f) => idx.find(f);
const aboutH = pick((n) => n.scope === 'אודות' && n.kind === 'heading' && !n.locked);
const toolsSec = pick((n) => n.scope === 'כלים' && n.kind === 'section' && !n.locked);
const toolsP = pick((n) => n.scope === 'כלים' && n.kind === 'text' && !n.locked && n.allow.includes('space'));
const footerA = pick((n) => n.scope === 'פוטר' && n.kind === 'link' && !n.locked);
const heroEl = pick((n) => n.locked === 'hero' && n.kind === 'heading');
const gradEl = pick((n) => n.locked === 'gradient');
const pinnedTxt = pick((n) => n.scope === 'תהליך' && n.kind === 'text' && !n.locked);
const out = [];
const ok = (name, cond, info) => out.push((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : ''));

// 1) ערכים תקינים עוברים
let r = D.normalize({ base: { color: 'cobalt', size: 'fs-3', weight: 500, mt: 'group', mb: 'inner' }, mobile: { size: 'fs-4' }, hide: { mobile: true } }, ['color', 'size', 'weight', 'space', 'hide']);
ok('valid props accepted', r.errors.length === 0 && r.props.base.color === 'cobalt' && r.props.hide.mobile === true, JSON.stringify(r.props).slice(0, 80));
// 2) ערכים אסורים נדחים
const bad = [
  ['color from outside palette', { base: { color: '#ff0000' } }], ['color url()', { base: { color: 'url(javascript:alert(1))' } }],
  ['size free value', { base: { size: '99px' } }], ['size calc', { base: { size: 'calc(100vw)' } }], ['weight 950', { base: { weight: 950 } }],
  ['weight string with css', { base: { weight: '700;background:red' } }], ['space free', { base: { mt: '40px' } }],
  ['property background', { base: { background: 'red' } }], ['property position', { base: { position: 'fixed' } }],
  ['property transform', { base: { transform: 'scale(2)' } }], ['property z-index', { base: { 'z-index': 9999 } }], ['property width', { base: { width: '100vw' } }],
  ['unknown device key', { desktop: { color: 'cobalt' } }], ['css injection in key', { 'base}body{display:none': { color: 'cobalt' } }],
];
for (const [n, p] of bad) { const x = D.normalize(p, ['color', 'size', 'weight', 'space', 'hide']); ok('rejects: ' + n, x.errors.length > 0 && JSON.stringify(x.props) === '{}', x.errors[0]); }
// 3) הרשאות לפי אלמנט
r = D.normalize({ base: { color: 'cobalt', mt: 'group' } }, ['color']); ok('space not allowed when only color allowed', r.errors.length === 1 && r.props.base.color === 'cobalt');
// 4) מחולל: אלמנט נעול / לא קיים / מוצמד
const map = {};
map[aboutH.id] = { base: { color: 'cobalt', size: 'fs-3', weight: 900, mt: 'group' }, tablet: { size: 'fs-4' }, mobile: { size: 'fs-5', mb: 'none' } };
map[toolsSec.id] = { hide: { mobile: true, tablet: true } };
map[footerA.id] = { base: { color: 'yellow' } };
map[heroEl.id] = { base: { color: 'cobalt' } };
map[gradEl.id] = { base: { color: 'cobalt' } };
map[pinnedTxt.id] = { base: { color: 'cobalt', size: 'fs-4', mt: 'outer' }, hide: { mobile: true } };
map['no.such.element'] = { base: { color: 'cobalt' } };
map['x"]{display:none}[data-el="y'] = { base: { color: 'cobalt' } };
const g = D.generate(map, nodes);
const hasSel = (id) => g.css.includes('[data-el="' + id + '"]');
ok('open elements produce CSS', hasSel(aboutH.id) && hasSel(toolsSec.id) && hasSel(footerA.id));
ok('hero element is NOT in CSS', !hasSel(heroEl.id), 'locked: ' + heroEl.locked);
ok('gradient element is NOT in CSS', !hasSel(gradEl.id), 'locked: ' + gradEl.locked);
ok('unknown / injected element keys are NOT in CSS', !g.css.includes('no.such.element') && !g.css.includes('display:none}[data-el'));
ok('pinned text: color/size kept, space+hide dropped', g.css.includes('[data-el="' + pinnedTxt.id + '"]') && !/margin-top:var\(--sp-outer\)/.test(g.css) && g.errors.some((e) => e.el === pinnedTxt.id));
ok('errors reported for rejected items', g.errors.filter((e) => /locked|unknown/.test(e.msg)).length >= 4, g.errors.length + ' errors');
ok('CSS never contains forbidden properties', !/(background|position|transform|animation|z-index|width\s*:|height\s*:|filter|clip-path)/.test(g.css.replace(/data-el="[^"]*"/g, '').replace(/@media[^{]*/g, '')));
ok('all CSS values come from tokens', [...g.css.matchAll(/(color|font-size|font-weight|margin-top|margin-bottom):([^;!]*)!important/g)].every((m) => /^(#[0-9A-F]{6}|var\(--(fs|sp)-[a-z0-9]+\)|[0-9]+|0)$/.test(m[2])));
ok('media queries only the allowed ones', [...g.css.matchAll(/@media ([^{]*)\{/g)].every((m) => ['(max-width:1024px)', '(max-width:900px)', '(min-width:1025px)', '(min-width:901px) and (max-width:1024px)'].includes(m[1])), [...g.css.matchAll(/@media ([^{]*)\{/g)].map((m) => m[1]).join(' ; '));
ok('empty map -> empty css', D.generate({}, nodes).css === '');
console.log(out.join('\n')); console.log('\n' + out.filter((x) => x.startsWith('PASS')).length + '/' + out.length + ' passed');
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(map));
console.log('ids:', JSON.stringify({ aboutH: aboutH.id, toolsSec: toolsSec.id, footerA: footerA.id, toolsP: toolsP && toolsP.id }));
