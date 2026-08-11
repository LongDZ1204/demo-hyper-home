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

/* ============================================================================
   LOAD MORE BẰNG LABEL/CHECKBOX — keyboard + aria-expanded cho trang Awards.
   Chuột vẫn hoạt động bằng liên kết for="..." kể cả khi JS chưa chạy. */
(function(){
  [].slice.call(document.querySelectorAll('[data-aw-loadmore]')).forEach(function(label){
    var id=label.getAttribute('for'), cb=id&&document.getElementById(id);
    if(!cb) return;
    function sync(){label.setAttribute('aria-expanded',cb.checked?'true':'false');}
    label.addEventListener('keydown',function(e){
      if(e.key!=='Enter'&&e.key!==' ') return;
      e.preventDefault(); cb.checked=!cb.checked; sync();
    });
    cb.addEventListener('change',sync); sync();
  });
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
      /* Chân slider hiện/ẩn theo ĐIỀU KIỆN "hàng có tràn không", không theo danh
         sách tên section trong CSS. Bản cũ chỉ bật cho .art-foot nên bảng giá
         tràn 1098/366 ở mobile mà vẫn không có thanh kéo (B.Long bắt 11/08) —
         lần thứ 6 một bộ lọc theo tên để lọt khối mới. */
      foot.classList.toggle('is-scrollable', isFinite(vis) && vis < 0.999);
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
    /* Ảnh trong hàng tải xong là scrollWidth đổi — đo một lần lúc tải thì chân
       slider có thể đứng ở kết luận "không tràn" và không bao giờ hiện lại. */
    if(window.ResizeObserver) new ResizeObserver(upd).observe(row);
    upd();
  });
})();

/* ============================================================================
   GALLERY — lọc theo pill + đèn xem ảnh có QUA/LẠI trong đúng mục đang lọc.
   Chuyển từ inline index.html 2026-08-10, thêm phần điều hướng.

   Nút qua/lại + số đếm do JS tự dựng nếu page chưa có: 4 trang gallery đang mỗi
   trang một bản HTML, dựng bằng JS thì không phải sửa 4 file rồi lệch nhau lần nữa.
   Danh sách để lướt là các ô ĐANG HIỆN — đổi pill là đổi luôn danh sách, đúng nghĩa
   "qua lại trong cùng mục".
   ============================================================================ */
