---
name: Editorial Creme
colors:
  paper: "#F7F3EA"
  surface: "#FFFDF7"
  ink: "#171717"
  graphite: "#1B1B1F"
  muted: "#4D4D4D"
  soft: "#8B8B83"
  line: "#2A2A2A"
  hairline: "#C9C3B8"
  accent: "#263CFF"
typography:
  display:
    fontFamily: Anton
    fontWeight: 400
    fontSize: "clamp(3.75rem, 9vw, 4.625rem)"
    lineHeight: 0.94
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Anton
    fontWeight: 400
    fontSize: "clamp(2.5rem, 6vw, 3.625rem)"
    lineHeight: 0.96
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Anton
    fontWeight: 400
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  body:
    fontFamily: Newsreader
    fontWeight: 400
    fontSize: "1.125rem"
    lineHeight: 1.6
  deck:
    fontFamily: Newsreader
    fontWeight: 400
    fontSize: "clamp(1.125rem, 2vw, 1.5rem)"
    lineHeight: 1.22
  meta:
    fontFamily: Geist Mono
    fontWeight: 400
    fontSize: "0.625rem"
    lineHeight: 1.35
    letterSpacing: "0.095em"
    textTransform: uppercase
  kicker:
    fontFamily: Geist Mono
    fontWeight: 700
    fontSize: "0.625rem"
    lineHeight: 1.35
    letterSpacing: "0.12em"
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
  pageMaxWidth: 1440px
  contentMaxWidth: 1296px
  articleMaxWidth: 720px
  mobilePadding: 16px
  desktopPadding: 88px
  gridMaxColumns: 3
effects:
  shadow: none
  gradients: none
  blur: navbar-only
---

## Overview

Editorial Creme for a software engineering blog. The visual identity combines
newsstand density, engineering precision and long-form reading comfort on a warm
creme ground. It should feel like a personal technical magazine rather than a
SaaS landing page or a documentation portal.

The page surface is intentionally flat: creme paper, deep ink, strict rules,
large typography and photography. Visual hierarchy must come from type scale,
hairline borders and editorial composition — never from shadows or decorative
chrome.

## Atmosphere

The interface should evoke a printed broadsheet connected to the web: dense but
controlled, typographically loud, restrained in color and optimized for reading.
It should feel serious, editorial and opinionated without becoming sterile.

Keywords:

- editorial
- printerly
- technical
- editorial creme
- electric blue
- high-contrast
- restrained
- dense
- legible
- flat
- warm

## Colors

The palette is built on a warm creme base with one electric blue interactive
accent and a graphite ribbon for strong structural moments.

- **Paper (#F7F3EA):** Primary page background. A warm creme that replaces pure
  white for a more tactile, editorial feel.
- **Surface (#FFFDF7):** Slightly lighter background for cards, margin notes and
  inset surfaces.
- **Ink (#171717):** Main text, headlines and strong borders. A deep almost-black
  that keeps contrast high without reaching pure #000.
- **Graphite (#1B1B1F):** Primary buttons, section ribbons and the strongest
  editorial rules. Inverts with Paper.
- **Muted (#4D4D4D):** Descriptions, summaries, secondary text and bylines.
- **Soft (#8B8B83):** Dates, secondary metadata and weak captions. Intentionally
  low-contrast for tertiary information.
- **Line (#2A2A2A):** Structural borders — frames, row dividers and column rules.
- **Hairline (#C9C3B8):** Quiet dividers when line borders would be too strong.
  Used inside cards and margin notes.
- **Accent (#263CFF):** Sole interactive color for links, hover states, kickers
  and active navigation marks. Electric blue for a deliberate editorial pop.

Do not introduce additional interface colors. If color is needed, it should come
from photography, not UI chrome.

## Typography

Typography is role-based and should not be mixed casually.

- **Anton:** Display headlines, page titles, section labels and large editorial
  statements. Anton is a condensed sans-serif display face — use it for h1, h2
  and display roles only. It works well in all-caps and tight leading.
- **Newsreader:** Body copy, decks, summaries and long-form reading. A serif
  face designed for comfortable on-screen reading at text sizes.
- **Geist Mono:** Kickers, categories, dates, pagination, navigation and
  technical metadata. Always uppercase with positive tracking.

Rules:

- Display text should be large, tight and bold by weight of its presence.
- Body text should be serifed, open and comfortable.
- Mono text should be uppercase with positive tracking.
- Avoid using mono for paragraphs.
- Avoid using serif for navigation or buttons.
- Avoid using Anton for body copy or long-form text.

## Layout

The layout uses editorial grids, not floating cards. The design is built around
a 1440px frame with generous 88px side padding for a spacious reading column.

- Page frame width: `1440px`.
- Content max width: `1296px` (inside 88px padding).
- Article max width: `720px`.
- Mobile padding: `16px`.
- Desktop padding: `88px`.
- Major sections should be separated by strong horizontal rules or graphite
  ribbons.
- Content groups may use graphite section ribbons with creme display labels.

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

- Use `1px` hairlines (#C9C3B8) to separate editorial items and columns.
- Use `1px` line borders (#2A2A2A) for card frames and structural edges.
- Use `2px` graphite (#1B1B1F) or ink (#171717) borders for strong interactive
  affordances.
- Prefer borders and whitespace over shadows.
- Rules should feel like magazine column dividers.

## Interaction

Interactions should be minimal and fast.

- Links hover to `#263CFF` (accent).
- Active navigation items use an accent underline mark.
- Editorial titles may underline on hover.
- Buttons invert graphite/creme on hover.
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
- calm creme surfaces for technical examples

The site should not look like generic documentation. It should feel like a
personal technical publication.

## Editorial Compositions

The home layout follows a structured editorial composition derived from the
design file:

- **Hero (2 columns):** A main column with a mono kicker (accent), a large
  Anton display headline (74px), a Newsreader deck (24px) and action buttons.
  The right column contains the "AGORA" margin-note card — a surface-colored
  inset with mono labels (accent), Newsreader descriptions and hairline
  dividers, tracking current work, reading and study.
- **Recent Writing bar:** A full-width graphite ribbon (72px tall) with an Anton
  display label ("ESCRITA RECENTE") on the left and mono metadata on the right.
- **Recent Layout (1264px):** A two-region grid — featured article (Anton
  headline ~58px, Newsreader summary ~22px, mono metadata) and a side column of
  secondary articles with geometric marks, Anton titles (~30px), Newsreader
  summaries (~16px) and soft dates.
- **Projects grid (2×2):** A framed section with a mono header ("PROJETOS"),
  geometric brand marks (circles, tile grids) in accent and graphite, Anton
  project titles, Newsreader descriptions and mono tags/chips on creme chips
  with hairline borders.
- **Navigation bar:** Mono uppercase items with positive tracking, active page
  marked by an accent underline bar.

## Implementation Guidance for Agents

Use Tailwind utilities as the primary implementation mechanism. Keep custom CSS
minimal and limited to global imports/base concerns.

When creating new screens, preserve:

- creme paper surface (#F7F3EA)
- surface (#FFFDF7) for cards and inset panels
- ink (#171717) text
- electric blue accent (#263CFF)
- graphite (#1B1B1F) ribbons and primary buttons
- mono uppercase metadata (Geist Mono)
- serif body copy (Newsreader)
- Anton display headings
- square corners
- no shadows
- responsive grids based on item count

If a new visual choice conflicts with this document, this document wins.
