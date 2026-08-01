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
- Roles and permissions are resolved by NestJS from `roles`, `permissions`,
  `role_has_permissions`, `user_has_roles`, and `user_has_permissions`.
- `token_version` was added so NestJS can invalidate previously issued JWTs
  after future security-sensitive changes.
- `social_accounts` keeps the user/provider relationship and uses the explicit
  `provider_account_id` name with a unique `(provider, provider_account_id)`
  constraint.
- OAuth access and refresh tokens are not stored. Google Identity Services sends
  an ID token to the NestJS endpoint, which verifies it and persists only the
  account identity.
- `auth_sessions` stores only a hash of the rotating refresh token plus its
  lifecycle metadata. Raw refresh tokens are never persisted.

## Legacy tables intentionally excluded

Status: Recommended

- `sessions`: Laravel payload sessions are not used. NestJS owns JWT issuance and
  the `auth_sessions` records used for refresh-token rotation and revocation.
- `personal_access_tokens`: Laravel Sanctum infrastructure is replaced by
  Passport JWT.
- `password_reset_tokens`: deferred until the password-reset delivery flow is
  implemented.
- Balance, tier, and referral columns: valid product-domain fields, but not part
  of the minimal authentication migration.

## Runtime model

1. Next.js submits credentials, registration data, logout requests, or Google ID
   tokens to NestJS through the same-origin backend proxy.
2. NestJS validates the request and is the only service that creates, rotates,
   revokes, or verifies authentication tokens.
3. NestJS returns the public current-user payload and sets the access and refresh
   JWTs as `HttpOnly`, `SameSite` cookies. Frontend code never stores tokens in
   `localStorage` or a JavaScript-readable cookie.
4. Protected Next.js layouts load the current user from `GET /auth/me`; their
   client descendants receive that serializable public user through a React
   context, not through a second session system.
5. NestJS guards resolve roles and permissions from the database. Bearer access
   tokens remain accepted for non-browser API clients, while browser requests
   authenticate with the access cookie.
6. When an access token expires, the Next.js transport calls `POST /auth/refresh`
   once, forwards the rotated cookies, and retries the original backend request.

## Google Sign-In configuration

1. Create a Google OAuth client with application type **Web application**.
2. Add the frontend origins used by the app, for example
   `http://localhost:3000` in development and the HTTPS production origin.
3. Set the same client ID in both runtime environments:
   - API: `AUTH_GOOGLE_ID`
   - Web: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
4. Restart the API and web processes after changing environment variables.

The web app uses the Google Identity Services rendered button and sends the
returned ID token to `POST /auth/google`. The API verifies the token audience,
requires a verified Google email, links or creates the local user, and stores
only the Google account identifier in `social_accounts`.

## Administrative session management

The Admin Users detail page loads up to 50 recent authentication sessions for
users when the administrator has `users.revoke-sessions`. Each row exposes only
lifecycle metadata: authentication method, user agent, IP address, creation,
last activity, expiry, revocation status, and whether it is the current admin
session. Refresh-token hashes are never returned.

Administrators can revoke one active session or all sessions for another user.
The current administrator session cannot be revoked from this screen, avoiding
an accidental self-lockout while managing users.

For the current SQLite development database, auth IDs use an auto-incrementing
`Int`. Before the documented MySQL migration, change this field to unsigned
`BIGINT` and keep it as a string at API boundaries if IDs may exceed JavaScript's
safe integer range.
