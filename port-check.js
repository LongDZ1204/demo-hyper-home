/* ============================================================================
   HYPER INKERS — MÁY GÁC PORT.  Dán vào browser_evaluate của Playwright.

   Vì sao có file này: 16 lỗi ở artists.html + artist-detail.html (10-11/08)
   thì 14 lỗi là CHÉP THẲNG TỪ MOCKUP QUA, không phải lỗi mới sinh ra. Bộ đo cũ
   chỉ kiểm phần ĐƯỜNG ỐNG (nạp đủ 8 CSS, 3 JS defer, 0 style inline, header
   dùng chung) — tức là "trang có vào khung dựng chưa", KHÔNG kiểm "trang có ra
   cùng số đo với trang chủ chưa". Mọi lỗi B.Long bắt được đều là một con số
   LỆCH SO VỚI TRANG CHỦ, mà đem diff là lộ ngay.

   Ba luật của file này:
     1. Đo ở 3 bề ngang (1440 · 820 · 430). 6/16 lỗi chỉ hiện ở ≤600px.
     2. So với TRANG THAM CHIẾU (index.html), không tự so với chính mình.
     3. Trả VERDICT (danh sách FAIL), không trả bãi số. Đã có án lệ tự đọc sót
        `align:"left"` nằm ngay trong output của chính mình.

   Cách chạy: xem cuối file.
   ============================================================================ */
