---
name: Grafite Editorial
source: "Claude Design project 689fff68-7316-4e0b-9846-6bba6fee9412 (whoisclebs.dc.html)"
colors:
  ink: "#141518"
  inkDeep: "#0B0C10"
  inkRaised: "#1B1C21"
  rule: "#333334"
  ruleSoft: "#2A2B2D"
  cream: "#EFE9E0"
  creamBody: "#D9D4CB"
  creamSoft: "#B9B4AB"
  creamFaint: "#8E8A82"
  creamMute: "#6F6B64"
  accent: "#5FD3E6"
  hot: "#ED1AA0"
  live: "#6FD39A"
  button: "#FFFFFF"
  onButton: "#111111"
  print: "#F4F1EA"
  printInk: "#2A2A2E"
  shell: "#2B2D33"
  shellKey: "#3A3C44"
  shellDark: "#1A1B1F"
  ember: "#E8603C"
  emberDeep: "#8A331C"
  brass: "#C9A24A"
typography:
  display:
    fontFamily: Space Grotesk
    fontWeight: 600
    fontSize: "clamp(2.625rem, 1rem + 6.4vw, 5.75rem)"
    lineHeight: 1
    letterSpacing: "-0.03em"
  h1:
    fontFamily: Space Grotesk
    fontWeight: 600
    fontSize: "clamp(2.5rem, 1.2rem + 5.4vw, 4.75rem)"
    lineHeight: 1
    letterSpacing: "-0.03em"
  h2:
    fontFamily: Space Grotesk
    fontWeight: 600
    fontSize: "clamp(2.125rem, 1.4rem + 3vw, 3.25rem)"
    lineHeight: 1
    letterSpacing: "-0.01em"
  articleH2:
    fontFamily: Space Grotesk
    fontWeight: 600
    fontSize: "clamp(1.75rem, 1.2rem + 2vw, 2.375rem)"
    lineHeight: 1.1
  body:
    fontFamily: Inter Tight
    fontWeight: 400
    fontSize: "1.0625rem"
    lineHeight: 1.6
  article:
    fontFamily: Inter Tight
    fontWeight: 400
    fontSize: "1.125rem"
    lineHeight: 1.75
  lead:
    fontFamily: Inter Tight
    fontWeight: 400
    fontSize: "clamp(1.125rem, 0.95rem + 0.75vw, 1.375rem)"
    lineHeight: 1.55
  eyebrow:
    fontFamily: Inter Tight
    fontWeight: 500
    fontSize: "0.75rem"
    lineHeight: 1.35
    letterSpacing: "0.08em"
    textTransform: uppercase
  mono:
    fontFamily: JetBrains Mono
    fontWeight: 400
    fontSize: "0.875rem"
    lineHeight: 1.7
rounded:
  none: 0
  control: 2px
  pill: 30px
spacing:
  hairline: 1px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 72px
layout:
  pageMaxWidth: 1440px
  pageGutter: "clamp(20px, 4vw, 48px)"
  headerHeight: 56px
  articleMeasure: "33.5em (604px at 18px)"
effects:
  shadow: objects-only
  gradients: hero-video-veil-only
  blur: header-and-dialog-backdrop
---

## Overview

Grafite Editorial is the visual system of whoisclebs.com, a bilingual (pt-BR and
English) personal site of a software engineer: articles, notes, open source
projects and a small layer for machine readers. It was designed in Claude Design
and replaces both the earlier "Editorial Creme" spec and the lighthouse night
theme that followed it.

The page is one flat, dark graphite surface. Hierarchy comes from type scale,
1px rules and spacing. The only full-bleed image is the home hero: a looping
video of rain on a window with a laptop on a desk. Everything else is text.

The implementation is plain CSS custom properties in `src/styles/tokens.css`
and `src/styles/base.css`, with component-scoped styles in Svelte files. There
is no Tailwind and no light theme.

## Colors

One palette, dark only. `scripts/check-contrast.mjs` checks every real pair
against WCAG AA and fails the build if a light theme reappears.

