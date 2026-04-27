---
name: Digital Editorial
colors:
  paper: "#FFFFFF"
  section: "#F9FAFB"
  ink: "#1A1A1A"
  black: "#000000"
  caption: "#757575"
  disabled: "#999999"
  hairline: "#E2E8F0"
  accent: "#057DBC"
typography:
  display:
    fontFamily: Inter
    fontWeight: 800
    fontSize: "clamp(3.75rem, 9vw, 8rem)"
    lineHeight: 0.95
    letterSpacing: "-0.055em"
  h1:
    fontFamily: Inter
    fontWeight: 800
    fontSize: "clamp(3rem, 7vw, 6rem)"
    lineHeight: 1
    letterSpacing: "-0.055em"
  h2:
    fontFamily: Inter
    fontWeight: 800
    fontSize: "1.875rem"
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: Lora
    fontWeight: 400
    fontSize: "1.125rem"
    lineHeight: 1.75
  deck:
    fontFamily: Lora
    fontWeight: 400
    fontSize: "1.25rem"
    lineHeight: 1.6
  meta:
    fontFamily: JetBrains Mono
    fontWeight: 400
    fontSize: "0.75rem"
    lineHeight: 1.35
    letterSpacing: "0.095em"
    textTransform: uppercase
  kicker:
    fontFamily: JetBrains Mono
    fontWeight: 700
    fontSize: "0.75rem"
    lineHeight: 1.35
    letterSpacing: "0.095em"
    textTransform: uppercase
rounded:
  none: 0
  icon: 50%
spacing:
  hairline: 1px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 48px
layout:
  pageMaxWidth: 1280px
  articleMaxWidth: 720px
  mobilePadding: 16px
  desktopPadding: 24px
  gridMaxColumns: 3
effects:
  shadow: none
  gradients: none
  blur: navbar-only
---

## Overview

Digital Editorial for a software engineering blog. The visual identity combines
newsstand density, engineering precision and long-form reading comfort. It
should feel like a technical magazine rather than a SaaS landing page or a
documentation portal.

The page surface is intentionally flat: white paper, deep ink, strict rules,
large typography and photography. Visual hierarchy must come from type scale,
hairline borders and editorial composition — never from shadows or decorative
chrome.

## Atmosphere

The interface should evoke a printed broadsheet connected to the web: dense but
controlled, typographically loud, restrained in color and optimized for reading.
It should feel serious, technical and opinionated without becoming sterile.

Keywords:

- editorial
- printerly
- technical
- high-contrast
- restrained
- dense
- legible
- flat

## Colors

The palette is grayscale with one interactive accent.

- **Paper (#FFFFFF):** Primary canvas and article surface.
- **Section (#F9FAFB):** Extremely subtle background for secondary bands only.
- **Ink (#1A1A1A):** Main text, headlines and strong borders. Prefer this over pure black for long reading.
- **Black (#000000):** Ribbons, footer inversion and the strongest editorial rules.
- **Caption (#757575):** Dates, bylines, secondary metadata and captions.
- **Disabled (#999999):** Disabled pagination and inactive affordances.
- **Hairline (#E2E8F0):** Quiet dividers when black borders would be too strong.
- **Accent (#057DBC):** Sole interactive color for links and hover states.

Do not introduce additional interface colors. If color is needed, it should come
from photography, not UI chrome.

## Typography

Typography is role-based and should not be mixed casually.

- **Inter:** Display headings, page titles, UI labels and buttons.
- **Lora:** Body copy, summaries, decks and long-form reading.
- **JetBrains Mono:** Kickers, categories, dates, pagination and technical metadata.

Rules:

- Display text should be large, tight and bold.
- Body text should be serifed, open and comfortable.
- Mono text should be uppercase with positive tracking.
- Avoid using mono for paragraphs.
- Avoid using serif for navigation or buttons.

## Layout

The layout uses editorial grids, not floating cards.

- Page max width: `1280px`.
- Article max width: `720px`.
- Mobile padding: `16px`.
- Desktop padding: `24px`.
- Major sections should be separated by strong horizontal rules.
- Content groups may use black section ribbons with white mono uppercase labels.

Grid behavior must adapt to content quantity:

- 1 item: one column.
- 2 items: two columns on desktop.
- 3 or more items: three columns on desktop.

Never leave visually empty columns just because a grid template expects more
items than are available.

## Shape and Depth

The system is flat by default.

- Rectangular surfaces use `border-radius: 0`.
- Images use `border-radius: 0`.
- Buttons and inputs use square corners.
- Shadows are not part of the visual language.
- Gradients are not part of the visual language.

The only acceptable round shapes are circular icons or avatars. Do not round
cards, images, content panels or article containers.

## Borders and Rules

Borders are structural, not decorative.

- Use `1px` hairlines to separate editorial items and columns.
- Use `2px` black borders for strong interactive affordances.
- Prefer borders and whitespace over shadows.
- Rules should feel like magazine column dividers.

## Interaction

Interactions should be minimal and fast.

- Links hover to `#057DBC`.
- Editorial titles may underline on hover.
- Buttons invert black/white on hover.
- Images should not lift or cast shadows.
- Avoid playful easing, bounce or large transforms.

Motion should be subtle enough to disappear into the reading experience.

## Content Voice

The design supports engineering writing with editorial confidence. It should
prioritize:

- clear hierarchy
- readable long-form articles
- visible metadata
- strong categorization through mono kickers
- calm surfaces for technical examples

The site should not look like generic documentation. It should feel like a
personal technical publication.

## Implementation Guidance for Agents

Use Tailwind utilities as the primary implementation mechanism. Keep custom CSS
minimal and limited to global imports/base concerns.

When creating new screens, preserve:

- paper-white surface
- ink text
- one blue accent
- mono uppercase metadata
- serif body copy
- square corners
- no shadows
- responsive grids based on item count

If a new visual choice conflicts with this document, this document wins.