(function(){

/* nội dung file CSS, đọc 1 lần dùng lại cho mọi bề ngang */
const NGUON_CSS = new Map();

/* ---- đo 1 trang trong iframe, ở 1 bề ngang ---- */
async function scan(path, W){
  let out_cssSanSang = false;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(host);
  const f = document.createElement('iframe');
  f.style.cssText = `width:${W}px;height:900px;border:0`;
  const t = String(Math.round(performance.now()));
  f.src = path + '?pc=' + t;
  host.appendChild(f);
  await new Promise(r => { f.onload = r; setTimeout(r, 9000); });

  const d = f.contentDocument, w = f.contentWindow;
  /* BẮT BUỘC: ép nạp lại stylesheet. Trình duyệt giữ cache file <link> kể cả
     khi server trả no-store, nên đã có lần đo trên CSS CŨ rồi báo "đã sửa". */
  [...d.querySelectorAll('link[rel=stylesheet]')].forEach((l,i) => {
    l.href = l.href.split('?')[0] + '?pc=' + t + i;
  });
  /* Đổi href xong thì sheet cũ bị thay bằng sheet MỚI CHƯA NẠP: cssRules rỗng
     mà KHÔNG ném lỗi. Chờ cứng 2,5s là ăn may — có lần 3 file _foundation chưa
     kịp nạp nên máy gác báo nhầm "component chung không rõ file nào". Poll cho
     tới khi mọi sheet có luật, tối đa 8s. */
  const sanSang = async () => {
    for (let i = 0; i < 80; i++){
      const chua = [...d.querySelectorAll('link[rel=stylesheet]')].filter(l => {
        try { return !l.sheet || !l.sheet.cssRules || !l.sheet.cssRules.length; }
        catch(e){ return true; }
      });
      if (!chua.length) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  };
  out_cssSanSang = await sanSang();
  w.dispatchEvent(new Event('resize'));
  await new Promise(r => setTimeout(r, 600));

  const cs  = (e,p) => w.getComputedStyle(e).getPropertyValue(p);
  const vis = e => e.offsetParent !== null;
  const B   = e => e.getBoundingClientRect();
  const lines = el => {                       // số dòng + biên trái/phải THẬT của chữ
    const r = d.createRange(); r.selectNodeContents(el);
    const rs = [...r.getClientRects()].filter(z => z.width > 1);
    if (!rs.length) return null;
    return { n: new Set(rs.map(z => Math.round(z.top))).size,
             L: Math.round(Math.min(...rs.map(z => z.left))),
             R: Math.round(Math.max(...rs.map(z => z.right))) };
  };

  const heads = [...d.querySelectorAll('.section-head,.section-head--editorial')].filter(vis);
  const out = { path, W, head: [], lead: [] };
  out.cssSanSang = out_cssSanSang;

  heads.forEach(h => {
    const sec  = h.closest('section');
    const id   = (sec && (sec.id || sec.className.split(' ').filter(Boolean).pop())) || '?';
    const wrap = h.closest('.wrap');
    const cot  = wrap ? { L: Math.round(B(wrap).left  + parseFloat(cs(wrap,'padding-left'))),
                          R: Math.round(B(wrap).right - parseFloat(cs(wrap,'padding-right'))) } : null;
    const hd   = h.querySelector(':scope > h1,:scope > h2,:scope > h3');
    const p    = [...h.children].find(e => e.tagName === 'P');
    const nx   = h.nextElementSibling;
    const lech = (b) => (b && cot) ? Math.round(((b.L - cot.L) - (cot.R - b.R)) / 2) : null;

    out.head.push({
      sec: id,
      align: cs(h,'text-align'),
      giua: h.classList.contains('center'),
      coLink: !!h.querySelector('.sec-link'),
      khe: nx ? Math.round(B(nx).top - B(h).bottom) : null,
      mb: nx ? Math.round(parseFloat(cs(h,'margin-bottom'))) : null,
      nxMt: nx ? Math.round(parseFloat(cs(nx,'margin-top'))) : null,
      mienKhe: h.hasAttribute('data-gap-ok'),
      mienNen: h.hasAttribute('data-clamp-off'),
      lechHead: hd ? lech(lines(hd)) : null
    });

    if (p) {
      const txt = p.querySelector('.lead-txt') || p;
      const m   = p.querySelector('.lead-more');
      const li  = lines(txt);
      out.lead.push({
        sec: id, nen: p.classList.contains('has-clamp'),
        mienNen: h.hasAttribute('data-clamp-off'),
        soDongCSS: parseInt(cs(txt,'-webkit-line-clamp'),10) || null,
        soDongThat: li ? li.n : null,
        lechLead: lech(li),
        muiTen: m ? cs(m,'opacity') : null,
        coNoiDungDuoi: !!nx
      });
    }
  });

  /* --- các phép đếm toàn trang --- */
  out.leadLines = parseInt(cs(d.documentElement,'--lead-lines'),10) || null;
  out.token = Math.round(parseFloat(cs(d.documentElement,'--gap-head-body'))) || null;

  out.phuManHinh = [...d.querySelectorAll('body *')].filter(e => {
    const s = w.getComputedStyle(e);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
    const r = B(e);
    return s.position === 'fixed' && r.width >= W * 0.9 && r.height >= 800;
  }).map(e => (e.className || e.tagName).toString().split(' ')[0]);

  /* họ chân slider = mỗi tiền tố `xxx-` trước foot/nav/track/thumb/prog.
     Trang chủ có 3 họ và tất cả sống ở _foundation/. Page nào ra nhiều hơn là
     đã tự vẽ lại một cái chân slider nữa. */
  const hoTrenDOM_full = [...new Set([...d.querySelectorAll('[class]')].flatMap(e => [...e.classList]))];
  const hoTrenDOM = [...new Set([...d.querySelectorAll('[class]')]
    .flatMap(e => [...e.classList])
    .map(c => (c.match(/^([a-z]+)-(foot|nav|track|thumb|prog[a-z-]*)$/) || [])[1])
    .filter(Boolean))].sort();
  /* Câu hỏi đúng KHÔNG phải "trang chủ có họ này không" mà là "họ này được ĐỊNH
     NGHĨA ở đâu". Bản đầu so với trang chủ nên báo nhầm họ `rv` là lạ, trong khi
     nó là component chung — chỉ vì trang chủ để review chạy chế độ chấm nên
     .rv-foot không có mặt trong DOM của nó. Nay dò thẳng styleSheets. */
  /* Hỏi "họ này ĐỊNH NGHĨA ở file nào" — đọc thẳng NỘI DUNG file, không đọc
     CSSOM. Đã thử qua document.styleSheets 2 lần và cả 2 lần đều sai lúc-có-
     lúc-không: đổi href để phá cache thì trình duyệt thay sheet, giữa lúc thay
     thì cssRules rỗng mà không ném lỗi, nên cùng một luật lúc thấy lúc không.
     Đọc file bằng fetch thì kết quả không phụ thuộc thời điểm đo. */
  const hrefs = [...d.querySelectorAll('link[rel=stylesheet]')].map(l => l.href.split('?')[0]);
  for (const h of hrefs){
    if (NGUON_CSS.has(h)) continue;
    try { NGUON_CSS.set(h, await (await fetch(h + '?src=' + Date.now())).text()); }
    catch(e){ NGUON_CSS.set(h, ''); }
  }
  out.hoChan = hoTrenDOM.map(fam => {
    /* Khai ĐÈ = selector chỉ gồm đúng class chung (`.msl-foot{`).
       Compound có class riêng của page (`.msl-foot.tl-foot{`) là BIẾN THỂ hợp lệ
       — bộ chuẩn cho phép, nên không tính. Phân biệt bằng ký tự ngay sau tên. */
    const deDe = new RegExp('\\.' + fam + '-(foot|nav|navbtn|btn|track|thumb|prog)\\s*[,{]');
    const nguon = new Set();
    hrefs.forEach(h => {
      if (deDe.test(NGUON_CSS.get(h) || ''))
        nguon.add(h.includes('/_foundation/') ? 'chung' : 'page');
    });
    const coNav = hoTrenDOM_full.some(c => c === fam + '-nav' || c === fam + '-navbtn');
    return { fam, coNav, nguon: [...nguon].sort().join('+') || 'khong-thay' };
  });

  out.h3HaiMau = [...d.querySelectorAll('h3,h4,h5,h6')]
    .filter(h => vis(h) && h.querySelector('.o') && cs(h,'color') !== cs(h.querySelector('.o'),'color')).length;

  out.cumCam = [...d.querySelectorAll('h1,h2')].filter(vis).map(h => {
    const o = h.querySelector('.o'); if (!o) return null;
    return { cam: o.textContent.trim(), soTu: o.textContent.trim().split(/\s+/).length,
             full: h.textContent.trim().slice(0,70) };
  }).filter(Boolean);

  out.css = [...d.querySelectorAll('link[rel=stylesheet]')].map(l => l.href.split('/').pop().split('?')[0]);
  out.js  = [...d.querySelectorAll('script[src]')].map(s => ({ f: s.src.split('/').pop(), defer: s.defer }));
  out.styleInline = d.querySelectorAll('style').length;
  out.tranNgang   = d.documentElement.scrollWidth > W + 1;
  out.anhHong     = [...d.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length;
  out.linkRong    = d.querySelectorAll('a[href="#"],a:not([href])').length;

  f.remove(); host.remove();
  return out;
}

/* ---- chấm: trả về danh sách FAIL, không trả bãi số ---- */
function cham(page, ref){
  const F = [], W = page.W;
  const add = (ma, msg) => F.push(`[${ma}] ${W}px · ${msg}`);

  /* A · khung dựng — so DANH SÁCH file với trang tham chiếu */
  /* So theo VAI TRÒ: 7 file dùng chung phải đúng thứ tự, khe số 7 là CSS riêng
     của page (tên khác nhau là đương nhiên — bản đầu so nguyên tên nên page nào
     cũng FAIL vì artist-detail.css ≠ home.css). */
  const KHUNG = ['hyperinkers-fonts.css','hi-foundation.css','hi-base.css','hi-chrome.css',
                 'booking-section.css','hi-components.css', null, 'hi-ds.css'];
  KHUNG.forEach((f, i) => {
    if (f === null){
      if (!page.css[i] || !/^[a-z-]+\.css$/.test(page.css[i]))
        add('A1', `khe CSS số ${i+1} phải là file riêng của page, đang là "${page.css[i]}"`);
    } else if (page.css[i] !== f){
      add('A1', `CSS số ${i+1} phải là ${f}, đang là "${page.css[i] || '(thiếu)'}"`);
    }
  });
  if (page.css.length !== KHUNG.length) add('A1', `nạp ${page.css.length} CSS, chuẩn là ${KHUNG.length}`);
  if (page.js.some(s => !s.defer)) add('A2', 'có script src không defer');
  if (page.styleInline) add('A3', `còn ${page.styleInline} khối <style> viết tay`);

  /* A5 · phần tử fixed phủ kín màn — án lệ .stickybar trùng tên component chung */
  page.phuManHinh.forEach(c => add('A5', `"${c}" là phần tử fixed phủ kín màn hình — nghi trùng tên class với _foundation/`));

  /* A6 · khe head → nội dung: trong 1 page phải đồng nhất VÀ bằng trang chủ */
  /* Khe = margin-bottom của head + margin-top của khối kế. Chấm TỪNG VẾ thì mới
     chỉ được đúng chỗ phải sửa; đo khe thô chỉ báo "38 khác 34" mà không nói vì
     sao. Head khai data-gap-ok="lý do" thì miễn (layout chia đôi, v.v.). */
  page.head.forEach(h => {
    if (h.mb === null || h.mienKhe) return;
    if (page.token && h.mb !== page.token)
      add('A6', `#${h.sec} head tự khai margin-bottom ${h.mb}px, token --gap-head-body là ${page.token}px`);
    if (h.nxMt) add('A6', `#${h.sec} khối ngay sau head tự thêm margin-top ${h.nxMt}px — khe thành ${h.khe}px`);
  });

  /* C1 · trục căn của head — có link thì trái, không link thì giữa */
  page.head.forEach(h => {
    if (!h.coLink && h.giua && h.align !== 'center')
      add('C1', `#${h.sec} head không có link mà căn "${h.align}"`);
    if (h.coLink && h.align === 'center')
      add('C1', `#${h.sec} head CÓ link mà vẫn căn giữa`);
    if (h.giua && h.align === 'center' && h.lechHead !== null && Math.abs(h.lechHead) > 2)
      add('C1', `#${h.sec} head căn giữa nhưng lệch tâm ${h.lechHead}px`);
  });

  /* C4 · cụm cam 1 từ — cảnh báo để ĐỌC, không tự kết luận đúng sai */
  page.cumCam.filter(c => c.soTu === 1).forEach(c =>
    add('C4?', `cụm cam 1 từ "${c.cam}" trong "${c.full}" — đọc lại: có phải cụm từ khoá trọn nghĩa không`));

  /* C8 · h3 trở xuống không chữ 2 màu */
  if (page.h3HaiMau) add('C8', `${page.h3HaiMau} heading h3+ dùng chữ 2 màu`);

  /* D0 · lead có nội dung bên dưới thì phải có bộ nén */
  page.lead.forEach(l => {
    if (l.coNoiDungDuoi && !l.nen && !l.mienNen)
      add('D0', `#${l.sec} lead có nội dung bên dưới mà THIẾU bộ nén (cố ý thì khai data-clamp-off="lý do" trên head)`);
    if (l.nen && l.soDongCSS !== page.leadLines)
      add('D1', `#${l.sec} nén ${l.soDongCSS} dòng, biến --lead-lines đang là ${page.leadLines}`);
    if (l.lechLead !== null && Math.abs(l.lechLead) > 2) {
      const h = page.head.find(x => x.sec === l.sec);
      if (h && h.giua) add('D3', `#${l.sec} head căn giữa nhưng hộp đoạn dẫn lệch tâm ${l.lechLead}px`);
    }
    if (l.nen && l.muiTen === '1' && l.soDongThat <= (l.soDongCSS || 2))
      add('D1', `#${l.sec} mũi tên hiện mà chữ chỉ ${l.soDongThat} dòng`);
  });

  /* E · họ chân slider — nhiều hơn trang chủ = đã tự vẽ lại */
  if (!page.cssSanSang) add('A0', 'CSS chưa nạp xong khi đo — kết quả KHÔNG tin được, chạy lại');
  page.hoChan.filter(h => h.nguon !== 'chung').forEach(h => {
    /* Có nav = chân slider đầy đủ (‹ › + thanh) → phải ở tầng chung, FAIL.
       Chỉ track/thumb = thanh tiến độ lẻ (marquee, dải số) → cảnh báo để đọc. */
    const oDau = h.nguon === 'page'       ? 'CHỈ ở _pages/, chưa lên tầng chung'
               : h.nguon === 'chung+page' ? 'ở tầng chung NHƯNG _pages/ khai đè lên'
               : 'không tìm thấy luật nào định nghĩa nó';
    if (h.coNav) add('E1', `chân slider "${h.fam}-*" định nghĩa ở ${oDau} — chuyển sang _foundation/ hoặc dùng .msl-* / .rv-* sẵn có`);
    else add('E1?', `thanh tiến độ "${h.fam}-*" (không có nút ‹ ›) định nghĩa ở ${oDau} — đọc xem có gộp về .msl-track được không`);
  });

  /* H · vệ sinh */
  if (page.tranNgang) add('H1', 'tràn ngang');
  if (page.anhHong)   add('H2', `${page.anhHong} ảnh hỏng`);
  if (page.linkRong)  add('H3', `${page.linkRong} link rỗng href="#"`);
  return F;
}

/* ---- chạy 1 page ở 3 bề ngang, so với index.html ---- */
window.portCheck = async function(path, refPath){
  refPath = refPath || '/index.html';
  const BE_NGANG = [1440, 820, 430];
  const loi = [], soDo = {};
  for (const W of BE_NGANG){
    const ref  = await scan(refPath, W);
    const page = await scan(path, W);
    soDo[W] = page;
    loi.push(...cham(page, ref));
  }
  /* C1-chéo: trục căn phải giống nhau ở mọi bề ngang */
  const truc = {};
  BE_NGANG.forEach(W => soDo[W].head.forEach(h => {
    (truc[h.sec] = truc[h.sec] || {})[W] = h.align;
  }));
  Object.entries(truc).forEach(([sec, m]) => {
    if (new Set(Object.values(m)).size > 1)
      loi.push(`[C1x] #${sec} đổi trục căn theo bề ngang: ` +
        Object.entries(m).map(([w,a]) => `${w}px=${a}`).join(' · '));
  });

  /* Cảnh báo (mã có "?") KHÔNG tính FAIL — máy không kết luận được, nhưng vẫn
     phải hiện để mình đọc bằng mắt. Gộp trùng vì chúng không đổi theo bề ngang. */
  const boDauBeNgang = x => x.replace(/^(\[[^\]]+\]) \d+px · /, '$1 ');
  const canhBao = [...new Set(loi.filter(x => /^\[[A-Z]\d*\?\]/.test(x)).map(boDauBeNgang))];
  const that    = loi.filter(x => !/^\[[A-Z]\d*\?\]/.test(x));
  return { page: path, ket: that.length ? 'FAIL' : 'PASS',
           soLoi: that.length, loi: that,
           soCanhBao: canhBao.length, canhBao };
};

})();

/* ============================================================================
   CÁCH CHẠY (Playwright · browser_evaluate):

     1. Mở bất kỳ trang nào cùng origin:  http://127.0.0.1:8300/index.html
     2. Dán TOÀN BỘ file này vào browser_evaluate  → đăng ký window.portCheck
     3. Gọi:   () => window.portCheck('/tattoo.html')

   Trả về { ket: 'PASS' | 'FAIL', soLoi, loi: [...] }.
   FAIL thì sửa rồi chạy lại — KHÔNG trình bài khi còn FAIL.

   Mã lỗi tra ngược về bảng luật trong
   projects/hyper-inkers/outputs/onpage-design/2026-08-10_page-consistency-standard.md

   Mục có dấu "?" (C4?) là CẢNH BÁO PHẢI ĐỌC BẰNG MẮT, máy không tự kết luận
   được — nhưng nó bắt mình phải đọc, thay vì để lọt như 7 h2 của trang Minh.
   ============================================================================ */
