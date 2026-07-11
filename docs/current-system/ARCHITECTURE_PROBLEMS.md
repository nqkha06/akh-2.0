# Architecture Problems

## P0 if Exposed Beyond Local FE Prototype

### No authentication/authorization boundary

Status: Observed.

All current API endpoints are public. Controllers do not use guards and the schema has no owner relation.

Impact:

- Anyone who can reach the API can list, create, update, soft-delete, or download resources.
- No user isolation can be implemented without schema/API changes.

Evidence:

- `backend/src/links/links.controller.ts:10-22`
- `backend/src/files/files.controller.ts:32-80`
- `backend/src/bio-pages/bio-pages.controller.ts:10-27`
- `prisma/schema.prisma:10-94`

FE-first note: acceptable only if API is local/mock-only and not reachable publicly.

### File privacy flag is not enforced

Status: Observed.

`ManagedFile.isPublic` can be toggled, but `FilesService.download()` calls `findOne()` and streams the file without checking `isPublic`.

Impact:

- UI can show a file as private while direct download still works.

Evidence:

- `backend/src/files/files.service.ts:129-137`
- `backend/src/files/files.service.ts:156-171`

## P1 Main Flow Blockers

### Frontend production build fails

Status: Observed.

`npm run build` fails on `src/app/bio/link-in-bio-generator.tsx:995`.

Impact:

- The current frontend cannot be shipped as a production Next build.

Evidence:

```text
Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

Related source:

- `src/components/image-picker.tsx:15-18`
- `src/app/bio/link-in-bio-generator.tsx:990-996`

### Social unlock is not actually gated

Status: Observed.

Public link page renders action anchors and destination button at the same time.

Impact:

- “Sub/social action to unlock” user promise is broken.

Evidence:

- `src/app/l/[slug]/page.tsx:47-72`

### Link lifecycle actions are visible but disconnected

Status: Observed.

Edit, Deactivate, Delete appear in `LinkCard`, but no handlers are attached and backend has no corresponding link routes.

Impact:

- Creator cannot maintain links after creation.

Evidence:

- `src/components/dashboard/views/link-card.tsx:288-360`
- `backend/src/links/links.controller.ts:10-22`

## Contract Problems

### Backend stores fields frontend expects, but behavior is not implemented

Status: Observed.

Examples:

- `expiryEnabled`, `expiryType`, `expiryDate`, `maxClicks` are saved but not enforced.
- `clicks` exists on `Link` but public link flow does not increment it.
- `status` exists but public link flow does not check active/paused/expired.

Evidence:

- `prisma/schema.prisma:21-35`
- `backend/src/links/links.service.ts:37-41`
- `src/app/l/[slug]/page.tsx:16-72`

### API responses are inconsistent by domain

Status: Observed.

- `GET /links` returns an array.
- `GET /files` returns `{ items, total, totalSize }`.
- `POST /bio-pages/:slug/click` returns `{ clicks }`.

Evidence:

- `src/lib/api-client.ts:177-187`
- `src/lib/api-client.ts:225-234`
- `src/lib/api-client.ts:331-340`

## Data Modeling Problems

### Bio page nested data stored as JSON strings

Status: Observed.

Bio social links, custom links, widgets, and hidden links are JSON strings.

Impact:

- Hard to edit individual items, query top links, validate per item, or track per-link analytics.

Evidence:

- `prisma/schema.prisma:83-86`
- `backend/src/bio-pages/bio-pages.service.ts:35-38`

### File destination relation is not normalized

Status: Observed.

`Link.selectedFile` is an optional string and not a FK to `ManagedFile`.

Impact:

- Cannot guarantee selected file exists long-term or enforce owner relation later without migration.

Evidence:

- `prisma/schema.prisma:17`
- `backend/src/links/links.service.ts:130-135`

## Build/Lint Hygiene Problems

Status: Observed.

`npm run lint` scans generated and evidence/upload directories:

- `dist/backend/prisma/prisma.service.js`
- `evidence/notes/create-link-types-rekonise.mjs`
- `uploads/files/link-in-bio-generator-e4acf0fa6264ec15.tsx`

Impact:

- Lint signal is noisy and blocks unrelated FE work.

Evidence:

- lint command output.
- `package.json:10` uses plain `eslint`.

## FE-First Recommendation

Status: Recommended.

Short-term architecture should explicitly split:

- `mock/demo data` for dashboard analytics, account, payout, referrals, levels.
- `mock persistence API` for local create/list flows.
- `real FE vertical slices` for create link, public link, link-in-bio.

