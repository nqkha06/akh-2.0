# Responsive Behavior

## Tested Viewports

Status: Observed

- 1440px desktop
- 390px mobile

Evidence:

- `evidence/screenshots/public/homepage-desktop.png`
- `evidence/screenshots/mobile/homepage-mobile-390.png`
- `evidence/screenshots/mobile/login-mobile-390.png`

## Homepage

Status: Observed

Desktop:

- Header navigation displays brand, How it works, Sign in, Sign up free.
- Hero and demo cards have roomy layout.
- After a full scroll pass, lazy/demo sections below the fold were captured, including analytics, email capture, link-in-bio, platform, and testimonial content.

Mobile:

- Header shows "Open main menu".
- Content stacks vertically.
- Primary CTAs remain visible.
- Social action demo cards fit the narrow viewport.

## Login

Status: Observed

Mobile login keeps OAuth buttons, email/password fields, forgot password, and submit button in one vertical column.

## Untested Required Viewports

Status: Unknown

The requested 1280, 1024, 768, and 375 widths were not separately captured because the authenticated workflow was blocked and browser setup time was spent on core evidence. They remain required for a final QA pass.
