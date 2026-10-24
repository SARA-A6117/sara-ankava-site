/* Sara Ankava — דף הבית גרסה B: שיחת ההירו והשיחה האינטראקטיבית */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- שיחת ההירו: ההודעות מופיעות אחת אחרי השנייה ---- */
  const chat = $('[data-chat]');
  if (chat) {
    const body = $('.chat__body', chat), msgs = $$('.msg', chat), typing = $('.typing', chat);
    let timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const play = () => {
      timers.forEach(clearTimeout); timers = [];
      chat.classList.add('is-seq');
      msgs.forEach(m => m.classList.remove('is-in')); typing.classList.remove('is-on');
      let t = 700;
      msgs.forEach(m => {
        if (m.classList.contains('msg--out')) { later(() => { body.append(typing); typing.classList.add('is-on'); }, t); t += 1250; later(() => { typing.classList.remove('is-on'); m.classList.add('is-in'); }, t); t += 500; }
        else { later(() => m.classList.add('is-in'), t); t += 600; }
      });
    };
    if (reduce) msgs.forEach(m => m.classList.add('is-in'));
    else {
      body.style.minHeight = body.offsetHeight + 'px';
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); setTimeout(play, 900); } }, { threshold: .3 });
      io.observe(chat); setTimeout(() => { if (!chat.classList.contains('is-seq')) play(); }, 4000);
      $('.chat__replay', chat).addEventListener('click', play);
    }
  }

  /* ---- שיחה אינטראקטיבית: בוחרים משפט ומקבלים תשובה ---- */
  const tk = $('[data-talk]');
  if (tk) {
    const log = $('[data-log]', tk), chips = $$('.tchip', tk);
    const R = [
      'זה בדרך כלל אחד משניים: אין מי שמגיע, או שמי שמגיע לא יודע מה לעשות. נתחיל מנתוני הביקורים וההמרות ונראה איפה האנשים נעלמים.',
      'נחבר בין ההוצאה לבין מה שקורה באתר: מאיפה מגיעים, כמה משאירים פרטים, כמה קונים. רק אחרי זה מחליטים איפה להמשיך להשקיע.',
      'זה נכס אמיתי, ואפשר לבנות עליו. נהפוך את ההמלצות למערכת: אתר שמחזיק אותן, ותוכנית שמביאה עוד כאלה.',
      'נמפה מה כבר לא מחזיק: אתר, חנות, תהליך הזמנה. את זה אני מכירה מבפנים, מעסק של ארבעה סניפים ושני אתרים.'
    ];
    let timer = null;
    const bubble = (cls, text) => { const p = document.createElement('p'); p.className = 'msg ' + cls; p.textContent = text; return p; };
    chips.forEach(c => c.addEventListener('click', () => {
      clearTimeout(timer);
      chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
      const i = +c.dataset.i, said = c.textContent.trim();
      log.replaceChildren(bubble('msg--in', said));
      const t = document.createElement('div'); t.className = 'typing is-on'; t.style.display = 'inline-flex'; t.innerHTML = '<i></i><i></i><i></i>'; log.append(t);
      timer = setTimeout(() => {
        t.remove(); log.append(bubble('msg--out', R[i]));
        const a = document.createElement('a'); a.className = 'btn btn--primary'; a.target = '_blank'; a.rel = 'noopener';
        a.href = `https://wa.me/${WA_NUMBER}?text=` + encodeURIComponent(`היי שרי, בחרתי באתר: "${said}" אשמח לשיחה.`);
        a.innerHTML = 'נמשיך בוואטסאפ <span class="arr" aria-hidden="true">←</span>'; log.append(a);
      }, reduce ? 0 : 900);
    }));
  }
})();
