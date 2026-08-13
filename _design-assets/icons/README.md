# Hyper Inkers icon system

Functional icons live in `/_foundation/hi-icons.svg`. Their shared geometry and interaction rules live in `/_foundation/hi-icon.css`.

The design-system board also includes the same symbols inline. This keeps its previews visible when the HTML file is opened directly or imported into a design tool, where external SVG fragment references may be blocked. Production pages served over HTTP should use the canonical external sprite shown below.

## Usage

```html
<svg class="hi-icon hi-icon--20" aria-hidden="true">
  <use href="_foundation/hi-icons.svg#hi-icon-calendar"></use>
</svg>
```

For an icon-only button, the button needs an accessible name:

```html
<button class="hi-icon-button" type="button" aria-label="Open menu">
  <svg class="hi-icon hi-icon--24" aria-hidden="true">
    <use href="_foundation/hi-icons.svg#hi-icon-menu"></use>
  </svg>
</button>
```

## Rules

- Functional icons use a 24×24 viewBox, 2px stroke and round caps/joins.
- Use 16px for compact metadata, 20px inline, 24px for controls and 32px for feature icons.
- Keep interactive targets at least 44×44px even when the visible icon is smaller.
- Icons inherit `currentColor`; do not hard-code color inside page markup.
- Decorative icons use `aria-hidden="true"`. Meaningful icon-only controls require `aria-label`.
- Brand icons may retain solid geometry. Do not redraw payment or press marks as functional outline icons.
- Do not load icon fonts or third-party CDN libraries.

## Available IDs

### Functional

`menu`, `close`, `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `arrow-left`, `arrow-right`, `arrow-up`, `arrow-down`, `external-link`, `search`, `filter`, `plus`, `minus`, `play`, `expand`, `calendar`, `phone`, `mail`, `map-pin`, `clock`, `check`, `info`, `alert`, `upload`, `user`, `instagram`, `facebook`, `copy`, `loader`.

### Arrow roles

| Family | Use for |
|---|---|
| `arrow-*` | CTA, text link, directional action and back-to-top |
| `chevron-*` | Menu disclosure, accordion state, carousel and lightbox navigation |
| `external-link` | A card or control that opens a larger detail/evidence view |

Do not substitute Unicode arrows or page-specific path geometry for these roles.

### Hub proof and stats

| ID | Use for |
|---|---|
| `trophy` | Awards and trophies |
| `rating-star` | Customer rating only |
| `users` | Clients, piercers or specialists |
| `experience` | Combined years of experience |
| `tattoo-work` | Completed tattoo work |
| `globe` | International reach or world conventions |
| `service-grid` | Number of service or piercing types |
| `price-tag` | Starting price |
| `clipboard-check` | Free assessment or consultation |
| `shield-check` | Certification, clearance or verified equipment |

Do not reuse an icon just because its geometry is available. The proof label and icon meaning must match.
