# Website Product Reverse Engineering

## 1. Project purpose

This workspace is used to study the publicly observable product behavior, user experience, link creation flows, design patterns, and frontend interactions of the reference website:

`https://rekonise.com/`

The objective is to produce implementation-ready Markdown documentation for building an independent product with similar categories of functionality.

The objective is not to copy the original product exactly.

Do not copy:

* Brand name
* Logo
* Marketing text
* Copyrighted content
* Images or illustrations
* Private source code
* Proprietary assets
* User data
* Authentication tokens
* Cookies
* Secrets
* Paid-only implementation details

The final product must use its own architecture, code, design, branding, and content.

---

## 2. Agent role

Act as a product reverse-engineering agent.

Use browser automation to:

* Open the reference website
* Navigate through public pages
* Sign in using the prepared test account
* Explore dashboard pages
* Create test links
* Inspect link configuration options
* Preview links
* Open published links as a visitor
* Document user flows
* Inspect visible network requests when available
* Capture screenshots and browser snapshots
* Analyze responsive behavior
* Analyze UI components and design tokens
* Produce structured Markdown documentation

Do not begin implementing the new product unless explicitly requested.

---

## 3. Browser access

Use the browser tool configured for this workspace.

Preferred tools:

1. Playwright Interactive
2. Playwright MCP
3. `agent-browser`
4. Standard Playwright scripts

Use the existing authenticated browser profile when available.

When authentication requires any of the following, allow the user to complete the step manually:

* CAPTCHA
* Google OAuth
* Discord OAuth
* Email verification
* Two-factor authentication
* Security challenge

Never attempt to bypass authentication or security controls.

Never write passwords, cookies, session IDs, access tokens, refresh tokens, or OAuth credentials into Markdown files.

---

## 4. Research scope

Research all functions accessible without purchasing or activating a paid plan.

The research must prioritize:

* Link creation
* Social-action links
* Link-in-bio pages
* Destination links
* Visitor unlock flows
* Link management
* Link editing
* Link preview
* Link analytics visible on the free account
* Account settings
* Public page experience
* Mobile responsive behavior
* Form validation
* Loading, success, empty, and error states

---

## 5. Explicitly excluded scope

Do not research, document, test, or reproduce:

* Pro plan
* Premium plan
* Paid subscription
* Billing
* Checkout
* Payment methods
* Upgrade flow
* Trial activation
* Paid-only limits
* Paid-only analytics
* Paid-only customization
* Paid-only domains
* Paid-only integrations
* Features that require a purchase
* Features inaccessible to the prepared free test account

If an upgrade prompt appears:

1. Record only that the function is unavailable on the current account.
2. Do not open checkout.
3. Do not enter payment information.
4. Do not infer how the paid feature works.
5. Do not include the paid feature in the rebuild plan.

The target system described in the final documentation must not contain a subscription or Pro-plan module.

---

## 6. Safety rules

Only use a dedicated test account.

Allowed actions:

* Open pages
* Navigate menus
* Create test links
* Edit test links
* Preview test links
* Visit links created by the test account
* Complete non-destructive test actions
* Delete test data created during the research process
* Inspect browser-visible requests and responses
* Capture screenshots
* Test desktop and mobile layouts

Forbidden actions:

* Access another user's data
* Enumerate private resources
* Bypass authorization
* Bypass CAPTCHA
* Bypass rate limits
* Bypass paywalls
* Attempt privilege escalation
* Trigger real payments
* Send spam
* Publish harmful content
* Upload malicious files
* Perform load testing
* Perform security exploitation
* Copy private or minified application source for reuse
* Store sensitive browser data in the repository

---

## 7. Required research process

### Phase 1: Public website inventory

Explore all accessible public pages.

Document:

* Homepage
* Login page
* Registration page
* Forgot-password page
* Public navigation
* Footer navigation
* Public link pages
* Public link-in-bio pages when examples are available
* Legal and policy pages only when relevant to product behavior
* Desktop navigation
* Mobile navigation

For each page, record:

