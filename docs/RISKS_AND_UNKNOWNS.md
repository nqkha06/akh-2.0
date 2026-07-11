# Risks And Unknowns

## Research Blockers

Status: Unknown

- The in-app browser tool failed due an environment metadata error, so local Playwright was used instead.
- Social action selection in public `/create` could not be completed safely because visible demo text duplicated action labels and automation could not unambiguously select the menu item.
- Some creator controls required pointer/drag/drop or existing entities and were only inspected, not fully published.

Evidence:

- `evidence/screenshots/dashboard/dashboard-unauthenticated.png`
- `evidence/screenshots/social-links/public-create-action-menu.png`

## Product Unknowns

Status: Unknown

- Full edit/delete behavior for the created test link.
- Link-in-bio builder and public URL.
- Email capture visitor form and subscriber management.
- Social action verification method.
- Completion persistence mechanism.
- Free versus paid limits.
- File link publishing with a newly uploaded harmless file.
- Snippet entity creation and snippet-link publishing.

## Recommended Next Research Step

Status: Recommended

Continue with careful test-data cleanup and remaining flows: edit/delete the created URL test link, create a harmless uploaded file then publish/delete a file link, create or select a test snippet then publish/delete a snippet link, expand email capture with a test list, and capture all required responsive viewports.
