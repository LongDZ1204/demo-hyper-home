/* HYPER INKERS — CHROME JS: đồng hồ live + trạng thái mở cửa · đóng promo bar ·
   accordion menu mobile · nút lên đầu trang. Tách khỏi inline homepage 2026-08-10. */
/* Live San Antonio clock + Open/Closed (America/Chicago, DST-safe) */
(function(){
  var nodes=[document.getElementById('hiClock'),document.getElementById('hiClockM')].filter(Boolean);
  if(!nodes.length) return;
  var SCH={0:[660,1500],1:[600,1440],2:[600,1440],3:[600,1440],4:[600,1440],5:[600,1500],6:[600,1500]};
  var WD={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  function fmtH(min){min=((min%1440)+1440)%1440;var h=Math.floor(min/60);var ap=h<12?'AM':'PM';var h12=h%12;if(h12===0)h12=12;return h12+' '+ap;}
  function tick(){
    var now=new Date();
    var parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now);
    var map={};parts.forEach(function(x){map[x.type]=x.value;});
    var d=WD[map.weekday];
    var m=(parseInt(map.hour,10)%24)*60+parseInt(map.minute,10);
    var disp=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'numeric',minute:'2-digit',hour12:true}).format(now);
    var today=SCH[d], yest=SCH[(d+6)%7];
    var open=false, closeMin=null;
    if(m>=today[0] && m<Math.min(today[1],1440)){open=true;closeMin=today[1];}
    if(!open && yest[1]>1440 && m<(yest[1]-1440)){open=true;closeMin=yest[1];}
    var shortText, fullText;
    if(open){shortText='Open';fullText='Open · till '+fmtH(closeMin);}
    else{var no=(m<today[0])?fmtH(today[0]):fmtH(SCH[(d+1)%7][0]);shortText='Closed';fullText='Closed · opens '+no;}
    nodes.forEach(function(el){
      el.querySelector('.t').textContent=disp;
      el.querySelector('.st').textContent=(el.id==='hiClockM')?fullText:shortText;
      el.setAttribute('title','San Antonio · '+disp+' · '+fullText);
      el.classList.toggle('closed',!open);
    });
  }
  tick(); setInterval(tick,30000);
})();

/* Promo bar dismiss */
(function(){
  var x=document.getElementById('promoX'), bar=document.getElementById('promobar');
  if(!x||!bar) return;
  x.addEventListener('click',function(){bar.remove();document.documentElement.style.setProperty('--promo-h','0px');});
})();

/* Hide-on-scroll: cuộn xuống trốn CẢ chrome (promo bar + header), cuộn lên hiện lại.
   Cờ đặt ở <html> để thanh dính giữa trang cũng đọc được trạng thái này. */
(function(){
  var root=document.documentElement, tog=document.getElementById('navtog');
  if(!document.querySelector('.hdr')) return;
  var last=window.scrollY, threshold=90, ticking=false;
  /* ngưỡng 6px: cuộn bằng trackpad hay rung tay sinh ra chuỗi ±1px, không lọc thì
     header nhấp nháy lên xuống liên tục */
  function upd(){
    var y=window.scrollY;
    root.classList.toggle('scrolled', y>threshold);   /* rời đỉnh -> header có nền đặc */
    if(tog && tog.checked){ root.classList.remove('chrome-off'); ticking=false; last=y; return; }
    if(y>threshold && y>last+6) root.classList.add('chrome-off');
    else if(y<last-6 || y<=threshold) root.classList.remove('chrome-off');
    last=y; ticking=false;
  }
  upd();
  window.addEventListener('scroll',function(){ if(!ticking){ requestAnimationFrame(upd); ticking=true; } },{passive:true});
  if(tog) tog.addEventListener('change',function(){ if(tog.checked) root.classList.remove('chrome-off'); });
})();

/* Thanh dính: gắn .is-stuck khi thanh đã bám lên đỉnh, để CSS biết lúc nào cần
   nhường chỗ cho chrome. Đo bằng một mốc vô hình cao 1px đặt ngay TRƯỚC thanh —
   không đo trực tiếp thanh vì lúc bị ẩn nó đã dịch transform, toạ độ không còn tin được. */