* Page title
* URL
* Entry point
* Main purpose
* Main components
* Primary actions
* Secondary actions
* Forms
* Validation
* Responsive behavior
* Screenshots
* Unknown behavior

Do not spend time documenting pricing, premium comparisons, or upgrade marketing.

---

### Phase 2: Authentication flow

Study the authentication experience available to the test account.

Document:

* Registration entry point
* Login form
* Available login methods
* Forgot-password flow
* Email verification behavior
* Invalid credential behavior
* Loading state
* Error messages
* Successful redirect
* Logout behavior
* Session persistence
* Protected-route redirect behavior

Do not store real credentials.

Do not create multiple accounts unless required for an explicitly authorized test.

---

### Phase 3: Dashboard inventory

After login, inspect all dashboard navigation items available to the free account.

Create a page inventory containing:

* Dashboard home
* Link lists
* Link creation entry points
* Link detail pages
* Link editing pages
* Link analytics pages
* Link-in-bio management
* Account settings
* Profile settings
* Notification settings
* Any other free-accessible page

For every menu item, identify:

* Label
* URL
* Icon
* Purpose
* Page layout
* Main action
* Empty state
* Populated state
* Loading state
* Error state
* Permission requirement

Ignore billing and upgrade-related pages.

---

## 8. Link type inventory

Identify every link type available to the free test account.

At minimum, investigate whether the website supports the following categories.

### 8.1 Social-action gated link

A link where visitors must complete one or more social actions before accessing the destination.

Possible actions to inspect when visible:

* Subscribe
* Follow
* Like
* Visit
* Join
* View
* Share
* Enter email
* Open a social profile
* Open a social post
* Complete multiple actions

For each supported action, document:

* Platform
* Action name
* Required fields
* URL format
* Validation
* Optional fields
* Ordering
* Removal
* Editing
* Whether multiple actions can be combined
* Visitor-facing instruction
* Completion behavior
* Whether completion appears verified or trust-based
* Error behavior
* Unknown backend verification logic

Do not claim an action is server-verified unless browser evidence proves it.

---

### 8.2 Link-in-bio page

Inspect the complete free-accessible link-in-bio creation flow.

Document:

* Creation entry point
* Page name
* Username or slug
* Profile title
* Description or biography
* Avatar
* Background
* Social profile links
* Custom links
* Link ordering
* Link editing
* Link deletion
* Link enabling and disabling
* Preview
* Publish behavior
* Public URL
* Mobile appearance
* Desktop appearance
* Empty state
* Validation
* Public visitor interaction

Do not research premium-only appearance controls.

---

### 8.3 Direct destination link

Inspect whether users can create a link that leads to:

* External URL
* Download page
* File
* Social profile
* Video
* Article
* Landing page
* Other destination types visible on the free account

Document:

* Destination field
* URL validation
* Protocol requirements
* Redirect behavior
* Preview behavior
* Error behavior
* Edit behavior

---

### 8.4 Email-capture link

When available to the free account, document:

* Email form shown to visitors
* Required and optional fields
* Validation
* Consent text
* Submission behavior
* Success state
* Destination unlock behavior
* Creator-side subscriber list
* Export behavior only if free
* Duplicate email behavior
* Invalid email behavior

Do not submit real personal information.

Use clearly marked test addresses.

---

### 8.5 Multi-action link

When supported, inspect links containing multiple visitor requirements.

Document:

* Maximum observable number of actions
* Action ordering
* Required versus optional actions
* Progress display
* Completion state
* Back-navigation behavior
* Refresh behavior
* Partial-completion behavior
* Final unlock condition

Do not infer hidden limits without evidence.

---

### 8.6 Other free link types

If other free-accessible link types are discovered:

1. Add them to the inventory.
2. Create a separate section for each type.
3. Document their creator flow.
4. Document their visitor flow.
5. Capture screenshots.
6. Mark unverified behavior as unknown.

Do not add paid-only link types.

---

## 9. Complete create-link flow

For every available free link type, document the full creator journey.

### Required stages

