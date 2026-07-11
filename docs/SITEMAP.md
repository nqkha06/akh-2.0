# Sitemap

## Public Sitemap

Status: Observed

```mermaid
flowchart TD
  Home["/"]
  How["/how-it-works"]
  Create["/create"]
  Login["/login"]
  Register["/register"]
  Reset["/password-reset"]
  Contact["/contact"]
  Terms["/terms"]
  Privacy["/privacy"]
  Cookies["/cookies"]
  Invalid["/:slug invalid public link"]

  Home --> How
  Home --> Create
  Home --> Login
  Home --> Register
  Home --> Contact
  Home --> Terms
  Home --> Privacy
  Home --> Cookies
  Login --> Register
  Login --> Reset
  Register --> Login
  Invalid --> Create
```

Evidence:

- `evidence/notes/research-summary.json`
- `evidence/notes/public-homepage-desktop.json`
- `evidence/notes/authentication-login.json`
- `evidence/notes/interaction-create-public.json`

## Authenticated Dashboard Sitemap

Status: Observed

Authenticated navigation exposed these free-account routes. Upgrade prompts were visible but were not followed.

```mermaid
flowchart TD
  Dashboard["/dashboard -> /dashboard/links"]
  Links["/dashboard/links"]
  CreateAuth["/dashboard/links/create"]
  Short["/dashboard/links/short"]
  Bio["/dashboard/link-in-bio"]
  Email["/dashboard/email-lists"]
  Files["/dashboard/storage"]
  Settings["/dashboard/settings"]
  Analytics["/dashboard/analytics"]
  Audience["/dashboard/audience"]

  Dashboard --> Links
  Links --> CreateAuth
  Links --> Short
  Dashboard --> Bio
  Dashboard --> Email
  Dashboard --> Files
  Dashboard --> Settings
  Dashboard --> Analytics
  Dashboard --> Audience
```

Evidence:

- `evidence/screenshots/dashboard/authenticated-home.png`
- `evidence/notes/authenticated-run-summary.json`
