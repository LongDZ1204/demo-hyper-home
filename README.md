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

| Page | Đã dùng khung chung |
|---|---|
| `index.html` | ✅ |
| `about.html` | ✅ |
| `awards.html` | ✅ |
| `soon.html` | ✅ |
| 18 page còn lại | ⏳ vẫn dùng CSS + header riêng của từng file |

**FAQ có 2 tầng dùng chung**: `.faqtab-nav` (thanh chủ đề) + `.faqacc` (accordion). Page ít câu
hỏi thì bỏ tab, dùng thẳng `.faqacc` trong `.wrap` — vẫn ăn đúng khổ 840px và cỡ chữ.
6 page chưa port (`tattoo`, `piercing`, `portfolio`, `black-and-grey`, `ear-piercing`,
`tattoo-removal`) còn dùng accordion `.faq-*` đời cũ, đổi sang `.faqacc` khi port.

## Cách kiểm chứng khi port một page

Chụp dấu vân tay computed-style ở 1440 và 430 → tách CSS → chụp lại → phải **0 khác biệt**.
Hai cái bẫy đã dính:

- **Cache**: đổi CSS mà browser vẫn giữ bản cũ. Thêm `?v=n` vào URL chỉ nạp lại HTML,
  file CSS vẫn lấy từ cache. Phải thay `<link>` bằng bản có query mới thì mới chắc.
- **`margin` shorthand không so được**: Chrome trả `auto` hay số (`25px`) tuỳ thời điểm đọc,
  nên chênh lệch margin trong bảng vân tay là ảo. So `margin-top/left/right` riêng lẻ,
  hoặc bỏ `margin` khỏi bộ thuộc tính đo.

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