1. Open the create-link entry point.
2. Select a link type.
3. Enter basic information.
4. Configure the destination.
5. Add social actions when supported.
6. Configure visitor requirements.
7. Configure free-accessible appearance options.
8. Review validation.
9. Preview the link.
10. Publish or save the link.
11. Copy the public URL.
12. Open the public URL.
13. Return to the dashboard.
14. Edit the link.
15. Save the changes.
16. Disable, archive, or delete the test link when available.

For every step, capture:

* URL
* Visible heading
* Form fields
* Default values
* Required fields
* Optional fields
* Validation rules
* Buttons
* Navigation behavior
* Network calls
* Response behavior
* Loading state
* Success state
* Error state
* Screenshot
* Browser snapshot
* Observed state changes

---

## 10. Visitor unlock flow

The visitor flow is a critical research area.

For each created gated link, test it from a separate browser context that is not logged into the creator account.

Document:

* Initial page load
* Public title
* Creator information
* Destination description
* Social actions
* Action order
* Locked state
* Progress state
* Completed state
* Unlock button
* Redirect behavior
* Final destination
* Back button behavior
* Refresh behavior
* Mobile behavior
* Invalid or unavailable link behavior

Also inspect:

* Whether actions open in a new tab
* Whether returning to the unlock page updates the state
* Whether completion is persisted after refresh
* Whether cookies or local storage appear to be involved
* Whether the visitor must sign in
* Whether the visitor can skip actions
* Whether errors are shown inline or as notifications
* Whether the destination URL is exposed before completion

Do not attempt to bypass the unlock flow.

Only document normal visitor behavior.

---

## 11. Link management flow

Inspect the creator-side link list.

Document:

* Table, cards, or list layout
* Search
* Filters
* Sorting
* Pagination
* Link status
* Link type
* Creation date
* View count
* Completion count
* Copy-link action
* Preview action
* Edit action
* Duplicate action
* Enable or disable action
* Archive action
* Delete action
* Confirmation dialogs
* Bulk actions when free
* Empty state
* No-results state
* Loading state
* Error state

For destructive actions, use only test links created during research.

---

## 12. Link editing flow

For every supported free link type:

1. Create a test link.
2. Open the edit page.
3. Change one field at a time.
4. Save.
5. Reopen the public page.
6. Verify the visible result.
7. Document whether changes apply immediately.

Test changes such as:

* Title
* Description
* Destination URL
* Action URL
* Action order
* Enabled state
* Link-in-bio item order
* Public slug when free
* Public image when free

Document unsaved-change handling and validation.

---

## 13. Analytics research

Research only analytics available on the free account.

Possible metrics to inspect:

* Total views
* Unique views
* Unlocks
* Completions
* Conversion rate
* Clicks
* Social action completion
* Email submissions
* Date range
* Referrer
* Country
* Device
* Browser
* Operating system

For every visible metric, record:

* Metric label
* Display format
* Time range
* Chart type
* Empty state
* Populated state
* Update timing
* Whether data appears real-time or delayed
* Filters
* Network request
* Observable response fields

Generate test traffic only through normal manual browser visits.

Do not perform automated high-volume traffic generation.

Do not include paid-only analytics in the rebuild specification.

---

## 14. UI and design-system analysis

Analyze only the visual system needed to rebuild the free product experience.

Document:

### Typography

* Font family
* Heading sizes
* Body sizes
* Label sizes
* Font weights
* Line heights
* Text colors

### Colors

* Primary color
* Secondary color
* Background colors
* Surface colors
* Border colors
* Success color
* Warning color
* Error color
* Disabled state color

### Layout

* Content width
* Sidebar width
* Header height
* Grid structure
* Spacing scale
* Responsive behavior
* Page padding
* Section spacing

### Components

* Buttons
* Inputs
* Selects
* Checkboxes
* Radio buttons
* Cards
* Tables
* Tabs
* Dropdowns
* Modals
* Confirmation dialogs
* Toasts
* Alerts
* Badges
* Tooltips
* Breadcrumbs
* Empty states
* Loading indicators
* Skeletons
* Pagination
* Mobile navigation

For every design observation, classify it as:

