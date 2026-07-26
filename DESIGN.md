---

version: beta
name: Linear-inspired-dual-theme-system
description: >
A product-focused interface system inspired by Linear’s clarity, density,
typography, and restrained use of color, but adapted into an original design
language with first-class Light Mode and Dark Mode support.

The interface should feel technical, polished, calm, and highly usable.
Dark Mode uses near-black neutral surfaces with subtle blue undertones.
Light Mode uses cool off-white surfaces instead of harsh pure white.

Both themes must preserve the same hierarchy, spacing, component dimensions,
interaction states, and accessibility standards. Theme switching must only
change semantic color tokens, never layout or component structure.

design-goals:

* Treat Light Mode and Dark Mode as equally important.
* Preserve identical hierarchy and usability across both themes.
* Use semantic tokens instead of hard-coded theme-specific colors.
* Keep visual noise low and make product content the main focus.
* Use borders and surface contrast instead of heavy shadows.
* Use one restrained lavender-blue brand accent.
* Avoid directly copying Linear’s exact layout, branding, or component styling.
* Follow the existing project design system whenever reusable primitives already exist.

theme-strategy:
default-theme: system
supported-themes:
- light
- dark
- system
implementation:
- Use CSS variables or the existing theme provider.
- Prefer semantic classes such as bg-background, bg-card, text-foreground, and border-border.
- Do not use raw theme colors directly inside components.
- Do not duplicate components for Light Mode and Dark Mode.
- Avoid JavaScript theme checks for styling when CSS theme variants are sufficient.
- Persist the user-selected theme.
- Respect prefers-color-scheme when the selected theme is system.
- Prevent a theme flash during initial page load.

brand:
primary: "#6366d9"
primary-hover: "#7478e8"
primary-active: "#5559c5"
primary-foreground: "#ffffff"
focus-ring: "#7075e5"

themes:
light:
background: "#f7f8fa"
foreground: "#17181b"

```
surface-1: "#ffffff"
surface-2: "#f3f4f6"
surface-3: "#eceef1"
surface-4: "#e5e7eb"

card: "#ffffff"
card-hover: "#fafbfc"
elevated: "#ffffff"

muted: "#f1f2f4"
muted-foreground: "#686d76"
subtle-foreground: "#8b9099"
tertiary-foreground: "#a0a5ad"

border: "#e1e3e7"
border-strong: "#cfd2d8"
divider: "#e8e9ec"

input: "#ffffff"
input-hover: "#fafbfc"
input-disabled: "#f1f2f4"

overlay: "rgba(18, 20, 24, 0.42)"
shadow: "rgba(24, 28, 36, 0.08)"

success: "#18864b"
success-surface: "#eaf7ef"
warning: "#a76510"
warning-surface: "#fff5df"
danger: "#c53b47"
danger-surface: "#fff0f1"
info: "#3568c8"
info-surface: "#eef4ff"
```

dark:
background: "#09090b"
foreground: "#f5f6f7"

```
surface-1: "#111214"
surface-2: "#17181b"
surface-3: "#1d1f22"
surface-4: "#24262a"

card: "#111214"
card-hover: "#17181b"
elevated: "#1a1b1f"

muted: "#191a1d"
muted-foreground: "#aeb2ba"
subtle-foreground: "#858a94"
tertiary-foreground: "#656a73"

border: "#26282d"
border-strong: "#383b42"
divider: "#202227"

input: "#121316"
input-hover: "#17181b"
input-disabled: "#191a1d"

overlay: "rgba(0, 0, 0, 0.68)"
shadow: "rgba(0, 0, 0, 0.32)"

success: "#35b96b"
success-surface: "#10291b"
warning: "#d99a3f"
warning-surface: "#302313"
danger: "#e15b65"
danger-surface: "#32171a"
info: "#6f9bea"
info-surface: "#17233a"
```

semantic-colors:
background: "{themes.current.background}"
foreground: "{themes.current.foreground}"

card: "{themes.current.card}"
card-hover: "{themes.current.card-hover}"
elevated: "{themes.current.elevated}"

muted: "{themes.current.muted}"
muted-foreground: "{themes.current.muted-foreground}"
subtle-foreground: "{themes.current.subtle-foreground}"
tertiary-foreground: "{themes.current.tertiary-foreground}"

border: "{themes.current.border}"
border-strong: "{themes.current.border-strong}"
divider: "{themes.current.divider}"

