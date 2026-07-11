# Technical Debt

## High Priority

### Production build currently fails

Status: Observed.

`src/app/bio/link-in-bio-generator.tsx:995` passes `string | undefined` into a function typed to accept `string`.

Evidence:

- `npm run build` output.
- `src/components/image-picker.tsx:15-18`
- `src/app/bio/link-in-bio-generator.tsx:990-996`

### Mock and real data are mixed in the same UI

Status: Observed.

Examples:

- Bio analytics uses real aggregate counters from API plus hard-coded channel source rows.
- Link stats modal hard-codes zeros and a fixed YouTube URL/date.
- Overview, levels, leaderboard, withdraw, referrals are static.

Evidence:

- `src/app/bio/bio-view.tsx:35-40`
- `src/app/bio/bio-view.tsx:349-430`
- `src/components/dashboard/views/link-card.tsx:298-360`
- `src/lib/dashboard-data.ts:1-83`
- `src/components/dashboard/views/withdraw.tsx:21-120`

### Disconnected action controls

Status: Observed.

Several controls look functional but have no persistence or handler:

- Create modal options have no `onClick`.
- Link edit/deactivate/delete menu items have no handlers.
- Account cards do not open/edit settings.
- Support ticket button does not submit.
- Withdraw request button does not submit.

Evidence:

- `src/components/create-link-dialog.tsx:22-39`
- `src/components/create-link-dialog.tsx:61-70`
- `src/components/dashboard/views/link-card.tsx:288-360`
- `src/components/dashboard/views/account.tsx:31-50`
- `src/components/dashboard/views/support.tsx:93-110`
- `src/components/dashboard/views/withdraw.tsx:45-91`

## Medium Priority

### Business logic is concentrated in large frontend components

Status: Observed.

`src/app/create/demo.tsx` contains platform inventory, validation, file selection, social action editing, expiry controls, payload construction, API submission, and preview rendering in one component.

Evidence:

- `src/app/create/demo.tsx:612-921`
- `src/app/create/demo.tsx:1699-1985`

### Large link-in-bio generator mixes editor state, validation, preview, and persistence

Status: Observed.

Evidence:

- `src/app/bio/link-in-bio-generator.tsx:91-243`
- `src/app/bio/link-in-bio-generator.tsx:1138-1225`

### Lint scope includes generated/non-product artifacts

Status: Observed.

Evidence:

- `npm run lint` output.
- `package.json:10`

### Duplicate or inconsistent create entry points

Status: Observed.

- `/create` re-exports `./demo`.
- Mobile nav opens `SocialLinksGenerator` in a full-screen dialog.
- `/links` embeds the same generator as a tab.
- Topbar “Tạo mới” modal displays options but does not navigate.

Evidence:

- `src/app/create/page.tsx`
- `src/components/dashboard/mobile-bottom-nav.tsx:59-74`
- `src/components/dashboard/views/links.tsx`
- `src/components/create-link-dialog.tsx:22-39`

## Low Priority

### Branding/reference leakage in prototype

Status: Observed.

Hard-coded “Rekonise”, “Pro”, “Subscription”, and demo emails remain in app UI.

Evidence:

- `src/app/layout.tsx:18-19`
- `src/components/dashboard/shell.tsx:230-289`
- `src/components/dashboard/views/account.tsx:18-23`

### Unused/dead helper

Status: Observed.

`FilesService.forceRemoveLocalFile()` is defined but not called in current source.

Evidence:

- `backend/src/files/files.service.ts:174-180`

## FE-First Stabilization Debt

Status: Recommended.

Before adding more screens, define a simple FE maturity label per route:

- `Static mock`
- `Interactive mock`
- `API-backed prototype`
- `Ready for integration`

This will prevent dashboard screens from visually implying backend completeness.

