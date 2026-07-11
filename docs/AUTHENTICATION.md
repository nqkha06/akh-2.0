# Authentication

## Login

Status: Observed

- URL: `/login`
- Methods: Continue with Google, Continue with Discord, email/password.
- Email placeholder: `your@email.com`
- Password field includes visibility toggle.
- "Forgot password?" is a button.
- Link to register: "Create a free account".

Evidence:

- `evidence/screenshots/authentication/login.png`
- `evidence/notes/authentication-login.json`

## Registration

Status: Observed

- URL: `/register`
- Methods: Google, Discord, email/password.
- Fields: required email and password.
- Link to sign in.

Evidence:

- `evidence/screenshots/authentication/register.png`

## Password Reset

Status: Observed

Clicking "Forgot password?" from login opens `/password-reset`, with an email field and Reset button.

Evidence:

- `evidence/screenshots/authentication/forgot-password-click-result.png`

## Invalid Credentials

Status: Observed

Submitting one clearly fake email/password pair did not show a visible inline error within the short wait window. This does not prove there is no error state; it may be delayed, toast-based, blocked, or network-dependent.

Evidence:

- `evidence/screenshots/authentication/login-invalid-credentials.png`

## Session And Protected Routes

Status: Observed

Successful email/password login triggered `POST /auth/login` and `GET /users`, then landed on `/dashboard/links`. Authenticated page loads also triggered `POST /auth/refresh-token`. Unauthenticated protected route attempts redirect to `/login?returnUrl=...`.

Evidence:

- `evidence/network/links/authenticated-home.json`
- `evidence/network/links/auth-create-url-initial.json`
