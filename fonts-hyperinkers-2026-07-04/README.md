# Hyper Inkers Font Export - 2026-07-04

Source checked:

- https://hyperinkers.com/
- https://hyperinkers.com/wp-content/litespeed/css/3cf91a5d9a278b6b3971ca0ef48b6b15.css?ver=b542c
- https://fonts.googleapis.com/css?family=Montserrat:100

Downloaded:

- 38 text font files in `text-fonts/`
- `hyperinkers-fonts.css` with local `@font-face` declarations

Observed usage on the homepage:

- `fonttitle`: main decorative heading/price font. The live CSS applies it to `h2` and many inline title spans.
- `fonth4`: menu, `h4`, and many paragraph blocks on the homepage.
- `ladyrose`: decorative section headings.
- `ltype`, `ltypeb`, `ltypebo`, `ltypeo`: supporting display/body variants used in inline blocks.
- `tt-runs-trial-bold`, `tt-runs-trial-demibo`, `tt-runs-trial-variab`: display accents and CTA-style text.
- `Gilroy`: blog/article content and child-theme custom classes.
- `Compagnon Medium` / `compagnon`: uploaded brand/display font variants.
- `Montserrat Hyper Popup`: pulled from Google Fonts for popup theme CSS only.

Not included:

- `slick` and Flatsome `fl-icons` icon fonts. They are symbol/icon fonts for sliders and theme UI, not text typography.

License note:

These files were downloaded from public font URLs used by Hyper Inkers. Keep them for internal Hyper Inkers mockups/backups unless the font license confirms broader reuse. Names such as `TT Runs Trial`, `Gilroy`, and `MyriadPro` may require separate commercial licenses.
