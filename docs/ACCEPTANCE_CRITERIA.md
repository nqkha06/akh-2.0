# Acceptance Criteria

## Creator Flows

Status: Recommended

- Creator can register, log in, log out, and reset password.
- Creator can create a gated link with title, destination, slug, and one or more actions.
- Creator can preview, publish, edit, disable, and delete own links.
- Creator can copy public URL.
- Creator can create and edit a link-in-bio page.
- Creator can inspect free analytics for owned links.

## Visitor Flows

Status: Recommended

- Visitor can open a public link without signing in.
- Invalid/deleted links show a clear inactive state.
- Visitor sees required action list and progress.
- Destination unlocks only after required actions are completed.
- Refresh and back-navigation preserve expected completion state within the deduplication policy.

## Analytics

Status: Recommended

- Views, unlocks, clicks, conversion rate, and action completions are tracked.
- Events are deduplicated.
- Dashboard shows empty and populated states.

## Security

Status: Recommended

- No open redirects.
- No cross-account link access.
- Public submissions are rate-limited.
- Link content is sanitized.
- Suspicious destinations can be blocked or reported.

## Exclusions

Status: Required

No billing, Pro plan, checkout, subscription, payment, or paid entitlement behavior is accepted in this scope.