(function(){
  var root=document.querySelector('[data-gallery-filter]');
  var grid=document.querySelector('[data-gallery-grid]');
  var lb=document.querySelector('[data-gallery-lightbox]');
  if(!grid) return;
  /* Đọc ô LÚC CẦN chứ không chụp một lần lúc tải: lưới ảnh của trang chi tiết
     artist có nút "Load more" nạp thêm ô sau, chụp một lần thì đèn xem ảnh chỉ
     biết 9 ô đầu và bộ đếm ra sai tổng. */
  function tiles(){ return [].slice.call(grid.querySelectorAll('.galp-tile')); }
  if(!tiles().length && !grid.hasAttribute('data-gallery-dynamic')) return;

  /* ---- giới hạn số ô hiện ra (tuỳ chọn) ----
     Bật bằng `data-gallery-page="8"` trên lưới + một nút `.gal-loadmore` trong trang.
     Nâng lên đây 2026-08-11 từ <script> riêng của portfolio.html, vì /piercing cần
     đúng hành vi đó. Để mỗi trang một bản là lại chép — đúng vết 14/16 lỗi cũ.

     Luật (B.Long chốt 10/08):
       tab All    đổ hết ảnh nhưng mở dần theo lô, nút "Load more".
       tab nhánh  cố định 1 lô đại diện, KHÔNG có nút mở thêm; xem tiếp thì bấm
                  link sang gallery đầy đủ của nhánh đó.

     HAI kiểu giấu, cố ý khác nhau vì đèn xem ảnh đối xử khác nhau:
       .is-clamped  tab All: giấu bằng CLASS -> đèn VẪN tính vào danh sách lướt,
                    nên bấm ô cuối lô rồi ấn mũi tên là đi tiếp được.
       hidden       tab nhánh: cắt cứng -> đèn bỏ qua, báo "1 / 8" đúng số ô đang
                    có trên trang, không báo "1 / 12" rồi tắc ở ô thứ 8. */
  var STEP=parseInt(grid.getAttribute('data-gallery-page'),10)||0;
  var moreBtn=STEP?document.querySelector('.gal-loadmore'):null;
  var shownAll=STEP;
  function curFilter(){
    var p=root&&root.querySelector('.galf-pill.is-active');
    return p?p.getAttribute('data-filter'):'all';
  }

  /* ---- bộ lọc pill ---- */
  function applyFilter(f,focusFrom){
    var list=[];
    tiles().forEach(function(t){
      t.classList.remove('is-clamped');
      if(f==='all'){t.hidden=false;list.push(t);return;}
      var tags=(t.getAttribute('data-tags')||'').split(/\s+/);
      t.hidden=tags.indexOf(f)===-1;
      if(!t.hidden) list.push(t);
    });
    if(!STEP||!moreBtn) return;
    var isAll=(f==='all'), n=isAll?shownAll:STEP;
    list.slice(n).forEach(function(t){ if(isAll) t.classList.add('is-clamped'); else t.hidden=true; });
    /* Nhãn nút cố định "Load more", KHÔNG kèm số còn lại (B.Long chốt 11/08) —
       chữ nằm trong HTML, JS chỉ bật/tắt nút. */
    moreBtn.hidden=!isAll||list.length-n<=0;
    /* đưa focus tới ô vừa mở để người dùng bàn phím không rơi về đầu trang;
       preventScroll để chuột không bị giật màn hình */
    if(focusFrom!=null&&list[focusFrom]) list[focusFrom].focus({preventScroll:true});
  }
  if(root){
    root.addEventListener('click',function(e){
      var b=e.target.closest('.galf-pill'); if(!b) return;
      root.querySelectorAll('.galf-pill').forEach(function(p){
        var a=p===b; p.classList.toggle('is-active',a); p.setAttribute('aria-pressed',a?'true':'false');
      });
      applyFilter(b.getAttribute('data-filter'));
    });
    var initPill=root.querySelector('.galf-pill.is-active')||root.querySelector('.galf-pill');
    if(initPill) applyFilter(initPill.getAttribute('data-filter'));
  }else if(STEP){
    applyFilter('all');            /* lưới có nút mở thêm nhưng không có thanh lọc */
  }
  if(moreBtn){
    moreBtn.addEventListener('click',function(){
      var from=shownAll; shownAll+=STEP; applyFilter(curFilter(),from);
    });
  }

  /* ---- đèn xem ảnh ---- */
  if(!lb) return;
  var lbImg=lb.querySelector('[data-lightbox-image]');
  if(!lbImg) return;
  var last=null, list=[], idx=-1;

  function svgArrow(d){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>';
  }
  var prev=lb.querySelector('[data-lightbox-prev]'), next=lb.querySelector('[data-lightbox-next]'),
      count=lb.querySelector('[data-lightbox-count]');
  if(!prev){
    prev=document.createElement('button'); prev.type='button';
    prev.className='galp-lb__nav galp-lb__nav--prev'; prev.setAttribute('data-lightbox-prev','');
    prev.setAttribute('aria-label','Previous image'); prev.innerHTML=svgArrow('M15 5l-7 7 7 7');
    lb.appendChild(prev);
  }
  if(!next){
    next=document.createElement('button'); next.type='button';
    next.className='galp-lb__nav galp-lb__nav--next'; next.setAttribute('data-lightbox-next','');
    next.setAttribute('aria-label','Next image'); next.innerHTML=svgArrow('M9 5l7 7-7 7');
    lb.appendChild(next);
  }
  if(!count){
    count=document.createElement('div'); count.className='galp-lb__count';
    count.setAttribute('data-lightbox-count',''); count.setAttribute('aria-live','polite');
    lb.appendChild(count);
  }

  function visible(){ return tiles().filter(function(t){ return !t.hidden; }); }
  function show(i){
    if(i<0||i>=list.length) return;
    idx=i;
    var t=list[i], im=t.querySelector('img');
    lbImg.src=t.getAttribute('href');
    lbImg.alt=im?im.alt:'';
    count.innerHTML='<b>'+(i+1)+'</b> / '+list.length;
    prev.disabled=(i===0); next.disabled=(i===list.length-1);
  }
  function open(tile){
    list=visible(); var i=list.indexOf(tile); if(i<0){ list=[tile]; i=0; }
    last=tile; lb.classList.add('is-open'); document.body.classList.add('galp-lock');
    show(i);
  }
  function close(){
    lb.classList.remove('is-open'); document.body.classList.remove('galp-lock');
    lbImg.removeAttribute('src'); if(last) last.focus();
  }
  function step(d){ var i=idx+d; if(i>=0&&i<list.length) show(i); }

  /* uỷ quyền trên lưới, không gắn từng ô — ô nạp thêm sau vẫn mở được đèn */
  grid.addEventListener('click',function(e){
    var t=e.target.closest('.galp-tile'); if(!t||!grid.contains(t)) return;
    e.preventDefault(); open(t);
  });
  prev.addEventListener('click',function(e){ e.stopPropagation(); step(-1); });
  next.addEventListener('click',function(e){ e.stopPropagation(); step(1); });
  lb.addEventListener('click',function(e){
    if(e.target.closest('.galp-lb__nav')||e.target.closest('.galp-lb__count')) return;
    if(e.target===lb||e.target.closest('[data-lightbox-close]')) close();
  });
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('is-open')) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowLeft') step(-1);
    else if(e.key==='ArrowRight') step(1);
  });
  /* vuốt ngang trên mobile — 45px mới tính, để cuộn dọc trong đèn không bị hiểu nhầm */
  var x0=null,y0=null;
  lb.addEventListener('touchstart',function(e){ x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
  lb.addEventListener('touchend',function(e){
    if(x0===null) return;
    var dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)) step(dx<0?1:-1);
    x0=y0=null;
  },{passive:true});
})();

