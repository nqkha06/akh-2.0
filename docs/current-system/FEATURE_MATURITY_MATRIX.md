# Feature Maturity Matrix

Allowed statuses used: Complete, Happy-path only, Partial, Frontend only, Backend only, Mocked, Unstable, Legacy, Dead code, Not implemented, Unknown.

| Feature | Overall status | Backend | Frontend | Database | Validation | Authorization | Tests | Production ready | Evidence |
| ------- | -------------- | ------- | -------- | -------- | ---------- | ------------- | ----- | ---------------- | -------- |
| Dashboard shell/navigation | Partial | Not implemented | Partial | Not implemented | Not implemented | Not implemented | Not implemented | No | `src/components/dashboard/shell.tsx:45-75`; no middleware found |
| Authentication/register/login/logout | Not implemented | Not implemented | Mocked | Not implemented | Not implemented | Not implemented | Not implemented | No | `src/components/dashboard/shell.tsx:230-289`; no `User` model |
| Creator create social link | Partial | Happy-path only | Partial | Partial | Partial | Not implemented | Not implemented | No | `src/app/create/demo.tsx:833-919`; `backend/src/links/links.service.ts:16-75` |
| Link list | Partial | Happy-path only | Partial | Partial | Unknown | Not implemented | Not implemented | No | `src/lib/api-client.ts:177-187`; `backend/src/links/links.service.ts:78-88` |
| Link edit | Not implemented | Not implemented | Frontend only | Partial | Not implemented | Not implemented | Not implemented | No | Edit menu exists without handler/API: `src/components/dashboard/views/link-card.tsx:288-360` |
| Link deactivate/delete | Not implemented | Not implemented | Frontend only | Partial | Not implemented | Not implemented | Not implemented | No | Deactivate/Delete menu exists without handler/API |
| Public link page | Partial | Happy-path only | Partial | Partial | Unknown | Not implemented | Not implemented | No | `src/app/l/[slug]/page.tsx:16-72`; `backend/src/links/links.service.ts:91-105` |
| Social action gated unlock | Mocked | Not implemented | Frontend only | Partial | Partial | Not implemented | Not implemented | No | Actions render as anchors and destination visible immediately: `src/app/l/[slug]/page.tsx:47-72` |
| Visitor completion tracking | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | No | No completion route/model found |
| Destination redirect/click tracking | Partial | Not implemented | Partial | Partial | Unknown | Not implemented | Not implemented | No | `Link.clicks` exists but is not incremented; public page uses external anchor |
| File management | Partial | Happy-path only | Partial | Partial | Partial | Not implemented | Not implemented | No | `backend/src/files/files.controller.ts:32-90`; `src/components/dashboard/views/files.tsx` |
| File public/private toggle | Unstable | Partial | Partial | Partial | Partial | Not implemented | Not implemented | No | `isPublic` stored but download ignores it: `backend/src/files/files.service.ts:156-171` |
| Link-in-bio create/list/public | Unstable | Happy-path only | Partial | Partial | Partial | Not implemented | Not implemented | No | build fails at `src/app/bio/link-in-bio-generator.tsx:995`; API exists |
| Link-in-bio edit/delete | Not implemented | Not implemented | Frontend only | Partial | Not implemented | Not implemented | Not implemented | No | No PATCH/DELETE `bio-pages` route |
| Bio analytics | Partial | Happy-path only | Partial | Partial | Not implemented | Not implemented | Not implemented | No | `backend/src/bio-pages/bio-pages.service.ts:65-102`; `src/app/bio/bio-view.tsx:35-40` hard-coded sources |
| Link analytics | Mocked | Not implemented | Mocked | Partial | Not implemented | Not implemented | Not implemented | No | Link stats modal hard-coded: `src/components/dashboard/views/link-card.tsx:298-360` |
| Email capture | Not implemented | Not implemented | Dead code | Not implemented | Not implemented | Not implemented | Not implemented | No | commented block: `src/app/create/demo.tsx:1699-1710` |
| Report/moderation | Not implemented | Not implemented | Mocked | Not implemented | Not implemented | Not implemented | Not implemented | No | support form has no submit handler: `src/components/dashboard/views/support.tsx:93-110` |
| Account settings | Mocked | Not implemented | Mocked | Not implemented | Not implemented | Not implemented | Not implemented | No | `src/components/dashboard/views/account.tsx:5-54` |
| Withdraw/payout | Mocked | Not implemented | Mocked | Not implemented | Not implemented | Not implemented | Not implemented | No | `src/components/dashboard/views/withdraw.tsx:12-123` |
| Referrals/levels/leaderboard | Mocked | Not implemented | Mocked | Not implemented | Not implemented | Not implemented | Not implemented | No | `src/lib/dashboard-data.ts:57-83`; related views |
| Jobs/queues/scheduled tasks | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | No | no queue/schedule symbols found |
| Cache | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | No | no `CacheModule`/redis usage found |
| Events/listeners | Partial | Not implemented | Partial | Not implemented | Not implemented | Not implemented | Not implemented | No | frontend custom events only: `Rekonise:link-created`, `STU:file-created` |
| Tests | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | Not implemented | No | no `*.test.*`, `*.spec.*`, factories, seeders found |

## Build Maturity

Status: Unstable.

- Backend build passed: `npm run api:build`.
- Frontend production build failed: `npm run build`.
- Lint failed: `npm run lint`.