input: "{themes.current.input}"
input-hover: "{themes.current.input-hover}"
input-disabled: "{themes.current.input-disabled}"

primary: "{brand.primary}"
primary-hover: "{brand.primary-hover}"
primary-active: "{brand.primary-active}"
primary-foreground: "{brand.primary-foreground}"
ring: "{brand.focus-ring}"

typography:
font-family:
sans:
value: "Inter, Geist Sans, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
usage: "All interface and marketing text"

```
mono:
  value: "Geist Mono, JetBrains Mono, SFMono-Regular, Menlo, monospace"
  usage: "Code, IDs, commands, logs, technical values"
```

display-xl:
fontSize: "clamp(42px, 6vw, 76px)"
fontWeight: 600
lineHeight: 1.05
letterSpacing: "-0.045em"

display-lg:
fontSize: "clamp(36px, 4.5vw, 56px)"
fontWeight: 600
lineHeight: 1.08
letterSpacing: "-0.035em"

display-md:
fontSize: "clamp(30px, 3.5vw, 42px)"
fontWeight: 600
lineHeight: 1.12
letterSpacing: "-0.025em"

headline:
fontSize: "28px"
fontWeight: 600
lineHeight: 1.2
letterSpacing: "-0.018em"

title:
fontSize: "20px"
fontWeight: 600
lineHeight: 1.3
letterSpacing: "-0.012em"

body-lg:
fontSize: "18px"
fontWeight: 400
lineHeight: 1.6
letterSpacing: "-0.005em"

body:
fontSize: "16px"
fontWeight: 400
lineHeight: 1.55
letterSpacing: 0

body-sm:
fontSize: "14px"
fontWeight: 400
lineHeight: 1.5
letterSpacing: 0

caption:
fontSize: "12px"
fontWeight: 500
lineHeight: 1.4
letterSpacing: "0.01em"

button:
fontSize: "14px"
fontWeight: 500
lineHeight: 1.2
letterSpacing: 0

eyebrow:
fontSize: "12px"
fontWeight: 600
lineHeight: 1.3
letterSpacing: "0.06em"
textTransform: uppercase

rounded:
xs: "4px"
sm: "6px"
md: "8px"
lg: "12px"
xl: "16px"
xxl: "20px"
pill: "9999px"
full: "9999px"

spacing:
xxs: "4px"
xs: "8px"
sm: "12px"
md: "16px"
lg: "24px"
xl: "32px"
xxl: "48px"
section-sm: "64px"
section: "96px"
section-lg: "128px"

layout:
page-max-width: "1280px"
content-max-width: "1120px"
reading-max-width: "720px"
page-padding-desktop: "32px"
page-padding-tablet: "24px"
page-padding-mobile: "16px"

grids:
desktop: 12
tablet: 8
mobile: 4

breakpoints:
mobile: "480px"
mobile-lg: "768px"
tablet: "1024px"
desktop: "1280px"
desktop-xl: "1440px"

elevation:
flat:
background: transparent
border: none
shadow: none

level-1:
background: "{semantic-colors.card}"
border: "1px solid {semantic-colors.border}"
shadow-light: "0 1px 2px {themes.light.shadow}"
shadow-dark: none

level-2:
background: "{semantic-colors.elevated}"
border: "1px solid {semantic-colors.border-strong}"
shadow-light: "0 8px 24px {themes.light.shadow}"
shadow-dark: "0 12px 32px {themes.dark.shadow}"

overlay:
background: "{semantic-colors.elevated}"
border: "1px solid {semantic-colors.border-strong}"
shadow-light: "0 20px 60px rgba(24, 28, 36, 0.16)"
shadow-dark: "0 24px 70px rgba(0, 0, 0, 0.48)"

motion:
duration-fast: "120ms"
duration-default: "180ms"
duration-slow: "260ms"
easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
easing-enter: "cubic-bezier(0.16, 1, 0.3, 1)"

rules:
- Use motion to communicate state changes, not for decoration.
- Prefer opacity, background-color, border-color, and transform.
- Avoid large parallax effects.
- Respect prefers-reduced-motion.
- Hover movement must not exceed 2px.

components:
button-primary:
minHeight: "40px"
padding: "8px 14px"
background: "{semantic-colors.primary}"
foreground: "{semantic-colors.primary-foreground}"
border: "1px solid transparent"
rounded: "{rounded.md}"
typography: "{typography.button}"

