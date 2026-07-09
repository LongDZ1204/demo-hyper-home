# HI Design-System Components

Reusable, token-locked UI blocks for section/page mockups. Each component depends
on `_foundation/hi-foundation.css` (tokens + fonts) and never redefines a token.

| Component | Files | What it is |
|---|---|---|
| **Booking form (popup)** | `booking-form.css` · `booking-form.html` · `booking-form.js` | Dark editorial booking **modal** (v7.4, 2026-07-08): Service/Artist dropdowns, sticky footer, CTA dims until required fields valid then glows. Trigger from any element via `data-open-booking`. |
| **Booking section (inline)** | `booking-section.css` · `booking-section-full.html` · `booking-section-removal.html` · `booking-section.js` | Same de-AI'd visual system, but a **static card embedded directly in a page's own `#book` section** (not a popup — always visible on scroll). Two content variants, one shared CSS/JS. |

Reference demo (popup, assembled, correct paths): `../../2026-07-08_booking-form-component-demo.html`

**Popup v7.4 behavior:** required fields = Name · Phone · Email · Service. The footer shows
"N required fields remaining" and the CTA is `disabled` + dim until all four are
valid, then the status flips to "✓ Ready to submit" and the button glows. Logic
lives in `booking-form.js` (`refresh()` via `checkValidity()`). Orange is reserved for
the title, the required `*`, the CTA, and functional links — no decorative border/tick/arrow.

**Booking section (inline) behavior:** same status-line + glow-CTA mechanic, generic
off `[required]` — `booking-section.js` works unmodified for either variant. Two
variants ship because pages don't all need the same fields:
- **Full** (`booking-section-full.html`) — Name/Phone/Email* + Date + **Service dropdown\*** +
  **Artist dropdown** + Description. Used by pages that route to multiple artists/services
  (homepage; port to `/tattoo`, `/piercing`, `/black-and-grey`, `/about-us` when needed).
- **Removal** (`booking-section-removal.html`) — Name/Phone/Email* + Date + Describe-tattoo
  only, no Service/Artist choice (the live removal page never offered one — don't add fields
  that weren't there). Used by `/tattoo-removal-san-antonio`.

**Currently applied to:**
- `2026-07-05_homepage-merged-full.html` — full variant (roster: Open to rec./Minh Pham/Tai Hoa/Mancha/Navei/Nicole, verbatim from that page's own prior content).
- `2026-07-05_tattoo-removal-page.html` — removal variant.
- Not yet ported: `2026-07-05_black-and-grey-page.html`, `2026-07-05_tattoo-page.html`,
  `2026-07-07_awards-page.html`, `2026-07-07_about-us-page.html` — these still have the
  legacy `.bk-*` inline form (orange plain labels, boxed note, dead `onsubmit="return false"`).
  Port the **full** variant to each (verify that page's own artist roster first — don't
  reuse the homepage's roster blindly).

---

## Booking form — how to embed

A section/page mockup lives in `onpage-design/`, so paths are relative to there.

**1. In `<head>` (after the foundation + fonts links):**
```html
<link rel="stylesheet" href="fonts-hyperinkers-2026-07-04/hyperinkers-fonts.css">
<link rel="stylesheet" href="_foundation/hi-foundation.css">
<link rel="stylesheet" href="_foundation/components/booking-form.css">
```

**2. Paste the modal markup ONCE**, near the end of `<body>` — copy the whole block
from `_foundation/components/booking-form.html`.

**3. Before `</body>`:**
```html
<script src="_foundation/components/booking-form.js" defer></script>
```

**4. Open it from ANY element** by adding `data-open-booking`:
```html
<button class="btn" data-open-booking>Book now</button>
<a href="#" data-open-booking>Book your appointment</a>
```
Multiple triggers on one page all work. Programmatic: `HIBooking.open()` / `HIBooking.close()`.
Closes on the × button, backdrop click, or Esc.

## Notes (popup)
- **One modal per page.** Paste the markup once; add as many triggers as needed.
- **Real submission:** the form currently shows a demo success state. Wire the POST
  (WP/CRM/webhook) inside the submit handler in `booking-form.js`.
- **Editing the design:** change values here, not inside a section file (keeps every
  page identical). Need a new foundation token? Add it in `hi-foundation.css` + ping B.Long.
- **Roster/copy** in `booking-form.html` (artists, service list, phone) is content —
  update per the live site before shipping.

---

## Booking section (inline) — how to embed

**1. In `<head>` (after the foundation + fonts links):**
```html
<link rel="stylesheet" href="_foundation/hi-foundation.css">
<link rel="stylesheet" href="_foundation/components/booking-section.css">
```

**2. Inside the page's own `<section class="section s-book" id="book">`** (keep that
page's own `<header><h2>…</h2></header>`), paste the card markup from either
`booking-section-full.html` or `booking-section-removal.html` — whichever fits the page.

**3. Before `</body>`:**
```html
<script src="_foundation/components/booking-section.js" defer></script>
```

No trigger attribute needed — unlike the popup, this renders inline wherever it's pasted.

## Notes (inline section)
- **Namespaced `.bks-*`.** Deliberately distinct from the popup's `.field-*` classes so a
  page can embed both the popup trigger AND this inline section without any CSS collision.
- **IDs are also distinct per variant** (`bks-*` for full, `bksrm-*` for removal) so a page
  embedding both this section AND the popup never gets a duplicate-ID clash.
- Same submission/token/roster caveats as the popup above.
