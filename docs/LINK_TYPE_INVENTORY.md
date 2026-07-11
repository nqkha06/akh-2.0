# Link Type Inventory

## Social-Action Gated Link

Status: Observed, created

Observed behavior:

- Gated links require one or more visitor actions before unlock.
- Public examples show progress such as `0/5`, `0/4`, disabled unlock buttons, and after-scroll lazy/demo states such as `4/4 done` with `lock_open`.
- Public create supports adding one or more required actions.
- Visible action examples include subscribe, join server, follow user, follow streamer, and follow artist.
- Authenticated URL social-gated link creation succeeded with `POST /social-unlocks` returning 201.
- Created public URL: `https://rekonise.com/codex-url-demo-1783760537194-j2r4b`.
- After creation, an upgrade prompt appeared; it was not opened further.

Evidence:

- `evidence/screenshots/public/homepage-desktop.png`
- `evidence/screenshots/public/homepage-desktop-lazy-after-scroll.png`
- `evidence/screenshots/social-links/public-create-action-menu.png`
- `evidence/screenshots/create-link/auth-create-url-submit-result.png`
- `evidence/network/links/auth-create-url-submit-result.json`
- `evidence/notes/interaction-create-public.json`

## Direct Destination Link

Status: Observed as destination field inside gated URL link

The public create form and authenticated URL create form include required destination URL fields. Authenticated "Shortened links" page was visible, but no create controls were visible in the captured free UI.

Evidence:

- `evidence/screenshots/create-link/public-create-initial.png`

## File/Download Link

Status: Observed UI, not published

Authenticated create has a File toggle with Select file, title, actions, and preview. A file link was not published to avoid exposing existing account files.

Evidence:

- `evidence/screenshots/create-link/auth-create-file-toggle-exact.png`

## Email-Capture Link

Status: Observed as advanced create option; full flow unknown

The authenticated create UI has an Email capturing accordion and loads `/email-lists`. Expanding was blocked by pointer interception in automation, so full visitor form behavior remains unknown.

## Link-In-Bio Page

Status: Observed dashboard inventory

Authenticated dashboard has `/dashboard/link-in-bio`, showing an existing page entry, create action, views, and delete control.

## Multi-Action Link

Status: Observed in public examples

Public demo cards show multi-action progress states: `0/5` and `0/4`. Maximum limits, required/optional action rules, and persistence were not verified.

## Paid-Only Types

Status: Excluded

No paid-only link types are included in this rebuild scope.
