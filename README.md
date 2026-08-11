# Hyper Inkers — bản dựng demo

Demo tĩnh để khách và dev xem toàn bộ hiệu ứng, nhịp trang và hệ thống thiết kế trước khi lên WordPress.
Xuất bản qua GitHub Pages: <https://longdz1204.github.io/demo-hyper-home/>

## Sửa ở đâu

| Muốn đổi | Sửa file |
|---|---|
| Màu, khoảng cách, cỡ chữ, nút, mũi tên nén — **toàn site** | `_foundation/hi-ds.css` |
| **Artists · Services · Awards · Reviews · slider mobile · pill-nav · Visit · CTA feeder · FAQ · Gallery** — *kiểu dáng* | `_foundation/hi-components.css` + `hi-components.js` |
| **Nội dung thẻ** của 4 component đó (tên artist, chữ trên thẻ dịch vụ, review, giải) | `_partials/comp-*.html` → chạy `python3 build.py` |
| Header, footer, promo bar, nút lên đầu trang — **kiểu dáng** | `_foundation/hi-chrome.css` |
| Header, footer — **nội dung / link** | `_partials/header.html`, `_partials/footer.html` → chạy `python3 build.py` |
| Biến gốc (`--orange`, `--wrap`…), reset | `_foundation/hi-base.css` |
| Riêng một page | `_pages/<page>.css` |
| Form đặt lịch | `_foundation/components/booking-section.css` (nhúng) · `booking-form.css` (popup) |

**Trang chủ là bản chuẩn.** Page khác dùng lại component y nguyên, KHÔNG khai lại
trong `_pages/<page>.css`. Muốn một page khác đi thì thêm class biến thể
(vd `.awrail--compact`), KHÔNG đè trần lên class gốc — đè trần là cách 2 bản trôi khỏi nhau.

**Chung CSS thôi chưa đủ.** Bài học 2026-08-10: CSS đã giống hệt mà 2 trang vẫn khác nhau,
vì HTML khác (anchor dài ngắn khác, chip style 1 hay 2 cái, số card). Nên THÂN của
component nằm ở `_partials/comp-*.html` và bơm bằng `build.py`. Page chỉ tự viết
`section-head` (H2 + intro + link) — phần thân thì dùng chung, không chép tay.

`_foundation/hi-foundation.css` **đang khoá** — không sửa.

## 3 hành vi dùng chung toàn site

Đặt ở lớp chung nên page nào đã port là có ngay, page chưa port nhận khi port.

**Chrome trốn khi cuộn xuống.** Cuộn xuống ẩn CẢ promo bar + header, cuộn lên hiện lại,
cả desktop lẫn mobile. Cờ là class `.chrome-off` trên `<html>` (không phải trên `.hdr`) —
để thanh dính ở giữa trang cũng đọc được trạng thái. `.hdr` nằm ở `top:var(--promo-h)` nên
muốn giấu hết phải `translateY(calc(-100% - var(--promo-h)))`, thiếu vế sau là hở đúng
một dải bằng promo bar. Mở drawer mobile thì chrome bật lại (drawer chừa sẵn padding-top
bằng chrome, header trốn thì đầu drawer rỗng một mảng).

Rời khỏi đỉnh trang thì `<html>` thêm `.scrolled` → header đổi sang **nền đặc**. Ở đỉnh nó
trong suốt để đè lên ảnh hero, nhưng lúc hiện lại giữa vùng nội dung dày mà vẫn trong suốt
thì chữ trang đâm xuyên chữ menu.

**Thanh dính luân phiên với chrome.** Gắn class `.stickybar` cho thanh nào cần dính
(hiện có thanh lọc trang awards). Còn trong mạch trang thì hiện bình thường; khi đã bám
lên đỉnh mà chrome đang hiện thì thanh trốn — không để 2 thanh chồng nhau ăn hết màn hình.
JS chèn một mốc vô hình cao 1px ngay trước thanh và quan sát bằng `IntersectionObserver`
để biết lúc nào là "đã dính"; **không đo trực tiếp thanh** vì lúc bị ẩn nó đã dịch
`transform`, toạ độ không còn tin được.

**Gallery bấm vào xem full + qua lại.** Nút trái/phải, số đếm `5 / 19`, phím ←/→, Esc,
vuốt ngang trên mobile. Danh sách để lướt là các ô **đang hiện** — đổi pill là đổi danh
sách, đúng nghĩa "qua lại trong cùng mục". Nút + số đếm do `hi-components.js` tự dựng nếu
page chưa có, nên 4 trang gallery không phải sửa HTML rồi lệch nhau.

## Thứ tự nạp CSS (quan trọng)

```html
fonts → hi-foundation.css → hi-base.css → hi-chrome.css
      → components/booking-section.css → hi-components.css
      → _pages/<page>.css → hi-ds.css
```

