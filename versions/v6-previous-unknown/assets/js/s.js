/* Sara Ankava v6: וניל, בלי ספריות. כל ההתנהגויות הן תוספת: בלי JS האתר קריא ושלם. */
(function(){
  var WA="972533175560";
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function wa(t){return "https://wa.me/"+WA+"?text="+encodeURIComponent(t)}

  /* וואטסאפ צף: הודעה מוכנה */
  var w=$(".wa");
  if(w){w.href=wa("היי שרי, הגעתי מהאתר שלך ואשמח לשיחה קצרה על העסק שלי.");setTimeout(function(){w.classList.add("show");setTimeout(function(){w.classList.remove("show")},4200)},4000)}

  /* הדר: רקע בגלילה, ובמובייל השורה השנייה מתקפלת בגלילה למטה */
  var hd=$(".hd"),last=0;
  function onScroll(){
    var y=scrollY;hd.classList.toggle("on",y>24);
    if(innerWidth<=820){hd.classList.toggle("hide",y>last&&y>160);}else hd.classList.remove("hide");
    last=y;
  }
  addEventListener("scroll",onScroll,{passive:true});onScroll();

  /* חשיפה בגלילה: ברירת מחדל גלויה, החשיפה רק תוספת */
  var rv=$$(".rv,.step");
  if("IntersectionObserver" in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15,rootMargin:"0px 0px -6% 0px"});
    rv.forEach(function(el){io.observe(el)});
    setTimeout(function(){rv.forEach(function(el){el.classList.add("in")})},4500);
  }else rv.forEach(function(el){el.classList.add("in")});

  /* ניווט פעיל בעמוד הבית */
  var links=$$('.nav a[href^="#"]');
  if(links.length&&"IntersectionObserver" in window){
    var map={};links.forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.removeAttribute("aria-current")});var a=map[e.target.id];if(a)a.setAttribute("aria-current","true")}})},{rootMargin:"-45% 0px -50% 0px"});
    Object.keys(map).forEach(function(id){var s=document.getElementById(id);if(s)so.observe(s)});
  }

  /* הירו: הטיה בעכבר ועומק בין ה-a לריבוע, ותזוזה קלה בגלילה */
  var obj=$(".obj"),tilt=$(".obj__tilt"),la=$(".obj__a"),ls=$(".obj__sq");
  if(obj&&!reduce&&matchMedia("(hover:hover)").matches){
    var hero=$(".hero"),tx=0,ty=0,cx=0,cy=0,raf;
    hero.addEventListener("pointermove",function(e){var r=hero.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;if(!raf)raf=requestAnimationFrame(loop)});
    hero.addEventListener("pointerleave",function(){tx=ty=0;if(!raf)raf=requestAnimationFrame(loop)});
    function loop(){
      cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      tilt.style.transform="perspective(1100px) rotateY("+(cx*-14)+"deg) rotateX("+(cy*10)+"deg)";
      ls.style.translate=(cx*-34)+"px "+(cy*-26)+"px";
      la.style.translate=(cx*10)+"px "+(cy*8)+"px";
      raf=(Math.abs(tx-cx)>.001||Math.abs(ty-cy)>.001)?requestAnimationFrame(loop):0;
    }
  }
  if(obj&&!reduce){
    addEventListener("scroll",function(){var y=Math.min(scrollY,innerHeight);obj.style.translate="0 "+(y*.12)+"px";obj.style.rotate=(y*.004)+"deg"},{passive:true});
  }

  /* פרלקס עדין לטלפונים בבמות הפרויקטים */
  var phones=$$(".stage .phone");
  if(phones.length&&!reduce){
    addEventListener("scroll",function(){phones.forEach(function(p){var r=p.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var k=(r.top+r.height/2-innerHeight/2)/innerHeight;p.style.transform="translateY("+(k*-34)+"px)"})},{passive:true});
  }

  /* טופס */
  var form=$("#lead");
  if(form){
    var name=$("#f-name"),tel=$("#f-tel");
    function bad(el,msg){el.setAttribute("aria-invalid","true");$("#"+el.id+"-e").textContent=msg}
    function ok(el){el.removeAttribute("aria-invalid");$("#"+el.id+"-e").textContent=""}
    [name,tel].forEach(function(el){el.addEventListener("input",function(){ok(el)})});
    form.addEventListener("submit",function(e){
      e.preventDefault();var good=true;
      if(name.value.trim().length<2){bad(name,"איך קוראים לכם?");good=false}
      var digits=tel.value.replace(/\D/g,"");
      if(digits.length<9||digits.length>12){bad(tel,"נראה שחסרה ספרה במספר הטלפון");good=false}
      if(!good){(name.getAttribute("aria-invalid")?name:tel).focus();return}
      var svc=$$('input[name=svc]:checked',form).map(function(i){return i.value}).join(", ");
      var note=$("#f-note").value.trim();
      var msg="היי שרי, אני "+name.value.trim()+" ("+tel.value.trim()+"). "+(svc?"מעניין אותי: "+svc+". ":"")+(note?"על העסק: "+note:"אשמח לשיחה קצרה על העסק שלי.");
      $("#ok-wa").href=wa(msg);
      form.classList.add("sent");$("#ok-h").focus();
      try{window.open(wa(msg),"_blank","noopener")}catch(_){}
    });
  }
  var y=$("#yr");if(y)y.textContent=new Date().getFullYear();
})();
