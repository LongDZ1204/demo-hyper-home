/* HYPER INKERS — DESIGN SYSTEM JS.
   Hiện chỉ có 1 việc: đặt mũi tên nén ở cuối dòng 2 của mọi lead khai .lead-cb.
   Mọi section mới chỉ cần đúng bộ class, không phải chép thêm JS. */
/* Clamp lead DÙNG CHUNG — 1 vòng lặp cho mọi section khai .lead-cb/.lead-txt,
   thay vì copy thêm một IIFE cho mỗi section mới. */
(function(){
  var GAP=9;   /* khoảng cách CỐ ĐỊNH từ dấu "…" tới mũi tên — desktop và mobile dùng chung 1 số */
  [].slice.call(document.querySelectorAll('.lead-cb')).forEach(function(cb){
    var box=cb.nextElementSibling; if(!box||!box.classList.contains('has-clamp')) return;
    var txt=box.querySelector('.lead-txt'), more=box.querySelector('.lead-more');
    if(!txt||!more) return;
    function ellipsisW(){var cs=getComputedStyle(txt),p=document.createElement('span');
      p.textContent='…';p.style.cssText='position:absolute;visibility:hidden;white-space:pre';
      p.style.fontFamily=cs.fontFamily;p.style.fontSize=cs.fontSize;p.style.fontWeight=cs.fontWeight;
      box.appendChild(p);var w=p.getBoundingClientRect().width;box.removeChild(p);return w;}
    /* Range KHÔNG nhìn thấy dấu "…" của line-clamp: rects lúc thu gọn giống hệt lúc mở.
       Blink đặt "…" ở cuối dòng bị cắt — còn chỗ thì nối ngay sau chữ, hết chỗ thì ăn bớt chữ
       rồi dừng đúng mép hộp. Vì vậy mép phải THẬT của "…" = min(cuối dòng + bề rộng "…", mép hộp).
       Thiếu vế min() thì gap thật chạy 2px→18px tuỳ dòng dài ngắn (đo 10 lead, 08/2026). */
    function place(){var rng=document.createRange();rng.selectNodeContents(txt);var rects=rng.getClientRects();
      if(!rects.length){more.style.opacity='0';return;}
      var open=cb.checked,clamped=(!open&&rects.length>2),
          line=rects[open?rects.length-1:Math.min(1,rects.length-1)],br=box.getBoundingClientRect(),
          inset=more.querySelector('path').getBoundingClientRect().left-more.getBoundingClientRect().left,
          tail=clamped?Math.min(line.right+ellipsisW(),txt.getBoundingClientRect().right):line.right,
          x=Math.min(tail-br.left+GAP-inset,window.innerWidth-br.left-30),y=line.top-br.top+line.height/2;
      more.style.left=x+'px';more.style.top=y+'px';more.style.opacity=(rects.length>2||open)?'1':'0';}
    var raf=function(){requestAnimationFrame(place);};
    cb.addEventListener('change',raf);
    window.addEventListener('resize',function(){clearTimeout(place._t);place._t=setTimeout(place,120);});
    window.addEventListener('load',raf);
    if(document.fonts){document.fonts.ready.then(raf);}
    [90,260,650,1400].forEach(function(ms){setTimeout(place,ms);});place();
  });
})();
