# Dead and Mock Code

## Mock Data Sources

Status: Observed.

`src/lib/dashboard-data.ts` contains static metrics, link rows, levels, and rankings.

Evidence:

- `src/lib/dashboard-data.ts:1-83`

Affected views:

- Levels: `src/components/dashboard/views/levels.tsx:11`
- Leaderboard: `src/components/dashboard/views/leaderboard.tsx:4`

## Static Dashboard Widgets

Status: Observed.

Overview uses hard-coded top links and recent activity.

Evidence:

- `src/components/dashboard/views/overview.tsx:24-57`

## Link Stats Modal Mock

Status: Observed.

The link stats modal shows hard-coded metrics, destination URL, created date, and updated date.

Evidence:

- `src/components/dashboard/views/link-card.tsx:298-360`

## Link Lifecycle Menu Mock

Status: Observed.

Edit, Deactivate, and Delete menu items are visible but do not call any handler.

Evidence:

- `src/components/dashboard/views/link-card.tsx:288-360`

## Create Modal Mock Options

Status: Observed.

Topbar create modal has Social Link, Note, Bio Link options. The option data has optional `onClick`, but no option supplies one.

Evidence:

- `src/components/create-link-dialog.tsx:14-39`
- `src/components/create-link-dialog.tsx:61-70`

## Account Mock

Status: Observed.

Account page contains hard-coded name/email/verified status and cards without behavior.

Evidence:

- `src/components/dashboard/views/account.tsx:5-54`

## Support Mock

Status: Observed.

Support page contains static ticket rows, FAQ, and a support form without submit handler.

Evidence:

- `src/components/dashboard/views/support.tsx:64-110`

## Withdraw Mock

Status: Observed.

Withdraw page contains static balances/history and a form without submit handler.

Evidence:

- `src/components/dashboard/views/withdraw.tsx:21-120`

## Referral/Levels/Leaderboard Mock

Status: Observed.

Referral, levels, and leaderboard pages are static UI.

Evidence:

- `src/components/dashboard/views/referrals.tsx:12-117`
- `src/components/dashboard/views/levels.tsx:13-160`
- `src/components/dashboard/views/leaderboard.tsx:6-80`

## Email Capture Dead Code

Status: Dead code.

Email capture UI is commented out in create link flow and has no backend model/API.

Evidence:

- `src/app/create/demo.tsx:1699-1710`

## Widget Preview Dead/Placeholder Code

Status: Partial / placeholder.

Create link flow has a commented widgets/previews section.

Evidence:

- `src/app/create/demo.tsx:1712-1723`

## Uploaded File Artifact

Status: Legacy / unrelated artifact.

`uploads/files/link-in-bio-generator-e4acf0fa6264ec15.tsx` is inside uploads and is picked up by lint. It appears to be an uploaded copy of a component, not an app source route.

Evidence:

- `npm run lint` reports `uploads/files/link-in-bio-generator-e4acf0fa6264ec15.tsx`.

## Generated Dist in Lint Scope

Status: Legacy/build artifact.

`dist/backend` is linted and causes `require()` lint errors.

Evidence:

- `npm run lint` reports `dist/backend/prisma/prisma.service.js`.

## FE-First Recommendation

Status: Recommended.

Keep mock screens, but label or isolate them:

- Move reusable mock data under a clearly named `src/mocks` area.
- Keep uploaded/generated artifacts out of app lint/build scope.
- Add visible dev-only badges or route metadata for “Mocked” pages during internal development.

