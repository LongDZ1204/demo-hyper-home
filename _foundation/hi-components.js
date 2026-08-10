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
