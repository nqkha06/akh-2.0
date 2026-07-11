# Current System Overview

Scope: audit dự án hiện tại theo hướng FE-first. Backend/mock data được xem là hạ tầng tạm cho prototype, nhưng các rủi ro production vẫn được ghi rõ.

## Executive Summary

Overall status: Partial / FE prototype.

Dự án đang là dashboard Next.js với nhiều màn hình creator đã dựng UI, kèm Nest API tối thiểu cho links, files và bio pages. Phần frontend có UX khá rộng, nhưng nhiều module vẫn là static/mock. Backend hiện chưa có authentication, authorization, ownership, analytics event model, social-action completion model, edit/delete link API, hoặc moderation/report model.

Production ready: No.

Primary FE blocker: `npm run build` fail type-check tại `src/app/bio/link-in-bio-generator.tsx:995` do callback `ImagePicker` có thể trả `undefined` nhưng `updateAppearanceSettings` nhận `string`.

Primary product gap: Social gated unlock flow hiện chỉ hiển thị action link và destination cùng lúc; visitor không cần hoàn thành action để mở destination.

Primary production risk: API mutating/list endpoints public và database không có `User`/owner relationship.

## Stack Inventory

Status: Observed.

- Next.js 16 / React 19 frontend: `src/app`, `src/components`.
- NestJS API: `backend/src`.
- Prisma ORM with SQLite datasource: `prisma/schema.prisma`.
- UI libraries: Radix/shadcn-style components, lucide, simple-icons.
- API client: browser fetch wrapper in `src/lib/api-client.ts`.

Evidence:

- `package.json:6-16`
- `package.json:21-66`
- `prisma/schema.prisma:5-8`
- `backend/src/app.module.ts`
- `src/lib/api-client.ts:1-3`

## Application Surface

Status: Observed.

Frontend routes:

- `/`: dashboard overview.
- `/links`: social/sub-to-unlock management and create tabs.
- `/create`: re-exports social link generator.
- `/files`: file management UI backed by API.
- `/bio`: link-in-bio management and create flow.
- `/b/[slug]`: public bio page.
- `/l/[slug]`: public link page.
- `/account`, `/support`, `/withdraw`, `/referrals`, `/levels`, `/leaderboard`, `/loyalty`, `/new`: mostly dashboard/static modules.

Backend routes:

- `POST /api/links`
- `GET /api/links`
- `GET /api/links/:slug`
- `GET /api/files`
- `POST /api/files`
- `PATCH /api/files/:id`
- `DELETE /api/files/:id`
- `GET /api/files/:id/download`
- `POST /api/bio-pages`
- `GET /api/bio-pages`
- `GET /api/bio-pages/:slug`
- `POST /api/bio-pages/:slug/click`

Evidence:

- `src/components/dashboard/shell.tsx:45-75`
- `backend/src/links/links.controller.ts:6-23`
- `backend/src/files/files.controller.ts:28-90`
- `backend/src/bio-pages/bio-pages.controller.ts:6-28`

## Verification Results

Status: Observed.

- `npm run api:build`: passed.
- `npm run build`: failed during TypeScript check at `src/app/bio/link-in-bio-generator.tsx:995`.
- `npm run lint`: failed. Important causes include lint scanning `dist/backend`, `uploads/files`, and `react-hooks/set-state-in-effect` in `src/components/ui/carousel.tsx`.

Build evidence:

```text
npm run build
Failed to type check.
./src/app/bio/link-in-bio-generator.tsx:995:96
Type error: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

Lint evidence:

```text
npm run lint
✖ 8 problems (4 errors, 4 warnings)
```

## Completion Read

Status: Inferred.

The project is best treated as:

- FE prototype: usable for visual iteration and basic page navigation.
- Backend mock/minimal API: useful for storing demo links/files/bio pages locally.
- Not a secure multi-user product.
- Not analytics-ready except simple bio page view/click counters.
- Not ready for production build until the TypeScript error is fixed.

