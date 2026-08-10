/* ============================================================================
   hi-components.js — hành vi của component dùng chung nhiều page.
   Trích nguyên văn từ index.html (trang chủ = bản chuẩn).
   Page nào có .awrail thì nạp file này, KHÔNG chép lại script vào page.
   Nạp cuối <body>, sau hi-chrome.js.
   ============================================================================ */

/* ---------- AWARDS · rail cúp vô cực (3 bản clone) + dots tự chạy ---------- */
  (function(){
    var rail=document.querySelector('.awrail');
    if(!rail) return;
    var orig=[].slice.call(rail.querySelectorAll('.awrail-card')),
        N=orig.length,
        dots=[].slice.call(document.querySelectorAll('.awrail-dot')),
        host=document.querySelector('.awrail-wrap')||rail,
        rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches,
        all=orig.slice(), abs=N, timer=null, st=null, INT=4000, visible=false, touched=false;
    /* Vô cực bằng 3 bản: DOM = [gốc][clone1][clone2]. Tâm chạy trong bản GIỮA (abs ∈ [N,2N-1]);
       khi trôi sang bản biên thì rebase về bản giữa (nội dung y hệt → mắt không thấy). */
    orig.forEach(function(c){ var im=c.querySelector('img'); if(im) im.loading='eager'; });   // ảnh gốc tải ngay để mép không trống
    for(var k=0;k<2;k++){ orig.forEach(function(c){ var cl=c.cloneNode(true); cl.setAttribute('aria-hidden','true');
      var im=cl.querySelector('img'); if(im){ im.removeAttribute('loading'); }   // clone: bỏ lazy → tải ngay, tránh card mép trắng khi lướt tới
      rail.appendChild(cl); all.push(cl); }); }
    function big(){ return window.innerWidth>640; }
    /* cúp gần TÂM rail nhất (desktop) / trái nhất (mobile) trong toàn bộ 3N cúp */
    /* desktop: cúp gần TÂM rail; mobile: cúp có mép trái gần mép rail (căn theo biên card → 2 cột lấp đầy) */
    function nearest(){
      var rr=rail.getBoundingClientRect(), b=big(), best=abs, bd=1e9;
      all.forEach(function(c,i){ var r=c.getBoundingClientRect();
        var d=b? Math.abs(r.left+r.width/2-(rr.left+rr.width/2)) : Math.abs(r.left-rr.left);
        if(d<bd){bd=d;best=i;} });
      return best;
    }
    function center(i, instant){
      // tương đối theo rect (chính xác, tránh lệch offsetParent); an toàn vì timer đã IO-gate không advance ngầm
      var cr=all[i].getBoundingClientRect(), rr=rail.getBoundingClientRect();
      var target= big()
        ? rail.scrollLeft + (cr.left-rr.left) + cr.width/2 - rr.width/2   // desktop: căn giữa card active
        : rail.scrollLeft + (cr.left-rr.left);                            // mobile: card i về mép trái → đúng 2 cột lấp kín, không hé
      rail.scrollTo({left:target, behavior:(instant||rm)?'auto':'smooth'});
    }
    function refresh(){
      var n=nearest(), b=big(), act=((n%N)+N)%N;
      all.forEach(function(c,i){ c.classList.toggle('is-center', b && i===n); });
      dots.forEach(function(d,i){ d.classList.toggle('is-active', i===act); });
    }
    /* kéo tâm về bản GIỮA nếu đã trôi ra biên — jump tức thì giữa 2 bản y hệt → seamless */
    function normalize(){ if(abs<N || abs>=2*N){ abs=N+(((abs%N)+N)%N); center(abs,true); } }
    function tick(){ normalize(); abs++; center(abs,false); }
    function play(){ if(rm||!visible) return; stop(); timer=setInterval(tick, INT); }   // chỉ chạy khi section trong viewport
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }
    rail.addEventListener('scroll', function(){ refresh(); clearTimeout(st); st=setTimeout(function(){ abs=nearest(); }, 120); }, {passive:true});
    window.addEventListener('resize', refresh);
    dots.forEach(function(d,i){ d.addEventListener('click', function(){ touched=true; abs=N+i; center(abs,false); play(); }); });
    /* dừng khi hover/chạm, chạy lại khi rời */
    host.addEventListener('mouseenter', stop);
    host.addEventListener('mouseleave', play);
    host.addEventListener('touchstart', stop, {passive:true});
    document.addEventListener('visibilitychange', function(){ document.hidden?stop():play(); });
    /* mở màn ở dot 0. start() chỉ re-căn khi CHƯA tương tác/chưa hiện → load/font settle không giật tâm */
    function start(){ if(touched) return; abs=N; center(abs,true); refresh(); }
    start();
    window.addEventListener('load', function(){ requestAnimationFrame(function(){ requestAnimationFrame(start); }); setTimeout(start, 450); });
    if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(start); }
    /* auto-play CHỈ khi section vào viewport (không advance ngầm lúc trang đang load) */
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){ visible=e.isIntersecting; if(visible){ touched=true; play(); } else stop(); }); }, {threshold:.25}).observe(host);
    } else { visible=true; touched=true; play(); }
  })();



