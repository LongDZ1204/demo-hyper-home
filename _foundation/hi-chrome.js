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

/* Mobile accordion: 2 levels (desktop keeps hover flyout) */
(function(){
  var mq=window.matchMedia('(max-width:940px)');
  document.querySelectorAll('.has-drop > .navlink').forEach(function(a){
    a.addEventListener('click',function(e){
      if(!mq.matches) return;
      e.preventDefault();
      var li=a.parentElement, was=li.classList.contains('open');
      document.querySelectorAll('.has-drop.open').forEach(function(o){if(o!==li)o.classList.remove('open');});
      li.classList.toggle('open',!was);
    });
  });
  document.querySelectorAll('.has-sub > a').forEach(function(a){
    a.addEventListener('click',function(e){
      if(!mq.matches) return;
      e.preventDefault();
      a.parentElement.classList.toggle('open');
    });
  });
  mq.addEventListener('change',function(){document.querySelectorAll('.open').forEach(function(o){o.classList.remove('open');});});
})();

(function(){
  var btn=document.querySelector('.to-top'); if(!btn) return;
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function toggle(){ btn.classList.toggle('is-on', window.scrollY>600); }
  btn.addEventListener('click', function(){ window.scrollTo({top:0, behavior:rm?'auto':'smooth'}); });
  window.addEventListener('scroll', toggle, {passive:true});
  toggle();
})();