```
hover:
  background: "{semantic-colors.primary-hover}"

active:
  background: "{semantic-colors.primary-active}"
  transform: "translateY(1px)"

focus-visible:
  outline: "3px solid color-mix(in srgb, {semantic-colors.ring} 35%, transparent)"
  outlineOffset: "2px"
```

button-secondary:
minHeight: "40px"
padding: "8px 14px"
background: "{semantic-colors.card}"
foreground: "{semantic-colors.foreground}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.md}"
typography: "{typography.button}"

```
hover:
  background: "{semantic-colors.card-hover}"
  border: "1px solid {semantic-colors.border-strong}"
```

button-ghost:
minHeight: "40px"
padding: "8px 12px"
background: transparent
foreground: "{semantic-colors.muted-foreground}"
border: "1px solid transparent"
rounded: "{rounded.md}"
typography: "{typography.button}"

```
hover:
  background: "{semantic-colors.muted}"
  foreground: "{semantic-colors.foreground}"
```

icon-button:
size: "40px"
background: transparent
foreground: "{semantic-colors.muted-foreground}"
rounded: "{rounded.md}"

```
hover:
  background: "{semantic-colors.muted}"
  foreground: "{semantic-colors.foreground}"
```

card:
background: "{semantic-colors.card}"
foreground: "{semantic-colors.foreground}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.lg}"
padding: "{spacing.lg}"

interactive-card:
background: "{semantic-colors.card}"
foreground: "{semantic-colors.foreground}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.lg}"
padding: "{spacing.lg}"
transition: >
background-color {motion.duration-default} {motion.easing-standard},
border-color {motion.duration-default} {motion.easing-standard},
transform {motion.duration-default} {motion.easing-standard}

```
hover:
  background: "{semantic-colors.card-hover}"
  border: "1px solid {semantic-colors.border-strong}"
  transform: "translateY(-1px)"
```

feature-card:
extends: "{components.card}"
minHeight: "220px"
layout: vertical
gap: "{spacing.md}"

metric-card:
extends: "{components.card}"
padding: "{spacing.lg}"
valueTypography: "{typography.headline}"
labelTypography: "{typography.body-sm}"
iconContainer:
size: "40px"
rounded: "{rounded.md}"
background: "{semantic-colors.muted}"

screenshot-card:
background: "{semantic-colors.card}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.xl}"
padding: "{spacing.sm}"
overflow: hidden

input:
minHeight: "42px"
padding: "9px 12px"
background: "{semantic-colors.input}"
foreground: "{semantic-colors.foreground}"
placeholder: "{semantic-colors.subtle-foreground}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.md}"
typography: "{typography.body-sm}"

```
hover:
  background: "{semantic-colors.input-hover}"
  border: "1px solid {semantic-colors.border-strong}"

focus:
  border: "1px solid {semantic-colors.ring}"
  outline: "3px solid color-mix(in srgb, {semantic-colors.ring} 22%, transparent)"

disabled:
  background: "{semantic-colors.input-disabled}"
  foreground: "{semantic-colors.tertiary-foreground}"
  cursor: not-allowed
```

select:
extends: "{components.input}"
iconColor: "{semantic-colors.muted-foreground}"

textarea:
extends: "{components.input}"
minHeight: "112px"
resize: vertical

tabs:
container:
background: "{semantic-colors.muted}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.md}"
padding: "3px"

```
item:
  minHeight: "34px"
  padding: "6px 12px"
  foreground: "{semantic-colors.muted-foreground}"
  rounded: "{rounded.sm}"

selected:
  background: "{semantic-colors.card}"
  foreground: "{semantic-colors.foreground}"
  border: "1px solid {semantic-colors.border}"
```

badge:
minHeight: "22px"
padding: "2px 8px"
background: "{semantic-colors.muted}"
foreground: "{semantic-colors.muted-foreground}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.pill}"
typography: "{typography.caption}"

table:
container:
background: "{semantic-colors.card}"
border: "1px solid {semantic-colors.border}"
rounded: "{rounded.lg}"
overflow: hidden

```
header:
  background: "{semantic-colors.muted}"
  foreground: "{semantic-colors.muted-foreground}"
  typography: "{typography.caption}"

row:
  minHeight: "52px"
  borderBottom: "1px solid {semantic-colors.divider}"

row-hover:
  background: "{semantic-colors.card-hover}"
```

