# Page Inventory

## Homepage

Status: Observed

- URL: `https://rekonise.com/`
- Purpose: Public marketing and product demo.
- Components: header, hero, social gated link mockups, social action section, analytics/email/link-in-bio feature sections, testimonials, footer.
- Lazy/after-scroll behavior: after scrolling, additional animated/demo states were visible, including completed action checks, `4/4 done`, an unlocked button state, analytics counters, and email subscriber feed examples.
- Primary actions: create first link, sign up free.
- Responsive: mobile keeps a top menu button and stacks content vertically.
- Evidence: `evidence/screenshots/public/homepage-desktop.png`, `evidence/screenshots/public/homepage-desktop-lazy-after-scroll.png`, `evidence/screenshots/mobile/homepage-mobile-390.png`

## How It Works

Status: Observed

- URL: `https://rekonise.com/how-it-works`
- Purpose: Explains create/share/grow workflow.
- Components: public navigation, three-step explanation, creator use cases, footer.
- Evidence: `evidence/screenshots/public/public-link-01-how-it-works.png`

## Public Create

Status: Observed

- Requested URL: `https://rekonise.com/create`
- Final URL observed in SPA state: `https://rekonise.com/`
- Purpose: Start building a gated link before sign-up.
- Fields: link title, destination URL, action selector.
- Buttons: Select action, Add action, Create. Create remains disabled until requirements are met.
- Lazy/after-scroll behavior: the route includes the pre-signup create form followed by the same long landing content; after scroll, demo analytics and completion states are visible below the form.
- Evidence: `evidence/screenshots/create-link/public-create-initial.png`, `evidence/screenshots/create-link/public-create-filled-no-action.png`, `evidence/screenshots/create-link/public-create-lazy-after-scroll.png`

## Login

Status: Observed

- URL: `https://rekonise.com/login`
- Methods: Google, Discord, email/password.
- Fields: email and password, both required.
- Links/actions: create account, forgot password.
- Invalid credential test: no visible inline error appeared within the wait window after submitting a clearly fake address and password.
- Evidence: `evidence/screenshots/authentication/login.png`, `evidence/screenshots/authentication/login-invalid-credentials.png`

## Register

Status: Observed

- URL: `https://rekonise.com/register`
- Methods: Google, Discord, email/password.
- Fields: email and password, both required.
- Evidence: `evidence/screenshots/authentication/register.png`

## Password Reset

Status: Observed

- `/forgot-password` and `/password/reset` showed public "Link Not Found" pages.
- Clicking "Forgot password?" from `/login` navigated to `/password-reset`, which displayed a reset form with an email field and Reset button.
- Evidence: `evidence/screenshots/authentication/forgot-password-click-result.png`

## Contact And Legal Pages

Status: Observed

- Contact page offers Discord, feedback, and email support actions.
- Terms, privacy, and cookies pages are public legal content.
- Evidence: `evidence/screenshots/public/public-link-03-contact.png`, `evidence/screenshots/public/public-link-04-terms.png`

## Invalid Public Link

Status: Observed

- URL tested: `https://rekonise.com/this-link-should-not-exist-codex-test`
- The page shows "This link is no longer active" and a "Create your own link" action.
- Network also requests `/social-unlocks/{slug}` and receives 404 JSON.
- Evidence: `evidence/screenshots/visitor-flow/invalid-public-link.png`, `evidence/network/links/interaction-create-public.json`

## Authenticated Links Dashboard

Status: Observed

- URL: `/dashboard/links`
- Purpose: manage creator links.
- Components: dashboard navigation, Create link action, Shortened links tab, selectable table rows, edit actions, title/type/status/count/date columns, row overflow menu, pagination.
- Evidence: `evidence/screenshots/dashboard/authenticated-home.png`, `evidence/notes/authenticated-run-summary.json`

## Authenticated Create Link

Status: Observed

- URL: `/dashboard/links/create`
- Types: URL, File, Snippet.
- URL form fields: destination URL, title, actions, advanced options, customization, cover image, custom URL, background, email capturing, widgets/previews, expire link prompt.
- File type shows Select file and title.
- Snippet type shows Select snippet and title.
- Evidence: `evidence/screenshots/dashboard/auth-10-dashboard-links-create.png`, `evidence/screenshots/create-link/auth-create-file-toggle-exact.png`, `evidence/screenshots/create-link/auth-create-snippet-toggle-exact.png`

## Authenticated Analytics And Audience

Status: Observed

- Analytics page exposes date range tabs and metrics: Unlocks, Actions completed, Views, Conversion rate, Emails captured, Quick Insights, Top Links.
- Audience page exposes links/pages tabs, date range, activity, top links, source, country, city, device, browser, platform.
- Some sections show upgrade prompts; not explored.
- Evidence: `evidence/screenshots/analytics/auth-07-dashboard-analytics.png`, `evidence/screenshots/dashboard/auth-08-dashboard-audience.png`
