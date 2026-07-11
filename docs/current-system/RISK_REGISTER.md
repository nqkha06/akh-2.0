# Risk Register

## Risk Table

| ID | Severity | Risk | Status | Evidence | Mitigation |
| --- | --- | --- | --- | --- | --- |
| R-001 | P0 for production | API has no auth/authorization or owner model | Observed | controllers have no guards; `prisma/schema.prisma:10-94` has no `User` | Keep API local/mock-only or add auth + ownership before public exposure |
| R-002 | P0 for production | Private file flag is not enforced on download | Observed | `backend/src/files/files.service.ts:156-171` | Enforce `isPublic` or signed/authorized downloads |
| R-003 | P1 | Frontend production build fails | Observed | `npm run build` output; `src/app/bio/link-in-bio-generator.tsx:995` | Fix type contract around optional image URL |
| R-004 | P1 | Social unlock flow can be bypassed by normal UI | Observed | `src/app/l/[slug]/page.tsx:47-72` | Add locked state, completion events, unlock condition |
| R-005 | P1 | Link edit/deactivate/delete are not implemented | Observed | `src/components/dashboard/views/link-card.tsx:288-360`; no link PATCH/DELETE route | Implement or hide until wired |
| R-006 | P1 | Mock analytics may be mistaken as real | Observed | `src/components/dashboard/views/link-card.tsx:298-360`; `src/app/bio/bio-view.tsx:35-40` | Add mock labels and isolate demo data |
| R-007 | P2 | Lint checks generated/evidence/upload artifacts | Observed | `npm run lint` output | Restrict ESLint ignores/scope |
| R-008 | P2 | Bio views/clicks are naive counters | Observed | `backend/src/bio-pages/bio-pages.service.ts:65-102` | Add event model/dedupe when analytics becomes real |
| R-009 | P2 | File upload lacks MIME/content validation | Observed | `backend/src/files/files.controller.ts:42-58` | Add MIME allowlist and scanning if file uploads remain |
| R-010 | P2 | JSON storage for bio links blocks robust editing/analytics | Observed | `prisma/schema.prisma:83-86` | Normalize when backend becomes real |
| R-011 | P2 | CORS origin is open with credentials | Observed | `backend/src/main.ts:15-18` | Restrict origins before deployment |
| R-012 | P3 | Brand/demo/pro subscription labels leak into FE prototype | Observed | `src/components/dashboard/shell.tsx:242-279`; `src/app/layout.tsx:18-19` | Replace with neutral mock labels when product direction is set |

## P0 Risks

Current P0 risks only apply if the backend/API is made public or used as real multi-user infrastructure. Under FE-only local mock mode, they are tracked but not immediate blockers.

## P1 FE Blockers

For the current FE focus, the true immediate blockers are:

- production build failure.
- social unlock UX not matching gated promise.
- visible controls that do nothing.
- mixed mock/real analytics confusing product QA.

## Risk Trend

Status: Inferred.

Risk will grow quickly if more UI is added without a mock/real boundary. The fastest way to reduce risk is to choose one vertical slice and make every visible control in that slice either wired or clearly disabled.