dropdown:
background: "{semantic-colors.elevated}"
foreground: "{semantic-colors.foreground}"
border: "1px solid {semantic-colors.border-strong}"
rounded: "{rounded.lg}"
padding: "{spacing.xs}"
elevation: "{elevation.overlay}"

dialog:
background: "{semantic-colors.elevated}"
foreground: "{semantic-colors.foreground}"
border: "1px solid {semantic-colors.border-strong}"
rounded: "{rounded.xl}"
padding: "{spacing.lg}"
elevation: "{elevation.overlay}"

sidebar:
background: "{semantic-colors.background}"
foreground: "{semantic-colors.foreground}"
borderRight: "1px solid {semantic-colors.border}"

```
navigation-item:
  minHeight: "40px"
  padding: "8px 10px"
  foreground: "{semantic-colors.muted-foreground}"
  rounded: "{rounded.md}"

navigation-item-hover:
  background: "{semantic-colors.muted}"
  foreground: "{semantic-colors.foreground}"

navigation-item-active:
  background: "{semantic-colors.muted}"
  foreground: "{semantic-colors.foreground}"
  indicator: "{semantic-colors.primary}"
```

top-navigation:
height: "56px"
background: >
color-mix(in srgb, {semantic-colors.background} 88%, transparent)
foreground: "{semantic-colors.foreground}"
borderBottom: "1px solid {semantic-colors.border}"
backdropFilter: "blur(14px)"

theme-toggle:
type: icon-button
accessibleLabel: "Switch color theme"
states:
light: sun
dark: moon
system: monitor

accessibility:
minimum-text-contrast: "4.5:1"
minimum-large-text-contrast: "3:1"
minimum-interactive-target: "40px"
preferred-touch-target: "44px"

requirements:
- Every interactive element must have a visible focus state.
- Never communicate status using color alone.
- Icons without visible labels must have accessible names.
- Disabled controls must remain readable in both themes.
- Test contrast separately in Light Mode and Dark Mode.
- Decorative icons must be hidden from screen readers.
- Theme selection controls must expose their current state.

responsive-behavior:
desktop:
pagePadding: "{layout.page-padding-desktop}"
cardGrid: "repeat(3, minmax(0, 1fr))"
sidebar: expanded

tablet:
pagePadding: "{layout.page-padding-tablet}"
cardGrid: "repeat(2, minmax(0, 1fr))"
sidebar: collapsible

mobile:
pagePadding: "{layout.page-padding-mobile}"
cardGrid: "1fr"
sidebar: drawer
topNavigation: compact
table: horizontally-scrollable-or-card-layout
dialogWidth: "calc(100vw - 32px)"

rules:
- Avoid horizontal page overflow.
- Keep primary actions visible without excessive scrolling.
- Convert dense tables to cards only when readability improves.
- Do not simply shrink desktop layouts.
- Use clamp() for large typography.
- Keep form controls at least 44px tall on touch devices.

visual-principles:
surfaces:
- Use surface contrast and hairline borders for hierarchy.
- Use shadows sparingly, especially in Dark Mode.
- Light Mode may use subtle shadows for floating overlays.
- Dark Mode should rely primarily on background elevation and borders.
- Avoid pure white against pure black for large reading surfaces.

color:
- Use lavender-blue only for primary actions, focus states, active indicators, selected controls, and important links.
- Use semantic colors only for status and validation.
- Do not use the primary accent as a large card or section background.
- Avoid multiple competing accent colors.

typography:
- Use medium or semibold weights for headings.
- Avoid excessive bold text.
- Apply negative tracking only to large headings.
- Keep body text comfortable and readable.
- Use monospace only for genuinely technical content.

density:
- Use compact controls while preserving touch accessibility.
- Prefer clear grouping over excessive whitespace.
- Separate sections using spacing, borders, and surface changes.
- Avoid nesting too many cards inside cards.

icons:
- Use one consistent icon family already present in the project.
- Prefer 1.5px–2px stroke icons.
- Keep standard interface icons between 16px and 20px.
- Do not use random emoji or mixed icon styles.
- Use filled or colored icons only when they communicate meaningful state.

light-mode-guidelines:

* Light Mode must not look like an inverted Dark Mode.
* Use cool off-white as the page background.
* Use white primarily for cards, dialogs, and elevated content.
* Keep borders visible but subtle.
* Avoid large areas of pure #ffffff without hierarchy.
* Use text colors softer than pure black.
* Ensure muted controls do not become too faint.
* Use subtle shadows only for floating or elevated elements.