* Verified
* Measured
* Visually estimated
* Inferred
* Unknown

Do not copy the visual identity exactly.

Use the findings to propose a separate and original design system.

---

## 15. Responsive research

Test at minimum:

* 1440px desktop
* 1280px desktop
* 1024px tablet landscape
* 768px tablet
* 390px mobile
* 375px mobile

For major pages, document:

* Navigation changes
* Sidebar behavior
* Form stacking
* Card layout
* Table overflow
* Button width
* Modal sizing
* Link-in-bio appearance
* Public unlock-page appearance
* Fixed or sticky elements
* Horizontal overflow
* Hidden content
* Touch target sizes

---

## 16. Network observation

When the browser tool supports it, observe relevant requests for:

* Login
* Current user
* Link list
* Link creation
* Link update
* Link deletion
* Link preview
* Link analytics
* Public link loading
* Visitor action completion
* Email submission
* Link-in-bio loading

For every observed request, record only:

* HTTP method
* Path
* General request shape
* General response shape
* Status code
* When it occurs
* Which screen triggers it

Redact:

* Authorization headers
* Cookies
* Tokens
* Personal information
* Session IDs
* CSRF tokens
* Internal IDs that identify another user

Name the documentation file `OBSERVED_API.md`.

Do not present observed frontend endpoints as the definitive internal backend architecture.

---

## 17. Data-model inference

Infer only the minimum data model needed to rebuild the free-accessible behavior.

Possible entities may include:

* User
* Link
* Link type
* Link destination
* Link action
* Social platform
* Link visitor
* Link visit
* Link completion
* Email subscriber
* Link-in-bio page
* Link-in-bio item
* Analytics event

For every proposed entity, label it as:

* Observed directly
* Inferred from UI
* Inferred from network traffic
* Recommended for rebuild
* Unknown in the reference implementation

Do not claim knowledge of the reference website's real database.

Do not include:

* Subscription
* Plan
* Payment
* Invoice
* Checkout
* Billing profile
* Paid entitlement

---

## 18. Required evidence structure

Store research evidence under:

```text
evidence/
├── screenshots/
│   ├── public/
│   ├── authentication/
│   ├── dashboard/
│   ├── create-link/
│   ├── social-links/
│   ├── link-in-bio/
│   ├── visitor-flow/
│   ├── analytics/
│   ├── settings/
│   └── mobile/
├── snapshots/
│   ├── public/
│   ├── dashboard/
│   ├── create-link/
│   ├── visitor-flow/
│   └── mobile/
├── network/
│   ├── authentication/
│   ├── links/
│   ├── visitor-flow/
│   └── analytics/
└── notes/
```

Use descriptive filenames.

Example:

```text
evidence/screenshots/create-link/social-action-step-01.png
evidence/screenshots/create-link/social-action-validation-error.png
evidence/screenshots/visitor-flow/social-action-locked-mobile.png
evidence/network/links/create-social-link.json
```

Do not commit the authenticated browser profile.

Add browser profile directories to `.gitignore`.

---

## 19. Required documentation output

Create the following files:

```text
docs/
├── PROJECT_BLUEPRINT.md
├── PRODUCT_OVERVIEW.md
├── SITEMAP.md
├── PAGE_INVENTORY.md
├── LINK_TYPE_INVENTORY.md
├── CREATE_LINK_FLOWS.md
├── SOCIAL_ACTIONS.md
├── LINK_IN_BIO.md
├── VISITOR_UNLOCK_FLOW.md
├── LINK_MANAGEMENT.md
├── AUTHENTICATION.md
├── FREE_ANALYTICS.md
├── DESIGN_SYSTEM.md
├── RESPONSIVE_BEHAVIOR.md
├── OBSERVED_API.md
├── DATA_MODEL_INFERENCE.md
├── PROPOSED_ARCHITECTURE.md
├── REBUILD_PLAN.md
├── ACCEPTANCE_CRITERIA.md
└── RISKS_AND_UNKNOWNS.md
```

---

## 20. `PROJECT_BLUEPRINT.md`

This is the main entry point.