JS: `hi-chrome.js` → `hi-components.js` → `hi-ds.js` (đều `defer`, cuối `<body>`).

`hi-ds.css` **phải nạp cuối cùng**. Lớp này cố tình ghi đè giá trị lẻ của từng component;
đưa lên trước CSS của page là nó thua cascade và mọi thứ âm thầm về như cũ.

## build.py

```bash
python3 build.py                       # bơm _partials vào mọi page
python3 build.py --check               # chỉ báo page nào lệch, không ghi (dùng cho CI)
python3 build.py --publish /duong/dan  # bơm rồi rsync sang thư mục khác
```

Script thay phần giữa 2 mốc trong page:

```html
<!-- @include header -->
<!-- /include header -->
```

Page nào chưa đặt mốc thì script báo và bỏ qua — an toàn khi port dần từng page.

Không dùng JS chèn header lúc chạy: làm vậy thì link header/footer biến mất khỏi HTML gốc,
mất tín hiệu internal link, và trang bị giật khi tải.

## Trạng thái port

Đo bằng `python3 build.py --check`: page nào đã đặt mốc `@include` là đã vào khung.

| Page | Đã dùng khung chung |
|---|---|
| `index.html` · `about.html` · `awards.html` · `soon.html` | ✅ |
| `artists.html` · `artist-detail.html` · `piercing.html` | ✅ |
| `portfolio.html` · `tattoo-gallery.html` | ✅ |
| `contact.html` · `deals.html` · `faq.html` | ✅ (11/08) |
| `blog.html` · `blog-detail.html` | ✅ (11/08) — theme nền giấy, xem dưới |
| 7 page còn lại | ⏳ vẫn dùng CSS + header riêng của từng file |

**`faq.html` là trang MỚI (11/08)**, dựng từ `outputs/onpage-design/2026-05-26_faq-page-mockup-v2.html`.
Mục FAQ ở menu header và cột Explore của footer trước đây trỏ `soon.html`, nay trỏ trang thật.
Mockup dùng tab `<button>` + JS và accordion `<button>` + JS; bản port đổi sang bộ radio thuần CSS
`.faqtab` + `.faqacc` của tầng chung — chính comment trong mockup ghi nó nhắm vào bộ đó.
Thứ duy nhất phải viết thêm là 12 dòng JS nối `#tattoo` / `#piercing` / `#removal` với radio, vì
radio thuần CSS không biết gì về URL mà B.Long đang dùng link có neo để gửi thẳng tới một chủ đề.

**`blog.html` + `blog-detail.html` là hai page NỀN GIẤY duy nhất (11/08).** 19 page kia nền
`#0F0F0F`; hai page này nền kem `#F8F5EC`. Không phải lỗi tải CSS — hai mockup cố ý đặt vậy.
B.Long chốt giữ nền sáng, nên nó thành một **theme** thật: bộ `--paper-*` ở `hi-ds.css`, bật bằng
`body class="paper-page"`. Hai bộ tên cũ `--blog-*` và `--detail-*` (cùng vai trò, đã bắt đầu trôi
màu: chữ phụ `#5D5A53` vs `#68635A`) gộp làm một.

Ba cái bẫy của theme này, ai đụng vào sau nhớ:

1. **Cam brand `#CC6600` KHÔNG đạt tương phản trên nền giấy** — 3,52:1, dưới ngưỡng AA 4,5:1 cho
   chữ thường. Nên có `--paper-orange:#A85300` (4,94:1) dành riêng cho **chữ nhỏ**: link thân bài,
   nhãn, chữ phụ. Heading lớn vẫn giữ cam brand vì chữ ≥24px chỉ cần 3:1. Hai sắc không đổi chỗ
   được cho nhau: `#A85300` trên nền tối chỉ đạt 3,89:1.
2. **Component của tầng chung tô cho nền ĐEN.** `.crumb` chữ cream + bóng đen, `.msl-navbtn` chữ
   cream nền trắng 3%, `.msl-track` ray trắng 14% — đặt nguyên lên nền kem là tàng hình. Lớp da đảo
   màu nằm trong khối `.paper-page ...` ở cuối `hi-ds.css`, KHÔNG để ở `_pages/` (máy gác
   `port-check.js` luật [E1] cấm page khai đè lên component chung).
3. **Bộ reset chung thiếu `height:auto`** — chỉ có `img{display:block;max-width:100%}`. Ảnh nào có
   thuộc tính `width`/`height` trong HTML thì thuộc tính `height` thành gợi ý trình bày và đè luôn
   `aspect-ratio`. Đo thật: ảnh khuyến mãi 2000x2500 nở ra `338x2500` thay vì `338x423`, đẩy cột
   phải dài gấp sáu lần bài viết. Không số đo nào báo ngoài chiều cao — chỉ lộ khi NHÌN ảnh chụp.
   Mọi ảnh có `width`/`height` phải tự khai `height:auto`.