dark-mode-guidelines:

* Use near-black neutral backgrounds, not pure #000000.
* Keep cards only slightly lighter than the page background.
* Use borders to preserve separation between nested surfaces.
* Avoid glowing borders and excessive neon accents.
* Avoid pure white text for secondary content.
* Ensure form inputs remain clearly distinguishable from surrounding cards.
* Keep primary buttons readable without appearing overly saturated.

implementation-rules:

* Audit the current project before creating new components.
* Reuse existing buttons, cards, inputs, dialogs, and layout primitives.
* Do not change business logic, API behavior, validation, or data flow unless explicitly requested.
* Preserve existing routes, events, state management, and component contracts.
* Replace duplicated style values with shared design tokens.
* Prefer semantic variables over direct hex colors.
* Use the existing utility helpers such as cn() when available.
* Keep server and client component boundaries unchanged unless technically required.
* Avoid introducing a large dependency solely for styling.
* Remove unused styles and imports after refactoring.
* Do not use inline style for static theme values.
* Verify Light Mode and Dark Mode on every modified component.

tailwind-example:
root-variables: |
:root {
--background: 220 20% 97%;
--foreground: 225 8% 10%;

```
  --card: 0 0% 100%;
  --card-foreground: 225 8% 10%;

  --muted: 220 12% 94%;
  --muted-foreground: 220 6% 43%;

  --border: 220 10% 88%;
  --input: 220 10% 88%;
  --ring: 237 64% 63%;

  --primary: 238 62% 62%;
  --primary-foreground: 0 0% 100%;
}

.dark {
  --background: 240 8% 4%;
  --foreground: 220 14% 96%;

  --card: 225 8% 7%;
  --card-foreground: 220 14% 96%;

  --muted: 225 7% 10%;
  --muted-foreground: 220 7% 69%;

  --border: 225 7% 16%;
  --input: 225 7% 16%;
  --ring: 237 68% 68%;

  --primary: 238 62% 62%;
  --primary-foreground: 0 0% 100%;
}
```

component-example: | <section className="bg-background text-foreground"> <article
     className="
       rounded-xl border border-border bg-card text-card-foreground
       transition-colors hover:bg-muted/40
     "
   >
... </article> </section>

anti-patterns:

* Do not use dark:bg-* as the only theming strategy when semantic tokens are available.
* Do not scatter raw hex values throughout components.
* Do not create separate Light Mode and Dark Mode component trees.
* Do not add gradients simply to make empty areas feel more interesting.
* Do not add glassmorphism to every surface.
* Do not use strong shadows on ordinary cards.
* Do not use rounded-3xl or pill shapes for every component.
* Do not use the primary accent on every icon.
* Do not reduce text contrast excessively for visual subtlety.
* Do not redesign shared navigation differently on each page.
* Do not alter business logic while performing a visual refactor.
* Do not copy Linear’s exact page composition or branding.

page-composition:
navigation:
- Keep navigation compact and consistent.
- Include a clearly accessible Light/Dark/System theme control.
- Use a subtle sticky background with blur only when supported.
- Preserve the existing sidebar and header structure unless explicitly instructed otherwise.

page-header:
- Use a clear title and one concise supporting description.
- Place the main action on the right at desktop.
- Stack actions below the title on small screens.
- Avoid oversized marketing headings inside application dashboards.

content:
- Use one primary content container.
- Group related controls and data into clear sections.
- Use cards only when they improve grouping.
- Prefer full-width product views for tables, charts, and detailed workflows.

empty-state:
- Show a meaningful icon or lightweight illustration.
- Explain why the page is empty.
- Provide one clear primary action.
- Avoid large decorative artwork that dominates the page.

loading-state:
- Skeletons must use semantic muted colors.
- Skeleton shapes should match final content geometry.
- Avoid layout shifts when data finishes loading.

error-state:
- Explain the error in human-readable language.
- Preserve useful page context.
- Provide retry or recovery actions where applicable.
- Do not use red as the entire panel background.

quality-checklist:
theme:
- Light Mode renders correctly.
- Dark Mode renders correctly.
- System Mode follows OS preference.
- Theme selection persists after reload.
- No flash of incorrect theme.
- No hard-coded colors break either theme.

layout:
- No horizontal overflow.
- No duplicated page scroll containers.
- Header and sidebar remain stable during navigation.
- Page scroll position behaves intentionally.
- Cards align consistently.
- Mobile layout is not merely a scaled-down desktop layout.

interaction:
- Hover, active, focus, loading, disabled, and error states exist.
- Keyboard navigation works.
- Focus indicators remain visible in both themes.
- Touch targets are large enough.

visual:
- Primary accent is used sparingly.
- Borders remain visible in both themes.
- Text hierarchy is consistent.
- Icons use one coherent style.
- Shadows are restrained.
- Nested surfaces remain distinguishable.

engineering:
- Existing business logic is preserved.
- Existing reusable components are used.
- TypeScript errors are resolved.
- Lint errors are resolved.
- Unused imports and dead styles are removed.
- No unnecessary dependencies are introduced.

codex-instructions:

* First inspect the existing project structure, styling system, theme provider, and reusable UI components.
* Identify whether the project uses Tailwind CSS, CSS Modules, styled-components, shadcn/ui, Radix, or another system.
* Adapt this design system to the existing architecture instead of replacing it.
* Create or normalize semantic theme variables before refactoring individual pages.
* Prioritize full Light Mode and Dark Mode compatibility.
* Refactor one shared primitive at a time.
* Reuse shared primitives across all affected pages.
* Preserve all current application functionality.
* Do not copy Linear’s visual design exactly.
* After implementation, test all modified routes in desktop, tablet, and mobile sizes.
* Report:

  1. Files inspected.
  2. Files changed.
  3. Shared components reused or created.
  4. Light Mode changes.
  5. Dark Mode changes.
  6. Responsive fixes.
  7. Accessibility improvements.
  8. Remaining issues or risks.

final-objective: >
Produce a polished, original, Linear-inspired product interface that feels
equally intentional in Light Mode and Dark Mode.

The final UI should be compact, accessible, responsive, visually consistent,
and integrated with the project’s existing design system. It must not look
like a direct clone and must not sacrifice functionality for visual changes.
----------------------------------------------------------------------------

## Core Direction

Build a restrained, product-first interface using semantic design tokens and a
shared component system.

The UI must support:

* Light Mode.
* Dark Mode.
* System Mode.
* Persistent theme preference.
* Responsive layouts.
* Keyboard accessibility.
* Clear focus states.
* Consistent component behavior.

Light Mode and Dark Mode are not separate designs. They are two visual
representations of the same hierarchy and component system.

## Visual Character

The intended visual character is:

* Technical but approachable.
* Compact but not cramped.
* Premium without unnecessary decoration.
* Quietly polished.
* Focused on content, data, and workflows.
* Driven by surfaces, borders, typography, and spacing rather than effects.

Use lavender-blue as the single brand accent. Semantic green, amber, red, and
blue may appear only for genuine system states.

## Light Mode

Light Mode should use a cool off-white canvas and clean white content surfaces.

It should not:

* Be a simple inversion of Dark Mode.
* Use pure black for all text.
* Use excessive shadows.
* Lose borders between white surfaces.
* Make muted text too faint.

Cards and controls should remain visible through subtle borders, gentle surface
contrast, and limited elevation.

## Dark Mode

Dark Mode should use a near-black canvas with slightly lighter cards and
controls.

It should not:

* Use pure black as the main background.
* Use pure white for all text.
* Add neon glow effects.
* Make every card visibly elevated.
* Use lavender as decoration.

Hierarchy should primarily come from surface levels and hairline borders.

## Product UI Priority

For application pages:

* Keep the page header concise.
* Prioritize tables, forms, dashboards, data, and workflows.
* Avoid oversized marketing-style typography.
* Avoid unnecessary hero sections.
* Keep important actions easy to find.
* Keep navigation stable between routes.
* Do not introduce nested scroll containers without a technical reason.

For marketing pages:

* Product screenshots and interactive previews should be the primary visual content.
* Use large headings sparingly.
* Keep decorative elements secondary to the product.
* Do not copy Linear’s exact section structure.

## Final Verification

Before considering the work complete:

1. Test every modified route in Light Mode.
2. Test every modified route in Dark Mode.
3. Test System Mode.
4. Test desktop, tablet, and mobile breakpoints.
5. Test keyboard navigation and focus indicators.
6. Check contrast for text, borders, inputs, and disabled states.
7. Check for horizontal overflow and duplicated scrolling.
8. Confirm that no business logic changed.
9. Run the project’s lint and type-check commands.
10. Summarize all changes and remaining risks.