/* ---------- PILL-NAV · thanh kéo tuỳ biến (review · gallery · FAQ) ---------- */
/* Thanh kéo custom cho pill-nav (review · gallery · FAQ) — hiện cố định mọi OS, kéo + click-jump.
   Ẩn scrollbar native ở CSS; bar tự ẩn khi hàng pill KHÔNG tràn (đủ chỗ 1 hàng). */
(function(){
  function initBar(nav){
    if(nav.dataset.pillbar) return; nav.dataset.pillbar='1';
    // tách các pill hiện có vào 1 hàng cuộn .pillrow (giữ nav là anh em radio → chuỗi ~ CSS còn nguyên)
    var row=document.createElement('div'); row.className='pillrow';
    while(nav.firstChild) row.appendChild(nav.firstChild);
    nav.appendChild(row);
    var bar=document.createElement('div'); bar.className='pillbar';
    var th=document.createElement('div'); th.className='pillbar-th'; bar.appendChild(th);
    nav.appendChild(bar);
    nav.classList.add('has-pillbar');
    function sync(){
      var sw=row.scrollWidth, cw=row.clientWidth;
      if(sw<=cw+2){ bar.style.display='none'; return; }
      bar.style.display='block';
      var ratio=cw/sw, maxScroll=sw-cw, free=1-ratio;
      th.style.width=(ratio*100)+'%';
      th.style.left=(maxScroll? (row.scrollLeft/maxScroll)*free*100 : 0)+'%';
    }
    row.addEventListener('scroll', sync, {passive:true});
    window.addEventListener('resize', sync);
    var drag=false, sx=0, sl=0;
    function pt(e){ return e.touches? e.touches[0].clientX : e.clientX; }
    function down(e){ drag=true; sx=pt(e); sl=row.scrollLeft; e.preventDefault(); }
    function move(e){ if(!drag)return; var sw=row.scrollWidth, cw=row.clientWidth; var travel=bar.clientWidth*(1-cw/sw); var scale=travel? (sw-cw)/travel : 0; row.scrollLeft=sl+(pt(e)-sx)*scale; }
    function up(){ drag=false; }
    th.addEventListener('mousedown',down); th.addEventListener('touchstart',down,{passive:false});
    window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
    bar.addEventListener('mousedown',function(e){ if(e.target===th)return; var r=bar.getBoundingClientRect(); row.scrollLeft=((e.clientX-r.left)/r.width)*(row.scrollWidth-row.clientWidth); });
    sync();
  }
  function initAll(){ document.querySelectorAll('.rv-tabnav,.galf,.faqtab-nav').forEach(initBar); }
  window.addEventListener('load', initAll);
  // sync lại khi đổi tab review/FAQ (đổi số pill hiển thị không đổi, nhưng width có thể đổi)
  window.addEventListener('load', function(){ setTimeout(function(){ window.dispatchEvent(new Event('resize')); }, 300); });
})();

/* ---------- YouTube facade (poster -> nhúng thật) ---------- */