**Dàn ý heading của hai page blog — bản chốt B.Long 11/08.** Không suy từ cỡ chữ, mà từ
"cái gì là một mục người đọc đi tìm":

| | `blog.html` | `blog-detail.html` |
|---|---|---|
| H1 | Blog Hub | tên bài |
| H2 | 3 sub-hub: Tattoo · Piercing · Tattoo Removal | mục thân bài + Related Posts |
| H3 | mọi tiêu đề bài trong Featured + Latest | mục con thân bài (2.1, 2.2) |
| KHÔNG heading | "Featured Articles" · "Latest Posts" · CTA | tiêu đề 5 thẻ Related · thẻ khuyến mãi · CTA |

Hệ quả phải biết trước: ở hub, **H2 nhỏ hơn H3** — chip sub-hub 12,5px trong khi tiêu đề bài
25px. Máy soát báo `C2 ✗` đúng, đây là carve-out có chủ đích chứ không phải lỗi sót. Muốn cỡ chữ
đi cùng chiều với dàn ý thì phải hạ tiêu đề bài xuống không-heading, như đã làm với thẻ Related
bên detail.

**Thang cấp bậc thân bài `blog-detail`** (chốt cùng lượt): H1 60px cam → H2 44px đen → H3 26px đen
→ thân bài 18px. H1 là cấp **duy nhất** tô cam: cam ở nhiều cấp thì hết là dấu hiệu. H3 nâng từ
20px lên 26px vì 20px chỉ hơn thân bài 2px, đọc lướt không nhận ra là heading. Anchor thân bài
gạch chân LUÔN hiện (màu không được là dấu hiệu duy nhất) và rê chuột thì dày gạch lên chứ không
đổi màu. Bullet một kiểu duy nhất: chấm tròn cam 7px, dùng chung cho `.key-facts` và `<ul>` thường;
`<ol>` giữ số, chỉ tô cam phần số.

**`piercing-gallery.html` và `removal-gallery.html` đã gỡ khỏi demo ngày 11/08** (B.Long chốt).
Layout của chúng không khác `tattoo-gallery.html` một điểm nào, nên khi cần dựng lại thì **chép từ
trang tattoo rồi thay ảnh + nhãn pill**, không thiết kế lại. Trong lúc chưa có, mọi link trỏ tới
chúng — menu Gallery ở header, danh sách trong `soon.html` — đã chuyển về `soon.html`.
Bản cuối cùng của 2 file nằm trong lịch sử git, commit `f351511`.

**FAQ có 2 tầng dùng chung**: `.faqtab-nav` (thanh chủ đề) + `.faqacc` (accordion). Page ít câu
hỏi thì bỏ tab, dùng thẳng `.faqacc` trong `.wrap` — vẫn ăn đúng khổ 840px và cỡ chữ.
5 page chưa port (`tattoo`, `piercing`, `black-and-grey`, `ear-piercing`, `tattoo-removal`)
còn dùng accordion `.faq-*` đời cũ, đổi sang `.faqacc` khi port.

**Section chứa `.stickybar` không được để `overflow:hidden`.** Nó giết `position:sticky` mà giết
rất êm: class `.is-stuck` vẫn bật đúng (mốc `IntersectionObserver` không liên quan tới overflow),
chỉ có thanh là trôi mất. Đo trên `tattoo-gallery`, cuộn tới giữa vùng thẻ cha:
`hidden` → `top -450px` · `clip` → `top 0` · `visible` → `top 0`. Dùng `clip` — cắt gọn mà không
tạo khung cuộn. Hệ quả cho người soát: **luật F1 phải đo `getBoundingClientRect().top` của thanh**,
đo bằng `classList.contains('is-stuck')` thì page hỏng vẫn báo đạt.

## Cách kiểm chứng khi port một page

Chụp dấu vân tay computed-style ở 1440 và 430 → tách CSS → chụp lại → phải **0 khác biệt**.
Hai cái bẫy đã dính:

- **Cache**: đổi CSS mà browser vẫn giữ bản cũ. Thêm `?v=n` vào URL chỉ nạp lại HTML,
  file CSS vẫn lấy từ cache. Phải thay `<link>` bằng bản có query mới thì mới chắc.
- **`margin` shorthand không so được**: Chrome trả `auto` hay số (`25px`) tuỳ thời điểm đọc,
  nên chênh lệch margin trong bảng vân tay là ảo. So `margin-top/left/right` riêng lẻ,
  hoặc bỏ `margin` khỏi bộ thuộc tính đo.