It must contain:

1. Product summary
2. Target users
3. Main use cases
4. Free feature inventory
5. Supported link types
6. Creator journey summary
7. Visitor journey summary
8. Main modules
9. Proposed architecture
10. Proposed data model
11. Design-system summary
12. Security requirements
13. Analytics requirements
14. Implementation order
15. Risks and unknowns
16. Links to all supporting documents

Do not include Pro-plan functionality.

---

## 21. Required diagrams

Use Mermaid where appropriate.

Generate:

* Public sitemap
* Authenticated dashboard sitemap
* Create-link flow
* Social-action configuration flow
* Link-in-bio creation flow
* Visitor unlock sequence
* Link edit flow
* Link lifecycle state diagram
* Analytics event flow
* Proposed module diagram
* Proposed database ER diagram

All diagrams must describe the free product scope only.

---

## 22. Proposed rebuild architecture

Prepare a rebuild proposal suitable for:

* Laravel
* MySQL
* Redis
* Laravel Queue
* Scheduled jobs
* Object storage when necessary
* Blade with Alpine.js, Vue, or React
* REST API when necessary
* Cloudflare for delivery and protection when appropriate

Recommended module boundaries:

* Authentication
* User Profile
* Link Management
* Link Types
* Social Actions
* Link-in-Bio
* Public Link Rendering
* Visitor Completion
* Email Capture
* Analytics
* Moderation
* Settings

Do not create these modules:

* Subscription
* Billing
* Payment
* Pricing
* Checkout
* Premium Entitlement

---

## 23. Security requirements for rebuild

Document recommendations for:

* URL validation
* Open-redirect prevention
* XSS prevention
* CSRF protection
* Rate limiting
* Bot and abuse mitigation
* Link ownership authorization
* Signed public actions
* Duplicate completion detection
* Analytics event deduplication
* Email validation
* Spam prevention
* File validation when uploads exist
* Domain blocking
* Malicious destination detection
* Link report system
* Audit logs
* Safe deletion
* Data retention

Do not attempt to test the reference website for vulnerabilities.

Security analysis must be defensive and based on normal product behavior.

---

## 24. Documentation quality rules

Every important finding must be classified as one of:

### Observed

Directly visible in the browser.

### Network-observed

Visible in a request or response captured by the browser.

### Inferred

Likely based on behavior but not directly proven.

### Recommended

A design decision proposed for the new implementation.

### Unknown

Could not be verified.

Never write an inference as a confirmed fact.

Include supporting evidence paths where possible.

Example:

```markdown
## Link title validation

Status: Observed

The title field displays an inline required-field error when submitted empty.

Evidence:

- `evidence/screenshots/create-link/title-required-error.png`
- `evidence/snapshots/create-link/title-required-error.json`
```

---

## 25. Research completion criteria

Research is complete only when:

* All public navigation items relevant to the product have been checked.
* All free dashboard menu items have been checked.
* Every free link type has been identified.
* Social-action link creation has been tested.
* Link-in-bio creation has been tested.
* A complete creator flow has been documented.
* A complete visitor unlock flow has been documented.
* Link editing has been tested.
* Link deletion or disabling has been tested using test data.
* Free analytics have been inspected.
* Desktop and mobile layouts have been inspected.
* Relevant screenshots have been stored.
* Relevant snapshots have been stored.
* Relevant network calls have been recorded where possible.
* All required Markdown files have been created.
* Every inferred behavior is labeled.
* Unknown behavior is listed.
* No secret or authentication data has been written into the repository.
* No Pro-plan functionality is included.

---

## 26. Final execution instruction

Start by reading this entire file.

Then:

1. Inspect the current workspace.
2. Confirm the browser tool is available.
3. Create the required evidence directories.
4. Explore public pages first.
5. Use the prepared test account for authenticated pages.
6. Research all free-accessible link creation and management flows.
7. Exclude every paid or Pro-plan function.
8. Produce the complete documentation set under `docs/`.
9. Do not implement application source code.
10. End with a summary of verified findings, inferred behavior, unknowns, and recommended next steps.
