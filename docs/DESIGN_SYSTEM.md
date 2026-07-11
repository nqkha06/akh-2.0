# Design System

## Observed Visual Direction

Status: Measured and observed

- Font family: Inter, sans-serif.
- Body background: dark warm near `rgb(20, 17, 15)`.
- Primary action color: bright green near `rgb(0, 199, 106)`.
- Hero H1 measured at 72px, 800 weight, 72px line-height on 1440px desktop.
- Primary CTA is pill-shaped with 9999px radius.
- Buttons and panels use dark surfaces with white/zinc text.

Evidence:

- `evidence/notes/interaction-create-public.json`
- `evidence/screenshots/public/homepage-desktop.png`

## Components Observed

Status: Observed

- Header navigation
- Mobile menu button
- CTA links/buttons
- Form inputs
- Social action rows
- Disabled unlock buttons
- Progress text/counters
- Legal/footer navigation
- OAuth buttons
- Password visibility toggle

## Original Rebuild Design Recommendation

Status: Recommended

Use a distinct, original design system:

- Keep a high-contrast creator tool feel but avoid copying exact branding.
- Use a neutral dark background, not the same warm-black palette.
- Use a different primary accent, for example teal or blue-green, with accessible contrast.
- Use compact dashboards for creator workflows.
- Use simple public unlock pages with clear action steps and a single final unlock CTA.

## Component Requirements

Status: Recommended

- Buttons: primary, secondary, ghost, destructive, disabled/loading.
- Inputs: labels, helper text, inline validation.
- Cards/rows: link rows, action rows, analytics cards.
- Modals: delete confirmation and preview.
- Toasts: save success/error.
- Tables/cards: responsive link management.