(function(){
  var bars=document.querySelectorAll('.stickybar');
  if(!bars.length || !('IntersectionObserver' in window)) return;
  bars.forEach(function(bar){
    var anchor=document.createElement('span');
    anchor.className='stickybar-anchor';
    anchor.setAttribute('aria-hidden','true');
    bar.parentNode.insertBefore(anchor, bar);
    new IntersectionObserver(function(entries){
      var e=entries[0];
      /* "ngoài tầm nhìn" có HAI hướng: mốc trôi lên trên (thanh đã dính) và mốc còn nằm
         dưới màn hình (thanh còn ở xa phía dưới, chưa dính gì cả). Chỉ hướng thứ nhất mới
         là dính — nếu không thì ngay lúc mở trang thanh đã bị coi là đang dính và bị ẩn. */
      bar.classList.toggle('is-stuck', !e.isIntersecting && e.boundingClientRect.top < 0);
    },{threshold:0}).observe(anchor);
  });
})();

/* Mobile accordion: 2 levels (desktop keeps hover flyout)
   ---------------------------------------------------------------------------
   Mỗi hàng có mũi tên là HAI vùng bấm: chữ đi tới trang hub, mũi tên mở/đóng
   nhánh con. Bản cũ chặn preventDefault cho CẢ hàng nên trên điện thoại 5 trang
   hub không còn đường vào nào: Services · Custom Tattoo · Piercing · Gallery ·
   About Us (B.Long bắt 11/08 ở Custom Tattoo).
   Không tách được thành 2 thẻ vì <button> không được nằm trong <a> — nên phân
   luồng theo ĐIỂM CHẠM, còn vùng bấm của mũi tên thì nới ra cỡ ngón tay bằng
   padding + margin âm ở hi-chrome.css. */
(function(){
  var mq=window.matchMedia('(max-width:940px)');
  function laMuiTen(e){ return !!(e.target.closest && e.target.closest('.caret,.caret-r')); }
  document.querySelectorAll('.has-drop > .navlink').forEach(function(a){
    a.addEventListener('click',function(e){
      if(!mq.matches || !laMuiTen(e)) return;   /* chạm vào chữ -> để link chạy */
      e.preventDefault();
      var li=a.parentElement, was=li.classList.contains('open');
      document.querySelectorAll('.has-drop.open').forEach(function(o){if(o!==li)o.classList.remove('open');});
      li.classList.toggle('open',!was);
    });
  });
  document.querySelectorAll('.has-sub > a').forEach(function(a){
    a.addEventListener('click',function(e){
      if(!mq.matches || !laMuiTen(e)) return;
      e.preventDefault();
      a.parentElement.classList.toggle('open');
    });
  });
  mq.addEventListener('change',function(){document.querySelectorAll('.open').forEach(function(o){o.classList.remove('open');});});
})();

(function(){
  var btn=document.querySelector('.to-top'); if(!btn) return;
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var lastY=window.scrollY, ticking=false;
  function update(){
    var y=window.scrollY, delta=y-lastY;
    if(y<=600){btn.classList.remove('is-on');lastY=y;}
    else if(delta>5){btn.classList.add('is-on');lastY=y;}
    else if(delta< -5){btn.classList.remove('is-on');lastY=y;}
    ticking=false;
  }
  btn.addEventListener('click', function(){
    btn.classList.remove('is-on');
    window.scrollTo({top:0, behavior:rm?'auto':'smooth'});
  });
  window.addEventListener('scroll',function(){if(!ticking){requestAnimationFrame(update);ticking=true;}},{passive:true});
  btn.classList.toggle('is-on',lastY>600);
})();

/* Mobile quick CTA — approved Opt 1: Call · Book Now · Instagram.
   Injected from shared chrome so every synchronized page gets one identical dock
   without duplicating markup across page files. booking-form.js runs after this
   file and binds the center link through data-open-booking. */
(function(){
  if(document.querySelector('.m-quick-cta')) return;
  var dock=document.createElement('nav');
  dock.className='m-quick-cta';
  dock.setAttribute('aria-label','Quick contact');
  dock.innerHTML=''
    +'<a class="m-quick-cta__icon" href="tel:+12109979737" aria-label="Call Hyper Inkers">'
    +  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.5 15.5 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"/></svg>'
    +'</a>'
    +'<a class="m-quick-cta__book" href="#book" data-open-booking>'
    +  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v3M17 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 13h2v2H8zM14 13h2v2h-2zM8 17h2v2H8zM14 17h2v2h-2z" class="m-quick-cta__calendar-dates"/></svg>'
    +  '<span><strong>Book Now</strong><small>Free consultation</small></span>'
    +'</a>'
    +'<a class="m-quick-cta__icon" href="https://www.instagram.com/hyperinkers/" target="_blank" rel="noopener" aria-label="Hyper Inkers on Instagram">'
    +  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-3.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" clip-rule="evenodd"/></svg>'
    +'</a>';
  document.body.appendChild(dock);
})();
