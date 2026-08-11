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
    /* Số dòng nén đọc từ biến CSS --lead-lines, KHÔNG ghi cứng: desktop 2 · mobile 4.
       Đọc lại mỗi lần đặt lại vị trí nên xoay ngang màn hình cũng đúng. */
    function lines(){return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--lead-lines'),10)||2;}
    /* MỘT DÒNG = một mức `top`, không phải một ô rects.
       Range trả một ô cho mỗi đoạn text/thẻ con, nên một dòng có <b> cắt ngang là ra
       2-3 ô, và mép đoạn còn sinh ô rộng 0. Bản cũ đếm thẳng rects.length nên đoạn dẫn
       vừa khít mức nén vẫn bị tính là tràn → mũi tên hiện trên đoạn không có gì để mở.
       Đo được ở /piercing mục Guides: 4 dòng thật, rects trả 5. */
    function docDong(){
      var rng=document.createRange();rng.selectNodeContents(txt);
      var rs=[].slice.call(rng.getClientRects()).filter(function(z){return z.width>1;});
      var hang=[],chiSo={};
      rs.forEach(function(z){var k=Math.round(z.top);
        if(chiSo[k]===undefined){chiSo[k]=hang.length;hang.push({top:z.top,right:z.right,height:z.height});}
        else{var h=hang[chiSo[k]];h.right=Math.max(h.right,z.right);h.height=Math.max(h.height,z.height);}});
      return hang;
    }
    function place(){var rects=docDong();
      if(!rects.length){more.style.opacity='0';return;}
      var N=lines(),
          open=cb.checked,clamped=(!open&&rects.length>N),
          line=rects[open?rects.length-1:Math.min(N-1,rects.length-1)],br=box.getBoundingClientRect(),
          inset=more.querySelector('path').getBoundingClientRect().left-more.getBoundingClientRect().left,
          tail=clamped?Math.min(line.right+ellipsisW(),txt.getBoundingClientRect().right):line.right,
          x=Math.min(tail-br.left+GAP-inset,window.innerWidth-br.left-30),y=line.top-br.top+line.height/2;
      more.style.left=x+'px';more.style.top=y+'px';more.style.opacity=(rects.length>N||open)?'1':'0';}
    var raf=function(){requestAnimationFrame(place);};
    cb.addEventListener('change',raf);
    /* Bám THAY ĐỔI KÍCH THƯỚC CỦA CHÍNH HỘP CHỮ, không bám sự kiện resize cửa sổ.
       Bản cũ hoãn 120ms sau resize: đổi bề ngang xong mà đo sớm hơn ngần ấy thì
       mũi tên còn giữ trạng thái của bề ngang cũ. Đo được ở /piercing: đoạn dẫn
       mục Guides vừa đúng 4 dòng ở 430px (= mức nén, lẽ ra phải ẩn mũi tên) mà
       mũi tên vẫn hiện, vì lần đặt cuối là hồi còn 1440px. ResizeObserver bắn
       ngay khi hộp đổi cỡ nên không còn khe hở đó. */
    if(window.ResizeObserver){ new ResizeObserver(raf).observe(txt); }
    else window.addEventListener('resize',function(){clearTimeout(place._t);place._t=setTimeout(place,120);});
    window.addEventListener('load',raf);
    if(document.fonts){document.fonts.ready.then(raf);}
    [90,260,650,1400].forEach(function(ms){setTimeout(place,ms);});place();
  });
})();