/* Section 05 · Near-Me — YouTube facade: click poster -> load real embed (nocookie) */
(function(){
  var m=document.querySelector('.near-media[data-yt]');
  if(m){ m.addEventListener('click',function(){
    if(m.classList.contains('is-playing')) return;
    var f=document.createElement('iframe');
    f.className='near-frame';
    f.src='https://www.youtube-nocookie.com/embed/'+m.getAttribute('data-yt')+'?autoplay=1&rel=0';
    f.title='Hyper Inkers tattoo studio and team introduction video, San Antonio';
    f.setAttribute('allow','autoplay; encrypted-media; picture-in-picture');
    f.setAttribute('allowfullscreen','');
    m.appendChild(f); m.classList.add('is-playing');
  }); }
})();
(function(){
  var row=document.querySelector('.stat-row'), thumb=document.querySelector('.stat-thumb');
  if(!row||!thumb) return;
  function upd(){
    var vis=row.clientWidth/row.scrollWidth;
    var max=row.scrollWidth-row.clientWidth;
    var p=max>0?row.scrollLeft/max:0;
    thumb.style.width=(vis*100)+'%';
    thumb.style.left=(p*(1-vis)*100)+'%';
  }
  row.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  upd();
})();
/* ---------- Reviews / video slider — 2 chế độ chung 1 engine ---------- */
/* review + video sliders — nav ‹ › + progress (awards-synced; recompute on tab switch) */
/* Reviews slider — 2 chế độ trên cùng 1 engine:
     · mặc định        : user tự kéo, hiện ‹ › + thanh progress
     · .is-auto        : tự chạy 5s/màn, hiện dots (tối đa 5 dot, rìa thu nhỏ)
   Auto dừng khi: hover · focus bàn phím · user chạm/kéo (dừng hẳn) ·
   tab trình duyệt bị ẩn · panel tab đang đóng · máy bật prefers-reduced-motion. */
