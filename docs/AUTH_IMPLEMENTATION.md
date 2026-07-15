# Authentication implementation scope

## ERD review

Status: Observed

The legacy ERD defines `users`, `social_accounts`, Laravel `sessions`, Sanctum
`personal_access_tokens`, password-reset tokens, and Spatie RBAC tables. Only
`users` and `social_accounts` are directly required for the first login slice.

Source: `docs/DATABASE_ERD.md`, sections 4.1, 4.8, and 7.

## Schema differences applied

Status: Recommended and implemented

- `users` keeps the authentication-relevant legacy fields: name, unique email,
  nullable password, email verification timestamp, avatar, status, and audit
  timestamps.
- `role` is stored directly on `users` for the first authorization slice. The
  Laravel polymorphic `model_has_roles` table is intentionally not ported.
- `token_version` was added so NestJS can invalidate previously issued JWTs
  after future security-sensitive changes.
- `social_accounts` keeps the user/provider relationship and uses the explicit
  `provider_account_id` name with a unique `(provider, provider_account_id)`
  constraint.
- OAuth access and refresh tokens are not stored. Auth.js forwards the Google ID
  token to NestJS, which verifies it and persists only the account identity.

## Legacy tables intentionally excluded

Status: Recommended

- `sessions`: Laravel payload sessions are incompatible with Auth.js JWT cookie
  sessions and do not need to be migrated.
- `personal_access_tokens`: Laravel Sanctum infrastructure is replaced by
  Passport JWT.
- `password_reset_tokens`: deferred until the password-reset delivery flow is
  implemented.
- `roles`, `permissions`, and Spatie pivot tables: deferred until the product
  needs granular RBAC and legacy role data is migrated.
- Balance, tier, and referral columns: valid product-domain fields, but not part
  of the minimal authentication migration.

## Runtime model

1. Auth.js receives credentials or completes Google OAuth.
2. Auth.js calls the NestJS authentication API.
3. NestJS validates the password through Passport Local or verifies the Google
   ID token, then issues a signed JWT.
4. Auth.js stores that backend JWT in its encrypted JWT session cookie.
5. Protected Next.js routes require an Auth.js session. NestJS protected routes
   require the backend JWT as a Bearer token.

For the current SQLite development database, auth IDs use an auto-incrementing
`Int`. Before the documented MySQL migration, change this field to unsigned
`BIGINT` and keep it as a string at API boundaries if IDs may exceed JavaScript's
safe integer range.
