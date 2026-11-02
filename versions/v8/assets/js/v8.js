(function(){
  var d=document,root=d.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var still=/[?&#]still/.test(location.href);
  var WA='972533175560';

  // תפריט נייד
  var mb=d.querySelector('.hdr__menu'),nav=d.getElementById('nav');
  if(mb)mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
  nav.addEventListener('click',function(e){if(e.target.closest('a')){nav.classList.remove('open');mb.setAttribute('aria-expanded','false')}});

  // כותרות שנבנות בגלילה: פירוק למילים, כל מילה מתמלאת לפי הגלילה
  var heads=[].slice.call(d.querySelectorAll('.build')),words=[];
  heads.forEach(function(h,hi){
    var ws=[];
    [].slice.call(h.childNodes).forEach(function(n){
      if(n.nodeType===3){return}
    });
    [].slice.call(h.querySelectorAll(':scope > span')).forEach(function(sp){
      var txt=sp.textContent.trim().split(/\s+/);sp.textContent='';
      txt.forEach(function(w,i){var s=d.createElement('span');s.className='bw';s.textContent=w;sp.appendChild(s);if(i<txt.length-1)sp.appendChild(d.createTextNode(' '));ws.push(s)});
    });
    words.push({h:h,ws:ws});
  });
  function clamp(x){return x<0?0:x>1?1:x}
  function upd(){
    var vh=innerHeight;
    words.forEach(function(o){
      var r=o.h.getBoundingClientRect(),n=o.ws.length;
      var p=still||reduce?1:clamp((vh*.92-r.top)/(vh*.5));
      o.ws.forEach(function(w,i){w.style.setProperty('--k',clamp(p*(n+1)-i).toFixed(3))});
    });
  }
  if(words.length){addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);upd()}

  // כניסת כרטיסים
  var rv=[].slice.call(d.querySelectorAll('.rise'));
  if(still||reduce||!('IntersectionObserver' in window)){rv.forEach(function(x){x.classList.add('in')})}
  else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});rv.forEach(function(x){io.observe(x)})}

  // פרלקס לאייקונים התלת-ממדיים
  var pars=[].slice.call(d.querySelectorAll('[data-par]'));
  function par(){if(reduce||still)return;var vh=innerHeight;pars.forEach(function(el){var r=el.getBoundingClientRect();var c=r.top+r.height/2-vh/2;el.style.translate='0 '+(c*parseFloat(el.dataset.par)).toFixed(1)+'px'})}
  if(pars.length){addEventListener('scroll',par,{passive:true});par()}

  // שנה
  var y=d.querySelector('[data-year]');if(y)y.textContent=new Date().getFullYear();

  // טופס: ולידציה, מסך תודה ווואטסאפ
  var box=d.querySelector('[data-contact]'),form=box.querySelector('form'),done=box.querySelector('.done'),err=box.querySelector('.ct__err');
  function msg(){
    var f=form.elements,n=f.name.value.trim(),a=f.about.value.trim(),p=f.phone.value.trim();
    var t='היי שרי, קוראים לי '+(n||'')+(a?', ויש לי עסק של '+a:'')+'.'+(p?' אפשר לחזור אליי למספר '+p+'.':'');
    return t;
  }
  function wa(t){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(t)}
  d.querySelectorAll('[data-wa]').forEach(function(a){a.addEventListener('click',function(e){
    if(a.classList.contains('btn')||a.closest('.ftr')||a.classList.contains('wa')){
      var v=form.elements.name.value.trim()||form.elements.phone.value.trim();
      e.preventDefault();window.open(wa(v?msg():'היי שרי'),'_blank','noopener');
    }})});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var n=form.elements.name.value.trim(),p=form.elements.phone.value.replace(/[^\d+]/g,'');
    if(!n){err.textContent='איך קוראים לכם?';form.elements.name.focus();return}
    if(p.length<9){err.textContent='כדי שאחזור אליכם, צריך מספר טלפון תקין.';form.elements.phone.focus();return}
    err.textContent='';
    box.querySelector('[data-who]').textContent=n;
    done.querySelector('[data-send]').href=wa(msg());
    form.hidden=true;done.hidden=false;done.focus();
  });
  var ed=box.querySelector('[data-edit]');
  if(ed)ed.addEventListener('click',function(){done.hidden=true;form.hidden=false});
})();