(function(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches,
      AUTO_MS=5000;
  function initSlider(wrap){
    var s=wrap.querySelector('.rv-slider'); if(!s) return;
    var th=wrap.querySelector('.rv-prog-thumb'),
        prev=wrap.querySelector('.rv-navbtn.prev'),
        next=wrap.querySelector('.rv-navbtn.next'),
        dots=wrap.querySelector('.rv-dots'),
        auto=wrap.classList.contains('is-auto'),
        btns=[],timer=null,hold=false,killed=false;

    /* Số "màn cuộn", KHÔNG phải số card — card có 2 bề rộng khác nhau nên đếm card sẽ sai.
       Dư dưới 12px coi như không dư (tránh sinh 1 dot thừa vì lệch padding vài pixel). */
    function pages(){
      if(!s.clientWidth) return 1;
      var over=s.scrollWidth-s.clientWidth;
      return over<12?1:Math.ceil(over/s.clientWidth)+1;
    }
    /* Màn CUỐI thường chỉ dư một phần (vd cuộn tối đa 338px trong khi 1 màn rộng 1176px).
       Vì vậy phải chốt sẵn toạ độ từng màn rồi so khoảng cách — lấy scrollLeft chia
       clientWidth sẽ luôn ra 0 ở màn cuối, làm dot sáng sai và slider kẹt không quay vòng. */
    function stops(){
      var n=pages(),max=Math.max(0,s.scrollWidth-s.clientWidth),a=[];
      for(var i=0;i<n;i++) a.push(Math.min(i*s.clientWidth,max));
      return a;
    }
    function cur(){
      var p=stops(),best=0,min=Infinity;
      for(var i=0;i<p.length;i++){var d=Math.abs(p[i]-s.scrollLeft); if(d<min){min=d;best=i;}}
      return best;
    }
    function goto(i){
      var p=stops();
      s.scrollTo({left:p[Math.max(0,Math.min(i,p.length-1))],behavior:rm?'auto':'smooth'});
    }

    function buildDots(){
      if(!dots||!s.clientWidth) return;
      var n=pages();
      dots.style.display=n<2?'none':'';   /* 1 màn thì không có gì để điều hướng */
      if(btns.length===n) return;
      dots.innerHTML='';btns=[];
      for(var i=0;i<n;i++){
        var b=document.createElement('button');
        b.type='button';b.className='rv-dot';
        b.setAttribute('aria-label','Go to slide '+(i+1)+' of '+n);
        b.addEventListener('click',(function(k){return function(){kill();goto(k);};})(i));
        dots.appendChild(b);btns.push(b);
      }
    }
    function paintDots(){
      if(!btns.length) return;
      var n=btns.length,a=cur(),
          start=Math.max(0,Math.min(a-2,n-5)),end=Math.min(n-1,start+4);
      btns.forEach(function(b,i){
        b.className='rv-dot'
          +(i===a?' is-on':'')
          +(i===start-1||i===end+1?' is-edge':'')
          +(i<start-1||i>end+1?' is-hide':'');
        b.setAttribute('aria-current',i===a?'true':'false');
      });
    }
    function upd(){
      if(!s.clientWidth) return;
      var vis=s.clientWidth/s.scrollWidth;
      if(th){
        if(!isFinite(vis)||vis>=1){th.style.width='100%';th.style.left='0';}
        else{var max=s.scrollWidth-s.clientWidth,p=max>0?s.scrollLeft/max:0;
          th.style.width=(vis*100)+'%';th.style.left=(p*(1-vis)*100)+'%';}
      }
      if(prev)prev.style.opacity=s.scrollLeft<=1?'.35':'1';
      if(next)next.style.opacity=(s.scrollLeft+s.clientWidth>=s.scrollWidth-1)?'.35':'1';
      buildDots();paintDots();
    }
    function step(d){s.scrollBy({left:d*0.85*s.clientWidth,behavior:rm?'auto':'smooth'});}
    function tick(){
      if(hold||killed||document.hidden||!wrap.offsetParent||!s.clientWidth) return;
      if(pages()<2) return;
      var nx=cur()+1; goto(nx>=pages()?0:nx);
    }
    function kill(){killed=true;if(timer){clearInterval(timer);timer=null;}}

    if(prev)prev.addEventListener('click',function(){step(-1);});
    if(next)next.addEventListener('click',function(){step(1);});
    s.addEventListener('scroll',upd,{passive:true});
    window.addEventListener('resize',upd);

    if(auto&&!rm){
      timer=setInterval(tick,AUTO_MS);
      wrap.addEventListener('mouseenter',function(){hold=true;});
      wrap.addEventListener('mouseleave',function(){hold=false;});
      wrap.addEventListener('focusin',function(){hold=true;});
      wrap.addEventListener('focusout',function(){hold=false;});
      s.addEventListener('pointerdown',kill,{passive:true});
      s.addEventListener('touchstart',kill,{passive:true});
      s.addEventListener('wheel',kill,{passive:true});
    }
    wrap._rvUpd=upd; upd();
  }
  var wraps=[].slice.call(document.querySelectorAll('.rv-slider-wrap'));
  wraps.forEach(initSlider);
  /* panel ẩn có clientWidth = 0 → mọi phép đo (số dot, bề rộng progress) đều sai.
     Phải đo lại ngay sau khi đổi tab HOẶC đổi sub-tab nền tảng. */
  [].slice.call(document.querySelectorAll('input[name="rvtab"],input[name="rvplat"]')).forEach(function(r){
    r.addEventListener('change',function(){
      requestAnimationFrame(function(){wraps.forEach(function(w){if(w._rvUpd)w._rvUpd();});});
      /* mobile: hàng tab cuộn ngang → kéo tab vừa chọn vào tầm nhìn, tránh
         trạng thái "tab đang mở nằm ngoài màn hình" */
      var lb=document.querySelector('label[for="'+r.id+'"]');
      if(lb&&lb.parentNode.scrollWidth>lb.parentNode.clientWidth+2){
        lb.scrollIntoView({inline:'center',block:'nearest',behavior:rm?'auto':'smooth'});
      }
    });
  });
})();
/* ---------- Services card — hover desktop / chạm mobile ---------- */

