# Link4Sub Public Renderer

Custom WordPress plugin that renders the current Link4Sub/STU public-link experience at:

```text
/l/{slug}
```

The plugin does not contain link business rules. It calls the existing Link4Sub public APIs from PHP:

- `POST /api/links/{slug}/visit`
- `POST /api/links/{slug}/visit/{visitToken}/complete`
- `GET /api/files/link/{slug}/download`
- `GET /api/files/link/{slug}/cover`
- `GET /api/files/link/{slug}/background`

The first two endpoints and their response fields are the endpoints already consumed by the Next.js public page. The media endpoints are narrow adapters for appearance media that was previously returned as an authenticated member preview URL.

## Local configuration

Set these constants in `wp-config.php`, or use the included Docker Compose file:

```php
define('LINK4SUB_API_BASE_URL', 'http://host.docker.internal:4000/api');
define('LINK4SUB_PUBLIC_API_BASE_URL', 'http://localhost:4000/api');
define('LINK4SUB_APP_BASE_URL', 'http://localhost:3000');
define('LINK4SUB_BRAND_NAME', 'Link4Sub');
```

`LINK4SUB_API_BASE_URL` is server-only. `LINK4SUB_PUBLIC_API_BASE_URL` is used only for public media/download URLs rendered into HTML. No API credential is sent to the browser. The public API currently requires no application token. Its one-time `visitToken` is kept in a WordPress transient and exchanged through a random, expiring `visit_ref`.

## Run locally

The repository contains the official WordPress 7.1 stable source in `wordpress/`.

```bash
docker compose -f docker-compose.wordpress.yml up -d wordpress
docker compose -f docker-compose.wordpress.yml --profile tools run --rm wpcli \
  core install --url=http://localhost:3100 --title=Link4Sub \
  --admin_user=link4sub-admin --admin_password='<local-password>' \
  --admin_email=dev@example.test --skip-email
docker compose -f docker-compose.wordpress.yml --profile tools run --rm wpcli \
  plugin activate link4sub
docker compose -f docker-compose.wordpress.yml --profile tools run --rm wpcli \
  rewrite structure '/%postname%/' --hard
```

WordPress defaults to port `3100`; the Link4Sub Next.js app remains on port `3000` and the API remains on port `4000`.

## Admin configuration

Open **WP Admin → Link4Sub** (or `/wp-admin/admin.php?page=link4sub-settings`). The plugin provides four tabs:

- **Cấu hình chung:** server-side API URL, public media URL, app URL, API timeout, brand name and dynamic route prefix.
- **Kiểu hiển thị:** chọn renderer STU gốc hoặc Safe Redirect qua bài viết WordPress ngẫu nhiên; cấu hình post pool, category, cache, cookie, delay và fullscreen/modal.
- **Banner:** content, image, two CTAs, four display styles, placement, dismiss behavior, mobile visibility, slug include/exclude targeting and start/end scheduling.
- **Appearance:** brand colors, light/dark backgrounds, card radius, content width, surface/background opacity, logo, default theme, font, header/footer visibility and compact actions.

Banner dismissal is stored per banner version in the visitor's browser. Changing banner configuration generates a new version automatically, so a revised campaign can be shown again. Settings are sanitized by WordPress before storage and take effect on the next public request.

### Safe Redirect mode

When **Bài viết ngẫu nhiên** is selected, `/l/{slug}` redirects to `/safe/?alias={slug}`. The safe entry selects a random published post from a cached ID pool, stores the alias and selected post ID in an HMAC-signed, HttpOnly, SameSite cookie, and returns a 302 to the clean post permalink. On that exact post, PHP fetches Link4Sub data server-to-server and JavaScript renders the STU overlay. The upstream `visitToken` remains in a WordPress transient and is never included in page HTML.

## Runtime states

- Active: full STU renderer with cover/background, actions, countdown, persisted progress, destination unlock, theme and share controls.
- Missing: HTTP 404 status page.
- Blocked/violated: HTTP 403 status page.
- Deleted/expired/inactive: HTTP 410 status page.
- Timeout, invalid JSON or upstream failure: HTTP 502 status page.
- Page initialization and action completion have explicit loading indicators.