/* ============================================================================
   THANH DỌC 5 BƯỚC (.pc-*) — vệt cam chạy theo cuộn, mỗi mốc sáng lên khi vệt đi qua.
   Nâng lên tầng chung 2026-08-11: /piercing · /tattoo · /black-and-grey đều có khối
   này, để mỗi trang một bản là lại chép.
   ============================================================================ */
(function(){
  var wrap=document.querySelector('.pc-rail-wrap'); if(!wrap) return;
  var lineEl=wrap.querySelector('.pc-rail-line'),
      fill=wrap.querySelector('.pc-rail-fill'),
      nodes=[].slice.call(wrap.querySelectorAll('.pc-node'));
  if(!lineEl||!fill||nodes.length<2) return;
  function update(){
    var vh=window.innerHeight,
        sy=window.scrollY||document.documentElement.scrollTop,
        maxScroll=Math.max(0,(document.documentElement.scrollHeight||document.body.scrollHeight)-vh),
        n1=nodes[0].getBoundingClientRect(), nN=nodes[nodes.length-1].getBoundingClientRect(),
        topVp=n1.top+n1.height/2, botVp=nN.top+nN.height/2, len=botVp-topVp;
    if(len<=0){lineEl.style.height='0';fill.style.height='0';return;}
    lineEl.style.height=len+'px';
    /* Mốc đọc đặt ở 55% chiều cao màn: vệt đầy đúng lúc mốc cuối tới tầm mắt,
       không phải lúc nó chạm đáy màn. */
    var refY=vh*0.55,
        startS=(topVp+sy)-refY,
        endS=Math.min((botVp+sy)-refY, maxScroll),
        prog=endS>startS ? (sy-startS)/(endS-startS) : (sy>=startS?1:0);
    prog=Math.max(0,Math.min(1,prog));
    fill.style.height=(prog*len)+'px';
    var fillY=topVp+prog*len;
    nodes.forEach(function(n){var r=n.getBoundingClientRect();
      n.classList.toggle('is-passed',(r.top+r.height/2)<=fillY+1);});
  }
  var ticking=false;
  function onScroll(){ if(!ticking){ticking=true;requestAnimationFrame(function(){update();ticking=false;});} }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  window.addEventListener('load',update);
  update();
})();

/* ============================================================================
   BĂNG BÀI VIẾT (.gd-carousel) — bài chính đứng yên bên trái, danh sách bài con
   CUỘN DỌC bên phải trong đúng chiều cao bài chính, thanh kéo dọc thay dots.
   Nâng từ <script> viết thẳng trong index.html lên đây 2026-08-11 vì /piercing
   dùng lại nguyên khối này (CSS .gd-* đã lên tầng chung cùng ngày).
   ============================================================================ */
