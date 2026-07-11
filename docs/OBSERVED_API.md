# Observed API

## Scope

Status: Network-observed

Only browser-visible request method, path, status, and general response shape are documented. Cookies, tokens, headers, request bodies, and private IDs are not stored.

## Public Pages

Status: Network-observed

- `GET /` returns HTML.
- `GET /how-it-works` returns HTML.
- `GET /create` returns HTML.
- `GET /login` returns HTML.
- `GET /register` returns HTML.
- `GET /contact` returns HTML.
- `GET /terms`, `/privacy`, `/cookies` return HTML.

Evidence:

- `evidence/network/links/homepage-desktop.json`
- `evidence/network/authentication/login.json`

## Public Stats

Status: Network-observed

- `GET /stats` returns JSON during public create/homepage interaction.
- The after-scroll `/create` pass also triggered `GET /stats`; the after-scroll homepage and how-it-works pages did not expose additional Rekonise API paths beyond document/assets in the filtered network output.

Evidence:

- `evidence/network/links/interaction-create-public.json`
- `evidence/network/links/public-create-lazy-after-scroll.json`

## Public Unlock Lookup

Status: Network-observed

- `GET /social-unlocks/{slug}` returns JSON.
- For nonexistent slugs, status is 404.

Evidence:

- `evidence/network/links/interaction-create-public.json`

## Authenticated Link Creation

Status: Network-observed

- `POST /auth/login` authenticates email/password and returns JSON containing email/token-shaped fields. Values were not stored.
- `POST /auth/refresh-token` refreshes authenticated sessions and returns token-shaped JSON. Values were not stored.
- `GET /users` loads current user.
- `GET /social-unlocks?{query}` loads creator links.
- `GET /social-unlocks/recent-actions` loads reusable actions.
- `POST /social-unlocks` creates a social unlock link. Observed request shape included type, url, title, actions, optional file/snippet/cover/background/custom_slug/widgets/style/email_lists/category/tags/config fields. Response included slug and action data.
- `GET /social-unlocks/{slug}` loads a public created link.
- `POST /traffic/log` records public visitor traffic.

Evidence:

- `evidence/network/links/auth-create-url-submit-result.json`
- `evidence/network/visitor-flow/created-url-mobile-initial.json`

## Authenticated Dashboard APIs

Status: Network-observed

- `GET /link-in-bio`
- `GET /email-lists?{query}`
- `GET /storage?{query}`
- `GET /users/storage-usage`
- `GET /social-unlocks/analytics?{query}`
- `GET /social-unlocks/analytics/top-actions?{query}`
- `GET /traffic-audience/quick-insights?{query}`
- `GET /traffic-audience/activity/referrers/links/countries/platforms/browsers/cities/devices?{query}`

Evidence:

- `evidence/network/links/auth-03-dashboard-link-in-bio.json`
- `evidence/network/links/auth-05-dashboard-storage.json`
- `evidence/network/analytics/auth-07-dashboard-analytics.json`
- `evidence/network/links/auth-08-dashboard-audience.json`

## Analytics/Third-Party

Status: Network-observed

- Cloudflare RUM endpoint receives POSTs.
- Google analytics collection endpoint receives POSTs.

These are implementation details of the reference site and should not be treated as required rebuild architecture.