/* SERVICES cards — desktop = hover reveals + whole-card link; touch (no-hover) = tap to activate (1st tap reveals, 2nd tap navigates) */
(function(){
  var noHover=window.matchMedia('(hover: none)');
  var cards=[].slice.call(document.querySelectorAll('.svc-card'));
  if(!cards.length) return;
  cards.forEach(function(card){
    card.addEventListener('click',function(e){
      if(noHover.matches && !card.classList.contains('is-active')){
        e.preventDefault();
        cards.forEach(function(c){ if(c!==card) c.classList.remove('is-active'); });
        card.classList.add('is-active');
      }
    });
  });
  document.addEventListener('click',function(e){
    if(noHover.matches && !e.target.closest('.svc-card')){
      cards.forEach(function(c){ c.classList.remove('is-active'); });
    }
  });
})();
/* ---------- Artists card — hover desktop / chạm mobile ---------- */

/* ARTISTS cards — desktop = hover reveals bio panel + whole-card link; touch = tap to reveal (1st tap panel, 2nd tap navigates) */
(function(){
  var noHover=window.matchMedia('(hover: none)');
  var cards=[].slice.call(document.querySelectorAll('.art-card'));
  if(!cards.length) return;
  cards.forEach(function(card){
    card.addEventListener('click',function(e){
      if(noHover.matches && !card.classList.contains('is-active')){
        e.preventDefault();
        cards.forEach(function(c){ if(c!==card) c.classList.remove('is-active'); });
        card.classList.add('is-active');
      }
    });
  });
  document.addEventListener('click',function(e){
    if(noHover.matches && !e.target.closest('.art-card')){
      cards.forEach(function(c){ c.classList.remove('is-active'); });
    }
  });
})();
/* ---------- Slider mobile dùng chung (msl) — ‹ › + thanh kéo ---------- */

/* generic MOBILE-SLIDER nav (‹ › + progress) for Services & Artists — grid on desktop, swipe row on mobile.
   Mirrors the reviews slider; the foot is CSS-hidden on desktop so this is a harmless no-op there. */
(function(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  [].slice.call(document.querySelectorAll('.msl-foot')).forEach(function(foot){
    var row=foot.parentElement.querySelector('.msl-row'); if(!row) return;
    var th=foot.querySelector('.msl-thumb'),
        track=foot.querySelector('.msl-track'),
        prev=foot.querySelector('.msl-navbtn.prev'),
        next=foot.querySelector('.msl-navbtn.next');
    function upd(){
      var vis=row.clientWidth/row.scrollWidth;
      if(th){
        if(!isFinite(vis)||vis>=1){th.style.width='100%';}
        else{var max=row.scrollWidth-row.clientWidth,p=max>0?row.scrollLeft/max:0;
          /* FILL trái: từ phần nhìn thấy (đầu) -> 100% (cuối), liền mạch */
          var w=(vis+p*(1-vis))*100;
          th.style.width=Math.min(100,Math.max(8,w))+'%';}
      }
      if(prev)prev.style.opacity=row.scrollLeft<=1?'.35':'1';
      if(next)next.style.opacity=(row.scrollLeft+row.clientWidth>=row.scrollWidth-1)?'.35':'1';
    }
    function step(d){row.scrollBy({left:d*0.85*row.clientWidth,behavior:rm?'auto':'smooth'});}
    if(prev)prev.addEventListener('click',function(){step(-1);});
    if(next)next.addEventListener('click',function(){step(1);});
    /* KÉO track để tua slider (scrub) */
    if(track){
      function scrub(clientX){var r=track.getBoundingClientRect(),ratio=(clientX-r.left)/r.width;
        ratio=Math.min(1,Math.max(0,ratio));row.scrollLeft=ratio*(row.scrollWidth-row.clientWidth);}
      track.addEventListener('pointerdown',function(e){track.classList.add('dragging');try{track.setPointerCapture(e.pointerId);}catch(_){}scrub(e.clientX);e.preventDefault();});
      track.addEventListener('pointermove',function(e){if(track.classList.contains('dragging'))scrub(e.clientX);});
      function end(){track.classList.remove('dragging');}
      track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);
    }
    row.addEventListener('scroll',upd,{passive:true});
    window.addEventListener('resize',upd);
    upd();
  });
})();