(function(){
  var wrap=document.querySelector('[data-gd-carousel]'); if(!wrap) return;
  var feat=wrap.querySelector('.gd-feat'), sc=wrap.querySelector('.gd-scroller'),
      bar=wrap.querySelector('.gd-vbar'), th=bar&&bar.querySelector('.gd-vbar-th');
  if(!feat||!sc||!bar||!th) return;
  function measure(){
    /* desktop (>860): danh sách cao bằng bài chính. mobile: nén còn 3 bài, kéo xem tiếp. */
    if(window.innerWidth<=860){
      var items=sc.querySelectorAll('.gd-item');
      if(items.length>3){
        sc.style.maxHeight='none';
        var r0=items[0].getBoundingClientRect(), r2=items[2].getBoundingClientRect();
        sc.style.maxHeight=Math.round(r2.bottom-r0.top)+'px';
      } else { sc.style.maxHeight=''; }
    } else {
      sc.style.maxHeight=feat.offsetHeight+'px';
    }
    sync();
  }
  function sync(){
    var sh=sc.scrollHeight, ch=sc.clientHeight;
    if(sh<=ch+2){ bar.style.visibility='hidden'; return; }
    bar.style.visibility='visible';
    var ratio=ch/sh, max=sh-ch, free=1-ratio;
    th.style.height=(ratio*100)+'%';
    th.style.top=(max? (sc.scrollTop/max)*free*100 : 0)+'%';
  }
  sc.addEventListener('scroll',sync,{passive:true});
  window.addEventListener('resize',function(){clearTimeout(measure._t);measure._t=setTimeout(measure,80);});
  var drag=false,sy=0,st=0;
  function pt(e){return e.touches?e.touches[0].clientY:e.clientY;}
  function down(e){drag=true;sy=pt(e);st=sc.scrollTop;e.preventDefault();}
  function move(e){if(!drag)return;var sh=sc.scrollHeight,ch=sc.clientHeight;
    var travel=bar.clientHeight*(1-ch/sh);var scale=travel?(sh-ch)/travel:0;
    sc.scrollTop=st+(pt(e)-sy)*scale;}
  function up(){drag=false;}
  th.addEventListener('mousedown',down); th.addEventListener('touchstart',down,{passive:false});
  window.addEventListener('mousemove',move); window.addEventListener('touchmove',move,{passive:false});
  window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
  bar.addEventListener('mousedown',function(e){if(e.target===th)return;
    var r=bar.getBoundingClientRect();
    sc.scrollTop=((e.clientY-r.top)/r.height)*(sc.scrollHeight-sc.clientHeight);});
  window.addEventListener('load',function(){ measure(); setTimeout(measure,300); });
  measure();
})();

/* ============================================================================
   DẢI THẺ PHONG CÁCH (.st-*) — nâng từ mockup /tattoo ngày 2026-08-11.
   Hai việc: (1) mỗi thẻ có slider ảnh riêng, (2) nút Load more mở phần thẻ ẩn.
   Khoá bằng `.st-media[data-slider]` / `.st-morebtn` nên trang không có khối này
   thì thoát ngay, không nạp thừa.
   ============================================================================ */
(function(){
  /* --- slider ảnh TRONG từng thẻ ---
     Mũi tên và chấm là ANH EM của thẻ link, không nằm trong nó, nên bấm vào
     chúng phải chặn sự kiện lại, nếu không trình duyệt điều hướng luôn. */
  [].slice.call(document.querySelectorAll('.st-media[data-slider]')).forEach(function(media){
    var track=media.querySelector('.st-slides'); if(!track) return;
    var count=track.children.length; if(count<2) return;
    var dots=[].slice.call(media.querySelectorAll('.st-dot')),
        prev=media.querySelector('.st-iprev'),
        next=media.querySelector('.st-inext'), i=0;
    function go(n){
      i=(n%count+count)%count;
      track.style.transform='translateX('+(-i*100)+'%)';
      dots.forEach(function(d,k){d.classList.toggle('is-on',k===i);});
    }
    function bind(el,d){ if(!el) return;
      el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();go(i+d);}); }
    bind(prev,-1); bind(next,1);
    dots.forEach(function(d,k){d.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();go(k);});});
  });

  /* --- Load more: mở/đóng phần thẻ ẩn của dải --- */
  var btn=document.querySelector('.st-morebtn'),
      rail=document.querySelector('.st-rail');
  if(!btn||!rail) return;
  var lbl=btn.querySelector('[data-lm]');
  btn.addEventListener('click',function(){
    var open=rail.classList.toggle('is-open');
    btn.setAttribute('aria-expanded',open?'true':'false');
    if(lbl) lbl.textContent=open?'Show less':'Load more';
    /* Đóng lại thì kéo về đầu dải, nếu không người đọc đang ở giữa danh sách
       bị hụt chân và rơi xuống section sau. */
    if(!open) rail.scrollIntoView({behavior:'smooth',block:'start'});
  });
})();