- **Ink (#141518):** page background, everywhere.
- **Ink deep (#0B0C10):** the hero behind the video, code blocks, device
  screens (terminal, pocket console).
- **Ink raised (#1B1C21):** panels above the page (shortcut dialog, form cards).
- **Rule (#333334) / rule soft (#2A2B2D):** 1px dividers. They are cream at 14%
  and 10% over ink, stored as solid colors.
- **Cream (#EFE9E0):** headings, links, strong text.
- **Cream body (#D9D4CB):** long-form reading text.
- **Cream soft (#B9B4AB):** supporting text, summaries, navigation.
- **Cream faint (#8E8A82):** metadata. The lightest step that still passes AA
  on the page background.
- **Cream mute (#6F6B64):** decorative only (the "·" separators). It fails AA
  for text, so never set words in it.
- **Accent (#5FD3E6):** cyan. Uppercase labels, arrows, focus rings, link hover,
  the current-page mark. Never a button fill.
- **Hot (#ED1AA0):** pink, reserved for easter eggs (neon mode, the snake's
  food, the Konami line). Never in body copy or chrome.
- **Button (#FFFFFF on #111111):** the primary call to action is a white pill.
  One per view.
- **Object colors:** print paper (#F4F1EA, ink #2A2A2E) for the photo prints;
  shell grays, ember and brass for the pocket console, cartridge and device
  frames. These are physical objects sitting on the page and live outside the
  interface palette on purpose.

Do not add interface colors. Color comes from the hero video, photos and
syntax highlighting.

## Typography

Three families, each with one job. All are self-hosted variable WOFF2 (latin
subset) with metric-adjusted fallbacks in `src/styles/fonts.css`. No requests
to Google Fonts.

- **Space Grotesk 600:** every heading. Sentence case, tight leading (1 to
  1.1), negative tracking (-0.01em to -0.03em). Never uppercase.
- **Inter Tight:** body text, interface, navigation, buttons, and the uppercase
  cyan labels (12px, 0.08em tracking).
- **JetBrains Mono:** code, ISO dates, counters, anything shown on a device
  screen. Not for labels or paragraphs.

Reading text is 18px at 1.75 line height in a 604px column, about 75 characters
per line.

## Layout

- Page frame up to 1440px with a gutter of `clamp(20px, 4vw, 48px)`.
- Fixed header, 56px tall, translucent with a 14px backdrop blur: brand
  (terminal icon and wordmark), Artigos, Projetos, Sobre, and the PT/EN switch.
  The home hero runs underneath it; every other page starts below it.
- Sections are 72px apart and separated by 1px rules, not by background bands.
- Editorial lists are rows, not cards: a label line (topic in cyan uppercase,
  then metadata), a Space Grotesk title, and a summary in the second column.
  Rows stack on narrow screens.
- Two-column blocks use `repeat(auto-fit, minmax(min(100%, 300px), 1fr))` so
  they collapse without breakpoints.
- Footer: one row of secondary pages, then the wordmark on the left and legal
  and profile links on the right.

## Shape and Depth

- Cards, images, code blocks and sections have square corners and no shadow.
- Pills (30px radius) are for buttons, filter chips and tags only.
- Shadows exist only on physical objects: photo prints, the cartridge, the
  pocket console, the laptop and phone, the books and the die.
- Interface surfaces have no gradients except the veils that keep the hero
  text readable over the video. Physical objects (devices, books, the shelf,
  the cartridge, the die) may use gradients for volume. The only blur is the
  header and the dialog backdrop.

## Interaction

- Links are cream and turn cyan on hover (200ms color transition). Inside
  running text they keep an underline so color is not the only cue.
- A row's title turns cyan when the row is hovered or focused. No lift, no
  corner brackets, no moving rules.
- Buttons press to `scale(0.97)`. Filter chips fill with cream when active.
- Focus is a 2px cyan outline with 3px offset on everything.
- Motion is short (120 to 320ms) and respects `prefers-reduced-motion`: the
  hero shows a still poster, the CSS rain stops, toasts fade without moving.
- Touch targets are at least 44px.

## Home Composition

1. **Hero.** Full viewport height. Looping rain video painted on a canvas
   (never a visible `<video>` or large `<img>`, which Chrome would report as
   the LCP). Left column: cyan label, two-line Space Grotesk headline, support
   paragraph, a white pill and a text link. A scroll cue sits bottom left.
2. **Últimos artigos.** Heading with topic filter chips. The first item is a
   featured two-column block; the rest are rows.
3. **Ideias em construção.** Projects in a two-column grid: mono number, name,
   description, arrow link.
4. **Terminal / Aplicativos.** A device built in code (CSS 3D, no images). On
   wide screens it is a closed laptop: a click opens the lid, a short boot
   video plays on the screen, and a working terminal lists real site content.
   On narrow screens it is a phone: a tap wakes the screen, the same boot
   plays, and an app drawer links to every part of the site. No terminal on
   the phone.
5. **Quem está por aqui.** Heading on the left, a short paragraph and a link on
   the right.

## Devices

The laptop and the phone are objects, so they follow object rules rather than
interface rules.

- Built from real faces with thickness: deck, lid, bevelled edges, keyboard,
  trackpad. Aluminium is a non-uniform gradient lit from the upper right, with
  a cyan rim on the right edge and a magenta rim at the lower right, the same
  light as the hero video.
- A flat frame with a stand reads as an illustration and was rejected. If a
  device looks like an icon, it is not finished.
- Text on a screen never sits under a 3D transform. The open pose lands the
  screen on its layout rectangle and the terminal lives in a 2D layer over it.
- The exception is content drawn over an object inside the hero video. The
  laptop there is seen at an angle, so its screen content is a flat plane
  mapped onto the four measured corners of the screen with a homography
  (`src/lib/components/home/quad.ts`). A straight box clipped to the screen
  shape leaves the text crooked against the device. That laptop only exists
  on wide landscape viewports, where it is not behind the headline.
- Video is only for the boot (`static/media/boot-v1.*`, abstract, no text).
  Boot lines are drawn in code over it and show real counts from the site.
- States: closed, opening, boot, on, closing. Every transition can be
  interrupted. Reduced motion skips the lid swing and the video.

## About Composition

Label, headline, lead and a three-row definition list on the left. On the
right, two paper prints (portrait and an event photo), rotated a few degrees,
opaque, with captions on the paper margin, plus a game cartridge. Inserting the
cartridge opens the pocket console with Snake.

## Books and Hobbies

- **Livros** is a shelf. Spines stand on a board; real books carry title and
  author and can be pulled out, turned to the cover and opened to a page with
  the details and the store link. Extra spines that fill the shelf carry no
  text, are dimmed and do not react, and each real book added replaces one of
  them. Never print an invented title on a spine.
- **Hobbies** has a d20: an icosahedron projected in SVG with per-face light,
  rolled with the browser's cryptographic generator, in normal, advantage and
  disadvantage modes.

## Easter Eggs

They always need a gesture and load outside the entry bundle.

- Konami code toggles neon mode (scanlines and a pink and cyan edge glow).
- `?` opens the shortcut panel. `g` then `a`, `p`, `s` or `h` navigates.
- Typing `clebs`, `sudo` or `rm -rf` anywhere answers with a toast.
- Clicking the laptop in the hero wakes its screen.
- Typing `cometa` (or the terminal command `hero cometa`) swaps the hero for
  the earlier comet scene; `chuva` brings the rain back. The choice is stored
  in `localStorage`.
- Five taps on the footer wordmark.
- Nothing shown is fake telemetry: anything that looks like a measurement is
  measured in the browser or read from the site's own content.

## Content Voice

Plain and direct, first person, in the author's own voice. No slogans, no
triads, no em dashes inside sentences, no emoji, no invented facts about
clients or employers. Interface labels are short and in sentence case. Every
string exists in pt-BR and English.

## Implementation Guidance for Agents

- Interface colors always come from the semantic tokens (`--color-*`), and so
  do type and spacing (`--font-*`, `--step-*`, `--space-*`). Raw hex values
  are allowed in two places only: canvas and SVG drawing code, and the
  material of a physical object (aluminium, glass, wood, paper), declared as
  scoped custom properties at the top of that object's component
  (`--alu-*`, `--glass`, `--wood-*`). Object colors shared by more than one
  component (`--p-shell*`, `--p-print*`, `--p-brass`, `--p-ember*`) live in
  `tokens.css`.
- Global classes live in `base.css`: `.page`, `.page-header`, `.eyebrow`,
  `.meta`, `.lead`, `.button`, `.button--primary`, `.chip`, `.link-arrow`,
  `.link-lit`, `.tags`, `.prose`, `.code-block`, `.entry*`, `.section`.
  Everything else is scoped to its component.
- Islands (terminal, pocket console, global easter eggs, hero video) load with
  dynamic `import()` after the page is usable. The home entry bundle has a
  90 KiB gzip budget.
- Every `<img>` carries `width` and `height`.
- When a visual choice conflicts with this document, this document wins. When
  this document conflicts with the Claude Design source, update both.