- **Tách CSS mockup: cùng selector KHÔNG có nghĩa là cùng luật.** Bộ tách phải chia BA rổ —
  selector không có ở `_foundation` thì giữ; có mà **thân luật giống hệt** thì bỏ (bản sao thật);
  có mà **thân luật khác** thì giữ VÀ in ra để soát tay, vì đó vừa có thể là ghi đè cố ý vừa có
  thể là số đã trôi. Lần đầu chạy, bộ lọc chỉ so tên đã nuốt mất 14 luật `.s-book` của `contact`,
  trong đó có một cái cố ý: trang chủ để card `--black` vì section của nó `#0F0F0F`, contact
  section đã là `#000` nên card phải lật màu, không lật là card tàng hình.
  Bẫy đi kèm: so thân luật phải bóc dấu cách quanh `:` `,` — mockup viết thoáng, tầng chung viết
  nén, chỉ chuẩn hoá khoảng trắng chung chung thì 13 luật giống hệt vẫn bị chấm là "khác".
- **Mockup có thể dùng bộ TÊN TOKEN riêng.** `2026-05-26_faq-page-mockup-v2.html` khai một lớp bí
  danh `--hi-orange: var(--orange)`, `--hi-bg-deep: var(--black)`… rồi dùng bí danh khắp file.
  Bỏ `:root` khi tách là 65 chỗ dùng thành vô định — luật còn nguyên nhưng giá trị rỗng, hỏng im
  lặng. Phải thay bí danh bằng giá trị nó trỏ tới TRƯỚC khi tách; làm đúng thứ tự đó thì 40 luật
  vốn trùng khít tầng chung mới lộ ra là trùng.
- **`<noscript><style>` KHÔNG được gộp vào file CSS của page.** Bộ tách gom mọi thẻ `<style>` nên
  hai luật dự phòng của FAQ (`.lead-txt{line-clamp:unset}` + `.lead-more{display:none}`) suýt nằm
  trong `_pages/faq.css` — tức nén đoạn dẫn tắt vĩnh viễn, kể cả khi có JS. Chúng phải ở nguyên
  trong thẻ `<noscript>` của HTML.
- **Hero phải tự chừa chỗ cho chrome**: promo bar và `.hdr` đều `position:fixed`, chúng
  KHÔNG chiếm chỗ trong luồng. Page nào viết `padding-top` bằng một con số cứng là sớm
  muộn cũng đè: chrome cao `--chrome-h` = 112px ở **mọi** khổ, trong khi page hay hạ
  padding xuống ở mobile cho hero đỡ chiếm màn. Viết
  `padding-top:calc(var(--chrome-h) + clamp(26px,3.4vw,52px))` thì số tự đúng, và khi
  khách bấm tắt promo bar (`hi-chrome.js` đặt `--promo-h:0`) hero tự thu lại 36px.
  Ở media query chỉ sửa `padding-bottom`, **đừng viết lại `padding` shorthand** — nó đặt
  lại cả 4 cạnh nên xoá luôn phần `calc` ở trên. Đã dính ở `portfolio` (−20px) và
  `tattoo-gallery` (−6px) tại 430.

## Link: URL thật ↔ file demo

Header/footer trong demo trỏ tới tên file để bấm được trên GitHub Pages. Khi lên WordPress,
header lấy từ theme nên dùng lại URL thật ở cột trái.

| URL thật (WordPress) | File demo |
|---|---|
| `/` | `index.html` |
| `/about-us` | `about.html` |
| `/tattoo` | `tattoo.html` |
| `/tattoo/black-and-grey` | `black-and-grey.html` |
| `/piercing` | `piercing.html` |
| `/piercing/ear-piercing` | `ear-piercing-san-antonio.html` |
| `/tattoo-removal` | `tattoo-removal.html` |
| `/artists` | `artists.html` |
| `/awards` | `awards.html` |
| `/gallery` | `portfolio.html` |
| `/gallery/tattoo` | `tattoo-gallery.html` |
| `/gallery/piercing` | `piercing-gallery.html` |
| `/gallery/tattoo-removal-before-after` | `removal-gallery.html` |
| `/testimonials`, `/reviews` | `testimonials.html` |
| `/blog` | `blog.html` |
| `/promotions` | `deals.html` |
| `/contact` | `contact.html` |

15 URL còn lại (`/faq`, `/services`, 5 style tattoo, 3 trang aftercare, 3 trang chính sách,
2 nhánh piercing) chưa có thiết kế → trỏ tạm về `soon.html`, trang này liệt kê những gì đã dựng.
Bấm vào không rơi vào 404.

## Trang thành phần

`form.html` và `nav.html` không phải page thật — là bản demo riêng của component form đặt lịch
và header, giữ để đối chiếu chuẩn.
